import React, { useState } from "react";
import NetworkInfo from "@/components/network/NetworkInfo";
import NetworkSidebar from "@/components/network/NetworkSidebar";
import SystemMonitor from "@/components/system-monitor";

const Network: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <NetworkSidebar
        selectedGroup={selectedGroup}
        onGroupSelect={setSelectedGroup}
      />
      
      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedGroup ? (
          <div className="flex-1 overflow-auto p-6">
            <NetworkInfo filterGroup={selectedGroup} />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Select a group to view network info</h2>
            </div>
            <div className="flex items-start justify-end">
              <SystemMonitor compact />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Network;
