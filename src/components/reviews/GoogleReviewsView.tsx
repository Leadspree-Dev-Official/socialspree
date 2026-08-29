import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { GoogleReview, Tenant } from '../../types';
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  ShieldAlert, 
  TrendingUp, 
  BellRing, 
  ArrowLeft, 
  Mail, 
  Send,
  Zap,
  Globe2
} from 'lucide-react';

interface GoogleReviewsViewProps {
  tenant: Tenant;
  reviews: GoogleReview[];
  onReplyReview?: (reviewId: string, replyText: string) => void;
  onReturnToDashboard?: () => void;
}

export const GoogleReviewsView: React.FC<GoogleReviewsViewProps> = ({
  tenant,
  reviews,
  onReturnToDashboard
}) => {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [joining, setJoining] = useState(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(() => {
    try {
      return localStorage.getItem(`waitlist_google_reviews_${tenant.id}`) === 'true';
    } catch {
      return false;
    }
  });

  const tenantReviews = reviews.filter(r => r.tenantId === tenant.id);
  const avgRating = tenantReviews.length > 0
    ? (tenantReviews.reduce((acc, r) => acc + r.rating, 0) / tenantReviews.length).toFixed(1)
    : '4.9';

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = waitlistEmail.trim();
    if (!email || !email.includes('@')) return;

    setWaitlistError(null);
    setJoining(true);

    // Persist the signup — this is a demand signal for an unbuilt module, so
    // it has to survive the browser it was typed into.
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('feature_waitlist').upsert({
      tenant_id: tenant.id,
      user_id: session?.user?.id ?? null,
      feature: 'google_reviews',
      email
    }, { onConflict: 'tenant_id,feature,email' });

    setJoining(false);

    if (error) {
      setWaitlistError('We could not record that just now. Please try again in a moment.');
      return;
    }

    // Remember locally too, so the form stays collapsed on return visits.
    try {
      localStorage.setItem(`waitlist_google_reviews_${tenant.id}`, 'true');
    } catch {
      /* private mode: the server record is what matters */
    }
    setIsSubscribed(true);
  };

  return (
    <div className="relative min-h-[750px] w-full overflow-hidden rounded-3xl font-['Inter']">
      
      {/* ========================================================================= */}
      {/* 1. BLURRED TRANSPARENT BACKGROUND SCREENS (REALISTIC GOOGLE REVIEWS UI) */}
      {/* ========================================================================= */}
      <div 
        aria-hidden="true" 
        className="filter blur-[6px] opacity-35 select-none pointer-events-none space-y-6 transform scale-[1.01] transition-all"
      >
        {/* Header Preview Screen */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-black shadow-md">
              <Star className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Google Business Profile Reviews Hub</span>
                <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                  VERIFIED LOCATION
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Downtown Flagship Store • 428 Broadway, New York, NY</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-3xl font-black text-slate-900 dark:text-white flex items-center justify-end gap-1">
                <span>{avgRating}</span>
                <div className="flex text-amber-400 text-base">
                  {'★'.repeat(5)}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Based on 284 verified Google Maps ratings
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid Preview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">Total Reviews</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">1,492</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">↑ +18.4% this month</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">AI Auto-Reply Rate</div>
            <div className="text-2xl font-black text-[#5D3FD3] dark:text-purple-400 mt-1">98.2%</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">Avg response time: 4 mins</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">Positive Sentiment</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">94.7%</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">1,413 Five-Star ratings</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">Reputation Shield</div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">Active</div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">Auto-escalate 1-star reviews</div>
          </div>
        </div>

        {/* Sample Reviews Stream Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              author: 'Sophia Martinez',
              time: '2 hours ago',
              rating: 5,
              comment: 'Outstanding service and prompt delivery! The team went above and beyond for our company event. Will definitely return!',
              reply: 'Hi Sophia, thank you so much for the 5-star review! We are thrilled our team could make your event special.'
            },
            {
              author: 'David Harrison',
              time: '1 day ago',
              rating: 5,
              comment: 'Best customer experience in town. Staff was extremely knowledgeable and resolved our request in under 10 minutes.',
              reply: 'Thank you David! We appreciate your loyalty and look forward to serving you again soon!'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 text-[#5D3FD3] dark:text-purple-300 font-bold flex items-center justify-center border border-purple-200 dark:border-purple-800">
                    {item.author[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{item.author}</div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{item.time}</div>
                  </div>
                </div>
                <div className="flex text-amber-400 text-sm">
                  {'★'.repeat(item.rating)}
                </div>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                "{item.comment}"
              </p>
              <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-3 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1 text-[#5D3FD3] dark:text-purple-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Zenith AI Response Published</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 italic">{item.reply}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTERED TRANSPARENT GLASSMORPHIC COMING SOON POPUP MODAL */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
        <div className="relative max-w-2xl w-full bg-slate-900/90 backdrop-blur-2xl border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/80 text-white space-y-6 ring-1 ring-white/10">
          
          {/* Top Floating Glow Badge */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Google Business Suite • Coming Soon</span>
            </div>

            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              Q3 2026 Release
            </span>
          </div>

          {/* Hero Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Automate & Supercharge Your{' '}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                Google Business Reviews
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Connect your Google Maps storefronts, auto-generate hyper-personalized review replies with Zenith AI, and defend your brand reputation on autopilot.
            </p>
          </div>

          {/* Feature Highlight Pills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/30 transition-all flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Instant AI Auto-Responder</div>
                <div className="text-[11px] text-slate-400 leading-normal mt-0.5">
                  Replies to 5-star praise and feedback with custom brand voice in seconds.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/30 transition-all flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Globe2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Multi-Location Sync</div>
                <div className="text-[11px] text-slate-400 leading-normal mt-0.5">
                  Manage dozens of storefronts & regional map locations in one feed.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/30 transition-all flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Reputation Shield</div>
                <div className="text-[11px] text-slate-400 leading-normal mt-0.5">
                  Instant SMS & webhook alerts for 1–3 star ratings before SEO is impacted.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/30 transition-all flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Review Booster Links</div>
                <div className="text-[11px] text-slate-400 leading-normal mt-0.5">
                  Send WhatsApp & SMS invite links to happy customers automatically.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive VIP Early Access Waitlist */}
          <div className="pt-2">
            {isSubscribed ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">You're on the VIP Early Access List!</div>
                  <div className="text-[11px] text-emerald-300">
                    We will notify your account as soon as the Google Business Profile connector goes live.
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoinWaitlist} className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-amber-400" />
                  <span>Get Notified for Beta Access & Free Launch Credits:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="Enter work email for priority access..."
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/90 border border-white/20 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={joining}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
                  >
                    <span>{joining ? 'Saving…' : 'Notify Me'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                {waitlistError && (
                  <p className="text-[11px] font-semibold text-red-300">{waitlistError}</p>
                )}
              </form>
            )}
          </div>

          {/* Footer Navigation Switcher */}
          {onReturnToDashboard && (
            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={onReturnToDashboard}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Workspace Dashboard</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
