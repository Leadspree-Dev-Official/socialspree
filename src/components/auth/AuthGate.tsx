import { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { LockKeyhole } from 'lucide-react';

interface AuthGateProps {
  onAuthenticated?: () => Promise<void> | void;
  onCancel: () => void;
}

export function AuthGate({ onCancel }: AuthGateProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center p-5 font-['Inter']">
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

