import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "../../ChatMessage";
import MessageInput from "../../MessageInput";
import { useChatContext } from "@/contexts/ChatContext";
import { useState } from "react";
import ChatHeader from "../ChatHeader";
import FileArea from "./FileArea";
import InfoArea from "./InfoArea";

const ChatArea = () => {
  const { messages, currentView, currentChannel, isLoadingMessages, searchTerm, currentTab } = useChatContext();
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | undefined>();

  const handleReply = (messageId: string, author: string) => {
    setReplyTo({ id: messageId, author });
  };

  const handleCancelReply = () => {
    setReplyTo(undefined);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'chatArea':
        return (
          <>
            {isLoadingMessages ? (
              <div className="p-6 text-center text-muted-foreground">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message}
                    onReply={handleReply}
                    searchTerm={searchTerm}
                  />
                ))}
              </>
            )}
          </>
        );
      case 'fileArea':
        return <FileArea />;
      case 'infoArea':
        return <InfoArea />;
      default:
        return null;
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return (
          <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
            <div className="sticky top-0 z-20 bg-background shadow-sm">
              <ChatHeader />
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
              <ScrollArea className="flex-1 w-full">
                <div className="p-4 pb-4">
                  {renderTabContent()}
                </div>
              </ScrollArea>
              {currentTab === 'chatArea' && (
                <div className="sticky bottom-0 z-30 bg-background border-t border-border mb-12">
                  <MessageInput replyTo={replyTo} onCancelReply={handleCancelReply} />
                </div>
              )}
            </div>
          </div>
        );

      case 'inbox':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Inbox</h2>
            <p className="text-muted-foreground">View all your unread messages and notifications here.</p>
          </div>
        );

      case 'replies':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Replies</h2>
            <p className="text-muted-foreground">See all messages where you've been mentioned or replied to.</p>
          </div>
        );

      case 'posts':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Posts</h2>
            <p className="text-muted-foreground">Browse all posts and announcements.</p>
          </div>
        );

      case 'followups':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">FollowUps</h2>
            <p className="text-muted-foreground">Track items you need to follow up on.</p>
          </div>
        );

      case 'activity':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Activity</h2>
            <p className="text-muted-foreground">See recent activity across all channels.</p>
          </div>
        );

      case 'drafts':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Drafts & Sent</h2>
            <p className="text-muted-foreground">View your draft messages and sent items.</p>
          </div>
        );

      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">{currentView}</h2>
            <p className="text-muted-foreground">This view is coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      {renderView()}
    </div>
  );
};

export default ChatArea;
