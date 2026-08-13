import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Cloud, 
  Share2, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  Zap, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Facebook, 
  Store,
  ExternalLink
} from 'lucide-react';

export const HelpCenterView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      q: "Why do scheduled posts require a Cloudflare or Cloudinary hosted CDN link?",
      a: "Scheduled posts are processed asynchronously by our cloud background dispatcher workers. Direct local file uploads cannot be retrieved by remote social network servers (Instagram, LinkedIn, YouTube, Meta) hours or days later. Hosting your file on a Cloudflare R2 bucket or Cloudinary CDN ensures an immutable, high-speed public URL is accessible when your post goes live."
    },
    {
      q: "Is text caption content mandatory for publishing image or video posts?",
      a: "No! Text captions are completely optional. As long as your post contains an attached image or video file (via Cloudflare, Cloudinary, or direct URL), it can be published or scheduled live to target channels."
    },
    {
      q: "How do I configure custom Cloudflare or Cloudinary storage settings?",
      a: "Navigate to the Settings tab -> Media CDN & Storage. You can choose to use the Super Admin default Cloudinary / Cloudflare CDN accounts, or toggle to 'Use Custom Account' and enter your custom Cloud Name, Unsigned Upload Preset, or R2 Bucket details."
    },
    {
      q: "What is the difference between Standard Tier (Free) and Pro Tier Engine?",
      a: "Standard Tier uses our hybrid background cron engine to process background dispatches. Pro Tier Engine features real-time cloud native dispatchers with instant execution, custom webhook callbacks, and expanded social channel connection limits (up to 100 accounts)."
    },
    {
      q: "How do AI credits work and how can I top them up?",
      a: "Each AI caption, hashtag, or hook generation debits 10 AI credits from your tenant balance. AI Agent chat bookings debit 15 credits. If your credit balance falls below 10, contact your Super Admin to request an instant credit top-up."
    },
    {
      q: "How does Super Admin API allocation work?",
      a: "Super Admin (leadspree24x7@gmail.com) has root access in the Super Admin Portal to provision client accounts, allocate master API keys, toggle subscription tiers, set max account connection limits, and update global Cloudinary/Cloudflare storage defaults."
    }
  ];

  const [openFaqQuestion, setOpenFaqQuestion] = useState<string | null>(faqs[0]?.q || null);

  // Ticket Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(false);

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmittedTicket(true);
    setSubject('');
    setMessage('');
    setTimeout(() => setSubmittedTicket(false), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#5D3FD3] via-purple-900 to-slate-900 text-white p-8 rounded-2xl border border-purple-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Help Center & Knowledge Base</h2>
              <p className="text-xs text-purple-200 mt-0.5">Documentation, video tutorials, FAQs & Super Admin support ticket desk</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>All Dispatch Engines Operational</span>
          </div>
        </div>

        {/* Knowledge Base Search */}
        <div className="relative max-w-2xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs, Cloudflare setup, API keys, or post scheduling..."
            className="w-full pl-12 pr-4 py-3 bg-white text-slate-900 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-lg placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Grid: FAQs & Channel Setup Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: FAQs Accordion */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5 text-[#5D3FD3]" />
            <span>Frequently Asked Questions ({filteredFaqs.length})</span>
          </h3>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqQuestion === faq.q;
              return (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden transition-colors">
                  <button
                    onClick={() => setOpenFaqQuestion(isOpen ? null : faq.q)}
                    className="w-full p-4 text-left font-bold text-xs text-slate-900 bg-slate-50/50 hover:bg-slate-100 flex items-center justify-between gap-3"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#5D3FD3]" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Platform Connection Guides & Support Ticket */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Setup Guides */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Share2 className="w-4 h-4 text-[#5D3FD3]" />
              <span>Channel Integration Guides</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <span>Instagram Business Sync</span>
                </div>
                <span className="text-[10px] font-mono text-purple-700 font-bold">Meta Graph v19</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span>LinkedIn OAuth 2.0 Page</span>
                </div>
                <span className="text-[10px] font-mono text-purple-700 font-bold">Community API</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Youtube className="w-4 h-4 text-red-600" />
                  <span>YouTube Data API v3</span>
                </div>
                <span className="text-[10px] font-mono text-purple-700 font-bold">Google Cloud</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Google Business Profile</span>
                </div>
                <span className="text-[10px] font-mono text-purple-700 font-bold">Reviews & Posts</span>
              </div>
            </div>
          </div>

          {/* Contact Support Desk */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-4 h-4 text-[#5D3FD3]" />
              <span>Contact Super Admin Support Desk</span>
            </h3>

            {submittedTicket && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Ticket submitted directly to leadspree24x7@gmail.com!</span>
              </div>
            )}

            <form onSubmit={handleSendTicket} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Need assistance with Cloudflare R2 bucket CORS"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#5D3FD3]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Details</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-[#5D3FD3]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#5D3FD3] text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Ticket to Super Admin</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
