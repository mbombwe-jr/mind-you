import { Network, Server, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNetwork } from "@/contexts/NetworkContext";
import { useMemo } from "react";
import SidebarHeader from "@/components/SidebarHeader";

interface NetworkSidebarProps {
  selectedGroup: string | null;
  onGroupSelect: (groupName: string | null) => void;
}

const NetworkSidebar = ({ selectedGroup, onGroupSelect }: NetworkSidebarProps) => {
  const { interfaces } = useNetwork();

  const groups = useMemo(() => {
    const map = new Map<string, { total: number; active: number; members: typeof interfaces }>();
    interfaces.forEach((it) => {
      const key = it.group_name || "Ungrouped";
      const entry = map.get(key) || { total: 0, active: 0, members: [] as any };
      entry.total += 1;
      if (it.has_udp_socket) entry.active += 1;
      (entry.members as any).push(it);
      map.set(key, entry);
    });
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
  }, [interfaces]);

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden flex-shrink-0 max-md:w-full">
      {/* SidebarHeader */}
      <SidebarHeader
        title="Network"
        Icon={Network}
        className="bg-sidebar border-sidebar-border"
        colorMode="default"
      />

      <ScrollArea className="flex-1 min-h-0 w-full">
        <div className="p-2 w-full">
          {/* Server Groups */}
          <div className="mb-4">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between uppercase tracking-wider">
              <span>Server Groups</span>
              <ChevronDown className="h-3 w-3" />
            </div>
            <div className="space-y-0.5">
              {groups.length > 0 ? (
                groups.map((g) => (
                  <Button
                    key={g.name}
                    variant="ghost"
                    className={`w-full justify-start h-9 px-2 text-sm hover:bg-chat-hover rounded-md ${
                      selectedGroup === g.name
                        ? 'bg-chat-active text-primary font-semibold'
                        : 'font-normal text-sidebar-foreground'
                    }`}
                    onClick={() => onGroupSelect(g.name)}
                  >
                    <Server className="h-4 w-4 mr-1.5 flex-shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-left truncate">{g.name}</span>
                    <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium min-w-[2rem] text-center">
                      {g.active}/{g.total}
                    </span>
                  </Button>
                ))
              ) : (
                <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                  No groups
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default NetworkSidebar;

