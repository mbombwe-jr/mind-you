import React, { useState } from 'react';
import { Message, useChatContext } from '@/contexts/ChatContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import MessageInput from './MessageInput';

interface PostCardProps {
  post: Message;
}

const PostCard = ({ post }: PostCardProps) => {
  const { upvoteMessage, downvoteMessage, addReply } = useChatContext();
  const [showReplyInput, setShowReplyInput] = useState(false);
  
  const upvotes = post.upvotes || 0;
  const downvotes = post.downvotes || 0;
  const netScore = upvotes - downvotes;
  const commentCount = post.replies?.length || 0;
  const userVote = post.userVote;

  const handleUpvote = () => {
    upvoteMessage(post.id);
  };

  const handleDownvote = () => {
    downvoteMessage(post.id);
  };

  const handleReply = () => {
    setShowReplyInput(!showReplyInput);
  };


  return (
    <div className="flex gap-3 p-4 sm:p-6 bg-background border-b border-border hover:bg-accent/30 transition-colors">
      {/* Vote Section */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded hover:bg-orange-100 dark:hover:bg-orange-900/20",
            userVote === 'up' && "text-orange-500 bg-orange-100 dark:bg-orange-900/30"
          )}
          onClick={handleUpvote}
        >
          <ChevronUp className={cn(
            "h-5 w-5",
            userVote === 'up' && "fill-orange-500"
          )} />
        </Button>
        
        <div className={cn(
          "text-sm font-semibold min-w-[2rem] text-center",
          netScore > 0 && "text-orange-500",
          netScore < 0 && "text-blue-500",
          netScore === 0 && "text-muted-foreground"
        )}>
          {netScore > 0 ? '+' : ''}{netScore}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded hover:bg-blue-100 dark:hover:bg-blue-900/20",
            userVote === 'down' && "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
          )}
          onClick={handleDownvote}
        >
          <ChevronDown className={cn(
            "h-5 w-5",
            userVote === 'down' && "fill-blue-500"
          )} />
        </Button>
      </div>

      {/* Post Content */}
      <div className="flex-1 min-w-0">
        {/* Author and Time */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
              {post.author.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">{post.author}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{post.time}</span>
        </div>

        {/* Post Title/Content */}
        <div className="mb-3 text-foreground">
          {post.content}
        </div>

        {/* Media/Images */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="mb-3 space-y-2">
            {post.mediaUrls.map((url, index) => {
              // Check if it's an image by extension or if it's a data URL
              const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url) || 
                             url.startsWith('data:image/') ||
                             url.startsWith('blob:');
              
              if (isImage) {
                return (
                  <div 
                    key={index} 
                    className="rounded-lg overflow-hidden border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="relative">
                      <img
                        src={url}
                        alt={`Post image ${index + 1}`}
                        className="w-full h-auto max-h-[600px] object-contain cursor-zoom-in transition-transform group-hover:scale-[1.01]"
                        onClick={() => {
                          // Open image in new window/tab for full view
                          const newWindow = window.open();
                          if (newWindow) {
                            newWindow.document.write(`
                              <html>
                                <head><title>Image</title></head>
                                <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
                                  <img src="${url}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                                </body>
                              </html>
                            `);
                          }
                        }}
                        onError={(e) => {
                          // Hide broken images
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.style.display = 'none';
                          }
                        }}
                        loading="lazy"
                      />
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={handleReply}
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </Button>
          
          {/* Vote counts display */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn(userVote === 'up' && "text-orange-500 font-medium")}>
              ↑ {upvotes}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className={cn(userVote === 'down' && "text-blue-500 font-medium")}>
              ↓ {downvotes}
            </span>
          </div>
        </div>

        {/* Replies Section */}
        {post.replies && post.replies.length > 0 && (
          <div className="mt-4 ml-4 border-l-2 border-border pl-4 space-y-3">
            {post.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2">
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                    {reply.author.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{reply.author}</span>
                    <span className="text-xs text-muted-foreground">{reply.time}</span>
                  </div>
                  <div className="text-sm text-foreground">{reply.content}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-4 ml-4 border-l-2 border-border pl-4 pb-2">
            <MessageInput
              replyTo={{ id: post.id, author: post.author }}
              onCancelReply={() => setShowReplyInput(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;

