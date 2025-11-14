import React from 'react';
import { Home, MessageSquare, ChevronLeft, ChevronRight, Map, Network as NetworkIcon, Book, Book as BookIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import '@/Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const tabs = [
    { id: 'home', name: 'Home', icon: Home, route: '/' },
    { id: 'course', name: 'Course', icon: BookIcon, route: '/course' },
    { id: 'chat', name: 'Chat', icon: MessageSquare, route: '/chat' },
    { id: 'map', name: 'Map', icon: Map, route: '/map' },
    { id: 'network', name: 'Network', icon: NetworkIcon, route: '/network' },
  ];

  return (
    <div className={`h-screen bg-[#1a1a1a] flex flex-col ${collapsed ? 'w-16' : 'w-full max-w-[240px] sm:w-[170px] sm:max-w-none'} transition-all duration-300`}>
      {/* Navigation Buttons */}
      <div className="flex flex-col items-center gap-1 z-10 flex-grow overflow-y-auto w-full pt-12">
        {tabs.map((tab, index) => {
          const IconComponent = tab.icon;
          const isActive = pathname === tab.route;
          return (
            <div key={`${tab.id}-${index}`} className="w-full">
              <div
                className={`py-2 ${isActive ? 'rounded-l-3xl sidebar-active' : 'sidebar-inactive'}`}
              >
                <div
                  className={`flex items-center gap-3 cursor-pointer w-full justify-center sm:justify-start px-2 ${isActive ? 'selected' : ''}`}
                  onClick={() => navigate(tab.route)}
                >
                  <div
                    className={`sidebar-3d-icon h-12 w-12 border border-black/50 flex items-center justify-center text-white rounded-2xl hover:rounded-xl transition-all duration-200 relative ${isActive ? 'selected' : 'sidebar-inactive'}`}
                  >
                    <IconComponent size={24} color="#fff" />
                  </div>
                  {!collapsed && (
                    <span
                      className={`text-md font-medium max-w-[110px] truncate ${isActive ? '' : 'text-white'} hidden sm:inline-block`}
                    >
                      {tab.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Collapse/Expand Button */}
      <div className="flex flex-col items-center w-full py-4">
        <button
          className="sidebar-3d-icon flex items-center justify-center w-10 h-10 rounded-lg hover:bg-zinc-800 text-white my-2 mb-3 transition-all"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 