import React from 'react';
import { Building2, Sparkles, Briefcase, ChevronRight } from 'lucide-react';
import { UserRole } from '../../lib/api';

interface RoleOnboardingModalProps {
  onSelectRole: (role: UserRole) => Promise<void>;
  loading?: boolean;
}

export function RoleOnboardingModal({ onSelectRole, loading }: RoleOnboardingModalProps) {
  const [selected, setSelected] = React.useState<UserRole>('business_user');
  const [submitting, setSubmitting] = React.useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onSelectRole(selected);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 font-['Inter']">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-2xl bg-[#5D3FD3] text-white flex items-center justify-center shadow-lg shadow-purple-500/20 font-black">
            SS
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Welcome to SocialSpree</h2>
            <p className="text-xs text-slate-500 font-medium">Select your account type to personalize your workspace</p>
          </div>
        </div>

        <div className="mt-6 space-y-3.5">
          {/* Business User Card */}
          <button
            type="button"
            onClick={() => setSelected('business_user')}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
              selected === 'business_user'
                ? 'border-[#5D3FD3] bg-purple-50/60 ring-2 ring-[#5D3FD3]/30 shadow-md'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className={`p-3 rounded-xl ${selected === 'business_user' ? 'bg-[#5D3FD3] text-white' : 'bg-slate-100 text-slate-700'}`}>
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Business User</h3>
                <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">/dashboard</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage your company's social channels, post composer, content calendar, reviews, & analytics.
              </p>
            </div>
          </button>

          {/* Influencer / Creator Card */}
          <button
            type="button"
            onClick={() => setSelected('influencer')}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
              selected === 'influencer'
                ? 'border-[#5D3FD3] bg-purple-50/60 ring-2 ring-[#5D3FD3]/30 shadow-md'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className={`p-3 rounded-xl ${selected === 'influencer' ? 'bg-[#5D3FD3] text-white' : 'bg-slate-100 text-slate-700'}`}>
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Influencer / Content Creator</h3>
                <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">/infludash</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Aesthetic Instagram Grid planner, media vault, personal brand feeds, & creator tools.
              </p>
            </div>
          </button>

          {/* Agency Card */}
          <button
            type="button"
            onClick={() => setSelected('agency')}
            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-4 ${
              selected === 'agency'
                ? 'border-[#5D3FD3] bg-purple-50/60 ring-2 ring-[#5D3FD3]/30 shadow-md'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className={`p-3 rounded-xl ${selected === 'agency' ? 'bg-[#5D3FD3] text-white' : 'bg-slate-100 text-slate-700'}`}>
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Digital Marketing Agency</h3>
                <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">/agency</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Multi-brand management, client accounts, API slot allocations, & agency team controls.
              </p>
            </div>
          </button>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={submitting || loading}
            onClick={handleConfirm}
            className="flex items-center gap-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
          >
            {submitting || loading ? 'Setting up workspace...' : 'Continue to My Workspace'}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
