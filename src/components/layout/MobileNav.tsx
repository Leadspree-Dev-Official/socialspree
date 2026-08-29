import React from 'react';
import { TabType } from './Sidebar';
import { LayoutDashboard, Edit, Calendar as CalendarIcon, Bot, Film, Share2, ShieldAlert } from 'lucide-react';

interface MobileNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isSuperAdmin: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  isSuperAdmin
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'composer', label: 'Compose', icon: Edit },
    { id: 'media', label: 'Media', icon: Film },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  ];

  if (isSuperAdmin) {
    tabs.push({ id: 'superadmin', label: 'SuperAdmin', icon: ShieldAlert });
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#F8FAFF] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-16 px-1 md:hidden shadow-lg transition-colors duration-150">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-all duration-150 ${
              isActive
                ? 'text-[#5D3FD3] dark:text-purple-400 font-bold bg-[#5D3FD3]/10 dark:bg-purple-900/30 scale-95'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
