import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const DraftsPage = () => {
  // In a real app, this would load drafts from storage/API
  const drafts: Array<{ id: string; content: string; timestamp: string; channel?: string }> = [];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Send className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Drafts & Sent</h2>
            <p className="text-sm text-muted-foreground">
              View your draft messages and sent items
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-4 pb-4">
          {drafts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No drafts or sent items</p>
              <p className="text-sm mb-4">Your saved drafts and sent messages will appear here.</p>
              <Button variant="outline" size="sm">
                Create New Draft
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium">
                      {draft.channel || 'Draft'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {draft.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{draft.content}</p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DraftsPage;

