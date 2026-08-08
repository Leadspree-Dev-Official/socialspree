import React, { useState } from 'react';
import { Tenant, ChatGPTKeyConfig } from '../../types';
import { GLOBAL_SYSTEM_SETTINGS } from '../../lib/store';
import { 
  Bot, 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  FileCode,
  Zap,
  Clock,
  Send
} from 'lucide-react';

interface ChatGPTConnectorSettingsProps {
  tenant: Tenant;
}

export const ChatGPTConnectorSettings: React.FC<ChatGPTConnectorSettingsProps> = ({ tenant }) => {
  const [keys, setKeys] = useState<ChatGPTKeyConfig[]>([
    {
      id: 'gpt-key-1',
      tenantId: tenant.id,
      keyLabel: 'Primary ChatGPT Custom GPT Action Key',
      apiKey: 'spree_gpt_live_98a7f201b4c689d3e091',
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date(Date.now() - 3600000).toISOString()
    }
  ]);

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyLabelInput, setKeyLabelInput] = useState('');
  const [testImageInput, setTestImageInput] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
  const [testCaptionInput, setTestCaptionInput] = useState('Exciting launch event announcement! 🚀 #SocialSpree #SaaS');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Check if user is eligible (Agency, Influencer/Pro, or System Mode enabled)
  const isEligible = 
    GLOBAL_SYSTEM_SETTINGS.agencyModeEnabled ||
    GLOBAL_SYSTEM_SETTINGS.influencerModeEnabled ||
    tenant.tierPlan === 'agency' ||
    tenant.tierPlan === 'pro';

  const openApiSchemaJson = JSON.stringify({
    openapi: "3.1.0",
    info: {
      title: "SocialSpree ChatGPT Post Scheduler API",
      description: "Allows ChatGPT Custom GPTs to schedule posts with images and captions directly to SocialSpree.",
      version: "1.0.0"
    },
    servers: [
      { url: "https://api.socialspree.io/v1" }
    ],
    paths: {
      "/chatgpt/schedule": {
        post: {
          summary: "Schedule Post via ChatGPT",
          operationId: "schedulePostFromChatGPT",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    imageUrl: { type: "string", description: "Public HTTPS URL of image asset" },
                    caption: { type: "string", description: "Post content and hashtags" },
                    scheduledAt: { type: "string", description: "ISO 8601 Timestamp for scheduled post" },
                    targetChannels: { 
                      type: "array", 
                      items: { type: "string" }, 
                      description: "Target platforms e.g. ['instagram', 'linkedin', 'x']" 
                    }
                  },
                  required: ["imageUrl", "caption"]
                }
              }
            }
          },
          responses: {
            "200": {
              description: "Post scheduled successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string" },
                      postId: { type: "string" },
                      scheduledAt: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, null, 2);

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyLabelInput.trim()) return;

    const newKey: ChatGPTKeyConfig = {
      id: `gpt-key-${Date.now()}`,
      tenantId: tenant.id,
      keyLabel: keyLabelInput.trim(),
      apiKey: `spree_gpt_live_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`,
      createdAt: new Date().toISOString()
    };

    setKeys(prev => [newKey, ...prev]);
    setKeyLabelInput('');
    setShowCreateModal(false);
  };

  const handleDeleteKey = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  const handleCopyKey = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(openApiSchemaJson);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const handleTestConnectorCall = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      setTestResult(`✅ ChatGPT Connector Webhook Triggered Successfully! Post ID: spree_post_${Date.now().toString().slice(-6)} scheduled for Zernio dispatch.`);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-purple-950 text-white p-6 rounded-2xl border border-emerald-800/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">ChatGPT Custom GPT Scheduling Connector</h2>
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                PREMIUM & AGENCY EXCLUSIVE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Connect OpenAI ChatGPT directly to your SocialSpree account. Instruct ChatGPT to write captions, analyze images, and schedule social posts via API.
            </p>
          </div>
        </div>

        {isEligible && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Generate ChatGPT API Key</span>
          </button>
        )}
      </div>

      {/* Plan Tier Eligibility Notice */}
      {!isEligible ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>ChatGPT Connector Restricted to Premium, Influencer, & Agency Plans</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            The ChatGPT Scheduling Connector API is available exclusively on <strong>Pro Agency</strong>, <strong>Influencer Creator</strong>, and <strong>Enterprise</strong> tiers. Please upgrade your subscription plan or contact your Super Admin to unlock ChatGPT API integration.
          </p>
        </div>
      ) : (
        <>
          {/* Active API Keys List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <span>ChatGPT Action Secret API Keys</span>
                </h3>
                <p className="text-xs text-slate-500">Provide this API key under Custom GPT Authentication headers in OpenAI</p>
              </div>
            </div>

            <div className="space-y-3">
              {keys.map((k) => (
                <div key={k.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{k.keyLabel}</div>
                    <div className="font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 mt-1 inline-block">
                      {k.apiKey}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Created: {new Date(k.createdAt).toLocaleDateString()} {k.lastUsedAt && `| Last used: ${new Date(k.lastUsedAt).toLocaleTimeString()}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyKey(k.id, k.apiKey)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-slate-700 flex items-center gap-1.5"
                    >
                      {copiedKeyId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copiedKeyId === k.id ? 'Copied' : 'Copy Key'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Revoke Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Webhook Simulator Test Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="w-4 h-4 text-purple-600" />
              <span>Simulate ChatGPT Webhook Payload Test</span>
            </h3>

            <form onSubmit={handleTestConnectorCall} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Image Asset URL (Public HTTPS)</label>
                  <input
                    type="url"
                    required
                    value={testImageInput}
                    onChange={(e) => setTestImageInput(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Post Caption & Hashtags</label>
                  <input
                    type="text"
                    required
                    value={testCaptionInput}
                    onChange={(e) => setTestCaptionInput(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-xs"
                  />
                </div>
              </div>

              {testResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold font-mono animate-in fade-in">
                  {testResult}
                </div>
              )}

              <button
                type="submit"
                disabled={isTesting}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>{isTesting ? 'Dispatching Webhook...' : 'Test ChatGPT Post Dispatch'}</span>
              </button>
            </form>
          </div>

          {/* OpenAPI Action Schema Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span>OpenAI Custom GPT Action Schema</span>
                </h3>
                <p className="text-xs text-slate-500">Paste this OpenAPI 3.1 schema into OpenAI GPT Builder actions tab</p>
              </div>

              <button
                onClick={handleCopySchema}
                className="px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                <span>{copiedSchema ? 'Schema Copied' : 'Copy OpenAPI Schema'}</span>
              </button>
            </div>

            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
              {openApiSchemaJson}
            </pre>
          </div>
        </>
      )}

      {/* CREATE API KEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                <span>Generate ChatGPT Action Key</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Description / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My ChatGPT Agent Key"
                  value={keyLabelInput}
                  onChange={(e) => setKeyLabelInput(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg shadow-md">
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
