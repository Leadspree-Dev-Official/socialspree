import React, { useState } from 'react';
import { Tenant, SocialAccount, Post, SocialPlatform, SelectedAccountRef } from '../../types';
import { executePublishing } from '../../lib/zernio';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Grid, 
  List, 
  CheckCircle2, 
  Share2, 
  X, 
  Instagram, 
  Linkedin, 
  Facebook, 
  Youtube, 
  Twitter, 
  Store, 
  Upload, 
  Sparkles,
  Edit2,
  Trash2,
  Send,
  Eye,
  Filter,
  Check
} from 'lucide-react';

interface CalendarViewProps {
  tenant: Tenant;
  accounts: SocialAccount[];
  posts: Post[];
  onPostPublished: (post: Post, log: any) => void;
  onDeletePost?: (postId: string) => void;
  onNavigate: (tab: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tenant,
  accounts,
  posts,
  onPostPublished,
  onDeletePost,
  onNavigate,
}) => {
  // Calendar Control States
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');

  // Quick Post Modal State
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [targetSlotDate, setTargetSlotDate] = useState<string>('');
  const [targetSlotTime, setTargetSlotTime] = useState<string>('10:00');
  const [quickContent, setQuickContent] = useState('');
  const [quickMediaUrl, setQuickMediaUrl] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccountRef[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Inspect Post Modal State
  const [inspectPost, setInspectPost] = useState<Post | null>(null);

  const tenantAccounts = accounts.filter(a => a.tenantId === tenant.id);
  const tenantPosts = posts.filter(p => p.tenantId === tenant.id);

  const todayIso = new Date().toISOString().split('T')[0];

  const formatShortDate = (d: Date) => {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${date}/${year}`;
  };

  // Date Navigation Handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Compute Monday of current week for Week View
  const getStartOfWeek = (baseDate: Date) => {
    const d = new Date(baseDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const mondayDate = getStartOfWeek(currentDate);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(mondayDate);
    day.setDate(mondayDate.getDate() + i);
    return day;
  });

  // Dynamic Header Range Label
  const getHeaderRangeLabel = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (viewMode === 'week') {
      return `${formatShortDate(weekDays[0])} – ${formatShortDate(weekDays[6])}`;
    }
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return '';
  };

  // Generate Month Grid Days (35 cells: 5 weeks x 7 days)
  const getMonthGridDays = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    // Monday = 0 offset
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - mondayOffset);
    startDate.setHours(0, 0, 0, 0);

    return Array.from({ length: 35 }, (_, i) => {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      return day;
    });
  };

  const monthGridDays = getMonthGridDays(currentDate);

  // Hours for Day/Week Grid: 0:00 to 23:00
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-3.5 h-3.5 text-pink-600" />;
      case 'linkedin': return <Linkedin className="w-3.5 h-3.5 text-blue-600" />;
      case 'facebook': return <Facebook className="w-3.5 h-3.5 text-blue-700" />;
      case 'youtube': return <Youtube className="w-3.5 h-3.5 text-red-600" />;
      case 'x': return <Twitter className="w-3.5 h-3.5 text-slate-900" />;
      case 'google_business': return <Store className="w-3.5 h-3.5 text-emerald-600" />;
      default: return <Share2 className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  // Open Quick Post Modal for a specific date & hour
  const handleOpenSlotModal = (dateObj: Date, hourNum: number = 10) => {
    const formattedDate = dateObj.toISOString().split('T')[0];
    const formattedTime = `${String(hourNum).padStart(2, '0')}:00`;
    setTargetSlotDate(formattedDate);
    setTargetSlotTime(formattedTime);
    setQuickContent('');
    setQuickMediaUrl('');
    setSelectedAccounts(
      tenantAccounts.slice(0, 3).map(a => ({ platform: a.platform, accountId: a.channelAccountId }))
    );
    setShowQuickModal(true);
  };

  // Submit Quick Scheduled Post
  const handleCreateQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickContent.trim()) return;

    setIsSubmitting(true);
    const scheduledDateTime = `${targetSlotDate}T${targetSlotTime}`;

    const newPost: Post = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      content: quickContent.trim(),
      mediaUrls: quickMediaUrl ? [quickMediaUrl] : [],
      mediaType: quickMediaUrl ? 'image' : 'none',
      isCloudflareHosted: false,
      selectedAccountIds: selectedAccounts,
      status: 'scheduled',
      scheduledFor: scheduledDateTime,
      createdAt: new Date().toISOString()
    };

    try {
      const { post: updatedPost, log } = await executePublishing(newPost, tenant);
      onPostPublished(updatedPost, log);
      setShowQuickModal(false);
      setNotification(`📅 Post successfully scheduled for ${targetSlotDate} at ${targetSlotTime}!`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification(`⚠️ Failed to schedule post: ${err.message}`);
      setTimeout(() => setNotification(null), 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter posts for a specific day and hour
  const getPostsForSlot = (dateObj: Date, hourNum: number) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    return tenantPosts.filter(p => {
      if (!p.scheduledFor) return false;
      const [pDate, pTime] = p.scheduledFor.split('T');
      if (pDate !== dateStr) return false;
      if (!pTime) return false;
      const pHour = parseInt(pTime.split(':')[0], 10);
      
      if (selectedChannelFilter !== 'all') {
        const matchesChannel = p.selectedAccountIds.some(a => a.platform === selectedChannelFilter);
        if (!matchesChannel) return false;
      }
      return pHour === hourNum;
    });
  };

  // Filter posts for an entire date (used in Month View)
  const getPostsForDay = (dateObj: Date) => {
    const dateStr = dateObj.toISOString().split('T')[0];
    return tenantPosts.filter(p => {
      if (!p.scheduledFor) return false;
      const [pDate] = p.scheduledFor.split('T');
      if (pDate !== dateStr) return false;

      if (selectedChannelFilter !== 'all') {
        return p.selectedAccountIds.some(a => a.platform === selectedChannelFilter);
      }
      return true;
    });
  };

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0">
      
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold animate-in fade-in flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Light Theme Calendar Layout Container */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl flex flex-col md:flex-row min-h-[750px]">
        
        {/* Left Sidebar: Channels & Accounts Panel */}
        <div className="w-full md:w-64 bg-slate-50/80 border-r border-slate-200 p-5 space-y-6 shrink-0">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#5D3FD3]" />
              <span>Channels</span>
            </h3>

            <button
              onClick={() => onNavigate('connections')}
              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs transition-colors border border-slate-200 shadow-2xs"
              title="Connect Channels"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Connected Channels List */}
          <div className="space-y-2">
            <button
              onClick={() => setSelectedChannelFilter('all')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all ${
                selectedChannelFilter === 'all'
                  ? 'bg-[#5D3FD3] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>All Connected Channels</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                selectedChannelFilter === 'all' ? 'bg-purple-900/40 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tenantAccounts.length}
              </span>
            </button>

            {tenantAccounts.length === 0 ? (
              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5D3FD3] flex items-center justify-center mx-auto">
                  <Share2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs">No channels connected yet 🚀</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Connect your social account to start scheduling media posts.
                </p>
                <button
                  onClick={() => onNavigate('connections')}
                  className="px-3 py-1.5 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition-colors w-full shadow-xs"
                >
                  + Add Channel
                </button>
              </div>
            ) : (
              tenantAccounts.map((acc) => {
                const isSelected = selectedChannelFilter === acc.platform;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedChannelFilter(isSelected ? 'all' : acc.platform)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-purple-50 text-purple-900 border-[#5D3FD3] shadow-2xs font-bold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getPlatformIcon(acc.platform)}
                      <span className="truncate">{acc.accountHandle || acc.accountName}</span>
                    </div>

                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Schedule Button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={() => handleOpenSlotModal(new Date(), 10)}
              className="w-full py-3 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Post</span>
            </button>
          </div>
        </div>

        {/* Right Main Calendar Body */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          
          {/* Calendar Toolbar Header */}
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Left Range Controls: Prev / Next / Today */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                <button
                  onClick={handlePrev}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 text-xs font-mono font-bold text-slate-900 min-w-[140px] text-center">
                  {getHeaderRangeLabel()}
                </span>

                <button
                  onClick={handleNext}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleToday}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded-xl transition-colors shadow-2xs"
              >
                Today
              </button>
            </div>

            {/* Right View Mode & Display Toggle */}
            <div className="flex items-center gap-3">
              {/* Day / Week / Month Pill Switcher */}
              <div className="bg-slate-200/80 p-1 rounded-xl flex items-center border border-slate-300/60">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'day' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Month
                </button>
              </div>

              {/* Grid vs List View Icon Switcher */}
              <div className="bg-slate-200/80 p-1 rounded-xl flex items-center border border-slate-300/60">
                <button
                  onClick={() => setDisplayMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${
                    displayMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDisplayMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${
                    displayMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Agenda List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* MAIN CALENDAR DISPLAY AREA */}
          {displayMode === 'grid' ? (
            <div className="flex-1 overflow-y-auto max-h-[680px]">
              
              {/* 1. WEEK VIEW */}
              {viewMode === 'week' && (
                <div>
                  {/* Week Day Headers Row */}
                  <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 sticky top-0 z-20 font-mono text-xs">
                    <div className="p-3 text-center text-slate-500 font-bold border-r border-slate-200">
                      TIME
                    </div>
                    {weekDays.map((dayObj, idx) => {
                      const dayName = dayObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const dateStr = formatShortDate(dayObj);
                      const isToday = dayObj.toISOString().split('T')[0] === todayIso;

                      return (
                        <div
                          key={idx}
                          className={`p-3 text-center border-r border-slate-200 flex flex-col items-center justify-center ${
                            isToday ? 'bg-purple-50 text-purple-900 font-black' : ''
                          }`}
                        >
                          <span className="text-[11px] text-slate-500 uppercase font-semibold">{dayName}</span>
                          <span className="flex items-center gap-1 font-bold mt-0.5 text-xs">
                            {isToday && <span className="w-2 h-2 rounded-full bg-[#5D3FD3]" />}
                            <span className={isToday ? 'text-[#5D3FD3]' : 'text-slate-800'}>{dateStr}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hourly Rows Grid */}
                  {hours.map((hour) => (
                    <div key={hour} className="grid grid-cols-8 border-b border-slate-100 min-h-[70px]">
                      <div className="p-2 text-center text-slate-400 font-mono text-xs font-bold border-r border-slate-200 bg-slate-50/50 flex items-center justify-center">
                        {hour}:00
                      </div>

                      {weekDays.map((dayObj, dayIdx) => {
                        const cellIso = dayObj.toISOString().split('T')[0];
                        const isPassed = cellIso < todayIso;
                        const cellPosts = getPostsForSlot(dayObj, hour);

                        return (
                          <div
                            key={dayIdx}
                            className={`p-1.5 border-r border-slate-200/80 relative group transition-colors flex flex-col gap-1.5 justify-start ${
                              isPassed
                                ? 'bg-slate-50/70 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px]'
                                : 'hover:bg-purple-50/20'
                            }`}
                          >
                            {cellPosts.map((post) => (
                              <div
                                key={post.id}
                                onClick={() => setInspectPost(post)}
                                className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 cursor-pointer shadow-xs hover:shadow-md transition-all space-y-1 hover:scale-[1.02]"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    {post.selectedAccountIds.slice(0, 2).map((a, i) => (
                                      <span key={i}>{getPlatformIcon(a.platform)}</span>
                                    ))}
                                  </div>
                                  <span className="text-[9px] font-mono font-bold bg-[#5D3FD3] text-white px-1.5 py-0.5 rounded">
                                    {post.status}
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-800 font-medium line-clamp-2 leading-tight">
                                  {post.content}
                                </p>

                                {post.mediaUrls.length > 0 && (
                                  <div className="h-10 rounded-lg overflow-hidden border border-purple-200">
                                    <img
                                      src={post.mediaUrls[0]}
                                      alt="Post media"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}

                            {isPassed && cellPosts.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-slate-400 font-bold pointer-events-none uppercase opacity-60">
                                Date passed
                              </div>
                            )}

                            {!isPassed && (
                              <button
                                onClick={() => handleOpenSlotModal(dayObj, hour)}
                                className="w-7 h-7 rounded-lg bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md mx-auto my-auto"
                                title={`Schedule for ${formatShortDate(dayObj)} at ${hour}:00`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* 2. DAY VIEW */}
              {viewMode === 'day' && (
                <div>
                  <div className="p-4 bg-purple-50/60 border-b border-purple-100 text-center font-mono font-bold text-sm text-purple-900">
                    Day Schedule View &bull; {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>

                  {hours.map((hour) => {
                    const cellIso = currentDate.toISOString().split('T')[0];
                    const isPassed = cellIso < todayIso;
                    const cellPosts = getPostsForSlot(currentDate, hour);

                    return (
                      <div key={hour} className="flex border-b border-slate-100 min-h-[80px]">
                        <div className="w-24 p-3 text-center text-slate-500 font-mono text-xs font-bold border-r border-slate-200 bg-slate-50 flex items-center justify-center">
                          {hour}:00
                        </div>

                        <div className={`flex-1 p-3 relative group flex flex-wrap gap-3 items-center ${
                          isPassed ? 'bg-slate-50/70 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px]' : 'hover:bg-purple-50/20'
                        }`}>
                          {cellPosts.length === 0 && !isPassed && (
                            <button
                              onClick={() => handleOpenSlotModal(currentDate, hour)}
                              className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-[#5D3FD3] text-[#5D3FD3] hover:text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Schedule Post at {hour}:00</span>
                            </button>
                          )}

                          {cellPosts.map(post => (
                            <div
                              key={post.id}
                              onClick={() => setInspectPost(post)}
                              className="p-3 rounded-2xl bg-white border-2 border-[#5D3FD3] text-slate-900 cursor-pointer shadow-md space-y-2 min-w-[280px]"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  {post.selectedAccountIds.map((a, i) => (
                                    <span key={i}>{getPlatformIcon(a.platform)}</span>
                                  ))}
                                </div>
                                <span className="text-[10px] font-mono font-bold uppercase bg-[#5D3FD3] text-white px-2 py-0.5 rounded-full">
                                  {post.status}
                                </span>
                              </div>
                              <p className="text-xs font-semibold">{post.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. MONTH VIEW */}
              {viewMode === 'month' && (
                <div>
                  {/* Month Grid 7-Day Headers */}
                  <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 font-mono text-xs font-bold text-slate-600 text-center">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, i) => (
                      <div key={i} className="p-3 border-r border-slate-200">{dayName}</div>
                    ))}
                  </div>

                  {/* Month Grid 35 Cells (5 weeks x 7 days) */}
                  <div className="grid grid-cols-7 border-b border-slate-200">
                    {monthGridDays.map((dayObj, idx) => {
                      const dayIso = dayObj.toISOString().split('T')[0];
                      const isCurrentMonth = dayObj.getMonth() === currentDate.getMonth();
                      const isToday = dayIso === todayIso;
                      const isPassed = dayIso < todayIso;
                      const dayPosts = getPostsForDay(dayObj);

                      return (
                        <div
                          key={idx}
                          className={`min-h-[120px] p-2 border-r border-b border-slate-200 relative group flex flex-col justify-between transition-colors ${
                            !isCurrentMonth
                              ? 'bg-slate-100/50 text-slate-400'
                              : isPassed
                              ? 'bg-slate-50/70 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px]'
                              : isToday
                              ? 'bg-purple-50/60 border-2 border-purple-300'
                              : 'bg-white hover:bg-purple-50/20'
                          }`}
                        >
                          {/* Date Header */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-mono font-bold ${
                              isToday
                                ? 'w-6 h-6 rounded-full bg-[#5D3FD3] text-white flex items-center justify-center shadow-xs'
                                : isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                            }`}>
                              {dayObj.getDate()}
                            </span>

                            {!isPassed && (
                              <button
                                onClick={() => handleOpenSlotModal(dayObj, 10)}
                                className="w-5 h-5 rounded bg-[#5D3FD3] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title={`Schedule for ${formatShortDate(dayObj)}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Day Posts List */}
                          <div className="space-y-1 my-1 overflow-y-auto max-h-[75px]">
                            {dayPosts.map((post) => (
                              <div
                                key={post.id}
                                onClick={() => setInspectPost(post)}
                                className="p-1.5 bg-purple-100/90 border border-purple-200 rounded-lg text-[10px] font-bold text-purple-900 truncate cursor-pointer hover:bg-[#5D3FD3] hover:text-white transition-colors flex items-center gap-1"
                              >
                                {post.selectedAccountIds[0] && getPlatformIcon(post.selectedAccountIds[0].platform)}
                                <span className="truncate">{post.content}</span>
                              </div>
                            ))}
                          </div>

                          {isPassed && dayPosts.length === 0 && (
                            <div className="text-[9px] font-mono text-slate-400 text-center uppercase tracking-tighter opacity-70">
                              Passed
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Agenda List View */
            <div className="p-6 space-y-4 overflow-y-auto max-h-[680px]">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-500">Scheduled Posts Agenda List</h4>
              {tenantPosts.length === 0 ? (
                <div className="p-12 text-center text-slate-500 italic">No posts scheduled yet.</div>
              ) : (
                tenantPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setInspectPost(post)}
                    className="p-4 bg-white border border-slate-200 hover:border-[#5D3FD3] rounded-2xl flex items-center justify-between text-xs cursor-pointer transition-all shadow-2xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      {post.mediaUrls.length > 0 ? (
                        <img src={post.mediaUrls[0]} alt="Media" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#5D3FD3] flex items-center justify-center font-bold">
                          POST
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-sm line-clamp-1">{post.content}</div>
                        <div className="text-slate-500 font-mono mt-0.5">
                          Scheduled: {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-purple-100 text-purple-900 border border-purple-200">
                        {post.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDeletePost) {
                            onDeletePost(post.id);
                          }
                          setNotification('🗑️ Scheduled post deleted successfully!');
                          setTimeout(() => setNotification(null), 3000);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete Scheduled Post"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* QUICK SCHEDULE MODAL */}
      {showQuickModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#5D3FD3] text-white flex items-center justify-center font-bold">
                  <CalendarIcon className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Schedule Media Post</h3>
                  <p className="text-xs text-slate-500 font-mono">Slot Target: {targetSlotDate} at {targetSlotTime}</p>
                </div>
              </div>

              <button onClick={() => setShowQuickModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuickPost} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase font-mono text-[11px]">
                  Target Social Channels
                </label>
                <div className="flex flex-wrap gap-2">
                  {tenantAccounts.map(acc => {
                    const isSelected = selectedAccounts.some(a => a.accountId === acc.channelAccountId);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAccounts(selectedAccounts.filter(a => a.accountId !== acc.channelAccountId));
                          } else {
                            setSelectedAccounts([...selectedAccounts, { platform: acc.platform, accountId: acc.channelAccountId }]);
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold border transition-all ${
                          isSelected
                            ? 'bg-[#5D3FD3] text-white border-purple-500 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {getPlatformIcon(acc.platform)}
                        <span>{acc.accountHandle || acc.accountName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase font-mono text-[11px]">
                  Post Caption & Content
                </label>
                <textarea
                  rows={4}
                  required
                  value={quickContent}
                  onChange={(e) => setQuickContent(e.target.value)}
                  placeholder="Write your scheduled post caption..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#5D3FD3]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase font-mono text-[11px]">
                  Media File URL (Cloudinary / HTTPS Image)
                </label>
                <input
                  type="url"
                  value={quickMediaUrl}
                  onChange={(e) => setQuickMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuickModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span>Book Schedule Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT POST MODAL */}
      {inspectPost && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Scheduled Post Details</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  {inspectPost.status}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onDeletePost) {
                      onDeletePost(inspectPost.id);
                      setNotification('🗑️ Scheduled post deleted successfully!');
                      setTimeout(() => setNotification(null), 3000);
                    }
                    setInspectPost(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Scheduled Post"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
                <button onClick={() => setInspectPost(null)} className="text-slate-400 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-500 font-mono text-[10px] uppercase font-bold">Content:</div>
                <div className="text-slate-900 font-medium mt-1 leading-relaxed">{inspectPost.content}</div>
              </div>

              {inspectPost.mediaUrls.length > 0 && (
                <div className="h-44 rounded-xl overflow-hidden border border-slate-200">
                  <img src={inspectPost.mediaUrls[0]} alt="Media" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 font-mono space-y-1">
                <div>Scheduled: <strong className="text-purple-900">{inspectPost.scheduledFor}</strong></div>
                <div>Status: <strong className="text-emerald-700 uppercase">{inspectPost.status}</strong></div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    if (onDeletePost) {
                      onDeletePost(inspectPost.id);
                    }
                    setInspectPost(null);
                    setNotification('🗑️ Scheduled post deleted successfully!');
                    setTimeout(() => setNotification(null), 3000);
                  }}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Delete Scheduled Post</span>
                </button>

                <button
                  onClick={() => setInspectPost(null)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
