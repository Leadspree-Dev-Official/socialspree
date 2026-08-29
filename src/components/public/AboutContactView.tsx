import React, { useState } from 'react';
import { 
  Mail, 
  PhoneCall, 
  MapPin, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  ShieldCheck, 
  Building2, 
  ExternalLink,
  Sparkles,
  Zap,
  Globe2,
  Clock3
} from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../../lib/store';

export const AboutContactView: React.FC = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    organization: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setSubmitted(true);
  };

  const directWhatsAppUrl = `https://wa.me/919051822558?text=${encodeURIComponent(
    `Hello SocialSpree Team! I would like to inquire about agency plans and enterprise API slot allocations.`
  )}`;

  return (
    <div className="py-16 sm:py-24 bg-gradient-to-b from-purple-50/40 via-white to-slate-50 dark:from-[#0B0F17] dark:via-[#090D16] dark:to-[#0B0F17] font-['Inter'] transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* ========================================================================= */}
        {/* SECTION HEADER */}
        {/* ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 text-xs font-bold font-mono border border-purple-200/60 dark:border-purple-800/60">
            <Building2 className="w-3.5 h-3.5" />
            <span>OUR MISSION & STORY</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Democratizing Multi-Channel SaaS Infrastructure
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-base sm:text-lg leading-relaxed">
            SocialSpree was built to solve a critical challenge faced by marketing agencies: managing dozens of client social channels without rate limits, secret key collisions, or vendor lock-in.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* CORE VALUES GRID (3 CARDS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 flex items-center justify-center mb-6 font-bold text-lg">
              01
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Isolated 2-Channel API Slots</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-2 leading-relaxed">
              Strict secret key isolation per tenant guarantees clean channel separation and individual rate limit management across client accounts.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-400 flex items-center justify-center mb-6 font-bold text-lg">
              02
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Cloud Native Speed</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-2 leading-relaxed">
              Powered by Cloudflare CDN and async parallel firing workers, media uploads and posts publish in under 200ms globally.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 font-bold text-lg">
              03
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Dual Payment Flexibility</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-2 leading-relaxed">
              Instant automated Razorpay card checkout alongside direct WhatsApp invoice ordering gives global and Indian agencies total payment flexibility.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONTACT FORM & DIRECT WHATSAPP GRID */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Direct WhatsApp & Support SLA (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-950 dark:bg-slate-950 text-white p-8 sm:p-12 flex flex-col justify-between space-y-8 border-r border-slate-900 dark:border-slate-800">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
                DIRECT SALES & SUPPORT
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Get in Touch with Our Team
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                Have questions about custom Enterprise API slots or need immediate support? Chat with our team directly.
              </p>

              {/* Support Info Cards */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <Mail className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Super Admin Email</div>
                    <div className="text-xs font-bold text-white">{SUPER_ADMIN_EMAIL}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <Clock3 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Support Response SLA</div>
                    <div className="text-xs font-bold text-emerald-400">&lt; 15 Minutes Response Guarantee</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Global Operations</div>
                    <div className="text-xs font-bold text-white">Kolkata, WB, India • Serving Worldwide</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Action Button */}
            <div className="pt-6 border-t border-slate-900">
              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 no-underline hover:scale-102 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat Directly on WhatsApp (+91 90518 22558)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Inquiry Form (7 Cols) */}
          <div className="lg:col-span-7 p-8 sm:p-12 space-y-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Send an Enterprise Inquiry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Fill out the form below and our leadership team will reach back out immediately.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">Inquiry Received!</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium max-w-sm mx-auto">
                  Thank you, <strong>{formState.name}</strong>. Our enterprise team will respond to <strong>{formState.email}</strong> within 15 minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Work Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@agency.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Growth Media Inc."
                    value={formState.organization}
                    onChange={(e) => setFormState({ ...formState, organization: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Message / Requirements *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your social channels volume, client brand count, or custom integration needs..."
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] text-white font-bold text-xs shadow-lg shadow-purple-500/25 hover:shadow-purple-500/35 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
