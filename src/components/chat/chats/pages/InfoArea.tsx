import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useChatContext } from "@/contexts/ChatContext";

const InfoArea = () => {
  const { currentChannel } = useChatContext();

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <ScrollArea className="flex-1 w-full">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              {currentChannel?.profileImageUrl ? (
                <AvatarImage src={currentChannel.profileImageUrl} alt={currentChannel.name} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {currentChannel?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{currentChannel?.name || 'Chat'}</h2>
              {currentChannel?.isOnline && (
                <p className="text-sm text-green-500">Online</p>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground">
                {currentChannel?.type === 'dm' 
                  ? 'Direct message conversation'
                  : 'Channel information'}
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default InfoArea;




















