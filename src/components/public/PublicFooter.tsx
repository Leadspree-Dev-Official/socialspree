import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Heart, LayoutDashboard, Instagram, Linkedin, Twitter, Youtube, Video, Facebook } from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../../lib/store';

interface PublicFooterProps {
  onLaunchApp: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onLaunchApp,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-800 font-['Inter']">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Brand Info (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-3 cursor-pointer no-underline">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5D3FD3] via-[#0066FF] to-purple-400 text-white flex items-center justify-center font-black text-xl shadow-lg">
                SS
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
              Empowering agencies and multi-brand managers with isolated 2-channel API slots, Cloudflare R2 media distribution, and AI-driven social automation.
            </p>

            {/* Supported Social Platform Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Channels:</span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                <Instagram className="w-3 h-3 text-pink-400" /> Instagram
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
                <Video className="w-3 h-3 text-teal-400" /> TikTok
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1">
                <Facebook className="w-3 h-3 text-blue-500" /> Facebook
              </span>
            </div>
          </div>

          {/* Quick Links Column (3 Cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Platform Navigation
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
                  Interactive Plans & Pricing
                </Link>
              </li>
              <li>
                <Link to="/testimonials" className="hover:text-purple-400 transition-colors no-underline text-slate-400">
                  Agency Reviews & FAQ
                </Link>
              </li>
              <li>
                <Link to="/docs" className="hover:text-purple-400 transition-colors no-underline text-slate-400">
                  Documentation Hub
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-purple-400 transition-colors no-underline text-slate-400">
                  About & Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* SaaS App Access & Support (4 Cols) */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              SaaS App & White-Label SLA
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Super Admin Helpdesk: <span className="font-mono text-purple-300">{SUPER_ADMIN_EMAIL}</span>
            </p>

            <div className="pt-2">
              <button
                onClick={onLaunchApp}
                className="w-full py-3 px-4 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Enter SaaS Workspace Portal</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} SocialSpree PRO Engine. All rights reserved. Built with React 19 & Tailwind v4.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
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
