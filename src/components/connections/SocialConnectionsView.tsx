import React, { useEffect, useState } from 'react';
import { SocialAccount, Tenant, SocialPlatform, ApiAllocationSlot } from '../../types';
import { type Profile } from '../../lib/api';
import { generateComposioConnectLink, fetchComposioAccounts } from '../../lib/composio';
import { generateZernioConnectUrl, fetchZernioAccounts } from '../../lib/zernio';
import { 
  Share2, 
  Plus, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Instagram, 
  Youtube, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Store,
  ShieldAlert,
  Radio,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Edit2,
  Trash2
} from 'lucide-react';

interface SocialConnectionsViewProps {
  tenant: Tenant;
  accounts: SocialAccount[];
  userProfile?: Profile | null;
  onAddAccount?: (acc: Omit<SocialAccount, 'id' | 'tenantId' | 'lastSyncedAt'>) => void;
  onUpdateAccount?: (accountId: string, updates: Partial<SocialAccount>) => void;
  onDeleteAccount?: (accountId: string) => void;
}

interface PlatformOption {
  id: SocialPlatform;
  name: string;
  category: string;
  iconBg: string;
  textColor: string;
  description: string;
}

export const SocialConnectionsView: React.FC<SocialConnectionsViewProps> = ({
  tenant,
  accounts,
  userProfile,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}) => {
  const [collapsedSlots, setCollapsedSlots] = useState<Record<number, boolean>>({});
  // Key format: `${slotNum}:${position}` -> e.g. "1:1" for slot 1 channel 1, "1:2" for slot 1 channel 2
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, SocialPlatform>>({});
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [successMsg, setSuccessMsg] = useState<string>();
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editHandleInput, setEditHandleInput] = useState<string>('');

  const tenantAccounts = accounts.filter(a => a.tenantId === tenant.id);
  const slotsList: ApiAllocationSlot[] = tenant.apiSlotDetails && tenant.apiSlotDetails.length > 0
    ? tenant.apiSlotDetails
    : Array.from({ length: tenant.allocatedApiSlots ?? 2 }).map((_, idx) => ({
        id: `slot-${idx + 1}`,
        slotNumber: idx + 1,
        slotName: `API ${idx + 1}`,
        provider: (tenant.dispatchEngine === 'coresync' ? 'composio' : 'zernio') as any,
        apiKey: '',
        maxChannels: tenant.dispatchEngine === 'coresync' ? 10 : 2,
        connectedAccountIds: []
      }));

  const allocatedSlotCount = slotsList.length;

  const toggleSlotCollapse = (slotNum: number) => {
    setCollapsedSlots(prev => ({ ...prev, [slotNum]: !prev[slotNum] }));
  };

  // Supported Social Platforms
  const platformOptions: PlatformOption[] = [
    { id: 'instagram', name: 'Instagram', category: 'Meta', iconBg: 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600', textColor: 'text-white', description: 'Feed, Reels & Stories' },
    { id: 'facebook', name: 'Facebook', category: 'Meta', iconBg: 'bg-[#1877F2]', textColor: 'text-white', description: 'Pages & Group Posts' },
    { id: 'tiktok', name: 'TikTok', category: 'ByteDance', iconBg: 'bg-slate-950', textColor: 'text-white', description: 'Direct Video & Shorts' },
    { id: 'linkedin', name: 'LinkedIn', category: 'Professional', iconBg: 'bg-[#0A66C2]', textColor: 'text-white', description: 'Profile & Company Pages' },
    { id: 'x', name: 'X (Twitter)', category: 'Social', iconBg: 'bg-slate-900', textColor: 'text-white', description: 'Posts, Threads & Video' },
    { id: 'youtube', name: 'YouTube', category: 'Google', iconBg: 'bg-[#FF0000]', textColor: 'text-white', description: 'Shorts & Long-form Videos' },
    { id: 'google_business', name: 'Google Business', category: 'Google', iconBg: 'bg-[#4285F4]', textColor: 'text-white', description: 'Local Profile & Maps' },
    { id: 'pinterest', name: 'Pinterest', category: 'Social', iconBg: 'bg-[#E60023]', textColor: 'text-white', description: 'Visual Pins & Boards' },
    { id: 'threads', name: 'Threads', category: 'Meta', iconBg: 'bg-slate-950', textColor: 'text-white', description: 'Text & Visual Threads' },
    { id: 'snapchat', name: 'Snapchat', category: 'Social', iconBg: 'bg-[#FFFC00]', textColor: 'text-slate-950', description: 'Stories & Spotlight' },
    { id: 'reddit', name: 'Reddit', category: 'Community', iconBg: 'bg-[#FF4500]', textColor: 'text-white', description: 'Subreddit Submissions' },
    { id: 'discord', name: 'Discord', category: 'Chat', iconBg: 'bg-[#5865F2]', textColor: 'text-white', description: 'Channels & Announcements' },
    { id: 'telegram', name: 'Telegram', category: 'Chat', iconBg: 'bg-[#24A1DE]', textColor: 'text-white', description: 'Broadcast Channels' },
    { id: 'whatsapp', name: 'WhatsApp Business', category: 'Meta', iconBg: 'bg-[#25D366]', textColor: 'text-white', description: 'Broadcasts & Catalog Updates' }
  ];

  const getPlatformDetails = (platformId: SocialPlatform): PlatformOption => {
    return platformOptions.find(p => p.id === platformId) || {
      id: platformId,
      name: String(platformId).toUpperCase(),
      category: 'Social',
      iconBg: 'bg-[#5D3FD3]',
      textColor: 'text-white',
      description: 'Connected Social Channel'
    };
  };

  const getPlatformIcon = (platformId: SocialPlatform) => {
    switch (platformId) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'x': return <Twitter className="w-5 h-5" />;
      case 'google_business': return <Store className="w-5 h-5" />;
      default: return <Share2 className="w-5 h-5" />;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') !== 'true') return;
    const slot = Number(params.get('slot') || 1);
    const platform = (params.get('platform') || 'instagram') as SocialPlatform;

    // Resolve real user profile handle directly from authoritative profile state
    const realName = userProfile?.fullName?.trim() || userProfile?.email?.split('@')[0] || 'Aniruddha';
    const cleanHandle = `@${realName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;

    const newAccountData = {
      platform,
      channelAccountId: `chan_${platform}_${Date.now()}`,
      accountName: realName,
      accountHandle: cleanHandle,
      accountAvatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${realName}_${platform}`,
      slotNumber: slot,
      status: 'active' as const
    };

    // 1. If this window is the popup window, notify opener and close self
    if (window.opener && window.opener !== window) {
      try {
        window.opener.postMessage({
          type: 'SOCIALSPREE_ACCOUNT_CONNECTED',
          account: newAccountData,
          slotNumber: slot
        }, '*');
      } catch { /* ignore */ }
      window.close();
      return;
    }

    // 2. Otherwise handle in current window
    if (onAddAccount) {
      onAddAccount(newAccountData);
    }

    setSuccessMsg(`🎉 Successfully connected ${getPlatformDetails(platform).name} to Account Slot #${slot}!`);
    setTimeout(() => setSuccessMsg(undefined), 5000);

    // Clean up query string smoothly without reload
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [tenant.id, onAddAccount, userProfile]);

  // Auto-sync active connected accounts from Composio API on page load (synchronizes Brave, Chrome, etc.)
  useEffect(() => {
    async function syncFromCloud() {
      try {
        const cloudAccounts = await fetchComposioAccounts(tenant.id, 1);
        if (cloudAccounts && cloudAccounts.length > 0 && onAddAccount) {
          const realName = userProfile?.fullName?.trim() || userProfile?.email?.split('@')[0] || 'Aniruddha';
          const cleanHandle = `@${realName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;

          cloudAccounts.forEach(cAcc => {
            if (cAcc.status === 'active') {
              onAddAccount({
                platform: cAcc.platform,
                channelAccountId: cAcc.id,
                accountName: realName,
                accountHandle: cleanHandle,
                accountAvatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${realName}_${cAcc.platform}`,
                slotNumber: 1,
                status: 'active'
              });
            }
          });
        }
      } catch (err) {
        console.warn('Auto cloud sync note:', err);
      }
    }

    syncFromCloud();
  }, [tenant.id, onAddAccount, userProfile]);

  // Listen to postMessage from popup window upon OAuth completion
  useEffect(() => {
    const handleWindowMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SOCIALSPREE_ACCOUNT_CONNECTED' && e.data.account) {
        if (onAddAccount) {
          onAddAccount(e.data.account);
        }
        setSuccessMsg(`🎉 Successfully connected ${getPlatformDetails(e.data.account.platform).name} to Account Slot #${e.data.slotNumber || 1}!`);
        setTimeout(() => setSuccessMsg(undefined), 5000);
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [onAddAccount]);

  const handleConnectPosition = async (slotNum: number, position: number) => {
    const key = `${slotNum}:${position}`;
    const platformId = selectedPlatforms[key] || (position === 1 ? 'instagram' : 'facebook');

    setBusy(key);
    setError(undefined);

    // Open popup window immediately on user click to avoid browser popup blockers
    const popup = window.open('about:blank', 'social_auth_window', 'width=620,height=780,scrollbars=yes,status=yes');

    try {
      const slotItem = slotsList.find(s => s.slotNumber === slotNum);
      const isComposioSlot = slotItem?.provider === 'composio' || tenant.dispatchEngine === 'coresync';
      const callbackUrl = `${window.location.origin}${window.location.pathname}?connected=true&slot=${slotNum}&pos=${position}&platform=${platformId}`;
      
      let redirectUrl: string | undefined;

      if (isComposioSlot) {
        // 1. Composio v3.1 Connect Flow
        const result = await generateComposioConnectLink(platformId, tenant.id, callbackUrl);
        redirectUrl = result.redirectUrl;
      } else {
        // 2. Zernio Connect Flow
        try {
          const result = await generateZernioConnectUrl(platformId, tenant.id, slotNum, callbackUrl);
          redirectUrl = result.redirectUrl;
        } catch {
          const result = await generateComposioConnectLink(platformId, tenant.id, callbackUrl);
          redirectUrl = result.redirectUrl;
        }
      }

      if (redirectUrl && popup) {
        popup.location.href = redirectUrl;

        // Monitor popup completion and automatically register the channel
        const realName = userProfile?.fullName?.trim() || userProfile?.email?.split('@')[0] || 'Aniruddha';
        const cleanHandle = `@${realName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;

        const timer = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(timer);
              // Register account once popup completes
              if (onAddAccount) {
                onAddAccount({
                  platform: platformId,
                  channelAccountId: `chan_${platformId}_${Date.now()}`,
                  accountName: realName,
                  accountHandle: cleanHandle,
                  accountAvatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${realName}_${platformId}`,
                  slotNumber: slotNum,
                  status: 'active'
                });
              }
              setSuccessMsg(`🎉 Successfully connected ${getPlatformDetails(platformId).name} to Account Slot #${slotNum}!`);
              setTimeout(() => setSuccessMsg(undefined), 5000);
            } else if (popup.location && popup.location.href && popup.location.href.includes('connected=true')) {
              clearInterval(timer);
              popup.close();
              if (onAddAccount) {
                onAddAccount({
                  platform: platformId,
                  channelAccountId: `chan_${platformId}_${Date.now()}`,
                  accountName: realName,
                  accountHandle: cleanHandle,
                  accountAvatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${realName}_${platformId}`,
                  slotNumber: slotNum,
                  status: 'active'
                });
              }
              setSuccessMsg(`🎉 Successfully connected ${getPlatformDetails(platformId).name} to Account Slot #${slotNum}!`);
              setTimeout(() => setSuccessMsg(undefined), 5000);
            }
          } catch {
            // Cross-origin restriction while user is on Composio/Meta auth page
          }
        }, 1000);
      } else if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err: any) {
      if (popup) popup.close();
      setError(err?.message || 'Unable to open connection link');
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0">
      {/* Notifications */}
      {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-3.5 text-xs font-semibold shadow-xs">{error}</div>}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl p-4 text-xs font-bold shadow-xs flex items-center gap-2 animate-in fade-in">
          <span>{successMsg}</span>
        </div>
      )}
      
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
            <span>Social Channel API Slot Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect and manage your social channels across <strong>Composio (Unified Multi-Channel)</strong> and <strong>Zernio (Isolated Slots)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400" />
            <span><strong>{allocatedSlotCount} API Slot{allocatedSlotCount !== 1 ? 's' : ''}</strong> • {tenantAccounts.length} Channels Connected</span>
          </div>
        </div>
      </div>

      {/* Zero Slots Unprovisioned Notice */}
      {allocatedSlotCount === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-6 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto" />
          <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">No Active Channel Slots Provisioned Yet</h3>
          <p className="text-xs text-amber-800 dark:text-amber-300 max-w-md mx-auto">
            Your administrator has not added any active API channel slots to your account. Please contact support to activate your social channel slots.
          </p>
        </div>
      )}

      {/* Render Dynamic Channel Cards for Each Account Slot */}
      <div className="space-y-6">
        {slotsList.map((slotItem, idx) => {
          const slotNum = slotItem.slotNumber || (idx + 1);
          const isComposioSlot = slotItem.provider === 'composio' || (tenant.dispatchEngine === 'coresync');
          const maxChannelsForSlot = isComposioSlot ? (slotItem.maxChannels || 10) : 2;
          
          const slotAccounts = tenantAccounts.filter(a => a.slotNumber === slotNum || (slotNum === 1 && !a.slotNumber));
          const connectedCount = slotAccounts.length;
          const isSlotFull = !isComposioSlot && connectedCount >= maxChannelsForSlot;
          const isCollapsed = Boolean(collapsedSlots[slotNum]);

          return (
            <div key={slotItem.id || slotNum} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
              
              {/* Slot Header Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-[#5D3FD3] dark:text-purple-300 font-black text-sm flex items-center justify-center font-mono shrink-0 shadow-xs border border-purple-200 dark:border-purple-800">
                    #{slotNum}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">ACCOUNT SLOT {slotNum}</h3>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isComposioSlot 
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
                          : 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      }`}>
                        {isComposioSlot ? '🧩 COMPOSIO (MULTI-CHANNEL)' : '⚡ ZERNIO (2 CHANNELS MAX)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>API Channel Engine:</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Radio className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500 animate-pulse" />
                        {isComposioSlot ? 'Composio Unified Bridge Active' : 'Zernio Isolated Slot Active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {isComposioSlot ? `${connectedCount} CHANNELS CONNECTED` : `${connectedCount} / ${maxChannelsForSlot} CONNECTED`}
                    </div>
                    {!isComposioSlot && (
                      <div className="w-28 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full transition-all duration-300 ${isSlotFull ? 'bg-emerald-500' : connectedCount > 0 ? 'bg-[#5D3FD3]' : 'bg-slate-300 dark:bg-slate-600'}`}
                          style={{ width: `${(connectedCount / maxChannelsForSlot) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => toggleSlotCollapse(slotNum)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
                    title={isCollapsed ? 'Expand Slot' : 'Collapse Slot'}
                  >
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Slot Body */}
              {!isCollapsed && (
                <div className="p-5 space-y-4">
                  {/* Connected Accounts List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slotAccounts.map((acc, cIdx) => (
                      <div key={acc.id} className="p-4 rounded-2xl border-2 border-emerald-400/80 dark:border-emerald-600 bg-gradient-to-br from-emerald-50/70 to-white dark:from-emerald-950/20 dark:to-slate-800 flex flex-col justify-between space-y-3 shadow-xs group">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-600 dark:bg-emerald-700 text-white shadow-xs">
                            CHANNEL {cIdx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>CONNECTED</span>
                            </span>
                            {onDeleteAccount && (
                              <button
                                onClick={() => onDeleteAccount(acc.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md transition-opacity cursor-pointer"
                                title="Disconnect Channel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 py-1">
                          <div className={`w-11 h-11 rounded-2xl ${getPlatformDetails(acc.platform).iconBg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                            {getPlatformIcon(acc.platform)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate">
                              {getPlatformDetails(acc.platform).name}
                            </div>
                            {editingAccountId === acc.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="text"
                                  value={editHandleInput}
                                  onChange={(e) => setEditHandleInput(e.target.value)}
                                  placeholder="@your_handle"
                                  className="w-full px-2 py-1 border border-purple-300 dark:border-purple-700 rounded text-xs font-mono focus:ring-1 focus:ring-[#5D3FD3] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    if (onUpdateAccount && editHandleInput.trim()) {
                                      const cleanHandle = editHandleInput.startsWith('@') ? editHandleInput.trim() : `@${editHandleInput.trim()}`;
                                      onUpdateAccount(acc.id, { accountHandle: cleanHandle, accountName: cleanHandle.replace('@', '') });
                                    }
                                    setEditingAccountId(null);
                                  }}
                                  className="p-1 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                  title="Save Handle"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingAccountId(null)}
                                  className="p-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-[10px] cursor-pointer"
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 group/handle mt-0.5">
                                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-mono font-semibold truncate">
                                  {acc.accountHandle || acc.accountName || `@leadspree_${acc.platform}`}
                                </span>
                                {onUpdateAccount && (
                                  <button
                                    onClick={() => {
                                      setEditingAccountId(acc.id);
                                      setEditHandleInput(acc.accountHandle || acc.accountName || `@leadspree_${acc.platform}`);
                                    }}
                                    className="opacity-0 group-hover/handle:opacity-100 text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200 text-[10px] font-bold underline cursor-pointer"
                                    title="Edit Handle"
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-emerald-800 dark:text-emerald-300 font-medium">Ready • Slot #{slotNum}</span>
                          
                          <div className="flex items-center gap-2">
                            {onUpdateAccount && editingAccountId !== acc.id && (
                              <button
                                onClick={() => {
                                  setEditingAccountId(acc.id);
                                  setEditHandleInput(acc.accountHandle || acc.accountName || `@aniruddha`);
                                }}
                                className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold transition-colors cursor-pointer flex items-center gap-1 border border-purple-200 dark:border-purple-800"
                                title="Edit Profile Handle"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                                <span>Edit</span>
                              </button>
                            )}

                            {onDeleteAccount && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to disconnect ${getPlatformDetails(acc.platform).name} (${acc.accountHandle || acc.accountName})?`)) {
                                    onDeleteAccount(acc.id);
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/80 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-bold transition-colors cursor-pointer flex items-center gap-1 border border-red-200 dark:border-red-800"
                                title="Disconnect Social Channel"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                <span>Disconnect</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Connect Additional / Empty Channel Card */}
                    {(!isSlotFull || isComposioSlot) && (
                      <div className="p-4 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800/80 hover:border-purple-300 dark:hover:border-purple-700 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex flex-col justify-between space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {isComposioSlot ? `+ ADD CHANNEL` : `CHANNEL ${connectedCount + 1} OF ${maxChannelsForSlot}`}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                            CONNECT SPOT
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-[#5D3FD3] dark:text-purple-400" />
                            <span>Select Social Platform:</span>
                          </label>
                          <div className="relative">
                            <select
                              value={selectedPlatforms[`${slotNum}:${connectedCount + 1}`] || 'instagram'}
                              onChange={(e) => setSelectedPlatforms(prev => ({ ...prev, [`${slotNum}:${connectedCount + 1}`]: e.target.value as SocialPlatform }))}
                              className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 focus:border-[#5D3FD3] rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#5D3FD3] appearance-none cursor-pointer"
                            >
                              {platformOptions.map((p) => (
                                <option key={p.id} value={p.id} className="dark:bg-slate-800">
                                  {p.name} • {p.description}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <button
                          onClick={() => handleConnectPosition(slotNum, connectedCount + 1)}
                          disabled={busy === `${slotNum}:${connectedCount + 1}`}
                          className="w-full py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {busy === `${slotNum}:${connectedCount + 1}` ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Opening OAuth Authorization…</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Connect {getPlatformDetails(selectedPlatforms[`${slotNum}:${connectedCount + 1}`] || 'instagram').name}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
