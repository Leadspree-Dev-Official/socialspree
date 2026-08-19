import { useState } from 'react';
import { SignInButton, SignUpButton, useUser, useClerk } from '@clerk/react';
import { ArrowLeft, LockKeyhole, LogIn, UserPlus, LogOut, Sparkles, Zap, Shield, Building2, User } from 'lucide-react';

interface AuthGateProps {
  onCancel: () => void;
  onInstantDemoLogin?: (role?: 'business_user' | 'super_admin' | 'agency' | 'influencer') => void;
  onContinueToWorkspace?: () => void;
}

export function AuthGate({ onCancel, onInstantDemoLogin, onContinueToWorkspace }: AuthGateProps) {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [selectedDemoRole, setSelectedDemoRole] = useState<'business_user' | 'super_admin' | 'agency' | 'influencer'>('business_user');

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-5 font-['Inter']">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onCancel}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to website
        </button>

        <div className="border border-slate-200 bg-white p-7 shadow-xl rounded-2xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center bg-[#5D3FD3] text-white rounded-xl shadow-md shadow-purple-500/20">
            <LockKeyhole size={23} />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Access SocialSpree</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in with Clerk or try our instant interactive demo workspace.
          </p>

          {isSignedIn && user ? (
            <div className="mt-6 space-y-4">
              <div className="bg-purple-50 border border-purple-200/80 p-3.5 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#5D3FD3] text-white font-bold flex items-center justify-center text-xs">
                  {user.firstName?.slice(0, 2).toUpperCase() || user.primaryEmailAddress?.emailAddress?.slice(0, 2).toUpperCase() || 'US'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user.fullName || user.primaryEmailAddress?.emailAddress}
                  </div>
                  <div className="text-[11px] text-purple-700 font-mono truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onContinueToWorkspace) {
                    onContinueToWorkspace();
                  } else {
                    window.location.href = '/dashboard';
                  }
                }}
                className="flex h-12 w-full items-center justify-center gap-2 bg-[#5D3FD3] px-4 text-sm font-bold text-white transition-colors hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                Continue to Workspace
              </button>

              <button
                type="button"
                onClick={() => signOut(() => { window.location.href = '/login'; })}
                className="flex h-11 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out & Switch Account
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {/* Instant Demo Login Highlight Card */}
              {onInstantDemoLogin && (
                <div className="p-4 bg-gradient-to-br from-purple-50 via-indigo-50/50 to-blue-50 border-2 border-purple-200/90 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#5D3FD3] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-[#5D3FD3]" />
                      Instant Demo Sandbox
                    </span>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      No Sign-up
                    </span>
                  </div>

                  {/* Role Selector Pills */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/80 rounded-xl border border-purple-200/60">
                    <button
                      type="button"
                      onClick={() => setSelectedDemoRole('business_user')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        selectedDemoRole === 'business_user'
                          ? 'bg-[#5D3FD3] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      Business
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDemoRole('agency')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        selectedDemoRole === 'agency'
                          ? 'bg-[#5D3FD3] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
                      }`}
                    >
                      <Building2 className="w-3 h-3" />
                      Agency
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDemoRole('super_admin')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        selectedDemoRole === 'super_admin'
                          ? 'bg-[#5D3FD3] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-purple-50'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      Admin
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onInstantDemoLogin(selectedDemoRole)}
                    className="flex h-12 w-full items-center justify-center gap-2 bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-[#0066FF] px-4 text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl shadow-lg shadow-purple-500/25 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                    <span>Instant Demo Login ({selectedDemoRole === 'super_admin' ? 'Master Admin' : selectedDemoRole === 'agency' ? 'Agency Mode' : 'Business User'})</span>
                  </button>
                </div>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-xs font-semibold uppercase tracking-wider">or sign in with credentials</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="space-y-2.5">
                <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 rounded-xl cursor-pointer"
                  >
                    <LogIn className="h-4 w-4 text-slate-600" />
                    Sign in with Clerk
                  </button>
                </SignInButton>

                <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center gap-2 border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5 text-slate-500" />
                    Create new account
                  </button>
                </SignUpButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

