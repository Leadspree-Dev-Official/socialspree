import React, { useState, FormEvent } from 'react';
import { KeyRound, CheckCircle2, ShieldCheck, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { auth } from '../../lib/api';

interface SetNewPasswordViewProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SetNewPasswordView({ onSuccess, onCancel }: SetNewPasswordViewProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Validation Rules
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.exec(password) !== null;
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.exec(password) !== null;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasNumber && hasSpecial && passwordsMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!hasMinLength || !hasNumber || !hasSpecial) {
      setErrorMsg('Password does not meet all security requirements.');
      return;
    }

    setBusy(true);
    try {
      const result = await auth.updatePassword(password);
      if (result.error) {
        setErrorMsg(result.error.message);
      } else {
        setSuccessMsg('Your password has been updated successfully.');
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1800);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred while updating your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl shadow-violet-100/60 p-7 md:p-9 relative overflow-hidden">
        {/* Top Decorative Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600" />

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4 inline-block"
          >
            ← Back to sign in
          </button>
        )}

        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-[#5D3FD3]">
            <KeyRound size={24} />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <ShieldCheck size={14} /> Encrypted Session
          </span>
        </div>

        <h1 className="mt-6 text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
          Set New Password
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Create a strong password to protect your SocialSpree account & integrated social channels.
        </p>

        {successMsg ? (
          <div className="mt-6 rounded-2xl bg-emerald-50 p-5 border border-emerald-200 text-center animate-fadeIn">
            <CheckCircle2 size={36} className="mx-auto text-emerald-600 mb-2" />
            <h3 className="text-base font-bold text-emerald-900">Password Changed!</h3>
            <p className="text-xs text-emerald-700 mt-1">{successMsg}</p>
            <p className="text-xs text-slate-400 mt-3">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* New Password Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#5D3FD3] focus:ring-2 focus:ring-violet-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#5D3FD3] focus:ring-2 focus:ring-violet-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Validation Requirements Checklist */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Password Requirements:</span>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={hasMinLength ? 'text-emerald-500' : 'text-slate-300'}
                />
                <span className={hasMinLength ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  At least 8 characters long
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={hasNumber ? 'text-emerald-500' : 'text-slate-300'}
                />
                <span className={hasNumber ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Contains at least 1 number
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={hasSpecial ? 'text-emerald-500' : 'text-slate-300'}
                />
                <span className={hasSpecial ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Contains at least 1 special character (!@#$%^&*)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2
                  size={15}
                  className={passwordsMatch ? 'text-emerald-500' : 'text-slate-300'}
                />
                <span className={passwordsMatch ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Passwords match
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs font-medium text-red-800">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              disabled={busy || !isFormValid}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5D3FD3] hover:bg-[#4d33b8] active:bg-[#432c9f] px-4 py-3.5 font-extrabold text-white shadow-lg shadow-violet-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password & Sign In'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
