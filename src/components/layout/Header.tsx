import React, { useState, useRef, useEffect } from 'react';
import { Tenant, AgencyBrand } from '../../types';
import { SUPER_ADMIN_EMAIL } from '../../lib/store';
import { Search, Bell, ShieldCheck, Building2, Globe, LogOut, User, CheckCircle2, Sparkles, AlertTriangle, X, Check, Mic, Settings } from 'lucide-react';
import { BrandSelectorTopbar } from '../agency/BrandSelectorTopbar';
import { ThemeToggle } from './ThemeToggle';

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
  const activeEmail = userEmail || currentTenant.ownerEmail || SUPER_ADMIN_EMAIL;
  const displayName = userProfile?.fullName || (activeEmail ? activeEmail.split('@')[0] : 'User');
  const avatarUrl = userProfile?.avatarUrl;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
      message: 'New session authenticated via Supabase Auth.',
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
    <header className="sticky top-0 z-40 bg-[#F8FAFF]/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center h-16 px-6 w-full transition-colors duration-150">
      {/* Title & Search Bar */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <h2 className="font-['Inter'] text-xl font-black text-[#0B1C30] dark:text-white whitespace-nowrap shrink-0">
          {pageTitle}
        </h2>

        {/* Global Search */}
        <div className="hidden lg:flex items-center bg-[#EFF4FF] dark:bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 w-full max-w-md focus-within:ring-2 focus-within:ring-[#5D3FD3] dark:focus-within:ring-purple-400 transition-all">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search posts, analytics, accounts..."
            className="bg-transparent border-none focus:outline-none text-xs w-full ml-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Strict Workspace Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-2xs whitespace-nowrap leading-none shrink-0">
          <Building2 className="w-3.5 h-3.5 text-[#5D3FD3] dark:text-purple-400 shrink-0" />
          <span className="font-bold max-w-[160px] truncate leading-none">{currentTenant.name}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase leading-none ${
            currentTenant.tierPlan === 'pro' || currentTenant.tierPlan === 'agency' 
              ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300' 
              : currentTenant.tierPlan === 'free' 
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300' 
                : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/50 dark:hover:to-indigo-900/50 text-[#5D3FD3] dark:text-purple-300 border border-purple-200/90 dark:border-purple-800/80 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
            title="Voice AI Assistant (Alt + V)"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice AI</span>
            <span className="text-[10px] font-mono bg-purple-200/80 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 px-1.5 py-0.2 rounded-md font-bold">
              Alt+V
            </span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Functional Notification Center Bell & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-[#5D3FD3] dark:hover:text-purple-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl transition-all relative border border-slate-200/80 dark:border-slate-700/80"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Notifications Popover Menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden font-['Inter'] animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#5D3FD3] dark:bg-purple-600 text-white px-1.5 py-0.2 rounded-full font-mono font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#5D3FD3] dark:text-purple-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-3.5 flex items-start gap-3 transition-colors ${n.unread ? 'bg-purple-50/40 dark:bg-purple-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
                        {n.type === 'info' && <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />}
                        {n.type === 'security' && <ShieldCheck className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{n.title}</h4>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">{n.message}</p>
                      </div>

                      <button
                        onClick={() => handleDismissNotification(n.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded transition-colors cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No notifications right now
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={() => setNotifications([])}
                    className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-semibold cursor-pointer"
                  >
                    Clear All Notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

        {/* User Account Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-[#5D3FD3] dark:hover:border-purple-400 transition-all cursor-pointer bg-white dark:bg-slate-800 shadow-2xs"
            title="User Account Menu"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#5D3FD3] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">{activeEmail}</div>
              </div>

              <div className="py-1">
                {onOpenUserProfile && (
                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); onOpenUserProfile(); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-[#5D3FD3] dark:hover:text-purple-300 flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </button>
                )}
                {onReturnToPublic && (
                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); onReturnToPublic(); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-[#5D3FD3] dark:hover:text-purple-300 flex items-center gap-2 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Visit Public Website</span>
                  </button>
                )}
              </div>

              <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800">
                <ThemeToggle variant="menu-item" />
              </div>

              {onSignOut && (
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); onSignOut(); }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
