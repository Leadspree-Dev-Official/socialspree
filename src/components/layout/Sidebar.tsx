import React from 'react';
import { 
  LayoutDashboard, 
  Edit, 
  Calendar as CalendarIcon,
  Bot,
  Film,
  MessageSquareCode,
  Share2, 
  FileText, 
  Star, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  HelpCircle,
  Globe
} from 'lucide-react';
import { SuperAdminSubTab } from '../admin/SuperAdminPortal';

export type TabType = 
  | 'dashboard' 
  | 'composer' 
  | 'calendar'
  | 'agents'
  | 'media'
  | 'autoresponder'
  | 'connections' 
  | 'logs' 
  | 'reviews' 
  | 'analytics' 
  | 'admin' 
  | 'settings'
  | 'help';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isSuperAdmin: boolean;
  activeAdminSubTab?: SuperAdminSubTab;
  onSelectAdminSubTab?: (subTab: SuperAdminSubTab) => void;
  onReturnToPublic?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSuperAdmin,
  onReturnToPublic,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'composer', label: 'Composer', icon: Edit },
    { id: 'calendar', label: 'Calendar Grid', icon: CalendarIcon },
    { id: 'agents', label: 'AI Agents', icon: Bot, isNew: true },
    { id: 'media', label: 'Media Vault', icon: Film },
    { id: 'autoresponder', label: 'Auto Responder', icon: MessageSquareCode, isNew: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'connections', label: 'Social Accounts', icon: Share2 },
    { id: 'logs', label: 'Activity Logs', icon: FileText },
  ];

  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <aside className="w-[260px] bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-slate-800 hidden md:flex font-['Inter']">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5D3FD3] to-purple-400 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-purple-900/40">
            SS
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-base flex items-center gap-1.5">
              SocialSpree
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono font-normal border border-purple-500/30">
                PRO
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] text-slate-400">Multi-Channel SaaS Engine</p>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold border border-amber-500/30">
                BETA v1.1.4
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
        
        {/* Main App Navigation */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
            Main Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as TabType)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.id === 'agents' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'agents' && (
                  <span className="text-[9px] font-mono font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full uppercase">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Super Admin Section (Always Available Nav Button) */}
        <div className="space-y-1 pt-2 border-t border-slate-800">
          <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400/80 mb-2 flex items-center justify-between">
            <span>Administration</span>
            {isSuperAdmin && (
              <span className="bg-amber-400/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                ACTIVE
              </span>
            )}
          </div>
          <button
            onClick={() => handleNavClick('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/30 border-amber-400'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border-amber-500/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Super Admin & Privileges</span>
          </button>
        </div>

        {/* System Settings & Support & Public Marketing Link */}
        <div className="space-y-1 pt-2 border-t border-slate-800">
          <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
            Preferences & Support
          </div>

          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => handleNavClick('help')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'help'
                ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Help Center</span>
          </button>

          {onReturnToPublic && (
            <button
              onClick={onReturnToPublic}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-purple-300 hover:text-white hover:bg-purple-900/30 transition-all border border-purple-500/20 mt-2"
            >
              <Globe className="w-4 h-4 text-purple-400" />
              <span>Back to Marketing Site</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Profile Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center text-xs">
            SA
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">Super Admin</div>
            <div className="text-[10px] text-slate-400 truncate font-mono">Root Privileges</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
