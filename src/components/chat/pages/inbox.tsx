import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "../ChatMessage";
import { useChatContext } from "@/contexts/ChatContext";
import { Inbox } from "lucide-react";

const InboxPage = () => {
  const { messages, searchTerm } = useChatContext();

  // Filter messages that could be considered "inbox" items
  // For now, we'll show all messages as inbox items
  // In a real app, this would filter for unread or important messages
  const inboxMessages = messages;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Inbox className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Inbox</h2>
            <p className="text-sm text-muted-foreground">
              View all your unread messages and notifications
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-4 pb-4">
          {inboxMessages.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Your inbox is empty</p>
              <p className="text-sm">All caught up! No unread messages.</p>
            </div>
          ) : (
            <>
              {inboxMessages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message}
                  onReply={() => {}}
                  searchTerm={searchTerm}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default InboxPage;

