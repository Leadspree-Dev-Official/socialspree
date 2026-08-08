import { useState } from 'react';
import { useSignIn, useClerk, ClerkLoaded, ClerkLoading, SignInButton } from '@clerk/react';
import { 
  LockKeyhole, 
  ShieldCheck, 
  Building2, 
  Sparkles, 
  User, 
  Zap, 
  Mail, 
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface AuthGateProps {
  onAuthenticated?: () => Promise<void> | void;
  onDemoLogin?: (role: 'super_admin' | 'agency' | 'influencer' | 'business') => void;
  onCancel: () => void;
}

export function AuthGate({ onCancel, onDemoLogin, onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn() as any;
  const clerk = useClerk();

  // Official Clerk OAuth Sign-In (Google & Facebook)
  const handleOAuthLogin = async (strategy: 'oauth_google' | 'oauth_facebook') => {
    setAuthError(null);
    try {
      if (signIn && signIn.authenticateWithRedirect) {
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: window.location.origin,
          redirectUrlComplete: window.location.origin
        });
      } else if (clerk && (clerk as any).authenticateWithRedirect) {
        await (clerk as any).authenticateWithRedirect({
          strategy,
          redirectUrl: window.location.origin,
          redirectUrlComplete: window.location.origin
        });
      } else if (clerk && clerk.openSignIn) {
        clerk.openSignIn();
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message;
      setAuthError(msg || `OAuth strategy '${strategy}' requires enabling in Clerk Dashboard -> SSO Connections.`);
    }
  };

  // Official Clerk Email & Password Sign-In (Strict Verification)
  const handleClerkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!emailInput.trim()) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!passwordInput || passwordInput.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    if (!isSignInLoaded || !signIn) {
      setAuthError('Clerk authentication service is initializing. Please try again in a moment.');
      return;
    }

    setAuthLoading(true);
    try {
      const result = await signIn.create({
        identifier: emailInput.trim(),
        password: passwordInput,
      });

      if (result.status === 'complete') {
        if (setActive && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }
        if (onAuthenticated) await onAuthenticated();
      } else {
        setAuthError(`Clerk authentication status: ${result.status}. Additional verification required.`);
      }
    } catch (err: any) {
      const clerkErrMsg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message;
      setAuthError(clerkErrMsg || 'Invalid email or password in Clerk database.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-5 font-['Inter'] space-y-6">
      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* Header Bar */}
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
            className="text-sm font-bold text-[#5D3FD3] hover:underline cursor-pointer"
          >
            {mode === 'sign-in' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
          </button>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D3FD3] text-white shadow-lg shadow-purple-500/20 mb-4">
          <LockKeyhole size={23} />
        </div>

        {/* 1-CLICK QUICK DEMO ROLE LOGIN SELECTOR */}
        {onDemoLogin && (
          <div className="w-full bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-3 mb-4 animate-in fade-in">
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
              <button
                type="button"
                onClick={() => onDemoLogin('super_admin')}
                className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-2xl font-bold text-slate-950 text-left transition-all flex items-center gap-2 group shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-amber-950">Super Admin</div>
                  <div className="text-[9px] font-mono text-amber-700">Root Governance</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onDemoLogin('agency')}
                className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-300 rounded-2xl font-bold text-slate-950 text-left transition-all flex items-center gap-2 group shadow-2xs cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-purple-950">Agency Owner</div>
                  <div className="text-[9px] font-mono text-purple-700">Multi-Brand Suite</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onDemoLogin('influencer')}
                className="p-3 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-2xl font-bold text-slate-950 text-left transition-all flex items-center gap-2 group shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-pink-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-pink-950">Influencer Creator</div>
                  <div className="text-[9px] font-mono text-pink-700">Grid Feed Planner</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onDemoLogin('business')}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-2xl font-bold text-slate-950 text-left transition-all flex items-center gap-2 group shadow-2xs cursor-pointer"
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

        {/* CLERK SOCIAL OAUTH & EMAIL AUTH FORM */}
        <div className="w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <Mail className="w-4 h-4 text-purple-600" />
              <span>Clerk Authentication Engine</span>
            </div>
            <span className="text-[10px] text-purple-700 font-mono font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              @clerk/react SDK
            </span>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* CLERK GOOGLE & FACEBOOK OAUTH BUTTONS */}
          <div className="space-y-2 pt-1">
            <SignInButton mode="modal">
              <button
                type="button"
                className="w-full py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google (Clerk OAuth)</span>
              </button>
            </SignInButton>

            <SignInButton mode="modal">
              <button
                type="button"
                className="w-full py-3 px-4 bg-[#1877F2] hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Continue with Facebook (Clerk OAuth)</span>
              </button>
            </SignInButton>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase">or email authentication</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* CLERK EMAIL & PASSWORD FORM */}
          <form onSubmit={handleClerkSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="name@company.com or leadspree24x7@gmail.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-3 border rounded-xl text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full p-3 border rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating via Clerk...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'sign-in' ? 'Sign In with Clerk' : 'Create Clerk Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <SignInButton mode="modal">
              <button className="text-xs font-bold text-[#5D3FD3] hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto">
                <span>Launch Official Clerk Modal Popup</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </SignInButton>
          </div>
        </div>

      </div>
    </div>
  );
}
