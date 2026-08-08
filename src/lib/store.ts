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
  MediaAsset
} from '../types';

export const SUPER_ADMIN_EMAIL = ((import.meta as any).env || {}).VITE_SUPPORT_EMAIL || 'leadspree24x7@gmail.com';


// Global System Settings (Currency: USD $, INR ₹, GBP £, AI Key & Default Credits)
export const GLOBAL_SYSTEM_SETTINGS: SystemSettings = {
  currency: 'USD',
  currencySymbol: '$',
  platformName: 'SocialSpree Pro SaaS Engine',
  supportEmail: SUPER_ADMIN_EMAIL,
  aiApiKey: '',
  defaultAiCredits: 1000
};

// Global Subscription Plans (Multi-Currency Regional Plans with AI Credits)
export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter Plan (US/Global)',
    priceMonthly: 19,
    currency: 'USD',
    currencySymbol: '$',
    allocatedApiSlots: 1, // 1 API key = 2 social channels
    maxSocialAccounts: 2,
    aiCredits: 500,
    features: [
      '1 Zernio API Key Slot (2 Social Channels)',
      '500 AI Content & Hashtag Credits/mo',
      'Instant & Scheduled Posting',
      'Cloudflare & Cloudinary CDN Integration',
      'Basic Activity Audit Logs'
    ]
  },
  {
    id: 'plan-pro',
    name: 'Pro Agency Plan (India Region)',
    priceMonthly: 1499,
    currency: 'INR',
    currencySymbol: '₹',
    allocatedApiSlots: 3, // 3 API keys = 6 social channels firing in parallel
    maxSocialAccounts: 6,
    aiCredits: 2500,
    isPopular: true,
    features: [
      '3 Zernio API Key Slots (6 Social Channels)',
      '2,500 AI Content & Hashtag Credits/mo',
      'Parallel Key Firing Engine',
      'Cloud Native Execution & Webhooks',
      'Google Review Auto-AI Responder',
      'Priority Super Admin Support'
    ]
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Agency Tier (UK/EU)',
    priceMonthly: 119,
    currency: 'GBP',
    currencySymbol: '£',
    allocatedApiSlots: 10, // 10 API keys = 20 social channels
    maxSocialAccounts: 20,
    aiCredits: 10000,
    features: [
      '10 Zernio API Key Slots (20 Social Channels)',
      '10,000 AI Content & Hashtag Credits/mo',
      'Unlimited Parallel Dispatch Engine',
      'Custom Storage Buckets & CDN',
      'Dedicated Account Manager & SLA'
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
    return raw ? JSON.parse(raw) : INITIAL_PLANS;
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
