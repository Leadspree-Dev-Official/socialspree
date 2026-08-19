import React, { useState, useRef, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/react';
import { Tenant, AgencyBrand } from '../../types';
import { SUPER_ADMIN_EMAIL } from '../../lib/store';
import { Search, Bell, ShieldCheck, Building2, Globe, LogOut, User, CheckCircle2, Sparkles, AlertTriangle, X, Check, Mic } from 'lucide-react';
import { BrandSelectorTopbar } from '../agency/BrandSelectorTopbar';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
  type: 'success' | 'info' | 'warning' | 'security';
}

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
  onOpenVoiceAssistant?: () => void;
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
  onOpenBrandManager,
  onOpenVoiceAssistant
}) => {
  const { user } = useUser();
  const clerkEmail = user?.primaryEmailAddress?.emailAddress;
  const clerkName = user?.fullName || (user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : undefined) || user?.username;

  const activeEmail = userEmail || clerkEmail || currentTenant.ownerEmail;
  const displayName = userProfile?.fullName || clerkName || (activeEmail ? activeEmail.split('@')[0] : 'User');
  const avatarUrl = userProfile?.avatarUrl || user?.imageUrl;

  // Notification Center State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Post Dispatched Successfully',
      message: 'Instagram Reel & TikTok Video published via Zenith Engine Slot #1.',
      timestamp: '10 mins ago',
      unread: true,
      type: 'success'
    },
    {
      id: 'n2',
      title: 'Calendar Schedule Synced',
      message: 'Upcoming multi-channel queue synced across all connected profiles.',
      timestamp: '1 hour ago',
      unread: true,
      type: 'info'
    },
    {
      id: 'n3',
      title: 'Security Session Audit',
      message: 'New session authenticated via Clerk Google OAuth.',
      timestamp: '3 hours ago',
      unread: false,
      type: 'security'
    }
  ]);

  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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
          <span className="font-bold max-w-[160px] truncate leading-none">{currentTenant.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase leading-none ${
            currentTenant.tierPlan === 'pro' || currentTenant.tierPlan === 'agency' 
              ? 'bg-purple-100 text-purple-700' 
              : currentTenant.tierPlan === 'free' 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-amber-100 text-amber-800'
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

        {/* Voice AI Assistant Trigger Pill */}
        {onOpenVoiceAssistant && (
          <button
            type="button"
            onClick={onOpenVoiceAssistant}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-[#5D3FD3] border border-purple-200/90 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
            title="Voice AI Assistant (Alt + V)"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice AI</span>
            <span className="text-[10px] font-mono bg-purple-200/80 text-purple-900 px-1.5 py-0.2 rounded-md font-bold">
              Alt+V
            </span>
          </button>
        )}

        {/* Functional Notification Center Bell & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-[#5D3FD3] hover:bg-slate-100/80 rounded-xl transition-all relative"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Notifications Popover Menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden font-['Inter'] animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#5D3FD3] text-white px-1.5 py-0.2 rounded-full font-mono font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#5D3FD3] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-3.5 flex items-start gap-3 transition-colors ${n.unread ? 'bg-purple-50/40' : 'hover:bg-slate-50'}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {n.type === 'info' && <Sparkles className="w-4 h-4 text-purple-500" />}
                        {n.type === 'security' && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                      </div>

                      <button
                        onClick={() => handleDismissNotification(n.id)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-200/50 rounded transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No notifications right now
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setNotifications([])}
                    className="text-[11px] text-slate-500 hover:text-red-600 font-semibold"
                  >
                    Clear All Notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Account Quick Switcher */}
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <button 
              onClick={onOpenUserProfile} 
              className="w-9 h-9 rounded-full border-2 border-purple-300 hover:border-[#5D3FD3] overflow-hidden flex items-center justify-center transition-all shadow-2xs"
              title="Open Profile Settings"
            >
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            </button>
          ) : (
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 rounded-full border border-slate-300 hover:border-[#5D3FD3]"
                }
              }}
            />
          )}
        </div>

      </div>
    </header>
  );
};
