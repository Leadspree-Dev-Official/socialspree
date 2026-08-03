import React, { useState } from 'react';
import { Star, ShieldCheck, ChevronDown, ChevronUp, Quote, CheckCircle2, Building2, Zap } from 'lucide-react';

export const TestimonialsView: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Founder & CEO',
      company: 'Apex Growth Media',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      metric: 'Saved 18 hrs/week across 24 client brands',
      quote: 'SocialSpree transformed our agency workflow. Isolating API slots per client tenant means zero cross-contamination and lightning-fast parallel post dispatch.'
    },
    {
      name: 'Rajesh Sharma',
      role: 'Head of Digital Marketing',
      company: 'OmniChannel Agency (India)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      metric: '300% boost in posting throughput',
      quote: 'The dual Razorpay & WhatsApp checkout options let us onboard Indian and international clients instantly. AI viral caption generation saves us hours every day.'
    },
    {
      name: 'Marcus Vance',
      role: 'Operations Director',
      company: 'Vance Digital UK',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 5,
      metric: '100% White-labeled SLA compliance',
      quote: 'The Cloudflare R2 CDN media integration delivers video reels effortlessly. Super Admin controls give us total visibility over API slot allocations.'
    }
  ];

  const trustBadges = [
    { label: '99.99% Uptime SLA', icon: Zap, detail: 'High Availability Multi-Region Infrastructure' },
    { label: 'Cloudflare CDN Secured', icon: ShieldCheck, detail: 'Global R2 Edge Media Pipeline' },
    { label: 'Razorpay & WhatsApp Verified', icon: CheckCircle2, detail: 'Authentic Dual Payment Gateways' },
    { label: '100% White-Labeled', icon: Building2, detail: 'Custom Branded Tenant Portals' },
  ];

  const faqs = [
    {
      q: 'What is a 2-Channel API Slot and how does allocation work?',
      a: 'Each Super Admin allocated API slot yields exactly 2 social media channels (e.g. 1 Instagram account + 1 LinkedIn account). This guarantees clean secret key isolation and prevents rate-limiting collisions across tenant workspaces.'
    },
    {
      q: 'How does Razorpay Sandbox instant provisioning work?',
      a: 'Razorpay Sandbox is a UI-only preview. It creates a non-paid local trial workspace; production subscriptions require server-verified payment webhooks.'
    },
    {
      q: 'How do I check out via WhatsApp Direct Order?',
      a: 'Selecting WhatsApp Direct Checkout generates a formatted invoice breakdown pre-filled into wa.me/919051822558. You can review the invoice details and chat directly with Super Admin sales for offline activation.'
    },
    {
      q: 'Can I connect my own Cloudinary or Cloudflare CDN storage bucket?',
      a: 'Yes! Super Admin manages global CDN defaults, but individual tenant administrators can override custom Cloudflare R2 bucket domains or multi-Cloudinary account pools in System Settings.'
    },
    {
      q: 'Is SocialSpree 100% white-labeled for client agencies?',
      a: 'Absolutely. Tenant branding, custom API keys, and workspace views can be styled with agency logos and custom metadata.'
    }
  ];

  return (
    <div className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-white to-purple-50/20 font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 text-[#5D3FD3] text-xs font-bold font-mono">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>SOCIAL PROOF & REVIEWS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Trusted by 500+ High-Growth Digital Agencies
          </h2>
          <p className="text-slate-600 font-medium text-base sm:text-lg">
            See how social media managers and marketing agencies publish content at scale with SocialSpree.
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-lg shadow-slate-200/50 flex flex-col justify-between relative hover:border-purple-300 transition-all"
            >
              <div>
                {/* Rating Stars & Quote Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-purple-200" />
                </div>

                {/* Impact Metric Badge */}
                <div className="mb-4 inline-block px-3 py-1 rounded-full bg-purple-50 text-[#5D3FD3] text-xs font-mono font-bold border border-purple-100">
                  ⚡ {t.metric}
                </div>

                {/* Quote Text */}
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-purple-200 shadow-xs"
                />
                <div>
                  <div className="text-xs font-black text-slate-900">{t.name}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{t.role}, <span className="text-[#5D3FD3] font-bold">{t.company}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges Row */}
        <div className="mt-16 bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl">
          <div className="text-center text-xs font-mono font-bold text-purple-300 uppercase tracking-widest mb-6">
            ENTERPRISE TRUST & COMPLIANCE GUARANTEE
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div key={idx} className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{badge.label}</div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">{badge.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive FAQ Accordion Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-10">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
              Frequently Asked Questions
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Everything you need to know about SocialSpree API slots, payment options, and provisioning.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 hover:text-[#5D3FD3] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#5D3FD3] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 font-medium border-t border-slate-100 leading-relaxed bg-slate-50/50">
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
