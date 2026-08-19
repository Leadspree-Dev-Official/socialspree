import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { 
  Sparkles, 
  Menu, 
  X, 
  ArrowRight, 
  LayoutDashboard, 
  Zap, 
  Shield, 
  Building2, 
  User, 
  ChevronDown 
} from 'lucide-react';

interface PublicNavbarProps {
  onLaunchApp: () => void;
  onOpenCheckout: (planId?: string) => void;
  onInstantDemoLogin?: (role?: 'business_user' | 'super_admin' | 'agency' | 'influencer') => void;
}

// Exactly 3 Nav items requested: Overview, Pricing, About & More
const navItems: { label: string; href: string }[] = [
  { label: 'Overview', href: '#overview' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About & More', href: '#about' },
];

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  onLaunchApp,
  onOpenCheckout,
  onInstantDemoLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle smooth scroll or navigation to anchor
  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/' + href);
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/' + href);
      }
    }
  };

  return (
    <header className={`sticky top-0 z-50 font-['Inter'] transition-all duration-300 ${
      scrolled 
        ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-slate-200/80 shadow-md shadow-purple-500/5 py-2.5' 
        : 'bg-white/75 backdrop-blur-xl border-b border-slate-200/60 py-3.5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand Identity & Logo */}
          <Link 
            to="/"
            onClick={() => {
              if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-3 cursor-pointer group no-underline shrink-0"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5D3FD3] via-[#7952F5] to-[#0066FF] p-0.5 shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="SocialSpree Logo" 
                  className="w-full h-full rounded-[14px] object-cover" 
                />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl text-slate-900 tracking-tight leading-none group-hover:text-[#5D3FD3] transition-colors">
                  SocialSpree
                </span>
                <span className="text-[10px] font-black bg-gradient-to-r from-purple-100 to-indigo-100 text-[#5D3FD3] px-2 py-0.5 rounded-full border border-purple-200/80 uppercase tracking-wider font-mono">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-slate-500 font-semibold leading-none">
                  Multi-Channel Engine
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[9px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 leading-none">
                  v1.1.6
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links: Overview, Pricing, About & More */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 backdrop-blur-md">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-950 hover:bg-white/80 transition-all cursor-pointer border border-transparent hover:border-purple-200/50"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            
            {/* Instant Demo Dropdown Pill */}
            {onInstantDemoLogin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 hover:from-purple-100 hover:to-indigo-100 text-[#5D3FD3] border border-purple-200 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-102 active:scale-98"
                  title="Test Live Demo Workspaces"
                >
                  <Zap className="w-3.5 h-3.5 fill-[#5D3FD3] text-[#5D3FD3]" />
                  <span>Instant Demo</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {demoDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-purple-100 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Select Demo Persona:
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoDropdownOpen(false);
                        onInstantDemoLogin('business_user');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-[#5D3FD3] transition-colors text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <div className="font-bold">Business User</div>
                        <div className="text-[10px] text-slate-400 font-normal">Social media manager</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoDropdownOpen(false);
                        onInstantDemoLogin('agency');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-[#5D3FD3] transition-colors text-left cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-bold">Agency Director</div>
                        <div className="text-[10px] text-slate-400 font-normal">Multi-brand management</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoDropdownOpen(false);
                        onInstantDemoLogin('super_admin');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-[#5D3FD3] transition-colors text-left cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="font-bold">Super Admin</div>
                        <div className="text-[10px] text-slate-400 font-normal">Governance & API keys</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Auth Controls via Clerk */}
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-[#5D3FD3] hover:border-purple-300 hover:bg-purple-50/50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sign In</span>
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] text-white text-xs font-black shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <button
                type="button"
                onClick={onLaunchApp}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5D3FD3] to-[#0066FF] text-white text-xs font-black shadow-md shadow-purple-500/25 hover:shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-300" />
                <span>Launch App</span>
              </button>
              <UserButton />
            </Show>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button 
                  type="button"
                  className="px-3 py-1.5 text-xs font-bold bg-[#5D3FD3] text-white rounded-xl shadow-xs"
                >
                  Sign In
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <UserButton />
            </Show>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-2xl border-b border-slate-200 px-4 py-5 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-[#5D3FD3] transition-all flex items-center justify-between text-left cursor-pointer"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-50" />
              </button>
            ))}
          </div>

          {/* Mobile Quick Action Buttons */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {onInstantDemoLogin && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onInstantDemoLogin('business_user');
                  }}
                  className="py-2 px-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold text-center"
                >
                  🏢 Business
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onInstantDemoLogin('agency');
                  }}
                  className="py-2 px-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold text-center"
                >
                  💼 Agency
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onInstantDemoLogin('super_admin');
                  }}
                  className="py-2 px-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold text-center"
                >
                  🛡️ Admin
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCheckout();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-purple-500/25"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Subscribe & Provision Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
