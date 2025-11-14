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
  type: 'course' | 'dm';
  profileImageUrl?: string;
  isOnline?: boolean;
  conversationId?: number;
  userId?: number;
  isMuted?: boolean;
  courseId?: number; // Added for actual course channels
}

export interface Course {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  conversationId?: number;
  unread?: number;
  profileImageUrl?: string;
  isOnline?: boolean;
  isMuted?: boolean;
  courseId?: number; // Added for actual courses
  fullname?: string;
  shortname?: string;
  summary?: string;
  startdate?: number;
  enddate?: number;
}

export interface CourseDetail {
  id: number;
  fullname: string;
  shortname: string;
  summary?: string;
  startdate?: number;
  enddate?: number;
  enrolledusercount?: number;
  visible?: number;
  categoryid?: number;
}

export interface EnrolledUser {
  id: number;
  fullname: string;
  profileimageurl?: string;
  profileimageurlsmall?: string;
  email?: string;
  roles?: any[];
}

export interface CourseContent {
  files?: any[];
  assignments?: any[];
  quizzes?: any[];
  modules?: any[];
  sections?: any[]; // Course sections with modules
}

interface CourseContextType {
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'time'>) => void;
  addReply: (messageId: string, reply: Omit<Message, 'id' | 'time'>) => void;
  addReaction: (messageId: string, emoji: string) => void;
  upvoteMessage: (messageId: string) => void;
  downvoteMessage: (messageId: string) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  currentCourse: Course | null;
  setCurrentCourse: (course: Course) => void;
  courses: Course[];
  isLoadingMessages: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  toggleMute: (channelId: string) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  fetchConversations: () => Promise<void>;
  nodeGroups: { name: string; total: number; active: number }[];
  
  // New course-related functionality
  userCourses: CourseDetail[];
  allCourses: CourseDetail[];
  isLoadingCourses: boolean;
  fetchUserCourses: () => Promise<void>;
  fetchAllCourses: () => Promise<void>;
  fetchCourseContent: (courseId: number) => Promise<CourseContent | null>;
  fetchEnrolledUsers: (courseId: number) => Promise<EnrolledUser[]>;
  currentCourseContent: CourseContent | null;
  currentCourseUsers: EnrolledUser[];
  isLoadingCourseDetails: boolean;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider = ({ children }: { children: ReactNode }) => {
  const { interfaces } = useNetwork();
  const [currentView, setCurrentView] = useState('enrolledCourses');
  const [currentTab, setCurrentTab] = useState('chatArea');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

  // Existing state
  const [directMessageCourses, setDirectMessageCourses] = useState<Course[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Record<number, Message[]>>({});
  const [nodeGroups, setNodeGroups] = useState<{ name: string; total: number; active: number }[]>([]);
  const [courseMessages, setCourseMessages] = useState<Record<string, Message[]>>({});
  const [mutedCourses, setMutedCourses] = useState<Set<string>>(new Set());

  // New course-related state
  const [userCourses, setUserCourses] = useState<CourseDetail[]>([]);
  const [allCourses, setAllCourses] = useState<CourseDetail[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [currentCourseContent, setCurrentCourseContent] = useState<CourseContent | null>(null);
  const [currentCourseUsers, setCurrentCourseUsers] = useState<EnrolledUser[]>([]);
  const [isLoadingCourseDetails, setIsLoadingCourseDetails] = useState(false);

  // Fetch user's enrolled courses
  const fetchUserCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const response = await invoke<any>('get_user_courses');
      const coursesData = response?.courses || (Array.isArray(response) ? response : []);
      
      if (Array.isArray(coursesData)) {
        setUserCourses(coursesData);
      }
    } catch (error) {
      console.error('Failed to fetch user courses:', error);
      setUserCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  // Fetch all available courses
  const fetchAllCourses = useCallback(async () => {
    setIsLoadingCourses(true);
    try {
      const response = await invoke<any>('get_all_courses');
      const coursesData = Array.isArray(response) ? response : [];
      
      if (Array.isArray(coursesData)) {
        setAllCourses(coursesData);
      }
    } catch (error) {
      console.error('Failed to fetch all courses:', error);
      setAllCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  // Fetch course content (files, assignments, quizzes, sections)
  const fetchCourseContent = useCallback(async (courseId: number): Promise<CourseContent | null> => {
    try {
      // Fetch processed content (files, assignments, quizzes)
      const processedContent = await invoke<any>('get_course_files_assignments_quizzes', { courseId });
      
      // Try to fetch full course content with sections
      let sections: any[] = [];
      try {
        const fullContent = await invoke<any>('get_course_content_items', { courseId: Number(courseId) });
        // Extract sections from the response
        if (Array.isArray(fullContent)) {
          sections = fullContent;
        } else if (fullContent?.sections && Array.isArray(fullContent.sections)) {
          sections = fullContent.sections;
        } else if (fullContent?.content && Array.isArray(fullContent.content)) {
          sections = fullContent.content;
        }
      } catch (sectionError) {
        console.warn('Failed to fetch course sections:', sectionError);
        // Continue without sections
      }
      
      return {
        ...(processedContent || {}),
        sections: sections.length > 0 ? sections : undefined,
      };
    } catch (error) {
      console.error('Failed to fetch course content:', error);
      return null;
    }
  }, []);

  // Fetch enrolled users for a course
  const fetchEnrolledUsers = useCallback(async (courseId: number): Promise<EnrolledUser[]> => {
    try {
      const response = await invoke<any>('get_enrolled_users_for_course', { courseId });
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch enrolled users:', error);
      return [];
    }
  }, []);

  // Fetch conversations from Moodle
  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const response = await invoke<any>('get_conversations');
      const conversations = response?.conversations || (Array.isArray(response) ? response : []);
      
      if (Array.isArray(conversations) && conversations.length > 0) {
        const dmCourses: Course[] = conversations
          .filter((conv: any) => {
            const convType = conv.type;
            return (convType === 1 || (convType === 3 && conv.members && conv.members.length > 0));
          })
          .map((conv: any): Course | null => {
            const members = conv.members || [];
            const otherMember = members.find((m: any) => !m.iscurrentuser) || members[0];
            
            if (!otherMember) return null;
            
            const name = otherMember.fullname || conv.name || 'Unknown User';
            const unreadCount = conv.unreadcount !== null && conv.unreadcount !== undefined 
              ? conv.unreadcount 
              : 0;
            const convId = conv.id;
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
          .filter((course): course is Course => course !== null);
        
        setDirectMessageCourses(dmCourses);
      } else {
        setDirectMessageCourses([]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setDirectMessageCourses([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    fetchConversations();
    fetchUserCourses();
  }, [fetchConversations, fetchUserCourses]);

  // Update node groups from network context interfaces
  useEffect(() => {
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
      setNodeGroups(list);
    } else {
      setNodeGroups([]);
    }
  }, [interfaces]);

  // Convert user courses to channel format
  const moodleCourseCourses: Course[] = useMemo(() => {
    return userCourses.map(course => ({
      id: `course_${course.id}`,
      name: course.shortname || course.fullname,
      fullname: course.fullname,
      shortname: course.shortname,
      type: 'channel' as 'channel',
      courseId: course.id,
      unread: undefined,
      profileImageUrl: undefined,
      isOnline: undefined,
      isMuted: undefined,
      summary: course.summary,
      startdate: course.startdate,
      enddate: course.enddate,
    }));
  }, [userCourses]);

  // Convert node groups to channels
  const nodeGroupCourses: Course[] = useMemo(() => {
    return nodeGroups.map(group => ({
      id: `group_${group.name}`,
      name: group.name,
      type: 'channel' as 'channel',
      unread: undefined,
      profileImageUrl: undefined,
      isOnline: undefined,
      isMuted: undefined,
    }));
  }, [nodeGroups]);

  // Combine all courses
  const courses: Course[] = useMemo(() => {
    const allCourses = [...moodleCourseCourses, ...nodeGroupCourses, ...directMessageCourses];
    return allCourses.map(course => ({
      ...course,
      isMuted: mutedCourses.has(course.id),
    }));
  }, [moodleCourseCourses, nodeGroupCourses, directMessageCourses, mutedCourses]);

  // Don't auto-select first course - let user choose from sidebar
  // This was causing issues where clicking "Enrolled Courses" would show the first course

  // Load course details when a course is selected
  useEffect(() => {
    if (currentCourse?.courseId) {
      setIsLoadingCourseDetails(true);
      Promise.all([
        fetchCourseContent(currentCourse.courseId),
        fetchEnrolledUsers(currentCourse.courseId)
      ]).then(([content, users]) => {
        setCurrentCourseContent(content);
        setCurrentCourseUsers(users);
      }).finally(() => {
        setIsLoadingCourseDetails(false);
      });
    } else {
      setCurrentCourseContent(null);
      setCurrentCourseUsers([]);
    }
  }, [currentCourse?.courseId, fetchCourseContent, fetchEnrolledUsers]);

  // Load conversation messages when a DM channel is selected
  const loadConversationMessages = useCallback(async (conversationId: number) => {
    if (conversationMessages[conversationId]) return;

    setIsLoadingMessages(true);
    try {
      const response = await invoke<any>('get_conversation_messages', {
        conversationId: conversationId,
        limitFrom: null,
        limitNum: null,
      });

      const messagesData = response?.messages || (Array.isArray(response) ? response : []);
      
      if (Array.isArray(messagesData) && messagesData.length > 0) {
        const processedMessages: Message[] = messagesData.map((msg: any) => {
          const timeCreated = msg.timecreated || Date.now() / 1000;
          const date = new Date(timeCreated * 1000);
          const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          
          const authorName = msg.userfromfullname || 
                            msg.fullname || 
                            msg.userfrom?.fullname ||
                            `User ${msg.useridfrom || msg.userid || 'Unknown'}`;
          
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

  // Load channel messages from UDP API
  const loadCourseMessages = useCallback(async (groupName: string, courseId: string) => {
    if (courseMessages[courseId]) return;

    setIsLoadingMessages(true);
    try {
      const response = await invoke<any>('get_channel_messages', {
        groupName: groupName,
      });

      const messagesData = Array.isArray(response) ? response : [];
      
      if (messagesData.length > 0) {
        const processedMessages: Message[] = messagesData.map((msg: any) => {
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

        setCourseMessages(prev => ({
          ...prev,
          [courseId]: processedMessages,
        }));
      } else {
        setCourseMessages(prev => ({
          ...prev,
          [courseId]: [],
        }));
      }
    } catch (error) {
      console.error('Failed to fetch channel messages:', error);
      setCourseMessages(prev => ({
        ...prev,
        [courseId]: [],
      }));
    } finally {
      setIsLoadingMessages(false);
    }
  }, [courseMessages]);

  // Load messages when a channel is selected
  useEffect(() => {
    if (currentCourse?.type === 'dm' && currentCourse.conversationId) {
      loadConversationMessages(currentCourse.conversationId);
    } else if (currentCourse?.type === 'channel' && currentCourse.name && !currentCourse.courseId) {
      loadCourseMessages(currentCourse.name, currentCourse.id);
    }
  }, [currentCourse, loadConversationMessages, loadCourseMessages]);

  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'time'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      replies: [],
    };
    
    if (currentCourse && currentCourse.type === 'channel') {
      setCourseMessages(prev => ({
        ...prev,
        [currentCourse.id]: [...(prev[currentCourse.id] || []), newMessage],
      }));
    }
    
    setMessages(prev => [...prev, newMessage]);
  }, [currentCourse]);

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
          return {
            ...msg,
            upvotes: Math.max(0, currentUpvotes - 1),
            userVote: null,
          };
        } else if (currentVote === 'down') {
          return {
            ...msg,
            upvotes: currentUpvotes + 1,
            downvotes: Math.max(0, currentDownvotes - 1),
            userVote: 'up',
          };
        } else {
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
          return {
            ...msg,
            downvotes: Math.max(0, currentDownvotes - 1),
            userVote: null,
          };
        } else if (currentVote === 'up') {
          return {
            ...msg,
            upvotes: Math.max(0, currentUpvotes - 1),
            downvotes: currentDownvotes + 1,
            userVote: 'down',
          };
        } else {
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

  // Update messages when current course changes
  useEffect(() => {
    if (currentCourse?.type === 'dm' && currentCourse.conversationId) {
      setMessages(conversationMessages[currentCourse.conversationId] || []);
    } else if (currentCourse?.type === 'channel') {
      setMessages(courseMessages[currentCourse.id] || []);
    } else {
      setMessages([]);
    }
  }, [currentCourse, conversationMessages, courseMessages]);

  const toggleMute = useCallback((courseId: string) => {
    setMutedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  }, []);

  const currentCourseWithMute = useMemo(() => {
    if (!currentCourse) return null;
    return {
      ...currentCourse,
      isMuted: mutedCourses.has(currentCourse.id),
    };
  }, [currentCourse, mutedCourses]);

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
      currentCourse: currentCourseWithMute,
      setCurrentCourse,
      courses,
      isLoadingMessages,
      searchTerm,
      setSearchTerm,
      toggleMute,
      currentTab,
      setCurrentTab,
      fetchConversations,
      nodeGroups,
      userCourses,
      allCourses,
      isLoadingCourses,
      fetchUserCourses,
      fetchAllCourses,
      fetchCourseContent,
      fetchEnrolledUsers,
      currentCourseContent,
      currentCourseUsers,
      isLoadingCourseDetails,
    }),
    [
      messages,
      currentView,
      currentCourseWithMute,
      courses,
      addMessage,
      addReply,
      addReaction,
      upvoteMessage,
      downvoteMessage,
      isLoadingMessages,
      searchTerm,
      toggleMute,
      currentTab,
      fetchConversations,
      nodeGroups,
      userCourses,
      allCourses,
      isLoadingCourses,
      fetchUserCourses,
      fetchAllCourses,
      fetchCourseContent,
      fetchEnrolledUsers,
      currentCourseContent,
      currentCourseUsers,
      isLoadingCourseDetails,
    ]
  );

  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourseContext must be used within a CourseProvider');
  }
  return context;
};