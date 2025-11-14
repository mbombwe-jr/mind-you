import { Plus, MessageSquare, Inbox, Reply, FileText, Activity, Send, ChevronDown, VolumeX, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext } from "@/contexts/ChatContext";
import { useState, useMemo } from "react";
import SidebarHeader from "@/components/SidebarHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useNetwork } from '@/contexts/NetworkContext';

interface ChatSidebarProps {
  onChannelSelect?: () => void;
}

const ChatSidebar = ({ onChannelSelect }: ChatSidebarProps) => {
  const { currentView, setCurrentView, currentChannel, setCurrentChannel, channels, setCurrentTab } = useChatContext();
  const { interfaces = [] } = useNetwork();
  const [membersOpen, setMembersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  // Filter channels and DMs based on search query
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) {
      return channels;
    }
    const query = searchQuery.toLowerCase();
    return channels.filter(channel => 
      channel.name.toLowerCase().includes(query)
    );
  }, [channels, searchQuery]);

  const channelList = filteredChannels.filter(c => c.type === 'channel');
  const dmList = filteredChannels.filter(c => c.type === 'dm');
  // Members for selected group
  const groupMembers = (currentChannel && currentChannel.name)
    ? interfaces.filter((node) => node.group_name === currentChannel.name)
    : [];

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden flex-shrink-0 max-md:w-full">
      {/* SidebarHeader */}
      <SidebarHeader
        title="Chats"
        Icon={MessageSquare}
        className="bg-sidebar border-sidebar-border"
        colorMode="default"
        action={
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-sidebar-hover">
            <Plus className="h-4 w-4" />
          </Button>
        }
      />

      {/* Navigation */}
      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className="p-2 w-full">
          {/* Main Navigation */}
          <div className="space-y-0.5 mb-4">
            {[
              /*
              { id: 'inbox', label: 'Home', icon: Inbox },
              { id: 'replies', label: 'Replies', icon: Reply },
              { id: 'posts', label: 'Posts', icon: FileText },
              { id: 'contacts', label: 'Contacts', icon: Activity },
              { id: 'drafts', label: 'Drafts & Sent', icon: Send }

              */

              { id: 'posts', label: 'Posts', icon: FileText },
              { id: 'contacts', label: 'Contacts', icon: Activity },
            ].map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start h-9 px-2 text-sm hover:bg-chat-hover rounded-md ${
                  currentView === item.id ? 'bg-chat-active text-primary font-semibold' : 'font-normal'
                }`}
                onClick={() => setCurrentView(item.id)}
              >
                <item.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
              </Button>
            ))}
          </div>
          {/* MEMBERS BUTTON (above DMs) - filter for current group */}
          <div className="mb-2">
            <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{currentChannel?.name} Members ({groupMembers.length})</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {groupMembers.length === 0 && <div className="text-center text-xs text-muted-foreground py-6">No members in this group.</div>}
                  {groupMembers.map((iface, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{iface.node_name}</div>
                        <div className="text-xs text-gray-500">{iface.addr}{iface.cidr ? ' / ' + iface.cidr : ''}</div>
                      </div>
                      <span className={`ml-3 text-xs px-2 py-0.5 rounded ${iface.has_udp_socket ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>{iface.has_udp_socket ? 'online' : 'offline'}</span>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
                {/* Channels section (Node Groups as Channels) */}
      <div className="mb-4">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between uppercase tracking-wider">
          <span>Channels</span>
          <ChevronDown className="h-3 w-3" />
        </div>
        <div className="space-y-0.5">
          {channelList.length > 0 ? (
            channelList.map((channel) => (
              <Button
                key={channel.id}
                variant="ghost"
                className={`w-full justify-start h-9 px-2 text-sm hover:bg-chat-hover rounded-md ${
                  currentChannel?.id === channel.id 
                    ? 'bg-chat-active text-primary font-semibold' 
                    : 'font-normal text-sidebar-foreground'
                }`}
                onClick={() => {
                  setCurrentChannel(channel);
                  setCurrentView('chat');
                  setCurrentTab('chatArea');
                  onChannelSelect?.();
                }}
              >
                <Hash className="h-4 w-4 mr-1.5 flex-shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left truncate">{channel.name}</span>
              </Button>
            ))
          ) : (
            <div className="px-2 py-2 text-xs text-muted-foreground text-center">
              No channels
            </div>
          )}
        </div>
      </div>
          {/* Direct Messages */}
          <div className="pb-16">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between uppercase tracking-wider">
              <span>Direct Messages</span>
              <ChevronDown className="h-3 w-3" />
            </div>
            <div className="space-y-0.5">
              {dmList.length > 0 ? (
                dmList.map((dm) => (
                  <Button
                    key={dm.id}
                    variant="ghost"
                    className={`w-full justify-start h-9 px-2 text-sm hover:bg-chat-hover rounded-md ${
                      currentChannel?.id === dm.id 
                        ? 'bg-chat-active text-primary font-semibold' 
                        : 'font-normal text-sidebar-foreground'
                    }`}
                    onClick={() => {
                      setCurrentChannel(dm);
                      setCurrentView('chat');
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-5 w-5 ring-1 ring-border/50">
                          {dm.profileImageUrl && (
                            <AvatarImage 
                              src={dm.profileImageUrl} 
                              alt={dm.name}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-medium">
                            {dm.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online status indicator */}
                        <span 
                          className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-sidebar ${
                            dm.isOnline 
                              ? "bg-green-500" 
                              : "bg-gray-400"
                          }`}
                          title={dm.isOnline ? "Online" : "Offline"}
                        />
                      </div>
                      <span className="truncate flex-1 min-w-0 text-sm text-left">{dm.name}</span>
                      <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                        {dm.isMuted && (
                          <VolumeX className="h-3 w-3 text-muted-foreground" />
                        )}
                        {dm.unread && dm.unread > 0 && (
                          <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium min-w-[1.25rem] text-center">
                            {dm.unread > 99 ? '99+' : dm.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                  {searchQuery ? 'No direct messages found' : 'No direct messages'}
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
