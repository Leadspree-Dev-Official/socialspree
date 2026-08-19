import { 
  Tenant, 
  SocialAccount, 
  Post, 
  PostLog, 
  GoogleReview, 
  CloudinaryConfig, 
  CloudinaryAccountItem,
  SubscriptionPlan,
  SystemSettings,
  AiCreditLog,
  MediaAsset,
  AgencyBrand
} from '../types';

export const SUPER_ADMIN_EMAIL = ((import.meta as any).env || {}).VITE_SUPPORT_EMAIL || 'leadspree24x7@gmail.com';


// Global System Settings (Currency: USD $, INR ₹, GBP £, AI Key & Default Credits)
export const GLOBAL_SYSTEM_SETTINGS: SystemSettings = {
  currency: 'USD',
  currencySymbol: '$',
  platformName: 'SocialSpree Pro SaaS Engine',
  supportEmail: SUPER_ADMIN_EMAIL,
  aiApiKey: '',
  defaultAiCredits: 1000,
  websiteEnabled: true,
  agencyModeEnabled: false,
  influencerModeEnabled: false,
  businessModeEnabled: true,
  aiCreditsEnabled: false,
  voiceAssistantEnabled: false,
  automationAiEnabled: false,
  zernioEnabled: true,
  coresyncEnabled: true,
  dispatchEngine: 'dual'
};

export function getStoredSystemSettings(): SystemSettings {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('spree_system_settings') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...GLOBAL_SYSTEM_SETTINGS, ...parsed };
    }
  } catch {
    /* ignore storage read error */
  }
  return GLOBAL_SYSTEM_SETTINGS;
}

// Global Subscription Plans (Business, Influencer, and Agency Tiers)
export const INITIAL_PLANS: SubscriptionPlan[] = [
  // 1. FREE PLAN
  {
    id: 'plan-free',
    name: 'Free Starter',
    priceMonthly: 0,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 1,
    maxSocialAccounts: 2,
    maxZernioTriggersPerDay: 2,
    maxZernioTriggersPerMonth: 2,
    maxStorageMb: 500,
    chatGptConnectorAllowed: false,
    aiCredits: 0,
    billingCycle: 'monthly',
    targetRole: 'free',
    features: [
      '2 Social Channel Accounts Maximum',
      '2 Post dispatches per month',
      '500 MB Media Storage',
      'Visual Content Calendar',
      'CoreSync & Zenith Engine Support'
    ]
  },

  // 2. BUSINESS USER MONTHLY PLANS
  {
    id: 'plan-biz-starter',
    name: 'Business Starter',
    priceMonthly: 49,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 2,
    maxSocialAccounts: 4,
    maxZernioTriggersPerMonth: 8,
    maxStorageMb: 1000,
    aiCredits: 0,
    billingCycle: 'monthly',
    targetRole: 'business_user',
    features: [
      '4 Social Accounts',
      '8 Post Dispatches / month',
      'Visual Content Calendar & Queuing',
      'Basic Performance Analytics'
    ]
  },
  {
    id: 'plan-biz-growth',
    name: 'Business Growth',
    priceMonthly: 99,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 2,
    maxSocialAccounts: 4,
    maxZernioTriggersPerMonth: 16,
    maxStorageMb: 2000,
    aiCredits: 0,
    billingCycle: 'monthly',
    targetRole: 'business_user',
    features: [
      '4 Social Accounts',
      '16 Post Dispatches / month',
      'Parallel Multi-Channel Queuing',
      'Full Performance Analytics'
    ]
  },
  {
    id: 'plan-biz-pro',
    name: 'Business Pro',
    priceMonthly: 149,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 3,
    maxSocialAccounts: 6,
    maxZernioTriggersPerMonth: 20,
    maxStorageMb: 5000,
    aiCredits: 0,
    isPopular: true,
    billingCycle: 'monthly',
    targetRole: 'business_user',
    features: [
      '6 Social Accounts',
      '20 Post Dispatches / month',
      'Recurring Social Media Queues',
      'Google Review Sync & Management',
      'Priority Support'
    ]
  },
  {
    id: 'plan-biz-scale',
    name: 'Business Scale',
    priceMonthly: 199,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 3,
    maxSocialAccounts: 6,
    maxZernioTriggersPerMonth: 30,
    maxStorageMb: 10000,
    aiCredits: 0,
    billingCycle: 'monthly',
    targetRole: 'business_user',
    features: [
      '6 Social Accounts',
      '30 Post Dispatches / month',
      'Priority Dispatch Queue',
      'Cloudflare CDN Media Vault'
    ]
  },
  {
    id: 'plan-biz-ultimate',
    name: 'Business Ultimate',
    priceMonthly: 249,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 4,
    maxSocialAccounts: 8,
    maxZernioTriggersPerMonth: 30,
    maxStorageMb: 20000,
    aiCredits: 0,
    billingCycle: 'monthly',
    targetRole: 'business_user',
    features: [
      '8 Social Accounts',
      '30 Post Dispatches / month',
      'High-Velocity Parallel Engines',
      'Multi-Platform CoreSync & Zenith Engines'
    ]
  },

  // 3. PREMIUM BUSINESS YEARLY PLANS
  {
    id: 'plan-prem-biz-prime',
    name: 'Premium Business Unlimited',
    priceMonthly: 417,
    priceYearly: 5000,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 25,
    maxSocialAccounts: 50,
    maxZernioTriggersPerMonth: 100000,
    maxStorageMb: 100000,
    aiCredits: 50000,
    billingCycle: 'yearly',
    targetRole: 'premium_business',
    features: [
      '₹5,000 / year (Billed Annually)',
      'Isolated Cloud Infrastructure (500 MB DB & 1 GB CDN Media Vault)',
      '50,000 Monthly Active User Sessions & Dispatches',
      'Everything Unlimited Social Posting & Accounts',
      'Private Cloud Vault & Daily Automated Backups',
      'Instagram & Facebook Comment Autoresponder Included',
      '24/7 Priority VIP Support'
    ]
  },
  {
    id: 'plan-prem-biz-vault',
    name: 'Premium Business Cloud+',
    priceMonthly: 3000,
    priceYearly: 36000,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 50,
    maxSocialAccounts: 100,
    maxZernioTriggersPerMonth: 1000000,
    maxStorageMb: 500000,
    aiCredits: 200000,
    billingCycle: 'yearly',
    targetRole: 'premium_business',
    features: [
      '₹36,000 / year (Billed Annually)',
      'Pro Dedicated Cloud Infrastructure (Upgraded Compute)',
      '8 GB Database Storage & 100 GB High-Speed Media Vault',
      '250,000 Monthly Active Sessions & High-Volume Parallel Engines',
      'Point-in-Time Recovery & 99.9% Cloud Uptime SLA',
      'Everything Unlimited Social Accounts & Multi-Tenant Channels',
      'Instagram & Facebook Comment Autoresponder Included',
      'Dedicated SLA Account Manager'
    ]
  },

  // 4. INFLUENCER YEARLY PLANS
  {
    id: 'plan-influencer-prime',
    name: 'Influencer Prime',
    priceMonthly: 417,
    priceYearly: 5000,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 25,
    maxSocialAccounts: 50,
    maxZernioTriggersPerMonth: 100000,
    maxStorageMb: 100000,
    aiCredits: 50000,
    billingCycle: 'yearly',
    targetRole: 'influencer',
    features: [
      '₹5,000 / year (Billed Annually)',
      'Isolated Cloud Infrastructure (500 MB DB & 1 GB CDN Storage)',
      '50,000 Monthly Active User Sessions & Dispatches',
      'Everything Unlimited Social Posting & Channels',
      'Private Cloud Media Vault Storage',
      'Instagram & Facebook Comment Autoresponder Included',
      '24/7 Priority VIP Support'
    ]
  },
  {
    id: 'plan-influencer-vault',
    name: 'Influencer Enterprise Vault',
    priceMonthly: 3000,
    priceYearly: 36000,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 50,
    maxSocialAccounts: 100,
    maxZernioTriggersPerMonth: 1000000,
    maxStorageMb: 500000,
    aiCredits: 200000,
    billingCycle: 'yearly',
    targetRole: 'influencer',
    features: [
      '₹36,000 / year (Billed Annually)',
      'Pro Dedicated Cloud Infrastructure (Upgraded Compute)',
      '8 GB Database Storage & 100 GB High-Speed CDN Media Vault',
      '250,000 Monthly Active User Sessions & High-Volume Execution',
      'Point-in-Time Recovery & 99.9% Cloud Uptime SLA',
      'Unlimited Social Accounts & High-Volume Dispatches',
      'Dedicated SLA Technical Account Manager'
    ]
  },

  // 5. AGENCY YEARLY PLANS
  {
    id: 'plan-agency-command',
    name: 'Agency Command',
    priceMonthly: 833,
    priceYearly: 10000,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 50,
    maxSocialAccounts: 100,
    maxZernioTriggersPerMonth: 250000,
    maxStorageMb: 250000,
    aiCredits: 100000,
    billingCycle: 'yearly',
    targetRole: 'agency',
    features: [
      '₹10,000 / year (Billed Annually)',
      'Isolated Cloud Infrastructure (500 MB DB & 1 GB CDN Storage)',
      '50,000 Monthly Active User Sessions & Multi-Brand Workspaces',
      'Everything Unlimited Multi-Brand Channels & Accounts',
      'Private Cloud Media Vault Storage',
      'Instagram & Facebook Comment Autoresponder Included',
      'Full Agency White-Label Branding & Client Roles'
    ]
  },
  {
    id: 'plan-agency-infra',
    name: 'Agency Enterprise Infrastructure',
    priceMonthly: 3333,
    priceYearly: 40000,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 250,
    maxSocialAccounts: 500,
    maxZernioTriggersPerMonth: 5000000,
    maxStorageMb: 1000000,
    aiCredits: 1000000,
    billingCycle: 'yearly',
    targetRole: 'agency',
    features: [
      '₹40,000 / year (Billed Annually)',
      'Pro Dedicated Cloud Infrastructure (Upgraded Compute Cluster)',
      '8 GB Database Storage & 100 GB High-Speed Media Vault',
      '250,000 Monthly Active User Sessions & Multi-Tenant Databases',
      'Point-in-Time Recovery & 99.9% High Availability SLA',
      'Unlimited Client Organizations & Social Channels',
      '24/7 Dedicated SLA & Engineering Support'
    ]
  }
];

// Global Pool of Multiple Default Cloudinary Accounts managed by Super Admin
export const GLOBAL_CLOUDINARY_POOL: CloudinaryAccountItem[] = [
  {
    id: 'cld-master-01',
    label: 'Primary Master Cloudinary CDN',
    cloudName: 'djmww1dwr',
    uploadPreset: 'ml_default',
    bucketName: 'socialspree-media-vault',
    isActiveDefault: true,
  },
  {
    id: 'cld-video-02',
    label: 'High-Speed Video Storage CDN',
    cloudName: 'socialspree_video_cdn',
    uploadPreset: 'socialspree_video_preset',
    bucketName: 'socialspree-video-vault',
    isActiveDefault: false,
  },
  {
    id: 'cld-backup-03',
    label: 'Backup Storage CDN Account',
    cloudName: 'socialspree_backup_cdn',
    uploadPreset: 'socialspree_backup_preset',
    bucketName: 'socialspree-backup-vault',
    isActiveDefault: false,
  }
];

export const GLOBAL_DEFAULT_CLOUDINARY: CloudinaryConfig = {
  cloudName: GLOBAL_CLOUDINARY_POOL[0].cloudName,
  uploadPreset: GLOBAL_CLOUDINARY_POOL[0].uploadPreset,
  bucketName: GLOBAL_CLOUDINARY_POOL[0].bucketName,
  useSuperAdminDefault: true,
  selectedDefaultAccountId: GLOBAL_CLOUDINARY_POOL[0].id,
  accounts: [...GLOBAL_CLOUDINARY_POOL]
};

// Initial Tenants: Master Super Admin Root Account
export const INITIAL_TENANTS: Tenant[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'LeadSpree HQ (Master Super Admin)',
    ownerEmail: SUPER_ADMIN_EMAIL,
    apiKey: '',
    tierPlan: 'pro',
    planId: 'plan-pro',
    allocatedApiSlots: 5, // 5 API slots = 10 social channels
    maxSocialAccounts: 10,
    aiCredits: 1000, // Default 1000 AI Credits
    apiSlotDetails: [
      { id: 'slot-hq-1', slotNumber: 1, slotName: 'API 1', apiKey: '', maxChannels: 2, connectedAccountIds: [] },
      { id: 'slot-hq-2', slotNumber: 2, slotName: 'API 2', apiKey: '', maxChannels: 2, connectedAccountIds: [] },
      { id: 'slot-hq-3', slotNumber: 3, slotName: 'API 3', apiKey: '', maxChannels: 2, connectedAccountIds: [] },
      { id: 'slot-hq-4', slotNumber: 4, slotName: 'API 4', apiKey: '', maxChannels: 2, connectedAccountIds: [] },
      { id: 'slot-hq-5', slotNumber: 5, slotName: 'API 5', apiKey: '', maxChannels: 2, connectedAccountIds: [] },
    ],
    cloudinaryConfig: { ...GLOBAL_DEFAULT_CLOUDINARY },
    status: 'active',
    paymentStatus: 'paid',
    renewalDate: '2026-12-31',
    billingCycle: 'monthly',
    createdAt: '2026-01-01T00:00:00Z',
  }
];

export const INITIAL_AI_LOGS: AiCreditLog[] = [
  {
    id: 'ai-log-1',
    tenantId: '00000000-0000-0000-0000-000000000001',
    tenantName: 'LeadSpree HQ (Master Super Admin)',
    action: 'plan_grant',
    creditsAmount: 1000,
    remainingBalance: 1000,
    description: 'Initial 1,000 Default AI Credits Granted',
    timestamp: new Date().toISOString()
  }
];

export const INITIAL_ACCOUNTS: SocialAccount[] = [];
export const INITIAL_POSTS: Post[] = [];
export const INITIAL_POST_LOGS: PostLog[] = [];
export const INITIAL_REVIEWS: GoogleReview[] = [];

export const INITIAL_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'media-1',
    tenantId: '00000000-0000-0000-0000-000000000001',
    title: 'Brand Launch Campaign Cover',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    type: 'image',
    cloudName: 'djmww1dwr',
    fileSize: '1.2 MB',
    createdAt: new Date().toISOString()
  },
  {
    id: 'media-2',
    tenantId: '00000000-0000-0000-0000-000000000001',
    title: 'SaaS Engine Promo Reel',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'video',
    cloudName: 'socialspree_video_cdn',
    fileSize: '14.8 MB',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

// Storage Persistence Keys
const STORAGE_KEYS = {
  TENANTS: 'socialspree_tenants_v1',
  PLANS: 'socialspree_plans_v1',
  ACCOUNTS: 'socialspree_accounts_v1',
  POSTS: 'socialspree_posts_v1',
  LOGS: 'socialspree_logs_v1',
  SETTINGS: 'socialspree_settings_v1',
  AI_LOGS: 'socialspree_ai_logs_v1',
  MEDIA: 'socialspree_media_v1',
};

export const getStoredTenants = (): Tenant[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TENANTS);
    if (!raw) return INITIAL_TENANTS;
    const tenants = JSON.parse(raw) as Tenant[];
    return tenants.map(({ apiKey, apiSlotDetails, ...tenant }) => ({
      ...tenant,
      apiKey: '',
      apiSlotDetails: apiSlotDetails?.map(slot => ({ ...slot, apiKey: '' }))
    }));
  } catch {
    return INITIAL_TENANTS;
  }
};

export const saveStoredTenants = (tenants: Tenant[]) => {
  try {
    // Provider credentials must not survive in browser storage.
    const safeTenants = tenants.map(({ apiKey, apiSlotDetails, ...tenant }) => ({
      ...tenant,
      apiKey: '',
      apiSlotDetails: apiSlotDetails?.map(slot => ({ ...slot, apiKey: '' }))
    }));
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(safeTenants));
  } catch (err) {
    console.error('Failed to persist tenants:', err);
  }
};

export const getStoredPlans = (): SubscriptionPlan[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLANS);
    if (!raw) return INITIAL_PLANS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.some((p: any) => p.targetRole)) return INITIAL_PLANS;
    return parsed;
  } catch {
    return INITIAL_PLANS;
  }
};

export const saveStoredPlans = (plans: SubscriptionPlan[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  } catch (err) {
    console.error('Failed to persist plans:', err);
  }
};

export const getStoredAccounts = (): SocialAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : INITIAL_ACCOUNTS;
  } catch {
    return INITIAL_ACCOUNTS;
  }
};

export const saveStoredAccounts = (accounts: SocialAccount[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to persist accounts:', err);
  }
};

export const getStoredPosts = (): Post[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    return raw ? JSON.parse(raw) : INITIAL_POSTS;
  } catch {
    return INITIAL_POSTS;
  }
};

export const saveStoredPosts = (posts: Post[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  } catch (err) {
    console.error('Failed to persist posts:', err);
  }
};

export const getStoredAiLogs = (): AiCreditLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_LOGS);
    return raw ? JSON.parse(raw) : INITIAL_AI_LOGS;
  } catch {
    return INITIAL_AI_LOGS;
  }
};

export const saveStoredAiLogs = (logs: AiCreditLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AI_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to persist AI logs:', err);
  }
};

export const getStoredMediaAssets = (): MediaAsset[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEDIA);
    return raw ? JSON.parse(raw) : INITIAL_MEDIA_ASSETS;
  } catch {
    return INITIAL_MEDIA_ASSETS;
  }
};

export const saveStoredMediaAssets = (media: MediaAsset[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(media));
  } catch (err) {
    console.error('Failed to persist media assets:', err);
  }
};

export const INITIAL_BRANDS: AgencyBrand[] = [
  {
    id: 'brand-starbucks',
    agencyTenantId: '00000000-0000-0000-0000-000000000001',
    brandName: 'Starbucks Coffee Co.',
    logoUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=150&auto=format&fit=crop&q=80',
    industry: 'Food & Beverage',
    connectedAccountIds: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-nike',
    agencyTenantId: '00000000-0000-0000-0000-000000000001',
    brandName: 'Nike Athletics Global',
    logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop&q=80',
    industry: 'Apparel & Sports',
    connectedAccountIds: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'brand-techCorp',
    agencyTenantId: '00000000-0000-0000-0000-000000000001',
    brandName: 'Apex Cloud Systems',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    industry: 'Technology & SaaS',
    connectedAccountIds: [],
    createdAt: new Date().toISOString()
  }
];

export const getStoredBrands = (): AgencyBrand[] => {
  try {
    const raw = localStorage.getItem('socialspree_brands_v1');
    return raw ? JSON.parse(raw) : INITIAL_BRANDS;
  } catch {
    return INITIAL_BRANDS;
  }
};

export const saveStoredBrands = (brands: AgencyBrand[]) => {
  try {
    localStorage.setItem('socialspree_brands_v1', JSON.stringify(brands));
  } catch (err) {
    console.error('Failed to persist agency brands:', err);
  }
};
