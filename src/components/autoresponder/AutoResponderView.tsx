import React, { useState, useEffect } from 'react';
import { Tenant, SocialAccount, AutoResponderRule, LiveCommentTriggerLog, MediaAsset } from '../../types';
import { autoResponderRules, liveCommentTriggerLogs } from '../../lib/api';
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
  Globe,
  Sliders,
  Layers,
  Settings,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Repeat
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
      name: 'Universal Price & Buy Link DM Bot',
      platform: 'both',
      targetPostScope: 'all_posts',
      triggerType: 'keyword',
      triggerKeywords: ['price', 'cost', 'how much', 'buy', 'link', 'deal'],
      matchType: 'contains',
      actionType: 'both',
      publicReplyTemplate: 'Hi @{username}! Check your DMs for the exclusive link & price 📩🚀',
      publicReplyTemplates: [
        'Hi @{username}! Check your DMs for the exclusive link & price 📩🚀',
        'Hey @{username}, just sent the pricing & checkout details to your DM! ✨',
        'Sent you a direct message with all the details @{username} 🎉'
      ],
      privateDmTemplate: 'Hey {username}! Thanks for reaching out. Here is the link to purchase at 20% off: https://socialspree.io/deal',
      privateDmTemplates: [
        'Hey {username}! Thanks for reaching out. Here is the link to purchase at 20% off: https://socialspree.io/deal',
        'Hi {username}! You can grab your exclusive discount code here: https://socialspree.io/deal. Let us know if you have questions!'
      ],
      attachedMediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      useAiContext: true,
      aiPersonaPrompt: 'Friendly social commerce assistant that answers pricing questions and shares discount links.',
      rateLimitMinutes: 60,
      isActive: true,
      triggerCount: 68,
      createdAt: new Date().toISOString()
    },
    {
      id: 'rule-2',
      tenantId: tenant.id,
      name: 'Universal Catch-All Engagement Booster',
      platform: 'both',
      targetPostScope: 'all_posts',
      triggerType: 'all_comments',
      triggerKeywords: ['*'],
      matchType: 'contains',
      actionType: 'comment_reply',
      publicReplyTemplate: 'Thank you for stopping by and sharing your thoughts @{username}! ❤️',
      publicReplyTemplates: [
        'Thank you for stopping by and sharing your thoughts @{username}! ❤️',
        'Appreciate the support @{username}! Have an amazing week 🚀',
        'Love having you in our community @{username}! 🙌'
      ],
      privateDmTemplate: '',
      useAiContext: true,
      rateLimitMinutes: 120,
      isActive: true,
      triggerCount: 34,
      createdAt: new Date().toISOString()
    }
  ]);

  // Live Logs State
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
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Rule Form Fields
  const [ruleNameInput, setRuleNameInput] = useState('');
  const [platformInput, setPlatformInput] = useState<'instagram' | 'facebook' | 'both'>('both');
  const [targetScopeInput, setTargetScopeInput] = useState<'all_posts' | 'specific_posts'>('all_posts');
  const [triggerTypeInput, setTriggerTypeInput] = useState<'keyword' | 'all_comments' | 'sentiment'>('keyword');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [matchTypeInput, setMatchTypeInput] = useState<'contains' | 'exact'>('contains');
  const [actionTypeInput, setActionTypeInput] = useState<'both' | 'comment_reply' | 'private_dm'>('both');
  
  // Multi-Template Rotation Lists
  const [publicTemplates, setPublicTemplates] = useState<string[]>([
    'Hi @{username}! Check your DMs for the exclusive details 📩🚀',
    'Hey @{username}, just sent the link to your direct messages! ✨'
  ]);
  const [privateTemplates, setPrivateTemplates] = useState<string[]>([
    'Hey {username}! Thanks for reaching out. Here is the link: https://socialspree.io/deal'
  ]);
  
  const [attachedMediaUrlInput, setAttachedMediaUrlInput] = useState('');
  const [useAiInput, setUseAiInput] = useState(true);
  const [aiPersonaInput, setAiPersonaInput] = useState('Friendly and enthusiastic brand assistant.');
  const [rateLimitMinutesInput, setRateLimitMinutesInput] = useState(60);
  const [showCloudinaryPicker, setShowCloudinaryPicker] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Simulator Test State
  const [simPlatform, setSimPlatform] = useState<'instagram' | 'facebook'>('instagram');
  const [simComment, setSimComment] = useState('How much is the price? Send me the link please!');
  const [simUsername, setSimUsername] = useState('alex_marketing');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastSimResult, setLastSimResult] = useState<{
    matchedRule: string;
    triggerType: string;
    keyword: string;
    publicReply: string;
    privateDm?: string;
  } | null>(null);

  // Cloud Hydration
  useEffect(() => {
    let isMounted = true;
    const fetchRules = async () => {
      try {
        const cloudList = await autoResponderRules.list();
        if (cloudList && cloudList.length > 0 && isMounted) {
          setRules(cloudList);
        }
      } catch { /* fallback to local initial rules */ }
    };
    void fetchRules();
    return () => { isMounted = false; };
  }, [tenant.id]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleToggleRule = async (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setRules(updated);
    const target = updated.find(r => r.id === id);
    if (target) {
      void autoResponderRules.save(target).catch(() => {});
    }
  };

  const handleDeleteRule = async (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    void autoResponderRules.delete(id).catch(() => {});
    setNotification('🗑️ Auto-Responder rule deleted.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDuplicateRule = async (rule: AutoResponderRule) => {
    const duplicatedRule: AutoResponderRule = {
      ...rule,
      id: crypto.randomUUID(),
      name: `${rule.name} (FB/IG Duplicate)`,
      platform: 'both',
      targetPostScope: 'all_posts',
      triggerCount: 0,
      createdAt: new Date().toISOString()
    };

    setRules([duplicatedRule, ...rules]);
    void autoResponderRules.save(duplicatedRule).catch(() => {});
    setNotification(`👯 Duplicated rule "${rule.name}" for both Instagram & Facebook!`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleNameInput.trim()) return;

    const keywords = triggerTypeInput === 'all_comments'
      ? ['*']
      : keywordsInput.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);

    if (triggerTypeInput === 'keyword' && keywords.length === 0) {
      setNotification('⚠️ Please enter at least one trigger keyword.');
      return;
    }

    const cleanPublicTemplates = publicTemplates.map(t => t.trim()).filter(Boolean);
    const cleanPrivateTemplates = privateTemplates.map(t => t.trim()).filter(Boolean);

    const newRule: AutoResponderRule = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      name: ruleNameInput.trim(),
      platform: platformInput,
      targetPostScope: targetScopeInput,
      triggerType: triggerTypeInput,
      triggerKeywords: keywords,
      matchType: matchTypeInput,
      actionType: actionTypeInput,
      publicReplyTemplate: cleanPublicTemplates[0] || 'Hi @{username}! Thanks for reaching out 🚀',
      publicReplyTemplates: cleanPublicTemplates.length > 0 ? cleanPublicTemplates : ['Hi @{username}! Thanks for reaching out 🚀'],
      privateDmTemplate: cleanPrivateTemplates[0] || '',
      privateDmTemplates: cleanPrivateTemplates,
      attachedMediaUrl: attachedMediaUrlInput.trim() || undefined,
      useAiContext: useAiInput,
      aiPersonaPrompt: aiPersonaInput.trim() || undefined,
      rateLimitMinutes: rateLimitMinutesInput,
      isActive: true,
      triggerCount: 0,
      createdAt: new Date().toISOString()
    };

    setRules([newRule, ...rules]);
    void autoResponderRules.save(newRule).catch(() => {});

    setShowAddModal(false);
    setRuleNameInput('');
    setKeywordsInput('');
    setAttachedMediaUrlInput('');
    setNotification(`✅ Created Universal Auto-Reply Rule "${newRule.name}" (${newRule.platform === 'both' ? 'IG + FB Universal' : newRule.platform.toUpperCase()})!`);
    setTimeout(() => setNotification(null), 3500);
  };

  // Run Webhook Comment Simulation Test
  const handleRunSimulation = () => {
    if (!simComment.trim()) return;

    setIsSimulating(true);
    setLastSimResult(null);

    setTimeout(() => {
      const textLower = simComment.toLowerCase();
      
      // Find matching rule
      const matchedRule = rules.find(r => {
        if (!r.isActive) return false;
        if (r.platform !== 'both' && r.platform !== simPlatform) return false;

        if (r.triggerType === 'all_comments') return true;
        if (r.triggerType === 'sentiment') {
          return simComment.includes('?') || textLower.includes('how') || textLower.includes('where') || textLower.includes('price');
        }
        return r.triggerKeywords.some(kw => 
          r.matchType === 'exact' ? textLower === kw : textLower.includes(kw)
        );
      });

      if (matchedRule) {
        const foundKw = matchedRule.triggerType === 'all_comments'
          ? 'all_comments (Universal Catch-All)'
          : matchedRule.triggerType === 'sentiment'
          ? 'sentiment (Inquiry Intent)'
          : matchedRule.triggerKeywords.find(kw => textLower.includes(kw)) || matchedRule.triggerKeywords[0];

        // Template Rotation: pick a random template from array
        const pTemplates = (matchedRule.publicReplyTemplates && matchedRule.publicReplyTemplates.length > 0)
          ? matchedRule.publicReplyTemplates
          : [matchedRule.publicReplyTemplate || 'Hi @{username}! Thanks for reaching out 🚀'];
        const randomPub = pTemplates[Math.floor(Math.random() * pTemplates.length)];
        const pubReply = randomPub.replace(/\{username\}/gi, simUsername);

        const dmTemplates = (matchedRule.privateDmTemplates && matchedRule.privateDmTemplates.length > 0)
          ? matchedRule.privateDmTemplates
          : (matchedRule.privateDmTemplate ? [matchedRule.privateDmTemplate] : []);
        
        let dmReply = '';
        if (matchedRule.actionType !== 'comment_reply' && dmTemplates.length > 0) {
          const randomDm = dmTemplates[Math.floor(Math.random() * dmTemplates.length)];
          dmReply = randomDm.replace(/\{username\}/gi, simUsername);
          if (matchedRule.attachedMediaUrl) {
            dmReply += `\n\n📎 Attached Asset: ${matchedRule.attachedMediaUrl}`;
          }
        }

        const newLog: LiveCommentTriggerLog = {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          platform: simPlatform,
          mediaTitle: 'Universal Post (Any Reel/Post)',
          senderUsername: simUsername,
          commentText: simComment,
          matchedKeyword: foundKw,
          publicReplySent: matchedRule.actionType !== 'private_dm' ? pubReply : undefined,
          privateDmSent: matchedRule.actionType !== 'comment_reply' ? dmReply : undefined,
          status: 'replied',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setLogs(prevLogs => [newLog, ...prevLogs]);
        void liveCommentTriggerLogs.create(newLog).catch(() => {});

        setRules(prevRules => prevRules.map(r => r.id === matchedRule.id ? { ...r, triggerCount: r.triggerCount + 1 } : r));
        
        setLastSimResult({
          matchedRule: matchedRule.name,
          triggerType: matchedRule.triggerType || 'keyword',
          keyword: foundKw,
          publicReply: matchedRule.actionType !== 'private_dm' ? pubReply : '',
          privateDm: matchedRule.actionType !== 'comment_reply' ? dmReply : undefined
        });

        setNotification(`⚡ Simulated Webhook Dispatched! Rule: "${matchedRule.name}" matched.`);
      } else {
        setNotification(`ℹ️ Comment received on ${simPlatform.toUpperCase()}, but no active rule matched "${simComment}".`);
      }

      setIsSimulating(false);
      setTimeout(() => setNotification(null), 4000);
    }, 900);
  };

  const webhookEndpointUrl = `https://qglhbesenigpspgkgbac.supabase.co/functions/v1/meta-comment-webhook`;
  const webhookVerifyToken = `socialspree_meta_autoresponder_token_2026`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-8 animate-in fade-in">
      
      {/* Universal Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl border border-purple-800/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5D3FD3] to-purple-400 text-white flex items-center justify-center font-black shadow-lg shadow-purple-900/50 shrink-0">
            <MessageSquareCode className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight">Universal Instagram & Facebook Comment Auto-Responder</h2>
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase">
                ANY POST MONITORING
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Automatically monitors and responds to incoming comments on <strong>any post</strong> (existing posts, scheduled reels, and native uploads) across Instagram & Facebook simultaneously.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowWebhookGuide(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-200 rounded-xl font-bold text-xs border border-purple-800/60 shadow-xs transition-all flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            <span>Meta Webhook Setup</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#5D3FD3] hover:bg-purple-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Auto-Reply Rule</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-semibold animate-in fade-in flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: Left Column Rules & Interactive Simulator (7 cols), Right Column Real-Time Logs (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Rules List & Simulator */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Rules Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400" />
                <span>Active Auto-Responder Rules ({rules.length})</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Meta Graph Webhook Active</span>
            </div>

            {rules.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs italic">
                No active auto-responder rules configured. Click &quot;+ Create Auto-Reply Rule&quot; to begin.
              </div>
            ) : (
              <div className="space-y-4">
                {rules.map(rule => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      rule.isActive
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs">{rule.name}</h4>
                            {rule.targetPostScope === 'all_posts' && (
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono text-[9px] font-bold rounded-full">
                                ANY POST (UNIVERSAL)
                              </span>
                            )}
                            {rule.triggerType === 'all_comments' && (
                              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono text-[9px] font-bold rounded-full">
                                CATCH-ALL
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Platform: {rule.platform === 'both' ? 'IG & FB DUAL' : rule.platform.toUpperCase()}</span>
                            <span>•</span>
                            <span>Triggers: {rule.triggerCount} times</span>
                            <span>•</span>
                            <span>Rate Limit: {rule.rateLimitMinutes || 60}m</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDuplicateRule(rule)}
                          className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[#5D3FD3] dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Duplicate rule for both IG & FB"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Duplicate</span>
                        </button>

                        <button
                          onClick={() => handleToggleRule(rule.id)}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 ml-1 cursor-pointer"
                          title={rule.isActive ? 'Pause Rule' : 'Activate Rule'}
                        >
                          {rule.isActive ? (
                            <ToggleRight className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Trigger Badges & Keywords */}
                    <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold">Trigger:</span>
                      {rule.triggerType === 'all_comments' ? (
                        <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-md font-mono text-[10px] font-bold">
                          ✨ Any comment on any post
                        </span>
                      ) : rule.triggerType === 'sentiment' ? (
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md font-mono text-[10px] font-bold">
                          💡 Question / Inquiries Intent
                        </span>
                      ) : (
                        rule.triggerKeywords.map((kw, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-md font-mono text-[10px] font-bold">
                            &quot;{kw}&quot;
                          </span>
                        ))
                      )}
                    </div>

                    {/* Reply Templates Preview */}
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 text-xs font-sans">
                      {rule.actionType !== 'private_dm' && (
                        <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <MessageCircle className="w-3.5 h-3.5 text-[#5D3FD3] dark:text-purple-400 shrink-0 mt-0.5" />
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">Public Comment Reply:</span>
                              {(rule.publicReplyTemplates && rule.publicReplyTemplates.length > 1) && (
                                <span className="text-[9px] font-mono bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold border border-purple-200 dark:border-purple-800">
                                  Rotating {rule.publicReplyTemplates.length} Anti-Spam Variants
                                </span>
                              )}
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 text-[11px] mt-0.5 font-medium">{rule.publicReplyTemplate}</p>
                          </div>
                        </div>
                      )}

                      {rule.actionType !== 'comment_reply' && (
                        <div className={`flex items-start gap-2 text-slate-700 dark:text-slate-300 ${rule.actionType === 'both' ? 'pt-2 border-t border-slate-200/60 dark:border-slate-800' : ''}`}>
                          <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">Private DM Response:</span>
                              {(rule.privateDmTemplates && rule.privateDmTemplates.length > 1) && (
                                <span className="text-[9px] font-mono bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold border border-blue-200 dark:border-blue-800">
                                  Rotating {rule.privateDmTemplates.length} DM Variants
                                </span>
                              )}
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 text-[11px] mt-0.5 font-medium">{rule.privateDmTemplate || '(Default DM Template)'}</p>
                            
                            {rule.attachedMediaUrl && (
                              <div className="mt-2 p-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <img src={rule.attachedMediaUrl} alt="Attached Media" className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                                  <div className="truncate">
                                    <span className="text-[10px] font-mono font-bold text-purple-900 dark:text-purple-300 block">Cloudinary Media Attached</span>
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate block">{rule.attachedMediaUrl}</span>
                                  </div>
                                </div>
                                <a href={rule.attachedMediaUrl} target="_blank" rel="noreferrer" className="p-1 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white">
                                  <LinkIcon className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Webhook Simulator Card */}
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-2xl p-5 border border-purple-800/60 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-purple-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Live Webhook Simulator & Sandbox</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30 font-bold">
                TEST ANY POST
              </span>
            </div>

            <p className="text-xs text-purple-200">
              Test how your auto-responder handles incoming comments on any post before publishing live.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-200 mb-1">Simulated Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimPlatform('instagram')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      simPlatform === 'instagram'
                        ? 'bg-gradient-to-tr from-amber-500 to-pink-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Instagram</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimPlatform('facebook')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      simPlatform === 'facebook'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Facebook className="w-3.5 h-3.5" />
                    <span>Facebook</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-200 mb-1">Simulated Commenter Handle</label>
                <input
                  type="text"
                  value={simUsername}
                  onChange={(e) => setSimUsername(e.target.value)}
                  className="w-full bg-slate-800 border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 font-mono focus:outline-none focus:border-purple-400"
                  placeholder="e.g. social_fan_99"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-purple-200 mb-1">Simulated Comment Text on Any Post</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={simComment}
                  onChange={(e) => setSimComment(e.target.value)}
                  className="flex-1 bg-slate-800 border border-purple-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 font-mono focus:outline-none focus:border-purple-400"
                  placeholder="e.g. Can you share the price link?"
                />
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating || !simComment.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Dispatched...' : 'Simulate Event'}</span>
                </button>
              </div>
            </div>

            {/* Simulation Output Card */}
            {lastSimResult && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/40 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-400 font-bold">✅ MATCHED: {lastSimResult.matchedRule}</span>
                  <span className="text-purple-300 font-bold uppercase">{lastSimResult.keyword}</span>
                </div>
                {lastSimResult.publicReply && (
                  <div className="text-xs text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-purple-400 font-bold block uppercase">Dispatched Public Reply:</span>
                    {lastSimResult.publicReply}
                  </div>
                )}
                {lastSimResult.privateDm && (
                  <div className="text-xs text-slate-200 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-blue-400 font-bold block uppercase">Dispatched Private DM:</span>
                    {lastSimResult.privateDm}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real-Time Webhook Logs Feed */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquareCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Live Webhook Ingestion Log ({logs.length})</span>
              </h3>
              <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                REAL-TIME STREAM
              </span>
            </div>

            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      {log.platform === 'instagram' ? (
                        <Instagram className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                      ) : (
                        <Facebook className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                      <span>@{log.senderUsername}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{log.timestamp}</span>
                  </div>

                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    &quot;{log.commentText}&quot;
                  </div>

                  {log.publicReplySent && (
                    <div className="text-[11px] text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/40 p-2 rounded-lg border border-purple-100 dark:border-purple-800/60">
                      <span className="font-bold text-[9px] uppercase font-mono block text-[#5D3FD3] dark:text-purple-400">Public Reply Sent:</span>
                      {log.publicReplySent}
                    </div>
                  )}

                  {log.privateDmSent && (
                    <div className="text-[11px] text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-100 dark:border-blue-800/60">
                      <span className="font-bold text-[9px] uppercase font-mono block text-blue-700 dark:text-blue-400">Private DM Dispatched:</span>
                      {log.privateDmSent}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Create Auto-Reply Rule */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in font-['Inter']">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-[#5D3FD3] dark:text-purple-300 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Universal Auto-Reply Rule</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={ruleNameInput}
                  onChange={(e) => setRuleNameInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl font-medium focus:ring-2 focus:ring-purple-500/20"
                  placeholder="e.g. Universal Pricing & Checkout DM Bot"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Platform Coverage</label>
                  <select
                    value={platformInput}
                    onChange={(e) => setPlatformInput(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-750 rounded-xl font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="both">Both (Instagram + Facebook)</option>
                    <option value="instagram">Instagram Only</option>
                    <option value="facebook">Facebook Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Post Scope</label>
                  <select
                    value={targetScopeInput}
                    onChange={(e) => setTargetScopeInput(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-750 rounded-xl font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="all_posts">All Posts (Universal Monitoring)</option>
                    <option value="specific_posts">Specific Posts Only</option>
                  </select>
                </div>
              </div>

              {/* Trigger Mode */}
              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                <label className="block font-bold text-slate-800 dark:text-slate-200">Comment Trigger Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTriggerTypeInput('keyword')}
                    className={`p-2.5 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                      triggerTypeInput === 'keyword'
                        ? 'bg-[#5D3FD3] text-white border-[#5D3FD3] shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    Keywords
                  </button>

                  <button
                    type="button"
                    onClick={() => setTriggerTypeInput('all_comments')}
                    className={`p-2.5 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                      triggerTypeInput === 'all_comments'
                        ? 'bg-[#5D3FD3] text-white border-[#5D3FD3] shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    All Comments (Catch-All)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTriggerTypeInput('sentiment')}
                    className={`p-2.5 rounded-xl font-bold text-center border transition-all cursor-pointer ${
                      triggerTypeInput === 'sentiment'
                        ? 'bg-[#5D3FD3] text-white border-[#5D3FD3] shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    Inquiries / Intent
                  </button>
                </div>

                {triggerTypeInput === 'keyword' && (
                  <div className="pt-2">
                    <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Trigger Keywords (comma separated)</label>
                    <input
                      type="text"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      placeholder="e.g. price, link, cost, deal, buy"
                    />
                  </div>
                )}
              </div>

              {/* Action Type */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Action Dispatched</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionTypeInput('both')}
                    className={`p-2 rounded-xl font-bold text-center border cursor-pointer ${
                      actionTypeInput === 'both' ? 'bg-purple-50 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 border-[#5D3FD3] dark:border-purple-600' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Public Reply + DM
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionTypeInput('comment_reply')}
                    className={`p-2 rounded-xl font-bold text-center border cursor-pointer ${
                      actionTypeInput === 'comment_reply' ? 'bg-purple-50 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 border-[#5D3FD3] dark:border-purple-600' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Public Reply Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionTypeInput('private_dm')}
                    className={`p-2 rounded-xl font-bold text-center border cursor-pointer ${
                      actionTypeInput === 'private_dm' ? 'bg-purple-50 dark:bg-purple-950/60 text-[#5D3FD3] dark:text-purple-300 border-[#5D3FD3] dark:border-purple-600' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Private DM Only
                  </button>
                </div>
              </div>

              {/* Multi-Template Public Reply Variants */}
              {actionTypeInput !== 'private_dm' && (
                <div className="space-y-2 p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-100 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-[#5D3FD3] dark:text-purple-400" />
                      <span>Rotating Public Comment Reply Variants (Anti-Spam)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPublicTemplates([...publicTemplates, 'Hi @{username}! Thanks for your comment 🎉'])}
                      className="text-[10px] font-bold text-[#5D3FD3] dark:text-purple-300 hover:underline cursor-pointer"
                    >
                      + Add Variation
                    </button>
                  </div>
                  {publicTemplates.map((tpl, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={tpl}
                        onChange={(e) => {
                          const next = [...publicTemplates];
                          next[idx] = e.target.value;
                          setPublicTemplates(next);
                        }}
                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs"
                        placeholder="Use {username} as placeholder"
                      />
                      {publicTemplates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPublicTemplates(publicTemplates.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Multi-Template Private DM Variants */}
              {actionTypeInput !== 'comment_reply' && (
                <div className="space-y-2 p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Rotating Private DM Message Variants</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setPrivateTemplates([...privateTemplates, 'Hi {username}! Here are the details you requested.'])}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-300 hover:underline cursor-pointer"
                    >
                      + Add Variation
                    </button>
                  </div>
                  {privateTemplates.map((tpl, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <textarea
                        rows={2}
                        value={tpl}
                        onChange={(e) => {
                          const next = [...privateTemplates];
                          next[idx] = e.target.value;
                          setPrivateTemplates(next);
                        }}
                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs"
                        placeholder="Use {username} as placeholder"
                      />
                      {privateTemplates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPrivateTemplates(privateTemplates.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Cloudinary Media Attachment */}
                  <div className="pt-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Attached Media Vault URL (Optional)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={attachedMediaUrlInput}
                        onChange={(e) => setAttachedMediaUrlInput(e.target.value)}
                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs font-mono"
                        placeholder="https://res.cloudinary.com/..."
                      />
                      {mediaAssets.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowCloudinaryPicker(!showCloudinaryPicker)}
                          className="px-3 py-2 bg-purple-100 dark:bg-purple-950 text-[#5D3FD3] dark:text-purple-300 font-bold rounded-xl text-xs hover:bg-purple-200 dark:hover:bg-purple-900 cursor-pointer"
                        >
                          Media Vault
                        </button>
                      )}
                    </div>

                    {showCloudinaryPicker && (
                      <div className="grid grid-cols-4 gap-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl mt-2 max-h-32 overflow-y-auto">
                        {mediaAssets.map((asset) => (
                          <div
                            key={asset.id}
                            onClick={() => {
                              setAttachedMediaUrlInput(asset.url);
                              setShowCloudinaryPicker(false);
                            }}
                            className="aspect-square rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:border-purple-500"
                          >
                            <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Anti-Spam Rate Limit Setting */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Per-User Cooldown Rate Limit</label>
                  <select
                    value={rateLimitMinutesInput}
                    onChange={(e) => setRateLimitMinutesInput(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value={15}>15 Minutes Cooldown</option>
                    <option value={30}>30 Minutes Cooldown</option>
                    <option value={60}>60 Minutes (Recommended)</option>
                    <option value={1440}>24 Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">AI Context & Sentiment</label>
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      id="aiContextToggle"
                      checked={useAiInput}
                      onChange={(e) => setUseAiInput(e.target.checked)}
                      className="w-4 h-4 text-[#5D3FD3] rounded"
                    />
                    <label htmlFor="aiContextToggle" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                      Enable Context Intelligence
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5D3FD3] hover:bg-purple-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Save & Activate Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Meta Webhook Setup Drawer */}
      {showWebhookGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in font-['Inter']">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Meta Graph Webhook Setup</h3>
              </div>
              <button onClick={() => setShowWebhookGuide(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Connect this Webhook URL inside your Meta App Developer Portal (Instagram Graph API & Page Webhooks) to enable instant comment and DM auto-dispatches.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Callback URL (Webhook Endpoint)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookEndpointUrl}
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookEndpointUrl, 'url')}
                    className="px-3 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedField === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'url' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Verify Token</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookVerifyToken}
                    className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookVerifyToken, 'token')}
                    className="px-3 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedField === 'token' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'token' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-1">
                <span className="font-bold text-[11px] block">Subscribed Webhook Fields:</span>
                <p className="text-[11px] font-mono">
                  • Instagram: <code>comments</code>, <code>mentions</code>, <code>messages</code><br />
                  • Facebook Page: <code>feed</code> (item: comment), <code>messages</code>
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWebhookGuide(false)}
                className="px-5 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
