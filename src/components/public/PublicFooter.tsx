import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  LayoutDashboard, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube, 
  Video, 
  Facebook,
  CheckCircle2,
  ArrowRight,
  Mail,
  Send,
  Zap,
  Globe2
} from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../../lib/store';

interface PublicFooterProps {
  onLaunchApp: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onLaunchApp,
}) => {
  const [subscribedEmail, setSubscribedEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribedEmail) return;
    setSubscribed(true);
  };

  return (
    <footer className="bg-slate-950 text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-900 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* ========================================================================= */}
        {/* TOP BRAND & NEWSLETTER GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Info (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-3 cursor-pointer no-underline">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5D3FD3] via-[#7952F5] to-[#0066FF] p-0.5 shadow-lg shadow-purple-500/25 flex items-center justify-center">
                <img 
                  src="/logo.png" 
                  alt="SocialSpree Logo" 
                  className="w-full h-full rounded-[14px] object-cover" 
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl text-white tracking-tight">SocialSpree</span>
                  <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 uppercase font-mono">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">Multi-Channel SaaS Publishing Engine</p>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Empowering marketing agencies and high-velocity brands with isolated 2-channel API slots, Cloudflare edge CDN distribution, and AI-powered viral social automation.
            </p>

            {/* Live Operational Engine Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 font-bold">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>All Systems Operational (99.99% SLA)</span>
            </div>

            {/* Supported Platform Badges */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Supported:</span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                <Instagram className="w-3 h-3 text-pink-400" /> Instagram
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                <Video className="w-3 h-3 text-teal-400" /> TikTok
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                <Linkedin className="w-3 h-3 text-blue-400" /> LinkedIn
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                <Twitter className="w-3 h-3 text-slate-300" /> X
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                <Youtube className="w-3 h-3 text-red-400" /> YouTube
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                <Facebook className="w-3 h-3 text-blue-500" /> Facebook
              </span>
            </div>
          </div>

          {/* Platform Navigation (3 Cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Platform Overview
            </h4>
            <ul className="space-y-2 text-xs list-none p-0 m-0">
              <li>
                <Link to="/" className="hover:text-purple-400 transition-colors no-underline text-slate-400">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-purple-400 transition-colors no-underline text-slate-400">
                  6 Core Feature Pillars
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-purple-400 transition-colors no-underline text-slate-400">
                  Multi-Currency Pricing Table
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="hover:text-purple-400 transition-colors no-underline text-slate-400">
                  Agency Reviews & FAQs
                </Link>
              </li>
              <li>
                <Link to="/docs" className="hover:text-purple-400 transition-colors no-underline text-slate-400">
                  Developer API & Webhooks
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-purple-400 transition-colors no-underline text-slate-400">
                  About & Direct Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter & Workspace Portal (4 Cols) */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Agency Updates & Releases
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subscribe for new social API additions, rate-limit optimizations, and feature rollouts.
            </p>

            {subscribed ? (
              <div className="p-3 bg-purple-950/80 border border-purple-800 text-purple-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Thank you! You are subscribed to updates.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="name@agency.com"
                  value={subscribedEmail}
                  onChange={(e) => setSubscribedEmail(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#5D3FD3]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#5D3FD3] hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Join
                </button>
              </form>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={onLaunchApp}
                className="w-full py-3 px-4 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Enter SaaS Workspace Portal</span>
              </button>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* BOTTOM COPYRIGHT & LEGAL BAR */}
        {/* ========================================================================= */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} SocialSpree PRO Engine. All rights reserved. Built with React 19 & Tailwind v4.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/about" className="hover:text-slate-400 no-underline text-slate-500">Contact Us</Link>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer">API SLA Status</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
