import React, { useState } from 'react';
import { 
  Sparkles, ArrowRight, Zap, Bot, Instagram, Linkedin, Twitter, Youtube, Video, Facebook,
  CheckCircle2, Layers, Smartphone, Target, CalendarDays, BarChart3, Users, ShieldCheck,
  Workflow, MessageSquare, Clock3, LockKeyhole, Globe2, PlayCircle
} from 'lucide-react';
import { PublicSubView } from './PublicNavbar';

interface LandingHeroProps {
  onNavigate: (view: PublicSubView) => void;
  onLaunchApp: () => void;
  onOpenCheckout: (planId?: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onNavigate, onLaunchApp, onOpenCheckout }) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'instagram' | 'linkedin' | 'x' | 'youtube' | 'tiktok' | 'facebook'>('instagram');

  const platforms = [
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600', handle: '@apexgrowth', caption: '🚀 Scaling multi-tenant social publishing with SocialSpree API engine! ⚡ #SocialSpree #SaaS' },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-800', handle: 'Apex Growth Media', caption: 'Excited to announce our multi-channel social deployment powered by isolated provider slots.' },
    { id: 'x', label: 'X', icon: Twitter, color: 'from-slate-800 to-slate-900', handle: '@ApexGrowth_HQ', caption: 'Plan once. Schedule once. Publish across connected channels from one workspace. 🌐' },
    { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'from-red-600 to-red-700', handle: 'Apex Agency HQ', caption: 'Our latest product breakdown is ready for distribution from the SocialSpree calendar.' },
    { id: 'tiktok', label: 'TikTok', icon: Video, color: 'from-teal-400 to-slate-900', handle: '@apex_official', caption: 'Automated content distribution for multiple client brands from one operating system. 🔥' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'from-blue-500 to-indigo-600', handle: 'Apex Digital Agency', caption: 'One workspace for content, scheduling, publishing history, media and team workflows.' },
  ];
  const currentPlatform = platforms.find(p => p.id === activePreviewTab) || platforms[0];

  const workflow = [
    { icon: Target, title: 'Plan', text: 'Build campaigns, captions and platform-ready content in one workspace.' },
    { icon: Layers, title: 'Create', text: 'Use the composer, reusable media and AI-assisted content tools.' },
    { icon: CalendarDays, title: 'Schedule', text: 'Choose the channels, date and time without maintaining separate calendars.' },
    { icon: Zap, title: 'Publish', text: 'Let the server-side publishing engine process each destination.' },
    { icon: BarChart3, title: 'Review', text: 'Track publishing history, failures, activity and performance signals.' },
  ];

  const useCases = [
    { icon: Users, title: 'Marketing Agencies', text: 'Separate client workspaces, account connections, content and publishing operations without mixing customer data.' },
    { icon: Globe2, title: 'Growing Brands', text: 'Run your social presence from one place as your number of channels and campaigns increases.' },
    { icon: Bot, title: 'Content Teams', text: 'Speed up caption and hashtag creation while keeping final publishing decisions with your team.' },
    { icon: BarChart3, title: 'Social Managers', text: 'Replace repetitive platform switching with a single calendar, composer and activity view.' },
  ];

  const featureCards = [
    { icon: Workflow, title: 'One workflow, multiple channels', text: 'Move from idea to scheduled publishing without rebuilding the same post in every social platform.' },
    { icon: CalendarDays, title: 'Visual scheduling', text: 'Organize upcoming content around campaigns, dates and publishing destinations.' },
    { icon: Bot, title: 'AI-assisted content', text: 'Generate captions, hashtags and marketing variations when you need a faster starting point.' },
    { icon: Smartphone, title: 'Platform-aware preview', text: 'Review how your content is presented before sending it to connected destinations.' },
    { icon: Layers, title: 'Media library', text: 'Keep reusable images and videos available for future campaigns and posts.' },
    { icon: ShieldCheck, title: 'Tenant-aware architecture', text: 'Customer environments are designed around tenant isolation and server-side handling of sensitive credentials.' },
  ];

  return (
    <div className="font-['Inter'] bg-white text-slate-900">
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-28 bg-gradient-to-b from-purple-50/70 via-slate-50/50 to-white">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-purple-300/30 to-blue-300/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-2xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-5xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-purple-200 shadow-sm cursor-pointer" onClick={() => onNavigate('features')}>
              <span className="flex h-2 w-2 rounded-full bg-[#5D3FD3] animate-ping" />
              <span className="text-xs font-bold text-slate-800">SocialSpree • Multi-Channel Social Media Management</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[1.08]">
              Your social media operation, <span className="bg-gradient-to-r from-[#5D3FD3] via-[#0066FF] to-purple-600 bg-clip-text text-transparent">finally in one place.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
              Create, schedule, publish and manage social content from a single SaaS workspace. Built for brands, creators, social managers and agencies handling multiple channels and clients.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
              <button onClick={onLaunchApp} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] text-white font-bold text-base shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-300" /> Start Using SocialSpree <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => onNavigate('features')} className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-purple-300 text-slate-800 hover:text-[#5D3FD3] font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2">
                <PlayCircle className="w-5 h-5" /> Explore How It Works
              </button>
            </div>
            <div className="pt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Centralized content workflow</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Server-side scheduled publishing</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> AI-assisted creation</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-tenant ready</span>
            </div>
          </div>

          <div className="mt-16 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[['Multi-channel','Manage connected destinations'],['Scheduling','Plan content ahead'],['AI-assisted','Create faster'],['Agency-ready','Work across clients']].map(([value,label]) => (
              <div key={value} className="bg-white/85 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="text-base sm:text-lg font-black text-[#5D3FD3]">{value}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-14 max-w-5xl mx-auto">
            <div className="bg-white p-5 sm:p-7 rounded-[32px] border border-slate-200 shadow-2xl shadow-purple-900/10">
              <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-2"><Smartphone className="w-5 h-5 text-[#5D3FD3]" /><span className="text-sm font-black">Multi-platform content preview</span><span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Interactive</span></div>
                <div className="flex items-center gap-1 overflow-x-auto max-w-full">
                  {platforms.map(p => { const Icon = p.icon; return <button key={p.id} onClick={() => setActivePreviewTab(p.id as typeof activePreviewTab)} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${activePreviewTab === p.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Icon className="w-3.5 h-3.5" />{p.label}</button>; })}
                </div>
              </div>
              <div className="mt-7 grid lg:grid-cols-[300px_1fr] gap-8 items-center">
                <div className="w-[270px] sm:w-[300px] h-[500px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative mx-auto">
                  <div className="w-24 h-5 bg-black rounded-full mx-auto mb-2" />
                  <div className="bg-slate-900 text-white rounded-[34px] h-[436px] overflow-hidden flex flex-col p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800"><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentPlatform.color} flex items-center justify-center text-xs font-bold`}>SS</div><div><div className="text-xs font-bold">{currentPlatform.handle}</div><div className="text-[9px] text-slate-400">Via SocialSpree</div></div></div><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
                    <div className="my-3 rounded-2xl bg-gradient-to-br from-purple-900/60 to-blue-900/60 p-4 flex-1 flex flex-col justify-between border border-purple-500/20"><span className="text-[10px] bg-white/15 rounded-full px-2 py-1 w-fit">{currentPlatform.label}</span><div className="bg-black/60 backdrop-blur p-3 rounded-xl"><p className="text-xs text-slate-200 leading-relaxed">{currentPlatform.caption}</p><div className="text-[10px] text-purple-300 mt-2 flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" />Scheduled via SocialSpree</div></div></div>
                    <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between"><span>Content ready</span><span>Queued</span></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div><p className="text-xs font-bold uppercase tracking-widest text-[#5D3FD3]">One workspace</p><h2 className="text-2xl sm:text-3xl font-black mt-2">Stop rebuilding the same workflow on every platform.</h2><p className="text-slate-600 mt-3 leading-relaxed">SocialSpree brings the work around your social channels together: content creation, media, scheduling, connected accounts, publishing history and AI assistance.</p></div>
                  {['Write once and adapt the content for connected destinations.','Schedule campaigns from a shared calendar instead of separate platform tabs.','Keep publishing status and operational history in the same workspace.'].map(item => <div key={item} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-sm font-medium text-slate-700">{item}</span></div>)}
                  <button onClick={onLaunchApp} className="px-5 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-2">Open Workspace <ArrowRight className="w-4 h-4 text-purple-400" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5D3FD3]">The problem</p><h2 className="text-3xl sm:text-4xl font-black mt-3">Social management gets messy long before you notice.</h2><p className="text-slate-600 mt-4 text-base sm:text-lg">Too many tabs, duplicated work, disconnected media, inconsistent publishing schedules and no clean operational view.</p></div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[['Too many tools','Content lives in one place, media in another, calendars somewhere else and publishing status somewhere else.'],['Repetitive publishing','The same campaign has to be rebuilt, copied and checked across multiple platforms.'],['Agency complexity','Client accounts, permissions, content and provider credentials become difficult to separate as you scale.']].map(([title,text]) => <div key={title} className="p-7 rounded-3xl bg-slate-50 border border-slate-200"><div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#5D3FD3] font-black">!</div><h3 className="text-xl font-black mt-5">{title}</h3><p className="text-sm text-slate-600 mt-2 leading-relaxed">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5D3FD3]">Everything connected</p><h2 className="text-3xl sm:text-4xl font-black mt-3">A social media operating layer for your team.</h2><p className="text-slate-600 mt-4">Instead of adding another isolated tool, SocialSpree connects the recurring jobs your social team already performs.</p></div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map(({icon: Icon,title,text}) => <div key={title} className="bg-white rounded-3xl p-7 border border-slate-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5 transition-all"><div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#5D3FD3] flex items-center justify-center"><Icon className="w-5 h-5" /></div><h3 className="text-lg font-black mt-5">{title}</h3><p className="text-sm text-slate-600 mt-2 leading-relaxed">{text}</p></div>)}
          </div>
          <div className="text-center mt-10"><button onClick={() => onNavigate('features')} className="inline-flex items-center gap-2 text-sm font-bold text-[#5D3FD3] hover:gap-3 transition-all">See all platform capabilities <ArrowRight className="w-4 h-4" /></button></div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5D3FD3]">How it works</p><h2 className="text-3xl sm:text-4xl font-black mt-3">From idea to published post in five steps.</h2></div>
          <div className="mt-12 grid md:grid-cols-5 gap-4">
            {workflow.map(({icon: Icon,title,text}, index) => <div key={title} className="relative p-5 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between"><span className="text-[11px] font-black text-slate-400">0{index+1}</span><Icon className="w-5 h-5 text-[#5D3FD3]" /></div><h3 className="font-black mt-5">{title}</h3><p className="text-xs text-slate-600 mt-2 leading-relaxed">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">Built for serious workflows</p><h2 className="text-3xl sm:text-4xl font-black mt-3">The complexity stays behind the scenes.</h2><p className="text-slate-400 mt-4 leading-relaxed">SocialSpree is designed so users work with posts, schedules, accounts and results while sensitive provider operations stay on the backend.</p></div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[['Credential isolation', 'Sensitive provider credentials are intended to remain server-side.'],['Tenant boundaries','Customer workspaces are designed around tenant-aware authorization.'],['Background publishing','Scheduled jobs can be processed without keeping the browser open.'],['Operational history','Publishing activity and failures can be tracked for troubleshooting.']].map(([title,text]) => <div key={title} className="p-5 rounded-2xl bg-white/5 border border-white/10"><div className="flex items-center gap-2"><LockKeyhole className="w-4 h-4 text-purple-300" /><span className="font-bold text-sm">{title}</span></div><p className="text-xs text-slate-400 mt-2 leading-relaxed">{text}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5D3FD3]">Made for different teams</p><h2 className="text-3xl sm:text-4xl font-black mt-3">One platform, different ways to work.</h2></div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {useCases.map(({icon: Icon,title,text}) => <div key={title} className="p-6 rounded-3xl border border-slate-200 bg-slate-50/60"><Icon className="w-6 h-6 text-[#5D3FD3]" /><h3 className="font-black mt-5">{title}</h3><p className="text-sm text-slate-600 mt-2 leading-relaxed">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-white border border-slate-200 shadow-xl p-8 sm:p-12">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5D3FD3]">Built to reduce busywork</p><h2 className="text-3xl sm:text-4xl font-black mt-3">Spend more time on strategy. Less time moving posts between tabs.</h2><p className="text-slate-600 mt-4 leading-relaxed">Whether you publish for one brand or manage multiple clients, SocialSpree gives your team a repeatable workflow for the work that happens every day.</p></div>
              <div className="space-y-3">{['Centralize content and media','Schedule from one calendar','Use AI when you need a faster first draft','Keep publishing operations visible','Scale into multi-tenant agency workflows'].map(item => <div key={item} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-sm font-bold text-slate-700">{item}</span></div>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-[#5D3FD3] flex items-center justify-center"><Clock3 className="w-7 h-7" /></div>
          <h2 className="text-3xl sm:text-4xl font-black mt-5">Ready to bring your social workflow together?</h2>
          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">Start with the workspace, explore the platform, and choose the plan that fits your publishing operation.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <button onClick={onLaunchApp} className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#5D3FD3] to-[#0066FF] text-white font-bold shadow-lg flex items-center justify-center gap-2">Get Started <ArrowRight className="w-4 h-4" /></button>
            <button onClick={() => onNavigate('pricing')} className="px-7 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold hover:border-purple-300 flex items-center justify-center gap-2">Compare Plans</button>
          </div>
          <p className="text-[11px] text-slate-400 mt-5">Platform availability, supported networks, provider capabilities and limits may vary by plan and configuration.</p>
        </div>
      </section>
    </div>
  );
};
