import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SocialAccount, Tenant, SocialPlatform } from '../../types';
import { generateComposioConnectLink } from '../../lib/composio';
import { 
  Share2, 
  Plus, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Layers, 
  Key, 
  Instagram, 
  Youtube, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Store,
  AlertCircle,
  MessageSquare,
  Send,
  Radio,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface SocialConnectionsViewProps {
  tenant: Tenant;
  accounts: SocialAccount[];
  onAddAccount?: (acc: Omit<SocialAccount, 'id' | 'tenantId' | 'lastSyncedAt'>) => void;
}

export const SocialConnectionsView: React.FC<SocialConnectionsViewProps> = ({
  tenant,
  accounts,
  onAddAccount
}) => {
  const [collapsedSlots, setCollapsedSlots] = useState<Record<number, boolean>>({});

  const tenantAccounts = accounts.filter(a => a.tenantId === tenant.id);
  const slotsList = tenant.apiSlotDetails && tenant.apiSlotDetails.length > 0
    ? tenant.apiSlotDetails
    : Array.from({ length: tenant.allocatedApiSlots || 2 }).map((_, idx) => ({
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

  // 15 Multi-Platform Definitions matching the image grid
  const allPlatforms: { id: SocialPlatform; name: string; brandColor?: string; isSoon?: boolean }[] = [
    { id: 'facebook', name: 'FACEBOOK' },
    { id: 'instagram', name: 'INSTAGRAM', brandColor: 'bg-[#E1306C] text-white border-[#C13584]' },
    { id: 'tiktok', name: 'TIKTOK' },
    { id: 'linkedin', name: 'LINKEDIN' },
    { id: 'x', name: 'X (TWITTER)' },
    { id: 'youtube', name: 'YOUTUBE', brandColor: 'bg-[#FF0000] text-white border-[#CC0000]' },
    { id: 'threads', name: 'THREADS' },
    { id: 'bluesky', name: 'BLUESKY' },
    { id: 'pinterest', name: 'PINTEREST' },
    { id: 'reddit', name: 'REDDIT' },
    { id: 'telegram', name: 'TELEGRAM' },
    { id: 'discord', name: 'DISCORD' },
    { id: 'whatsapp', name: 'WHATSAPP' },
    { id: 'snapchat', name: 'SNAPCHAT', isSoon: true },
    { id: 'google_business', name: 'GOOGLE BUSINESS PROFILE' },
  ];

  const getPlatformIcon = (platformId: SocialPlatform) => {
    switch (platformId) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'youtube': return <Youtube className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5 text-blue-600" />;
      case 'facebook': return <Facebook className="w-5 h-5 text-blue-700" />;
      case 'x': return <Twitter className="w-5 h-5 text-slate-900" />;
      case 'google_business': return <Store className="w-5 h-5 text-emerald-600" />;
      default: return <Share2 className="w-5 h-5 text-purple-600" />;
    }
  };

  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('connected') && params.get('zernio') !== 'connected') return;
    const slot = Number(params.get('slot') || 1);
    setBusy(`sync:${slot}`);
    supabase.functions.invoke('zernio-accounts', { body: { tenantId: tenant.id, label: `slot-${slot}` } })
      .then(({ data, error: invokeError }) => {
        if (invokeError || data?.error) setError(data?.error || invokeError?.message);
        else window.location.assign(`${window.location.origin}${window.location.pathname}`);
      }).finally(() => setBusy(undefined));
  }, [tenant.id]);
  const handleToggleChannel = async (slotNum: number, platformId: SocialPlatform, isConnected: boolean, isAtLimit: boolean) => {
    if (isConnected || isAtLimit) return;

    setBusy(`${slotNum}:${platformId}`); 
    setError(undefined);

    try {
      const callbackUrl = `${window.location.origin}${window.location.pathname}?connected=true&slot=${slotNum}&platform=${platformId}`;
      const { redirectUrl } = await generateComposioConnectLink(platformId, tenant.id, callbackUrl);
      
      if (redirectUrl) {
        window.open(redirectUrl, 'composio_auth', 'width=620,height=780,scrollbars=yes,status=yes');
      }

      if (onAddAccount) {
        onAddAccount({
          platform: platformId,
          channelAccountId: `composio_${platformId}_${Date.now()}`,
          accountName: `${platformId.toUpperCase()} Account`,
          accountHandle: `@${platformId}_user`,
          accountAvatar: '',
          slotNumber: slotNum,
          status: 'active'
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to generate CoreSync Connect Link');
    } finally {
      setBusy(undefined);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0">
      {/* White-Labeled Header */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#5D3FD3]" />
            <span>Social Channel API Slot Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect up to 2 social channels per allocated API Key slot. Multi-key parallel engine supports up to {allocatedSlotCount * 2} connected accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(!tenant.dispatchEngine || tenant.dispatchEngine === 'dual' || tenant.dispatchEngine === 'coresync') && (
            <div className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>CoreSync Engine: <strong>1 Session = All Channels Included</strong></span>
            </div>
          )}
          {(!tenant.dispatchEngine || tenant.dispatchEngine === 'dual' || tenant.dispatchEngine === 'zenith') && (
            <div className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-xs font-bold text-purple-900">
              <span>Zenith Engine: <strong>{allocatedSlotCount} API Slots</strong> ({tenantAccounts.length} / {allocatedSlotCount * 2} Channels)</span>
            </div>
          )}
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

      {/* Render Slot Groups for each Allocated API Key */}
      {slotsList.map((slotItem, idx) => {
        const slotNum = slotItem.slotNumber || (idx + 1);
        const slotAccounts = tenantAccounts.filter(a => a.slotNumber === slotNum || (slotNum === 1 && !a.slotNumber));
        const connectedCount = slotAccounts.length;
        const isSlotLimit = connectedCount >= 2;
        const isCollapsed = Boolean(collapsedSlots[slotNum]);

        return (
          <div key={slotItem.id || slotNum} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Slot Header Bar */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5D3FD3] font-black text-sm flex items-center justify-center font-mono">
                  #{slotNum}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">ACCOUNT SLOT {slotNum}</h3>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-purple-200">
                      2 CHANNELS MAX
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Slot Key ID: <code className="text-slate-700 font-bold bg-slate-200/60 px-1.5 py-0.5 rounded">••••••••••••••••••••</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-800">
                    {connectedCount} / 2 CONNECTED
                  </div>
                  <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full transition-all ${isSlotLimit ? 'bg-emerald-500' : 'bg-[#5D3FD3]'}`}
                      style={{ width: `${(connectedCount / 2) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => toggleSlotCollapse(slotNum)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
                >
                  {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 15 Platform Connection Cards Grid */}
            {!isCollapsed && (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {allPlatforms.map((platform) => {
                    const connectedAccount = slotAccounts.find(a => a.platform === platform.id);
                    const isConnected = Boolean(connectedAccount);

                    return (
                      <div 
                        key={platform.id}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                          isConnected 
                            ? 'border-emerald-500 bg-emerald-50/20' 
                            : isSlotLimit 
                            ? 'border-slate-200 bg-slate-50/50 opacity-60' 
                            : 'border-slate-200 hover:border-purple-300 hover:shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                              {getPlatformIcon(platform.id)}
                            </div>

                            {isConnected ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500 text-white shadow-xs">
                                CONNECTED
                              </span>
                            ) : isSlotLimit ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-slate-300 text-slate-700">
                                LIMIT
                              </span>
                            ) : platform.isSoon ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-purple-100 text-purple-700">
                                SOON
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3">
                            <div className="font-bold text-slate-900 text-xs tracking-tight">{platform.name}</div>
                            {isConnected ? (
                              <div className="text-[11px] text-emerald-700 font-mono mt-0.5 truncate">
                                {connectedAccount?.accountHandle || connectedAccount?.accountName}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {isSlotLimit ? '2/2 Slot Limit Reached' : 'Ready to Connect'}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleChannel(slotNum, platform.id, isConnected, isSlotLimit)}
                          disabled={isConnected || isSlotLimit || platform.isSoon || busy === `${slotNum}:${platform.id}`}
                          className={`w-full py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                            isConnected
                              ? 'bg-emerald-600 text-white cursor-default'
                              : isSlotLimit
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : platform.isSoon
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-[#5D3FD3] text-white hover:bg-purple-700 active:scale-95'
                          }`}
                        >
                          {isConnected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Connected</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{busy === `${slotNum}:${platform.id}` ? 'Opening…' : 'Connect'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
