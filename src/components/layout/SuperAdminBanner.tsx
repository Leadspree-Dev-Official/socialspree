import React from 'react';
import { ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { SUPER_ADMIN_EMAIL } from '../../lib/store';

interface SuperAdminBannerProps {
  isSuperAdminMode: boolean;
  onToggleSuperAdmin: () => void;
  userEmail?: string;
}

export const SuperAdminBanner: React.FC<SuperAdminBannerProps> = ({
  isSuperAdminMode,
  onToggleSuperAdmin,
  userEmail
}) => {
  if (!isSuperAdminMode) return null;
  const activeEmail = userEmail || SUPER_ADMIN_EMAIL;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-purple-700 to-indigo-800 text-white px-4 py-2 text-sm flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2 font-medium">
        <ShieldCheck className="w-5 h-5 text-amber-300 animate-pulse" />
        <span>
          <strong>SUPER ADMIN ACCESS ACTIVE</strong> &mdash; Logged in as <code className="bg-black/30 px-2 py-0.5 rounded text-amber-200">{activeEmail}</code>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs bg-amber-400/20 border border-amber-300/30 text-amber-200 px-2 py-0.5 rounded font-mono">
          Full Tenant & Subscription Override
        </span>
        <button
          onClick={onToggleSuperAdmin}
          className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded transition-all font-medium flex items-center gap-1"
        >
          <UserCheck className="w-3.5 h-3.5" />
          Exit Super Admin Mode
        </button>
      </div>
    </div>
  );
};
