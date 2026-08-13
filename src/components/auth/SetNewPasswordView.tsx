import { useEffect } from 'react';
import { useClerk, useUser } from '@clerk/react';
import { ArrowLeft, KeyRound, ShieldCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SetNewPasswordViewProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Dedicated password reset route (/reset, /reset-password, /set-password).
 * Directs users into Clerk's secure credential recovery flow.
 */
export function SetNewPasswordView({ onCancel }: SetNewPasswordViewProps) {
  const clerk = useClerk();
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isSignedIn) {
      const timer = setTimeout(() => {
        try {
          clerk.openSignIn();
        } catch {
          /* ignore if already open */
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, clerk]);

  const handleBackToSignIn = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-5 font-['Inter']">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={handleBackToSignIn}
          className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>

        <div className="border border-slate-200 bg-white p-8 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex h-12 w-12 items-center justify-center bg-violet-100 text-[#5D3FD3] rounded-xl shadow-xs">
              <KeyRound size={24} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-200">
              <Lock className="w-3 h-3" />
              <span>Encrypted Session</span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Set New Password</h1>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Create a strong password to protect your SocialSpree account & integrated social channels via Clerk Auth.
          </p>

          <div className="mt-6 space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-900">Password Security Requirements:</div>
              <ul className="space-y-1.5 text-slate-600 text-[11px]">
                <li className="flex items-center gap-2">✓ At least 8 characters long</li>
                <li className="flex items-center gap-2">✓ Contains at least 1 number</li>
                <li className="flex items-center gap-2">✓ Contains at least 1 special character</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => isSignedIn ? clerk.openUserProfile() : clerk.openSignIn()}
              className="w-full h-12 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-500/20 text-xs transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Update Password via Clerk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
