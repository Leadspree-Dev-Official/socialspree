import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Bot, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube, 
  Video, 
  Facebook, 
  CheckCircle2, 
  Layers,
  Smartphone
} from 'lucide-react';

interface LandingHeroProps {
  onNavigate: (view: string) => void;
  onLaunchApp: () => void;
  onOpenCheckout: (planId?: string) => void;
  onInstantDemoLogin?: (role?: 'business_user' | 'super_admin' | 'agency' | 'influencer') => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onNavigate,
  onLaunchApp,
  onOpenCheckout: _onOpenCheckout,
  onInstantDemoLogin,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'instagram' | 'linkedin' | 'x' | 'youtube' | 'tiktok' | 'facebook'>('instagram');

  const platforms = [
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600', handle: '@apexgrowth', caption: '🚀 Scaling multi-tenant social publishing with SocialSpree API engine! ⚡ #SocialSpree #SaaS' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-800', handle: 'Apex Growth Media', caption: 'Excited to announce our multi-channel social deployment powered by 2-channel Zenith API slots.' },
    { id: 'x', label: 'X (Twitter)', icon: Twitter, color: 'from-slate-800 to-slate-900', handle: '@ApexGrowth_HQ', caption: 'Parallel firing 15+ social channels in under 2 seconds. Zero API throttling! 🌐' },
    { id: 'youtube', label: 'YouTube Shorts', icon: Youtube, color: 'from-red-600 to-red-700', handle: 'Apex Agency HQ', caption: 'Check out our latest product breakdown! Full HD Cloudflare CDN video delivery.' },
    { id: 'tiktok', label: 'TikTok', icon: Video, color: 'from-teal-400 to-slate-900', handle: '@apex_official', caption: 'Automated video distribution for 30+ client brands effortlessly 🔥 #viral' },
    { id: 'facebook', label: 'Facebook Page', icon: Facebook, color: 'from-blue-500 to-indigo-600', handle: 'Apex Digital Agency', caption: 'Google Review auto-replies and multi-channel marketing campaigns live now.' },
  ];

  const currentPlatform = platforms.find(p => p.id === activePreviewTab) || platforms[0];

  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-b from-purple-50/60 via-slate-50/40 to-white font-['Inter']">
      
      {/* Background Radial Glow Decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-purple-300/30 to-blue-300/30 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-2xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Hero Header Block */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Animated Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-purple-200/80 shadow-xs hover:border-purple-300 transition-all cursor-pointer"
               onClick={() => onNavigate('features')}>
            <span className="flex h-2 w-2 rounded-full bg-[#5D3FD3] animate-ping" />
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>🚀 SocialSpree SaaS Engine v2.0</span>
              <span className="text-purple-300">•</span>
              <span className="text-[#5D3FD3]">Multi-Channel Parallel Publishing</span>
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Publish to <span className="bg-gradient-to-r from-[#5D3FD3] via-[#0066FF] to-purple-600 bg-clip-text text-transparent">15+ Social Channels</span> at Scale with Parallel API Execution
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
            Connect Instagram, LinkedIn, X, YouTube, TikTok, Facebook & Google Business. Automated scheduling, AI hashtag generator, Cloudflare CDN media storage & instant multi-tenant provisioning.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onInstantDemoLogin ? onInstantDemoLogin('business_user') : onLaunchApp()}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] text-white font-bold text-base shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>Instant Demo Login (1-Click)</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate('pricing')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-300 text-slate-800 hover:text-[#5D3FD3] font-bold text-base shadow-xs hover:shadow-md hover:bg-purple-50/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-[#5D3FD3]" />
              <span>View Interactive Plans & Pricing</span>
            </button>
          </div>

          {/* Key Metrics Row */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
              <div className="text-2xl font-black text-[#5D3FD3]">15+</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Channels Supported</div>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
              <div className="text-2xl font-black text-emerald-600">99.99%</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Uptime SLA Guarantee</div>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
              <div className="text-2xl font-black text-[#0066FF]">2,500+</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">AI Credits Included</div>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
              <div className="text-2xl font-black text-amber-600">0%</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Vendor Lock-in</div>
            </div>
          </div>

        </div>

        {/* Interactive iPhone 16 Pro Device Preview Frame */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xl shadow-purple-900/10">
            
            {/* Device Header Selector Tabs */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#5D3FD3]" />
                <span className="text-sm font-black text-slate-900">iPhone 16 Pro Live Feed Preview</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Live Simulation</span>
              </div>

              {/* Platform Selector Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                {platforms.map((p) => {
                  const Icon = p.icon;
                  const isSelected = activePreviewTab === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActivePreviewTab(p.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated iPhone Frame Content */}
            <div className="mt-6 flex flex-col md:flex-row items-center gap-8">
              
              {/* iPhone Frame */}
              <div className="w-[280px] sm:w-[300px] h-[520px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 relative shrink-0">
                {/* Notch Dynamic Island */}
                <div className="w-24 h-5 bg-black rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800 mr-2" />
                  <div className="w-3 h-3 rounded-full bg-blue-900/60" />
                </div>

                {/* iPhone Screen Content */}
                <div className="bg-slate-900 text-white rounded-[36px] h-[456px] overflow-hidden flex flex-col p-4 relative">
                  
                  {/* Account Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentPlatform.color} flex items-center justify-center font-bold text-xs`}>
                        AG
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">{currentPlatform.handle}</div>
                        <div className="text-[9px] text-slate-400 font-mono">Via SocialSpree API</div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>

                  {/* Media Content Preview */}
                  <div className="my-3 rounded-2xl bg-gradient-to-br from-purple-900/50 to-blue-900/50 p-4 border border-purple-500/20 flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80')` }}></div>
                    <div className="relative z-10 flex justify-between items-start">
                      <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full uppercase">
                        {currentPlatform.label}
                      </span>
                      <span className="text-[10px] font-mono bg-emerald-500/80 px-2 py-0.5 rounded-full font-bold">
                        Published
                      </span>
                    </div>

                    <div className="relative z-10 space-y-1 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10">
                      <p className="text-xs font-medium text-slate-200 line-clamp-3">
                        {currentPlatform.caption}
                      </p>
                      <div className="text-[10px] text-purple-300 font-mono flex items-center gap-1 pt-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Cloud Native Exec • 200ms dispatch</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>❤️ 1,482 Likes</span>
                    <span>💬 94 Comments</span>
                    <span>🔁 312 Retweets</span>
                  </div>

                </div>
              </div>

              {/* iPhone Side Feature Highlights */}
              <div className="flex-1 space-y-4">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                  <div className="p-2 bg-purple-600 text-white rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">2-Channel API Slot Architecture</h4>
                    <p className="text-xs text-slate-600 mt-1">Each Super Admin allocated slot manages 2 isolated social channels, guaranteeing clean API token segregation.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Parallel Multi-Key Dispatch</h4>
                    <p className="text-xs text-slate-600 mt-1">Fire instant posts across Instagram, X, LinkedIn, YouTube, TikTok, and Facebook simultaneously without request queuing.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">AI Viral Hashtag & Review Engine</h4>
                    <p className="text-xs text-slate-600 mt-1">Generate viral captions and auto-respond to Google Business reviews with built-in AI credit ledger tracking.</p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={onLaunchApp}
                    className="px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <span>Test Drive Live Workspace</span>
                    <ArrowRight className="w-4 h-4 text-purple-400" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
