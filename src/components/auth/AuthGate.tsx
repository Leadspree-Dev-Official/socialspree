import { FormEvent, useState, useEffect } from 'react';
import { LockKeyhole, Loader2 } from 'lucide-react';
import { auth } from '../../lib/api';
import { SetNewPasswordView } from './SetNewPasswordView';

interface AuthGateProps {
  onAuthenticated: () => Promise<void> | void;
  onCancel: () => void;
}

export function AuthGate({ onAuthenticated, onCancel }: AuthGateProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'forgot' | 'reset'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('error_code=') || search.includes('error_code=') || hash.includes('error=')) {
        return 'forgot';
      }
      if (hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('access_token')) {
        return 'reset';
      }
    }
    return 'sign-in';
  });

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const isError = hash.includes('error_code=') || search.includes('error_code=') || hash.includes('error=');
    if (isError) {
      setMode('forgot');
      return;
    }

    // Listen for PASSWORD_RECOVERY auth event when Supabase processes recovery token hash
    const { data } = auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && (hash.includes('access_token') || hash.includes('type=recovery')))) {
        setMode('reset');
      }
    });

    // Check existing session on mount: if session exists without explicit error, check if user came via recovery flow
    void auth.getSession().then((session) => {
      if (session && !isError) {
        setMode('reset');
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('error_description=')) {
      const match = /error_description=([^&]+)/.exec(window.location.hash);
      if (match) return decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
    return '';
  });

  if (mode === 'reset') {
    return (
      <SetNewPasswordView
        onSuccess={async () => {
          await onAuthenticated();
        }}
        onCancel={() => setMode('sign-in')}
      />
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const result: any = mode === 'forgot'
      ? await auth.resetPassword(email.trim())
      : mode === 'sign-in' ? await auth.signIn(email.trim(), password) : await auth.signUp(email.trim(), password);
    setBusy(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === 'forgot') { setMessage('If an account exists for that email, a password-reset link has been sent.'); setBusy(false); return; }
    if (mode === 'sign-up' && !result.data.session) {
      setMessage('Check your email to confirm the account, then sign in.');
      setMode('sign-in');
      return;
    }
    await onAuthenticated();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-violet-100 p-7 md:p-9">
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
          ← Back to website
        </button>
        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5D3FD3] text-white">
          <LockKeyhole size={23} />
        </div>
        <h1 className="mt-5 text-3xl font-black text-slate-950">
          {mode === 'sign-in' ? 'Sign in to SocialSpree' : mode === 'forgot' ? 'Reset your password' : 'Create your workspace login'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your workspace and permissions are loaded securely from Supabase.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-bold text-slate-700">
            Email
            <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#5D3FD3]" />
          </label>
          {mode !== 'forgot' && <label className="block text-sm font-bold text-slate-700">
            Password
            <input required minLength={8} type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password} onChange={e => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#5D3FD3]" />
          </label>}
          {message && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5D3FD3] px-4 py-3.5 font-black text-white disabled:opacity-60">
            {busy && <Loader2 size={18} className="animate-spin" />}
            {mode === 'sign-in' ? 'Sign in securely' : mode === 'forgot' ? 'Send reset link' : 'Create account'}
          </button>
        </form>

        {mode === 'sign-in' && <button type="button" onClick={() => { setMode('forgot'); setMessage(''); }} className="mt-4 w-full text-sm font-bold text-slate-500">Forgot password?</button>}
        <button type="button" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setMessage(''); }}
          className="mt-5 w-full text-sm font-bold text-[#5D3FD3]">
          {mode === 'sign-in' || mode === 'forgot' ? 'New here? Create an account' : 'Already registered? Sign in'}
        </button>
      </div>
    </div>
  );
}
