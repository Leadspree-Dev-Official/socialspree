export type SocialPlatform = 
  | 'instagram' 
  | 'facebook' 
  | 'linkedin' 
  | 'youtube' 
  | 'x' 
  | 'google_business' 
  | 'tiktok' 
  | 'threads' 
  | 'bluesky' 
  | 'pinterest' 
  | 'reddit' 
  | 'telegram' 
  | 'discord' 
  | 'whatsapp' 
  | 'snapchat';

export type CurrencyCode = 'USD' | 'INR' | 'GBP';

export interface MediaAsset {
  id: string;
  tenantId: string;
  title: string;
  url: string;
  type: 'image' | 'video';
  cloudName?: string;
  fileSize?: string;
  createdAt: string;
}

export interface CloudinaryAccountItem {
  id: string;
  label: string; // Account Label
  cloudName: string; // e.g. djmww1dwr
  uploadPreset: string; // e.g. ml_default
  bucketName: string; // Storage Bucket Name (e.g. socialspree-media-vault)
  isActiveDefault: boolean;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  bucketName?: string;
  useSuperAdminDefault: boolean;
  selectedDefaultAccountId?: string;
  accounts?: CloudinaryAccountItem[]; // Array of multiple Cloudinary accounts
}

// 2-Channel API Allocation Slot (Each API key provided by Super Admin yields 2 social channels)
export interface ApiAllocationSlot {
  id: string;
  slotNumber: number; // e.g. 1, 2, 3
  slotName?: string; // e.g. "API 1", "API 2", "API 3"
  apiKey: string; // Secret API Key provided by Super Admin
  maxChannels: number; // Always 2 channels per API key slot
  connectedAccountIds: string[]; // Connected channel IDs in this slot
}

export interface AiCreditLog {
  id: string;
  tenantId: string;
  tenantName?: string;
  action: 'text_generation' | 'hashtag_generation' | 'superadmin_topup' | 'plan_grant';
  creditsAmount: number; // e.g. -10 or +500
  remainingBalance: number;
  description: string;
  timestamp: string;
}

export interface AgencyBrand {
  id: string;
  agencyTenantId: string;
  brandName: string;
  logoUrl?: string;
  industry?: string;
  connectedAccountIds: string[];
  createdAt: string;
}

export interface ChatGPTKeyConfig {
  id: string;
  tenantId: string;
  keyLabel: string;
  apiKey: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly?: number;
  billingCycle?: 'monthly' | 'yearly';
  targetRole?: 'free' | 'business_user' | 'premium_business' | 'influencer' | 'agency' | 'all';
  currency: CurrencyCode;
  currencySymbol: string; // '$', '₹', '£'
  allocatedApiSlots: number; // Number of 2-channel API slots (e.g. 1 slot = 2 accounts, 3 slots = 6 accounts)
  maxSocialAccounts: number; // allocatedApiSlots * 2
  maxZernioTriggersPerDay?: number;
  maxZernioTriggersPerMonth?: number;
  maxStorageMb?: number;
  chatGptConnectorAllowed?: boolean;
  aiCredits: number; // AI Credits included in plan per month
  features: string[];
  isPopular?: boolean;
}

export type EngineChoice = 'zenith' | 'coresync' | 'dual';

export interface SystemSettings {
  currency: CurrencyCode;
  currencySymbol: string; // '$', '₹', '£'
  platformName: string;
  supportEmail: string;
  aiApiKey?: string;
  composioApiKey?: string;
  dispatchEngine?: EngineChoice;
  defaultDispatchEngine?: EngineChoice;
  defaultAiCredits?: number;
  websiteEnabled?: boolean;
  agencyModeEnabled?: boolean;
  influencerModeEnabled?: boolean;
  businessModeEnabled?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  ownerEmail: string;
  apiKey: string; // Master Primary API Key
  tierPlan: 'free' | 'pro' | 'agency' | string;
  planId?: string;
  dispatchEngine?: EngineChoice;
  enabledEngines?: ('zenith' | 'coresync')[];
  agencySlotBundleLimit?: number;
  agencyMaxBrands?: number;
  composioApiKey?: string;
  allocatedApiSlots: number; // Number of 2-channel API keys allocated by Super Admin
  maxSocialAccounts: number; // allocatedApiSlots * 2
  customZernioDailyLimit?: number;
  customZernioMonthlyLimit?: number;
  customStorageLimitMb?: number;
  zernioDailyDispatchCount?: number;
  zernioMonthlyDispatchCount?: number;
  supabaseStorageBytes?: number;
  cloudinaryStorageBytes?: number;
  aiCredits: number; // Remaining AI Credits (Default 1000)
  apiSlotDetails?: ApiAllocationSlot[];
  cloudinaryConfig: CloudinaryConfig;
  status: 'active' | 'suspended';
  paymentStatus?: 'paid' | 'unpaid' | 'overdue' | 'trial';
  renewalDate?: string;
  billingCycle?: 'monthly' | 'yearly';
  currency?: CurrencyCode;
  currencySymbol?: string;
  createdAt: string;
}

export interface SocialAccount {
  id: string;
  tenantId: string;
  platform: SocialPlatform;
  channelAccountId: string;
  accountName: string;
  accountHandle: string;
  accountAvatar: string;
  slotNumber: number; // Which API slot (Account 1, Account 2, Account 3) it belongs to
  status: 'active' | 'disconnected';
  lastSyncedAt: string;
}

export interface SelectedAccountRef {
  platform: SocialPlatform;
  accountId: string;
}

export interface Post {
  id: string;
  tenantId: string;
  content: string;
  mediaUrls: string[];
  mediaType: 'none' | 'image' | 'video';
  isCloudflareHosted: boolean;
  selectedAccountIds: SelectedAccountRef[];
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduledFor?: string;
  publishedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface PostLog {
  id: string;
  postId: string;
  tenantId: string;
  apiPostId?: string;
  requestPayload: Record<string, any>;
  responsePayload: Record<string, any>;
  httpStatus: number;
  executionType: 'instant' | 'background_cron' | 'cloud_native';
  createdAt: string;
}

export interface GoogleReview {
  id: string;
  tenantId: string;
  authorName: string;
  authorAvatar: string;
  rating: number;
  comment: string;
  relativeTime: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  reply?: {
    text: string;
    repliedAt: string;
  };
}

export interface AutoResponderRule {
  id: string;
  tenantId: string;
  name: string;
  platform: 'instagram' | 'facebook' | 'both';
  triggerKeywords: string[];
  matchType: 'exact' | 'contains' | 'regex';
  actionType: 'comment_reply' | 'private_dm' | 'both';
  publicReplyTemplate: string;
  privateDmTemplate: string;
  attachedMediaUrl?: string;
  useAiContext: boolean;
  isActive: boolean;
  triggerCount: number;
  createdAt: string;
}

export interface LiveCommentTriggerLog {
  id: string;
  tenantId: string;
  platform: 'instagram' | 'facebook';
  mediaTitle: string;
  senderUsername: string;
  commentText: string;
  matchedKeyword: string;
  publicReplySent?: string;
  privateDmSent?: string;
  status: 'replied' | 'pending' | 'filtered';
  timestamp: string;
}
