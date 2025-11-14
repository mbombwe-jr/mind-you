import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext } from "@/contexts/ChatContext";

const InfoArea = () => {
  const { currentChannel } = useChatContext();

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 w-full">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{currentChannel?.name || 'Channel'}</h2>
            <p className="text-sm text-muted-foreground mt-1">Channel information</p>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground">
                Channel details and settings
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default InfoArea;




















