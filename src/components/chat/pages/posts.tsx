import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import PostCard from "../PostCard";
import { useChatContext } from "@/contexts/ChatContext";
import { FileText } from "lucide-react";

const PostsPage = () => {
  const { messages } = useChatContext();

  // For posts, we'll show all messages (in a real app, this would filter for announcements/posts)
  // Sort by net score (upvotes - downvotes) descending
  const posts = [...messages].sort((a, b) => {
    const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
    const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
    return scoreB - scoreA;
  });

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-background">
      <div className="sticky top-0 z-20 bg-background border-b border-border px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Posts</h2>
            <p className="text-sm text-muted-foreground">
              Browse all posts and announcements
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full [&>[data-radix-scroll-area-viewport]]:scroll-smooth">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 pt-4">
          {posts.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No posts yet</p>
              <p className="text-sm">Posts and announcements will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PostsPage;

