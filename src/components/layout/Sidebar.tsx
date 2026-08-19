import React from 'react';
import { useUser } from '@clerk/react';
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
  Globe,
  Building2,
  Instagram,
  CreditCard,
  Layers,
  Key,
  HardDrive,
  Sparkles,
  Lock,
  LogOut,
  Crown
} from 'lucide-react';
import { SuperAdminSubTab } from '../admin/SuperAdminPortal';
import { GLOBAL_SYSTEM_SETTINGS } from '../../lib/store';

export type TabType = 
  | 'dashboard' 
  | 'agency_brands'
  | 'grid_planner'
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
  | 'superadmin'
  | 'settings'
  | 'help';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isSuperAdmin: boolean;
  isAgencyMode?: boolean;
  isInfluencerMode?: boolean;
  activeAdminSubTab?: SuperAdminSubTab;
  onSelectAdminSubTab?: (subTab: SuperAdminSubTab) => void;
  onReturnToPublic?: () => void;
  onSignOut?: () => void;
  userFullName?: string;
  userEmail?: string;
  userRole?: string;
  avatarUrl?: string;
  aiCreditsEnabled?: boolean;
  automationAiEnabled?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSuperAdmin,
  isAgencyMode,
  isInfluencerMode,
  activeAdminSubTab = 'dashboard',
  onSelectAdminSubTab,
  onReturnToPublic,
  onSignOut,
  userFullName,
  userEmail,
  userRole,
  avatarUrl,
  aiCreditsEnabled = false,
  automationAiEnabled = false,
}) => {
  const { user } = useUser();
  const clerkEmail = user?.primaryEmailAddress?.emailAddress;
  const clerkName = user?.fullName || (user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : undefined) || user?.username;

  const displayName = userFullName || clerkName || (isSuperAdmin ? 'Super Admin' : 'Workspace User');
  const displayEmail = userEmail || clerkEmail || (isSuperAdmin ? 'admin@leadspree.io' : 'user@socialspree.io');
  const effectiveAvatar = avatarUrl || user?.imageUrl;

  const getRoleLabel = () => {
    if (isSuperAdmin || userRole === 'super_admin') return 'Super Admin Governance';
    if (userRole === 'agency' || isAgencyMode) return 'Agency Owner';
    if (userRole === 'influencer' || isInfluencerMode) return 'Influencer Creator';
    return 'Business User';
  };

  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleAdminSubTabClick = (subTab: SuperAdminSubTab) => {
    setActiveTab('superadmin');
    if (onSelectAdminSubTab) {
      onSelectAdminSubTab(subTab);
    }
  };

  return (
    <aside className="w-[260px] bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30 border-r border-slate-800 font-['Inter'] shadow-2xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="SocialSpree Logo" className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-purple-900/40 border border-purple-500/30" />
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">SocialSpree</span>
            <span className="text-[10px] text-purple-400 font-mono font-bold block -mt-0.5">ZENITH ENGINE OS</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* ========================================================================= */}
        {/* SUPER ADMIN GOVERNANCE SUITE (EXCLUSIVE TO SUPER ADMINS) */}
        {/* ========================================================================= */}
        {isSuperAdmin && (
          <div className="space-y-2 p-3 rounded-2xl bg-gradient-to-b from-purple-950/80 via-slate-900 to-purple-950/50 border border-amber-500/40 shadow-xl">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-amber-400">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin</span>
              </div>
              <span className="bg-amber-400 text-slate-950 text-[9px] px-1.5 py-0.2 rounded font-mono font-black">
                ROOT SUITE
              </span>
            </div>

            <button
              onClick={() => handleNavClick('superadmin')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'superadmin' || activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white shadow-lg ring-1 ring-amber-300/40'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-amber-200 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Super Admin Portal</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">/superadmin</span>
            </button>

            {/* If currently viewing superadmin portal, show the sub-navigation pills */}
            {(activeTab === 'superadmin' || activeTab === 'admin') && (
              <div className="pt-2 space-y-1 border-t border-purple-900/60 mt-2 animate-in fade-in">
                <button
                  onClick={() => handleAdminSubTabClick('dashboard')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeAdminSubTab === 'dashboard'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Overview & Metrics</span>
                </button>
                <button
                  onClick={() => handleAdminSubTabClick('subscriptions')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeAdminSubTab === 'subscriptions'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Tenant Accounts</span>
                </button>
                <button
                  onClick={() => handleAdminSubTabClick('plans')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeAdminSubTab === 'plans'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Subscription Tiers</span>
                </button>
                <button
                  onClick={() => handleAdminSubTabClick('api_allocation')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeAdminSubTab === 'api_allocation'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>API Allocation & Limits</span>
                </button>
                <button
                  onClick={() => handleAdminSubTabClick('cloudflare')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeAdminSubTab === 'cloudflare'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Storage & CDN Pool</span>
                </button>
                {aiCreditsEnabled && (
                  <button
                    onClick={() => handleAdminSubTabClick('ai_credits')}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      activeAdminSubTab === 'ai_credits'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Credits & Settings</span>
                  </button>
                )}
                <button
                  onClick={() => handleAdminSubTabClick('settings')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeAdminSubTab === 'settings'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Server Presets & Mode</span>
                </button>
                <button
                  onClick={() => handleAdminSubTabClick('privileges')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeAdminSubTab === 'privileges'
                      ? 'bg-purple-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Privilege & RBAC</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STANDARD WORKSPACE NAVIGATION (AVAILABLE TO BOTH USERS & SUPER ADMIN) */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          {/* Core Publishing Section */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
              Publish & Schedule
            </div>

              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-purple-400" />
                <span>Dashboard Overview</span>
              </button>

              {/* Agency Dedicated Tab */}
              {isAgencyMode && (
                <button
                  onClick={() => handleNavClick('agency_brands')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'agency_brands'
                      ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                      : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <div className="flex items-center justify-between w-full">
                    <span>Multi-Brand Suite</span>
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold">
                      AGENCY
                    </span>
                  </div>
                </button>
              )}

              {/* Influencer Grid Feed Planner Tab (Disabled for now) */}

              <button
                onClick={() => handleNavClick('composer')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'composer'
                    ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Edit className="w-4 h-4 text-slate-400" />
                <span>Post Composer</span>
              </button>

              <button
                onClick={() => handleNavClick('calendar')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <span>Content Calendar</span>
              </button>

              <button
                onClick={() => handleNavClick('media')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'media'
                    ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Film className="w-4 h-4 text-slate-400" />
                <span>Media Storage Vault</span>
              </button>
            </div>

            {/* AI & Automation Section (Controlled by Super Admin toggle) */}
            {automationAiEnabled && (
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Automation & AI
                </div>

                <button
                  onClick={() => handleNavClick('autoresponder')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'autoresponder'
                      ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <MessageSquareCode className="w-4 h-4 text-slate-400" />
                  <span>Live Auto-Responder</span>
                </button>
              </div>
            )}

            {/* Analytics & Channels Section */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
                Channels & Reports
              </div>

              <button
                onClick={() => handleNavClick('connections')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'connections'
                    ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Social Accounts & Slots</span>
              </button>

              <button
                onClick={() => handleNavClick('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>Analytics & Reports</span>
              </button>

              <button
                onClick={() => handleNavClick('reviews')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  <span>Google Reviews</span>
                </div>
                <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs">
                  SOON
                </span>
              </button>

              <button
                onClick={() => handleNavClick('logs')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'logs'
                    ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Dispatch Audit Logs</span>
              </button>
            </div>
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

          {onReturnToPublic && isSuperAdmin && (
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

      {/* Footer Profile Status with Logout Button */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-2.5">
        <div 
          onClick={() => handleNavClick('settings')}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
          title="Open Workspace Settings & Profile"
        >
          <div className="w-8 h-8 rounded-full border border-purple-500/40 bg-purple-950/60 overflow-hidden flex items-center justify-center shrink-0">
            {effectiveAvatar ? (
              <img src={effectiveAvatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-xs text-purple-300">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors truncate">
              {displayName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              {displayEmail}
            </div>
          </div>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-xl transition-all shrink-0"
            title="Sign Out of SocialSpree"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
