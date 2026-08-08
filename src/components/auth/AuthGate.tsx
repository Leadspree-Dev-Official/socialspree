import { SignInButton, SignUpButton } from '@clerk/react';
import { ArrowLeft, LockKeyhole, LogIn, UserPlus } from 'lucide-react';

interface AuthGateProps {
  onCancel: () => void;
}

export function AuthGate({ onCancel }: AuthGateProps) {
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

        <div className="border border-slate-200 bg-white p-7 shadow-xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center bg-[#5D3FD3] text-white">
            <LockKeyhole size={23} />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Access SocialSpree</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Continue with Clerk to access your secured workspace.
          </p>

          <div className="mt-6 space-y-3">
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center gap-2 bg-[#5D3FD3] px-4 text-sm font-bold text-white transition-colors hover:bg-purple-700"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
            </SignInButton>

            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition-colors hover:bg-slate-50"
              >
                <UserPlus className="h-4 w-4" />
                Create account
              </button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </div>
  );
}
