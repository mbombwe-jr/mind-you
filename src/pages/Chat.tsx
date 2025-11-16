import React, { useState } from 'react';
import { ChatProvider, useChatContext } from '@/contexts/ChatContext';
import ChatArea from '@/components/chat/chats/pages/ChatArea';
import ChannelArea from '@/components/chat/channels/pages/ChannelArea';
import ChatSidebar from '@/components/chat/ChatSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import InboxPage from '@/components/chat/pages/inbox';
import RepliesPage from '@/components/chat/pages/replies';
import PostsPage from '@/components/chat/pages/posts';
import ContactsPage from '@/components/chat/pages/contacts';
import DraftsPage from '@/components/chat/pages/drafts';

function ChatContent() {
  const { currentChannel, currentView } = useChatContext();
  const isMobile =  useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Show ChannelArea for channels, ChatArea for direct messages
  const isDirectMessage = currentChannel?.type === 'dm';
  
  // Render the appropriate page based on currentView
  const renderContent = () => {
    // If viewing a special page (inbox, replies, etc.), show that page
    if (currentView === 'inbox') {
      return <InboxPage />;
    }
    if (currentView === 'replies') {
      return <RepliesPage />;
    }
    if (currentView === 'posts') {
      return <PostsPage />;
    }
    if (currentView === 'contacts') {
      return <ContactsPage />;
    }
    if (currentView === 'drafts') {
      return <DraftsPage />;
    }
    
    // Otherwise, show chat/channel area
    return isDirectMessage ? <ChatArea /> : <ChannelArea />;
  };
  
  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      {/* Mobile sidebar toggle button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 z-30 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar - hidden on mobile, shown in sheet */}
      {isMobile ? (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0 sm:w-80">
            <ChatSidebar onChannelSelect={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      ) : (
        <div className="hidden md:block">
          <ChatSidebar />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* ChatHeader will now be rendered within ChatArea or ChannelArea only when needed */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

function Chat() {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
}

export default Chat;
