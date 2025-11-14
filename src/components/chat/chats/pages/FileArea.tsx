import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext } from "@/contexts/ChatContext";

const FileArea = () => {
  const { currentChannel } = useChatContext();

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Files</h2>
          <p className="text-muted-foreground">
            Files shared in {currentChannel?.name || 'this chat'} will appear here.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
};

export default FileArea;










