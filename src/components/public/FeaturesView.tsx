import React, { useState } from 'react';
import { 
  Key, 
  Smartphone, 
  Zap, 
  Bot, 
  Cloud, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Server, 
  Layers,
  Database,
  Star,
  RefreshCw,
  Sliders,
  Send,
  Building2,
  Lock,
  Globe2,
  Cpu,
  Share2,
  HardDrive
} from 'lucide-react';

interface FeaturesViewProps {
  onOpenCheckout: (planId?: string) => void;
  onLaunchApp: () => void;
}

export const FeaturesView: React.FC<FeaturesViewProps> = ({
  onOpenCheckout,
  onLaunchApp,
}) => {
  const [selectedSlotCount, setSelectedSlotCount] = useState<number>(3);
  const [aiPromptDemo, setAiPromptDemo] = useState('Create an agency announcement post for client onboarding');
  const [aiResultDemo, setAiResultDemo] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activePreviewPlatform, setActivePreviewPlatform] = useState<'instagram' | 'tiktok' | 'linkedin' | 'x'>('instagram');

  const handleSimulateAi = () => {
    setAiGenerating(true);
    setTimeout(() => {
      setAiResultDemo(`🚀 Excited to onboard our newest enterprise brand to SocialSpree! 100% automated multi-channel publishing with isolated API slot governance and Cloudflare CDN video delivery. ⚡\n\n#DigitalAgency #MarketingAutomation #SaaS #SocialGrowth`);
      setAiGenerating(false);
    }, 700);
  };

  const featurePillars = [
    {
      id: 'api-slots',
      title: 'Isolated 2-Channel API Slots',
      subtitle: 'Zero cross-contamination or quota collisions across client accounts',
      icon: Key,
      badge: 'Multi-Tenant Core',
      color: 'from-[#5D3FD3] to-purple-600',
      description: 'Each workspace tenant is provisioned with dedicated 2-channel API slot boundaries. 1 Slot = 2 Channels firing in parallel, ensuring complete rate limit isolation.',
      highlights: [
        'Isolated secret credentials per tenant',
        'Strict 2-channel boundary per slot group',
        'Dynamic slot upgrades via Super Admin',
        '100% White-Labeled client workspace'
      ]
    },
    {
      id: 'device-preview',
      title: 'Real-Time Hardware Preview',
      subtitle: 'WYSIWYG layout viewport matching authentic iOS display geometry',
      icon: Smartphone,
      badge: 'Visual Precision',
      color: 'from-blue-600 to-indigo-600',
      description: 'Verify aspect ratios, line breaks, Dynamic Island notch geometry, and hashtag readability before triggering parallel network dispatch.',
      highlights: [
        'Instant multi-platform feed switcher',
        'Authentic notch & status bar layout',
        'Image & video aspect crop validation',
        'Platform character limit alerts'
      ]
    },
    {
      id: 'cloud-native',
      title: 'Parallel Async Firing Queue',
      subtitle: 'Concurrent dispatch to 15+ social networks in under 200ms',
      icon: Zap,
      badge: 'Dispatch Engine',
      color: 'from-amber-500 to-orange-600',
      description: 'Fire scheduled or instant posts concurrently across Instagram, TikTok, LinkedIn, YouTube, X, and Facebook with automatic retry mechanisms.',
      highlights: [
        'Simultaneous multi-network dispatch',
        'Background cron worker execution',
        'Idempotent request tracking',
        'Real-time HTTP payload audit trail'
      ]
    },
    {
      id: 'ai-generator',
      title: 'AI Viral Content & Hashtags',
      subtitle: 'Built-in Gemini AI credit engine (10 credits/run) for hooks & tags',
      icon: Bot,
      badge: 'AI Automation',
      color: 'from-pink-500 to-rose-600',
      description: 'Generate high-converting post captions, viral hashtag clusters, and tailored engagement hooks with real-time tenant credit ledger tracking.',
      highlights: [
        'Gemini API prompt engineering',
        'Deducts exactly 10 AI credits per run',
        'Auto-inserts into composer editor',
        'AI credit refill console in Super Admin'
      ]
    },
    {
      id: 'media-vault',
      title: 'Cloudflare CDN & Media Vault',
      subtitle: 'Ultra-fast global edge media storage and video distribution',
      icon: Cloud,
      badge: 'Media Infrastructure',
      color: 'from-cyan-500 to-blue-600',
      description: 'Host video reels, high-resolution carousels, and graphic assets on global Cloudflare edge CDN with unsigned Cloudinary direct uploads.',
      highlights: [
        'Instant CDN video delivery globally',
        'Multi-Cloudinary storage pool manager',
        'Strict tenant media isolation',
        'Enforced CDN links for scheduled posts'
      ]
    },
    {
      id: 'agency-suite',
      title: 'Agency Multi-Brand Suite',
      subtitle: 'Dedicated workspaces, brand colors, and team governance',
      icon: Building2,
      badge: 'Agency Operations',
      color: 'from-purple-700 to-indigo-800',
      description: 'Manage unlimited client brands under one roof. Assign brand colors, logos, channel groupings, and team access without data leakage.',
      highlights: [
        'Isolated multi-brand profiles',
        'Custom brand palettes and logos',
        'Super Admin governance console',
        'Instant role switching for demos'
      ]
    }
  ];

  return (
    <div className="py-16 sm:py-24 bg-gradient-to-b from-purple-50/40 via-white to-slate-50 font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* ========================================================================= */}
        {/* SECTION HEADER */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 text-[#5D3FD3] text-xs font-bold font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>ENTERPRISE ARCHITECTURE</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
            Built for Extreme Throughput & Complete Tenant Isolation
          </h1>
          <p className="text-slate-600 font-medium text-base sm:text-lg leading-relaxed">
            Discover the 6 core pillars that make SocialSpree the premier multi-tenant publishing platform for digital agencies and high-velocity creators.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 6-PILLAR FEATURE BENTO GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featurePillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md hover:shadow-2xl hover:border-purple-300 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Glowing Header Accent */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${pillar.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-[#5D3FD3] transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {pillar.description}
                  </p>

                  {/* Highlights Checklist */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    {pillar.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    Engine SLA: 99.99%
                  </span>
                  <span className="text-xs font-bold text-[#5D3FD3] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE FEATURE PLAYGROUND: API SLOT CALCULATOR */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#5D3FD3]/20 rounded-full blur-3xl -z-0 pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Interactive Slider */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold border border-purple-500/30">
                <Key className="w-3.5 h-3.5 text-amber-300" />
                <span>INTERACTIVE 2-CHANNEL SLOT CALCULATOR</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Scale API Slot Capacity in Real Time
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Move the slider to see how Super Admin provisions isolated 2-channel slot groups for client organizations.
              </p>

              {/* Slider Input */}
              <div className="space-y-3 p-5 bg-slate-950/70 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-slate-400">ALLOCATED API SLOTS:</span>
                  <span className="text-purple-400 text-base">{selectedSlotCount} Slots</span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={10}
                  value={selectedSlotCount}
                  onChange={(e) => setSelectedSlotCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#5D3FD3]"
                />

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>1 Slot (2 Accounts)</span>
                  <span>5 Slots (10 Accounts)</span>
                  <span>10 Slots (20 Accounts)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenCheckout()}
                className="px-6 py-3.5 rounded-xl bg-[#5D3FD3] hover:bg-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Provision {selectedSlotCount} Slots for Your Agency</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right Column: Dynamic Slot Grid Preview */}
            <div className="lg:col-span-6 bg-slate-950/90 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-slate-400">
                  PROVISIONED SLOT CAPACITY BREAKDOWN:
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {selectedSlotCount * 2} Parallel Social Channels
                </span>
              </div>

              {/* Dynamic Slots Pills Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {[...Array(selectedSlotCount)].map((_, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-purple-500/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-purple-300 text-[11px]">SLOT #{idx + 1}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">2 Active Channels</div>
                    <div className="text-[9px] font-mono text-slate-500">Key: ••••••••••••••••</div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-[11px] text-slate-400 leading-relaxed font-sans">
                💡 <strong>White-Label Guarantee:</strong> End client users connect social profiles directly into each assigned slot without ever seeing raw engine credentials.
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
