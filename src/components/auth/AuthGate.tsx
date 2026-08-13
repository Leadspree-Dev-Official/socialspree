import { SignInButton, SignUpButton, useUser, useClerk } from '@clerk/react';
import { ArrowLeft, LockKeyhole, LogIn, UserPlus, LogOut, Sparkles } from 'lucide-react';

interface AuthGateProps {
  onCancel: () => void;
}

export function AuthGate({ onCancel }: AuthGateProps) {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-5 font-['Inter']">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onCancel}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
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
            Continue with Clerk to access your secured workspace.
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
                  window.location.href = '/dashboard';
                }}
                className="flex h-12 w-full items-center justify-center gap-2 bg-[#5D3FD3] px-4 text-sm font-bold text-white transition-colors hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20"
              >
                <Sparkles className="h-4 w-4" />
                Continue to Workspace
              </button>

              <button
                type="button"
                onClick={() => signOut(() => { window.location.href = '/login'; })}
                className="flex h-11 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 rounded-xl"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out & Switch Account
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-center gap-2 bg-[#5D3FD3] px-4 text-sm font-bold text-white transition-colors hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </button>
              </SignInButton>

              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50 rounded-xl"
                >
                  <UserPlus className="h-4 w-4" />
                  Create account
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
