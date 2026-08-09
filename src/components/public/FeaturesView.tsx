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
  Sliders
} from 'lucide-react';

interface FeaturesViewProps {
  onOpenCheckout: (planId?: string) => void;
  onLaunchApp: () => void;
}

export const FeaturesView: React.FC<FeaturesViewProps> = ({
  onOpenCheckout,
  onLaunchApp,
}) => {
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);
  const [activeTabSlotDemo, setActiveTabSlotDemo] = useState<number>(1);
  const [aiPromptDemo, setAiPromptDemo] = useState('Create an engaging launch post for a SaaS social media publishing tool');
  const [aiResultDemo, setAiResultDemo] = useState<string | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleSimulateAi = () => {
    setAiGenerating(true);
    setTimeout(() => {
      setAiResultDemo(`🚀 Scale your agency's social presence with SocialSpree! Multi-channel parallel publishing, Cloudflare CDN media storage, and AI-powered viral hashtag generation.\n\n#SaaS #SocialMediaMarketing #AgencyGrowth #Automation #TechTool`);
      setAiGenerating(false);
    }, 800);
  };

  const featurePillars = [
    {
      id: 'api-slots',
      title: 'Multi-Tenant 2-Channel API Slot Allocation',
      subtitle: 'Isolated secret keys per tenant with strict 2-channel boundary per slot',
      icon: Key,
      badge: 'Architecture Core',
      color: 'from-[#5D3FD3] to-purple-600',
      description: 'Each tenant receives isolated Zenith API slots configured by Super Admin. 1 API Slot allocates exactly 2 social media channels, eliminating rate limit collisions across tenant workloads.',
      highlights: [
        'Isolated secret API keys per tenant workspace',
        'Strict 2-channel boundary (1 slot = 2 accounts)',
        'Dynamic slot upgrade & expansion via Super Admin',
        'Zero cross-tenant key leakage or quota overlap'
      ]
    },
    {
      id: 'device-preview',
      title: 'Interactive iPhone 16 Pro Live Feed Preview',
      subtitle: 'WYSIWYG preview frame across Instagram, LinkedIn, X, TikTok, YouTube & Facebook',
      icon: Smartphone,
      badge: 'Visual Editor',
      color: 'from-blue-600 to-indigo-600',
      description: 'Validate post formatting, aspect ratios, line breaks, and hashtag layout in an authentic iPhone 16 Pro viewport before firing to live social channels.',
      highlights: [
        'Real-time multi-platform feed switching',
        'Authentic iOS notch & display geometry',
        'Media crop ratio validation (1:1, 9:16, 16:9)',
        'Character count limit warnings per platform'
      ]
    },
    {
      id: 'cloud-native',
      title: 'Parallel Key Firing & Cloud Native Execution',
      subtitle: 'Instant dispatch or background cron job worker execution',
      icon: Zap,
      badge: 'Execution Engine',
      color: 'from-amber-500 to-orange-600',
      description: 'Fire posts to 10+ social accounts simultaneously using async multi-threaded parallel requests. Scheduled posts run via background Cloud Native cron workers.',
      highlights: [
        'Instant multi-channel parallel request dispatch',
        'Background cron job scheduled post execution',
        'Automatic retry on temporary HTTP failures (503/504)',
        'Real-time status tracking: Draft -> Scheduled -> Published'
      ]
    },
    {
      id: 'ai-generator',
      title: 'AI Viral Content & Hashtag Generator',
      subtitle: 'Built-in AI credit ledger (10 credits per generation) for captions & tags',
      icon: Bot,
      badge: 'AI Engine',
      color: 'from-purple-600 to-pink-600',
      description: 'Generate high-converting post captions, tailored call-to-actions, and optimized viral hashtag clusters with built-in credit ledger tracking.',
      highlights: [
        'Gemini AI API integration with prompt tuning',
        'Deducts exactly 10 AI credits per generation',
        'Automatic AI Credit Log audit trail',
        'Super Admin manual AI credit top-up support'
      ]
    },
    {
      id: 'dual-cdn',
      title: 'Dual Media CDN Infrastructure (Cloudflare + Cloudinary)',
      subtitle: 'Public R2 domain delivery & multi-account Cloudinary storage pool manager',
      icon: Cloud,
      badge: 'Media Pipeline',
      color: 'from-[#0066FF] to-cyan-600',
      description: 'High-speed global media distribution powered by Cloudflare R2 public bucket delivery and multi-account Cloudinary fallback pool.',
      highlights: [
        'Cloudflare R2 Public Domain (https://pub-4921029102.r2.dev)',
        'Multi-Cloudinary account pool managed by Super Admin',
        'Automatic image optimization & video transcoding',
        'Tenant-level custom CDN domain overrides'
      ]
    },
    {
      id: 'review-responder',
      title: 'Google Review AI Responder & Audit Logs',
      subtitle: 'Automated review sentiment analysis and HTTP request audit trail',
      icon: FileText,
      badge: 'Reputation & Audit',
      color: 'from-emerald-600 to-teal-600',
      description: 'Monitor Google Business reviews, categorize sentiment (Positive / Neutral / Negative), and trigger AI-generated responses with full HTTP request payload logging.',
      highlights: [
        'Automated sentiment classification & star rating filter',
        'One-click AI response generation',
        'Complete HTTP payload request/response audit logs',
        'Filter logs by execution mode (Instant, Cron, Cloud Native)'
      ]
    }
  ];

  const currentFeature = featurePillars[selectedFeatureIndex];

  return (
    <div className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-[#5D3FD3] text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PLATFORM CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            6 Core Feature Pillars Built for Enterprise Scale
          </h2>
          <p className="text-slate-600 font-medium text-base sm:text-lg">
            Everything digital agencies and SaaS providers need to manage multi-tenant social media publishing with zero operational friction.
          </p>
        </div>

        {/* Feature Cards Grid (6 Pillars) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featurePillars.map((feature, idx) => {
            const Icon = feature.icon;
            const isSelected = selectedFeatureIndex === idx;
            return (
              <div
                key={feature.id}
                onClick={() => setSelectedFeatureIndex(idx)}
                className={`bg-white rounded-3xl p-6 sm:p-8 border transition-all cursor-pointer flex flex-col justify-between relative group ${
                  isSelected
                    ? 'border-[#5D3FD3] shadow-xl shadow-purple-500/10 ring-2 ring-purple-500/20'
                    : 'border-slate-200/80 hover:border-purple-300 hover:shadow-lg'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feature.color} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-[#5D3FD3] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#5D3FD3] mt-1">
                    {feature.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  {feature.highlights.slice(0, 2).map((h, hIdx) => (
                    <div key={hIdx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                  
                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#5D3FD3]">
                    <span>Explore Feature Sandbox</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Sandbox Preview Block */}
        <div className="mt-16 bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-8 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Interactive Demo
                </span>
                <span className="text-xs text-slate-400 font-mono">Pillar #{selectedFeatureIndex + 1} of 6</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mt-2 text-white">
                {currentFeature.title}
              </h3>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                {currentFeature.description}
              </p>
            </div>

            <button
              onClick={onLaunchApp}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#5D3FD3] to-[#0066FF] text-white text-xs font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2 shrink-0"
            >
              <span>Launch App to Test</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dynamic Interactive Sandbox Body depending on selectedFeatureIndex */}
          <div className="mt-8">
            {selectedFeatureIndex === 0 && (
              <div className="space-y-4">
                <div className="text-xs font-mono text-purple-300 font-bold uppercase tracking-wider">
                  Live API Slot Allocator Preview
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((slotNum) => (
                    <div 
                      key={slotNum}
                      onClick={() => setActiveTabSlotDemo(slotNum)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        activeTabSlotDemo === slotNum
                          ? 'bg-purple-900/40 border-purple-500'
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-sm text-purple-300">API Slot #{slotNum}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                          2 Channels Active
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-2 truncate">
                        Key: provisioned securely by backend
                      </div>
                      <div className="mt-3 text-[11px] text-slate-300 flex justify-between border-t border-slate-700/60 pt-2">
                        <span>Connected: Instagram, LinkedIn</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedFeatureIndex === 3 && (
              <div className="space-y-4 max-w-2xl">
                <div className="text-xs font-mono text-purple-300 font-bold uppercase tracking-wider">
                  Test AI Viral Caption & Hashtag Generator (-10 AI Credits)
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPromptDemo}
                    onChange={(e) => setAiPromptDemo(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    placeholder="Enter prompt..."
                  />
                  <button
                    onClick={handleSimulateAi}
                    disabled={aiGenerating}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-purple-500 transition-colors"
                  >
                    {aiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                    <span>Generate</span>
                  </button>
                </div>
                {aiResultDemo && (
                  <div className="p-4 rounded-2xl bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-purple-200 whitespace-pre-wrap">
                    {aiResultDemo}
                  </div>
                )}
              </div>
            )}

            {selectedFeatureIndex !== 0 && selectedFeatureIndex !== 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentFeature.highlights.map((h, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200">{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
