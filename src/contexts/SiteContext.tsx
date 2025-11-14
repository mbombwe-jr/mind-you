import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";

type SiteInfo = {
  username: string;
  fullname: string;
  userpictureurl?: string | null;
};

type NetworkStats = {
  tx: number;
  rx: number;
  tx_bytes?: number;
  rx_bytes?: number;
};

interface SiteContextType {
  siteInfo: SiteInfo;
  testConnection: (opts?: any) => void;
  networkStats: NetworkStats;
  refreshNetworkStats: () => void;
  assignmentCount: number;
  courseCount: number;
  refreshCounts: () => Promise<void>;
  isLoadingCounts: boolean;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider = ({ children }: { children: ReactNode }) => {
  const [siteInfo] = useState<SiteInfo>({
    username: "demo_user",
    fullname: "Demo User",
    userpictureurl: null,
  });
  const [networkStats, setNetworkStats] = useState<NetworkStats>({ tx: 0, rx: 0, tx_bytes: 0, rx_bytes: 0 });
  const [assignmentCount, setAssignmentCount] = useState<number>(0);
  const [courseCount, setCourseCount] = useState<number>(0);
  const [isLoadingCounts, setIsLoadingCounts] = useState<boolean>(false);

  const testConnection = (_opts?: any) => {};
  const refreshNetworkStats = () => {};

  const refreshCounts = useCallback(async () => {
    setIsLoadingCounts(true);
    try {
      const [assignments, courses] = await Promise.all([
        invoke<number>('get_assignment_count'),
        invoke<number>('get_enrolled_course_count'),
      ]);
      setAssignmentCount(assignments);
      setCourseCount(courses);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
      // Keep existing values on error
    } finally {
      setIsLoadingCounts(false);
    }
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  return (
    <SiteContext.Provider
      value={{
        siteInfo,
        testConnection,
        networkStats,
        refreshNetworkStats,
        assignmentCount,
        courseCount,
        refreshCounts,
        isLoadingCounts,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used within a SiteProvider");
  return ctx;
}
