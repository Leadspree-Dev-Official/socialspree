import React from 'react';
import { UserButton, useUser } from '@clerk/react';
import { Tenant, AgencyBrand } from '../../types';
import { SUPER_ADMIN_EMAIL } from '../../lib/store';
import { Search, Bell, ShieldCheck, Building2, Globe, LogOut, User } from 'lucide-react';
import { BrandSelectorTopbar } from '../agency/BrandSelectorTopbar';


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
  userProfile?: { fullName?: string | null; avatarUrl?: string | null } | null;
  onOpenUserProfile?: () => void;
  isAgencyMode?: boolean;
  brands?: AgencyBrand[];
  activeBrand?: AgencyBrand | null;
  onSelectBrand?: (brand: AgencyBrand | null) => void;
  onOpenBrandManager?: () => void;
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
  userEmail,
  userProfile,
  onOpenUserProfile,
  isAgencyMode,
  brands,
  activeBrand,
  onSelectBrand,
  onOpenBrandManager
}) => {
  const { user } = useUser();
  const clerkEmail = user?.primaryEmailAddress?.emailAddress;
  const clerkName = user?.fullName || (user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : undefined) || user?.username;

  const activeEmail = clerkEmail || userEmail || currentTenant.ownerEmail;
  const displayName = clerkName || userProfile?.fullName || (activeEmail ? activeEmail.split('@')[0] : 'User');
  const avatarUrl = user?.imageUrl || userProfile?.avatarUrl;

  return (
    <header className="sticky top-0 z-40 bg-[#F8FAFF]/90 backdrop-blur-xl border-b border-slate-200/80 flex justify-between items-center h-16 px-6 w-full">
      {/* Title & Search Bar */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <h2 className="font-['Inter'] text-xl font-black text-[#0B1C30] whitespace-nowrap shrink-0">
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
      <div className="flex items-center gap-3 shrink-0">
        {/* Strict Workspace Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 shadow-2xs whitespace-nowrap leading-none shrink-0">
          <Building2 className="w-3.5 h-3.5 text-[#5D3FD3] shrink-0" />
          <span className="font-bold max-w-[140px] truncate leading-none">{currentTenant.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase leading-none ${
            currentTenant.tierPlan === 'pro' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {currentTenant.tierPlan}
          </span>
        </div>

        {/* Agency Brand Selector Pill */}
        {isAgencyMode && brands && onSelectBrand && onOpenBrandManager && (
          <BrandSelectorTopbar
            brands={brands}
            activeBrand={activeBrand || null}
            onSelectBrand={onSelectBrand}
            onOpenBrandManager={onOpenBrandManager}
          />
        )}

        {/* Notification Bell */}
        <button className="p-2 text-slate-500 hover:text-[#5D3FD3] transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Account Quick Switcher */}
        <div className="flex items-center gap-2">
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 rounded-full border border-slate-300 hover:border-[#5D3FD3]"
              }
            }}
          />
        </div>

      </div>
    </header>
  );
};
