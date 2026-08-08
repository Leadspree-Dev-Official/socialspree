import React from 'react';
import { GLOBAL_SYSTEM_SETTINGS } from '../../lib/store';
import { Building2, Sparkles, ShieldCheck } from 'lucide-react';

export const SystemModeBanner: React.FC = () => {
  const { agencyModeEnabled, influencerModeEnabled } = GLOBAL_SYSTEM_SETTINGS;

  if (!agencyModeEnabled && !influencerModeEnabled) return null;

  return (
    <div className={`px-4 py-2 text-xs font-bold text-white flex items-center justify-between shadow-xs border-b ${
      agencyModeEnabled 
        ? 'bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 border-purple-800/80' 
        : 'bg-gradient-to-r from-amber-950 via-slate-900 to-pink-950 border-amber-800/80'
    }`}>
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          {agencyModeEnabled ? (
            <>
              <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-mono text-[11px]">
                <strong className="text-purple-300">SERVER DEPLOYMENT MODE:</strong> DEDICATED AGENCY MULTI-BRAND INSTANCE (Public website signups OFF)
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-mono text-[11px]">
                <strong className="text-amber-300">SERVER DEPLOYMENT MODE:</strong> INFLUENCER & CREATOR DEDICATED INSTANCE (Feed planner enabled)
              </span>
            </>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded border border-white/10">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Super Admin Enforced</span>
        </div>
      </div>
    </div>
  );
};
