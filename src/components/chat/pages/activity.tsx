import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "../ChatMessage";
import { useChatContext } from "@/contexts/ChatContext";
import { Activity } from "lucide-react";

const ActivityPage = () => {
  const { messages, searchTerm } = useChatContext();

  // Show all messages as activity (in a real app, this might include other activity types)
  const activity = messages;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Activity</h2>
            <p className="text-sm text-muted-foreground">
              See recent activity across all channels
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-4 pb-4">
          {activity.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No recent activity</p>
              <p className="text-sm">Activity will appear here as it happens.</p>
            </div>
          ) : (
            <>
              {activity.map((message) => (
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

export default ActivityPage;

