import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, FileText, Info, ChevronDown, Search, Phone, Video, Star, Ban, X, Bell } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatContext } from "@/contexts/ChatContext";
import { useToast } from "@/hooks/use-toast";
import CallContent from "./pages/CallContent";
import { useState } from "react";

const ChatHeader = () => {
  const { currentChannel, searchTerm, setSearchTerm, toggleMute, currentTab, setCurrentTab } = useChatContext();
  const { toast } = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const tabs = [
    { id: 'chatArea', label: 'Chat', icon: MessageSquare },
    { id: 'fileArea', label: 'Files', icon: FileText },
    { id: 'infoArea', label: 'Info', icon: Info },
    { id: 'callArea', label: 'Call', icon: Video },
  ];

  return (
    <div className="border-b border-border bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2">
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    {currentChannel?.profileImageUrl ? (
                      <AvatarImage src={currentChannel.profileImageUrl} alt={currentChannel.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                      {currentChannel?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {currentChannel?.isOnline && (
                    <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 border-2 border-background rounded-full"></span>
                  )}
                </div>
                {currentChannel?.name || 'Chat'}
                {currentChannel?.isOnline && (
                  <span className="text-xs text-green-500 font-medium">Online</span>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => console.log('Add to favorites')}>
                <Star className="mr-2 h-4 w-4" />
                Add to favorites
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => console.log('Block user')}
                className="text-destructive focus:text-destructive"
              >
                <Ban className="mr-2 h-4 w-4" />
                Block
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8 h-8 w-64"
                  autoFocus
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchTerm('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => {
                  if (currentChannel) {
                    toggleMute(currentChannel.id);
                    toast({
                      title: currentChannel.isMuted ? "Unmuted" : "Muted",
                      description: currentChannel.isMuted 
                        ? `You will receive notifications from ${currentChannel.name}` 
                        : `You won't receive notifications from ${currentChannel.name}`,
                    });
                  }
                }}
              >
                <Bell className={`h-4 w-4 ${currentChannel?.isMuted ? 'text-red-500' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => {
                  toast({
                    title: "Feature Coming Soon",
                    description: "Voice call feature will be available in a future update.",
                  });
                }}
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => {
                  toast({
                    title: "Feature Coming Soon",
                    description: "Video call feature will be available in a future update.",
                  });
                }}
              >
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={`h-10 gap-2 border-b-2 rounded-none hover:bg-transparent ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground'
              }`}
              onClick={() => setCurrentTab(tab.id)}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>
      {/* Show CallContent only if currentTab is callArea */}
      {currentTab === 'callArea' && (
        <div className="w-full h-[50vh] bg-neutral-900 rounded-b-lg flex flex-col items-center justify-center">
          <CallContent isGroup={false} />
        </div>
      )}
    </div>
  );
};

export default ChatHeader;

