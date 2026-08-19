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

// Exactly 3 Nav items: Overview, Pricing, About & More
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
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <header className={`sticky top-0 z-50 font-['Inter'] transition-all duration-200 ${
      scrolled 
        ? 'bg-white/92 backdrop-blur-xl border-b border-slate-200/80 shadow-xs' 
        : 'bg-white/80 backdrop-blur-lg border-b border-slate-200/60'
    }`}>
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-13">
          
          {/* Slim Brand Identity & Logo */}
          <Link 
            to="/"
            onClick={() => {
              if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-2 cursor-pointer group no-underline shrink-0"
          >
            <div className="relative">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-[#5D3FD3] to-[#0066FF] p-0.5 shadow-xs group-hover:scale-105 transition-transform flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="SocialSpree Logo" 
                  className="w-full h-full rounded-[6px] object-cover" 
                />
              </div>
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 border border-white"></span>
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base text-slate-900 tracking-tight group-hover:text-[#5D3FD3] transition-colors">
                SocialSpree
              </span>
              <span className="text-[9px] font-black bg-purple-100 text-[#5D3FD3] px-1.5 py-0.2 rounded uppercase font-mono tracking-wider">
                PRO
              </span>
            </div>
          </Link>

          {/* Slim Centered Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/60">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className="px-3.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-white rounded-lg transition-all cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Slim Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            
            {/* Slim Instant Demo Button */}
            {onInstantDemoLogin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#5D3FD3] border border-purple-200/80 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3 h-3 fill-[#5D3FD3] text-[#5D3FD3]" />
                  <span>Instant Demo</span>
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>

                {demoDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-purple-100 rounded-xl shadow-xl p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Demo Personas:
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoDropdownOpen(false);
                        onInstantDemoLogin('business_user');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#5D3FD3] transition-colors text-left cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Business User</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoDropdownOpen(false);
                        onInstantDemoLogin('agency');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#5D3FD3] transition-colors text-left cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Agency Director</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoDropdownOpen(false);
                        onInstantDemoLogin('super_admin');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#5D3FD3] transition-colors text-left cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Super Admin</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Auth Controls */}
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 hover:text-[#5D3FD3] hover:border-purple-200 hover:bg-purple-50/40 text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LayoutDashboard className="w-3 h-3 text-slate-500" />
                  <span>Sign In</span>
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] text-white text-[11px] font-bold shadow-xs hover:shadow-purple-500/20 hover:scale-102 active:scale-98 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Start Free</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <button
                type="button"
                onClick={onLaunchApp}
                className="px-3 py-1 rounded-lg bg-[#5D3FD3] text-white text-[11px] font-bold shadow-xs hover:bg-purple-600 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LayoutDashboard className="w-3 h-3" />
                <span>Launch App</span>
              </button>
              <UserButton />
            </Show>
          </div>

          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-1.5">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button 
                  type="button"
                  className="px-2.5 py-1 text-[11px] font-bold bg-[#5D3FD3] text-white rounded-lg"
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
              className="p-1 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-3.5 py-3 space-y-2.5 shadow-xl animate-in slide-in-from-top-1 duration-150">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleNavClick(item.href)}
                className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#5D3FD3] transition-all flex items-center justify-between text-left cursor-pointer"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-3 h-3 opacity-50" />
              </button>
            ))}
          </div>

          {onInstantDemoLogin && (
            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onInstantDemoLogin('business_user');
                }}
                className="py-1.5 px-1 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold text-center"
              >
                🏢 Business
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onInstantDemoLogin('agency');
                }}
                className="py-1.5 px-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold text-center"
              >
                💼 Agency
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onInstantDemoLogin('super_admin');
                }}
                className="py-1.5 px-1 rounded-lg bg-amber-50 text-amber-800 text-[10px] font-bold text-center"
              >
                🛡️ Admin
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
