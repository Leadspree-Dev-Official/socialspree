// ==============================================================================
// api.ts — Supabase write-through data service.
// Cloud (Supabase) is AUTHORITATIVE. localStorage is a TEMPORARY CACHE only.
//  - reads  : cloud-first, fall back to the localStorage cache
//  - writes : cloud first, then refresh the localStorage cache
//  - auth   : privilege (super-admin) is derived from the DB `profiles` table,
//             never from client state.
//
// Naming: DB columns are snake_case (snake_case -> camelCase mapped here).
// ==============================================================================
import { supabase } from './supabase';
import type {
  Tenant, SocialAccount, Post, PostLog, GoogleReview, MediaAsset,
  AiCreditLog, SubscriptionPlan, ApiAllocationSlot, CloudinaryConfig,
  AutoResponderRule, LiveCommentTriggerLog, SocialPlatform, CurrencyCode
} from '../types';

export interface ProfileNotifications {
  emailDigest: boolean;
  postFailureAlerts: boolean;
  securityAlerts: boolean;
}

export type UserRole = 'super_admin' | 'agency' | 'influencer' | 'business_user' | 'admin' | 'member';

export interface Profile {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  phoneNumber?: string | null;
  timezone?: string | null;
  notifications?: ProfileNotifications;
  tenantId?: string | null;
  isSuperAdmin: boolean;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}


// ---- localStorage cache (temp) ------------------------------------------------
export const CACHE_KEYS = {
  TENANTS: 'socialspree_tenants_v1',
  PLANS: 'socialspree_plans_v1',
  ACCOUNTS: 'socialspree_accounts_v1',
  POSTS: 'socialspree_posts_v1',
  LOGS: 'socialspree_logs_v1',
  AI_LOGS: 'socialspree_ai_logs_v1',
  MEDIA: 'socialspree_media_v1',
  USER_PROFILE: 'socialspree_user_profile_v1',
};

const isBrowser = typeof window !== 'undefined';

function cacheGet<T>(key: string): T | null {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function cacheSet<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota etc. */ }
}

export function clearAuthenticatedCache(): void {
  if (!isBrowser) return;
  for (const key of Object.values(CACHE_KEYS)) window.localStorage.removeItem(key);
}

// ---- Auth helpers ------------------------------------------------------------
export const auth = {
  async getProfile(userEmail?: string): Promise<Profile | null> {
    const { data: uid } = await supabase.rpc('current_clerk_user_id');
    let data: any = null;

    if (uid) {
      const res = await supabase
        .from('profiles')
        .select('id,email,full_name,avatar_url,job_title,phone_number,timezone,notifications,tenant_id,is_super_admin,role,created_at,updated_at')
        .eq('id', uid)
        .maybeSingle();
      data = res.data;
    }

    if (!data && userEmail) {
      const res = await supabase
        .from('profiles')
        .select('id,email,full_name,avatar_url,job_title,phone_number,timezone,notifications,tenant_id,is_super_admin,role,created_at,updated_at')
        .ilike('email', userEmail.trim())
        .maybeSingle();
      data = res.data;
    }

    if (!data) return null;
    const p = mapProfile(data);
    cacheSet(CACHE_KEYS.USER_PROFILE, p);
    return p;
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const current = await this.getProfile();
    if (!current) throw new Error('No authenticated Clerk profile is available.');
    const updated: Profile = {
      id: current.id,
      email: current.email,
      fullName: updates.fullName !== undefined ? updates.fullName : (current?.fullName || ''),
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : (current?.avatarUrl || ''),
      jobTitle: updates.jobTitle !== undefined ? updates.jobTitle : (current?.jobTitle || ''),
      phoneNumber: updates.phoneNumber !== undefined ? updates.phoneNumber : (current?.phoneNumber || ''),
      timezone: updates.timezone !== undefined ? updates.timezone : (current?.timezone || 'UTC'),
      notifications: updates.notifications !== undefined ? updates.notifications : (current?.notifications || {
        emailDigest: true,
        postFailureAlerts: true,
        securityAlerts: true,
      }),
      tenantId: current?.tenantId || null,
      isSuperAdmin: current?.isSuperAdmin || false,
      role: current?.role || 'admin',
      createdAt: current?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cacheSet(CACHE_KEYS.USER_PROFILE, updated);

    if (current?.id) {
      const dbRow: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.fullName !== undefined) dbRow.full_name = updates.fullName;
      if (updates.avatarUrl !== undefined) dbRow.avatar_url = updates.avatarUrl;
      if (updates.jobTitle !== undefined) dbRow.job_title = updates.jobTitle;
      if (updates.phoneNumber !== undefined) dbRow.phone_number = updates.phoneNumber;
      if (updates.timezone !== undefined) dbRow.timezone = updates.timezone;
      if (updates.notifications !== undefined) dbRow.notifications = updates.notifications;

      const { error } = await supabase.from('profiles').update(dbRow).eq('id', current.id);
      if (error) throw error;
    }
    return updated;
  },

  async isAdmin(): Promise<boolean> {
    const p = await this.getProfile();
    return p?.isSuperAdmin === true;
  },
};

// ---- DB row mappers (snake_case -> camelCase) ---------------------------------
function mapProfile(r: any): Profile {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    jobTitle: r.job_title,
    phoneNumber: r.phone_number,
    timezone: r.timezone || 'UTC',
    notifications: r.notifications || {
      emailDigest: true,
      postFailureAlerts: true,
      securityAlerts: true,
    },
    tenantId: r.tenant_id,
    isSuperAdmin: r.is_super_admin === true,
    role: r.role,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}


function mapPlan(r: any): SubscriptionPlan {
  return {
    id: r.id,
    name: r.name,
    priceMonthly: r.price_monthly != null ? Number(r.price_monthly) : 0,
    currency: (r.currency ?? 'USD') as CurrencyCode,
    currencySymbol: r.currency_symbol ?? '$',
    allocatedApiSlots: r.allocated_api_slots ?? 1,
    maxSocialAccounts: r.max_social_accounts ?? 2,
    aiCredits: r.ai_credits ?? 500,
    features: Array.isArray(r.features) ? r.features.map(String) : [],
    isPopular: r.is_popular ?? false,
  };
}
function planToRow(p: SubscriptionPlan): any {
  return {
    id: p.id, name: p.name, price_monthly: p.priceMonthly,
    currency: p.currency, currency_symbol: p.currencySymbol,
    allocated_api_slots: p.allocatedApiSlots, max_social_accounts: p.maxSocialAccounts,
    ai_credits: p.aiCredits, features: p.features, is_popular: p.isPopular ?? false,
  };
}

function mapSlot(r: any): ApiAllocationSlot {
  return {
    id: r.id,
    slotNumber: r.slot_number,
    slotName: r.slot_name ?? '',
    apiKey: '', // never expose; provider tokens live in Edge Function secrets
    maxChannels: r.max_channels ?? 2,
    connectedAccountIds: Array.isArray(r.connected_account_ids) ? r.connected_account_ids.map(String) : [],
  };
}
function slotToRow(tid: string, s: ApiAllocationSlot): any {
  return {
    tenant_id: tid, slot_number: s.slotNumber, slot_name: s.slotName,
    max_channels: s.maxChannels, connected_account_ids: s.connectedAccountIds,
  };
}

function mapTenant(r: any, slots: ApiAllocationSlot[] = []): Tenant {
  let cloudinaryConfig: CloudinaryConfig | undefined;
  if (r.cloudinary_config && typeof r.cloudinary_config === 'object') {
    cloudinaryConfig = r.cloudinary_config as CloudinaryConfig;
  }
  return {
    id: r.id,
    name: r.name,
    ownerEmail: r.owner_email,
    apiKey: '', // stripped — secrets never persist in browser
    tierPlan: r.tier_plan ?? 'free',
    planId: r.plan_id ?? undefined,
    allocatedApiSlots: r.allocated_api_slots ?? 2,
    maxSocialAccounts: r.max_social_accounts ?? 4,
    aiCredits: r.ai_credits ?? 0,
    apiSlotDetails: slots,
    cloudinaryConfig: cloudinaryConfig ?? ({} as CloudinaryConfig),
    status: r.status ?? 'active',
    paymentStatus: r.payment_status ?? 'trial',
    renewalDate: r.renewal_date ?? undefined,
    billingCycle: r.billing_cycle ?? undefined,
    currency: (r.currency ?? 'USD') as CurrencyCode | undefined,
    currencySymbol: r.currency_symbol ?? undefined,
    createdAt: r.created_at,
  };
}
function tenantToRow(t: Tenant): any {
  return {
    name: t.name, owner_email: t.ownerEmail, tier_plan: t.tierPlan,
    plan_id: t.planId, allocated_api_slots: t.allocatedApiSlots,
    max_social_accounts: t.maxSocialAccounts, ai_credits: t.aiCredits,
    cloudinary_config: t.cloudinaryConfig, status: t.status,
    payment_status: t.paymentStatus, renewal_date: t.renewalDate,
    billing_cycle: t.billingCycle, currency: t.currency, currency_symbol: t.currencySymbol,
  };
}

function mapAccount(r: any): SocialAccount {
  return {
    id: r.id, tenantId: r.tenant_id, platform: r.platform as SocialPlatform,
    channelAccountId: r.channel_account_id, accountName: r.account_name,
    accountHandle: r.account_handle ?? '', accountAvatar: r.account_avatar ?? '',
    slotNumber: r.slot_number ?? 1, status: r.status ?? 'active',
    lastSyncedAt: r.last_synced_at ?? new Date().toISOString(),
  };
}

function mapPost(r: any): Post {
  return {
    id: r.id, tenantId: r.tenant_id, content: r.content ?? '',
    mediaUrls: Array.isArray(r.media_urls) ? r.media_urls.map(String) : [],
    mediaType: (r.media_type ?? 'none') as Post['mediaType'],
    isCloudflareHosted: r.is_cloudflare_hosted === true,
    selectedAccountIds: Array.isArray(r.selected_account_ids) ? r.selected_account_ids : [],
    status: (r.status ?? 'draft') as Post['status'],
    scheduledFor: r.scheduled_for ?? undefined,
    publishedAt: r.published_at ?? undefined,
    errorMessage: r.error_message ?? undefined,
    createdAt: r.created_at,
  };
}
function postToRow(p: Post): any {
  return {
    tenant_id: p.tenantId, content: p.content, media_urls: p.mediaUrls,
    media_type: p.mediaType, is_cloudflare_hosted: p.isCloudflareHosted,
    selected_account_ids: p.selectedAccountIds, status: p.status,
    scheduled_for: p.scheduledFor, published_at: p.publishedAt,
    error_message: p.errorMessage,
  };
}

function mapLog(r: any): PostLog {
  return {
    id: r.id, postId: r.post_id ?? '', tenantId: r.tenant_id,
    apiPostId: r.api_post_id ?? undefined,
    requestPayload: (r.request_payload as any) ?? {},
    responsePayload: (r.response_payload as any) ?? {},
    httpStatus: r.http_status ?? 200,
    executionType: (r.execution_type ?? 'instant') as PostLog['executionType'],
    createdAt: r.created_at,
  };
}

function mapAiLog(r: any): AiCreditLog {
  return {
    id: r.id, tenantId: r.tenant_id, tenantName: r.tenant_name ?? '',
    action: r.action, creditsAmount: r.credits_amount,
    remainingBalance: r.remaining_balance, description: r.description,
    timestamp: r.created_at,
  };
}

function mapMedia(r: any): MediaAsset {
  return {
    id: r.id, tenantId: r.tenant_id, title: r.title, url: r.url,
    type: r.type as MediaAsset['type'], cloudName: r.cloud_name ?? undefined,
    fileSize: r.file_size ?? undefined, createdAt: r.created_at,
  };
}

function mapReview(r: any): GoogleReview {
  return {
    id: r.id, tenantId: r.tenant_id, authorName: r.author_name,
    authorAvatar: r.author_avatar ?? '', rating: r.rating, comment: r.comment ?? '',
    relativeTime: r.relative_time ?? '',
    sentiment: (r.sentiment ?? 'neutral') as GoogleReview['sentiment'],
    reply: r.reply ? (typeof r.reply === 'string' ? JSON.parse(r.reply) : r.reply) : undefined,
  };
}

function mapRule(r: any): AutoResponderRule {
  return {
    id: r.id, tenantId: r.tenant_id, name: r.name,
    platform: (r.platform ?? 'instagram') as AutoResponderRule['platform'],
    triggerKeywords: Array.isArray(r.trigger_keywords) ? r.trigger_keywords.map(String) : [],
    matchType: (r.match_type ?? 'contains') as AutoResponderRule['matchType'],
    actionType: (r.action_type ?? 'both') as AutoResponderRule['actionType'],
    publicReplyTemplate: r.public_reply_template ?? '',
    privateDmTemplate: r.private_dm_template ?? '',
    useAiContext: r.use_ai_context === true,
    isActive: r.is_active === true,
    triggerCount: r.trigger_count ?? 0,
    createdAt: r.created_at,
  };
}

function mapTriggerLog(r: any): LiveCommentTriggerLog {
  return {
    id: r.id, tenantId: r.tenant_id, platform: r.platform,
    mediaTitle: r.media_title ?? '', senderUsername: r.sender_username,
    commentText: r.comment_text, matchedKeyword: r.matched_keyword ?? '',
    publicReplySent: r.public_reply_sent ?? undefined,
    privateDmSent: r.private_dm_sent ?? undefined,
    status: (r.status ?? 'replied') as LiveCommentTriggerLog['status'],
    timestamp: r.created_at,
  };
}

// ---- Public catalog (no auth required for reads) -----------------------------
export const plans = {
  list: async (): Promise<SubscriptionPlan[]> => {
    const { data, error } = await supabase.from('plans').select('*');
    if (error) throw error;
    return (data ?? []).map(mapPlan);
  },
  cache: (): SubscriptionPlan[] => cacheGet<SubscriptionPlan[]>(CACHE_KEYS.PLANS) ?? [],
  save: async (plan: SubscriptionPlan): Promise<SubscriptionPlan> => {
    const { data, error } = await supabase.from('plans').upsert(planToRow(plan), { onConflict: 'id' }).select('*').single();
    if (error) throw error;
    const mapped = mapPlan(data);
    const current = cacheGet<SubscriptionPlan[]>(CACHE_KEYS.PLANS) ?? [];
    cacheSet(CACHE_KEYS.PLANS, current.some(p => p.id === mapped.id) ? current.map(p => p.id === mapped.id ? mapped : p) : [...current, mapped]);
    return mapped;
  },
  saveAll: async (items: SubscriptionPlan[]) => { for (const plan of items) await plans.save(plan); },
};

// ---- Profiles ----------------------------------------------------------------
export const profiles = {
  me: auth.getProfile,
};

async function myTenantId(): Promise<string | null> {
  return (await auth.getProfile())?.tenantId ?? null;
}

// ---- Tenants (super-admin managed; tenant-isolated) --------------------------
export const tenants = {
  list: async (): Promise<Tenant[]> => {
    // RLS already scopes visibility: members see their own tenant, super-admins see all.
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw error;
    const rows = data ?? [];
    const result: Tenant[] = [];
    for (const r of rows) {
      const { data: slots } = await supabase.from('api_allocation_slots')
        .select('*').eq('tenant_id', r.id).order('slot_number', { ascending: true });
      result.push(mapTenant(r, (slots ?? []).map(mapSlot)));
    }
    cacheSet(CACHE_KEYS.TENANTS, result);
    return result;
  },

  get: async (id: string): Promise<Tenant | null> => {
    const { data, error } = await supabase.from('tenants').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const { data: slots } = await supabase.from('api_allocation_slots').select('*').eq('tenant_id', id).order('slot_number', { ascending: true });
    const t = mapTenant(data, (slots ?? []).map(mapSlot));
    cacheSet(CACHE_KEYS.TENANTS, [t]);
    return t;
  },

  save: async (t: Tenant): Promise<Tenant> => {
    const row = { ...tenantToRow(t), id: t.id };
    const { data, error } = await supabase.from('tenants').upsert(row, { onConflict: 'id' }).select('*').single();
    if (error) throw error;
    // cascade api slots
    const tid = t.id;
    for (const s of t.apiSlotDetails ?? []) {
      const srow = slotToRow(tid, s);
      srow.id = s.id.startsWith('slot-') ? undefined : s.id; // keep server ids, let new ones generate
      await supabase.from('api_allocation_slots').upsert(srow, { onConflict: 'tenant_id,slot_number' });
    }
    const t2 = mapTenant(data, t.apiSlotDetails ?? []);
    const cur = cacheGet<Tenant[]>(CACHE_KEYS.TENANTS) ?? [];
    cacheSet(CACHE_KEYS.TENANTS, cur.map(x => (x.id === t2.id ? t2 : x)));
    return t2;
  },

  saveAll: async (items: Tenant[]): Promise<void> => {
    for (const t of items) await tenants.save(t);
  },

  cache: (): Tenant[] => cacheGet<Tenant[]>(CACHE_KEYS.TENANTS) ?? [],
};

// ---- Social connections ------------------------------------------------------
export const socialConnections = {
  list: async (): Promise<SocialAccount[]> => {
    const { data, error } = await supabase.from('social_connections').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const accs = (data ?? []).map(mapAccount);
    cacheSet(CACHE_KEYS.ACCOUNTS, accs);
    return accs;
  },
  create: async (a: Omit<SocialAccount, 'id' | 'tenantId' | 'lastSyncedAt'>, tenantId: string): Promise<SocialAccount> => {
    const row = {
      tenant_id: tenantId, platform: a.platform, channel_account_id: a.channelAccountId,
      account_name: a.accountName, account_handle: a.accountHandle, account_avatar: a.accountAvatar,
      slot_number: a.slotNumber, status: a.status,
    };
    const { data, error } = await supabase.from('social_connections').insert(row).select('*').single();
    if (error) throw error;
    const mapped = mapAccount(data);
    const cur = cacheGet<SocialAccount[]>(CACHE_KEYS.ACCOUNTS) ?? [];
    cacheSet(CACHE_KEYS.ACCOUNTS, [mapped, ...cur]);
    return mapped;
  },
  save: async (a: SocialAccount): Promise<SocialAccount> => {
    const row = {
      id: a.id, tenant_id: a.tenantId, platform: a.platform,
      channel_account_id: a.channelAccountId, account_name: a.accountName,
      account_handle: a.accountHandle, account_avatar: a.accountAvatar,
      slot_number: a.slotNumber, status: a.status, last_synced_at: a.lastSyncedAt,
    };
    const { data, error } = await supabase.from('social_connections').upsert(row, { onConflict: 'id' }).select('*').single();
    if (error) throw error;
    return mapAccount(data);
  },
  update: async (id: string, patch: Partial<SocialAccount>): Promise<void> => {
    const row: any = {};
    if (patch.platform) row.platform = patch.platform;
    if (patch.accountName) row.account_name = patch.accountName;
    if (patch.accountHandle) row.account_handle = patch.accountHandle;
    if (patch.accountAvatar) row.account_avatar = patch.accountAvatar;
    if (patch.slotNumber) row.slot_number = patch.slotNumber;
    if (patch.status) row.status = patch.status;
    const { error } = await supabase.from('social_connections').update(row).eq('id', id);
    if (error) throw error;
    const cur = cacheGet<SocialAccount[]>(CACHE_KEYS.ACCOUNTS) ?? [];
    cacheSet(CACHE_KEYS.ACCOUNTS, cur.map(a => (a.id === id ? { ...a, ...patch } : a)));
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from('social_connections').delete().eq('id', id);
    if (error) throw error;
    const cur = cacheGet<SocialAccount[]>(CACHE_KEYS.ACCOUNTS) ?? [];
    cacheSet(CACHE_KEYS.ACCOUNTS, cur.filter(a => a.id !== id));
  },
};

// ---- Posts -------------------------------------------------------------------
export const posts = {
  list: async (): Promise<Post[]> => {
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const list = (data ?? []).map(mapPost);
    cacheSet(CACHE_KEYS.POSTS, list);
    return list;
  },
  save: async (p: Post): Promise<Post> => {
    const row = { ...postToRow(p), id: p.id || undefined };
    const { data, error } = await supabase.from('posts').upsert(row, { onConflict: 'id' }).select('*').single();
    if (error) throw error;
    const mapped = mapPost(data);
    const cur = cacheGet<Post[]>(CACHE_KEYS.POSTS) ?? [];
    cacheSet(CACHE_KEYS.POSTS, cur.some(x => x.id === mapped.id) ? cur.map(x => (x.id === mapped.id ? mapped : x)) : [mapped, ...cur]);
    return mapped;
  },
  updateStatus: async (id: string, status: Post['status'], extra: Partial<Post> = {}): Promise<void> => {
    const row: any = { status };
    if (extra.publishedAt) row.published_at = extra.publishedAt;
    if (extra.errorMessage) row.error_message = extra.errorMessage;
    const { error } = await supabase.from('posts').update(row).eq('id', id);
    if (error) throw error;
    const cur = cacheGet<Post[]>(CACHE_KEYS.POSTS) ?? [];
    cacheSet(CACHE_KEYS.POSTS, cur.map(x => (x.id === id ? { ...x, status, ...extra } : x)));
  },
};

// ---- Post logs (append-only) -------------------------------------------------
export const postLogs = {
  list: async (): Promise<PostLog[]> => {
    const { data, error } = await supabase.from('post_logs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const list = (data ?? []).map(mapLog);
    cacheSet(CACHE_KEYS.LOGS, list);
    return list;
  },
  create: async (log: PostLog): Promise<void> => {
    const row = {
      post_id: log.postId || null, tenant_id: log.tenantId, api_post_id: log.apiPostId,
      request_payload: log.requestPayload, response_payload: log.responsePayload,
      http_status: log.httpStatus, execution_type: log.executionType,
    };
    const { error } = await supabase.from('post_logs').upsert({ ...row, id: log.id }, { onConflict: 'id' });
    if (error) throw error;
  },
};

// ---- AI credit logs (append-only) --------------------------------------------
export const aiCreditLogs = {
  list: async (): Promise<AiCreditLog[]> => {
    const { data, error } = await supabase.from('ai_credit_logs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const list = (data ?? []).map(mapAiLog);
    cacheSet(CACHE_KEYS.AI_LOGS, list);
    return list;
  },
  create: async (log: AiCreditLog): Promise<void> => {
    const row = {
      tenant_id: log.tenantId, tenant_name: log.tenantName, action: log.action,
      credits_amount: log.creditsAmount, remaining_balance: log.remainingBalance, description: log.description,
    };
    const { error } = await supabase.from('ai_credit_logs').upsert({ ...row, id: log.id }, { onConflict: 'id' });
    if (error) throw error;
  },
};

// ---- Media assets ------------------------------------------------------------
export const mediaAssets = {
  list: async (): Promise<MediaAsset[]> => {
    const { data, error } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const list = (data ?? []).map(mapMedia);
    cacheSet(CACHE_KEYS.MEDIA, list);
    return list;
  },
  create: async (m: MediaAsset): Promise<void> => {
    const row = {
      tenant_id: m.tenantId, title: m.title, url: m.url, type: m.type,
      cloud_name: m.cloudName, file_size: m.fileSize,
    };
    const { error } = await supabase.from('media_assets').upsert({ ...row, id: m.id }, { onConflict: 'id' });
    if (error) throw error;
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from('media_assets').delete().eq('id', id);
    if (error) throw error;
  },
};

// ---- Google reviews ----------------------------------------------------------
export const googleReviews = {
  list: async (): Promise<GoogleReview[]> => {
    const tid = await myTenantId();
    let q = supabase.from('google_reviews').select('*');
    if (tid) q = q.eq('tenant_id', tid);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapReview);
  },
  reply: async (id: string, reply: { text: string; repliedAt: string }): Promise<void> => {
    const { error } = await supabase.from('google_reviews').update({ reply, replied_at: reply.repliedAt }).eq('id', id);
    if (error) throw error;
  },
};

// ---- Auto-responder rules ----------------------------------------------------
export const autoResponderRules = {
  list: async (): Promise<AutoResponderRule[]> => {
    const tid = await myTenantId();
    let q = supabase.from('auto_responder_rules').select('*');
    if (tid) q = q.eq('tenant_id', tid);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRule);
  },
  save: async (r: AutoResponderRule): Promise<void> => {
    const row = {
      id: r.id || undefined, tenant_id: r.tenantId, name: r.name, platform: r.platform as any,
      trigger_keywords: r.triggerKeywords, match_type: r.matchType, action_type: r.actionType,
      public_reply_template: r.publicReplyTemplate, private_dm_template: r.privateDmTemplate,
      use_ai_context: r.useAiContext, is_active: r.isActive, trigger_count: r.triggerCount,
    };
    const { error } = await supabase.from('auto_responder_rules').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  },
};

// ---- Live comment trigger logs (append-only) ---------------------------------
export const liveCommentTriggerLogs = {
  create: async (log: Omit<LiveCommentTriggerLog, 'id' | 'timestamp'> & { tenantId: string }): Promise<void> => {
    const row = {
      tenant_id: log.tenantId, platform: log.platform as any, media_title: log.mediaTitle,
      sender_username: log.senderUsername, comment_text: log.commentText,
      matched_keyword: log.matchedKeyword, public_reply_sent: log.publicReplySent,
      private_dm_sent: log.privateDmSent, status: log.status,
    };
    const { error } = await supabase.from('live_comment_trigger_logs').insert(row);
    if (error) throw error;
  },
};

// ---- System settings ---------------------------------------------------------
export const systemSettings = {
  getAll: async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from('system_settings').select('key,value');
    if (error) throw error;
    const out: Record<string, string> = {};
    for (const r of data ?? []) out[r.key] = r.value;
    return out;
  },
};

// ---- Migration: localStorage cache -> cloud (one-time, first super-admin login)
// Also seeds the cloud cache from the authoritative cloud rows.
export async function hydrateFromCloud(): Promise<{
  tenants: Tenant[]; plans: SubscriptionPlan[]; accounts: SocialAccount[];
  posts: Post[]; logs: PostLog[]; aiLogs: AiCreditLog[]; media: MediaAsset[];
  reviews: GoogleReview[];
}> {
  const [tenantRows, planRows, accountRows, postRows, logRows, aiRows, mediaRows, reviewRows] = await Promise.all([
    tenants.list(), plans.list(), socialConnections.list(), posts.list(),
    postLogs.list(), aiCreditLogs.list(), mediaAssets.list(),
    googleReviews.list(),
  ]);
  // cache reads already write the localStorage cache during list(); return cloud data.
  return {
    tenants: tenantRows,
    plans: planRows,
    accounts: accountRows,
    posts: postRows,
    logs: logRows,
    aiLogs: aiRows,
    media: mediaRows,
    reviews: reviewRows,
  };
}

// One-time: push whatever lives ONLY in localStorage cache into the cloud,
// so legacy browser data is preserved when Supabase becomes authoritative.
export async function migrateLocalStorageToCloud(): Promise<number> {
  let migrated = 0;
  const cachedTenants = cacheGet<Tenant[]>(CACHE_KEYS.TENANTS);
  if (cachedTenants && cachedTenants.length) {
    for (const t of cachedTenants) {
      await supabase.from('tenants').upsert({ ...tenantToRow(t), id: t.id }, { onConflict: 'id' });
      for (const s of t.apiSlotDetails ?? []) {
        await supabase.from('api_allocation_slots').upsert(slotToRow(t.id, s), { onConflict: 'tenant_id,slot_number' });
      }
      migrated++;
    }
  }
  const cachedPlans = cacheGet<SubscriptionPlan[]>(CACHE_KEYS.PLANS);
  if (cachedPlans && cachedPlans.length) {
    for (const p of cachedPlans) { await supabase.from('plans').upsert(planToRow(p), { onConflict: 'id' }); migrated++; }
  }
  const cachedPosts = cacheGet<Post[]>(CACHE_KEYS.POSTS);
  if (cachedPosts && cachedPosts.length) {
    for (const p of cachedPosts) { await supabase.from('posts').upsert({ ...postToRow(p), id: p.id }, { onConflict: 'id' }); migrated++; }
  }
  const cachedMedia = cacheGet<MediaAsset[]>(CACHE_KEYS.MEDIA);
  if (cachedMedia && cachedMedia.length) {
    for (const m of cachedMedia) { await supabase.from('media_assets').upsert({ ...mapMediaReverse(m), id: m.id }, { onConflict: 'id' }); migrated++; }
  }
  return migrated;
}
function mapMediaReverse(m: MediaAsset): any {
  return {
    tenant_id: m.tenantId, title: m.title, url: m.url, type: m.type,
    cloud_name: m.cloudName, file_size: m.fileSize,
  };
}

export default { auth, plans, tenants, socialConnections, posts, postLogs, aiCreditLogs, mediaAssets, googleReviews, autoResponderRules, liveCommentTriggerLogs, systemSettings, hydrateFromCloud, migrateLocalStorageToCloud };
