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
  Globe,
  Building2,
  Instagram,
  CreditCard,
  Layers,
  Key,
  HardDrive,
  Sparkles,
  Lock
} from 'lucide-react';
import { SuperAdminSubTab } from '../admin/SuperAdminPortal';

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
  userFullName?: string;
  userEmail?: string;
  userRole?: string;
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
  userFullName,
  userEmail,
  userRole
}) => {
  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleAdminSubTabClick = (subTab: SuperAdminSubTab) => {
    setActiveTab('admin');
    if (onSelectAdminSubTab) {
      onSelectAdminSubTab(subTab);
    }
  };

  const getRoleLabel = () => {
    if (isSuperAdmin || userRole === 'super_admin') return 'Super Admin Governance';
    if (userRole === 'agency' || isAgencyMode) return 'Agency Owner';
    if (userRole === 'influencer' || isInfluencerMode) return 'Influencer Creator';
    return 'Business User';
  };

  return (
    <aside className="w-[260px] bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30 border-r border-slate-800 font-['Inter'] shadow-2xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5D3FD3] via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">SocialSpree</span>
            <span className="text-[10px] text-purple-400 font-mono font-bold block -mt-0.5">ZENITH ENGINE OS</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* ========================================================================= */}
        {/* MODE A: SUPER ADMIN NAVIGATION (STRICTLY SUPER ADMIN DASHBOARD SUBTABS ONLY) */}
        {/* ========================================================================= */}
        {isSuperAdmin ? (
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center justify-between">
              <span>Governance Suite</span>
              <span className="bg-amber-400/20 text-amber-300 text-[9px] px-2 py-0.5 rounded font-mono font-bold border border-amber-400/30">
                SUPER ADMIN
              </span>
            </div>

            {/* Overview & Metrics */}
            <button
              onClick={() => handleAdminSubTabClick('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin' && activeAdminSubTab === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
              <span>Overview & Metrics</span>
            </button>

            {/* Tenant Accounts */}
            <button
              onClick={() => handleAdminSubTabClick('subscriptions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin' && activeAdminSubTab === 'subscriptions'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Tenant Accounts</span>
            </button>

            {/* Subscription Tiers */}
            <button
              onClick={() => handleAdminSubTabClick('plans')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin' && activeAdminSubTab === 'plans'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Subscription Tiers</span>
            </button>

            {/* API Allocation */}
            <button
              onClick={() => handleAdminSubTabClick('api_allocation')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin' && activeAdminSubTab === 'api_allocation'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Key className="w-4 h-4 text-purple-400" />
              <span>API Allocation & Limits</span>
            </button>

            {/* Storage & CDN */}
            <button
              onClick={() => handleAdminSubTabClick('cloudflare')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin' && activeAdminSubTab === 'cloudflare'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>Storage & Cloudflare CDN</span>
            </button>

            {/* AI Credits & Limits */}
            <button
              onClick={() => handleAdminSubTabClick('ai_credits')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin' && activeAdminSubTab === 'ai_credits'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-900/40 font-extrabold'
                  : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Credits & Settings</span>
            </button>

            {/* Server Profile Presets */}
            <button
              onClick={() => handleAdminSubTabClick('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin' && activeAdminSubTab === 'settings'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-4 h-4 text-purple-400" />
              <span>Server Presets & Mode</span>
            </button>

            {/* Privilege & Access Control */}
            <button
              onClick={() => handleAdminSubTabClick('privileges')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'admin' && activeAdminSubTab === 'privileges'
                  ? 'bg-purple-900 text-amber-300 border border-amber-400/50 shadow-md font-bold'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Privilege & Access Control</span>
            </button>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODE B: STANDARD TENANT USER NAVIGATION (AGENCY, INFLUENCER, BUSINESS USER) */
          /* ========================================================================= */
          <>
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

              {/* Influencer Grid Feed Planner Tab */}
              {isInfluencerMode && (
                <button
                  onClick={() => handleNavClick('grid_planner')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'grid_planner'
                      ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                      : 'text-pink-300 hover:text-white hover:bg-pink-950/40'
                  }`}
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <div className="flex items-center justify-between w-full">
                    <span>Feed Grid Planner</span>
                    <span className="text-[9px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded font-mono font-bold">
                      FEED
                    </span>
                  </div>
                </button>
              )}

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

            {/* AI & Automation Section */}
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'reviews'
                    ? 'bg-[#5D3FD3] text-white shadow-md shadow-purple-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Star className="w-4 h-4 text-slate-400" />
                <span>Google Reviews</span>
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
          </>
        )}

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

      {/* Footer Profile Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${isSuperAdmin ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'} border font-bold flex items-center justify-center text-xs`}>
            {userFullName ? userFullName.slice(0, 2).toUpperCase() : (isSuperAdmin ? 'SA' : 'US')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">
              {userFullName || (isSuperAdmin ? 'Super Admin' : 'Workspace User')}
            </div>
            <div className="text-[10px] text-slate-400 truncate font-mono">
              {userEmail || getRoleLabel()}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
