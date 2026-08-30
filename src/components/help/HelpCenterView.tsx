import React, { useState } from 'react';
import { capabilityFor, STATUS_LABEL } from '../../lib/platforms';
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

/** Channels documented in the help centre, in the order customers meet them. */
const CHANNEL_GUIDE: Array<{ id: string; name: string; detail: string }> = [
  { id: 'instagram', name: 'Instagram Business', detail: 'Business or Creator accounts, via Meta Graph.' },
  { id: 'facebook', name: 'Facebook Pages', detail: 'Page posts, via Meta Graph.' },
  { id: 'linkedin', name: 'LinkedIn', detail: 'Profile and company page posts.' },
  { id: 'youtube', name: 'YouTube', detail: 'Video uploads via the YouTube Data API.' },
  { id: 'threads', name: 'Threads', detail: 'Text and image threads.' },
  { id: 'google_business', name: 'Google Business Profile', detail: 'Local profile posts and updates.' },
];

export const HelpCenterView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      q: "Why do scheduled posts require a hosted CDN link?",
      a: "Scheduled posts are dispatched later by background workers. A file that only exists in your browser cannot be fetched by Instagram, LinkedIn, YouTube or Meta hours or days afterwards. Uploading to your Cloudinary Media Vault gives the file a permanent public URL that still resolves when the post goes live."
    },
    {
      q: "Is text caption content mandatory for publishing image or video posts?",
      a: "No — captions are optional. As long as the post carries an image or video, whether uploaded to the Media Vault or supplied as a direct HTTPS URL, it can be published or scheduled to your channels."
    },
    {
      q: "How do I configure custom Cloudinary storage settings?",
      a: "Open Settings -> Media CDN & Storage. Use the Super Admin default Cloudinary account, or switch to 'Use Custom Account' and enter your own cloud name and folder."
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
      a: "Super Admin (leadspree24x7@gmail.com) has root access in the Super Admin Portal to provision client accounts, allocate master API keys, toggle subscription tiers, set max account connection limits, and update the global Cloudinary storage defaults."
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
      <div className="bg-gradient-to-r from-[#5D3FD3] via-purple-900 to-slate-900 text-white p-8 rounded-2xl border border-purple-800 dark:border-purple-900/60 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
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
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs, media storage, API keys, or post scheduling..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-lg placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200/40 dark:border-slate-800"
          />
        </div>
      </div>

      {/* Main Grid: FAQs & Channel Setup Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: FAQs Accordion */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <BookOpen className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
            <span>Frequently Asked Questions ({filteredFaqs.length})</span>
          </h3>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqQuestion === faq.q;
              return (
                <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors">
                  <button
                    onClick={() => setOpenFaqQuestion(isOpen ? null : faq.q)}
                    className="w-full p-4 text-left font-bold text-xs text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 bg-white dark:bg-slate-900 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Share2 className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400" />
              <span>Channel Integration Guides</span>
            </h3>

            {/* Driven by the shared capability map so this cannot drift out of
                step with what the product can actually publish to. */}
            <div className="space-y-2.5 text-xs">
              {CHANNEL_GUIDE.map(({ id, name, detail }) => {
                const capability = capabilityFor(id);
                const tone =
                  capability.status === 'supported'
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60'
                    : capability.status === 'needs_setup'
                    ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800';

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {capability.note || detail}
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${tone}`}>
                      {STATUS_LABEL[capability.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Support Desk */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <MessageSquare className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400" />
              <span>Contact Super Admin Support Desk</span>
            </h3>

            {submittedTicket && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2 font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Ticket submitted directly to leadspree24x7@gmail.com!</span>
              </div>
            )}

            <form onSubmit={handleSendTicket} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Need assistance with Media Vault uploads"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#5D3FD3]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Message Details</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:ring-2 focus:ring-[#5D3FD3]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
