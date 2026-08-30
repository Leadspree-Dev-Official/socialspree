import React, { useState } from 'react';
import { SUPPORT_WHATSAPP_DISPLAY } from '../../lib/config';
import { 
  Star, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Quote, 
  CheckCircle2, 
  Building2, 
  Zap, 
  Search,
  Users,
  Award,
  Sparkles
} from 'lucide-react';

export const TestimonialsView: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [faqSearch, setFaqSearch] = useState('');

  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Founder & CEO',
      company: 'Apex Growth Media (US)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      metric: 'Saved 18 hrs/week across 24 client brands',
      quote: 'SocialSpree transformed our agency workflow. Isolating API slots per client tenant means zero cross-contamination and lightning-fast parallel post dispatch across Instagram, TikTok, and LinkedIn.'
    },
    {
      name: 'Rajesh Sharma',
      role: 'Head of Digital Marketing',
      company: 'OmniChannel Agency (India)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      metric: '300% boost in posting throughput',
      quote: 'The dual Razorpay & WhatsApp checkout options let us onboard Indian and international clients seamlessly. The AI viral caption generator and Google Reviews auto-replies save us hours every single day.'
    },
    {
      name: 'Marcus Vance',
      role: 'Operations Director',
      company: 'Vance Digital UK',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      metric: '100% White-labeled SLA compliance',
      quote: 'The Cloudinary media vault delivers video reels effortlessly. Super Admin controls give us total visibility and control over API slot allocations without exposing raw keys to clients.'
    },
    {
      name: 'Elena Rostova',
      role: 'Creator & Brand Director',
      company: 'Elena Studio Labs',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      metric: 'Managed 12 creator channels solo',
      quote: 'The iPhone 16 Pro live preview drawer lets me see exactly how my reels and carousel posts will look on Instagram and TikTok before scheduling. It is like having a creative studio in your pocket.'
    },
    {
      name: 'David Chen',
      role: 'Managing Partner',
      company: 'ScaleX Media Singapore',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      metric: 'Zero API throttle incidents in 12 mos',
      quote: 'Because each client has their own dedicated 2-channel slot boundary, we never run into platform rate limit collisions when firing big product launches.'
    },
    {
      name: 'Priya Patel',
      role: 'Social Media Lead',
      company: 'HyperGrowth Agency',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      metric: '10x engagement on auto-replies',
      quote: 'The Instagram & Facebook comment auto-responder bot converts commenters into qualified leads in DMs automatically. It paid for our subscription in the first 48 hours.'
    }
  ];

  const trustBadges = [
    { label: '99.99% Uptime SLA', icon: Zap, detail: 'High Availability Multi-Region Infrastructure' },
    { label: 'Cloudinary CDN Secured', icon: ShieldCheck, detail: 'Signed uploads, global edge delivery' },
    { label: 'Razorpay & WhatsApp Verified', icon: CheckCircle2, detail: 'Authentic Dual Payment Gateways' },
    { label: '100% White-Labeled', icon: Building2, detail: 'Custom Branded Tenant Portals' },
  ];

  const allFaqs = [
    {
      q: 'What is a 2-Channel API Slot and how does allocation work?',
      a: 'Each Super Admin allocated API slot yields exactly 2 social media channels (for example, 1 Instagram account + 1 LinkedIn account). This guarantees clean secret key isolation and prevents rate-limiting collisions across tenant workspaces.'
    },
    {
      q: 'How does Razorpay Sandbox instant provisioning work?',
      a: 'Razorpay Sandbox allows you to test card and UPI checkout flows safely in preview mode. In production, subscriptions activate automatically via server-verified payment webhooks.'
    },
    {
      q: 'How do I check out via WhatsApp Direct Order?',
      a: `Choosing WhatsApp checkout creates a real order with a reference number and opens a pre-filled message to ${SUPPORT_WHATSAPP_DISPLAY}. Quote that reference when you pay by wire or UPI, and your workspace is activated as soon as we confirm receipt.`
    },
    {
      q: 'Can I connect my own Cloudinary account?',
      a: 'Yes. Super Admin manages the global CDN default, and individual tenant administrators can point the workspace at their own Cloudinary cloud, or a pool of several, in System Settings.'
    },
    {
      q: 'Is SocialSpree 100% white-labeled for client agencies?',
      a: 'Absolutely. Client dashboards, composers, and activity reports operate with zero third-party branding. Tenants only see their assigned channel slots and brand identity.'
    },
    {
      q: 'Which social media networks are natively supported?',
      a: 'SocialSpree supports Instagram, TikTok, LinkedIn, YouTube, Facebook, Pinterest, Reddit, Telegram, WhatsApp, Bluesky, Discord, and Snapchat. Threads and Google Business Profile are on the roadmap.'
    },
    {
      q: 'How does the AI Viral Content & Hashtag Generator work?',
      a: 'The built-in AI engine uses Gemini API prompts tuned specifically for social media engagement. Each caption/hashtag generation deducts exactly 10 AI credits from your tenant ledger and can be inserted into the post composer with 1 click.'
    }
  ];

  const filteredFaqs = allFaqs.filter(
    f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="py-16 sm:py-24 bg-gradient-to-b from-purple-50/40 via-white to-slate-50 dark:from-[#0B0F17] dark:via-[#090D16] dark:to-[#0B0F17] font-['Inter'] transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* ========================================================================= */}
        {/* SECTION HEADER */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 text-xs font-bold font-mono border border-purple-200/60 dark:border-purple-800/60">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>CUSTOMER REVIEWS & TRUST</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Trusted by 500+ High-Growth Digital Agencies
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-base sm:text-lg leading-relaxed">
            See how social media agencies, growth teams, and creator studios publish content at scale with SocialSpree.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* TESTIMONIALS WALL (6 CARDS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 shadow-md hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between space-y-6 relative group"
            >
              <div className="space-y-4">
                {/* Rating & Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-purple-200 dark:text-purple-900/60 group-hover:text-purple-300 dark:group-hover:text-purple-400 transition-colors" />
                </div>

                {/* Hard Metric Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 text-xs font-bold font-mono border border-purple-100 dark:border-purple-800/80">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.metric}</span>
                </div>

                {/* Quote Text */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Profile */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-purple-200 dark:border-purple-800 shadow-xs"
                />
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">{t.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.role} • <span className="font-bold text-slate-700 dark:text-slate-300">{t.company}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* TRUST BADGES STRIP */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {trustBadges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">{badge.label}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">{badge.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* FAQ ACCORDION SECTION WITH LIVE SEARCH */}
        {/* ========================================================================= */}
        <div className="max-w-4xl mx-auto space-y-8 pt-8">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              Everything you need to know about API slots, payments, and multi-tenant provisioning.
            </p>

            {/* Search Input Bar */}
            <div className="max-w-md mx-auto relative pt-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-5" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search FAQs (e.g., API slots, WhatsApp, pricing)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs"
              />
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                  >
                    <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      {faq.q}
                    </span>
                    <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};
