import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Tenant, Post, SocialAccount } from '../../types';
import { BarChart3, TrendingUp, Users, Eye, Zap, ArrowUpRight, Share2 } from 'lucide-react';

interface AnalyticsViewProps {
  tenant: Tenant;
  posts: Post[];
  accounts: SocialAccount[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tenant,
  posts,
  accounts
}) => {
  const [engagement, setEngagement] = useState(0);
  const [syncedAt, setSyncedAt] = useState<string>();
  const [loading, setLoading] = useState(false);
  const loadAnalytics = async (refresh = false) => {
    setLoading(true);
    if (refresh) await supabase.functions.invoke('zernio-analytics', { body: { tenantId: tenant.id } });
    const { data } = await supabase.from('analytics_snapshots').select('views,likes,comments,shares,synced_at').eq('tenant_id', tenant.id);
    setEngagement((data ?? []).reduce((n, row) => n + Number(row.views || 0) + Number(row.likes || 0) + Number(row.comments || 0) + Number(row.shares || 0), 0));
    setSyncedAt(data?.map(x => x.synced_at).sort().at(-1)); setLoading(false);
  };
  useEffect(() => { void loadAnalytics(); }, [tenant.id]);
  const tenantPosts = posts.filter(p => p.tenantId === tenant.id);
  const tenantAccounts = accounts.filter(a => a.tenantId === tenant.id);

  const totalPublished = tenantPosts.filter(p => p.status === 'published').length;
  const totalScheduled = tenantPosts.filter(p => p.status === 'scheduled').length;
  const totalChannels = tenantAccounts.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0066FF]" />
            <span>Cross-Platform Analytics Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time engagement breakdown and publishing performance metrics across all connected accounts.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-900 font-medium flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <button onClick={() => void loadAnalytics(true)} disabled={loading}>{loading ? 'Syncing…' : 'Refresh Zernio Data'}</button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>TOTAL PUBLISHED</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalPublished}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">+18% from last week</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>SCHEDULED QUEUE</span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-purple-600">{totalScheduled}</div>
          <div className="text-[11px] text-purple-700 font-semibold">Active Cloud Scheduler</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>CONNECTED CHANNELS</span>
            <Share2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-blue-600">{totalChannels}</div>
          <div className="text-[11px] text-blue-700 font-semibold">Limit: {tenant.maxSocialAccounts} Max</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>TOTAL ENGAGEMENT</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{engagement.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">{syncedAt ? `Synced ${new Date(syncedAt).toLocaleString()}` : 'No Zernio analytics synced yet'}</div>
        </div>
      </div>

      {/* Visual Chart Simulation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Weekly Impressions & Post Volume</h3>
            <p className="text-xs text-slate-500">Cross-channel reach breakdown across Instagram, LinkedIn & X</p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded">Last 7 Days</span>
        </div>

        <div className="h-64 flex items-end gap-4 pt-6 px-4">
          {[
            { day: 'Mon', count: 12, height: '40%' },
            { day: 'Tue', count: 24, height: '65%' },
            { day: 'Wed', count: 18, height: '50%' },
            { day: 'Thu', count: 35, height: '85%' },
            { day: 'Fri', count: 28, height: '70%' },
            { day: 'Sat', count: 15, height: '45%' },
            { day: 'Sun', count: 42, height: '95%' }
          ].map((bar, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
              <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {bar.count} posts
              </div>
              <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden h-48 flex items-end">
                <div
                  style={{ height: bar.height }}
                  className="w-full bg-gradient-to-t from-[#0066FF] to-indigo-500 rounded-t-xl group-hover:from-blue-700 group-hover:to-indigo-600 transition-all duration-300"
                />
              </div>
              <div className="text-xs font-semibold text-slate-600 font-mono">{bar.day}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
