import React, { useState } from 'react';
import { Mail, PhoneCall, MapPin, Send, CheckCircle2, MessageSquare, ShieldCheck, Building2, ExternalLink } from 'lucide-react';
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
    <div className="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50 to-purple-50/20 font-['Inter']" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* Brand Mission & Overview */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100 text-[#5D3FD3] text-xs font-bold font-mono">
            <Building2 className="w-3.5 h-3.5" />
            <span>OUR MISSION & STORY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Democratizing Multi-Channel SaaS Publishing Infrastructure
          </h2>
          <p className="text-slate-600 font-medium text-base sm:text-lg leading-relaxed">
            SocialSpree was built to solve a fundamental challenge faced by digital agencies: managing dozens of client social channels without falling victim to rate-limiting, API key collisions, or vendor lock-in.
          </p>
        </div>

        {/* Values Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5D3FD3] flex items-center justify-center mb-6 font-bold">
              01
            </div>
            <h3 className="text-xl font-black text-slate-900">Isolated 2-Channel API Slots</h3>
            <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
              Strict secret key isolation per tenant guarantees clean channel separation and individual rate limit management across client accounts.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0066FF] flex items-center justify-center mb-6 font-bold">
              02
            </div>
            <h3 className="text-xl font-black text-slate-900">Cloud Native Speed</h3>
            <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
              Powered by Cloudflare R2 media CDN and async parallel firing workers, media uploads and posts publish in under 200ms globally.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 font-bold">
              03
            </div>
            <h3 className="text-xl font-black text-slate-900">Dual Payment Gateway</h3>
            <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
              Instant Razorpay automated card checkout alongside direct WhatsApp invoice ordering gives global and Indian agencies total payment flexibility.
            </p>
          </div>
        </div>

        {/* Contact Form & WhatsApp Direct Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Direct WhatsApp & Support Info */}
          <div className="lg:col-span-5 bg-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between space-y-8">
            <div>
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
                DIRECT SALES & SUPPORT
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                Get in Touch with Our Team
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-2 leading-relaxed">
                Have questions about custom Enterprise API slots or need immediate support? Chat with our Super Admin team directly.
              </p>

              {/* Support Info Cards */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <Mail className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Super Admin Email</div>
                    <div className="text-xs font-bold text-white">{SUPER_ADMIN_EMAIL}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <PhoneCall className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">WhatsApp Hotline</div>
                    <div className="text-xs font-bold text-white">+91 90518 22558</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Global HQ</div>
                    <div className="text-xs font-bold text-white">LeadSpree Tech Hub, India & US</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Action Button */}
            <div className="pt-6 border-t border-slate-800">
              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Launch Direct WhatsApp Chat (wa.me/919051822558)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-7 p-8 sm:p-12">
            <h3 className="text-2xl font-black text-slate-900">Send Us a Message</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Fill out the form below and our team will respond within 2 business hours.
            </p>

            {submitted ? (
              <div className="mt-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black text-emerald-900">Message Received!</h4>
                <p className="text-xs text-emerald-700 font-medium max-w-md mx-auto">
                  Thank you for reaching out to SocialSpree. Our support desk at <strong>{SUPER_ADMIN_EMAIL}</strong> has received your inquiry.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-4 py-2 text-xs font-bold bg-emerald-700 text-white rounded-xl"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      placeholder="Alex Mercer"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="alex@apexgrowth.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Agency</label>
                    <input
                      type="text"
                      value={formState.organization}
                      onChange={(e) => setFormState({ ...formState, organization: e.target.value })}
                      placeholder="Apex Growth Media"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                      placeholder="Enterprise Plan Inquiry"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Message *</label>
                  <textarea
                    required
                    rows={4}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    placeholder="Tell us about your social accounts scale and API requirements..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#5D3FD3] to-[#0066FF] text-white font-bold text-xs shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Inquiry to SocialSpree Team</span>
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
