import React from 'react';
import { 
  Key, 
  Smartphone, 
  Zap, 
  Calendar, 
  Cloud, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Cpu 
} from 'lucide-react';

interface FeaturesViewProps {
  onOpenCheckout: (planId?: string) => void;
  onLaunchApp: () => void;
}

export const FeaturesView: React.FC<FeaturesViewProps> = ({
  onOpenCheckout,
  onLaunchApp,
}) => {
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
      subtitle: 'Concurrent dispatch to 12+ social networks in under 200ms',
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
      id: 'calendar-queue',
      title: 'Visual Interactive Content Calendar',
      subtitle: 'Multi-timezone drag-and-drop scheduling & automated queues',
      icon: Calendar,
      badge: 'Calendar & Queue',
      color: 'from-pink-500 to-rose-600',
      description: 'Effortlessly plan weeks of content in advance with visual monthly/weekly calendar grids, recurring posting slots, and automated background queue workers.',
      highlights: [
        'Interactive calendar drag-and-drop',
        'Custom recurring time slot rules',
        'Automated background cron triggers',
        'Multi-timezone client sync'
      ]
    },
    {
      id: 'media-vault',
      title: 'Cloudinary CDN & Media Vault',
      subtitle: 'Ultra-fast global edge media storage and video distribution',
      icon: Cloud,
      badge: 'Media Infrastructure',
      color: 'from-cyan-500 to-blue-600',
      description: 'Host video reels, high-resolution carousels, and graphic assets on Cloudinary global edge CDN with signed, server-verified uploads.',
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
    <div className="py-16 sm:py-24 bg-gradient-to-b from-purple-50/40 via-white to-slate-50 dark:from-[#0B0F17] dark:via-[#090D16] dark:to-[#0B0F17] font-['Inter'] transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 text-xs font-bold font-mono border border-purple-200/60 dark:border-purple-800/60">
            <Cpu className="w-3.5 h-3.5" />
            <span>ENTERPRISE ARCHITECTURE</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Built for Extreme Throughput & Complete Tenant Isolation
          </h2>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-base sm:text-lg leading-relaxed">
            Discover the 6 core pillars that make SocialSpree the premier multi-tenant publishing platform for digital agencies and high-velocity creators.
          </p>
        </div>

        {/* 6-Pillar Feature Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featurePillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Glowing Header Accent */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${pillar.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-800/80">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-[#5D3FD3] dark:group-hover:text-purple-400 transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {pillar.description}
                  </p>

                  {/* Highlights Checklist */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    {pillar.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">
                    Engine SLA: 99.99%
                  </span>
                  <span className="text-xs font-bold text-[#5D3FD3] dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
