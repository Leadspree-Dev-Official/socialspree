import { useClerk, useUser } from '@clerk/react';
import { KeyRound, ShieldCheck } from 'lucide-react';

interface SetNewPasswordViewProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Kept as a compatibility route for old recovery links. Clerk now owns the
 * entire credential lifecycle, so no Supabase password mutation is attempted.
 */
export function SetNewPasswordView({ onCancel }: SetNewPasswordViewProps) {
  const clerk = useClerk();
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-5">
      <div className="w-full max-w-md border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center bg-violet-100 text-[#5D3FD3]">
          <KeyRound size={24} />
        </div>
        <h1 className="mt-6 text-2xl font-black text-slate-950">Manage your password in Clerk</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          SocialSpree uses Clerk for password recovery, verification, MFA, and account security.
        </p>
        <button
          type="button"
          onClick={() => isSignedIn ? clerk.openUserProfile() : clerk.openSignIn()}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-[#5D3FD3] px-4 text-sm font-bold text-white"
        >
          <ShieldCheck className="h-4 w-4" />
          Open Clerk security settings
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="mt-4 w-full text-sm font-semibold text-slate-500">
            Back
          </button>
        )}
      </div>
    </div>
  );
}
