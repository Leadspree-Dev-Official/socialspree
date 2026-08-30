import React, { useState, useEffect } from 'react';
import { Tenant, CloudinaryConfig, CloudinaryAccountItem } from '../../types';
import { uploadToMediaVault } from '../../lib/media';
import { InvoicesPanel } from './InvoicesPanel';
import { auth, type Profile } from '../../lib/api';
import { supabase } from '../../lib/supabase';
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
  CheckCircle,
  User,
  Camera,
  Lock,
  Bell,
  Globe,
  AlertCircle,
  Bot,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Palette,
  Sun,
  Moon,
  Laptop,
  Receipt,
} from 'lucide-react';
import { ChatGPTConnectorSettings } from './ChatGPTConnectorSettings';
import { ThemeToggle } from '../layout/ThemeToggle';

interface SettingsViewProps {
  tenant: Tenant;
  userProfile?: Profile | null;
  onUpdateUserProfile?: (updated: Profile) => void;
  onUpdateTenantCloudinary: (tenantId: string, config: CloudinaryConfig) => void;
  onUpdateTenantProfile: (tenantId: string, name: string, ownerEmail: string) => void;
  initialTab?: 'user' | 'storage' | 'api' | 'social_keys' | 'org' | 'chatgpt';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  tenant,
  userProfile,
  onUpdateUserProfile,
  onUpdateTenantCloudinary,
  onUpdateTenantProfile,
  initialTab = 'user'
}) => {
  const [activeTab, setActiveTab] = useState<'user' | 'storage' | 'api' | 'social_keys' | 'org' | 'invoices' | 'chatgpt'>(initialTab);

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

  // Tenant Organization Local State
  const [orgName, setOrgName] = useState(tenant.name);
  const [ownerEmail, setOwnerEmail] = useState(tenant.ownerEmail);

  // User Profile Local State
  const [fullName, setFullName] = useState(() => {
    return userProfile?.fullName || tenant.ownerEmail.split('@')[0] || 'User';
  });
  const [userEmail, setUserEmail] = useState(() => {
    return userProfile?.email || tenant.ownerEmail;
  });
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return userProfile?.avatarUrl || '';
  });
  const [jobTitle, setJobTitle] = useState(() => {
    return userProfile?.jobTitle || 'Social Media Manager';
  });
  const [timezone, setTimezone] = useState(() => {
    return userProfile?.timezone || 'UTC';
  });

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordUpdating, setPasswordUpdating] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [notifications, setNotifications] = useState(() => {
    return userProfile?.notifications || {
      emailDigest: true,
      postFailureAlerts: true,
      securityAlerts: true,
    };
  });

  // Sync state when userProfile prop updates
  useEffect(() => {
    if (userProfile?.fullName) setFullName(userProfile.fullName);
    if (userProfile?.email) setUserEmail(userProfile.email);
    if (userProfile?.avatarUrl !== undefined) setAvatarUrl(userProfile.avatarUrl || '');
    if (userProfile?.jobTitle) setJobTitle(userProfile.jobTitle);
    if (userProfile?.timezone) setTimezone(userProfile.timezone);
    if (userProfile?.notifications) setNotifications(userProfile.notifications);
  }, [userProfile]);

  // Profile Save State
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

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

  const handleSaveDeveloperKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (metaAppSecret && metaAppSecret !== '••••••••••••••••••••••••') {
        await supabase.functions.invoke('manage-credentials', {
          body: {
            tenantId: tenant.id,
            provider: 'facebook',
            label: 'meta-app-secret',
            secret: metaAppSecret.trim()
          }
        });
      }
      localStorage.setItem(`dev_keys_${tenant.id}`, JSON.stringify({
        metaAppId: metaAppId.trim(),
        linkedInClientId: linkedInClientId.trim(),
        youtubeApiKey: youtubeApiKey.trim()
      }));
      setNotification('Social API Developer Keys Saved Securely!');
    } catch {
      setNotification('Failed to save developer keys.');
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (!newPassword) {
      setPasswordStatus({ type: 'error', message: 'Please enter a new password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setPasswordUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordStatus({ type: 'error', message: error.message || 'Failed to update password.' });
      } else {
        setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'An error occurred while updating password.' });
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleSaveUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const activeEmail = userProfile?.email || userEmail || tenant.ownerEmail || '';
      const updated = await auth.updateProfile({
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim(),
        jobTitle: jobTitle.trim(),
        timezone,
        notifications
      }, activeEmail, userProfile || undefined);

      if (onUpdateUserProfile) {
        onUpdateUserProfile(updated);
      }
      setNotification('User Profile & Personal Preferences Saved Successfully!');
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Failed to update user profile:', err);
      setNotification('Failed to update user profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setAvatarUploading(true);
    setNotification(null);

    // Show the picked file immediately while the upload runs. A data: URL only
    // exists in this browser, so it is a preview and never the stored avatar.
    const localPreview = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve((event.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
    if (localPreview) setAvatarUrl(localPreview);

    let finalAvatarUrl = '';

    try {
      const asset = await uploadToMediaVault(file, {
        subfolder: 'avatars',
        fallback: {
          cloudName: tenant.cloudinaryConfig?.cloudName || GLOBAL_DEFAULT_CLOUDINARY.cloudName,
          uploadPreset: tenant.cloudinaryConfig?.uploadPreset || GLOBAL_DEFAULT_CLOUDINARY.uploadPreset
        }
      });
      finalAvatarUrl = asset.secureUrl;
    } catch (err) {
      console.error('Avatar upload failed:', err);
    }

    if (finalAvatarUrl) {
      setAvatarUrl(finalAvatarUrl);
      try {
        const activeEmail = userProfile?.email || userEmail || tenant.ownerEmail || '';
        const updated = await auth.updateProfile({
          avatarUrl: finalAvatarUrl,
          fullName: fullName.trim()
        }, activeEmail, userProfile || undefined);

        if (onUpdateUserProfile) {
          onUpdateUserProfile(updated);
        }
        setNotification('✅ Profile Photo Uploaded & Saved Successfully!');
      } catch (err) {
        console.error('Error saving avatar to profile:', err);
        setNotification('✅ Profile photo updated.');
      }
    } else {
      setNotification('Photo upload failed. The image was not saved — check your connection and try again.');
    }

    setAvatarUploading(false);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl('');
    try {
      const activeEmail = userProfile?.email || userEmail || tenant.ownerEmail || '';
      const updated = await auth.updateProfile({ avatarUrl: '' }, activeEmail, userProfile || undefined);
      if (onUpdateUserProfile) {
        onUpdateUserProfile(updated);
      }
      setNotification('Profile Photo Removed.');
    } catch {
      setNotification('Profile Photo Cleared.');
    }
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
            <span>Organization & Storage Settings</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure Media CDN buckets, Cloudinary accounts, API key authentication, and developer keys.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500 dark:text-slate-400">Plan Tier:</span>
          <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 font-bold px-2.5 py-1 rounded-lg uppercase border border-purple-200 dark:border-purple-800">
            {tenant.tierPlan} ({tenant.allocatedApiSlots || 2} Slots)
          </span>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Vertical Sub-Nav Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab('user')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'user'
                ? 'bg-[#5D3FD3] text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>User Profile & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'storage'
                ? 'bg-[#5D3FD3] text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Media Storage & CDN</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'api'
                ? 'bg-[#5D3FD3] text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API & Publishing Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('social_keys')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'social_keys'
                ? 'bg-[#5D3FD3] text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Social API Developer Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('org')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'org'
                ? 'bg-[#5D3FD3] text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Organization Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-[#5D3FD3] text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab('chatgpt')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'chatgpt'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ChatGPT Action Connector</span>
            </div>
            <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-200 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">NEW</span>
          </button>
        </div>

        {/* Right Content Panel */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          
          {activeTab === 'invoices' && <InvoicesPanel />}

          {activeTab === 'chatgpt' && (
            <ChatGPTConnectorSettings tenant={tenant} />
          )}

          {/* TAB 0: USER PROFILE, PHOTO & PASSWORD */}
          {activeTab === 'user' && (
            <div className="space-y-8">
              {/* Profile Photo Uploader Section */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                    <span>Profile Photo & Avatar</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload a high-resolution profile photo to personalize your account across SocialSpree.
                  </p>
                </div>

                <div className="flex items-center gap-5 pt-2">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 dark:from-purple-950/60 dark:to-indigo-950/60 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 overflow-hidden shadow-sm">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <label className={`px-4 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors shadow-sm flex items-center gap-2 ${avatarUploading ? 'opacity-60 pointer-events-none' : ''}`}>
                        {avatarUploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Uploading to Cloud...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4" />
                            <span>Upload Photo</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={avatarUploading}
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-xl font-semibold text-xs transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Supports PNG, JPG, GIF or WEBP up to 5MB. Photo will be synchronized across header navigation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Personal Details Form */}
              <form onSubmit={handleSaveUserProfile} className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                    <span>Personal Details & Preferences</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage your display name, title, contact details, and default timezone.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aniruddha Das"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-xs focus:ring-2 focus:ring-[#5D3FD3]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={userEmail}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Primary account email used for authentication.</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Title / Role</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Lead Social Strategist"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-xs focus:ring-2 focus:ring-[#5D3FD3]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Default Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-[#5D3FD3] bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="UTC" className="dark:bg-slate-800">UTC (Coordinated Universal Time)</option>
                      <option value="Asia/Kolkata" className="dark:bg-slate-800">Asia/Kolkata (IST +05:30)</option>
                      <option value="America/New_York" className="dark:bg-slate-800">America/New_York (EST/EDT)</option>
                      <option value="America/Los_Angeles" className="dark:bg-slate-800">America/Los_Angeles (PST/PDT)</option>
                      <option value="Europe/London" className="dark:bg-slate-800">Europe/London (GMT/BST)</option>
                      <option value="Europe/Paris" className="dark:bg-slate-800">Europe/Paris (CET/CEST)</option>
                      <option value="Asia/Tokyo" className="dark:bg-slate-800">Asia/Tokyo (JST +09:00)</option>
                    </select>
                  </div>
                </div>

                {/* Appearance / Theme Selector Section */}
                <div className="pt-3 space-y-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Interface Theme & Appearance</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Choose between Light, Dark, or automatic System theme preference across all pages and views.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Active Theme Mode</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Settings persist automatically across browser sessions.</div>
                    </div>

                    <ThemeToggle variant="segmented" />
                  </div>
                </div>

                {/* Notifications Preferences */}
                <div className="pt-3 space-y-3">
                  <label className="block font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Notification Preferences</span>
                  </label>

                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.emailDigest}
                        onChange={(e) => setNotifications({ ...notifications, emailDigest: e.target.checked })}
                        className="w-4 h-4 text-[#5D3FD3] rounded"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Weekly Performance Digest Email</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive weekly summary reports of engagement, post reach, and AI usage.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <input
                        type="checkbox"
                        checked={notifications.postFailureAlerts}
                        onChange={(e) => setNotifications({ ...notifications, postFailureAlerts: e.target.checked })}
                        className="w-4 h-4 text-[#5D3FD3] rounded"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Post Publishing Failure Alerts</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Get instant alerts if a scheduled post fails due to token expiry or network glitch.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer pt-1 border-t border-slate-200/60 dark:border-slate-800">
                      <input
                        type="checkbox"
                        checked={notifications.securityAlerts}
                        onChange={(e) => setNotifications({ ...notifications, securityAlerts: e.target.checked })}
                        className="w-4 h-4 text-[#5D3FD3] rounded"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Security & Password Alerts</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive notifications when your account settings or password are modified.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>

              {/* Native Supabase Account Security / Change Password */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span>Change Account Password</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Update your SocialSpree account password directly via Supabase Auth.
                  </p>
                </div>

                {passwordStatus && (
                  <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    passwordStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}>
                    {passwordStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    )}
                    <span>{passwordStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs max-w-lg">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:border-[#5D3FD3] outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Confirm your new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full pl-3 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl text-xs focus:ring-2 focus:ring-[#5D3FD3] focus:border-[#5D3FD3] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordUpdating}
                      className="px-5 py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {passwordUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {activeTab === 'storage' && (
            <form onSubmit={handleSaveStorage} className="space-y-6">

              {/* MULTI-CLOUDINARY ACCOUNTS MANAGER */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>Cloudinary Media CDN (Manage Multiple Accounts)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Add and switch between multiple Cloudinary accounts using <strong>Cloud Name</strong>, <strong>Unsigned Upload Preset</strong>, and <strong>Storage Bucket Name</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddCldModal}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
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
                            ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
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
                              <span className="font-bold text-slate-900 dark:text-white text-xs">{item.label || 'Cloudinary Account'}</span>
                              {item.isActiveDefault && (
                                <span className="bg-blue-600 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                                  Active for Uploads
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5 space-x-3">
                              <span>Cloud Name: <strong className="text-slate-900 dark:text-slate-200">{item.cloudName}</strong></span>
                              <span>Preset: <strong className="text-slate-900 dark:text-slate-200">{item.uploadPreset}</strong></span>
                              <span>Bucket: <strong className="text-slate-900 dark:text-slate-200">{item.bucketName || 'socialspree-media-vault'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCldModal(item)}
                            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          {cldAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCldAccount(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
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

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-2 cursor-pointer"
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
                <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Key className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                  <span>Primary Organization API Credentials</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Master API Secret allocated by Super Admin to your tenant organization.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Publishing credentials</label>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  •••••••••••••••••••••••• &nbsp; Server-managed
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Credentials are encrypted and resolved only by Supabase Edge Functions. They cannot be viewed or copied in the browser.</p>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-xs text-purple-900 dark:text-purple-300 space-y-1 font-mono">
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
                <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                  <span>Social Platform Developer App Credentials</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Optional custom OAuth Client IDs and App Secrets for Meta, LinkedIn, and YouTube.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Meta App ID (Facebook & Instagram)</label>
                  <input
                    type="text"
                    value={metaAppId}
                    onChange={(e) => setMetaAppId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs rounded-lg focus:ring-2 focus:ring-[#5D3FD3]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Meta App Secret</label>
                  <input
                    type="password"
                    value={metaAppSecret}
                    onChange={(e) => setMetaAppSecret(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs rounded-lg focus:ring-2 focus:ring-[#5D3FD3]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">LinkedIn Client ID</label>
                  <input
                    type="text"
                    value={linkedInClientId}
                    onChange={(e) => setLinkedInClientId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs rounded-lg focus:ring-2 focus:ring-[#5D3FD3]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">YouTube Data API Key</label>
                  <input
                    type="text"
                    value={youtubeApiKey}
                    onChange={(e) => setYoutubeApiKey(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs rounded-lg focus:ring-2 focus:ring-[#5D3FD3]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-2 cursor-pointer"
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
                <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                  <span>Organization Profile & Settings</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage organization title and primary owner email.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Organization / Brand Title</label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-[#5D3FD3]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Owner Email</label>
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs rounded-lg focus:ring-2 focus:ring-[#5D3FD3]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-2 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingCldId ? 'Edit Cloudinary Account' : 'Add Cloudinary Account'}
              </h3>
              <button onClick={() => setShowCldModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveCldAccountModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Label / Title</label>
                <input
                  type="text"
                  required
                  value={cldLabelInput}
                  onChange={(e) => setCldLabelInput(e.target.value)}
                  placeholder="e.g. Primary Master CDN"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cloudinary Cloud Name</label>
                <input
                  type="text"
                  required
                  value={cldCloudNameInput}
                  onChange={(e) => setCldCloudNameInput(e.target.value)}
                  placeholder="e.g. djmww1dwr"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Found on your main Cloudinary Dashboard overview.</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Unsigned Upload Preset (Direct Uploads)</label>
                <input
                  type="text"
                  required
                  value={cldUploadPresetInput}
                  onChange={(e) => setCldUploadPresetInput(e.target.value)}
                  placeholder="e.g. ml_default"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Enables direct browser-to-Cloudinary streaming.</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Storage Bucket Name</label>
                <input
                  type="text"
                  required
                  value={cldBucketNameInput}
                  onChange={(e) => setCldBucketNameInput(e.target.value)}
                  placeholder="e.g. socialspree-media-vault"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCldModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
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
