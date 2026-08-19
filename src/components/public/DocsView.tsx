import React, { useState } from 'react';
import { 
  Rocket, 
  Code, 
  Plug, 
  Layers, 
  BarChart3, 
  ShieldCheck, 
  Mail, 
  MessageCircle, 
  Copy, 
  Check, 
  Terminal, 
  BookOpen,
  Zap,
  Globe
} from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../../lib/store';

export const DocsView: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'typescript' | 'python'>('typescript');
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    typescript: `import { createSocialSpreeClient } from '@socialspree/sdk';

// Initialize with isolated tenant slot key
const spree = createSocialSpreeClient({
  apiKey: process.env.SOCIALSPREE_SLOT_KEY,
  tenantId: 'tenant-apex-growth-prod'
});

// Dispatch post concurrently across multiple social platforms
const response = await spree.posts.publish({
  content: 'Automating multi-channel social publishing with SocialSpree! 🚀 #SaaS',
  platforms: [
    { platform: 'instagram', accountId: 'acc_ig_9921' },
    { platform: 'linkedin', accountId: 'acc_li_4412' },
    { platform: 'twitter', accountId: 'acc_x_1092' }
  ],
  mediaUrls: [
    'https://cdn.socialspree.leadspree.in/media/reel_hd_720.mp4'
  ],
  mediaType: 'video',
  publishNow: true
});

console.log('Dispatched successfully:', response.jobId);`,

    curl: `curl -X POST https://qglhbesenigpspgkgbac.supabase.co/functions/v1/process-publishing-jobs \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TENANT_API_KEY" \\
  -d '{
    "tenantId": "tenant-apex-growth-prod",
    "content": "Automating multi-channel social publishing with SocialSpree! 🚀 #SaaS",
    "platforms": [
      { "platform": "instagram", "accountId": "acc_ig_9921" },
      { "platform": "linkedin", "accountId": "acc_li_4412" }
    ],
    "mediaUrls": ["https://cdn.socialspree.leadspree.in/media/reel_hd_720.mp4"],
    "publishNow": true
  }'`,

    python: `from socialspree import SocialSpreeClient

client = SocialSpreeClient(
    api_key="YOUR_TENANT_API_KEY",
    tenant_id="tenant-apex-growth-prod"
)

result = client.posts.publish(
    content="Automating multi-channel social publishing with SocialSpree! 🚀 #SaaS",
    platforms=[
        {"platform": "instagram", "account_id": "acc_ig_9921"},
        {"platform": "linkedin", "account_id": "acc_li_4412"}
    ],
    media_urls=["https://cdn.socialspree.leadspree.in/media/reel_hd_720.mp4"],
    publish_now=True
)

print(f"Publish job status: {result['status']}")`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[selectedLanguage]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const docCategories = [
    {
      id: 'getting-started',
      title: 'Quickstart & Onboarding',
      description: 'Step-by-step guide to provisioning your first tenant workspace and connecting social accounts.',
      icon: <Rocket className="w-5 h-5 text-white" />,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Guide'
    },
    {
      id: 'api-reference',
      title: 'REST API & Endpoints',
      description: 'Full reference documentation for posts dispatch, schedule queues, and audit log retrieval.',
      icon: <Code className="w-5 h-5 text-white" />,
      color: 'from-purple-500 to-pink-600',
      badge: 'v2.0'
    },
    {
      id: 'multi-tenant',
      title: '2-Channel Slot Architecture',
      description: 'Deep dive into isolated API slot allocation, rate limit protection, and secret key security.',
      icon: <Layers className="w-5 h-5 text-white" />,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Core'
    },
    {
      id: 'webhooks',
      title: 'Webhooks & Auto-Responders',
      description: 'Configuring Instagram and Facebook comment webhooks for automated DM lead generation.',
      icon: <Plug className="w-5 h-5 text-white" />,
      color: 'from-orange-500 to-amber-600',
      badge: 'Webhooks'
    },
    {
      id: 'media-pipeline',
      title: 'Cloudflare CDN Pipeline',
      description: 'Direct unsigned Cloudinary uploads and edge CDN caching for ultra-fast video delivery.',
      icon: <Globe className="w-5 h-5 text-white" />,
      color: 'from-cyan-500 to-blue-600',
      badge: 'Storage'
    },
    {
      id: 'security-compliance',
      title: 'Security & Row-Level Policies',
      description: 'Clerk JWT authentication token bridges and PostgreSQL RLS workspace isolation.',
      icon: <ShieldCheck className="w-5 h-5 text-white" />,
      color: 'from-slate-700 to-slate-900',
      badge: 'Security'
    }
  ];

  return (
    <div className="py-16 sm:py-24 bg-gradient-to-b from-purple-50/40 via-white to-slate-50 font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* ========================================================================= */}
        {/* SECTION HEADER */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 text-[#5D3FD3] text-xs font-bold font-mono">
            <BookOpen className="w-3.5 h-3.5" />
            <span>DEVELOPER DOCUMENTATION & API HUB</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
            Developer Documentation & API
          </h1>

          <p className="text-slate-600 font-medium text-base sm:text-lg leading-relaxed">
            Integrate, automate, and scale multi-tenant publishing workflows with the SocialSpree API and SDK libraries.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE CODE SNIPPET PLAYGROUND */}
        {/* ========================================================================= */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:px-6 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                POST /functions/v1/process-publishing-jobs
              </span>
            </div>

            {/* Language Tabs & Copy Button */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-800 p-1 rounded-xl">
                {(['typescript', 'curl', 'python'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      selectedLanguage === lang
                        ? 'bg-[#5D3FD3] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'typescript' ? 'TypeScript' : lang === 'curl' ? 'cURL' : 'Python'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                title="Copy code snippet"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Body */}
          <div className="p-6 overflow-x-auto font-mono text-xs sm:text-sm text-slate-200 leading-relaxed">
            <pre>
              <code>{codeSnippets[selectedLanguage]}</code>
            </pre>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* DOCUMENTATION CATEGORIES GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {docCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md hover:shadow-xl hover:border-purple-300 transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cat.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 uppercase">
                    {cat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-[#5D3FD3] transition-colors">
                  {cat.title}
                </h3>

                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#5D3FD3]">
                <span>View Documentation</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* DEVELOPER SUPPORT CALLOUT */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Building a Custom Integration?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Our core engineering team can provide private webhook endpoints, SDK wrappers, and dedicated testing slots.
            </p>
          </div>

          <a
            href={`mailto:${SUPER_ADMIN_EMAIL}?subject=Developer%20API%20Integration%20Inquiry`}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#5D3FD3] to-[#0066FF] text-white font-bold text-xs shadow-lg shadow-purple-500/25 shrink-0 transition-transform hover:scale-102 flex items-center gap-2 no-underline"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Engineering ({SUPER_ADMIN_EMAIL})</span>
          </a>
        </div>

      </div>
    </div>
  );
};
