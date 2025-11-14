import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Paperclip, 
  AtSign, 
  Hash, 
  Mic, 
  Send, 
  Bold,
  Italic,
  Link,
  Code,
  X,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { useState, useRef } from "react";
import { useChatContext } from "@/contexts/ChatContext";
import EmojiPicker from "./EmojiPicker";
import { toast } from "sonner";
import { invoke } from '@tauri-apps/api/core';

interface MessageInputProps {
  replyTo?: { id: string; author: string };
  onCancelReply?: () => void;
}

const MessageInput = ({ replyTo, onCancelReply }: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [messageType, setMessageType] = useState<'message' | 'post'>('message');
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addMessage, addReply, currentChannel, fetchConversations, setCurrentChannel } = useChatContext();

  const handleSend = async () => {
    if (!message.trim() && attachedFiles.length === 0) return;
    if (isSending) return;

    setIsSending(true);

    try {
      // Check if it's a direct message (Moodle) or channel (tabletop)
      if (currentChannel?.type === 'dm') {
        if (currentChannel.conversationId) {
          // Existing conversation - send via Moodle API
          await invoke('send_message', {
            conversationId: currentChannel.conversationId,
            messageText: message,
            textFormat: 1, // HTML format
          });
        } else if (currentChannel.userId) {
          // New conversation - send instant message to create conversation
          await invoke('send_instant_message', {
            to_user_id: currentChannel.userId,
            message_text: message,
          });

          // Refresh conversations to get the new conversation ID
          await fetchConversations();
          
          // Find the new conversation and update the channel
          const conversationsResponse = await invoke<any>('get_conversations');
          const conversations = conversationsResponse?.conversations || (Array.isArray(conversationsResponse) ? conversationsResponse : []);
          
          const newConversation = conversations.find((conv: any) => {
            const members = conv.members || [];
            return members.some((m: any) => 
              (m.id === currentChannel.userId || m.userid === currentChannel.userId) && !m.iscurrentuser
            );
          });

          if (newConversation) {
            // Update channel with conversation ID
            setCurrentChannel({
              ...currentChannel,
              id: `dm_${newConversation.id}`,
              conversationId: newConversation.id,
              userId: undefined, // Clear userId now that we have conversationId
            });
          }
        }

        // Add message to UI optimistically
        const messageData = {
          author: 'You',
          content: <div dangerouslySetInnerHTML={{ __html: message }} />,
          mediaUrls: attachedFiles.map(f => URL.createObjectURL(f)),
        };

        if (replyTo) {
          addReply(replyTo.id, messageData);
          toast.success('Reply sent!');
          onCancelReply?.();
        } else {
          addMessage(messageData);
          toast.success('Message sent!');
        }

        // Refresh conversation messages
        // The ChatContext will handle reloading when the channel changes
        // For now, we'll just add it optimistically
      } else {
        // Send via broadcast API for channel messages (node groups)
        if (currentChannel?.id.startsWith('group_')) {
          // Extract group name from channel ID (format: group_GroupName)
          const groupName = currentChannel.id.replace('group_', '');
          
          await invoke('send_channel_message', {
            groupName: groupName,
            message: message,
          });

          const messageData = {
            author: 'You',
            content: <div>{message}</div>,
            mediaUrls: attachedFiles.map(f => URL.createObjectURL(f)),
          };

          if (replyTo) {
            addReply(replyTo.id, messageData);
            toast.success('Reply sent!');
            onCancelReply?.();
          } else {
            addMessage(messageData);
            toast.success('Message sent!');
          }
        } else {
          // Fallback for other channel types
          const messageData = {
            author: 'You',
            content: <div>{message}</div>,
            mediaUrls: attachedFiles.map(f => URL.createObjectURL(f)),
          };

          if (replyTo) {
            addReply(replyTo.id, messageData);
            toast.success('Reply sent!');
            onCancelReply?.();
          } else {
            addMessage(messageData);
            toast.success('Message sent!');
          }
        }
      }

      setMessage("");
      setAttachedFiles([]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) attached`);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  return (
    <div className="bg-background p-4 w-full">
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 px-3 py-2 rounded">
          <span>Replying to <strong>{replyTo.author}</strong></span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-auto"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2 text-xs">
        <Button 
          variant={messageType === 'message' ? 'default' : 'ghost'}
          size="sm" 
          className="h-7 text-xs"
          onClick={() => setMessageType('message')}
        >
          Message
        </Button>
        <Button 
          variant={messageType === 'post' ? 'default' : 'ghost'}
          size="sm" 
          className="h-7 text-xs"
          onClick={() => setMessageType('post')}
        >
          Post
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring">
        <div className="flex items-center gap-1 px-2 py-1 border-b border-border">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Link className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Code className="h-3.5 w-3.5" />
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <input
              title="Attach files"
              placeholder="Attach files"
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.doc,.docx"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <AtSign className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Hash className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Mic className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-border">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-accent px-2 py-1 rounded text-xs">
                <ImageIcon className="h-3 w-3" />
                <span className="max-w-[100px] truncate">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <Textarea
            placeholder={`Write to ${currentChannel?.name || 'Chat'}`}
            className="min-h-[80px] border-0 resize-none focus-visible:ring-0 text-sm pr-12"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8"
            onClick={handleSend}
            disabled={(!message.trim() && attachedFiles.length === 0) || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
