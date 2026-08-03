import React from 'react';
import { Tenant } from '../../types';
import { SUPER_ADMIN_EMAIL } from '../../lib/store';
import { Search, Bell, ShieldCheck, Building2, Globe, LogOut } from 'lucide-react';

interface HeaderProps {
  tenants: Tenant[];
  currentTenant: Tenant;
  onSelectTenant: (tenant: Tenant) => void;
  isSuperAdminMode: boolean;
  onToggleSuperAdmin: () => void;
  pageTitle: string;
  onReturnToPublic?: () => void;
  onSignOut?: () => void;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  tenants,
  currentTenant,
  onSelectTenant,
  isSuperAdminMode,
  onToggleSuperAdmin,
  pageTitle,
  onReturnToPublic,
  onSignOut,
  userEmail
}) => {
  const activeEmail = userEmail || (isSuperAdminMode ? SUPER_ADMIN_EMAIL : currentTenant.ownerEmail);
  const displayName = isSuperAdminMode ? 'LeadSpree Super Admin' : (activeEmail.split('@')[0] || 'User');
  return (
    <header className="sticky top-0 z-40 bg-[#F8FAFF]/90 backdrop-blur-xl border-b border-slate-200/80 flex justify-between items-center h-16 px-6 w-full">
      {/* Title & Search Bar */}
      <div className="flex items-center gap-6 flex-1">
        <h2 className="font-['Inter'] text-xl font-black text-[#0B1C30] whitespace-nowrap">
          {pageTitle}
        </h2>

        {/* Global Search */}
        <div className="hidden lg:flex items-center bg-[#EFF4FF] px-3.5 py-1.5 rounded-full border border-slate-200/60 w-full max-w-md focus-within:ring-2 focus-within:ring-[#5D3FD3] transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search posts, analytics, accounts..."
            className="bg-transparent border-none focus:outline-none text-xs w-full ml-2 text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Back to Marketing Site button */}
        {onReturnToPublic && (
          <button
            onClick={onReturnToPublic}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-purple-50 rounded-xl border border-slate-200 hover:border-purple-300 text-xs font-bold text-slate-700 hover:text-[#5D3FD3] transition-all"
            title="Return to Public Marketing Site"
          >
            <Globe className="w-3.5 h-3.5 text-[#5D3FD3]" />
            <span className="hidden md:inline">Marketing Site</span>
          </button>
        )}

        {/* Strict Workspace Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 shadow-2xs">
          <Building2 className="w-4 h-4 text-[#5D3FD3]" />
          <span className="font-bold max-w-[160px] truncate">{currentTenant.name}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
            currentTenant.tierPlan === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {currentTenant.tierPlan}
          </span>
        </div>

        {/* Super Admin Mode Toggle Button */}
        <button
          onClick={onToggleSuperAdmin}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            isSuperAdminMode
              ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
              : 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-800'
          }`}
          title="Toggle LeadSpree Super Admin Portal"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">
            {isSuperAdminMode ? 'Exit Super Admin' : 'Super Admin Mode'}
          </span>
        </button>

        {/* Notification Bell */}
        <button className="p-2 text-slate-500 hover:text-[#5D3FD3] transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* Profile Avatar & Log Out */}
        <div className="flex items-center gap-2.5">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="Avatar"
            className="w-9 h-9 rounded-full border border-slate-200 object-cover shadow-xs"
          />
          <div className="hidden sm:block text-left text-xs">
            <div className="font-bold text-slate-900 leading-none">
              {displayName}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {activeEmail}
            </div>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="ml-1 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Sign Out of SocialSpree"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
