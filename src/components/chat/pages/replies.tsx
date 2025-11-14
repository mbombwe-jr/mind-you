import React, { useMemo } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "../ChatMessage";
import { useChatContext, Message } from "@/contexts/ChatContext";
import { Reply } from "lucide-react";

const RepliesPage = () => {
  const { messages, searchTerm } = useChatContext();

  // Filter messages that have replies or are replies themselves
  const replyMessages = useMemo(() => {
    const messagesWithReplies: Message[] = [];
    
    messages.forEach((message) => {
      // Include messages that have replies
      if (message.replies && message.replies.length > 0) {
        messagesWithReplies.push(message);
      }
      // Also include messages that are replies (have replyTo)
      if (message.replyTo) {
        // Find the parent message and include it
        const parentMessage = messages.find(m => m.id === message.replyTo);
        if (parentMessage && !messagesWithReplies.find(m => m.id === parentMessage.id)) {
          messagesWithReplies.push(parentMessage);
        }
      }
    });

    return messagesWithReplies;
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Reply className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Replies</h2>
            <p className="text-sm text-muted-foreground">
              See all messages where you've been mentioned or replied to
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-4 pb-4">
          {replyMessages.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Reply className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No replies yet</p>
              <p className="text-sm">Messages with replies will appear here.</p>
            </div>
          ) : (
            <>
              {replyMessages.map((message) => (
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

export default RepliesPage;

