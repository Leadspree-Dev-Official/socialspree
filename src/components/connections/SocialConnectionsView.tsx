import React, { useEffect, useState } from 'react';
import { SocialAccount, Tenant, SocialPlatform } from '../../types';
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
  RefreshCw
} from 'lucide-react';

interface SocialConnectionsViewProps {
  tenant: Tenant;
  accounts: SocialAccount[];
  onAddAccount?: (acc: Omit<SocialAccount, 'id' | 'tenantId' | 'lastSyncedAt'>) => void;
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
  accounts
}) => {
  const [collapsedSlots, setCollapsedSlots] = useState<Record<number, boolean>>({});
  // Key format: `${slotNum}:${position}` -> e.g. "1:1" for slot 1 channel 1, "1:2" for slot 1 channel 2
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, SocialPlatform>>({});
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  const tenantAccounts = accounts.filter(a => a.tenantId === tenant.id);
  const slotsList = tenant.apiSlotDetails && tenant.apiSlotDetails.length > 0
    ? tenant.apiSlotDetails
    : Array.from({ length: tenant.allocatedApiSlots ?? 2 }).map((_, idx) => ({
        id: `slot-${idx + 1}`,
        slotNumber: idx + 1,
        slotName: `API ${idx + 1}`,
        apiKey: '',
        maxChannels: 2,
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
    { id: 'threads', name: 'Threads', category: 'Meta', iconBg: 'bg-slate-900', textColor: 'text-white', description: 'Text Posts & Replies' },
    { id: 'bluesky', name: 'Bluesky', category: 'Decentralized', iconBg: 'bg-[#1185FE]', textColor: 'text-white', description: 'AT Protocol Feed' },
    { id: 'pinterest', name: 'Pinterest', category: 'Visual', iconBg: 'bg-[#E60023]', textColor: 'text-white', description: 'Pins & Idea Boards' },
    { id: 'reddit', name: 'Reddit', category: 'Community', iconBg: 'bg-[#FF4500]', textColor: 'text-white', description: 'Subreddit Submissions' },
    { id: 'telegram', name: 'Telegram', category: 'Messaging', iconBg: 'bg-[#229ED9]', textColor: 'text-white', description: 'Broadcast Channels' },
    { id: 'discord', name: 'Discord', category: 'Community', iconBg: 'bg-[#5865F2]', textColor: 'text-white', description: 'Server Webhook Posts' },
    { id: 'whatsapp', name: 'WhatsApp', category: 'Meta', iconBg: 'bg-[#25D366]', textColor: 'text-white', description: 'Channel Updates' },
    { id: 'google_business', name: 'Google Business Profile', category: 'Google', iconBg: 'bg-[#4285F4]', textColor: 'text-white', description: 'Storefront & Local SEO' },
  ];

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

  const getPlatformInfo = (platformId: SocialPlatform) => {
    return platformOptions.find(p => p.id === platformId) || {
      id: platformId,
      name: String(platformId).toUpperCase(),
      category: 'Social',
      iconBg: 'bg-[#5D3FD3]',
      textColor: 'text-white',
      description: 'Connected Social Channel'
    };
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') !== 'true') return;
    const slot = Number(params.get('slot') || 1);
    setBusy(`sync:${slot}`);

    const engine = tenant.dispatchEngine || 'dual';
    const isComposio = engine === 'coresync' || (engine as string) === 'composio';
    const syncPromise = isComposio
      ? fetchComposioAccounts(tenant.id, slot)
      : engine === 'zenith'
      ? fetchZernioAccounts(tenant.id, slot)
      : Promise.all([fetchZernioAccounts(tenant.id, slot), fetchComposioAccounts(tenant.id, slot)]);

    syncPromise
      .then(() => {
        window.location.assign(`${window.location.origin}${window.location.pathname}`);
      })
      .catch((err: any) => setError(err?.message || 'Failed to sync connected accounts'))
      .finally(() => setBusy(undefined));
  }, [tenant.id, tenant.dispatchEngine]);

  const handleConnectPosition = async (slotNum: number, position: number) => {
    const key = `${slotNum}:${position}`;
    const platformId = selectedPlatforms[key] || (position === 1 ? 'instagram' : 'facebook');

    setBusy(key);
    setError(undefined);

    try {
      const isZernioEngine = !tenant.dispatchEngine || tenant.dispatchEngine === 'zenith' || tenant.dispatchEngine === 'dual';
      const callbackUrl = `${window.location.origin}${window.location.pathname}?connected=true&slot=${slotNum}&pos=${position}&platform=${platformId}`;
      
      if (isZernioEngine) {
        const { redirectUrl } = await generateZernioConnectUrl(platformId, tenant.id, slotNum, callbackUrl);
        if (redirectUrl) {
          window.open(redirectUrl, 'zernio_auth', 'width=620,height=780,scrollbars=yes,status=yes');
        }
      } else {
        const { redirectUrl } = await generateComposioConnectLink(platformId, tenant.id, callbackUrl);
        if (redirectUrl) {
          window.open(redirectUrl, 'composio_auth', 'width=620,height=780,scrollbars=yes,status=yes');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to generate Connect Link');
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0">
      {/* Header */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
      
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#5D3FD3]" />
            <span>Social Channel API Slot Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Each API Slot contains <strong>2 Dedicated Channel Spots (Spot 1 & Spot 2)</strong> with isolated rate limits and parallel dispatch queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 text-xs font-bold text-purple-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#5D3FD3]" />
            <span><strong>{allocatedSlotCount} API Slots</strong> • {tenantAccounts.length} / {allocatedSlotCount * 2} Channels Active</span>
          </div>
        </div>
      </div>

      {/* Zero Slots Unprovisioned Notice */}
      {allocatedSlotCount === 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
          <h3 className="font-bold text-amber-900 text-sm">No Active Channel Slots Provisioned Yet</h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            Your administrator has not added any active API channel slots to your account. Please contact support to activate your social channel slots.
          </p>
        </div>
      )}

      {/* Render 2-Spot Side-by-Side Cards for Each Account Slot */}
      <div className="space-y-5">
        {slotsList.map((slotItem, idx) => {
          const slotNum = slotItem.slotNumber || (idx + 1);
          const slotAccounts = tenantAccounts.filter(a => a.slotNumber === slotNum || (slotNum === 1 && !a.slotNumber));
          const connectedCount = slotAccounts.length;
          const isSlotFull = connectedCount >= 2;
          const isCollapsed = Boolean(collapsedSlots[slotNum]);

          const accountPos1 = slotAccounts[0];
          const accountPos2 = slotAccounts[1];

          return (
            <div key={slotItem.id || slotNum} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all hover:border-slate-300">
              
              {/* Slot Header Bar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5D3FD3] font-black text-sm flex items-center justify-center font-mono shrink-0 shadow-xs">
                    #{slotNum}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">ACCOUNT SLOT {slotNum}</h3>
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-200">
                        2 CHANNELS MAX
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>API Channel Isolation:</span>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <Radio className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500 animate-pulse" /> Active & Isolated
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-slate-800">
                      {connectedCount} / 2 CONNECTED
                    </div>
                    <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                      <div 
                        className={`h-full transition-all duration-300 ${isSlotFull ? 'bg-emerald-500' : connectedCount > 0 ? 'bg-[#5D3FD3]' : 'bg-slate-300'}`}
                        style={{ width: `${(connectedCount / 2) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSlotCollapse(slotNum)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 cursor-pointer"
                    title={isCollapsed ? 'Expand Slot' : 'Collapse Slot'}
                  >
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Slot Body: 2 Dedicated Channel Spot Cards (Spot 1 & Spot 2) */}
              {!isCollapsed && (
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* ======================================================== */}
                    {/* SPOT 1 / CHANNEL 1                                       */}
                    {/* ======================================================== */}
                    {accountPos1 ? (
                      // Spot 1: Connected State
                      <div className="p-4 rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-50/70 to-white flex flex-col justify-between space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-600 text-white shadow-xs">
                            CHANNEL 1 OF 2
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700 text-xs font-bold font-mono">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>CONNECTED</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 py-1">
                          <div className={`w-11 h-11 rounded-2xl ${getPlatformInfo(accountPos1.platform).iconBg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                            {getPlatformIcon(accountPos1.platform)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 text-sm tracking-tight truncate">
                              {getPlatformInfo(accountPos1.platform).name}
                            </div>
                            <div className="text-xs text-emerald-800 font-mono font-semibold truncate mt-0.5">
                              {accountPos1.accountHandle || accountPos1.accountName || 'Connected Account'}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900 font-mono">
                          <span>Status: Ready for scheduling</span>
                          <span className="text-emerald-700 font-bold">Slot #{slotNum} - Spot 1</span>
                        </div>
                      </div>
                    ) : (
                      // Spot 1: Empty / Connectable State
                      <div className="p-4 rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-300 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                            CHANNEL 1 OF 2
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
                            EMPTY SPOT
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-[#5D3FD3]" />
                            <span>Select Social Platform for Channel 1:</span>
                          </label>
                          <div className="relative">
                            <select
                              value={selectedPlatforms[`${slotNum}:1`] || 'instagram'}
                              onChange={(e) => setSelectedPlatforms(prev => ({ ...prev, [`${slotNum}:1`]: e.target.value as SocialPlatform }))}
                              className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 hover:border-purple-300 focus:border-[#5D3FD3] rounded-xl text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#5D3FD3] appearance-none cursor-pointer"
                            >
                              {platformOptions.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} • {p.description}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <button
                          onClick={() => handleConnectPosition(slotNum, 1)}
                          disabled={busy === `${slotNum}:1`}
                          className="w-full py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {busy === `${slotNum}:1` ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Opening OAuth Authorization…</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Connect Channel 1 ({getPlatformInfo(selectedPlatforms[`${slotNum}:1`] || 'instagram').name})</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* SPOT 2 / CHANNEL 2                                       */}
                    {/* ======================================================== */}
                    {accountPos2 ? (
                      // Spot 2: Connected State
                      <div className="p-4 rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-br from-emerald-50/70 to-white flex flex-col justify-between space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-600 text-white shadow-xs">
                            CHANNEL 2 OF 2
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700 text-xs font-bold font-mono">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>CONNECTED</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 py-1">
                          <div className={`w-11 h-11 rounded-2xl ${getPlatformInfo(accountPos2.platform).iconBg} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                            {getPlatformIcon(accountPos2.platform)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 text-sm tracking-tight truncate">
                              {getPlatformInfo(accountPos2.platform).name}
                            </div>
                            <div className="text-xs text-emerald-800 font-mono font-semibold truncate mt-0.5">
                              {accountPos2.accountHandle || accountPos2.accountName || 'Connected Account'}
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900 font-mono">
                          <span>Status: Ready for scheduling</span>
                          <span className="text-emerald-700 font-bold">Slot #{slotNum} - Spot 2</span>
                        </div>
                      </div>
                    ) : (
                      // Spot 2: Empty / Connectable State
                      <div className="p-4 rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-300 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-100 text-purple-800 border border-purple-200">
                            CHANNEL 2 OF 2
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
                            EMPTY SPOT
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-[#5D3FD3]" />
                            <span>Select Social Platform for Channel 2:</span>
                          </label>
                          <div className="relative">
                            <select
                              value={selectedPlatforms[`${slotNum}:2`] || 'facebook'}
                              onChange={(e) => setSelectedPlatforms(prev => ({ ...prev, [`${slotNum}:2`]: e.target.value as SocialPlatform }))}
                              className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 hover:border-purple-300 focus:border-[#5D3FD3] rounded-xl text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-[#5D3FD3] appearance-none cursor-pointer"
                            >
                              {platformOptions.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} • {p.description}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <button
                          onClick={() => handleConnectPosition(slotNum, 2)}
                          disabled={busy === `${slotNum}:2`}
                          className="w-full py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {busy === `${slotNum}:2` ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Opening OAuth Authorization…</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Connect Channel 2 ({getPlatformInfo(selectedPlatforms[`${slotNum}:2`] || 'facebook').name})</span>
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
