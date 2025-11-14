import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { listen } from "@tauri-apps/api/event";

export interface NetworkNodeInterfaceInfo {
  index: number;
  node_name: string;
  group_name?: string | null;
  addr: string;
  cidr: string;
  mode: string;
  node_map: any;
  server_addr: string;
  server_udp_hc: any;
  server_udp_status: any;
  server_tcp_hc: any;
  server_is_connected: boolean;
  has_udp_socket: boolean;
  timestamp?: number; // Unix timestamp in milliseconds when data was received
  timestamp_formatted?: string; // Human-readable timestamp
}

interface NetworkContextType {
  interfaces: NetworkNodeInterfaceInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  wsConnected: boolean;
  wsError: string | null;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [interfaces, setInterfaces] = useState<NetworkNodeInterfaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);

  const addTimestamps = useCallback((interfacesList: any[]): NetworkNodeInterfaceInfo[] => {
    const now = Date.now();
    const formattedTime = new Date(now).toLocaleString();
    return interfacesList.map((iface) => ({
      ...iface,
      timestamp: now,
      timestamp_formatted: formattedTime,
    }));
  }, []);

  const fetchNetworkInfo = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const json = await invoke("get_network_info");
      const interfacesList = Array.isArray(json) ? json : [];
      const interfacesWithTimestamps = addTimestamps(interfacesList);
      setInterfaces(interfacesWithTimestamps);
      setWsConnected(true);
      setWsError(null);
    } catch (err: any) {
      setError(err?.message || "Unknown error");
      setInterfaces([]);
      setWsConnected(false);
      setWsError(err?.message || "Failed to fetch network info");
    }
  }, [addTimestamps]);

  useEffect(() => {
    // Fetch initial network info
    fetchNetworkInfo();

    // Listen for network info update events
    let unlistenUpdate: (() => void) | null = null;
    let unlistenError: (() => void) | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const setupListeners = async () => {
      try {
        // Listen for network info updates
        unlistenUpdate = await listen<NetworkNodeInterfaceInfo[]>("network-info-update", (event) => {
          const interfacesList = Array.isArray(event.payload) ? event.payload : [];
          const interfacesWithTimestamps = addTimestamps(interfacesList);
          setInterfaces(interfacesWithTimestamps);
          setWsConnected(true);
          setWsError(null);
          setLoading(false);
        });

        // Listen for network info errors
        unlistenError = await listen<string>("network-info-error", (event) => {
          setError(event.payload);
          setWsConnected(false);
          setWsError(event.payload);
          setLoading(false);
        });
      } catch (err: any) {
        console.error("Failed to set up network info event listeners:", err);
        // Fallback to polling if events fail
        fallbackInterval = setInterval(() => {
          fetchNetworkInfo();
        }, 2000);
      }
    };

    setupListeners();

    // Cleanup on unmount
    return () => {
      if (unlistenUpdate) {
        unlistenUpdate();
      }
      if (unlistenError) {
        unlistenError();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [fetchNetworkInfo, addTimestamps]);

  return (
    <NetworkContext.Provider value={{ 
      interfaces, 
      loading, 
      error, 
      refresh: fetchNetworkInfo,
      wsConnected,
      wsError
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within a NetworkProvider");
  return ctx;
}
