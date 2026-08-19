import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  Bot, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube, 
  Video, 
  Facebook, 
  CheckCircle2, 
  Layers, 
  Smartphone, 
  Target, 
  CalendarDays, 
  BarChart3, 
  Users, 
  ShieldCheck, 
  Workflow, 
  Clock3, 
  LockKeyhole, 
  Globe2, 
  PlayCircle,
  Send,
  Check,
  Building2,
  Share2,
  RefreshCw,
  Sliders,
  Shield,
  MessageSquare,
  Key,
  Star,
  Quote,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { SubscriptionPlan, CurrencyCode } from '../../types';
import { INITIAL_PLANS, SUPER_ADMIN_EMAIL } from '../../lib/store';
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
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'tiktok' | 'linkedin' | 'x' | 'youtube' | 'facebook'>('instagram');
  const [demoCaption, setDemoCaption] = useState('Scaling our client agency accounts with SocialSpree parallel multi-channel dispatch! 🚀 Real-time Cloudflare video delivery & AI viral hashtags. #SaaS #AgencyGrowth #SocialMedia');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['instagram', 'tiktok', 'linkedin']);
  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  const channelConfigs = [
    { id: 'instagram', label: 'Instagram Reel', icon: Instagram, color: 'from-pink-500 via-rose-500 to-purple-600', handle: '@apexgrowth', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', networkBadge: 'REEL 9:16' },
    { id: 'tiktok', label: 'TikTok Video', icon: Video, color: 'from-teal-400 via-slate-900 to-black', handle: '@apex_creator', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', networkBadge: 'TIKTOK HD' },
    { id: 'linkedin', label: 'LinkedIn Post', icon: Linkedin, color: 'from-blue-600 to-blue-800', handle: 'Apex Growth Media Inc.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', networkBadge: 'B2B ARTICLE' },
    { id: 'x', label: 'X (Twitter)', icon: Twitter, color: 'from-slate-800 to-slate-950', handle: '@ApexGrowthHQ', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', networkBadge: 'THREAD' },
    { id: 'youtube', label: 'YouTube Shorts', icon: Youtube, color: 'from-red-600 to-red-700', handle: 'Apex Studios Official', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', networkBadge: 'SHORTS 4K' },
    { id: 'facebook', label: 'Facebook Page', icon: Facebook, color: 'from-blue-500 to-indigo-600', handle: 'Apex Digital Agency', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', networkBadge: 'COMMUNITY' },
  ];

  const currentChannel = channelConfigs.find(c => c.id === activePlatform) || channelConfigs[0];

  const toggleChannel = (id: string) => {
    if (selectedChannels.includes(id)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter(c => c !== id));
      }
    } else {
      setSelectedChannels([...selectedChannels, id]);
    }
  };

  const handleSimulateDispatch = () => {
    setIsSimulatingDispatch(true);
    setDispatchedSuccess(false);
    setTimeout(() => {
      setIsSimulatingDispatch(false);
      setDispatchedSuccess(true);
      setTimeout(() => setDispatchedSuccess(false), 3500);
    }, 1200);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] font-['Inter'] selection:bg-[#5D3FD3] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. OVERVIEW HERO SECTION (#overview) */}
      {/* ========================================================================= */}
      <section id="overview" className="relative overflow-hidden bg-gradient-to-b from-purple-50/60 via-white to-slate-50 pt-10 pb-20 sm:pt-16 sm:pb-28">
        
        {/* Background Ambient Glow Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#5D3FD3]/20 to-[#0066FF]/20 rounded-full blur-3xl opacity-70 animate-pulse" />
          <div className="absolute top-48 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-pink-400/15 to-purple-600/15 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Hero Header */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Animated Announcement Pill */}
            <div 
              onClick={() => scrollToSection('features')}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-purple-200/90 shadow-md shadow-purple-500/5 hover:border-purple-300 hover:scale-102 transition-all cursor-pointer group"
            >
              <span className="flex h-2 w-2 rounded-full bg-[#5D3FD3] animate-ping" />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-300" />
                <span>SocialSpree Zenith Engine v2.0</span>
                <span className="text-slate-300">•</span>
                <span className="text-[#5D3FD3] group-hover:underline">Explore 6 Core Pillars</span>
                <ArrowRight className="w-3 h-3 text-[#5D3FD3] group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-950 tracking-tight leading-[1.08]">
              Publish to <span className="bg-gradient-to-r from-[#5D3FD3] via-[#7B42F6] to-[#0066FF] bg-clip-text text-transparent">15+ Social Channels</span> in Parallel from One Workspace
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
              Multi-tenant B2B social automation built for marketing agencies and brands. Isolated 2-channel API keys, Cloudflare CDN media storage, and AI viral hashtag generators.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection('pricing')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] hover:from-purple-700 hover:to-blue-600 text-white font-black text-sm shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/35 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>View Plans & Pricing</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onInstantDemoLogin && (
                <button
                  type="button"
                  onClick={() => onInstantDemoLogin('business_user')}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-purple-300 text-slate-800 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#5D3FD3] fill-[#5D3FD3]" />
                  <span>1-Click Instant Demo</span>
                </button>
              )}
            </div>

            {/* Guarantees Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>No Credit Card Required for Demo</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Isolated Tenant API Slots</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Instant Parallel Key Firing</span>
              </span>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* INTERACTIVE OMNICHANNEL PLAYGROUND */}
          {/* ========================================================================= */}
          <div className="mt-14 sm:mt-18 max-w-6xl mx-auto">
            <div className="relative rounded-3xl bg-slate-900 text-white p-4 sm:p-8 border border-slate-800 shadow-2xl overflow-hidden">
              
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    LIVE INTERACTIVE COMPOSER & IPHONE PREVIEW
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">CHANNELS:</span>
                  {channelConfigs.map(c => {
                    const Icon = c.icon;
                    const isSelected = selectedChannels.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleChannel(c.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected 
                            ? 'bg-[#5D3FD3] text-white shadow-xs' 
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="hidden md:inline">{c.label.split(' ')[0]}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2-Column Split */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Left: Composer */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-5 bg-slate-950/60 p-5 sm:p-6 rounded-2xl border border-slate-800/80">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        COMPOSE MULTI-CHANNEL DISPATCH
                      </span>
                      <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                        {selectedChannels.length} Connected Engines Firing
                      </span>
                    </div>

                    <textarea
                      rows={4}
                      value={demoCaption}
                      onChange={(e) => setDemoCaption(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#5D3FD3] font-sans resize-none leading-relaxed"
                      placeholder="Type a post caption or campaign update..."
                    />

                    {/* Quick AI Hooks */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">AI HOOKS:</span>
                      <button
                        type="button"
                        onClick={() => setDemoCaption("🚀 Unlocking 10x social reach with automated Cloudflare video delivery & isolated 2-channel slot management! ⚡ #SocialMedia #SaaS #Growth")}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        🚀 Launch Post
                      </button>
                      <button
                        type="button"
                        onClick={() => setDemoCaption("💡 3 strategies top digital agencies use to manage 40+ client accounts without API rate limit collisions. #AgencyTips #Automation")}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        💡 Growth Tips
                      </button>
                      <button
                        type="button"
                        onClick={() => setDemoCaption("⭐ Google Reviews + multi-platform sync live in under 200ms. Scale your agency infrastructure today! #SaaS #B2B")}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        ⭐ Reviews Sync
                      </button>
                    </div>
                  </div>

                  {/* Dispatch Bar */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 font-mono">
                      Parallel Latency: <span className="text-emerald-400 font-bold">~140ms</span>
                    </div>

                    <button
                      type="button"
                      disabled={isSimulatingDispatch}
                      onClick={handleSimulateDispatch}
                      className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                        dispatchedSuccess
                          ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                          : 'bg-[#5D3FD3] hover:bg-purple-600 text-white shadow-purple-500/25'
                      }`}
                    >
                      {isSimulatingDispatch ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching to {selectedChannels.length} Channels...</span>
                        </>
                      ) : dispatchedSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>Dispatched to {selectedChannels.length} Networks! ✓</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Simulate Parallel Dispatch</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right: Phone Shell */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1.5 mb-3 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                    {channelConfigs.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setActivePlatform(c.id as any)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          activePlatform === c.id 
                            ? 'bg-[#5D3FD3] text-white shadow-xs' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {c.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  <div className="w-full max-w-[290px] bg-black rounded-[40px] p-3 border-4 border-slate-700 shadow-2xl shadow-purple-950/40 relative">
                    <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-slate-950 mr-2" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                    </div>

                    <div className="bg-slate-950 rounded-[30px] p-3.5 text-white text-xs space-y-3 min-h-[300px] flex flex-col justify-between border border-slate-900">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-2">
                          <img 
                            src={currentChannel.avatar} 
                            alt={currentChannel.handle} 
                            className="w-7 h-7 rounded-full object-cover border border-purple-500" 
                          />
                          <div>
                            <div className="text-[11px] font-bold text-white truncate max-w-[120px]">
                              {currentChannel.handle}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              {currentChannel.networkBadge}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                          LIVE
                        </span>
                      </div>

                      <div className="w-full h-28 rounded-xl bg-gradient-to-tr from-purple-900/60 via-slate-900 to-indigo-900/60 border border-purple-800/40 flex items-center justify-center relative overflow-hidden">
                        <div className="text-center p-3">
                          <PlayCircle className="w-8 h-8 text-purple-300 mx-auto opacity-80" />
                          <span className="text-[10px] text-slate-300 font-mono block mt-1">
                            Cloudflare HD CDN Media
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-200 leading-snug font-sans line-clamp-3">
                        {demoCaption || 'Your live caption will appear here in real time...'}
                      </div>

                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>❤️ 1,429 likes</span>
                        <span>💬 84 comments</span>
                        <span>🔄 312 shares</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Live Metrics Counter Bar */}
          <div className="mt-16 sm:mt-24 pt-10 border-t border-slate-200/80">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:border-purple-200 transition-all">
                <div className="text-3xl sm:text-4xl font-black text-[#5D3FD3] font-mono">500+</div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Agencies & Brand Workspaces</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Isolated multi-tenant accounts</p>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:border-purple-200 transition-all">
                <div className="text-3xl sm:text-4xl font-black text-[#0066FF] font-mono">1.2M+</div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Multi-Channel Dispatches</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Parallel API execution</p>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:border-purple-200 transition-all">
                <div className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono">99.99%</div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Cloudflare CDN Uptime</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Global edge media routing</p>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:border-purple-200 transition-all">
                <div className="text-3xl sm:text-4xl font-black text-purple-700 font-mono">15+</div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 mt-1">Native Social Platforms</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Dual Zenith & CoreSync engine</p>
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
