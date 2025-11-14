import React, { useState, useEffect, useRef } from 'react';
import { Menu as MenuIcon, X as XIcon, Minimize, Maximize, X, Activity, User, LogOut, ChevronDown, Minus, Moon, Sun, Settings, Bell } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { confirm } from '@tauri-apps/plugin-dialog';
import { platform } from '@tauri-apps/plugin-os';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
// import { useSite } from '../contexts/SiteContext';
import SystemMonitor from '../system-monitor';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';

interface HeaderComponentProps {
  title?: string;
  memberStatus?: 'online' | 'offline' | 'idle' | 'dnd';
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSettingsClick: () => void;
  onLogout: () => void;
}

interface NetworkStats {
  tx: number;
  rx: number;
}

export const HeaderComponent: React.FC<HeaderComponentProps> = ({ title = 'MindYou', memberStatus = 'online', isMobileMenuOpen, setIsMobileMenuOpen, onSettingsClick, onLogout }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({ tx: 0, rx: 0 });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const siteInfo = { username: 'user', fullname: 'User Demo', userpictureurl: null };
  const testConnection = () => {}; // stub
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { interfaces = [] } = useNetwork();
  const memberCount = interfaces.length;
  const activeCount = interfaces.filter(iface => iface.has_udp_socket).length;
  const [membersOpen, setMembersOpen] = useState(false);
  
  // Determine member status based on WebSocket connection
  const currentMemberStatus: 'online' | 'offline' | 'idle' | 'dnd' = interfaces.some(iface => iface.has_udp_socket) ? 'online' : 'offline';

  useEffect(() => {
    const getPlatform = async () => {
      try {
        const currentPlatform = await platform();
        console.log(currentPlatform);
      } catch (err) {
        console.error('Error fetching platform:', err);
      }
    };
    getPlatform();

    // Test connection on component mount
    //testConnection({
    //  username: '2024-04-06629',
    //  password: 'shevienPaty2',
    //  url: 'https://lms.udsm.ac.tz/',
    //  status: 'active'
    //});
    //testConnection({
    //  username: 'admin',
    //  password: 'adminPaty@2',
    //  url: 'https://clctz.org/moodle',
    //  status: 'active'
    //});

    const checkMaximizeState = async () => {
      try {
        const appWindow = getCurrentWindow();
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        console.error('Failed to check maximize state:', error);
      }
    };

    checkMaximizeState();

    const setupListener = async () => {
      try {
        const unlisten = await getCurrentWindow().onResized(() => {
          checkMaximizeState();
        });
        return unlisten;
      } catch (error) {
        console.error('Failed to set up resize listener:', error);
        return null;
      }
    };

    let unlistenFn: (() => void) | null = null;
    setupListener().then(fn => { unlistenFn = fn; });

    // Fetch network stats periodically
    const fetchNetworkStats = async () => {
      try {
        const stats = await invoke<NetworkStats>('get_network_stats');
        setNetworkStats(stats);
      } catch (error) {
        console.error('Failed to fetch network stats:', error);
      }
    };

  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [networkStats]);

  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error('Minimize failed:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      const appWindow = getCurrentWindow();
      if (isMaximized) {
        await appWindow.unmaximize();
      } else {
        await appWindow.maximize();
      }
      setIsMaximized(!isMaximized); // Toggle state immediately
    } catch (error) {
      console.error('Maximize/Unmaximize failed:', error);
    }
  };



  const handleClose = async () => {
    try {
      // Display a confirmation dialog using Tauri's dialog API
      const confirmation = await confirm(
        'Are you sure you want to close?',
        { title: 'Tauri', kind: 'warning' }
      );
      
      if (confirmation) {
        const appWindow = getCurrentWindow();
        await appWindow.destroy(); // Utilize destroy instead of close to ensure the window closes
      }
      // If not confirmed, the window remains open
    } catch (error) {
      console.error('Closing the window failed:', error);
    }
  };

  const handleDragStart = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.startDragging();
    } catch (error) {
      console.error('Start dragging failed:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const handleLogout = async () => {
    try {
      const confirmation = await confirm(
        'Are you sure you want to logout?',
        { title: 'Logout Confirmation', kind: 'warning' }
      );
      if (confirmation) {
        await invoke('logout_moodle');
        setIsProfileOpen(false);
        onLogout();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Helper for text color
  const getTextColor = () => (theme === 'theme-light' || theme === 'theme-yellow' ? '#222' : '#fff');
  const getBgColor = () => {
    switch (theme) {
      case 'theme-yellow': return '#ffe066';
      case 'theme-light': return '#fff';
      case 'theme-dark': return '#000';
      case 'theme-green': return '#23A559';
      case 'theme-blue': return '#2563eb';
      case 'theme-red': return '#ff4d4f';
      default: return 'var(--sidebar-background)';
    }
  };

  return (
    <div
      className="flex justify-between items-center cursor-move h-12 rounded-t-5xl border-b border-black/20 px-1 w-full"
      style={{
        background: getBgColor(),
        color: getTextColor(),
        transition: 'background 0.3s, color 0.3s',
      }}
    >
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden z-50 p-2 rounded-md ml-2"
      >
        {isMobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
      </button>
      <div className="flex items-center ">
        <div className="mr-4">
          <SystemMonitor compact />
        </div>
      </div>
      <div 
        className="flex-1 flex items-center h-full text-sm font-medium select-none"
        onMouseDown={handleDragStart}
      >
        {/*title*/}
        {currentMemberStatus && (
          <span className={` text-xs font-semibold ${
            currentMemberStatus === 'online' ? 'bg-[#1a1a1a] text-green-500 bg-[#1a1a1a]  p-1 rounded-sm' :
            currentMemberStatus === 'offline' ? 'text-gray-400 bg-[#1a1a1a]  p-1 rounded-sm' :
            currentMemberStatus === 'idle' ? 'text-yellow-500 bg-[#1a1a1a]  p-1 rounded-sm' :
            'text-red-500 bg-[#1a1a1a]  p-1 rounded-sm'
          }`}>
            {currentMemberStatus.charAt(0).toUpperCase() + currentMemberStatus.slice(1)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-md sidebar-3d-icon border border-black/50 transition-colors"
          style={{
            background: getBgColor(),
            color: theme === 'theme-dark' ? '#fff' : getTextColor(),
            borderColor: theme === 'theme-dark' ? '#fff' : 'black',
          }}
          title="Toggle light/dark theme"
        >
          {theme === "theme-dark" || theme === "theme-green" || theme === "theme-blue" || theme === "theme-red" ? <Bell size={18} /> : <Bell size={18} />}
        </button>
        {siteInfo && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center sidebar-3d-icon gap-2 px-3 py-1 border border-black/50 rounded-md hover:opacity-90 transition-colors"
              style={{
                background: '#2563eb',
                color: '#fff',
              }}
            >
              <User size={16} />
              <span className="text-sm">{siteInfo.username}</span>
              <ChevronDown size={14} className={`transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>
            {isProfileOpen && (
              <div
                className="absolute top-9 right-0 mt-2 w-64 border border-black/20 rounded-md shadow-lg z-50"
                style={{
                  background: getBgColor(),
                  color: getTextColor(),
                }}
              >
                <div className="p-4  border-b border-black/20">
                  <div className="flex items-center gap-3">
                    {siteInfo.userpictureurl ? (
                      <img 
                        src={siteInfo.userpictureurl} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                        <User size={24} className="text-white" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium" style={{ color: getTextColor() }}>{siteInfo.fullname}</div>
                      <div className="text-sm" style={{ color: theme === 'theme-light' || theme === 'theme-yellow' ? '#444' : '#ccc' }}>{siteInfo.username}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between z-115 px-4  py-2 border-b border-black/10 fixed sticky">
                  <span className="text-sm">Dark Mode</span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={theme === 'theme-dark' || theme === 'theme-blue' || theme === 'theme-green' || theme === 'theme-red'}
                      onChange={toggleTheme}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-all"></div>
                    <span className="ml-2 text-xs text-gray-500">{theme === 'theme-dark' || theme === 'theme-blue' || theme === 'theme-green' || theme === 'theme-red' ? 'On' : 'Off'}</span>
                  </label>
                </div>
                <div className="p-1 flex flex-col gap-1">
                  <button
                    onClick={onSettingsClick}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-discord-hover dark:hover:bg-gray-800"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <button 
          onClick={handleMinimize} 
          className="sidebar-3d-icon inline-flex justify-center items-center border border-black/50 w-10 h-10 rounded-md bg-green-500 transition-colors"
          aria-label="Minimize"
        >
          <Minus size={18} color="#fff" />
        </button>
        <button 
          onClick={handleMaximize} 
          className="sidebar-3d-icon inline-flex justify-center items-center border border-black/50 w-10 h-10 rounded-md bg-blue-500 transition-colors"
        >
          {isMaximized ? <Minimize size={16} color="#fff" /> : <Maximize size={16} color="#fff" />}
        </button>
        <button 
          onClick={handleClose} 
          className="sidebar-3d-icon inline-flex justify-center border-radius-full border border-black/50 items-center w-10 h-10 bg-red-500 rounded-md text-white transition-colors"
          aria-label="Close"
        >
          <X size={16} color="#fff" />
        </button>
      </div>
      {/* Member List Dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Node Members ({memberCount} total, {activeCount} active)</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {interfaces.map((iface, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{iface.node_name}</div>
                  <div className="text-xs text-gray-500">{iface.addr}{iface.cidr ? ' / ' + iface.cidr : ''}</div>
                  {iface.group_name && (
                    <div className="text-xs text-gray-400">{iface.group_name}</div>
                  )}
                </div>
                <span className={`ml-3 text-xs px-2 py-0.5 rounded ${iface.has_udp_socket ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>{iface.has_udp_socket ? 'active' : 'offline'}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}