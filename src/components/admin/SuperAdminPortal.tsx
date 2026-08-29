import React, { useState, useEffect } from 'react';
import { Tenant, CloudinaryConfig, CloudinaryAccountItem, SubscriptionPlan, CurrencyCode, SystemSettings, ApiAllocationSlot, AiCreditLog, EngineProvider, EngineChoice } from '../../types';
import { 
  SUPER_ADMIN_EMAIL, 
  GLOBAL_DEFAULT_CLOUDINARY, 
  GLOBAL_CLOUDINARY_POOL, 
  INITIAL_PLANS, 
  GLOBAL_SYSTEM_SETTINGS,
  getStoredPlans,
  getStoredSystemSettings,
  getStoredCloudinaryPool,
  saveStoredCloudinaryPool
} from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { plans as cloudPlans } from '../../lib/api';
import { PendingPaymentsQueue } from './PendingPaymentsQueue';

import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Crown, 
  Zap, 
  Sliders, 
  Building2, 
  Key, 
  Check, 
  X,
  Cloud,
  Search,
  Settings,
  Star,
  Edit2,
  HardDrive,
  LayoutDashboard,
  CreditCard,
  Package,
  Layers,
  Globe,
  Save,
  CheckCircle2,
  Minus,
  RefreshCw,
  Eye,
  EyeOff,
  Coins,
  Calendar,
  AlertCircle,
  Clock,
  DollarSign,
  Sparkles,
  History,
  Wand2,
  Cpu,
  MessageSquareCode,
  ArrowLeft
} from 'lucide-react';

export type SuperAdminSubTab = 'dashboard' | 'subscriptions' | 'payments' | 'plans' | 'api_allocation' | 'media' | 'settings' | 'ai_credits' | 'privileges';

interface SuperAdminPortalProps {
  tenants: Tenant[];
  aiLogs?: AiCreditLog[];
  onAddTenant: (tenant: Omit<Tenant, 'id' | 'createdAt'>) => void;
  onDeleteTenant: (tenantId: string) => void;
  onUpdateTenantTier: (tenantId: string, tier: 'free' | 'pro' | 'agency') => void;
  onUpdateTenantLimit: (tenantId: string, limit: number) => void;
  onUpdateTenantApiKey: (tenantId: string, newApiKey: string) => void;
  onUpdateTenantCloudinary: (tenantId: string, config: CloudinaryConfig) => void;
  onUpdateTenantApiSlots?: (tenantId: string, slotsCount: number) => void;
  onUpdateTenantApiSlotDetails?: (tenantId: string, slots: ApiAllocationSlot[]) => void;
  onToggleTenantStatus?: (tenantId: string) => void;
  onUpdateTenantPaymentStatus?: (tenantId: string, paymentStatus: 'paid' | 'unpaid' | 'overdue' | 'trial') => void;
  onUpdateTenantRenewalDate?: (tenantId: string, renewalDate: string) => void;
  onUpdateTenantPlan?: (tenantId: string, planId: string) => void;
  onTopupAiCredits?: (tenantId: string, amount: number, description: string) => void;
  onUpdateSystemSettings?: (settings: SystemSettings) => void;
  activeSubTab: SuperAdminSubTab;
  onSelectSubTab: (subTab: SuperAdminSubTab) => void;
  onReturnToWorkspace?: () => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  tenants,
  aiLogs = [],
  onAddTenant,
  onDeleteTenant,
  onUpdateTenantTier,
  onUpdateTenantLimit,
  onUpdateTenantApiKey,
  onUpdateTenantCloudinary,
  onUpdateTenantApiSlots,
  onUpdateTenantApiSlotDetails,
  onToggleTenantStatus,
  onUpdateTenantPaymentStatus,
  onUpdateTenantRenewalDate,
  onUpdateTenantPlan,
  onTopupAiCredits,
  onUpdateSystemSettings,
  activeSubTab,
  onSelectSubTab,
  onReturnToWorkspace,
}) => {
  const initialSettings = getStoredSystemSettings();

  // System Settings State & 4 Server Mode Toggles
  const [systemCurrency, setSystemCurrency] = useState<CurrencyCode>(initialSettings.currency);
  const [currencySymbol, setCurrencySymbol] = useState<string>(initialSettings.currencySymbol);
  const [platformName, setPlatformName] = useState<string>(initialSettings.platformName);
  const [supportEmail, setSupportEmail] = useState<string>(initialSettings.supportEmail);
  const [aiApiKeyInput, setAiApiKeyInput] = useState<string>(initialSettings.aiApiKey || '');
  const [defaultCreditsInput, setDefaultCreditsInput] = useState<number>(initialSettings.defaultAiCredits || 1000);

  // 4 Primary Server Mode Controls
  const [websiteEnabled, setWebsiteEnabled] = useState<boolean>(initialSettings.websiteEnabled ?? true);
  const [agencyModeEnabled, setAgencyModeEnabled] = useState<boolean>(initialSettings.agencyModeEnabled ?? false);
  const [influencerModeEnabled, setInfluencerModeEnabled] = useState<boolean>(initialSettings.influencerModeEnabled ?? false);
  const [businessModeEnabled, setBusinessModeEnabled] = useState<boolean>(initialSettings.businessModeEnabled ?? true);
  const [aiCreditsEnabled, setAiCreditsEnabled] = useState<boolean>(initialSettings.aiCreditsEnabled ?? false);
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState<boolean>(initialSettings.voiceAssistantEnabled ?? false);
  const [automationAiEnabled, setAutomationAiEnabled] = useState<boolean>(initialSettings.automationAiEnabled ?? false);
  const [zernioEnabled, setZernioEnabled] = useState<boolean>(initialSettings.zernioEnabled ?? true);
  const [coresyncEnabled, setCoresyncEnabled] = useState<boolean>(initialSettings.coresyncEnabled ?? true);
  const [globalDispatchEngine, setGlobalDispatchEngine] = useState<EngineChoice>(initialSettings.dispatchEngine ?? 'dual');

  const [settingsNotification, setSettingsNotification] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // User Usage & Quota Inspector Modal State
  const [inspectingTenant, setInspectingTenant] = useState<Tenant | null>(null);
  const [customAccountsInput, setCustomAccountsInput] = useState<number>(0);
  const [customDailyZernioInput, setCustomDailyZernioInput] = useState<number>(0);
  const [customMonthlyZernioInput, setCustomMonthlyZernioInput] = useState<number>(0);
  const [customStorageMbInput, setCustomStorageMbInput] = useState<number>(0);

  // Global Cloudinary Pool State (Clean authentic pool)
  const [cldPool, setCldPool] = useState<CloudinaryAccountItem[]>(() => getStoredCloudinaryPool());
  const [showCldModal, setShowCldModal] = useState(false);
  const [editingCldId, setEditingCldId] = useState<string | null>(null);
  const [cldLabelInput, setCldLabelInput] = useState('');
  const [cldCloudNameInput, setCldCloudNameInput] = useState('');
  const [cldUploadPresetInput, setCldUploadPresetInput] = useState('');
  const [cldBucketNameInput, setCldBucketNameInput] = useState('');
  const [cldNotification, setCldNotification] = useState<string | null>(null);

  // Plans Management State
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => getStoredPlans());
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);

  // Plan Form State
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState(29);
  const [planCurrency, setPlanCurrency] = useState<CurrencyCode>('USD');
  const [planSlots, setPlanSlots] = useState(2);
  const [planAiCredits, setPlanAiCredits] = useState(1000);
  const [planFeatures, setPlanFeatures] = useState('');

  // AI Credit Top Up Modal State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupTenantId, setTopupTenantId] = useState<string>(tenants[0]?.id || '');
  const [topupAmount, setTopupAmount] = useState<number>(500);
  const [topupReason, setTopupReason] = useState<string>('Super Admin Monthly Bonus');

  // Provision Tenant Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [tier, setTier] = useState<'free' | 'pro' | 'agency'>('free');
  const [allocatedSlots, setAllocatedSlots] = useState(2);

  // API Slot Provisioning Modal State (Line-by-Line & Per-Provider)
  const [showAddApiModal, setShowAddApiModal] = useState(false);
  const [targetTenantId, setTargetTenantId] = useState<string>(tenants[0]?.id || '');
  const [tenantSearchQuery, setTenantSearchQuery] = useState<string>('');
  const [apiCount, setApiCount] = useState<number>(3);
  const [apiKeysInput, setApiKeysInput] = useState<string[]>(['', '', '']);
  const [apiProvidersInput, setApiProvidersInput] = useState<EngineProvider[]>(['zernio', 'zernio', 'zernio']);

  // Zernio Key Editing State
  const [editingKeySlotId, setEditingKeySlotId] = useState<string | null>(null);
  const [customZernioKey, setCustomZernioKey] = useState('');
  const [showKeyVisible, setShowKeyVisible] = useState<Record<string, boolean>>({});

  useEffect(() => { void cloudPlans.saveAll(plans); }, [plans]);

  const handleApiCountChange = (count: number) => {
    const validCount = Math.max(1, Math.min(20, count));
    setApiCount(validCount);
    setApiKeysInput(prev => {
      const next = [...prev];
      while (next.length < validCount) {
        next.push('');
      }
      return next.slice(0, validCount);
    });
    setApiProvidersInput(prev => {
      const next = [...prev];
      while (next.length < validCount) {
        next.push('zernio');
      }
      return next.slice(0, validCount);
    });
  };

  const getSymbol = (code: CurrencyCode) => {
    if (code === 'INR') return '₹';
    if (code === 'GBP') return '£';
    return '$';
  };

  const handleCurrencyChange = (code: CurrencyCode) => {
    setSystemCurrency(code);
    const sym = getSymbol(code);
    setCurrencySymbol(sym);

    GLOBAL_SYSTEM_SETTINGS.currency = code;
    GLOBAL_SYSTEM_SETTINGS.currencySymbol = sym;
  };

  const handleToggleMode = (mode: 'agency' | 'influencer' | 'business' | 'website') => {
    if (mode === 'agency') {
      setAgencyModeEnabled(true);
      setInfluencerModeEnabled(false);
      setBusinessModeEnabled(false);
      setWebsiteEnabled(false); // Auto off considering deployment on another server
    } else if (mode === 'influencer') {
      setInfluencerModeEnabled(true);
      setAgencyModeEnabled(false);
      setBusinessModeEnabled(false);
      setWebsiteEnabled(false); // Auto off considering deployment on another server
    } else if (mode === 'business') {
      setBusinessModeEnabled(true);
      setAgencyModeEnabled(false);
      setInfluencerModeEnabled(false);
      setWebsiteEnabled(true);
    } else if (mode === 'website') {
      if (!agencyModeEnabled && !influencerModeEnabled) {
        setWebsiteEnabled(prev => !prev);
      }
    }
  };

  const handleToggleEngine = (engine: 'zenith' | 'coresync') => {
    if (engine === 'zenith') {
      const nextZenith = !zernioEnabled;
      if (!nextZenith && !coresyncEnabled) {
        // Prevent turning both off; fallback to coresync
        setCoresyncEnabled(true);
        setGlobalDispatchEngine('coresync');
      } else {
        setZernioEnabled(nextZenith);
        setGlobalDispatchEngine(nextZenith && coresyncEnabled ? 'dual' : nextZenith ? 'zenith' : 'coresync');
      }
    } else if (engine === 'coresync') {
      const nextCoreSync = !coresyncEnabled;
      if (!nextCoreSync && !zernioEnabled) {
        // Prevent turning both off; fallback to zenith
        setZernioEnabled(true);
        setGlobalDispatchEngine('zenith');
      } else {
        setCoresyncEnabled(nextCoreSync);
        setGlobalDispatchEngine(zernioEnabled && nextCoreSync ? 'dual' : zernioEnabled ? 'zenith' : 'coresync');
      }
    }
  };

  const handleSelectGlobalEngine = (choice: EngineChoice) => {
    setGlobalDispatchEngine(choice);
    if (choice === 'dual') {
      setZernioEnabled(true);
      setCoresyncEnabled(true);
    } else if (choice === 'zenith') {
      setZernioEnabled(true);
      setCoresyncEnabled(false);
    } else if (choice === 'coresync') {
      setZernioEnabled(false);
      setCoresyncEnabled(true);
    }
  };

  const handleApplyEngineToAllWorkspaces = async () => {
    const choice = globalDispatchEngine;
    tenants.forEach(t => {
      t.dispatchEngine = choice;
      t.enabledEngines = choice === 'dual' ? ['zenith', 'coresync'] : [choice as any];
    });

    try {
      await supabase.from('tenants').update({
        dispatch_engine: choice,
        enabled_engines: choice === 'dual' ? ['zenith', 'coresync'] : [choice as any]
      }).neq('id', 'non-existent-placeholder');
    } catch {
      /* ignore offline errors */
    }

    setSettingsNotification(`✅ Applied ${choice === 'dual' ? 'Dual Engine (Both Zenith & CoreSync)' : choice === 'zenith' ? 'Zenith (Zernio) Only' : 'CoreSync (Composio) Only'} to ALL ${tenants.length} organization workspaces!`);
    setTimeout(() => setSettingsNotification(null), 4000);
  };

  const handleSaveSystemSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);

    try {
      const updatedSettings: SystemSettings = {
        currency: systemCurrency,
        currencySymbol: currencySymbol,
        platformName: platformName.trim(),
        supportEmail: supportEmail.trim(),
        aiApiKey: aiApiKeyInput.trim() ? `••••${aiApiKeyInput.trim().slice(-4)}` : GLOBAL_SYSTEM_SETTINGS.aiApiKey,
        defaultAiCredits: defaultCreditsInput,
        websiteEnabled: websiteEnabled,
        agencyModeEnabled: agencyModeEnabled,
        influencerModeEnabled: influencerModeEnabled,
        businessModeEnabled: businessModeEnabled,
        aiCreditsEnabled: aiCreditsEnabled,
        voiceAssistantEnabled: voiceAssistantEnabled,
        automationAiEnabled: automationAiEnabled,
        zernioEnabled: zernioEnabled,
        coresyncEnabled: coresyncEnabled,
        dispatchEngine: globalDispatchEngine,
      };

      Object.assign(GLOBAL_SYSTEM_SETTINGS, updatedSettings);

      try {
        localStorage.setItem('spree_system_settings', JSON.stringify(updatedSettings));
        await supabase.from('system_settings').upsert({
          key: 'spree_global_settings',
          value: JSON.stringify(updatedSettings),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      } catch (err) {
        console.warn('System settings cloud sync notice:', err);
      }

      if (onUpdateSystemSettings) {
        onUpdateSystemSettings(updatedSettings);
      }

      if (aiApiKeyInput.trim() && tenants[0]) {
        const { error } = await supabase.functions.invoke('manage-credentials', { body: { tenantId: tenants[0].id, provider: 'openai', label: 'global', secret: aiApiKeyInput.trim() } });
        if (error) { 
          setSettingsNotification(`AI credential save failed: ${error.message}`); 
          setIsSavingSettings(false);
          return; 
        }
        setAiApiKeyInput('');
      }

      // Small delay for smooth tactile feedback
      await new Promise(r => setTimeout(r, 200));
      setSettingsNotification('Configuration Saved & Activated Live Across All Workspaces!');
      setTimeout(() => setSettingsNotification(null), 4000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleOpenUserInspector = (tenant: Tenant) => {
    setInspectingTenant(tenant);
    setCustomAccountsInput(tenant.maxSocialAccounts || 6);
    setCustomDailyZernioInput(tenant.customZernioDailyLimit || 100);
    setCustomMonthlyZernioInput(tenant.customZernioMonthlyLimit || 3000);
    setCustomStorageMbInput(tenant.customStorageLimitMb || 5000);
  };

  const handleOpenAddCldModal = () => {
    setEditingCldId(null);
    setCldLabelInput('Primary Master CDN');
    setCldCloudNameInput('djmww1dwr');
    setCldUploadPresetInput('ml_default');
    setCldBucketNameInput('socialspree-media-vault');
    setShowCldModal(true);
  };

  const handleOpenEditCldModal = (item: CloudinaryAccountItem) => {
    setEditingCldId(item.id);
    setCldLabelInput(item.label || 'Cloudinary CDN Account');
    setCldCloudNameInput(item.cloudName);
    setCldUploadPresetInput(item.uploadPreset);
    setCldBucketNameInput(item.bucketName || 'socialspree-media-vault');
    setShowCldModal(true);
  };

  const handleSaveCldModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cldCloudNameInput.trim() || !cldUploadPresetInput.trim()) return;

    let updated: CloudinaryAccountItem[];
    if (editingCldId) {
      updated = cldPool.map(acc => {
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
        id: `cld-master-${Date.now()}`,
        label: cldLabelInput.trim() || `Cloudinary Account ${cldPool.length + 1}`,
        cloudName: cldCloudNameInput.trim(),
        uploadPreset: cldUploadPresetInput.trim(),
        bucketName: cldBucketNameInput.trim() || 'socialspree-media-vault',
        isActiveDefault: cldPool.length === 0
      };
      updated = [...cldPool, newAcc];
    }

    setCldPool(updated);
    GLOBAL_CLOUDINARY_POOL.length = 0;
    GLOBAL_CLOUDINARY_POOL.push(...updated);
    saveStoredCloudinaryPool(updated);
    setShowCldModal(false);

    setCldNotification('Global Cloudinary CDN Account Pool Saved Successfully!');
    setTimeout(() => setCldNotification(null), 3000);
  };

  const handleSelectActiveCldAccount = (accId: string) => {
    const updated = cldPool.map(acc => ({
      ...acc,
      isActiveDefault: acc.id === accId
    }));
    setCldPool(updated);
    GLOBAL_CLOUDINARY_POOL.length = 0;
    GLOBAL_CLOUDINARY_POOL.push(...updated);
    saveStoredCloudinaryPool(updated);

    setCldNotification('Active Default Cloudinary CDN Account Updated!');
    setTimeout(() => setCldNotification(null), 3000);
  };

  const handleDeleteCldAccount = (accId: string) => {
    if (cldPool.length <= 1) return;
    const updated = cldPool.filter(a => a.id !== accId);
    if (!updated.some(a => a.isActiveDefault)) {
      updated[0].isActiveDefault = true;
    }
    setCldPool(updated);
    GLOBAL_CLOUDINARY_POOL.length = 0;
    GLOBAL_CLOUDINARY_POOL.push(...updated);
    saveStoredCloudinaryPool(updated);
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerEmail.trim()) return;

    const matchedPlan = plans.find(p => p.id === selectedPlanId);
    const slots = matchedPlan ? matchedPlan.allocatedApiSlots : allocatedSlots;
    const initialCredits = matchedPlan ? matchedPlan.aiCredits : defaultCreditsInput;

    const initialSlots: ApiAllocationSlot[] = Array.from({ length: slots }).map((_, idx) => ({
      id: crypto.randomUUID(),
      slotNumber: idx + 1,
      slotName: `API ${idx + 1}`,
      apiKey: '',
      maxChannels: 2,
      connectedAccountIds: []
    }));

    onAddTenant({
      name: name.trim(),
      ownerEmail: ownerEmail.trim(),
      apiKey: '',
      tierPlan: matchedPlan ? (matchedPlan.name as any) : tier,
      planId: selectedPlanId || undefined,
      allocatedApiSlots: slots,
      maxSocialAccounts: slots * 2,
      aiCredits: initialCredits,
      apiSlotDetails: initialSlots,
      cloudinaryConfig: {
        cloudName: GLOBAL_DEFAULT_CLOUDINARY.cloudName,
        uploadPreset: GLOBAL_DEFAULT_CLOUDINARY.uploadPreset,
        useSuperAdminDefault: true
      },
      status: 'active',
      paymentStatus: 'paid',
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      billingCycle: 'monthly',
    });

    setName('');
    setOwnerEmail('');
    setApiKeyInput('');
    setSelectedPlanId('');
    setShowAddModal(false);
  };

  const handleUpdateTenantTierPlan = async (tenantId: string, newTier: string) => {
    onUpdateTenantTier(tenantId, newTier as any);
    let postLimit = 2;
    if (newTier === 'starter') postLimit = 50;
    else if (newTier === 'pro' || newTier === 'influencer') postLimit = 500;
    else if (newTier === 'agency') postLimit = 5000;
    else if (newTier === 'enterprise') postLimit = 10000;
    onUpdateTenantLimit(tenantId, postLimit);

    try {
      await supabase.from('tenants').update({
        tier_plan: newTier,
        custom_zernio_monthly_limit: postLimit
      }).eq('id', tenantId);
    } catch {
      /* ignore offline update errors */
    }
  };

  const handleUpdateTenantDispatchEngine = async (tenantId: string, engine: 'zenith' | 'coresync' | 'dual') => {
    const target = tenants.find(t => t.id === tenantId);
    if (target) {
      target.dispatchEngine = engine;
      target.enabledEngines = engine === 'dual' ? ['zenith', 'coresync'] : [engine];
    }

    try {
      await supabase.from('tenants').update({
        dispatch_engine: engine,
        enabled_engines: engine === 'dual' ? ['zenith', 'coresync'] : [engine]
      }).eq('id', tenantId);
    } catch {
      /* ignore offline update errors */
    }
  };

  const handleSaveApiSlotsModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTenant = tenants.find(t => t.id === targetTenantId);
    if (!targetTenant) return;

    const existingSlots: ApiAllocationSlot[] = targetTenant.apiSlotDetails || [];
    
    // If tenant currently has 1 slot that is empty/blank, replace it; otherwise append
    const isSingleBlankSlot = existingSlots.length === 1 && (!existingSlots[0].apiKey || existingSlots[0].apiKey.trim() === '');
    
    const startIdx = isSingleBlankSlot ? 0 : existingSlots.length;
    const baseSlots = isSingleBlankSlot ? [] : existingSlots;

    const newlyAddedSlots: ApiAllocationSlot[] = apiKeysInput.map((keyVal, idx) => {
      const slotNum = startIdx + idx + 1;
      const prov = apiProvidersInput[idx] || 'zernio';
      return {
        id: isSingleBlankSlot && idx === 0 ? existingSlots[0].id : crypto.randomUUID(),
        slotNumber: slotNum,
        slotName: `API ${slotNum} (${prov === 'composio' ? 'COMPOSIO' : 'ZERNIO'})`,
        provider: prov,
        apiKey: keyVal.trim(),
        maxChannels: prov === 'composio' ? 5 : 2,
        connectedAccountIds: []
      };
    });

    const mergedSlots = [...baseSlots, ...newlyAddedSlots];

    // 1. Immediately apply to UI & tenant state
    if (onUpdateTenantApiSlotDetails) {
      onUpdateTenantApiSlotDetails(targetTenantId, mergedSlots);
    }

    // 2. Clear modal inputs and close modal
    setApiKeysInput(Array(apiCount).fill(''));
    setApiProvidersInput(Array(apiCount).fill('zernio'));
    setShowAddApiModal(false);

    // 3. Show high-visibility success toast
    setSettingsNotification(`✅ Saved ${newlyAddedSlots.length} API Slot(s) for ${targetTenant.name}! Total: ${mergedSlots.length} Slots.`);
    setTimeout(() => setSettingsNotification(null), 4000);

    // 4. Background save to secure database vault (non-blocking)
    for (let index = 0; index < apiKeysInput.length; index++) {
      const secret = apiKeysInput[index].trim();
      const prov = apiProvidersInput[index] || 'zernio';
      const slotNum = startIdx + index + 1;
      if (!secret) continue;
      void supabase.functions.invoke('manage-credentials', { 
        body: { 
          tenantId: targetTenantId, 
          provider: prov, 
          label: `slot-${slotNum}`, 
          secret 
        } 
      }).catch(() => {});
    }
  };

  const handleTopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topupTenantId || topupAmount <= 0) return;

    if (onTopupAiCredits) {
      onTopupAiCredits(topupTenantId, topupAmount, topupReason.trim() || 'Super Admin Credit Grant');
    }

    setShowTopupModal(false);
    setSettingsNotification(`Granted +${topupAmount} AI Credits to Tenant!`);
    setTimeout(() => setSettingsNotification(null), 3000);
  };

  const handleSaveSingleSlotKey = async (tenantId: string, slotId: string) => {
    const keyTrimmed = customZernioKey.trim();
    const targetTenant = tenants.find(t => t.id === tenantId);
    if (!targetTenant) return;

    const currentSlots = targetTenant.apiSlotDetails || [];
    const targetSlot = currentSlots.find(s => s.id === slotId);
    if (!targetSlot) return;

    const updatedSlots = currentSlots.map(s => s.id === slotId ? { ...s, apiKey: keyTrimmed } : s);

    // 1. Immediately update parent state so UI updates in real-time
    if (onUpdateTenantApiSlotDetails) {
      onUpdateTenantApiSlotDetails(tenantId, updatedSlots);
    }

    // 2. Attempt secure background vault save
    if (keyTrimmed) {
      void supabase.functions.invoke('manage-credentials', { 
        body: { 
          tenantId, 
          provider: targetSlot.provider || 'zernio', 
          label: `slot-${targetSlot.slotNumber}`, 
          secret: keyTrimmed 
        } 
      }).catch(() => {});
    }

    setEditingKeySlotId(null);
    setCustomZernioKey('');
    setSettingsNotification(`✅ API Key for ${targetSlot.slotName || `Slot ${targetSlot.slotNumber}`} successfully saved!`);
    setTimeout(() => setSettingsNotification(null), 3500);
  };

  const handleRemoveSingleSlot = (tenantId: string, slotId: string) => {
    const targetTenant = tenants.find(t => t.id === tenantId);
    if (!targetTenant) return;

    const currentSlots = targetTenant.apiSlotDetails || [];
    const updatedSlots = currentSlots.filter(s => s.id !== slotId).map((s, idx) => ({
      ...s,
      slotNumber: idx + 1,
      slotName: `API ${idx + 1}`
    }));

    if (onUpdateTenantApiSlotDetails) {
      onUpdateTenantApiSlotDetails(tenantId, updatedSlots);
    }
  };

  const handleSaveEditedPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const updated = plans.map(p => {
      if (p.id === editingPlan.id) {
        const sym = getSymbol(editingPlan.currency || 'USD');
        return {
          ...p,
          name: editingPlan.name,
          priceMonthly: editingPlan.priceMonthly,
          currency: editingPlan.currency || 'USD',
          currencySymbol: sym,
          allocatedApiSlots: editingPlan.allocatedApiSlots,
          maxSocialAccounts: editingPlan.allocatedApiSlots * 2,
          aiCredits: editingPlan.aiCredits ?? 1000
        };
      }
      return p;
    });

    setPlans(updated);
    setEditingPlan(null);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;

    const sym = getSymbol(planCurrency);
    const newPlan: SubscriptionPlan = {
      id: `plan-${Date.now()}`,
      name: planName.trim(),
      priceMonthly: planPrice,
      currency: planCurrency,
      currencySymbol: sym,
      allocatedApiSlots: planSlots,
      maxSocialAccounts: planSlots * 2,
      aiCredits: planAiCredits,
      features: planFeatures.split('\n').filter(f => f.trim().length > 0)
    };

    const updated = [...plans, newPlan];
    setPlans(updated);

    setPlanName('');
    setPlanPrice(29);
    setPlanCurrency('USD');
    setPlanSlots(2);
    setPlanAiCredits(1000);
    setPlanFeatures('');
    setShowAddPlanModal(false);
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeyVisible(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const totalAllocatedSlots = tenants.reduce((acc, t) => acc + (t.allocatedApiSlots || (t.apiSlotDetails ? t.apiSlotDetails.length : 2)), 0);
  const totalAiCreditsAllocated = tenants.reduce((acc, t) => acc + (t.aiCredits ?? 1000), 0);

  const calculateMRR = (curr: CurrencyCode) => {
    return tenants.reduce((acc, t) => {
      if (t.status !== 'active') return acc;
      const match = plans.find(p => p.id === t.planId || p.name === t.tierPlan);
      if (match && (match.currency || 'USD') === curr) {
        return acc + match.priceMonthly;
      }
      return acc;
    }, 0);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0 relative">

      {/* GLOBAL HIGH-VISIBILITY FLOATING TOAST NOTIFICATION */}
      {settingsNotification && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="px-5 py-3.5 bg-slate-950 text-white border-2 border-emerald-500 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-black text-white">System Configuration Live</div>
              <div className="text-[11px] text-emerald-300 font-medium">{settingsNotification}</div>
            </div>
          </div>
        </div>
      )}

      {/* SUPER ADMIN PORTAL TOP SWITCHER BAR */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl border border-amber-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">Super Admin Governance Suite</span>
              <span className="bg-amber-400 text-slate-950 text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase">
                /superadmin
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Master organization control, tenant quota provisioning, multi-tenant RBAC, and engine settings.
            </p>
          </div>
        </div>

        {onReturnToWorkspace && (
          <button
            type="button"
            onClick={onReturnToWorkspace}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-amber-300" />
            <span>Return to Workspace Admin (/admin)</span>
          </button>
        )}
      </div>

      {/* SUB-VIEW 1: DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Total Business Tenants</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{tenants.length}</div>
              </div>
              <Building2 className="w-8 h-8 text-[#5D3FD3] dark:text-purple-400 opacity-20" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Allocated API Slots</div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{totalAllocatedSlots} Slots</div>
              </div>
              <Layers className="w-8 h-8 text-purple-600 dark:text-purple-400 opacity-20" />
            </div>

            {aiCreditsEnabled && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Total AI Credits</div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">{totalAiCreditsAllocated}</div>
                </div>
                <Sparkles className="w-8 h-8 text-amber-500 dark:text-amber-400 opacity-20" />
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Cloudinary Pool</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-4 h-4" /> {cldPool.length} Active Accounts
                </div>
              </div>
              <HardDrive className="w-8 h-8 text-emerald-600 dark:text-emerald-400 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs">Tenant Organizations & System Overview</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Super Admin overview of client tenants, API key slots, and AI credits</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-[#5D3FD3] text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Provision Tenant</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono text-[9px] tracking-wider">
                  <tr>
                    <th className="px-3 py-2">Tenant / Org</th>
                    <th className="px-3 py-2">Owner Email</th>
                    <th className="px-3 py-2">Slots</th>
                    <th className="px-3 py-2">Dispatch Engine</th>
                    {aiCreditsEnabled && <th className="px-3 py-2">AI Credits</th>}
                    <th className="px-3 py-2">Tier Plan</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap" title={`Tenant ID: ${tenant.id}`}>
                          {tenant.name}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-800 dark:text-slate-300 text-[11px] whitespace-nowrap">{tenant.ownerEmail}</td>
                      <td className="px-3 py-2 font-mono font-bold text-purple-900 dark:text-purple-300 text-[11px] whitespace-nowrap">
                        {tenant.allocatedApiSlots || 2} Slots ({ (tenant.allocatedApiSlots || 2) * 2 } Ch)
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={tenant.dispatchEngine || 'dual'}
                          onChange={(e) => handleUpdateTenantDispatchEngine(tenant.id, e.target.value as any)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-50 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 shadow-xs"
                        >
                          <option value="dual" className="dark:bg-slate-800">Dual Engine (Zenith+CoreSync)</option>
                          <option value="coresync" className="dark:bg-slate-800">CoreSync Engine</option>
                          <option value="zenith" className="dark:bg-slate-800">Zenith Engine</option>
                        </select>
                      </td>
                      {aiCreditsEnabled && (
                        <td className="px-3 py-2 font-mono font-bold text-amber-700 dark:text-amber-300 text-[11px] whitespace-nowrap">
                          ⚡ {tenant.aiCredits ?? 1000} Credits
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <select
                          value={tenant.tierPlan || 'free'}
                          onChange={(e) => handleUpdateTenantTierPlan(tenant.id, e.target.value)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900 shadow-xs"
                        >
                          <option value="free" className="dark:bg-slate-800">Free Plan</option>
                          <option value="starter" className="dark:bg-slate-800">Starter</option>
                          <option value="pro" className="dark:bg-slate-800">Pro / Influencer</option>
                          <option value="agency" className="dark:bg-slate-800">Agency Tier</option>
                          <option value="enterprise" className="dark:bg-slate-800">Enterprise</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                          tenant.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenUserInspector(tenant)}
                            title="Inspect Storage & Quotas"
                            className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 rounded text-[10px] font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-purple-700 dark:text-purple-400" />
                            <span>Inspect</span>
                          </button>
                          {aiCreditsEnabled && (
                            <button
                              onClick={() => onSelectSubTab('ai_credits')}
                              title="Top-Up AI Credits"
                              className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 rounded text-[10px] font-bold border border-amber-200 dark:border-amber-800 cursor-pointer"
                            >
                              + Credits
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: AI CREDITS & SETTINGS */}
      {activeSubTab === 'ai_credits' && (
        <div className="space-y-6 animate-in fade-in">
          {/* AI Settings Header Widget */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl border border-purple-800/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg">
                <Cpu className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight">Super Admin AI Credits & API Management</h2>
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    GEMINI / OPENAI API ENGINE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Set AI Provider API Keys, set default 1,000 credit allocation, top-up client credits, and track real-time AI usage deduction logs.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (tenants.length > 0) setTopupTenantId(tenants[0].id);
                setShowTopupModal(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Grant / Top-Up AI Credits</span>
            </button>
          </div>

          {/* AI Key & Default Credit Config Form */}
          <form onSubmit={handleSaveSystemSettings} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Key className="w-4 h-4 text-[#5D3FD3] dark:text-purple-400" />
              <span>Global AI Provider Secret API Key</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Global AI API Key (Gemini API / OpenAI API)</label>
                <input
                  type="text"
                  value={aiApiKeyInput}
                  onChange={(e) => setAiApiKeyInput(e.target.value)}
                  placeholder="Optional: Enter new key to update"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg font-mono text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Default AI Credits for New Provisioned Tenants</label>
                <input
                  type="number"
                  required
                  value={defaultCreditsInput}
                  onChange={(e) => setDefaultCreditsInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs focus:ring-2 focus:ring-amber-500"
                  min={100}
                  max={50000}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save AI Configuration</span>
              </button>
            </div>
          </form>

          {/* AI Credit Deduction & Grant Audit Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Real-Time AI Credit Deduction & Audit Logs</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Full audit log of when and for what AI credits were deducted or granted across all tenants</p>
              </div>

              <button
                onClick={() => setShowTopupModal(true)}
                className="px-3.5 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Grant Credits</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Tenant / Organization</th>
                    <th className="px-4 py-3">Action & Description</th>
                    <th className="px-4 py-3">Credit Change</th>
                    <th className="px-4 py-3 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {aiLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 italic">No AI credit activity logs recorded yet.</td>
                    </tr>
                  ) : (
                    aiLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-slate-500 dark:text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                          {log.tenantName || log.tenantId}
                        </td>
                        <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200 font-medium">
                          {log.description}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            log.creditsAmount < 0 ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {log.creditsAmount > 0 ? `+${log.creditsAmount}` : log.creditsAmount} Credits
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-purple-900 dark:text-purple-300">
                          {log.remainingBalance} Credits
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* OTHER SUB-VIEWS: SUBSCRIPTIONS, PLANS, API ALLOCATION, CLOUDINARY, SETTINGS */}
      {activeSubTab === 'subscriptions' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-md">
              <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">Estimated USD MRR</div>
              <div className="text-2xl font-black mt-1 font-mono">${calculateMRR('USD')}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-900 to-slate-900 text-white p-5 rounded-2xl border border-purple-800 shadow-md">
              <div className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold">Estimated INR MRR</div>
              <div className="text-2xl font-black mt-1 font-mono">₹{calculateMRR('INR')}</div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">Estimated GBP MRR</div>
              <div className="text-2xl font-black mt-1 font-mono">£{calculateMRR('GBP')}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                  <span>Subscription & Billing Control Console</span>
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Tenant Organization</th>
                    <th className="px-4 py-3">Assigned Plan</th>
                    <th className="px-4 py-3">Payment Status</th>
                    <th className="px-4 py-3">Renewal Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{tenant.name}</td>
                      <td className="px-4 py-3.5">
                        <select
                          value={tenant.planId || ''}
                          onChange={(e) => onUpdateTenantPlan && onUpdateTenantPlan(tenant.id, e.target.value)}
                          className="p-1.5 border border-slate-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                        >
                          <option value="" className="dark:bg-slate-800">Standard Tier</option>
                          {plans.map(p => (
                            <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.name} ({getSymbol(p.currency)}{p.priceMonthly}/mo)</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5 font-bold">
                        <select
                          value={tenant.paymentStatus || 'paid'}
                          onChange={(e) => onUpdateTenantPaymentStatus && onUpdateTenantPaymentStatus(tenant.id, e.target.value as any)}
                          className="p-1 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="paid" className="dark:bg-slate-800">Paid ✓</option>
                          <option value="unpaid" className="dark:bg-slate-800">Unpaid ⚠️</option>
                          <option value="overdue" className="dark:bg-slate-800">Overdue ✖</option>
                          <option value="trial" className="dark:bg-slate-800">Trial 🎁</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">{tenant.renewalDate || '2026-12-31'}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">{tenant.status}</td>
                      <td className="px-4 py-3.5 text-right">
                        {tenant.ownerEmail !== SUPER_ADMIN_EMAIL && (
                          <button onClick={() => onDeleteTenant(tenant.id)} className="text-red-600 hover:text-red-800 dark:hover:text-red-400 font-bold cursor-pointer">
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PLANS TAB */}
      {activeSubTab === 'payments' && <PendingPaymentsQueue />}

      {activeSubTab === 'plans' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                <span>Multi-Currency Plans with Included AI Credits</span>
              </h3>
            </div>
            <button
              onClick={() => setShowAddPlanModal(true)}
              className="px-4 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + Create Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-lg">{plan.name}</h4>
                  <button onClick={() => setEditingPlan({ ...plan })} className="text-[#5D3FD3] dark:text-purple-400 font-bold text-xs cursor-pointer">Edit</button>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {getSymbol(plan.currency)}{plan.priceMonthly}/mo
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800 rounded-xl text-xs font-mono font-bold text-purple-900 dark:text-purple-300 space-y-1">
                  <div>🔑 {plan.allocatedApiSlots} API Slots ({plan.allocatedApiSlots * 2} Channels)</div>
                  <div>⚡ {plan.aiCredits ?? 1000} Included AI Credits/mo</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API ALLOCATION TAB */}
      {activeSubTab === 'api_allocation' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                <span>Zenith API Slot Provisioning Console</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Line-by-line allocation of secret API keys. Each API key slot yields 2 connected social channels.</p>
            </div>
            <button
              onClick={() => setShowAddApiModal(true)}
              className="px-4 py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add API Slots</span>
            </button>
          </div>

          <div className="space-y-6">
            {tenants.map(t => {
              const slots = t.apiSlotDetails && t.apiSlotDetails.length > 0
                ? t.apiSlotDetails
                : Array.from({ length: t.allocatedApiSlots || 2 }).map((_, idx) => ({
                    id: `slot-${t.id}-${idx + 1}`,
                    slotNumber: idx + 1,
                    slotName: `API ${idx + 1}`,
                    provider: 'zernio' as EngineProvider,
                    apiKey: '',
                    maxChannels: 2,
                    connectedAccountIds: []
                  }));

              const totalChannelsForTenant = slots.reduce((acc, s) => acc + (s.provider === 'composio' ? (s.maxChannels || 5) : (s.maxChannels || 2)), 0);

              return (
                <div key={t.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 bg-slate-50/50 dark:bg-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          {t.tierPlan}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400" title={`Tenant Workspace ID: ${t.id}`}>{t.ownerEmail}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slots.map((slot) => {
                      const isKeyVisible = showKeyVisible[slot.id];
                      const isEditingThisSlot = editingKeySlotId === slot.id;

                      return (
                        <div key={slot.id} className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold font-mono text-[11px]">
                              <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                {slot.slotName || `API Slot #${slot.slotNumber}`}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                                slot.provider === 'composio' 
                                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' 
                                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}>
                                {slot.provider === 'composio' ? '🧩 COMPOSIO' : '⚡ ZERNIO (2 CH)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleKeyVisibility(slot.id)}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
                                title="Toggle Key Visibility"
                              >
                                {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              {slots.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSingleSlot(t.id, slot.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded cursor-pointer"
                                  title="Remove Slot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {isEditingThisSlot ? (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={customZernioKey}
                                onChange={(e) => setCustomZernioKey(e.target.value)}
                                placeholder="Enter secret API key string..."
                                className="flex-1 p-1.5 border border-purple-300 dark:border-purple-700 rounded font-mono text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveSingleSlotKey(t.id, slot.id)}
                                className="px-2.5 py-1 bg-[#5D3FD3] hover:bg-purple-700 text-white rounded font-bold text-[11px] cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingKeySlotId(null)}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-semibold text-[11px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60 font-mono text-xs">
                              <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[220px]">
                                {slot.apiKey && slot.apiKey.trim().length > 0 
                                  ? (isKeyVisible ? slot.apiKey : '••••••••••••••••••••••••')
                                  : <span className="text-slate-400 dark:text-slate-500 font-normal italic text-[11px]">Blank (No Key Configured)</span>
                                }
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingKeySlotId(slot.id);
                                  setCustomZernioKey('');
                                }}
                                className="text-purple-700 dark:text-purple-400 hover:underline font-bold text-[11px] shrink-0 cursor-pointer"
                              >
                                Edit Key
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLOUDINARY MEDIA TAB */}
      {activeSubTab === 'media' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Cloudinary Accounts Pool</span>
              </h3>
              <button onClick={handleOpenAddCldModal} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs">
                + Add Account
              </button>
            </div>

            {cldPool.map(acc => (
              <div key={acc.id} className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <strong className="text-slate-900 dark:text-white">{acc.label}</strong> &mdash; Cloud: <code className="text-blue-900 dark:text-blue-300 font-mono">{acc.cloudName}</code> | Preset: <code className="dark:text-slate-300 font-mono">{acc.uploadPreset}</code>
                </div>
                <button onClick={() => handleOpenEditCldModal(acc)} className="text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline">Edit</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SYSTEM SETTINGS & SERVER MODE SWITCHES TAB */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSystemSettings} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6 animate-in fade-in">
          {settingsNotification && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{settingsNotification}</span>
            </div>
          )}

          {/* 4 SERVER MODE SWITCHES */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                  <span>Deployment Mode Controls & Mutual Exclusivity Switches</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 px-2 py-0.5 rounded uppercase border border-purple-200 dark:border-purple-800">
                  Super Admin Exclusive
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure server mode deployment behavior. Enabling Agency or Influencer mode automatically sets Business User mode and Public Website to OFF for isolated server deployments.
              </p>
            </div>

            {/* 1-CLICK SERVER PROFILE PRESETS */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Quick 1-Click Server Profile Presets</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Instant Auto-Mutex Configuration</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleMode('agency')}
                  className="p-2.5 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-purple-950 dark:text-purple-200 font-bold rounded-lg text-left cursor-pointer transition-all"
                >
                  🏢 Dedicated Agency Server Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode('influencer')}
                  className="p-2.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 font-bold rounded-lg text-left cursor-pointer transition-all"
                >
                  ✨ Influencer Creator Instance Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode('business')}
                  className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-bold rounded-lg text-left cursor-pointer transition-all"
                >
                  🚀 Standard Business SaaS Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TOGGLE 1: WEBSITE */}
              <div className={`p-4 rounded-xl border transition-all ${websiteEnabled ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className={`w-5 h-5 ${websiteEnabled ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">Public Website Landing Page</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Enable multi-page marketing landing system</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('website')}
                    disabled={agencyModeEnabled || influencerModeEnabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${websiteEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${websiteEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE 2: AGENCY MODE */}
              <div className={`p-4 rounded-xl border transition-all ${agencyModeEnabled ? 'bg-purple-900/10 dark:bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className={`w-5 h-5 ${agencyModeEnabled ? 'text-purple-700 dark:text-purple-300' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <span>Agency Mode</span>
                        {agencyModeEnabled && <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Multi-brand management suite & workspace switcher</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('agency')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${agencyModeEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${agencyModeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE 3: INFLUENCER MODE */}
              <div className={`p-4 rounded-xl border transition-all ${influencerModeEnabled ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className={`w-5 h-5 ${influencerModeEnabled ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <span>Influencer / Creator Mode</span>
                        {influencerModeEnabled && <span className="bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Creator grid planner & personal media vault</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('influencer')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${influencerModeEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${influencerModeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE 4: BUSINESS USER MODE */}
              <div className={`p-4 rounded-xl border transition-all ${businessModeEnabled ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className={`w-5 h-5 ${businessModeEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <span>Business User Mode</span>
                        {businessModeEnabled && <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Standard single business user workspace</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('business')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${businessModeEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${businessModeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI & VOICE FEATURE TOGGLES */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span>AI & Voice Engine Feature Controls</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Instantly turn ON or OFF experimental AI features for regular workspace users. When OFF, features and balances are completely hidden from user views.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TOGGLE 5: AI CREDITS & SETTINGS */}
              <div className={`p-4 rounded-xl border transition-all ${aiCreditsEnabled ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Coins className={`w-5 h-5 ${aiCreditsEnabled ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <span>AI Content Credits & Settings</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${aiCreditsEnabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {aiCreditsEnabled ? 'ACTIVE (USER VISIBLE)' : 'DISABLED (HIDDEN)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Unpublish/hide AI credits & generation from regular users</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiCreditsEnabled(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${aiCreditsEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiCreditsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE 6: VOICE AI ASSISTANT */}
              <div className={`p-4 rounded-xl border transition-all ${voiceAssistantEnabled ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-5 h-5 ${voiceAssistantEnabled ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <span>Voice AI Assistant (Web Speech API)</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${voiceAssistantEnabled ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {voiceAssistantEnabled ? 'ACTIVE (USER VISIBLE)' : 'DISABLED (HIDDEN)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Enable/disable floating voice assistant widget and Alt+V shortcut</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceAssistantEnabled(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${voiceAssistantEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${voiceAssistantEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE 7: AUTOMATION & AI PAGE (LIVE AUTO-RESPONDER) */}
              <div className={`p-4 rounded-xl border transition-all md:col-span-2 ${automationAiEnabled ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquareCode className={`w-5 h-5 ${automationAiEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <span>Automation & AI Page (Live Auto-Responder & DM Triggers)</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${automationAiEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {automationAiEnabled ? 'ACTIVE (USER VISIBLE)' : 'DISABLED (HIDDEN)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Turn ON/OFF Automation & AI section and Live Auto-Responder for regular workspace users</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutomationAiEnabled(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${automationAiEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${automationAiEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ENGINE CONTROLS: TURN OFF ZERNIO (ZENITH) OR CORESYNC (COMPOSIO) */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                  <span>Dispatch Engine Switches (Zenith / Zernio vs CoreSync / Composio)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Turn ON or OFF any publishing backend engine. You can run Dual Engine or isolate the system to Zenith-only or CoreSync-only.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleApplyEngineToAllWorkspaces}
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Force this engine choice onto all tenant organizations"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Apply to All {tenants.length} Workspaces</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Engine Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSelectGlobalEngine('dual')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  globalDispatchEngine === 'dual'
                    ? 'bg-purple-900 text-white border-purple-500 ring-2 ring-purple-500/30 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>⚡ Dual Parallel Engine</span>
                  {globalDispatchEngine === 'dual' && <span className="text-[9px] bg-purple-500 text-white px-1.5 py-0.2 rounded">ACTIVE</span>}
                </div>
                <div className={`text-[10px] mt-1 ${globalDispatchEngine === 'dual' ? 'text-purple-200' : 'text-slate-500 dark:text-slate-400'}`}>
                  Zenith & CoreSync both enabled with parallel fallback
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGlobalEngine('zenith')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  globalDispatchEngine === 'zenith'
                    ? 'bg-emerald-950 text-white border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>🚀 Zenith (Zernio) Only</span>
                  {globalDispatchEngine === 'zenith' && <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
                </div>
                <div className={`text-[10px] mt-1 ${globalDispatchEngine === 'zenith' ? 'text-emerald-200' : 'text-slate-500 dark:text-slate-400'}`}>
                  Direct Native 2-Channel Slots (CoreSync turned OFF)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGlobalEngine('coresync')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  globalDispatchEngine === 'coresync'
                    ? 'bg-blue-950 text-white border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>🔗 CoreSync (Composio) Only</span>
                  {globalDispatchEngine === 'coresync' && <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.2 rounded">ACTIVE</span>}
                </div>
                <div className={`text-[10px] mt-1 ${globalDispatchEngine === 'coresync' ? 'text-blue-200' : 'text-slate-500 dark:text-slate-400'}`}>
                  Enterprise OAuth Bridge (Zenith turned OFF)
                </div>
              </button>
            </div>

            {/* Individual Engine Toggle Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* TOGGLE: ZENITH / ZERNIO */}
              <div className={`p-4 rounded-xl border transition-all ${zernioEnabled ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-5 h-5 ${zernioEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <span>Zenith Engine (Zernio Provider)</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${zernioEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {zernioEnabled ? 'ENABLED (ONLINE)' : 'DISABLED (OFFLINE)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Fast 2-channel slot direct parallel dispatcher</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleEngine('zenith')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${zernioEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${zernioEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE: CORESYNC / COMPOSIO */}
              <div className={`p-4 rounded-xl border transition-all ${coresyncEnabled ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className={`w-5 h-5 ${coresyncEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <span>CoreSync Engine (Composio Provider)</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${coresyncEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                          {coresyncEnabled ? 'ENABLED (ONLINE)' : 'DISABLED (OFFLINE)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Enterprise authentication bridge & token pooling</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleEngine('coresync')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${coresyncEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${coresyncEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Global Currency Preference</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleCurrencyChange('USD')}
                className={`p-3 border rounded-xl font-bold text-xs transition-all cursor-pointer ${systemCurrency === 'USD' ? 'bg-[#5D3FD3] text-white border-[#5D3FD3]' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => handleCurrencyChange('INR')}
                className={`p-3 border rounded-xl font-bold text-xs transition-all cursor-pointer ${systemCurrency === 'INR' ? 'bg-[#5D3FD3] text-white border-[#5D3FD3]' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
              >
                INR (₹)
              </button>
              <button
                type="button"
                onClick={() => handleCurrencyChange('GBP')}
                className={`p-3 border rounded-xl font-bold text-xs transition-all cursor-pointer ${systemCurrency === 'GBP' ? 'bg-[#5D3FD3] text-white border-[#5D3FD3]' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
              >
                GBP (£)
              </button>
            </div>
          </div>

          {/* STICKY BOTTOM SAVE ACTION BAR */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky bottom-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-purple-200/80 dark:border-purple-900/80 shadow-lg -mx-2 -mb-2 z-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSavingSettings}
                onClick={() => handleSaveSystemSettings()}
                className={`px-7 py-3.5 rounded-xl font-black text-xs shadow-lg transition-all duration-200 flex items-center gap-2.5 cursor-pointer active:scale-95 select-none ${
                  isSavingSettings
                    ? 'bg-purple-400 text-white cursor-wait opacity-90'
                    : 'bg-gradient-to-r from-[#5D3FD3] via-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hover:shadow-purple-500/30 hover:scale-102 ring-2 ring-purple-400/20'
                }`}
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Saving & Applying Live...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-amber-300 fill-amber-300/30" />
                    <span>Save System Settings & Mode Controls</span>
                  </>
                )}
              </button>
            </div>

            {settingsNotification && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-bold shadow-xs animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{settingsNotification}</span>
              </div>
            )}
          </div>
        </form>
      )}

      {/* SUB-VIEW 8: PRIVILEGE & ACCESS CONTROL (RBAC) */}
      {activeSubTab === 'privileges' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-6 rounded-2xl border border-purple-800/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">Privilege & Role-Based Access Control (RBAC)</h2>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full uppercase">
                    SUPER ADMIN MASTER OVERRIDE
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Manage multi-tenant administrative privileges, system roles, API allocation authority, and governance permissions across all organization accounts.
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-slate-900/90 border border-amber-500/40 rounded-xl text-xs font-mono text-amber-300 flex items-center gap-2 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Active Super Admin: {SUPER_ADMIN_EMAIL}</span>
            </div>
          </div>

          {/* Super Admin Privileges Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Master Authority Level</div>
                <div className="text-xl font-black text-purple-900 dark:text-purple-300 mt-1">Tier-0 Global</div>
              </div>
              <Crown className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Managed Tenant Orgs</div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{tenants.length} Workspaces</div>
              </div>
              <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400 opacity-80" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">System Role Profiles</div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">4 Active Roles</div>
              </div>
              <Sliders className="w-7 h-7 text-emerald-600 dark:text-emerald-400 opacity-80" />
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">Privilege Override Status</div>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">Enforced</div>
              </div>
              <Zap className="w-7 h-7 text-amber-500 dark:text-amber-400 opacity-80" />
            </div>
          </div>

          {/* Role Permissions Matrix Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                  <span>Platform System Role Privileges Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Granular permission control mapping across Super Admin and Tenant organizational roles.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800 font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Permission / Action Capability</th>
                    <th className="py-3 px-4 text-center font-bold text-purple-900 dark:text-purple-300">
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 rounded font-black border border-amber-200 dark:border-amber-800">Super Admin</span>
                    </th>
                    <th className="py-3 px-4 text-center font-bold text-blue-900 dark:text-blue-300">Tenant Owner</th>
                    <th className="py-3 px-4 text-center font-bold text-emerald-900 dark:text-emerald-300">Content Manager</th>
                    <th className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">Auditor (Read-Only)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>Provision & Delete Tenant Accounts</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Manage multi-tenant organizations & workspace keys</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>Allocate 2-Channel API Slots</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Assign Zernio API keys & slot limits per tenant</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>Grant & Top-up AI Credits</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Manually add bonus AI tokens to tenant balances</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>Configure Subscription Plans & Pricing</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Edit pricing tiers, USD/INR/GBP currencies & features</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>Connect Social Media Accounts & Webhooks</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Link Instagram, Facebook, LinkedIn, TikTok & X profiles</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>Create, Schedule & Auto-Publish Posts</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Use Post Composer, Media Vault & Calendar Grid</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>View Activity Logs & Revenue Reports</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Access real-time analytics & HTTP dispatch logs</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto font-black" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TOP UP AI CREDITS MODAL */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <span>Grant / Top-Up Tenant AI Credits</span>
              </h3>
              <button onClick={() => setShowTopupModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleTopupSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Tenant Organization</label>
                <select
                  value={topupTenantId}
                  onChange={(e) => setTopupTenantId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id} className="dark:bg-slate-800">
                      {t.name} ({t.aiCredits ?? 1000} Current Credits)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Credits Amount to Add</label>
                <input
                  type="number"
                  required
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs"
                  min={50}
                  max={50000}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description / Audit Reason</label>
                <input
                  type="text"
                  required
                  value={topupReason}
                  onChange={(e) => setTopupReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md cursor-pointer"
                >
                  Grant Credits Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINE-BY-LINE API SLOT MODAL WITH ENGINE PROVIDER SELECTION & USER SEARCH */}
      {showAddApiModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 font-['Inter']">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Provision API Slots & Engines</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Allocate Zernio (2 Channels max) or Composio (Multi-Channel AI) API slots to any user workspace.</p>
              </div>
              <button onClick={() => setShowAddApiModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveApiSlotsModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Select User / Tenant Workspace</label>
                
                {/* Search Bar for Tenant Filter */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search user name, email, or workspace..."
                    value={tenantSearchQuery}
                    onChange={(e) => setTenantSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#5D3FD3] transition-all"
                  />
                </div>

                <select
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-[#5D3FD3]"
                >
                  {tenants
                    .filter(t => 
                      t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) || 
                      t.ownerEmail.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                    )
                    .map(t => (
                      <option key={t.id} value={t.id} className="dark:bg-slate-800">
                        {t.name} ({t.ownerEmail}) — [{t.tierPlan.toUpperCase()}]
                      </option>
                    ))
                  }
                </select>
                {tenants.filter(t => t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) || t.ownerEmail.toLowerCase().includes(tenantSearchQuery.toLowerCase())).length === 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">No matching users found for "{tenantSearchQuery}"</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Number of API Slots to Provision</label>
                <input
                  type="number"
                  value={apiCount}
                  onChange={(e) => handleApiCountChange(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs focus:ring-2 focus:ring-[#5D3FD3]"
                  min={1}
                  max={20}
                />
              </div>

              <div className="space-y-3 pt-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {apiKeysInput.map((keyVal, idx) => {
                  const currentProv = apiProvidersInput[idx] || 'zernio';
                  return (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900 dark:text-purple-300 text-xs flex items-center gap-1.5">
                          <span>API {idx + 1} Slot String:</span>
                        </span>

                        {/* Engine Provider Selection Dropdown */}
                        <select
                          value={currentProv}
                          onChange={(e) => {
                            const val = e.target.value as EngineProvider;
                            setApiProvidersInput(prev => {
                              const next = [...prev];
                              next[idx] = val;
                              return next;
                            });
                          }}
                          className="p-1.5 text-[11px] font-bold border border-purple-200 dark:border-purple-800 rounded-lg bg-white dark:bg-slate-800 text-purple-950 dark:text-purple-200 focus:ring-2 focus:ring-[#5D3FD3]"
                        >
                          <option value="zernio" className="dark:bg-slate-800">⚡ Zernio Engine (2 Channels Max)</option>
                          <option value="composio" className="dark:bg-slate-800">🧩 Composio Engine (Multi-Channel AI)</option>
                        </select>
                      </div>

                      <input
                        type="text"
                        value={keyVal}
                        placeholder={currentProv === 'composio' ? 'Enter Composio Secret Key (e.g. comp_live_key_99182...)' : 'Enter Zernio Secret Key (e.g. zernio_live_key_88192...)'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setApiKeysInput(prev => {
                            const next = [...prev];
                            next[idx] = val;
                            return next;
                          });
                        }}
                        className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#5D3FD3]"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddApiModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition-colors cursor-pointer">Save API Slots</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOUDINARY MODAL */}
      {showCldModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Cloudinary Account</h3>
              <button onClick={() => setShowCldModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveCldModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Label</label>
                <input type="text" value={cldLabelInput} onChange={(e) => setCldLabelInput(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cloud Name</label>
                <input type="text" value={cldCloudNameInput} onChange={(e) => setCldCloudNameInput(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Upload Preset</label>
                <input type="text" value={cldUploadPresetInput} onChange={(e) => setCldUploadPresetInput(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Storage Bucket Name</label>
                <input type="text" value={cldBucketNameInput} onChange={(e) => setCldBucketNameInput(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs" />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowCldModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVISION TENANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Provision Client Tenant</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Organization Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Owner Email</label>
                <input type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan</label>
                <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-bold">
                  <option value="" className="dark:bg-slate-800">Custom Tier</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.name} ({p.allocatedApiSlots} slots - {p.aiCredits ?? 1000} AI Credits)</option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer shadow-md">Provision</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER STORAGE & QUOTA INSPECTOR MODAL */}
      {inspectingTenant && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#5D3FD3] dark:text-purple-400" />
                  <span>User Usage & Quotas Inspector</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{inspectingTenant.name} ({inspectingTenant.ownerEmail})</p>
              </div>
              <button onClick={() => setInspectingTenant(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            {/* Storage Meter Section */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Storage Breakdown (Supabase + Cloudinary)</span>
                <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">
                  {(( (inspectingTenant.supabaseStorageBytes || 0) + (inspectingTenant.cloudinaryStorageBytes || 0) ) / (1024 * 1024)).toFixed(1)} MB / {inspectingTenant.customStorageLimitMb || 5000} MB
                </span>
              </h4>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-blue-600 h-full" 
                  style={{ width: `${Math.min(100, Math.max(0, ((inspectingTenant.supabaseStorageBytes || 0) / ((inspectingTenant.customStorageLimitMb || 5000) * 1024 * 1024)) * 100))}%` }} 
                  title="Supabase Bucket Storage" 
                />
                <div 
                  className="bg-purple-600 h-full" 
                  style={{ width: `${Math.min(100, Math.max(0, ((inspectingTenant.cloudinaryStorageBytes || 0) / ((inspectingTenant.customStorageLimitMb || 5000) * 1024 * 1024)) * 100))}%` }} 
                  title="Cloudinary CDN Assets" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  <span>Supabase: {(((inspectingTenant.supabaseStorageBytes || 0) / (1024 * 1024))).toFixed(1)} MB</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  <span>Cloudinary: {(((inspectingTenant.cloudinaryStorageBytes || 0) / (1024 * 1024))).toFixed(1)} MB</span>
                </div>
              </div>
            </div>

            {/* Zernio Trigger Rates & Channel Quota */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="text-[10px] uppercase font-mono text-purple-700 dark:text-purple-300 font-bold">Zenith Daily Dispatches</div>
                <div className="text-lg font-black text-purple-950 dark:text-purple-100 mt-1">
                  {inspectingTenant.zernioDailyDispatchCount || 0} / {customDailyZernioInput} Posts
                </div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="text-[10px] uppercase font-mono text-amber-800 dark:text-amber-300 font-bold">Zenith Monthly Dispatches</div>
                <div className="text-lg font-black text-amber-950 dark:text-amber-100 mt-1">
                  {inspectingTenant.zernioMonthlyDispatchCount || 142} / {customMonthlyZernioInput} Posts
                </div>
              </div>
            </div>

            {/* Custom Quota Overrides Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              onUpdateTenantLimit(inspectingTenant.id, customAccountsInput);
              try {
                await supabase.from('tenants').update({
                  max_social_accounts: customAccountsInput,
                  custom_zernio_daily_limit: customDailyZernioInput,
                  custom_zernio_monthly_limit: customMonthlyZernioInput,
                  custom_storage_limit_mb: customStorageMbInput
                }).eq('id', inspectingTenant.id);
              } catch { /* ignore offline */ }
              setInspectingTenant(null);
            }} className="space-y-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white">Super Admin Custom Quota Overrides</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Social Accounts</label>
                  <input
                    type="number"
                    value={customAccountsInput}
                    onChange={(e) => setCustomAccountsInput(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs"
                    min={1} max={100}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Storage Limit (MB)</label>
                  <input
                    type="number"
                    value={customStorageMbInput}
                    onChange={(e) => setCustomStorageMbInput(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs"
                    min={100} max={500000}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Zenith Daily Limit</label>
                  <input
                    type="number"
                    value={customDailyZernioInput}
                    onChange={(e) => setCustomDailyZernioInput(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs"
                    min={1} max={5000}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Zenith Monthly Limit</label>
                  <input
                    type="number"
                    value={customMonthlyZernioInput}
                    onChange={(e) => setCustomMonthlyZernioInput(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs"
                    min={10} max={100000}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setInspectingTenant(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer">
                  Close
                </button>
                <button type="submit" className="px-5 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl shadow-md cursor-pointer">
                  Save Custom Quotas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PLAN MODAL */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Subscription Plan</h3>
              <button onClick={() => setShowAddPlanModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan Name</label>
                <input type="text" required value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="e.g. Agency Scale Pro" className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Price</label>
                  <input type="number" required value={planPrice} onChange={(e) => setPlanPrice(Number(e.target.value))} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs" min={0} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                  <select value={planCurrency} onChange={(e) => setPlanCurrency(e.target.value as CurrencyCode)} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-bold">
                    <option value="USD" className="dark:bg-slate-800">USD ($)</option>
                    <option value="INR" className="dark:bg-slate-800">INR (₹)</option>
                    <option value="GBP" className="dark:bg-slate-800">GBP (£)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">API Slots (2 Ch/slot)</label>
                  <input type="number" required value={planSlots} onChange={(e) => setPlanSlots(Number(e.target.value))} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs" min={1} max={50} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">AI Credits / mo</label>
                  <input type="number" required value={planAiCredits} onChange={(e) => setPlanAiCredits(Number(e.target.value))} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs" min={0} max={100000} />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer shadow-md">Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in font-['Inter']">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Edit Subscription Plan</h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditedPlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Plan Name</label>
                <input type="text" required value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Price</label>
                  <input type="number" required value={editingPlan.priceMonthly} onChange={(e) => setEditingPlan({ ...editingPlan, priceMonthly: Number(e.target.value) })} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs" min={0} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                  <select value={editingPlan.currency || 'USD'} onChange={(e) => setEditingPlan({ ...editingPlan, currency: e.target.value as CurrencyCode })} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-bold">
                    <option value="USD" className="dark:bg-slate-800">USD ($)</option>
                    <option value="INR" className="dark:bg-slate-800">INR (₹)</option>
                    <option value="GBP" className="dark:bg-slate-800">GBP (£)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">API Slots (2 Ch/slot)</label>
                  <input type="number" required value={editingPlan.allocatedApiSlots} onChange={(e) => setEditingPlan({ ...editingPlan, allocatedApiSlots: Number(e.target.value) })} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs" min={1} max={50} />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">AI Credits / mo</label>
                  <input type="number" required value={editingPlan.aiCredits ?? 1000} onChange={(e) => setEditingPlan({ ...editingPlan, aiCredits: Number(e.target.value) })} className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs" min={0} max={100000} />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingPlan(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-lg cursor-pointer shadow-md">Save Plan Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
