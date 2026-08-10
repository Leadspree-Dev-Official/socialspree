import React, { useState } from 'react';
import { Sparkles, Menu, X, ArrowRight, LayoutDashboard } from 'lucide-react';

export type PublicSubView = 'landing' | 'features' | 'pricing' | 'testimonials' | 'about';

interface PublicNavbarProps {
  currentPublicView: PublicSubView;
  onNavigate: (view: PublicSubView) => void;
  onLaunchApp: () => void;
  onOpenCheckout: (planId?: string) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  currentPublicView,
  onNavigate,
  onLaunchApp,
  onOpenCheckout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PublicSubView; label: string }[] = [
    { id: 'landing', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'about', label: 'About & Contact' },
  ];

  const handleNavClick = (view: PublicSubView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 font-['Inter'] transition-all">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
            onClick={() => handleNavClick('landing')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#5D3FD3] via-[#0066FF] to-purple-400 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
              SS
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-lg sm:text-xl text-slate-900 tracking-tight truncate">SocialSpree</span>
                <span className="hidden sm:inline text-[10px] font-bold bg-purple-100 text-[#5D3FD3] px-2 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider font-mono">
                  PRO
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 font-medium mt-0.5">Multi-Channel SaaS Engine</p>
              <div className="hidden sm:block mt-0.5">
                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md border border-amber-200 uppercase tracking-wider font-mono inline-block">
                  BETA v1.1.6
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60">
            {navItems.map((item) => {
              const isActive = currentPublicView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                    isActive
                      ? 'bg-white text-[#5D3FD3] shadow-sm shadow-slate-200 border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {item.label}
                  {isActive && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#5D3FD3]" />}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onLaunchApp}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-[#5D3FD3] hover:border-purple-200 hover:bg-purple-50/50 text-xs font-bold transition-all flex items-center gap-2"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Sign In / Dashboard</span>
            </button>
            <button
              onClick={onLaunchApp}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#5D3FD3] to-[#0066FF] text-white text-xs font-bold shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Launch Workspace Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="md:hidden flex items-center gap-1.5 shrink-0">
            <button
              onClick={onLaunchApp}
              className="px-3 py-2 min-h-10 text-xs font-bold bg-[#5D3FD3] text-white rounded-xl shadow-sm"
            >
              Sign In
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 min-h-10 min-w-10 rounded-xl text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors flex items-center justify-center"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-4 shadow-xl max-h-[calc(100vh-64px)] overflow-y-auto">
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-all min-h-12 ${
                  currentPublicView === item.id
                    ? 'bg-purple-50 text-[#5D3FD3] border border-purple-100'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchApp();
              }}
              className="w-full py-3.5 px-4 min-h-12 rounded-xl border border-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-purple-600" />
              Sign In to SaaS Workspace
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCheckout();
              }}
              className="w-full py-3.5 px-4 min-h-12 rounded-xl bg-gradient-to-r from-[#5D3FD3] to-[#0066FF] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Subscribe & Provision Tenant
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
