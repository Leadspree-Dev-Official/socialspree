import { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { LockKeyhole, ShieldCheck, Building2, Sparkles, User, Zap } from 'lucide-react';

interface AuthGateProps {
  onAuthenticated?: () => Promise<void> | void;
  onDemoLogin?: (role: 'super_admin' | 'agency' | 'influencer' | 'business') => void;
  onCancel: () => void;
}

export function AuthGate({ onCancel, onDemoLogin }: AuthGateProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-5 font-['Inter'] space-y-6">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              onCancel();
            }}
            className="text-sm font-bold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
          >
            ← Back to website
          </button>
          
          <button
            type="button"
            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            className="text-sm font-bold text-[#5D3FD3] hover:underline"
          >
            {mode === 'sign-in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
          </button>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D3FD3] text-white shadow-lg shadow-purple-500/20 mb-4">
          <LockKeyhole size={23} />
        </div>

        {/* 1-CLICK DEMO LOGIN ACCOUNTS BAR */}
        {onDemoLogin && (
          <div className="w-full bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-3 mb-6 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>1-Click Quick Demo Role Login</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded uppercase">
                Instant Access
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* DEMO 1: SUPER ADMIN */}
              <button
                type="button"
                onClick={() => onDemoLogin('super_admin')}
                className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-2xl font-bold text-slate-950 text-left transition-all flex items-center gap-2 group shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-950">Super Admin</div>
                  <div className="text-[9px] font-mono text-amber-700">Root Governance</div>
                </div>
              </button>

              {/* DEMO 2: AGENCY OWNER */}
              <button
                type="button"
                onClick={() => onDemoLogin('agency')}
                className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-2xl font-bold text-slate-950 text-left transition-all flex items-center gap-2 group shadow-2xs"
              >
                <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-purple-950">Agency Owner</div>
                  <div className="text-[9px] font-mono text-purple-700">Multi-Brand Suite</div>
                </div>
              </button>

              {/* DEMO 3: INFLUENCER CREATOR */}
              <button
                type="button"
                onClick={() => onDemoLogin('influencer')}
                className="p-3 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-2xl font-bold text-slate-950 text-left transition-all flex items-center gap-2 group shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-pink-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-pink-950">Influencer Creator</div>
                  <div className="text-[9px] font-mono text-pink-700">Grid Feed Planner</div>
                </div>
              </button>

              {/* DEMO 4: BUSINESS USER */}
              <button
                type="button"
                onClick={() => onDemoLogin('business')}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-2xl font-bold text-slate-950 text-left transition-all flex items-center gap-2 group shadow-2xs"
              >
                <User className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-950">Business User</div>
                  <div className="text-[9px] font-mono text-emerald-700">Standard SaaS</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* OFFICIAL CLERK AUTH COMPONENT */}
        <div className="w-full flex justify-center">
          {mode === 'sign-in' ? (
            <SignIn 
              appearance={{
                elements: {
                  rootBox: "w-full shadow-2xl shadow-violet-100 rounded-3xl overflow-hidden",
                  card: "shadow-none border border-slate-200 rounded-3xl",
                  headerTitle: "text-slate-950 font-black text-2xl",
                  formButtonPrimary: "bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold"
                }
              }}
            />
          ) : (
            <SignUp 
              appearance={{
                elements: {
                  rootBox: "w-full shadow-2xl shadow-violet-100 rounded-3xl overflow-hidden",
                  card: "shadow-none border border-slate-200 rounded-3xl",
                  headerTitle: "text-slate-950 font-black text-2xl",
                  formButtonPrimary: "bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold"
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
