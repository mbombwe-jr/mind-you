import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNetwork } from './NetworkContext';

export interface Message {
  id: string;
  author: string;
  time: string;
  content: React.ReactNode;
  reactions?: { emoji: string; count: number }[];
  replies?: Message[];
  replyTo?: string;
  mediaUrls?: string[];
  upvotes?: number;
  downvotes?: number;
  userVote?: 'up' | 'down' | null;
}

export interface Channel {
  id: string;
  name: string;
  icon?: string;
  unread?: number;
  type: 'channel' | 'dm';
  profileImageUrl?: string;
  isOnline?: boolean;
  conversationId?: number;
  userId?: number; // For temporary channels before conversation is created
  isMuted?: boolean;
}

interface ChatContextType {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'time'>) => void;
  addReply: (messageId: string, reply: Omit<Message, 'id' | 'time'>) => void;
  addReaction: (messageId: string, emoji: string) => void;
  upvoteMessage: (messageId: string) => void;
  downvoteMessage: (messageId: string) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  currentChannel: Channel | null;
  setCurrentChannel: (channel: Channel) => void;
  channels: Channel[];
  isLoadingMessages: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  toggleMute: (channelId: string) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  fetchConversations: () => Promise<void>;
  nodeGroups: { name: string; total: number; active: number }[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { interfaces } = useNetwork();
  const [currentView, setCurrentView] = useState('chat');
  const [currentTab, setCurrentTab] = useState('chatArea');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  // Static channels (can be kept or replaced with API data later)
  const staticChannels: Channel[] = [];

  const [directMessageChannels, setDirectMessageChannels] = useState<Channel[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Record<number, Message[]>>({});
  // Node groups for network sidebar integration
  const [nodeGroups, setNodeGroups] = useState<{ name: string; total: number; active: number }[]>([]);
  // Channel messages stored by channel ID (group name)
  const [channelMessages, setChannelMessages] = useState<Record<string, Message[]>>({});

  // Fetch conversations from Moodle
  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const response = await invoke<any>('get_conversations');
      
      // Moodle API returns { conversations: [...] } or just an array
      const conversations = response?.conversations || (Array.isArray(response) ? response : []);
      
      // Process conversations - filter for direct messages (type 1 = individual, type 3 = self)
      if (Array.isArray(conversations) && conversations.length > 0) {
        const dmChannels: Channel[] = conversations
          .filter((conv: any) => {
            // Filter for individual conversations (type 1) or self conversations (type 3) with members
            const convType = conv.type;
            // Include type 1 (individual) and type 3 (self) if it has members
            return (convType === 1 || (convType === 3 && conv.members && conv.members.length > 0));
          })
          .map((conv: any): Channel | null => {
            const members = conv.members || [];
            // For type 1, find the other user. For type 3, use the first member
            const otherMember = members.find((m: any) => !m.iscurrentuser) || members[0];
            
            if (!otherMember) {
              return null; // Skip if no member found
            }
            
            const name = otherMember.fullname || conv.name || 'Unknown User';
            // Handle null unreadcount (means 0 unread)
            const unreadCount = conv.unreadcount !== null && conv.unreadcount !== undefined 
              ? conv.unreadcount 
              : 0;
            const convId = conv.id;
            // Prefer small image, fallback to regular, then null
            const profileImageUrl = otherMember.profileimageurlsmall || otherMember.profileimageurl || null;
            const isOnline = otherMember.isonline === true;
            
            return {
              id: `dm_${convId}`,
              name: name.trim(),
              type: 'dm' as const,
              unread: unreadCount > 0 ? unreadCount : undefined,
              profileImageUrl: profileImageUrl || undefined,
              isOnline: isOnline,
              conversationId: convId,
            };
          })
          .filter((channel): channel is Channel => channel !== null); // Remove null entries
        
        setDirectMessageChannels(dmChannels);
      } else {
        setDirectMessageChannels([]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      // Keep empty array on error
      setDirectMessageChannels([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Update node groups from network context interfaces
  useEffect(() => {
    console.log("ChatContext: interfaces updated", interfaces?.length || 0, "interfaces");
    if (interfaces && interfaces.length > 0) {
      const map = new Map<string, { total: number; active: number }>();
      interfaces.forEach((it) => {
        const key = it.group_name || "Ungrouped";
        const entry = map.get(key) || { total: 0, active: 0 };
        entry.total += 1;
        if (it.has_udp_socket) entry.active += 1;
        map.set(key, entry);
      });
      const list = Array.from(map.entries()).map(([name, v]) => ({ name, total: v.total, active: v.active }));
      console.log("ChatContext: node groups calculated", list.length, "groups:", list);
      setNodeGroups(list);
    } else {
      console.log("ChatContext: no interfaces, clearing node groups");
      setNodeGroups([]);
    }
  }, [interfaces]);

  // Set default channel when node groups are loaded
  useEffect(() => {
    if (!currentChannel && nodeGroups.length > 0) {
      const firstGroup = nodeGroups[0];
      setCurrentChannel({
        id: `group_${firstGroup.name}`,
        name: firstGroup.name,
        icon: '#',
        type: 'channel',
      });
    }
  }, [nodeGroups, currentChannel]);

  // Mute state management
  const [mutedChannels, setMutedChannels] = useState<Set<string>>(new Set());

  const toggleMute = useCallback((channelId: string) => {
    setMutedChannels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(channelId)) {
        newSet.delete(channelId);
      } else {
        newSet.add(channelId);
      }
      return newSet;
    });
  }, []);

  // Convert node groups to channels
  const nodeGroupChannels: Channel[] = useMemo(() => {
    return nodeGroups.map(group => ({
      id: `group_${group.name}`,
      name: group.name,
      icon: '#',
      type: 'channel' as const,
      unread: undefined,
    }));
  }, [nodeGroups]);

  // Combine static channels, node group channels, and direct messages
  const channels: Channel[] = useMemo(() => {
    const allChannels = [...staticChannels, ...nodeGroupChannels, ...directMessageChannels];
    return allChannels.map(channel => ({
      ...channel,
      isMuted: mutedChannels.has(channel.id),
    }));
  }, [staticChannels, nodeGroupChannels, directMessageChannels, mutedChannels]);

  // Load conversation messages when a DM channel is selected
  const loadConversationMessages = useCallback(async (conversationId: number) => {
    // Check if we already have messages for this conversation
    if (conversationMessages[conversationId]) {
      return;
    }

    setIsLoadingMessages(true);
    try {
      const response = await invoke<any>('get_conversation_messages', {
        conversationId: conversationId,
        limitFrom: null,
        limitNum: null,
      });

      // Process messages from Moodle API
      // The API might return { messages: [...] } or just an array
      const messagesData = response?.messages || (Array.isArray(response) ? response : []);
      
      if (Array.isArray(messagesData) && messagesData.length > 0) {
        const processedMessages: Message[] = messagesData.map((msg: any) => {
          // Convert Moodle message format to our Message format
          const timeCreated = msg.timecreated || Date.now() / 1000;
          const date = new Date(timeCreated * 1000);
          const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          
          // Get user info - try different possible field names
          const authorName = msg.userfromfullname || 
                            msg.fullname || 
                            msg.userfrom?.fullname ||
                            `User ${msg.useridfrom || msg.userid || 'Unknown'}`;
          
          // Parse HTML content or use plain text
          const content = msg.text || msg.smallmessage || msg.message || '';
          
          return {
            id: `msg_${msg.id || msg.messageid || Date.now()}`,
            author: authorName,
            time: timeStr,
            content: <div dangerouslySetInnerHTML={{ __html: content }} />,
            replies: [],
          };
        });

        setConversationMessages(prev => ({
          ...prev,
          [conversationId]: processedMessages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch conversation messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [conversationMessages]);

  // Load channel messages from UDP API when a channel is selected
  const loadChannelMessages = useCallback(async (groupName: string, channelId: string) => {
    // Check if we already have messages for this channel
    if (channelMessages[channelId]) {
      return;
    }

    setIsLoadingMessages(true);
    try {
      const response = await invoke<any>('get_channel_messages', {
        groupName: groupName,
      });

      // The API returns an array of ChatMessage objects
      // Format: { author: string, text: string, timestamp: u64, group_name: string }
      const messagesData = Array.isArray(response) ? response : [];
      console.log("ChatContext: channel messages", messagesData);
      if (messagesData.length > 0) {
        const processedMessages: Message[] = messagesData.map((msg: any) => {
          // Convert timestamp from seconds to milliseconds
          const timeCreated = msg.timestamp || Date.now() / 1000;
          const date = new Date(timeCreated * 1000);
          const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          
          const authorName = msg.author || 'Unknown User';
          const content = msg.text || '';
          
          return {
            id: `channel_msg_${msg.timestamp}_${Date.now()}_${Math.random()}`,
            author: authorName,
            time: timeStr,
            content: <div>{content}</div>,
            replies: [],
          };
        });

        setChannelMessages(prev => ({
          ...prev,
          [channelId]: processedMessages,
        }));
      } else {
        // Set empty array if no messages
        setChannelMessages(prev => ({
          ...prev,
          [channelId]: [],
        }));
      }
    } catch (error) {
      console.error('Failed to fetch channel messages:', error);
      // Set empty array on error
      setChannelMessages(prev => ({
        ...prev,
        [channelId]: [],
      }));
    } finally {
      setIsLoadingMessages(false);
    }
  }, [channelMessages]);

  // Load messages when a channel is selected
  useEffect(() => {
    if (currentChannel?.type === 'dm' && currentChannel.conversationId) {
      loadConversationMessages(currentChannel.conversationId);
    } else if (currentChannel?.type === 'channel' && currentChannel.name) {
      // Load channel messages from UDP API
      loadChannelMessages(currentChannel.name, currentChannel.id);
    }
  }, [currentChannel, loadConversationMessages, loadChannelMessages]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      author: 'Isaac',
      time: '6:28 AM',
      content: (
        <div>
          <p className="mb-2">Great job on the first week of testing for Project Brain! Here are the key results:</p>
          <ul className="space-y-1 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Performance:</strong> The system is running at 95% efficiency, which is above our initial target.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">■</span>
              <span><strong>Bugs:</strong> We identified and resolved 6 minor bugs. No major issues were found.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">💬</span>
              <span><strong>User Feedback:</strong> Positive responses from 70% of the test users, highlighting ease of use and functionality.</span>
            </li>
          </ul>
        </div>
      ),
      reactions: [{ emoji: '👍', count: 2 }],
      replies: [],
      upvotes: 15,
      downvotes: 2,
      userVote: null,
    },
    {
      id: '2',
      author: 'Mark Sommerville',
      time: '6:41 AM',
      content: <div>Let's make <strong>detailed SOP for this project.</strong> Who can own this?</div>,
      replies: [],
      upvotes: 8,
      downvotes: 0,
      userVote: null,
    },
    {
      id: '3',
      author: 'Cass Chan',
      time: '1:19 PM',
      content: <div>Hey <span className="text-primary">@Brian Sherry</span> have you seen this project?</div>,
      replies: [],
      upvotes: 5,
      downvotes: 1,
      userVote: null,
    },
    {
      id: '4',
      author: 'Sarah Johnson',
      time: '2:30 PM',
      content: <div>Check out this amazing design mockup for the new feature! 🎨</div>,
      replies: [],
      upvotes: 12,
      downvotes: 0,
      userVote: null,
      mediaUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop'],
    },
  ]);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'time'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      replies: [],
    };
    
    // If it's a channel message, store it by channel ID
    if (currentChannel && currentChannel.type === 'channel') {
      setChannelMessages(prev => ({
        ...prev,
        [currentChannel.id]: [...(prev[currentChannel.id] || []), newMessage],
      }));
    }
    
    // Also update the current messages for immediate UI update
    setMessages(prev => [...prev, newMessage]);
  }, [currentChannel]);

  const addReply = useCallback((messageId: string, reply: Omit<Message, 'id' | 'time'>) => {
    const newReply: Message = {
      ...reply,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      replyTo: messageId,
    };
    
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          replies: [...(msg.replies || []), newReply],
        };
      }
      return msg;
    }));
  }, []);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          return {
            ...msg,
            reactions: msg.reactions?.map(r => 
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            ),
          };
        } else {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { emoji, count: 1 }],
          };
        }
      }
      return msg;
    }));
  }, []);

  const upvoteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const currentVote = msg.userVote;
        const currentUpvotes = msg.upvotes || 0;
        const currentDownvotes = msg.downvotes || 0;
        
        if (currentVote === 'up') {
          // Remove upvote
          return {
            ...msg,
            upvotes: Math.max(0, currentUpvotes - 1),
            userVote: null,
          };
        } else if (currentVote === 'down') {
          // Switch from downvote to upvote
          return {
            ...msg,
            upvotes: currentUpvotes + 1,
            downvotes: Math.max(0, currentDownvotes - 1),
            userVote: 'up',
          };
        } else {
          // Add upvote
          return {
            ...msg,
            upvotes: currentUpvotes + 1,
            userVote: 'up',
          };
        }
      }
      return msg;
    }));
  }, []);

  const downvoteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const currentVote = msg.userVote;
        const currentUpvotes = msg.upvotes || 0;
        const currentDownvotes = msg.downvotes || 0;
        
        if (currentVote === 'down') {
          // Remove downvote
          return {
            ...msg,
            downvotes: Math.max(0, currentDownvotes - 1),
            userVote: null,
          };
        } else if (currentVote === 'up') {
          // Switch from upvote to downvote
          return {
            ...msg,
            upvotes: Math.max(0, currentUpvotes - 1),
            downvotes: currentDownvotes + 1,
            userVote: 'down',
          };
        } else {
          // Add downvote
          return {
            ...msg,
            downvotes: currentDownvotes + 1,
            userVote: 'down',
          };
        }
      }
      return msg;
    }));
  }, []);

  // Update messages when currentChannel, conversationMessages, or channelMessages change
  useEffect(() => {
    if (currentChannel?.type === 'dm' && currentChannel.conversationId) {
      setMessages(conversationMessages[currentChannel.conversationId] || []);
    } else if (currentChannel?.type === 'channel') {
      // For channels (node groups), use channel messages
      setMessages(channelMessages[currentChannel.id] || []);
    } else {
      // For static channels, use default messages
      setMessages([
        {
          id: '1',
          author: 'Isaac',
          time: '6:28 AM',
          content: (
            <div>
              <p className="mb-2">Great job on the first week of testing for Project Brain! Here are the key results:</p>
              <ul className="space-y-1 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <span><strong>Performance:</strong> The system is running at 95% efficiency, which is above our initial target.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">■</span>
                  <span><strong>Bugs:</strong> We identified and resolved 6 minor bugs. No major issues were found.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">💬</span>
                  <span><strong>User Feedback:</strong> Positive responses from 70% of the test users, highlighting ease of use and functionality.</span>
                </li>
              </ul>
            </div>
          ),
          reactions: [{ emoji: '👍', count: 2 }],
          replies: [],
          upvotes: 15,
          downvotes: 2,
          userVote: null,
        },
        {
          id: '2',
          author: 'Mark Sommerville',
          time: '6:41 AM',
          content: <div>Let's make <strong>detailed SOP for this project.</strong> Who can own this?</div>,
          replies: [],
          upvotes: 8,
          downvotes: 0,
          userVote: null,
        },
        {
          id: '3',
          author: 'Cass Chan',
          time: '1:19 PM',
          content: <div>Hey <span className="text-primary">@Brian Sherry</span> have you seen this project?</div>,
          replies: [],
          upvotes: 5,
          downvotes: 1,
          userVote: null,
        },
        {
          id: '4',
          author: 'Sarah Johnson',
          time: '2:30 PM',
          content: <div>Check out this amazing design mockup for the new feature! 🎨</div>,
          replies: [],
          upvotes: 12,
          downvotes: 0,
          userVote: null,
          mediaUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop'],
        },
      ]);
    }
  }, [currentChannel, conversationMessages, channelMessages]);

  // Update currentChannel with mute state
  const currentChannelWithMute = useMemo(() => {
    if (!currentChannel) return null;
    return {
      ...currentChannel,
      isMuted: mutedChannels.has(currentChannel.id),
    };
  }, [currentChannel, mutedChannels]);

  const contextValue = useMemo(
    () => ({
      messages,
      addMessage,
      addReply,
      addReaction,
      upvoteMessage,
      downvoteMessage,
      currentView,
      setCurrentView,
      currentChannel: currentChannelWithMute,
      setCurrentChannel,
      channels,
      isLoadingMessages,
      searchTerm,
      setSearchTerm,
      toggleMute,
      currentTab,
      setCurrentTab,
      fetchConversations,
      nodeGroups,
    }),
    [messages, currentView, currentChannelWithMute, channels, addMessage, addReply, addReaction, upvoteMessage, downvoteMessage, isLoadingMessages, searchTerm, toggleMute, currentTab, fetchConversations, nodeGroups]
  );

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
