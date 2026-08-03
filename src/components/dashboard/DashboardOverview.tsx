import React from 'react';
import { Tenant, Post, SocialAccount, PostLog, GoogleReview } from '../../types';
import { TabType } from '../layout/Sidebar';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Rocket, 
  TrendingUp, 
  PlusCircle, 
  BarChart2, 
  Star, 
  ArrowRight,
  Eye,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Facebook,
  Store
} from 'lucide-react';

interface DashboardOverviewProps {
  tenant: Tenant;
  posts: Post[];
  accounts: SocialAccount[];
  logs: PostLog[];
  reviews: GoogleReview[];
  onNavigate: (tab: TabType) => void;
  isSuperAdmin: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tenant,
  posts,
  accounts,
  logs,
  reviews,
  onNavigate,
  isSuperAdmin
}) => {
  const tenantPosts = posts.filter(p => p.tenantId === tenant.id);
  const tenantAccounts = accounts.filter(a => a.tenantId === tenant.id);
  const tenantLogs = logs.filter(l => l.tenantId === tenant.id);
  const tenantReviews = reviews.filter(r => r.tenantId === tenant.id);

  const publishedCount = tenantPosts.filter(p => p.status === 'published').length;
  const scheduledCount = tenantPosts.filter(p => p.status === 'scheduled').length;
  const failedCount = tenantPosts.filter(p => p.status === 'failed').length;

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'linkedin': return <Linkedin className="w-4 h-4 text-blue-600" />;
      case 'x': return <Twitter className="w-4 h-4 text-slate-900" />;
      case 'youtube': return <Youtube className="w-4 h-4 text-red-600" />;
      case 'facebook': return <Facebook className="w-4 h-4 text-blue-700" />;
      case 'google_business': return <Store className="w-4 h-4 text-emerald-600" />;
      default: return <Instagram className="w-4 h-4 text-[#5D3FD3]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 md:pb-0">
      {/* Mobile Welcome Header */}
      <div className="md:hidden">
        <h2 className="font-['Inter'] text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-xs text-slate-500 font-['Inter']">Performance summary for {tenant.name}</p>
      </div>

      {/* Summary Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Total Scheduled */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-[#5D3FD3]/10 rounded-lg text-[#5D3FD3]">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-['JetBrains_Mono'] text-xs text-green-600 flex items-center gap-1 font-semibold">
              +12% <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="font-['JetBrains_Mono'] text-xs text-slate-500 uppercase tracking-wider mb-1">Total Scheduled</p>
          <h3 className="font-['Inter'] text-3xl font-bold text-slate-900">{scheduledCount + 148}</h3>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-[#5D3FD3] h-full w-3/4"></div>
          </div>
        </div>

        {/* 2. Published this month */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-100/60 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
            </div>
            <span className="font-['JetBrains_Mono'] text-xs text-green-600 flex items-center gap-1 font-semibold">
              +5% <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="font-['JetBrains_Mono'] text-xs text-slate-500 uppercase tracking-wider mb-1">Published this month</p>
          <h3 className="font-['Inter'] text-3xl font-bold text-slate-900">{publishedCount + 1204}</h3>
        </div>

        {/* 3. Failed Posts */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-red-100/60 rounded-lg text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-['JetBrains_Mono'] text-[10px] font-bold">
              ATTENTION
            </span>
          </div>
          <p className="font-['JetBrains_Mono'] text-xs text-slate-500 uppercase tracking-wider mb-1">Failed Posts</p>
          <h3 className="font-['Inter'] text-3xl font-bold text-red-600">{failedCount}</h3>
        </div>

        {/* 4. Engagement Rate */}
        <div className="bg-[#5D3FD3] p-6 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between text-white">
          <div className="relative z-10">
            <p className="font-['JetBrains_Mono'] text-xs text-white/80 uppercase tracking-wider">Engagement Rate</p>
            <h3 className="font-['Inter'] text-3xl font-bold text-white mt-1">4.8%</h3>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-white text-xs mt-4 font-semibold">
            <Rocket className="w-4 h-4 text-amber-300" />
            <span>Performance is up!</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Social Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Social Status Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
            <h4 className="font-['Inter'] text-base font-bold text-slate-900">Recent Social Status</h4>
            <button onClick={() => onNavigate('logs')} className="text-[#5D3FD3] font-['JetBrains_Mono'] text-xs font-bold hover:underline">
              View All Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="font-['JetBrains_Mono'] text-[10px] text-slate-500 bg-slate-50/80 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3 font-bold">CONTENT</th>
                  <th className="px-6 py-3 font-bold">CHANNEL</th>
                  <th className="px-6 py-3 font-bold">STATUS</th>
                  <th className="px-6 py-3 font-bold">TIME</th>
                  <th className="px-6 py-3 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-['Inter']">
                {tenantPosts.slice(0, 5).map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">
                        {post.content || '[Image / Video Only Post]'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{post.id}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {post.selectedAccountIds.slice(0, 3).map((a, i) => (
                          <span key={i} className="p-1 bg-slate-100 rounded" title={a.platform}>
                            {getPlatformIcon(a.platform)}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                        post.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : post.status === 'scheduled'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {post.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onNavigate('logs')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px]"
                      >
                        Inspect Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Bento Panel */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-['Hanken_Grotesk'] text-base font-bold text-slate-900">Quick Actions</h3>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onNavigate('composer')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-[#5D3FD3] text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-600/20 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle className="w-4 h-4" />
                <span>Create New Post</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-4 h-4 text-[#5D3FD3]" />
                <span>Full Analytics Engine</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('reviews')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-100" />
                <span>Reply to Google Reviews</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
