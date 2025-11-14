import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Image as ImageIcon } from "lucide-react";
import { Message, useChatContext } from "@/contexts/ChatContext";
import EmojiPicker from "./EmojiPicker";
import { useState } from "react";

interface ChatMessageProps {
  message: Message;
  onReply?: (messageId: string, author: string) => void;
  searchTerm?: string;
}

const ChatMessage = ({ message, onReply, searchTerm = '' }: ChatMessageProps) => {
  const { addReaction } = useChatContext();
  const [showReplies, setShowReplies] = useState(false);

  // Function to highlight search term in text
  const highlightText = (text: React.ReactNode, term: string): React.ReactNode => {
    if (!term || !text) return text;
    
    // If text is a React element, extract its content
    if (typeof text === 'object' && 'props' in text) {
      // Handle dangerouslySetInnerHTML content
      if (text.props && text.props.dangerouslySetInnerHTML) {
        const htmlContent = text.props.dangerouslySetInnerHTML.__html;
        if (typeof htmlContent === 'string') {
          const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escapedTerm})`, 'gi');
          const highlighted = htmlContent.replace(regex, '<mark class="bg-yellow-300">$1</mark>');
          return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
        }
      }
      // Handle regular React elements - try to extract text content
      if (text.props && text.props.children) {
        return highlightText(text.props.children, term);
      }
    }
    
    // If text is a string
    if (typeof text === 'string') {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      const parts = text.split(regex);
      return (
        <>
          {parts.map((part, index) => {
            // When using split with capturing group, matches appear at odd indices
            const isMatch = index % 2 === 1;
            return isMatch ? (
              <mark key={index} className="bg-yellow-300">{part}</mark>
            ) : (
              <span key={index}>{part}</span>
            );
          })}
        </>
      );
    }
    
    return text;
  };

  const handleEmojiSelect = (emoji: string) => {
    addReaction(message.id, emoji);
  };

  return (
    <div>
      <div className="group hover:bg-chat-hover px-6 py-3 transition-colors">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {message.author.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold text-sm text-foreground">{message.author}</span>
              <span className="text-xs text-muted-foreground">{message.time}</span>
            </div>
            <div className="text-sm text-foreground leading-relaxed">
              {highlightText(message.content, searchTerm)}
            </div>
            
            {message.mediaUrls && message.mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {message.mediaUrls.map((url, idx) => (
                  <div key={idx} className="relative w-40 h-40 rounded overflow-hidden border border-border">
                    <img src={url} alt="Uploaded media" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {message.reactions.map((reaction, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs bg-accent hover:bg-accent/80"
                    onClick={() => addReaction(message.id, reaction.emoji)}
                  >
                    {reaction.emoji} {reaction.count}
                  </Button>
                ))}
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            )}

            {!message.reactions?.length && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            )}

            {message.replies && message.replies.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 mt-2 text-xs text-primary hover:bg-accent"
                onClick={() => setShowReplies(!showReplies)}
              >
                <Avatar className="h-4 w-4 mr-1">
                  <AvatarFallback className="text-[8px] bg-primary/20">
                    {message.replies[0].author.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
              </Button>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => onReply?.(message.id, message.author)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {showReplies && message.replies && message.replies.length > 0 && (
        <div className="ml-16 border-l-2 border-border pl-4 space-y-2">
          {message.replies.map((reply) => (
            <div key={reply.id} className="py-2">
              <div className="flex gap-2">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {reply.author.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-xs text-foreground">{reply.author}</span>
                    <span className="text-xs text-muted-foreground">{reply.time}</span>
                  </div>
                  <div className="text-sm text-foreground">{highlightText(reply.content, searchTerm)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
