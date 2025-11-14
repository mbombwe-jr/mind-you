import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChatContext } from "@/contexts/ChatContext";
import { useNetwork } from "@/contexts/NetworkContext";

const MembersArea = () => {
  const { currentChannel } = useChatContext();
  const { interfaces = [] } = useNetwork();
  const groupMembers = (currentChannel && currentChannel.name)
    ? interfaces.filter((node) => node.group_name === currentChannel.name)
    : [];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-white">
      <ScrollArea className="flex-1 w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Members</h2>
          {groupMembers.length === 0 && (
            <p className="text-muted-foreground">No members in this group.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {groupMembers.map((iface, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center w-full bg-white shadow-md rounded-xl px-6 py-6 min-h-[120px] justify-center"
              >
                <Avatar className="h-12 w-12 ring-1 ring-border/50 mb-2">
                  <AvatarFallback className="text-lg bg-primary/20 text-primary font-semibold">
                    {iface.node_name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="font-medium text-base text-gray-900 mb-2 text-center">
                  {iface.node_name}
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-xl font-semibold ${iface.has_udp_socket ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"}`}
                  style={{minWidth: 60, textAlign: 'center'}}>
                  {iface.has_udp_socket ? "Online" : "Offline"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default MembersArea;










