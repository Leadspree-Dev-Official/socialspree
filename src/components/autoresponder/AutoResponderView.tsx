import React, { useState } from 'react';
import { Tenant, SocialAccount, AutoResponderRule, LiveCommentTriggerLog, MediaAsset } from '../../types';
import { 
  MessageSquareCode, 
  Plus, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Zap, 
  Instagram, 
  Facebook, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  MessageCircle, 
  Mail, 
  Bot, 
  ShieldCheck, 
  Play, 
  RefreshCw, 
  X,
  Copy,
  Link as LinkIcon,
  Image,
  Film,
  Cloud,
  Check,
  Globe
} from 'lucide-react';

interface AutoResponderViewProps {
  tenant: Tenant;
  accounts: SocialAccount[];
  mediaAssets?: MediaAsset[];
}

export const AutoResponderView: React.FC<AutoResponderViewProps> = ({
  tenant,
  accounts,
  mediaAssets = [],
}) => {
  // Default Sample Rules
  const [rules, setRules] = useState<AutoResponderRule[]>([
    {
      id: 'rule-1',
      tenantId: tenant.id,
      name: 'Universal Reel Price & Buy Link DM Bot',
      platform: 'both',
      triggerKeywords: ['price', 'cost', 'how much', 'buy', 'link', 'deal'],
      matchType: 'contains',
      actionType: 'both',
      publicReplyTemplate: 'Hi @{username}! Check your DMs for the exclusive link & price 📩🚀',
      privateDmTemplate: 'Hey {username}! Thanks for reaching out. Here is the link to purchase at 20% off: https://socialspree.io/deal',
      attachedMediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      useAiContext: true,
      isActive: true,
      triggerCount: 68,
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-2',
      tenantId: tenant.id,
      name: 'Facebook Page Promo & Info Responder',
      platform: 'facebook',
      triggerKeywords: ['info', 'details', 'promo', 'discount', 'coupon'],
      matchType: 'contains',
      actionType: 'both',
      publicReplyTemplate: 'Thanks for commenting @{username}! We just sent you a private message with full details 🎉',
      privateDmTemplate: 'Hi {username}! Here is your secret promo code: SPREE2026. Use it at checkout!',
      useAiContext: true,
      isActive: true,
      triggerCount: 19,
      createdAt: new Date().toISOString()
    }
  ]);

  // Live Webhook Simulation Logs
  const [logs, setLogs] = useState<LiveCommentTriggerLog[]>([
    {
      id: 'log-1',
      tenantId: tenant.id,
      platform: 'instagram',
      mediaTitle: 'Cross-Posted SaaS Reel (IG & FB)',
      senderUsername: 'alex_growth',
      commentText: 'How much is the monthly price for this reel?',
      matchedKeyword: 'price',
      publicReplySent: 'Hi @alex_growth! Check your DMs for the exclusive link & price 📩🚀',
      privateDmSent: 'Hey alex_growth! Thanks for reaching out. Here is the link to purchase at 20% off: https://socialspree.io/deal',
      status: 'replied',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: 'log-2',
      tenantId: tenant.id,
      platform: 'facebook',
      mediaTitle: 'Product Launch Video',
      senderUsername: 'sara_marketing',
      commentText: 'Please send info and discount link!',
      matchedKeyword: 'info',
      publicReplySent: 'Thanks for commenting @sara_marketing! We just sent you a private message with full details 🎉',
      privateDmSent: 'Hi sara_marketing! Here is your secret promo code: SPREE2026. Use it at checkout!',
      status: 'replied',
      timestamp: new Date(Date.now() - 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Modal & Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [ruleNameInput, setRuleNameInput] = useState('');
  const [platformInput, setPlatformInput] = useState<'instagram' | 'facebook' | 'both'>('both');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [publicReplyInput, setPublicReplyInput] = useState('Hi @{username}! Check your DMs for the link 🚀');
  const [privateDmInput, setPrivateDmInput] = useState('Hey {username}! Here is the link: https://socialspree.io/deal');
  const [attachedMediaUrlInput, setAttachedMediaUrlInput] = useState('');
  const [useAiInput, setUseAiInput] = useState(true);
  const [showCloudinaryPicker, setShowCloudinaryPicker] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Simulator Test State
  const [simComment, setSimComment] = useState('How much is the price? Send me link please!');
  const [simUsername, setSimUsername] = useState('tech_enthusiast');
  const [isSimulating, setIsSimulating] = useState(false);

  const handleToggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    setNotification('🗑️ Auto-Responder rule deleted.');
    setTimeout(() => setNotification(null), 3000);
  };

  // 1-Click Duplicate Rule for FB / IG Cross-Posting
  const handleDuplicateRule = (rule: AutoResponderRule) => {
    const duplicatedRule: AutoResponderRule = {
      ...rule,
      id: crypto.randomUUID(),
      name: `${rule.name} (FB/IG Duplicate)`,
      platform: 'both', // Upgrade to Dual Platform (Instagram + Facebook)
      triggerCount: 0,
      createdAt: new Date().toISOString()
    };

    setRules([duplicatedRule, ...rules]);
    setNotification(`👯 Duplicated rule "${rule.name}" for both Instagram & Facebook!`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleNameInput.trim() || !keywordsInput.trim()) return;

    const keywords = keywordsInput.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);

    const newRule: AutoResponderRule = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      name: ruleNameInput.trim(),
      platform: platformInput,
      triggerKeywords: keywords,
      matchType: 'contains',
      actionType: 'both',
      publicReplyTemplate: publicReplyInput.trim(),
      privateDmTemplate: privateDmInput.trim(),
      attachedMediaUrl: attachedMediaUrlInput.trim() || undefined,
      useAiContext: useAiInput,
      isActive: true,
      triggerCount: 0,
      createdAt: new Date().toISOString()
    };

    setRules([newRule, ...rules]);
    setShowAddModal(false);
    setRuleNameInput('');
    setKeywordsInput('');
    setAttachedMediaUrlInput('');
    setNotification(`✅ Created Auto-Reply Rule "${newRule.name}" (${newRule.platform === 'both' ? 'IG + FB Cross-Posted' : newRule.platform.toUpperCase()})!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Run Webhook Comment Simulation Test
  const handleRunSimulation = () => {
    if (!simComment.trim()) return;

    setIsSimulating(true);

    setTimeout(() => {
      const textLower = simComment.toLowerCase();
      
      // Find matching rule
      const matchedRule = rules.find(r => 
        r.isActive && r.triggerKeywords.some(kw => textLower.includes(kw))
      );

      if (matchedRule) {
        const foundKw = matchedRule.triggerKeywords.find(kw => textLower.includes(kw)) || matchedRule.triggerKeywords[0];
        const pubReply = matchedRule.publicReplyTemplate.replace('{username}', simUsername);
        let dmReply = matchedRule.privateDmTemplate.replace('{username}', simUsername);

        if (matchedRule.attachedMediaUrl) {
          dmReply += `\n\n📎 Attached Cloudinary File: ${matchedRule.attachedMediaUrl}`;
        }

        const newLog: LiveCommentTriggerLog = {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          platform: matchedRule.platform === 'both' ? 'instagram' : matchedRule.platform,
          mediaTitle: 'Simulated Cross-Posted Reel Comment',
          senderUsername: simUsername,
          commentText: simComment,
          matchedKeyword: foundKw,
          publicReplySent: pubReply,
          privateDmSent: dmReply,
          status: 'replied',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setLogs([newLog, ...logs]);
        setRules(rules.map(r => r.id === matchedRule.id ? { ...r, triggerCount: r.triggerCount + 1 } : r));
        setNotification(`⚡ Webhook Triggered! Matched Keyword "${foundKw.toUpperCase()}". Public comment reply & Private DM dispatched!`);
      } else {
        setNotification(`ℹ️ Comment received, but no active rule matched keywords in "${simComment}".`);
      }

      setIsSimulating(false);
      setTimeout(() => setNotification(null), 4000);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl border border-purple-800/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5D3FD3] to-purple-400 text-white flex items-center justify-center font-black shadow-lg shadow-purple-900/50">
            <MessageSquareCode className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Instagram & Facebook Comment Auto-Responder</h2>
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase">
                DUAL IG + FB CROSS-POSTING ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Create 1 auto-reply rule that automatically runs on cross-posted videos/reels across both Instagram & Facebook simultaneously.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#5D3FD3] hover:bg-purple-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Auto-Reply Rule</span>
        </button>
      </div>

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

      {/* Grid: Left Column Rules & Simulator (7 cols), Right Column Webhook Logs (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Rules List */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#5D3FD3]" />
                <span>Active Keyword Trigger Rules ({rules.length})</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">Meta Webhooks & Cloudinary CDN Active</span>
            </div>

            <div className="space-y-4">
              {rules.map(rule => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    rule.isActive ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {rule.platform === 'both' ? (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-purple-900 to-blue-900 p-2 rounded-xl text-white shadow-xs">
                          <Instagram className="w-4 h-4 text-pink-400" />
                          <span className="text-[10px] font-bold">+</span>
                          <Facebook className="w-4 h-4 text-blue-400" />
                        </div>
                      ) : (
                        <div className={`p-2 rounded-xl text-white ${rule.platform === 'instagram' ? 'bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600' : 'bg-blue-600'}`}>
                          {rule.platform === 'instagram' ? <Instagram className="w-4 h-4" /> : <Facebook className="w-4 h-4" />}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-xs">{rule.name}</h4>
                          {rule.platform === 'both' && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-900 border border-purple-200 font-mono text-[9px] font-bold rounded-full">
                              IG + FB BOTH PLATFORMS
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>Platform: {rule.platform === 'both' ? 'INSTAGRAM & FACEBOOK' : rule.platform.toUpperCase()}</span>
                          <span>•</span>
                          <span>Triggers: {rule.triggerCount} times</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDuplicateRule(rule)}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-[#5D3FD3] border border-purple-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        title="Duplicate rule for both IG & FB"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Duplicate</span>
                      </button>

                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className="text-slate-500 hover:text-slate-900 ml-1"
                        title={rule.isActive ? 'Pause Rule' : 'Activate Rule'}
                      >
                        {rule.isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-400" />
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Trigger Keywords Chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Trigger Keywords:</span>
                    {rule.triggerKeywords.map((kw, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-purple-50 text-[#5D3FD3] border border-purple-200 rounded-md font-mono text-[10px] font-bold">
                        "{kw}"
                      </span>
                    ))}
                  </div>

                  {/* Reply Templates Preview */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-2 text-xs font-sans">
                    <div className="flex items-start gap-2 text-slate-700">
                      <MessageCircle className="w-3.5 h-3.5 text-[#5D3FD3] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-[10px] text-slate-500 block uppercase font-mono">Public Comment Reply:</span>
                        <p className="text-slate-800 text-[11px] mt-0.5">{rule.publicReplyTemplate}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-700 pt-2 border-t border-slate-200/60">
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="w-full">
                        <span className="font-bold text-[10px] text-slate-500 block uppercase font-mono">Private DM Response:</span>
                        <p className="text-slate-800 text-[11px] mt-0.5">{rule.privateDmTemplate}</p>
                        
                        {rule.attachedMediaUrl && (
                          <div className="mt-2 p-2 bg-white border border-purple-200 rounded-xl flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <img src={rule.attachedMediaUrl} alt="Attached Cloudinary Media" className="w-8 h-8 rounded-lg object-cover border shrink-0" />
                              <div className="truncate">
                                <span className="text-[10px] font-mono font-bold text-purple-900 block">Cloudinary Media Attached</span>
                                <span className="text-[9px] text-slate-500 font-mono truncate block">{rule.attachedMediaUrl}</span>
                              </div>
                            </div>
                            <a href={rule.attachedMediaUrl} target="_blank" rel="noreferrer" className="p-1 text-purple-700 hover:text-purple-900">
                              <LinkIcon className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Webhook Simulator Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 font-['Inter']">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600" />
              <span>Test Live Comment Webhook Simulator</span>
            </h3>
            <p className="text-xs text-slate-500">
              Type a simulated comment to test keyword detection, public comment replies, and private DM dispatches!
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Commenter Handle</label>
                  <input
                    type="text"
                    value={simUsername}
                    onChange={(e) => setSimUsername(e.target.value)}
                    className="w-full p-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Test Comment Text</label>
                  <input
                    type="text"
                    value={simComment}
                    onChange={(e) => setSimComment(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin text-amber-300" /> : <Play className="w-4 h-4 text-emerald-400" />}
                <span>Simulate Live Webhook Event</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Real-Time Execution Logs Stream */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-amber-500" />
              <span>Live Comment Dispatch Logs</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              REAL-TIME WEBHOOKS
            </span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {logs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    {log.platform === 'instagram' ? <Instagram className="w-3 h-3 text-pink-600" /> : <Facebook className="w-3 h-3 text-blue-600" />}
                    @{log.senderUsername}
                  </span>
                  <span className="text-slate-400">{log.timestamp}</span>
                </div>

                <p className="text-slate-800 text-[11px] font-medium bg-white p-2 border rounded-lg">
                  "{log.commentText}"
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-purple-900 font-bold bg-purple-100 px-2 py-0.5 rounded">
                    Keyword: "{log.matchedKeyword}"
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    REPLIED & DM DISPATCHED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CREATE RULE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#5D3FD3]" />
                <span>Create Auto-Reply Rule</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rule Name / Campaign</label>
                <input
                  type="text"
                  required
                  value={ruleNameInput}
                  onChange={(e) => setRuleNameInput(e.target.value)}
                  placeholder="e.g. Universal Reel Price & Buy DM Bot"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Platform</label>
                <select
                  value={platformInput}
                  onChange={(e) => setPlatformInput(e.target.value as any)}
                  className="w-full p-2.5 border rounded-xl font-bold bg-white text-slate-900"
                >
                  <option value="both">🚀 Instagram & Facebook (Both Platforms - 1 Time Creation)</option>
                  <option value="instagram">📸 Instagram Account Only</option>
                  <option value="facebook">📘 Facebook Page Only</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Selecting "Both Platforms" applies this rule to any video or reel cross-posted on both Instagram and Facebook simultaneously.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trigger Keywords (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="price, cost, how much, buy, link, promo"
                  className="w-full p-2.5 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Public Comment Reply Template</label>
                <textarea
                  rows={2}
                  required
                  value={publicReplyInput}
                  onChange={(e) => setPublicReplyInput(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Private DM Response Template</label>
                <textarea
                  rows={2}
                  required
                  value={privateDmInput}
                  onChange={(e) => setPrivateDmInput(e.target.value)}
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              {/* Cloudinary Media Attachment Field & Vault Picker */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-purple-900 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-[#5D3FD3]" />
                    <span>Attach Media / Cloudinary File Link</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCloudinaryPicker(!showCloudinaryPicker)}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100 text-[#5D3FD3] border border-purple-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>{showCloudinaryPicker ? 'Close Picker' : 'Pick from Cloudinary Vault'}</span>
                  </button>
                </div>

                <input
                  type="url"
                  value={attachedMediaUrlInput}
                  onChange={(e) => setAttachedMediaUrlInput(e.target.value)}
                  placeholder="https://res.cloudinary.com/... or pick from vault below"
                  className="w-full p-2 border rounded-xl font-mono text-[11px] bg-white"
                />

                {/* Cloudinary Media Picker Dropdown Grid */}
                {showCloudinaryPicker && (
                  <div className="pt-2 border-t border-purple-200 space-y-2 animate-in fade-in">
                    <div className="text-[10px] font-mono font-bold text-purple-900 uppercase">
                      Select Cloudinary Uploaded Asset ({mediaAssets.length} Available):
                    </div>
                    {mediaAssets.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic p-2 bg-white rounded-lg border">
                        No media assets found in Cloudinary vault. Upload images/videos in Media Vault tab first.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                        {mediaAssets.map((asset) => (
                          <div
                            key={asset.id}
                            onClick={() => {
                              setAttachedMediaUrlInput(asset.url);
                              setShowCloudinaryPicker(false);
                            }}
                            className={`p-1.5 bg-white border rounded-xl cursor-pointer hover:border-[#5D3FD3] transition-all flex flex-col items-center gap-1 text-center ${
                              attachedMediaUrlInput === asset.url ? 'border-2 border-[#5D3FD3] bg-purple-50' : 'border-slate-200'
                            }`}
                          >
                            <img src={asset.url} alt={asset.title} className="w-full h-14 object-cover rounded-lg" />
                            <span className="text-[9px] font-bold truncate w-full">{asset.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Attached Preview */}
                {attachedMediaUrlInput && (
                  <div className="flex items-center gap-2 p-2 bg-white border rounded-lg text-[11px]">
                    <img src={attachedMediaUrlInput} alt="Preview" className="w-7 h-7 rounded object-cover border" />
                    <span className="font-mono text-purple-900 font-bold truncate flex-1">{attachedMediaUrlInput}</span>
                    <button type="button" onClick={() => setAttachedMediaUrlInput('')} className="text-red-500 hover:text-red-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5D3FD3] text-white font-bold rounded-xl shadow-md"
                >
                  Save & Activate Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
