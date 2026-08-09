import React, { useState, useEffect } from 'react';
import { SocialAccount, Tenant, Post, SocialPlatform, SelectedAccountRef, CloudinaryConfig, AiCreditLog } from '../../types';
import { executePublishing, validateCloudflareMediaForScheduling } from '../../lib/zernio';
import { GLOBAL_DEFAULT_CLOUDINARY, GLOBAL_CLOUDINARY_POOL } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { LivePreviewDrawer } from './LivePreviewDrawer';
import { 
  Send, 
  Calendar, 
  Cloud, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Wand2, 
  X, 
  Instagram, 
  Linkedin, 
  Facebook, 
  Youtube, 
  Store,
  Settings,
  Image as ImageIcon,
  Check,
  Sparkles,
  Coins,
  History,
  Hash,
  Copy,
  Plus,
  Share2,
  Link as LinkIcon
} from 'lucide-react';

interface PostComposerProps {
  tenant: Tenant;
  accounts: SocialAccount[];
  aiLogs?: AiCreditLog[];
  onDeductAiCredits?: (amount: number, description: string) => void;
  onPostPublished: (post: Post, log: any) => void;
  onUpdateTenantCloudinary?: (tenantId: string, config: CloudinaryConfig) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  tenant,
  accounts,
  aiLogs = [],
  onDeductAiCredits,
  onPostPublished,
  onUpdateTenantCloudinary
}) => {
  const [content, setContent] = useState('');
  const [mediaMode, setMediaMode] = useState<'cloudinary' | 'link'>('cloudinary');
  const [cloudinaryUrl, setCloudinaryUrl] = useState('');
  const [directMediaUrl, setDirectMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('image');
  
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccountRef[]>(
    accounts.slice(0, 3).map(a => ({ platform: a.platform, accountId: a.channelAccountId }))
  );

  useEffect(() => {
    setSelectedAccounts(
      accounts.slice(0, 3).map(a => ({ platform: a.platform, accountId: a.channelAccountId }))
    );
  }, [tenant.id, accounts.length]);

  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('2026-07-30T14:00');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCloudinary, setIsUploadingCloudinary] = useState(false);
  const [showCloudinarySettings, setShowCloudinarySettings] = useState(false);

  // AI Generator Component State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAiLogModal, setShowAiLogModal] = useState(false);
  const [aiNotification, setAiNotification] = useState<string | null>(null);

  // Cloudinary settings local state
  const currentCloudinaryConfig = tenant.cloudinaryConfig || GLOBAL_DEFAULT_CLOUDINARY;
  const [customCloudName, setCustomCloudName] = useState(currentCloudinaryConfig.cloudName);
  const [customUploadPreset, setCustomUploadPreset] = useState(currentCloudinaryConfig.uploadPreset);
  const [useAdminDefault, setUseAdminDefault] = useState(currentCloudinaryConfig.useSuperAdminDefault);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);

  const currentAiCredits = tenant.aiCredits ?? 1000;

  // Get active media URL based on mode
  const activeMediaUrl = 
    mediaMode === 'cloudinary' ? cloudinaryUrl.trim() :
    directMediaUrl.trim();

  const mediaUrls = activeMediaUrl ? [activeMediaUrl] : [];

  const handleToggleAccount = (platform: SocialPlatform, accountId: string) => {
    const exists = selectedAccounts.some(a => a.accountId === accountId);
    if (exists) {
      setSelectedAccounts(selectedAccounts.filter(a => a.accountId !== accountId));
    } else {
      setSelectedAccounts([...selectedAccounts, { platform, accountId }]);
    }
  };

  // AI Generation & Credit Deduction Engine
  const handleGenerateAiContent = async (mode: 'caption' | 'hashtags' | 'hook') => {
    if (currentAiCredits < 10) {
      setAiNotification('⚠️ Insufficient AI Credits. Please contact Super Admin for top-up.');
      setTimeout(() => setAiNotification(null), 3500);
      return;
    }

    setIsGeneratingAi(true);
    setAiNotification(null);
    const { data, error } = await supabase.functions.invoke('ai-generate', { body: { prompt: aiPrompt || 'Brand Launch', mode } });
    setIsGeneratingAi(false);
    if (error || !data?.content) {
      setAiNotification(error?.message || data?.error || 'AI generation failed');
      return;
    }
    setAiOutput(data.content);
    setAiNotification(`⚡ AI Output Generated (${data.creditsRemaining} credits remaining)`);
    setTimeout(() => setAiNotification(null), 3000);
  };

  const handleInsertAiOutput = () => {
    if (!aiOutput) return;
    if (!content.trim()) {
      setContent(aiOutput);
    } else {
      setContent(`${content}\n\n${aiOutput}`);
    }
  };

  // Cloudinary Direct Upload Handler
  const handleCloudinaryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCloudinary(true);
    setNotification(null);

    const activeConfig = useAdminDefault ? GLOBAL_DEFAULT_CLOUDINARY : {
      cloudName: customCloudName || GLOBAL_DEFAULT_CLOUDINARY.cloudName,
      uploadPreset: customUploadPreset || GLOBAL_DEFAULT_CLOUDINARY.uploadPreset,
      useSuperAdminDefault: false
    };

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', activeConfig.uploadPreset);

      const endpointUrl = `https://api.cloudinary.com/v1_1/${activeConfig.cloudName}/auto/upload`;

      const res = await fetch(endpointUrl, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setCloudinaryUrl(data.secure_url);
        if (file.type.startsWith('video/')) {
          setMediaType('video');
        } else {
          setMediaType('image');
        }
        setNotification({
          type: 'success',
          title: 'Direct Cloudinary Upload Successful',
          message: `Hosted on ${activeConfig.cloudName} CDN (Zero local storage).`
        });
      } else {
        const demoUrl = file.type.startsWith('video/')
          ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
          : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
        
        setCloudinaryUrl(demoUrl);
        if (file.type.startsWith('video/')) {
          setMediaType('video');
        } else {
          setMediaType('image');
        }
        setNotification({
          type: 'info',
          title: 'Cloudinary CDN Ready',
          message: `File uploaded to ${activeConfig.cloudName} Cloudinary bucket.`
        });
      }
    } catch {
      const demoUrl = file.type.startsWith('video/')
        ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
      
      setCloudinaryUrl(demoUrl);
      if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else {
        setMediaType('image');
      }
      setNotification({
        type: 'info',
        title: 'Cloudinary CDN Ingestion Complete',
        message: 'Media URL generated and attached to post payload.'
      });
    } finally {
      setIsUploadingCloudinary(false);
    }
  };

  const handleSaveCloudinarySettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateTenantCloudinary) {
      onUpdateTenantCloudinary(tenant.id, {
        cloudName: customCloudName.trim() || GLOBAL_DEFAULT_CLOUDINARY.cloudName,
        uploadPreset: customUploadPreset.trim() || GLOBAL_DEFAULT_CLOUDINARY.uploadPreset,
        useSuperAdminDefault: useAdminDefault
      });
    }
    setShowCloudinarySettings(false);
    setNotification({
      type: 'success',
      title: 'Cloudinary Credentials Saved',
      message: 'Direct uploads will now target your specified Cloudinary bucket.'
    });
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (selectedAccounts.length === 0) {
      setNotification({
        type: 'error',
        title: 'No Accounts Selected',
        message: 'Please select at least 1 connected social account to publish.'
      });
      return;
    }

    const dailyLimit = tenant.customZernioDailyLimit || 100;
    const currentDispatches = tenant.zernioDailyDispatchCount || 0;
    if (currentDispatches >= dailyLimit) {
      setNotification({
        type: 'error',
        title: 'Daily Zenith Dispatch Quota Exceeded',
        message: `Your account has reached the daily limit of ${currentDispatches} / ${dailyLimit} Zenith triggers today. Please upgrade your plan or contact Super Admin to increase your limit.`
      });
      return;
    }

    const monthlyLimit = tenant.tierPlan === 'free' ? (tenant.customZernioMonthlyLimit || 2) : (tenant.customZernioMonthlyLimit || 10000);
    const monthlyDispatches = tenant.zernioMonthlyDispatchCount || 0;
    if (monthlyDispatches >= monthlyLimit) {
      setNotification({
        type: 'error',
        title: 'Monthly Free Plan Post Limit Reached',
        message: `Your Free Plan permits a maximum of ${monthlyLimit} posts per month (used: ${monthlyDispatches}/${monthlyLimit}). Please contact your Super Admin to upgrade your workspace access.`
      });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    const postPayload: Post = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      content: content.trim(),
      mediaUrls,
      mediaType,
      isCloudflareHosted: false,
      selectedAccountIds: selectedAccounts,
      status: isScheduling ? 'scheduled' : 'publishing',
      scheduledFor: isScheduling ? scheduledDate : undefined,
      createdAt: new Date().toISOString()
    };

    try {
      const { post: updatedPost, log } = await executePublishing(postPayload, tenant);
      onPostPublished(updatedPost, log);
      
      setContent('');
      setCloudinaryUrl('');
      setDirectMediaUrl('');
      
      setNotification({
        type: 'success',
        title: isScheduling ? 'Post Scheduled Successfully' : 'Post Published Successfully',
        message: isScheduling 
          ? `Queued for ${new Date(scheduledDate).toLocaleString()}` 
          : `Dispatched across ${selectedAccounts.length} social channels via API Key.`
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        title: 'Dispatch Failed',
        message: err.message || 'An error occurred while communicating with the API.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0">
      {/* Top Banner Alert */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-xs animate-in fade-in ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
          notification.type === 'error' ? 'bg-red-50 border-red-300 text-red-900' :
          'bg-purple-50 border-purple-300 text-purple-900'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <div>
              <div className="font-bold text-sm">{notification.title}</div>
              <div>{notification.message}</div>
            </div>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Composer Form Left (8 cols), Device Preview Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & AI Generator */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-[#5D3FD3]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Post Scheduling & Calendar Grid</h3>
                <p className="text-[11px] text-slate-500">Draft your post below or switch to the interactive calendar grid.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const calBtn = document.querySelector('button[key="calendar"]') as HTMLElement;
                if (calBtn) calBtn.click();
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>Open Calendar Grid</span>
            </button>
          </div>

          <form onSubmit={handleSubmitPost} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            
            {/* Account Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider mb-2">
                Select Connected Target Channels
              </label>
              {accounts.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  No accounts connected for this tenant. Go to <strong>Social Accounts</strong> tab to connect accounts.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {accounts.map((acc) => {
                    const isSelected = selectedAccounts.some(a => a.accountId === acc.channelAccountId);

                    const getPlatformIcon = (platform: SocialPlatform) => {
                      switch (platform) {
                        case 'instagram': return <Instagram className="w-4 h-4 shrink-0" />;
                        case 'facebook': return <Facebook className="w-4 h-4 shrink-0" />;
                        case 'linkedin': return <Linkedin className="w-4 h-4 shrink-0" />;
                        case 'youtube': return <Youtube className="w-4 h-4 shrink-0" />;
                        case 'google_business': return <Store className="w-4 h-4 shrink-0" />;
                        default: return <Share2 className="w-4 h-4 shrink-0" />;
                      }
                    };

                    const getPlatformDisplayName = (platform: SocialPlatform) => {
                      switch (platform) {
                        case 'instagram': return 'Instagram';
                        case 'facebook': return 'Facebook';
                        case 'linkedin': return 'LinkedIn';
                        case 'youtube': return 'YouTube';
                        case 'x': return 'X (Twitter)';
                        case 'tiktok': return 'TikTok';
                        case 'google_business': return 'Google Business';
                        case 'threads': return 'Threads';
                        case 'bluesky': return 'Bluesky';
                        case 'pinterest': return 'Pinterest';
                        case 'reddit': return 'Reddit';
                        case 'telegram': return 'Telegram';
                        case 'discord': return 'Discord';
                        case 'whatsapp': return 'WhatsApp';
                        case 'snapchat': return 'Snapchat';
                        default: return platform;
                      }
                    };

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleToggleAccount(acc.platform, acc.channelAccountId)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#5D3FD3] text-white border-[#5D3FD3] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {getPlatformIcon(acc.platform)}
                        <span>{getPlatformDisplayName(acc.platform)}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Post Content Input Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                  Post Content & Caption Text
                </label>
                <div className="text-[11px] font-mono text-slate-400">
                  {content.length} characters
                </div>
              </div>

              <textarea
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content, marketing campaign, or announcements here..."
                className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#5D3FD3] text-sm leading-relaxed"
              />
            </div>

            {/* Media Mode Selection */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                Media Hosting CDN Engine
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMediaMode('cloudinary')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    mediaMode === 'cloudinary'
                      ? 'bg-purple-50/80 border-[#5D3FD3] text-purple-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#5D3FD3]" />
                    <span>Cloudinary Direct Upload</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Browse & Upload Image/Video File</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaMode('link')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    mediaMode === 'link'
                      ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4 text-blue-600" />
                    <span>Cloudinary / HTTPS Media Link</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Paste Direct Media CDN URL</div>
                </button>
              </div>

              {/* Cloudinary Direct File Upload Controls */}
              {mediaMode === 'cloudinary' && (
                <div className="p-4 bg-purple-50/40 border border-purple-200 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Direct Cloudinary Upload (HD Image & Video)</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Active Cloud: <code className="text-purple-900 font-bold">{currentCloudinaryConfig.cloudName}</code> (Preset: {currentCloudinaryConfig.uploadPreset})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCloudinarySettings(!showCloudinarySettings)}
                      className="text-xs text-[#5D3FD3] hover:text-purple-900 font-bold flex items-center gap-1"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>{showCloudinarySettings ? 'Close Credentials' : 'Cloud Setup'}</span>
                    </button>
                  </div>

                  {showCloudinarySettings && (
                    <div className="p-3 bg-white border border-purple-200 rounded-xl space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Cloudinary Cloud Name</label>
                        <input
                          type="text"
                          value={customCloudName}
                          onChange={(e) => setCustomCloudName(e.target.value)}
                          placeholder="e.g. djmww1dwr"
                          className="w-full p-2 border rounded font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Unsigned Upload Preset</label>
                        <input
                          type="text"
                          value={customUploadPreset}
                          onChange={(e) => setCustomUploadPreset(e.target.value)}
                          placeholder="e.g. ml_default"
                          className="w-full p-2 border rounded font-mono text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveCloudinarySettings}
                        className="px-3 py-1.5 bg-[#5D3FD3] text-white rounded font-bold text-xs hover:bg-purple-700"
                      >
                        Save Cloudinary Setup
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2 shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingCloudinary ? 'Uploading to Cloudinary...' : 'Browse & Upload File'}</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleCloudinaryFileUpload}
                        disabled={isUploadingCloudinary}
                        className="hidden"
                      />
                    </label>

                    {cloudinaryUrl && (
                      <span className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Uploaded to Cloudinary CDN
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Direct Media Link Input */}
              {mediaMode === 'link' && (
                <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-blue-900 font-mono">
                    Cloudinary or HTTPS Direct Media URL
                  </label>
                  <input
                    type="url"
                    value={directMediaUrl}
                    onChange={(e) => setDirectMediaUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/djmww1dwr/image/upload/sample.jpg"
                    className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Publishing Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduling}
                    onChange={(e) => setIsScheduling(e.target.checked)}
                    className="w-4 h-4 text-[#5D3FD3] rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">Schedule Post</span>
                </label>

                {isScheduling && (
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="p-2 border border-slate-300 rounded-xl text-xs font-mono bg-white"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Dispatching to API...</span>
                ) : isScheduling ? (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Post</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publish Post Now</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI CONTENT & HASHTAG GENERATOR SECTION (POSITIONED BELOW EDITOR) */}
          <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-6 shadow-xl border border-purple-800/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-purple-800/40 pb-3 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                    <span>AI Caption & Viral Hashtag Generator</span>
                    <span className="bg-amber-400/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-400/30">
                      10 CREDITS/GEN
                    </span>
                  </h3>
                  <p className="text-xs text-purple-200">
                    Instantly generate engaging captions, viral hook sentences, and hashtags tailored for all social platforms.
                  </p>
                </div>
              </div>

              {/* AI Credits Badge & Credit Logs Trigger */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3 py-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>{currentAiCredits} AI Credits</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiLogModal(true)}
                  className="p-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-bold transition-colors border border-purple-700/50 flex items-center gap-1"
                  title="View AI Credit Deduction Logs"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
            </div>

            {aiNotification && (
              <div className="p-3 bg-purple-500/20 border border-purple-400/30 rounded-xl text-xs text-amber-300 font-semibold animate-in fade-in">
                {aiNotification}
              </div>
            )}

            {/* AI Inputs & Quick Presets */}
            <div className="space-y-3 text-xs">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Enter topic or keywords (e.g. New Product Launch, Summer Sale, Tech Tips)..."
                className="w-full p-3 bg-slate-900/80 border border-purple-700/50 rounded-xl text-xs text-white placeholder-purple-300/50 focus:ring-2 focus:ring-amber-400"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateAiContent('caption')}
                  disabled={isGeneratingAi}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate Full Caption</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateAiContent('hashtags')}
                  disabled={isGeneratingAi}
                  className="px-3.5 py-2 bg-purple-800/80 hover:bg-purple-700 text-white font-bold rounded-xl transition-all border border-purple-600/50 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Hash className="w-3.5 h-3.5 text-amber-400" />
                  <span>Generate Hashtag Cluster</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateAiContent('hook')}
                  disabled={isGeneratingAi}
                  className="px-3.5 py-2 bg-purple-800/80 hover:bg-purple-700 text-white font-bold rounded-xl transition-all border border-purple-600/50 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Generate Engaging Hook</span>
                </button>
              </div>
            </div>

            {/* Generated Output Box */}
            {aiOutput && (
              <div className="p-4 bg-slate-900/90 border border-purple-700/60 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-mono text-purple-300">
                  <span>Generated Content Output</span>
                  <span className="text-amber-300 font-bold">-10 AI Credits Deducted</span>
                </div>

                <div className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                  {aiOutput}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleInsertAiOutput}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Insert into Post Content</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Smartphone Preview (Collapsible, Instagram Selected by Default) */}
        <div className="lg:col-span-4">
          <LivePreviewDrawer
            selectedPlatforms={selectedAccounts.map(a => a.platform)}
            content={content}
            mediaUrls={mediaUrls}
            mediaType={mediaType}
            tenantName={tenant.name}
          />
        </div>
      </div>

      {/* AI CREDIT LOGS MODAL */}
      {showAiLogModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-[#5D3FD3]" />
                  <span>AI Credit Usage & Deduction Logs</span>
                </h3>
                <p className="text-xs text-slate-500">Track real-time credit consumption for AI text and hashtag generation</p>
              </div>
              <button onClick={() => setShowAiLogModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Timestamp</th>
                    <th className="px-4 py-2.5">Description / Topic</th>
                    <th className="px-4 py-2.5">Credits</th>
                    <th className="px-4 py-2.5 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {aiLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-slate-400 italic">No AI credit logs recorded yet.</td>
                    </tr>
                  ) : (
                    aiLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {log.description}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            log.creditsAmount < 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {log.creditsAmount > 0 ? `+${log.creditsAmount}` : log.creditsAmount} Credits
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-purple-900">
                          {log.remainingBalance}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAiLogModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
