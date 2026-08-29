import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube, 
  Video, 
  Facebook 
} from 'lucide-react';
import { SubscriptionPlan, CurrencyCode } from '../../types';
import { INITIAL_PLANS } from '../../lib/store';
import { FeaturesView } from './FeaturesView';
import { PricingView } from './PricingView';
import { TestimonialsView } from './TestimonialsView';
import { AboutContactView } from './AboutContactView';

interface LandingHeroProps {
  onNavigate?: (view: string) => void;
  onLaunchApp: () => void;
  onOpenCheckout: (planId?: string, billingCycle?: 'monthly' | 'yearly', selectedCurrency?: CurrencyCode, currencySymbol?: string) => void;
  onInstantDemoLogin?: (role?: 'business_user' | 'super_admin' | 'agency' | 'influencer') => void;
  plans?: SubscriptionPlan[];
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onNavigate,
  onLaunchApp,
  onOpenCheckout,
  onInstantDemoLogin,
  plans,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] dark:bg-[#090D16] font-['Inter'] selection:bg-[#5D3FD3] selection:text-white transition-colors duration-150">
      
      {/* ========================================================================= */}
      {/* 1. OVERVIEW HERO SECTION (#overview) */}
      {/* ========================================================================= */}
      <section id="overview" className="relative overflow-hidden bg-gradient-to-b from-purple-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-[#090D16] dark:to-[#0B0F17] pt-12 pb-16 sm:pt-16 sm:pb-24">
        
        {/* Background Ambient Glow Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#5D3FD3]/20 to-[#0066FF]/20 dark:from-purple-600/10 dark:to-blue-600/10 rounded-full blur-3xl opacity-70 animate-pulse" />
          <div className="absolute top-36 right-1/4 w-[450px] h-[450px] bg-gradient-to-bl from-pink-400/15 to-purple-600/15 dark:from-pink-500/10 dark:to-purple-800/10 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Hero Header */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Announcement Pill */}
            <div 
              onClick={() => scrollToSection('features')}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800/80 shadow-xs hover:border-purple-300 dark:hover:border-purple-600 hover:scale-102 transition-all cursor-pointer group"
            >
              <span className="flex h-2 w-2 rounded-full bg-[#5D3FD3] dark:bg-purple-400 animate-ping" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-300" />
                <span>SocialSpree Zenith Engine v2.0</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[#5D3FD3] dark:text-purple-300 group-hover:underline">Explore Architecture</span>
                <ArrowRight className="w-3 h-3 text-[#5D3FD3] dark:text-purple-300 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-950 dark:text-white tracking-tight leading-[1.08]">
              Publish to <span className="bg-gradient-to-r from-[#5D3FD3] via-[#7B42F6] to-[#0066FF] dark:from-purple-400 dark:via-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">15+ Social Channels</span> in Parallel from One Workspace
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
              Multi-tenant B2B social automation built for marketing agencies and brands. Isolated 2-channel API keys, Cloudflare CDN media storage, and visual multi-channel scheduling.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection('pricing')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] hover:from-purple-700 hover:to-blue-600 text-white font-black text-sm shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/35 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>View Plans & Pricing</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onInstantDemoLogin && (
                <button
                  type="button"
                  onClick={() => onInstantDemoLogin('business_user')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400 fill-[#5D3FD3] dark:fill-purple-400" />
                  <span>1-Click Instant Demo</span>
                </button>
              )}
            </div>

            {/* Guarantees Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>No Credit Card Required for Demo</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Isolated Tenant API Slots</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Instant Parallel Key Firing</span>
              </span>
            </div>

            {/* Supported Networks Strip */}
            <div className="pt-6 flex items-center justify-center gap-3 flex-wrap text-xs text-slate-400 font-medium">
              <span className="font-mono text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px]">Supported Networks:</span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs">
                <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs">
                <Video className="w-3.5 h-3.5 text-teal-500" /> TikTok
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs">
                <Linkedin className="w-3.5 h-3.5 text-blue-500" /> LinkedIn
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs">
                <Twitter className="w-3.5 h-3.5 text-slate-800 dark:text-slate-200" /> X
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs">
                <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs">
                <Facebook className="w-3.5 h-3.5 text-blue-500" /> Facebook
              </span>
            </div>

          </div>

          {/* Live Metrics Counter Bar */}
          <div className="mt-14 sm:mt-20 pt-10 border-t border-slate-200/80 dark:border-slate-800">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-purple-200 dark:hover:border-purple-800/80 transition-all">
                <div className="text-3xl sm:text-4xl font-black text-[#5D3FD3] dark:text-purple-400 font-mono">500+</div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Agencies & Brand Workspaces</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Isolated multi-tenant accounts</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-purple-200 dark:hover:border-purple-800/80 transition-all">
                <div className="text-3xl sm:text-4xl font-black text-[#0066FF] dark:text-blue-400 font-mono">1.2M+</div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Multi-Channel Dispatches</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Parallel API execution</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-purple-200 dark:hover:border-purple-800/80 transition-all">
                <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">99.99%</div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Cloudflare CDN Uptime</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Global edge media routing</p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-purple-200 dark:hover:border-purple-800/80 transition-all">
                <div className="text-3xl sm:text-4xl font-black text-purple-700 dark:text-purple-300 font-mono">15+</div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">Native Social Platforms</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Dual Zenith & CoreSync engine</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FEATURES & ARCHITECTURE SECTION (#features) */}
      {/* ========================================================================= */}
      <section id="features">
        <FeaturesView 
          onOpenCheckout={(planId) => onOpenCheckout(planId)} 
          onLaunchApp={onLaunchApp} 
        />
      </section>

      {/* ========================================================================= */}
      {/* 3. NORMAL PRICING & CAPACITY CALCULATOR SECTION (#pricing) */}
      {/* ========================================================================= */}
      <section id="pricing">
        <PricingView 
          plans={plans || INITIAL_PLANS} 
          onOpenCheckout={(planId, cycle, curr, sym) => onOpenCheckout(planId, cycle, curr, sym)} 
        />
      </section>

      {/* ========================================================================= */}
      {/* 4. REVIEWS & TESTIMONIALS & FAQ SECTION (#reviews & #faq) */}
      {/* ========================================================================= */}
      <section id="reviews">
        <TestimonialsView />
      </section>

      {/* ========================================================================= */}
      {/* 5. ABOUT & MORE / DIRECT WHATSAPP & SUPPORT SECTION (#about) */}
      {/* ========================================================================= */}
      <section id="about">
        <AboutContactView />
      </section>

    </div>
  );
};
