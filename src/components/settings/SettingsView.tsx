import React, { useState } from 'react';
import { Tenant, CloudinaryConfig, CloudinaryAccountItem } from '../../types';
import { 
  GLOBAL_DEFAULT_CLOUDINARY, 
  GLOBAL_CLOUDINARY_POOL 
} from '../../lib/store';
import { 
  Settings, 
  HardDrive, 
  Cloud, 
  Key, 
  Building2, 
  Save, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Share2,
  Plus,
  Trash2,
  Edit2,
  CheckCircle
} from 'lucide-react';

interface SettingsViewProps {
  tenant: Tenant;
  onUpdateTenantCloudinary: (tenantId: string, config: CloudinaryConfig) => void;
  onUpdateTenantProfile: (tenantId: string, name: string, ownerEmail: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  tenant,
  onUpdateTenantCloudinary,
  onUpdateTenantProfile
}) => {
  const [activeTab, setActiveTab] = useState<'storage' | 'api' | 'social_keys' | 'org'>('storage');

  // Cloudinary Local State (Multiple Accounts with 3 Fields: Cloud Name, Upload Preset, Bucket Name)
  const cldConfig = tenant.cloudinaryConfig || GLOBAL_DEFAULT_CLOUDINARY;
  const [cldUseDefault, setCldUseDefault] = useState(cldConfig.useSuperAdminDefault);
  const [cldAccounts, setCldAccounts] = useState<CloudinaryAccountItem[]>(
    cldConfig.accounts && cldConfig.accounts.length > 0 ? cldConfig.accounts : GLOBAL_CLOUDINARY_POOL
  );

  // Modal State for Adding/Editing Cloudinary Account
  const [showCldModal, setShowCldModal] = useState(false);
  const [editingCldId, setEditingCldId] = useState<string | null>(null);
  const [cldLabelInput, setCldLabelInput] = useState('');
  const [cldCloudNameInput, setCldCloudNameInput] = useState('');
  const [cldUploadPresetInput, setCldUploadPresetInput] = useState('');
  const [cldBucketNameInput, setCldBucketNameInput] = useState('');

  // Profile Local State
  const [orgName, setOrgName] = useState(tenant.name);
  const [ownerEmail, setOwnerEmail] = useState(tenant.ownerEmail);

  // Social API Keys State (Simulated credentials)
  const [metaAppId, setMetaAppId] = useState('meta_app_99182049182');
  const [metaAppSecret, setMetaAppSecret] = useState('••••••••••••••••••••••••');
  const [linkedInClientId, setLinkedInClientId] = useState('li_client_8830192');
  const [youtubeApiKey, setYoutubeApiKey] = useState('AIzaSyD994182901823901283');

  const [notification, setNotification] = useState<string | null>(null);

  const handleOpenAddCldModal = () => {
    setEditingCldId(null);
    setCldLabelInput('Secondary Media CDN');
    setCldCloudNameInput('djmww1dwr');
    setCldUploadPresetInput('ml_default');
    setCldBucketNameInput('socialspree-media-vault');
    setShowCldModal(true);
  };

  const handleOpenEditCldModal = (item: CloudinaryAccountItem) => {
    setEditingCldId(item.id);
    setCldLabelInput(item.label || 'Cloudinary Account');
    setCldCloudNameInput(item.cloudName);
    setCldUploadPresetInput(item.uploadPreset);
    setCldBucketNameInput(item.bucketName || 'socialspree-media-vault');
    setShowCldModal(true);
  };

  const handleSaveCldAccountModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cldCloudNameInput.trim() || !cldUploadPresetInput.trim()) return;

    let updated: CloudinaryAccountItem[];
    if (editingCldId) {
      updated = cldAccounts.map(acc => {
        if (acc.id === editingCldId) {
          return {
            ...acc,
            label: cldLabelInput.trim() || 'Cloudinary Account',
            cloudName: cldCloudNameInput.trim(),
            uploadPreset: cldUploadPresetInput.trim(),
            bucketName: cldBucketNameInput.trim() || 'socialspree-media-vault'
          };
        }
        return acc;
      });
    } else {
      const newAcc: CloudinaryAccountItem = {
        id: `cld-acc-${Date.now()}`,
        label: cldLabelInput.trim() || `Cloudinary Account ${cldAccounts.length + 1}`,
        cloudName: cldCloudNameInput.trim(),
        uploadPreset: cldUploadPresetInput.trim(),
        bucketName: cldBucketNameInput.trim() || 'socialspree-media-vault',
        isActiveDefault: cldAccounts.length === 0
      };
      updated = [...cldAccounts, newAcc];
    }

    setCldAccounts(updated);
    setShowCldModal(false);

    // Save immediately to parent handler
    const activeAcc = updated.find(a => a.isActiveDefault) || updated[0];
    onUpdateTenantCloudinary(tenant.id, {
      cloudName: activeAcc.cloudName,
      uploadPreset: activeAcc.uploadPreset,
      bucketName: activeAcc.bucketName,
      useSuperAdminDefault: cldUseDefault,
      selectedDefaultAccountId: activeAcc.id,
      accounts: updated
    });
  };

  const handleSelectActiveCldAccount = (accId: string) => {
    const updated = cldAccounts.map(acc => ({
      ...acc,
      isActiveDefault: acc.id === accId
    }));
    setCldAccounts(updated);

    const activeAcc = updated.find(a => a.id === accId) || updated[0];
    onUpdateTenantCloudinary(tenant.id, {
      cloudName: activeAcc.cloudName,
      uploadPreset: activeAcc.uploadPreset,
      bucketName: activeAcc.bucketName,
      useSuperAdminDefault: cldUseDefault,
      selectedDefaultAccountId: activeAcc.id,
      accounts: updated
    });
  };

  const handleDeleteCldAccount = (accId: string) => {
    if (cldAccounts.length <= 1) return; // Keep at least 1 account
    const updated = cldAccounts.filter(a => a.id !== accId);
    if (!updated.some(a => a.isActiveDefault)) {
      updated[0].isActiveDefault = true;
    }
    setCldAccounts(updated);

    const activeAcc = updated.find(a => a.isActiveDefault) || updated[0];
    onUpdateTenantCloudinary(tenant.id, {
      cloudName: activeAcc.cloudName,
      uploadPreset: activeAcc.uploadPreset,
      bucketName: activeAcc.bucketName,
      useSuperAdminDefault: cldUseDefault,
      selectedDefaultAccountId: activeAcc.id,
      accounts: updated
    });
  };

  const handleSaveStorage = (e: React.FormEvent) => {
    e.preventDefault();

    const activeAcc = cldAccounts.find(a => a.isActiveDefault) || cldAccounts[0];

    const updatedCld: CloudinaryConfig = {
      cloudName: activeAcc ? activeAcc.cloudName : GLOBAL_DEFAULT_CLOUDINARY.cloudName,
      uploadPreset: activeAcc ? activeAcc.uploadPreset : GLOBAL_DEFAULT_CLOUDINARY.uploadPreset,
      bucketName: activeAcc ? activeAcc.bucketName : GLOBAL_DEFAULT_CLOUDINARY.bucketName,
      useSuperAdminDefault: cldUseDefault,
      selectedDefaultAccountId: activeAcc ? activeAcc.id : undefined,
      accounts: cldAccounts
    };

    onUpdateTenantCloudinary(tenant.id, updatedCld);

    setNotification('Cloudinary Storage Settings Saved Successfully!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenantProfile(tenant.id, orgName.trim(), ownerEmail.trim());
    setNotification('Organization Profile Saved Successfully!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveDeveloperKeys = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification('Social API Developer Keys Saved Successfully!');
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#5D3FD3]" />
            <span>Organization & Storage Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure Media CDN buckets, Cloudinary accounts, API key authentication, and developer keys.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500">Plan Tier:</span>
          <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-lg uppercase border border-purple-200">
            {tenant.tierPlan} ({tenant.allocatedApiSlots || 2} Slots)
          </span>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 flex items-center gap-2 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Vertical Sub-Nav Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab('storage')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === 'storage'
                ? 'bg-[#5D3FD3] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Media Storage & CDN</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === 'api'
                ? 'bg-[#5D3FD3] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API & Publishing Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('social_keys')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === 'social_keys'
                ? 'bg-[#5D3FD3] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Social API Developer Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('org')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left ${
              activeTab === 'org'
                ? 'bg-[#5D3FD3] text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Organization Profile</span>
          </button>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          
          {/* TAB 1: MEDIA CDN & STORAGE (MULTI-CLOUDINARY) */}
          {activeTab === 'storage' && (
            <form onSubmit={handleSaveStorage} className="space-y-6">

              {/* MULTI-CLOUDINARY ACCOUNTS MANAGER */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-blue-600" />
                      <span>Cloudinary Media CDN (Manage Multiple Accounts)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Add and switch between multiple Cloudinary accounts using <strong>Cloud Name</strong>, <strong>Unsigned Upload Preset</strong>, and <strong>Storage Bucket Name</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddCldModal}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Cloudinary Account</span>
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {/* Account Selection Radio List */}
                  <div className="space-y-3">
                    {cldAccounts.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.isActiveDefault
                            ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="active_cld_acc"
                            checked={item.isActiveDefault}
                            onChange={() => handleSelectActiveCldAccount(item.id)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{item.label || 'Cloudinary Account'}</span>
                              {item.isActiveDefault && (
                                <span className="bg-blue-600 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                                  Active for Uploads
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 font-mono mt-0.5 space-x-3">
                              <span>Cloud Name: <strong>{item.cloudName}</strong></span>
                              <span>Preset: <strong>{item.uploadPreset}</strong></span>
                              <span>Bucket: <strong>{item.bucketName || 'socialspree-media-vault'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCldModal(item)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          {cldAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCldAccount(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5D3FD3] text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Storage Settings</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: API & PUBLISHING KEYS */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#5D3FD3]" />
                  <span>Primary Organization API Credentials</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Master API Secret allocated by Super Admin to your tenant organization.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-700">Publishing credentials</label>
                <div className="rounded-lg border bg-white p-3 font-mono text-xs font-bold text-slate-700">
                  •••••••••••••••••••••••• &nbsp; Server-managed
                </div>
                <p className="text-[11px] text-slate-500">Credentials are encrypted and resolved only by Supabase Edge Functions. They cannot be viewed or copied in the browser.</p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1 font-mono">
                <div className="font-bold">⚡ Parallel Slot Allocation Details:</div>
                <div>Allocated API Slots: <strong>{tenant.allocatedApiSlots || 2} Slots</strong></div>
                <div>Max Parallel Channels: <strong>{(tenant.allocatedApiSlots || 2) * 2} Social Accounts</strong></div>
              </div>
            </div>
          )}

          {/* TAB 3: SOCIAL API DEVELOPER KEYS */}
          {activeTab === 'social_keys' && (
            <form onSubmit={handleSaveDeveloperKeys} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[#5D3FD3]" />
                  <span>Social Platform Developer App Credentials</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Optional custom OAuth Client IDs and App Secrets for Meta, LinkedIn, and YouTube.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meta App ID (Facebook & Instagram)</label>
                  <input
                    type="text"
                    value={metaAppId}
                    onChange={(e) => setMetaAppId(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meta App Secret</label>
                  <input
                    type="password"
                    value={metaAppSecret}
                    onChange={(e) => setMetaAppSecret(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">LinkedIn Client ID</label>
                  <input
                    type="text"
                    value={linkedInClientId}
                    onChange={(e) => setLinkedInClientId(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">YouTube Data API Key</label>
                  <input
                    type="text"
                    value={youtubeApiKey}
                    onChange={(e) => setYoutubeApiKey(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5D3FD3] text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Developer Keys</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: ORGANIZATION PROFILE */}
          {activeTab === 'org' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#5D3FD3]" />
                  <span>Organization Profile & Settings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage organization title and primary owner email.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Organization / Brand Title</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Owner Email</label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5D3FD3] text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile Settings</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* MODAL FOR ADDING/EDITING CLOUDINARY ACCOUNT */}
      {showCldModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCldId ? 'Edit Cloudinary Account' : 'Add Cloudinary Account'}
              </h3>
              <button onClick={() => setShowCldModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveCldAccountModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Label / Title</label>
                <input
                  type="text"
                  required
                  value={cldLabelInput}
                  onChange={(e) => setCldLabelInput(e.target.value)}
                  placeholder="e.g. Primary Master CDN"
                  className="w-full p-2.5 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cloudinary Cloud Name</label>
                <input
                  type="text"
                  required
                  value={cldCloudNameInput}
                  onChange={(e) => setCldCloudNameInput(e.target.value)}
                  placeholder="e.g. djmww1dwr"
                  className="w-full p-2.5 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-[10px] text-slate-400 mt-0.5">Found on your main Cloudinary Dashboard overview.</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unsigned Upload Preset (Direct Uploads)</label>
                <input
                  type="text"
                  required
                  value={cldUploadPresetInput}
                  onChange={(e) => setCldUploadPresetInput(e.target.value)}
                  placeholder="e.g. ml_default"
                  className="w-full p-2.5 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-[10px] text-slate-400 mt-0.5">Enables direct browser-to-Cloudinary streaming.</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Storage Bucket Name</label>
                <input
                  type="text"
                  required
                  value={cldBucketNameInput}
                  onChange={(e) => setCldBucketNameInput(e.target.value)}
                  placeholder="e.g. socialspree-media-vault"
                  className="w-full p-2.5 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCldModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Cloudinary Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
