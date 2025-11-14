import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import Sidebar from "@/components/layout/Sidebar";
import { useState } from "react";
import Map from "@/pages/Map";
import { HeaderComponent } from "@/components/layout/Header";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SiteProvider } from "@/contexts/SiteContext";
import OverlayIndicator from '@/components/ui/overlay-indicator';
import { NetworkProvider } from "@/contexts/NetworkContext";
import Network from "./pages/Network";
import Course from "./pages/Course";

const App = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [appLoading, setAppLoading] = useState(false); // global loading state

  const toggleSidebarCollapse = () => setIsSidebarCollapsed((v) => !v);

  return (
    <NetworkProvider>
      <ThemeProvider>
        <SiteProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {/* Global App Overlay Indicator */}
            <OverlayIndicator visible={appLoading} message="Please wait..." />
            <BrowserRouter>
              <div className="flex h-screen w-full bg-background overflow-hidden">
                {/* Sidebar always visible at the left */}
                <Sidebar collapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebarCollapse} />
                {/* Main section: Header (fixed or sticky) then content area that scrolls */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
                  {/* Header at the top */}
                  <div className="sticky top-0 z-30 w-full">
                    <HeaderComponent
                      isMobileMenuOpen={false}
                      setIsMobileMenuOpen={() => {}}
                      onSettingsClick={() => {}}
                      onLogout={() => {}}
                    />
                  </div>
                  {/* Scrollable content below header */}
                  <div className="flex-1 min-h-0 bg-background p-0 relative overflow-hidden">
                    <Routes>
                      <Route path="/" element={<div className="overflow-y-auto h-full"><Home /></div>} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/course" element={<Course />} />
                      <Route path="/map" element={<div className="overflow-y-auto h-full"><Map /></div>} />
                      <Route path="/network" element={<div className="overflow-y-auto h-full"><Network /></div>} />
                      <Route path="*" element={<div className="overflow-y-auto h-full"><NotFound /></div>} />
                    </Routes>
                  </div>
                </div>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </SiteProvider>
      </ThemeProvider>
    </NetworkProvider>
  );
};

export default App;
