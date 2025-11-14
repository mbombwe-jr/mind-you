import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNetwork } from "@/contexts/NetworkContext";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import DataEditor, { GridCellKind, GridColumn, Item, GridCell, GridColumnIcon } from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { Link as LinkIcon, Users } from "lucide-react";

type NodeMapEntry = {
  node: {
    name: string;
    virtual_addr: string;
    lan_udp_addr: string;
    wan_udp_addr: string;
    allowed_ips?: string[];
    register_time?: number;
    register_nonce?: number; // treat this as a PIN-ish identifier
  };
  udp_status?: any;
  hc?: {
    elapsed?: { secs: number; nanos: number };
    send_count?: number;
    packet_continuous_loss_count?: number;
    packet_continuous_recv_count?: number;
    packet_loss_count?: number;
  };
};

export default function NetworkInfo({ filterGroup }: { filterGroup?: string }) {
  const { interfaces, loading, error, refresh } = useNetwork();
  const [selectedInterface, setSelectedInterface] = useState<number | null>(null);

  const rows = useMemo(
    () => (filterGroup ? interfaces.filter((i) => (i.group_name || "Ungrouped") === filterGroup) : interfaces),
    [interfaces, filterGroup]
  );

  const elapsedToMs = (e?: { secs?: number; nanos?: number }) => {
    if (!e) return null;
    const secs = e.secs ?? 0;
    const nanos = e.nanos ?? 0;
    const ms = secs * 1000 + Math.round(nanos / 1_000_000);
    return ms;
  };

  // Auto-refresh ping/health every 2 seconds
  useEffect(() => {
    const id = setInterval(() => {
      refresh();
    }, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  // Network columns with icons and header theming
  const networkColumns: GridColumn[] = [
    { title: 'Node', id: 'node', width: 180, icon: GridColumnIcon.HeaderString, themeOverride: { bgIconHeader: '#22d3ee', textHeader: '#155e75' } },
    { title: 'Group', id: 'group', width: 120, icon: GridColumnIcon.HeaderString, themeOverride: { bgIconHeader: '#a5b4fc', textHeader: '#3730a3' } },
    { title: 'IP', id: 'ip', width: 120, icon: GridColumnIcon.HeaderString, themeOverride: { bgIconHeader: '#bbf7d0', textHeader: '#166534' } },
    { title: 'CIDR', id: 'cidr', width: 120, icon: GridColumnIcon.HeaderString, themeOverride: { bgIconHeader: '#86efac', textHeader: '#14532d' } },
    { title: 'Server', id: 'server', width: 180, icon: GridColumnIcon.HeaderString, themeOverride: { bgIconHeader: '#fecdd3', textHeader: '#be123c' } },
    { title: 'Ping', id: 'ping', width: 140, icon: GridColumnIcon.HeaderNumber, themeOverride: { bgIconHeader: '#fde68a', textHeader: '#92400e' } },
    { title: 'Connected', id: 'connected', width: 100, icon: GridColumnIcon.HeaderString, themeOverride: { bgIconHeader: '#bbf7d0', textHeader: '#166534' } },
    { title: 'Time', id: 'time', width: 180, icon: GridColumnIcon.HeaderString, themeOverride: { bgIconHeader: '#c084fc', textHeader: '#6b21a8' } },
    { title: 'Details', id: 'details', width: 100, icon: GridColumnIcon.HeaderString, themeOverride: { bgIconHeader: '#ede9fe', textHeader: '#7c3aed' } },
  ];

  // Network data getter with colors
  const getNetworkData = useCallback(([col, row]: Item): GridCell => {
    const iface = rows[row];
    if (!iface) return { kind: GridCellKind.Text, data: '', displayData: '', allowOverlay: false };

    const udpPingMs = elapsedToMs((iface as any).server_udp_hc?.elapsed);
    const tcpPingMs = elapsedToMs((iface as any).server_tcp_hc?.elapsed);

    // Color based on connection status
    const getConnectionColor = (connected: boolean) => {
      return connected ? '#10b981' : '#ef4444'; // green : red
    };

    // Color based on ping
    const getPingColor = (ping: number | null) => {
      if (ping === null) return '#6b7280'; // gray
      if (ping < 50) return '#10b981'; // green
      if (ping < 100) return '#3b82f6'; // blue
      if (ping < 200) return '#f59e0b'; // yellow
      return '#ef4444'; // red
    };

    switch (col) {
      case 0: // Node
        return { 
          kind: GridCellKind.Drilldown, 
          data: [{ text: iface.node_name }], 
          allowOverlay: false
        };
      case 1: // Group
        return { 
          kind: GridCellKind.Text, 
          data: iface.group_name || "Ungrouped", 
          displayData: iface.group_name || "Ungrouped", 
          allowOverlay: false,
          contentAlign: 'center'
        };
      case 2: // IP
        return { 
          kind: GridCellKind.Text, 
          data: iface.addr, 
          displayData: iface.addr, 
          allowOverlay: false
        };
      case 3: // CIDR
        return { 
          kind: GridCellKind.Text, 
          data: iface.cidr, 
          displayData: iface.cidr, 
          allowOverlay: false
        };
      case 4: // Server
        return { 
          kind: GridCellKind.Text, 
          data: iface.server_addr, 
          displayData: iface.server_addr, 
          allowOverlay: false
        };
      case 5: // Ping
        const pingText = `UDP: ${udpPingMs ?? "—"}ms | TCP: ${tcpPingMs ?? "—"}ms`;
        const avgPing = udpPingMs && tcpPingMs ? Math.round((udpPingMs + tcpPingMs) / 2) : (udpPingMs ?? tcpPingMs ?? null);
        return { 
          kind: GridCellKind.Text, 
          data: pingText, 
          displayData: pingText, 
          allowOverlay: false,
          themeOverride: { bgCell: getPingColor(avgPing) }
        };
      case 6: // Connected
        return { 
          kind: GridCellKind.Text, 
          data: iface.has_udp_socket ? 'Yes' : 'No', 
          displayData: iface.has_udp_socket ? 'Yes' : 'No', 
          allowOverlay: false,
          contentAlign: 'center',
          themeOverride: { bgCell: getConnectionColor(iface.has_udp_socket) }
        };
      case 7: // Time
        const timeDisplay = iface.timestamp_formatted || (iface.timestamp ? new Date(iface.timestamp).toLocaleString() : '—');
        return { 
          kind: GridCellKind.Text, 
          data: timeDisplay, 
          displayData: timeDisplay, 
          allowOverlay: false
        };
      case 8: // Details
        return { 
          kind: GridCellKind.Drilldown, 
          data: [{ text: 'View Details' }], 
          allowOverlay: false,
          themeOverride: { bgCell: '#ede9fe' }
        };
      default:
        return { kind: GridCellKind.Text, data: '', displayData: '', allowOverlay: false };
    }
  }, [rows]);

  // Handle cell click for details
  const onCellClicked = useCallback((cell: Item) => {
    const [col, row] = cell;
    if (col === 8 && rows[row]) { // Details column (now at index 8)
      setSelectedInterface(rows[row].index);
    }
  }, [rows]);

  // Get selected interface details
  const selectedInterfaceData = useMemo(() => {
    if (selectedInterface === null) return null;
    return interfaces.find(i => i.index === selectedInterface);
  }, [selectedInterface, interfaces]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center mb-1">
        <h2 className="text-xl font-bold">{filterGroup ? `Network Info • ${filterGroup}` : "Network Info"}</h2>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 hidden"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && <div className="text-red-500 text-center">{error}</div>}

      <div className="flex justify-center w-full">
        <Card className="bg-background/95 border border-border overflow-hidden">
          <div className="w-full overflow-x-auto">
            {loading ? (
              <div className="px-3 py-3 text-center text-muted-foreground">
                Loading network interfaces...
              </div>
            ) : rows.length === 0 ? (
              <div className="px-3 py-3 text-center text-muted-foreground">
                No network interfaces found.
              </div>
            ) : (
              <div className="w-full">
                <DataEditor
                  columns={networkColumns}
                  getCellContent={getNetworkData}
                  rows={rows.length}
                  width={1300}
                  height={rows.length > 0 ? rows.length * 40 + 50 : 100}
                  onCellClicked={onCellClicked}
                  rowMarkers="both"
                  overscrollX={0}
                  overscrollY={0}
                  freezeColumns={1}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Details Dialog */}
      <Dialog open={selectedInterface !== null} onOpenChange={(open) => !open && setSelectedInterface(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Network Details • {selectedInterfaceData?.node_name || "Unknown"}
            </DialogTitle>
          </DialogHeader>
          {selectedInterfaceData && (
            <div className="space-y-4">
              {/* Server Health Info */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1 rounded-md border border-border/50 p-3 bg-background">
                  <div className="text-xs text-muted-foreground font-semibold">Server Health (UDP)</div>
                  <div className="text-xs space-y-1">
                    <div>send_count: <span className="font-mono">{selectedInterfaceData.server_udp_hc?.send_count ?? 0}</span></div>
                    <div>loss: <span className="font-mono">{selectedInterfaceData.server_udp_hc?.packet_loss_count ?? 0}</span></div>
                    <div>cont_recv: <span className="font-mono">{selectedInterfaceData.server_udp_hc?.packet_continuous_recv_count ?? 0}</span></div>
                    <div>cont_loss: <span className="font-mono">{selectedInterfaceData.server_udp_hc?.packet_continuous_loss_count ?? 0}</span></div>
                    <div>ping: <span className="font-mono">{elapsedToMs((selectedInterfaceData as any).server_udp_hc?.elapsed) ?? "—"} ms</span></div>
                  </div>
                </div>
                <div className="space-y-1 rounded-md border border-border/50 p-3 bg-background">
                  <div className="text-xs text-muted-foreground font-semibold">Server Health (TCP)</div>
                  <div className="text-xs space-y-1">
                    <div>send_count: <span className="font-mono">{selectedInterfaceData.server_tcp_hc?.send_count ?? 0}</span></div>
                    <div>cont_recv: <span className="font-mono">{selectedInterfaceData.server_tcp_hc?.packet_continuous_recv_count ?? 0}</span></div>
                    <div>cont_loss: <span className="font-mono">{selectedInterfaceData.server_tcp_hc?.packet_continuous_loss_count ?? 0}</span></div>
                    <div>ping: <span className="font-mono">{elapsedToMs((selectedInterfaceData as any).server_tcp_hc?.elapsed) ?? "—"} ms</span></div>
                  </div>
                </div>
                <div className="space-y-1 rounded-md border border-border/50 p-3 bg-background">
                  <div className="text-xs text-muted-foreground font-semibold">Transport</div>
                  <div className="text-xs space-y-1">
                    <div>p2p: <span className="font-mono">{Array.isArray((selectedInterfaceData as any).mode?.p2p) ? (selectedInterfaceData as any).mode.p2p.join(", ") : "—"}</span></div>
                    <div>relay: <span className="font-mono">{Array.isArray((selectedInterfaceData as any).mode?.relay) ? (selectedInterfaceData as any).mode.relay.join(", ") : "—"}</span></div>
                  </div>
                </div>
                <div className="space-y-1 rounded-md border border-border/50 p-3 bg-background">
                  <div className="text-xs text-muted-foreground font-semibold">Timestamp</div>
                  <div className="text-xs space-y-1">
                    <div className="font-mono break-all">
                      {selectedInterfaceData.timestamp_formatted || (selectedInterfaceData.timestamp ? new Date(selectedInterfaceData.timestamp).toLocaleString() : "—")}
                    </div>
                    {selectedInterfaceData.timestamp && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(selectedInterfaceData.timestamp).toISOString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Connected Peers Table */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="opacity-70" />
                  <span className="text-sm font-medium">Connected Peers</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {Object.values((selectedInterfaceData.node_map as Record<string, NodeMapEntry>) || {}).length}
                  </Badge>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-xs border min-w-[720px]">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">Virtual IP</th>
                        <th className="px-2 py-1 text-left">LAN</th>
                        <th className="px-2 py-1 text-left">WAN</th>
                        <th className="px-2 py-1 text-left">PIN</th>
                        <th className="px-2 py-1 text-left">UDP</th>
                        <th className="px-2 py-1 text-left">HC</th>
                        <th className="px-2 py-1 text-left">Ping</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values((selectedInterfaceData.node_map as Record<string, NodeMapEntry>) || {}).map((p, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/5">
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1.5">
                              <LinkIcon size={12} className="opacity-70" />
                              <span className="font-medium">{p.node?.name || "—"}</span>
                            </div>
                          </td>
                          <td className="px-2 py-1 font-mono whitespace-nowrap">{p.node?.virtual_addr || "—"}</td>
                          <td className="px-2 py-1 font-mono whitespace-nowrap">{p.node?.lan_udp_addr || "—"}</td>
                          <td className="px-2 py-1 font-mono whitespace-nowrap">{p.node?.wan_udp_addr || "—"}</td>
                          <td className="px-2 py-1 font-mono whitespace-nowrap">{p.node?.register_nonce ?? "—"}</td>
                          <td className="px-2 py-1">
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {p.udp_status
                                ? Object.keys(p.udp_status)[0]
                                : "Unknown"}
                            </Badge>
                          </td>
                          <td className="px-2 py-1">
                            <div className="font-mono whitespace-nowrap">
                              s:{p.hc?.send_count ?? 0} r:{p.hc?.packet_continuous_recv_count ?? 0} l:{p.hc?.packet_continuous_loss_count ?? 0}
                            </div>
                          </td>
                          <td className="px-2 py-1">
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              {elapsedToMs(p.hc?.elapsed) ?? "—"} ms
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {Object.values((selectedInterfaceData.node_map as Record<string, NodeMapEntry>) || {}).length === 0 && (
                        <tr>
                          <td className="px-2 py-2 text-center text-muted-foreground" colSpan={8}>
                            No peers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


