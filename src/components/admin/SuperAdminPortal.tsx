import React, { useState, useEffect } from 'react';
import { Tenant, CloudinaryConfig, CloudinaryAccountItem, SubscriptionPlan, CurrencyCode, SystemSettings, ApiAllocationSlot, AiCreditLog, EngineProvider, EngineChoice } from '../../types';
import { 
  SUPER_ADMIN_EMAIL, 
  GLOBAL_DEFAULT_CLOUDINARY, 
  GLOBAL_CLOUDINARY_POOL, 
  INITIAL_PLANS, 
  GLOBAL_SYSTEM_SETTINGS,
  getStoredPlans
} from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { plans as cloudPlans } from '../../lib/api';

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
  Cpu
} from 'lucide-react';

export type SuperAdminSubTab = 'dashboard' | 'subscriptions' | 'plans' | 'api_allocation' | 'cloudflare' | 'settings' | 'ai_credits' | 'privileges';

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
  activeSubTab: SuperAdminSubTab;
  onSelectSubTab: (subTab: SuperAdminSubTab) => void;
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
  activeSubTab,
  onSelectSubTab
}) => {
  // System Settings State & 4 Server Mode Toggles
  const [systemCurrency, setSystemCurrency] = useState<CurrencyCode>(GLOBAL_SYSTEM_SETTINGS.currency);
  const [currencySymbol, setCurrencySymbol] = useState<string>(GLOBAL_SYSTEM_SETTINGS.currencySymbol);
  const [platformName, setPlatformName] = useState<string>(GLOBAL_SYSTEM_SETTINGS.platformName);
  const [supportEmail, setSupportEmail] = useState<string>(GLOBAL_SYSTEM_SETTINGS.supportEmail);
  const [aiApiKeyInput, setAiApiKeyInput] = useState<string>(GLOBAL_SYSTEM_SETTINGS.aiApiKey || '');
  const [defaultCreditsInput, setDefaultCreditsInput] = useState<number>(GLOBAL_SYSTEM_SETTINGS.defaultAiCredits || 1000);

  // 4 Primary Server Mode Controls
  const [websiteEnabled, setWebsiteEnabled] = useState<boolean>(GLOBAL_SYSTEM_SETTINGS.websiteEnabled ?? true);
  const [agencyModeEnabled, setAgencyModeEnabled] = useState<boolean>(GLOBAL_SYSTEM_SETTINGS.agencyModeEnabled ?? false);
  const [influencerModeEnabled, setInfluencerModeEnabled] = useState<boolean>(GLOBAL_SYSTEM_SETTINGS.influencerModeEnabled ?? false);
  const [businessModeEnabled, setBusinessModeEnabled] = useState<boolean>(GLOBAL_SYSTEM_SETTINGS.businessModeEnabled ?? true);
  const [aiCreditsEnabled, setAiCreditsEnabled] = useState<boolean>(GLOBAL_SYSTEM_SETTINGS.aiCreditsEnabled ?? false);
  const [voiceAssistantEnabled, setVoiceAssistantEnabled] = useState<boolean>(GLOBAL_SYSTEM_SETTINGS.voiceAssistantEnabled ?? false);
  const [zernioEnabled, setZernioEnabled] = useState<boolean>(GLOBAL_SYSTEM_SETTINGS.zernioEnabled ?? true);
  const [coresyncEnabled, setCoresyncEnabled] = useState<boolean>(GLOBAL_SYSTEM_SETTINGS.coresyncEnabled ?? true);
  const [globalDispatchEngine, setGlobalDispatchEngine] = useState<EngineChoice>(GLOBAL_SYSTEM_SETTINGS.dispatchEngine ?? 'dual');

  const [settingsNotification, setSettingsNotification] = useState<string | null>(null);

  // User Usage & Quota Inspector Modal State
  const [inspectingTenant, setInspectingTenant] = useState<Tenant | null>(null);
  const [customAccountsInput, setCustomAccountsInput] = useState<number>(0);
  const [customDailyZernioInput, setCustomDailyZernioInput] = useState<number>(0);
  const [customMonthlyZernioInput, setCustomMonthlyZernioInput] = useState<number>(0);
  const [customStorageMbInput, setCustomStorageMbInput] = useState<number>(0);

  // Global Cloudinary Pool State
  const [cldPool, setCldPool] = useState<CloudinaryAccountItem[]>(GLOBAL_CLOUDINARY_POOL);
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

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    GLOBAL_SYSTEM_SETTINGS.currency = systemCurrency;
    GLOBAL_SYSTEM_SETTINGS.currencySymbol = currencySymbol;
    GLOBAL_SYSTEM_SETTINGS.platformName = platformName.trim();
    GLOBAL_SYSTEM_SETTINGS.supportEmail = supportEmail.trim();
    if (aiApiKeyInput.trim()) {
      GLOBAL_SYSTEM_SETTINGS.aiApiKey = `••••${aiApiKeyInput.trim().slice(-4)}`;
    }
    GLOBAL_SYSTEM_SETTINGS.defaultAiCredits = defaultCreditsInput;
    GLOBAL_SYSTEM_SETTINGS.websiteEnabled = websiteEnabled;
    GLOBAL_SYSTEM_SETTINGS.agencyModeEnabled = agencyModeEnabled;
    GLOBAL_SYSTEM_SETTINGS.influencerModeEnabled = influencerModeEnabled;
    GLOBAL_SYSTEM_SETTINGS.businessModeEnabled = businessModeEnabled;
    GLOBAL_SYSTEM_SETTINGS.aiCreditsEnabled = aiCreditsEnabled;
    GLOBAL_SYSTEM_SETTINGS.voiceAssistantEnabled = voiceAssistantEnabled;
    GLOBAL_SYSTEM_SETTINGS.zernioEnabled = zernioEnabled;
    GLOBAL_SYSTEM_SETTINGS.coresyncEnabled = coresyncEnabled;
    GLOBAL_SYSTEM_SETTINGS.dispatchEngine = globalDispatchEngine;

    if (aiApiKeyInput.trim() && tenants[0]) {
      const { error } = await supabase.functions.invoke('manage-credentials', { body: { tenantId: tenants[0].id, provider: 'openai', label: 'global', secret: aiApiKeyInput.trim() } });
      if (error) { setSettingsNotification(`AI credential save failed: ${error.message}`); return; }
      setAiApiKeyInput('');
    }
    setSettingsNotification('Global system mode, dispatch engine, and currency settings saved successfully!');
    setTimeout(() => setSettingsNotification(null), 3000);
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
    const startIdx = existingSlots.length;

    const newlyAddedSlots: ApiAllocationSlot[] = apiKeysInput.map((keyVal, idx) => {
      const slotNum = startIdx + idx + 1;
      const prov = apiProvidersInput[idx] || 'zernio';
      return {
        id: crypto.randomUUID(),
        slotNumber: slotNum,
        slotName: `API ${slotNum} (${prov.toUpperCase()})`,
        provider: prov,
        apiKey: keyVal.trim(),
        maxChannels: prov === 'composio' ? 5 : 2,
        connectedAccountIds: []
      };
    });

    const mergedSlots = [...existingSlots, ...newlyAddedSlots];

    for (let index = 0; index < apiKeysInput.length; index++) {
      const secret = apiKeysInput[index].trim();
      const prov = apiProvidersInput[index] || 'zernio';
      const slotNum = startIdx + index + 1;
      if (!secret) continue;
      const { error } = await supabase.functions.invoke('manage-credentials', { 
        body: { 
          tenantId: targetTenantId, 
          provider: prov, 
          label: `slot-${slotNum}`, 
          secret 
        } 
      });
      if (error) { setSettingsNotification(`Credential save failed: ${error.message}`); return; }
    }

    setApiKeysInput(Array(apiCount).fill(''));
    setApiProvidersInput(Array(apiCount).fill('zernio'));
    if (onUpdateTenantApiSlotDetails) {
      onUpdateTenantApiSlotDetails(targetTenantId, mergedSlots);
    }

    setShowAddApiModal(false);
    setSettingsNotification(`Added +${newlyAddedSlots.length} Additional API Slot(s) to ${targetTenant.name}! Total: ${mergedSlots.length} Slots.`);
    setTimeout(() => setSettingsNotification(null), 3500);
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
    if (!customZernioKey.trim()) return;
    const targetTenant = tenants.find(t => t.id === tenantId);
    if (!targetTenant) return;

    const slot = (targetTenant.apiSlotDetails || []).find(s => s.id === slotId);
    if (!slot) return;
    const { error } = await supabase.functions.invoke('manage-credentials', { body: { tenantId, provider: 'zernio', label: `slot-${slot.slotNumber}`, secret: customZernioKey.trim() } });
    if (error) { setSettingsNotification(`Credential save failed: ${error.message}`); return; }

    setEditingKeySlotId(null);
    setCustomZernioKey('');
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
    <div className="max-w-7xl mx-auto space-y-6 font-['Inter'] pb-20 md:pb-0">

      {/* SUB-VIEW 1: DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Total Business Tenants</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{tenants.length}</div>
              </div>
              <Building2 className="w-8 h-8 text-[#5D3FD3] opacity-20" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Allocated API Slots</div>
                <div className="text-2xl font-black text-purple-600 mt-1">{totalAllocatedSlots} Slots</div>
              </div>
              <Layers className="w-8 h-8 text-purple-600 opacity-20" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Total AI Credits</div>
                <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{totalAiCreditsAllocated}</div>
              </div>
              <Sparkles className="w-8 h-8 text-amber-500 opacity-20" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Cloudinary Pool</div>
                <div className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-4 h-4" /> {cldPool.length} Active Accounts
                </div>
              </div>
              <HardDrive className="w-8 h-8 text-emerald-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Tenant Organizations & System Overview</h3>
                <p className="text-[11px] text-slate-500">Super Admin overview of client tenants, API key slots, and AI credits</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-[#5D3FD3] text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Provision Tenant</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-mono text-[9px] tracking-wider">
                  <tr>
                    <th className="px-3 py-2">Tenant / Org</th>
                    <th className="px-3 py-2">Owner Email</th>
                    <th className="px-3 py-2">Slots</th>
                    <th className="px-3 py-2">Dispatch Engine</th>
                    <th className="px-3 py-2">AI Credits</th>
                    <th className="px-3 py-2">Tier Plan</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900 text-xs whitespace-nowrap" title={`Tenant ID: ${tenant.id}`}>
                          {tenant.name}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-800 text-[11px] whitespace-nowrap">{tenant.ownerEmail}</td>
                      <td className="px-3 py-2 font-mono font-bold text-purple-900 text-[11px] whitespace-nowrap">
                        {tenant.allocatedApiSlots || 2} Slots ({ (tenant.allocatedApiSlots || 2) * 2 } Ch)
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={tenant.dispatchEngine || 'dual'}
                          onChange={(e) => handleUpdateTenantDispatchEngine(tenant.id, e.target.value as any)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-900 border border-blue-200 cursor-pointer hover:bg-blue-100 shadow-xs"
                        >
                          <option value="dual">Dual Engine (Zenith+CoreSync)</option>
                          <option value="coresync">CoreSync Engine</option>
                          <option value="zenith">Zenith Engine</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-amber-700 text-[11px] whitespace-nowrap">
                        ⚡ {tenant.aiCredits ?? 1000} Credits
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={tenant.tierPlan || 'free'}
                          onChange={(e) => handleUpdateTenantTierPlan(tenant.id, e.target.value)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-50 text-purple-900 border border-purple-200 cursor-pointer hover:bg-purple-100 shadow-xs"
                        >
                          <option value="free">Free Plan</option>
                          <option value="starter">Starter</option>
                          <option value="pro">Pro / Influencer</option>
                          <option value="agency">Agency Tier</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          tenant.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenUserInspector(tenant)}
                            title="Inspect Storage & Quotas"
                            className="px-2 py-0.5 bg-purple-50 text-purple-900 hover:bg-purple-100 rounded text-[10px] font-bold border border-purple-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-purple-700" />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => onSelectSubTab('ai_credits')}
                            title="Top-Up AI Credits"
                            className="px-2 py-0.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded text-[10px] font-bold border border-amber-200 cursor-pointer"
                          >
                            + Credits
                          </button>
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
          <form onSubmit={handleSaveSystemSettings} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Key className="w-4 h-4 text-[#5D3FD3]" />
              <span>Global AI Provider Secret API Key</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Global AI API Key (Gemini API / OpenAI API)</label>
                <input
                  type="text"
                  value={aiApiKeyInput}
                  onChange={(e) => setAiApiKeyInput(e.target.value)}
                  placeholder="Optional: Enter new key to update"
                  className="w-full p-2.5 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default AI Credits for New Provisioned Tenants</label>
                <input
                  type="number"
                  required
                  value={defaultCreditsInput}
                  onChange={(e) => setDefaultCreditsInput(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-amber-500"
                  min={100}
                  max={50000}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-[#5D3FD3] text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save AI Configuration</span>
              </button>
            </div>
          </form>

          {/* AI Credit Deduction & Grant Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-600" />
                  <span>Real-Time AI Credit Deduction & Audit Logs</span>
                </h3>
                <p className="text-xs text-slate-500">Full audit log of when and for what AI credits were deducted or granted across all tenants</p>
              </div>

              <button
                onClick={() => setShowTopupModal(true)}
                className="px-3.5 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Grant Credits</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Tenant / Organization</th>
                    <th className="px-4 py-3">Action & Description</th>
                    <th className="px-4 py-3">Credit Change</th>
                    <th className="px-4 py-3 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {aiLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">No AI credit activity logs recorded yet.</td>
                    </tr>
                  ) : (
                    aiLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {log.tenantName || log.tenantId}
                        </td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium">
                          {log.description}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            log.creditsAmount < 0 ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {log.creditsAmount > 0 ? `+${log.creditsAmount}` : log.creditsAmount} Credits
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-purple-900">
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

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#5D3FD3]" />
                  <span>Subscription & Billing Control Console</span>
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Tenant Organization</th>
                    <th className="px-4 py-3">Assigned Plan</th>
                    <th className="px-4 py-3">Payment Status</th>
                    <th className="px-4 py-3">Renewal Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{tenant.name}</td>
                      <td className="px-4 py-3.5">
                        <select
                          value={tenant.planId || ''}
                          onChange={(e) => onUpdateTenantPlan && onUpdateTenantPlan(tenant.id, e.target.value)}
                          className="p-1.5 border border-slate-300 rounded text-xs bg-white font-bold"
                        >
                          <option value="">Standard Tier</option>
                          {plans.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({getSymbol(p.currency)}{p.priceMonthly}/mo)</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5 font-bold">
                        <select
                          value={tenant.paymentStatus || 'paid'}
                          onChange={(e) => onUpdateTenantPaymentStatus && onUpdateTenantPaymentStatus(tenant.id, e.target.value as any)}
                          className="p-1 border rounded text-[11px] font-mono"
                        >
                          <option value="paid">Paid ✓</option>
                          <option value="unpaid">Unpaid ⚠️</option>
                          <option value="overdue">Overdue ✖</option>
                          <option value="trial">Trial 🎁</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 font-mono">{tenant.renewalDate || '2026-12-31'}</td>
                      <td className="px-4 py-3.5 font-bold">{tenant.status}</td>
                      <td className="px-4 py-3.5 text-right">
                        {tenant.ownerEmail !== SUPER_ADMIN_EMAIL && (
                          <button onClick={() => onDeleteTenant(tenant.id)} className="text-red-600 hover:text-red-800 font-bold">
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
      {activeSubTab === 'plans' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#5D3FD3]" />
                <span>Multi-Currency Plans with Included AI Credits</span>
              </h3>
            </div>
            <button
              onClick={() => setShowAddPlanModal(true)}
              className="px-4 py-2 bg-[#5D3FD3] text-white rounded-xl text-xs font-bold hover:bg-purple-700"
            >
              + Create Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white border-2 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-lg">{plan.name}</h4>
                  <button onClick={() => setEditingPlan({ ...plan })} className="text-[#5D3FD3] font-bold text-xs">Edit</button>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {getSymbol(plan.currency)}{plan.priceMonthly}/mo
                </div>
                <div className="p-3 bg-purple-50 rounded-xl text-xs font-mono font-bold text-purple-900 space-y-1">
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#5D3FD3]" />
                <span>Zenith API Slot Provisioning Console</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Line-by-line allocation of secret API keys. Each API key slot yields 2 connected social channels.</p>
            </div>
            <button
              onClick={() => setShowAddApiModal(true)}
              className="px-4 py-2.5 bg-[#5D3FD3] text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
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

              return (
                <div key={t.id} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                          {t.tierPlan}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-500" title={`Tenant Workspace ID: ${t.id}`}>{t.ownerEmail}</div>
                    </div>

                    <div className="text-xs font-mono font-bold text-purple-900 bg-white px-3 py-1.5 rounded-xl border border-purple-200 shadow-2xs">
                      ⚡ {slots.length} API Key Slots ({slots.length * 2} Social Channels)
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slots.map((slot) => {
                      const isKeyVisible = showKeyVisible[slot.id];
                      const isEditingThisSlot = editingKeySlotId === slot.id;

                      return (
                        <div key={slot.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-bold font-mono text-[11px]">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                                {slot.slotName || `API Slot #${slot.slotNumber}`}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                                slot.provider === 'composio' 
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {slot.provider === 'composio' ? '🧩 COMPOSIO' : '⚡ ZERNIO (2 CH)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => toggleKeyVisibility(slot.id)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded"
                                title="Toggle Key Visibility"
                              >
                                {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              {slots.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSingleSlot(t.id, slot.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded"
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
                                className="flex-1 p-1.5 border border-purple-300 rounded font-mono text-xs bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveSingleSlotKey(t.id, slot.id)}
                                className="px-2.5 py-1 bg-[#5D3FD3] text-white rounded font-bold text-[11px]"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingKeySlotId(null)}
                                className="px-2 py-1 bg-slate-100 text-slate-600 rounded font-semibold text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono text-xs">
                              <span className="text-slate-800 font-semibold truncate max-w-[220px]">
                                {slot.apiKey && slot.apiKey.trim().length > 0 
                                  ? (isKeyVisible ? slot.apiKey : '••••••••••••••••••••••••')
                                  : <span className="text-slate-400 font-normal italic text-[11px]">Blank (No Key Configured)</span>
                                }
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingKeySlotId(slot.id);
                                  setCustomZernioKey('');
                                }}
                                className="text-purple-700 hover:underline font-bold text-[11px] shrink-0"
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

      {/* CLOUDINARY & CLOUDFLARE TAB */}
      {activeSubTab === 'cloudflare' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <span>Cloudinary Accounts Pool</span>
              </h3>
              <button onClick={handleOpenAddCldModal} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs">
                + Add Account
              </button>
            </div>

            {cldPool.map(acc => (
              <div key={acc.id} className="p-3 border rounded-xl flex justify-between items-center text-xs">
                <div>
                  <strong className="text-slate-900">{acc.label}</strong> &mdash; Cloud: <code className="text-blue-900">{acc.cloudName}</code> | Preset: <code>{acc.uploadPreset}</code>
                </div>
                <button onClick={() => handleOpenEditCldModal(acc)} className="text-blue-600 font-bold">Edit</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SYSTEM SETTINGS & SERVER MODE SWITCHES TAB */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSystemSettings} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 animate-in fade-in">
          {settingsNotification && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{settingsNotification}</span>
            </div>
          )}

          {/* 4 SERVER MODE SWITCHES */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#5D3FD3]" />
                  <span>Deployment Mode Controls & Mutual Exclusivity Switches</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded uppercase">
                  Super Admin Exclusive
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure server mode deployment behavior. Enabling Agency or Influencer mode automatically sets Business User mode and Public Website to OFF for isolated server deployments.
              </p>
            </div>

            {/* 1-CLICK SERVER PROFILE PRESETS */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Quick 1-Click Server Profile Presets</span>
                <span className="text-[10px] text-slate-500 font-mono">Instant Auto-Mutex Configuration</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleToggleMode('agency')}
                  className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 font-bold rounded-lg text-left"
                >
                  🏢 Dedicated Agency Server Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode('influencer')}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 font-bold rounded-lg text-left"
                >
                  ✨ Influencer Creator Instance Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode('business')}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 font-bold rounded-lg text-left"
                >
                  🚀 Standard Business SaaS Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TOGGLE 1: WEBSITE */}
              <div className={`p-4 rounded-xl border transition-all ${websiteEnabled ? 'bg-purple-50/50 border-purple-300' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className={`w-5 h-5 ${websiteEnabled ? 'text-purple-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Public Website Landing Page</div>
                      <div className="text-[10px] text-slate-500">Enable multi-page marketing landing system</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('website')}
                    disabled={agencyModeEnabled || influencerModeEnabled}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${websiteEnabled ? 'bg-purple-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${websiteEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE 2: AGENCY MODE */}
              <div className={`p-4 rounded-xl border transition-all ${agencyModeEnabled ? 'bg-purple-900/10 border-purple-500 ring-2 ring-purple-500/20' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className={`w-5 h-5 ${agencyModeEnabled ? 'text-purple-700' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Agency Mode</span>
                        {agencyModeEnabled && <span className="bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">Multi-brand management suite & workspace switcher</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('agency')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${agencyModeEnabled ? 'bg-purple-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${agencyModeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE 3: INFLUENCER MODE */}
              <div className={`p-4 rounded-xl border transition-all ${influencerModeEnabled ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className={`w-5 h-5 ${influencerModeEnabled ? 'text-amber-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Influencer / Creator Mode</span>
                        {influencerModeEnabled && <span className="bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">Creator grid planner & personal media vault</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('influencer')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${influencerModeEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${influencerModeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE 4: BUSINESS USER MODE */}
              <div className={`p-4 rounded-xl border transition-all ${businessModeEnabled ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className={`w-5 h-5 ${businessModeEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Business User Mode</span>
                        {businessModeEnabled && <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">Standard single business user workspace</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleMode('business')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${businessModeEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${businessModeEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI & VOICE FEATURE TOGGLES */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>AI & Voice Engine Feature Controls</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Instantly turn ON or OFF experimental AI features for regular workspace users. When OFF, features and balances are completely hidden from user views.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TOGGLE 5: AI CREDITS & SETTINGS */}
              <div className={`p-4 rounded-xl border transition-all ${aiCreditsEnabled ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Coins className={`w-5 h-5 ${aiCreditsEnabled ? 'text-amber-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>AI Content Credits & Settings</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${aiCreditsEnabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>
                          {aiCreditsEnabled ? 'ACTIVE (USER VISIBLE)' : 'DISABLED (HIDDEN)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">Unpublish/hide AI credits & generation from regular users</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiCreditsEnabled(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aiCreditsEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiCreditsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE 6: VOICE AI ASSISTANT */}
              <div className={`p-4 rounded-xl border transition-all ${voiceAssistantEnabled ? 'bg-purple-50 border-purple-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-5 h-5 ${voiceAssistantEnabled ? 'text-purple-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Voice AI Assistant (Web Speech API)</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${voiceAssistantEnabled ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {voiceAssistantEnabled ? 'ACTIVE (USER VISIBLE)' : 'DISABLED (HIDDEN)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">Enable/disable floating voice assistant widget and Alt+V shortcut</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceAssistantEnabled(prev => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${voiceAssistantEnabled ? 'bg-purple-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${voiceAssistantEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ENGINE CONTROLS: TURN OFF ZERNIO (ZENITH) OR CORESYNC (COMPOSIO) */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#5D3FD3]" />
                  <span>Dispatch Engine Switches (Zenith / Zernio vs CoreSync / Composio)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
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
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>⚡ Dual Parallel Engine</span>
                  {globalDispatchEngine === 'dual' && <span className="text-[9px] bg-purple-500 text-white px-1.5 py-0.2 rounded">ACTIVE</span>}
                </div>
                <div className={`text-[10px] mt-1 ${globalDispatchEngine === 'dual' ? 'text-purple-200' : 'text-slate-500'}`}>
                  Zenith & CoreSync both enabled with parallel fallback
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGlobalEngine('zenith')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  globalDispatchEngine === 'zenith'
                    ? 'bg-emerald-950 text-white border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>🚀 Zenith (Zernio) Only</span>
                  {globalDispatchEngine === 'zenith' && <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">ACTIVE</span>}
                </div>
                <div className={`text-[10px] mt-1 ${globalDispatchEngine === 'zenith' ? 'text-emerald-200' : 'text-slate-500'}`}>
                  Direct Native 2-Channel Slots (CoreSync turned OFF)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGlobalEngine('coresync')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  globalDispatchEngine === 'coresync'
                    ? 'bg-blue-950 text-white border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>🔗 CoreSync (Composio) Only</span>
                  {globalDispatchEngine === 'coresync' && <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.2 rounded">ACTIVE</span>}
                </div>
                <div className={`text-[10px] mt-1 ${globalDispatchEngine === 'coresync' ? 'text-blue-200' : 'text-slate-500'}`}>
                  Enterprise OAuth Bridge (Zenith turned OFF)
                </div>
              </button>
            </div>

            {/* Individual Engine Toggle Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* TOGGLE: ZENITH / ZERNIO */}
              <div className={`p-4 rounded-xl border transition-all ${zernioEnabled ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className={`w-5 h-5 ${zernioEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Zenith Engine (Zernio Provider)</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${zernioEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {zernioEnabled ? 'ENABLED (ONLINE)' : 'DISABLED (OFFLINE)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">Fast 2-channel slot direct parallel dispatcher</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleEngine('zenith')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${zernioEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${zernioEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* TOGGLE: CORESYNC / COMPOSIO */}
              <div className={`p-4 rounded-xl border transition-all ${coresyncEnabled ? 'bg-blue-50/70 border-blue-300' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className={`w-5 h-5 ${coresyncEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>CoreSync Engine (Composio Provider)</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${coresyncEnabled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {coresyncEnabled ? 'ENABLED (ONLINE)' : 'DISABLED (OFFLINE)'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">Enterprise authentication bridge & token pooling</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleEngine('coresync')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${coresyncEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${coresyncEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Global Currency Preference</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleCurrencyChange('USD')}
                className={`p-3 border rounded-xl font-bold text-xs transition-all ${systemCurrency === 'USD' ? 'bg-[#5D3FD3] text-white border-[#5D3FD3]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => handleCurrencyChange('INR')}
                className={`p-3 border rounded-xl font-bold text-xs transition-all ${systemCurrency === 'INR' ? 'bg-[#5D3FD3] text-white border-[#5D3FD3]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                INR (₹)
              </button>
              <button
                type="button"
                onClick={() => handleCurrencyChange('GBP')}
                className={`p-3 border rounded-xl font-bold text-xs transition-all ${systemCurrency === 'GBP' ? 'bg-[#5D3FD3] text-white border-[#5D3FD3]' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                GBP (£)
              </button>
            </div>
          </div>

          <button type="submit" className="px-6 py-2.5 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md">
            Save System Settings & Mode Controls
          </button>
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Master Authority Level</div>
                <div className="text-xl font-black text-purple-900 mt-1">Tier-0 Global</div>
              </div>
              <Crown className="w-7 h-7 text-amber-500" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Managed Tenant Orgs</div>
                <div className="text-xl font-black text-slate-900 mt-1">{tenants.length} Workspaces</div>
              </div>
              <Building2 className="w-7 h-7 text-blue-600 opacity-80" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">System Role Profiles</div>
                <div className="text-xl font-black text-emerald-700 mt-1">4 Active Roles</div>
              </div>
              <Sliders className="w-7 h-7 text-emerald-600 opacity-80" />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase font-mono">Privilege Override Status</div>
                <div className="text-xl font-black text-amber-600 mt-1">Enforced</div>
              </div>
              <Zap className="w-7 h-7 text-amber-500 opacity-80" />
            </div>
          </div>

          {/* Role Permissions Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#5D3FD3]" />
                  <span>Platform System Role Privileges Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Granular permission control mapping across Super Admin and Tenant organizational roles.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Permission / Action Capability</th>
                    <th className="py-3 px-4 text-center font-bold text-purple-900">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-black">Super Admin</span>
                    </th>
                    <th className="py-3 px-4 text-center font-bold text-blue-900">Tenant Owner</th>
                    <th className="py-3 px-4 text-center font-bold text-emerald-900">Content Manager</th>
                    <th className="py-3 px-4 text-center font-bold text-slate-700">Auditor (Read-Only)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>Provision & Delete Tenant Accounts</div>
                      <div className="text-[10px] text-slate-400 font-mono">Manage multi-tenant organizations & workspace keys</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>Allocate 2-Channel API Slots</div>
                      <div className="text-[10px] text-slate-400 font-mono">Assign Zernio API keys & slot limits per tenant</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>Grant & Top-up AI Credits</div>
                      <div className="text-[10px] text-slate-400 font-mono">Manually add bonus AI tokens to tenant balances</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>Configure Subscription Plans & Pricing</div>
                      <div className="text-[10px] text-slate-400 font-mono">Edit pricing tiers, USD/INR/GBP currencies & features</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>Connect Social Media Accounts & Webhooks</div>
                      <div className="text-[10px] text-slate-400 font-mono">Link Instagram, Facebook, LinkedIn, TikTok & X profiles</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>Create, Schedule & Auto-Publish Posts</div>
                      <div className="text-[10px] text-slate-400 font-mono">Use Post Composer, Media Vault & Calendar Grid</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><X className="w-4 h-4 text-slate-300 mx-auto" /></td>
                  </tr>

                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>View Activity Logs & Revenue Reports</div>
                      <div className="text-[10px] text-slate-400 font-mono">Access real-time analytics & HTTP dispatch logs</div>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                    <td className="py-3.5 px-4 text-center"><Check className="w-5 h-5 text-emerald-600 mx-auto font-black" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TOP UP AI CREDITS MODAL */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Grant / Top-Up Tenant AI Credits</span>
              </h3>
              <button onClick={() => setShowTopupModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleTopupSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Tenant Organization</label>
                <select
                  value={topupTenantId}
                  onChange={(e) => setTopupTenantId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white font-bold"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.aiCredits ?? 1000} Current Credits)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credits Amount to Add</label>
                <input
                  type="number"
                  required
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg font-mono text-xs"
                  min={50}
                  max={50000}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Audit Reason</label>
                <input
                  type="text"
                  required
                  value={topupReason}
                  onChange={(e) => setTopupReason(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md"
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
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-200 shadow-2xl space-y-4 font-['Inter']">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Provision API Slots & Engines</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Allocate Zernio (2 Channels max) or Composio (Multi-Channel AI) API slots to any user workspace.</p>
              </div>
              <button onClick={() => setShowAddApiModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveApiSlotsModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select User / Tenant Workspace</label>
                
                {/* Search Bar for Tenant Filter */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search user name, email, or workspace..."
                    value={tenantSearchQuery}
                    onChange={(e) => setTenantSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5D3FD3] transition-all"
                  />
                </div>

                <select
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white font-bold text-xs focus:ring-2 focus:ring-[#5D3FD3]"
                >
                  {tenants
                    .filter(t => 
                      t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) || 
                      t.ownerEmail.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                    )
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.ownerEmail}) — [{t.tierPlan.toUpperCase()}]
                      </option>
                    ))
                  }
                </select>
                {tenants.filter(t => t.name.toLowerCase().includes(tenantSearchQuery.toLowerCase()) || t.ownerEmail.toLowerCase().includes(tenantSearchQuery.toLowerCase())).length === 0 && (
                  <p className="text-[11px] text-amber-600 font-semibold mt-1">No matching users found for "{tenantSearchQuery}"</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Number of API Slots to Provision</label>
                <input
                  type="number"
                  value={apiCount}
                  onChange={(e) => handleApiCountChange(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-[#5D3FD3]"
                  min={1}
                  max={20}
                />
              </div>

              <div className="space-y-3 pt-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {apiKeysInput.map((keyVal, idx) => {
                  const currentProv = apiProvidersInput[idx] || 'zernio';
                  return (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
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
                          className="p-1.5 text-[11px] font-bold border border-purple-200 rounded-lg bg-white text-purple-950 focus:ring-2 focus:ring-[#5D3FD3]"
                        >
                          <option value="zernio">⚡ Zernio Engine (2 Channels Max)</option>
                          <option value="composio">🧩 Composio Engine (Multi-Channel AI)</option>
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
                        className="w-full p-2 border rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-[#5D3FD3]"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddApiModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#5D3FD3] hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition-colors">Save API Slots</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOUDINARY MODAL */}
      {showCldModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Cloudinary Account</h3>
              <button onClick={() => setShowCldModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleSaveCldModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Label</label>
                <input type="text" value={cldLabelInput} onChange={(e) => setCldLabelInput(e.target.value)} className="w-full p-2.5 border rounded-lg text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cloud Name</label>
                <input type="text" value={cldCloudNameInput} onChange={(e) => setCldCloudNameInput(e.target.value)} className="w-full p-2.5 border rounded-lg font-mono text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Upload Preset</label>
                <input type="text" value={cldUploadPresetInput} onChange={(e) => setCldUploadPresetInput(e.target.value)} className="w-full p-2.5 border rounded-lg font-mono text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Storage Bucket Name</label>
                <input type="text" value={cldBucketNameInput} onChange={(e) => setCldBucketNameInput(e.target.value)} className="w-full p-2.5 border rounded-lg font-mono text-xs" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCldModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVISION TENANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Provision Client Tenant</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Organization Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 border rounded-lg text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Owner Email</label>
                <input type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} className="w-full p-2.5 border rounded-lg text-xs" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan</label>
                <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className="w-full p-2.5 border rounded-lg bg-white font-bold">
                  <option value="">Custom Tier</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.allocatedApiSlots} slots - {p.aiCredits ?? 1000} AI Credits)</option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[#5D3FD3] text-white font-bold rounded-lg">Provision</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER STORAGE & QUOTA INSPECTOR MODAL */}
      {inspectingTenant && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#5D3FD3]" />
                  <span>User Usage & Quotas Inspector</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{inspectingTenant.name} ({inspectingTenant.ownerEmail})</p>
              </div>
              <button onClick={() => setInspectingTenant(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            {/* Storage Meter Section */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center justify-between">
                <span>Storage Breakdown (Supabase + Cloudinary)</span>
                <span className="font-mono text-purple-700 font-bold">
                  {(( (inspectingTenant.supabaseStorageBytes || 240000000) + (inspectingTenant.cloudinaryStorageBytes || 650000000) ) / (1024 * 1024)).toFixed(1)} MB / {inspectingTenant.customStorageLimitMb || 5000} MB
                </span>
              </h4>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                <div className="bg-blue-600 h-full" style={{ width: '35%' }} title="Supabase Bucket Storage" />
                <div className="bg-purple-600 h-full" style={{ width: '45%' }} title="Cloudinary CDN Assets" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-blue-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  <span>Supabase: {((inspectingTenant.supabaseStorageBytes || 240000000) / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
                <div className="flex items-center gap-1.5 text-purple-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                  <span>Cloudinary: {((inspectingTenant.cloudinaryStorageBytes || 650000000) / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              </div>
            </div>

            {/* Zernio Trigger Rates & Channel Quota */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-[10px] uppercase font-mono text-purple-700 font-bold">Zenith Daily Dispatches</div>
                <div className="text-lg font-black text-purple-950 mt-1">
                  {inspectingTenant.zernioDailyDispatchCount || 14} / {customDailyZernioInput} Posts
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-[10px] uppercase font-mono text-amber-800 font-bold">Zenith Monthly Dispatches</div>
                <div className="text-lg font-black text-amber-950 mt-1">
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
            }} className="space-y-3 pt-2 text-xs border-t border-slate-100">
              <h4 className="font-bold text-slate-900">Super Admin Custom Quota Overrides</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Social Accounts</label>
                  <input
                    type="number"
                    value={customAccountsInput}
                    onChange={(e) => setCustomAccountsInput(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono text-xs"
                    min={1} max={100}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Storage Limit (MB)</label>
                  <input
                    type="number"
                    value={customStorageMbInput}
                    onChange={(e) => setCustomStorageMbInput(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono text-xs"
                    min={100} max={500000}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zenith Daily Limit</label>
                  <input
                    type="number"
                    value={customDailyZernioInput}
                    onChange={(e) => setCustomDailyZernioInput(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono text-xs"
                    min={1} max={5000}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zenith Monthly Limit</label>
                  <input
                    type="number"
                    value={customMonthlyZernioInput}
                    onChange={(e) => setCustomMonthlyZernioInput(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono text-xs"
                    min={10} max={100000}
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setInspectingTenant(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">
                  Close
                </button>
                <button type="submit" className="px-5 py-2 bg-[#5D3FD3] text-white font-bold rounded-xl shadow-md">
                  Save Custom Quotas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
