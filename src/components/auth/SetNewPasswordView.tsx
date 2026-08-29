import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, KeyRound, ShieldCheck, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SetNewPasswordViewProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Dedicated password reset view (/reset, /reset-password, /set-password).
 * Directs users into Supabase Auth's secure credential update flow.
 */
export function SetNewPasswordView({ onSuccess, onCancel }: SetNewPasswordViewProps) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Check if recovery session is active or hash token exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionChecked(true);
    });
  }, []);

  const handleBackToSignIn = () => {
    try {
      sessionStorage.removeItem('spree_recovery_active');
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch { /* ignore */ }
    if (onCancel) {
      onCancel();
    } else {
      navigate('/login');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!password) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to update password. Your reset link may have expired.');
        return;
      }

      try {
        sessionStorage.removeItem('spree_recovery_active');
        if (typeof window !== 'undefined' && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch { /* ignore */ }

      setSuccessMsg('Your password has been successfully updated! Redirecting to login...');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/login');
        }
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while updating your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex items-center justify-center p-5 font-['Inter'] animate-in fade-in transition-colors duration-150">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={handleBackToSignIn}
          className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>

        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex h-12 w-12 items-center justify-center bg-violet-100 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 rounded-xl shadow-xs">
              <KeyRound size={24} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
              <Lock className="w-3 h-3" />
              <span>Encrypted Session</span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">Set New Password</h1>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Create a strong password to protect your SocialSpree account & integrated social channels.
          </p>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium flex items-center gap-2 mt-4 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium flex items-start gap-2 mt-4 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="mt-6 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:border-[#5D3FD3] outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:border-[#5D3FD3] outline-none font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
              <div className="font-bold text-slate-800 dark:text-slate-200">Password Tips:</div>
              <ul className="space-y-1">
                <li className="flex items-center gap-1.5">✓ Minimum 6 characters (8+ recommended)</li>
                <li className="flex items-center gap-1.5">✓ Use letters, numbers, and symbols</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save New Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
