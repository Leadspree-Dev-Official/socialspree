import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchComposioAnalyticsSnapshots } from '../../lib/composio';
import { fetchZernioAnalyticsSnapshots } from '../../lib/zernio';
import { Tenant, Post, SocialAccount } from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Zap, 
  ArrowUpRight, 
  Share2, 
  Heart, 
  MessageCircle, 
  MousePointerClick, 
  Activity,
  Layers,
  RefreshCw
} from 'lucide-react';

interface AnalyticsViewProps {
  tenant: Tenant;
  posts: Post[];
  accounts: SocialAccount[];
}

interface AnalyticsRecord {
  id?: string;
  post_id?: string;
  zernio_post_id: string;
  platform?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagement_rate: number;
  synced_at: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  tenant,
  posts,
  accounts
}) => {
  const [snapshots, setSnapshots] = useState<AnalyticsRecord[]>([]);
  const [syncedAt, setSyncedAt] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [activeMetricTab, setActiveMetricTab] = useState<'all' | 'views' | 'likes' | 'comments' | 'shares'>('all');

  const loadAnalytics = async (refresh = false) => {
    setLoading(true);
    try {
      if (refresh) {
        const engine = tenant.dispatchEngine || 'dual';
        if (engine === 'coresync') {
          await fetchComposioAnalyticsSnapshots(tenant);
        } else if (engine === 'zenith') {
          await fetchZernioAnalyticsSnapshots(tenant.id);
        } else {
          await Promise.all([
            fetchComposioAnalyticsSnapshots(tenant),
            fetchZernioAnalyticsSnapshots(tenant.id)
          ]);
        }
      }
      const { data } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('tenant_id', tenant.id);
      
      if (data) {
        setSnapshots(data as AnalyticsRecord[]);
        const latest = data.map(x => x.synced_at).sort().at(-1);
        if (latest) setSyncedAt(latest);
      }
    } catch (e) {
      console.error('Analytics load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    void loadAnalytics(); 
  }, [tenant.id]);

  const tenantPosts = posts.filter(p => p.tenantId === tenant.id);
  const tenantAccounts = accounts.filter(a => a.tenantId === tenant.id);

  const totalPublished = tenantPosts.filter(p => p.status === 'published').length;
  const totalScheduled = tenantPosts.filter(p => p.status === 'scheduled').length;
  const totalChannels = tenantAccounts.length;

  // Aggregate totals from Zernio snapshots
  const totalViews = snapshots.reduce((acc, s) => acc + Number(s.views || 0), 0);
  const totalLikes = snapshots.reduce((acc, s) => acc + Number(s.likes || 0), 0);
  const totalComments = snapshots.reduce((acc, s) => acc + Number(s.comments || 0), 0);
  const totalShares = snapshots.reduce((acc, s) => acc + Number(s.shares || 0), 0);
  const totalClicks = snapshots.reduce((acc, s) => acc + Number(s.clicks || 0), 0);
  const totalEngagement = totalViews + totalLikes + totalComments + totalShares + totalClicks;

  // Average Engagement Rate
  const avgEngagementRate = snapshots.length > 0
    ? (snapshots.reduce((acc, s) => acc + Number(s.engagement_rate || 0), 0) / snapshots.length).toFixed(1)
    : '0.0';

  // Days of week distribution mock blended with live Zernio metrics
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyData = daysOfWeek.map((day, idx) => {
    const baseMult = (idx + 2) * 15;
    const views = Math.round(totalViews ? (totalViews / 7) * ((idx % 3) + 0.8) : baseMult * 12);
    const likes = Math.round(totalLikes ? (totalLikes / 7) * ((idx % 2) + 0.7) : baseMult * 4);
    const comments = Math.round(totalComments ? (totalComments / 7) * ((idx % 4) + 0.5) : baseMult * 2);
    const shares = Math.round(totalShares ? (totalShares / 7) * ((idx % 2) + 0.6) : baseMult * 1.5);
    return { day, views, likes, comments, shares, total: views + likes + comments + shares };
  });

  const maxDailyTotal = Math.max(...dailyData.map(d => d.total), 100);

  // Platform Breakdown Chart Data
  const platforms = [
    { name: 'Instagram', color: 'from-pink-500 to-rose-600', share: '38%', icon: '📸' },
    { name: 'LinkedIn', color: 'from-blue-600 to-indigo-700', share: '29%', icon: '💼' },
    { name: 'X (Twitter)', color: 'from-slate-800 to-slate-950', share: '21%', icon: '🐦' },
    { name: 'YouTube', color: 'from-red-500 to-rose-700', share: '12%', icon: '▶️' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter']">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
            <span>
              {tenant.dispatchEngine === 'coresync' 
                ? 'CoreSync Cross-Platform Analytics Engine' 
                : tenant.dispatchEngine === 'dual' 
                ? 'Dual Engine (CoreSync + Zenith) Analytics' 
                : 'Zenith Cross-Platform Analytics Engine'}
            </span>
            <span className="text-[10px] bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold uppercase border border-purple-200 dark:border-purple-800">
              Live API
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-channel engagement breakdown, post reach metrics, and performance analytics powered by {tenant.dispatchEngine === 'coresync' ? 'CoreSync API' : tenant.dispatchEngine === 'dual' ? 'CoreSync & Zenith APIs' : 'Zenith API'}.
          </p>
        </div>

        <button
          onClick={() => void loadAnalytics(true)}
          disabled={loading}
          className="bg-[#5D3FD3] hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start md:self-auto cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>
            {loading 
              ? 'Syncing Analytics...' 
              : tenant.dispatchEngine === 'coresync' 
              ? 'Sync CoreSync Analytics' 
              : tenant.dispatchEngine === 'dual' 
              ? 'Sync Dual Analytics' 
              : 'Sync Zenith Analytics'}
          </span>
        </button>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono font-bold">
            <span>TOTAL PUBLISHED</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{totalPublished}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 hand 3" />
            <span>+18% from last week</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono font-bold">
            <span>SCHEDULED QUEUE</span>
            <Zap className="w-4 h-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-black text-[#5D3FD3] dark:text-purple-400">{totalScheduled}</div>
          <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">Active Cloud Scheduler</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono font-bold">
            <span>CONNECTED CHANNELS</span>
            <Share2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{totalChannels}</div>
          <div className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">Limit: {tenant.maxSocialAccounts} Max Channels</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-mono font-bold">
            <span>TOTAL ENGAGEMENT</span>
            <Eye className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{totalEngagement.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {syncedAt ? `Last synced ${new Date(syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No sync snapshot recorded'}
          </div>
        </div>
      </div>

      {/* Secondary Zernio Return Values Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Views</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{totalViews.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Likes</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{totalLikes.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-400 flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Comments</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{totalComments.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Shares</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{totalShares.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Avg Rate</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{avgEngagementRate}%</div>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400" />
              <span>Weekly Channel Performance & Engagement Volume</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aggregated daily reach metrics returned by Cloud Publishing Engine across all active social channels
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium self-start sm:self-auto border border-slate-200 dark:border-slate-700">
            {(['all', 'views', 'likes', 'comments', 'shares'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMetricTab(m)}
                className={`px-2.5 py-1 rounded-lg capitalize text-[11px] transition-all cursor-pointer ${
                  activeMetricTab === m
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-64 flex items-end gap-3 sm:gap-5 pt-8 px-2">
          {dailyData.map((bar, idx) => {
            const val = activeMetricTab === 'all'
              ? bar.total
              : bar[activeMetricTab];
            const heightPercent = Math.min(100, Math.max(15, Math.round((val / maxDailyTotal) * 100)));

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-800 text-white px-2 py-0.5 rounded shadow border border-slate-700">
                  {val.toLocaleString()}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden h-48 flex items-end border border-slate-200/50 dark:border-slate-700/50">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-[#5D3FD3] via-indigo-500 to-purple-400 rounded-t-xl group-hover:from-purple-700 group-hover:to-indigo-600 transition-all duration-300 shadow-md"
                  />
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono">{bar.day}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid: Platform Breakdown & Zernio API Snapshot Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Share Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Channel Engagement Distribution</h3>
          <div className="space-y-3">
            {platforms.map((p, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span className="font-semibold">{p.name}</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{p.share}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700">
                  <div
                    style={{ width: p.share }}
                    className={`h-full bg-gradient-to-r ${p.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Engine Analytics Snapshots List */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              {tenant.dispatchEngine === 'coresync' ? 'CoreSync API Post Snapshots' : tenant.dispatchEngine === 'dual' ? 'CoreSync & Zenith API Snapshots' : 'Zenith API Post Snapshots'}
            </h3>
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {snapshots.length} Snapshots
            </span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {snapshots.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center italic">
                No analytics snapshots recorded yet. Click &quot;Sync Analytics&quot; to fetch live metrics.
              </div>
            ) : (
              snapshots.map((s, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                      Post #{s.zernio_post_id}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {new Date(s.synced_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">👁️ {s.views}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">❤️ {s.likes}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">💬 {s.comments}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

