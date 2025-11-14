import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "../ChatMessage";
import { useChatContext } from "@/contexts/ChatContext";
import { Activity } from "lucide-react";

const FollowupsPage = () => {
  const { messages, searchTerm } = useChatContext();

  // For followups, we'll show messages that might need action
  // In a real app, this would filter for messages marked as needing follow-up
  const followups = messages.filter(msg => 
    msg.reactions && msg.reactions.length > 0 || msg.replies && msg.replies.length > 0
  );

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">FollowUps</h2>
            <p className="text-sm text-muted-foreground">
              Track items you need to follow up on
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-4 pb-4">
          {followups.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No follow-ups needed</p>
              <p className="text-sm">All items are up to date.</p>
            </div>
          ) : (
            <>
              {followups.map((message) => (
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

export default FollowupsPage;

