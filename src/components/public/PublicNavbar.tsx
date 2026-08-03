import React, { useState } from 'react';
import { Sparkles, Menu, X, ArrowRight, LayoutDashboard, ShieldCheck } from 'lucide-react';

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
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 font-['Inter'] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Badge */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('landing')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5D3FD3] via-[#0066FF] to-purple-400 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
              SS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-slate-900 tracking-tight">SocialSpree</span>
                <span className="text-[10px] font-bold bg-purple-100 text-[#5D3FD3] px-2 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider font-mono">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-slate-500 font-medium">Multi-Channel SaaS Engine</p>
                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md border border-amber-200 uppercase tracking-wider font-mono">
                  BETA v1.1.5
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
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
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#5D3FD3]"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Right CTAs */}
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onLaunchApp}
              className="px-3 py-1.5 text-xs font-bold bg-[#5D3FD3] text-white rounded-lg"
            >
              App
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-6 space-y-4 shadow-xl">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  currentPublicView === item.id
                    ? 'bg-purple-50 text-[#5D3FD3] border border-purple-100'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchApp();
              }}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-purple-600" />
              Sign In to SaaS Workspace
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCheckout();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#5D3FD3] to-[#0066FF] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md"
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
