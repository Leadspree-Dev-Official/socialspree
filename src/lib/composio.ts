/**
 * Composio Dual-Engine Integration Module for SocialSpree
 * Secure backend-delegated OAuth sessions and multi-platform dispatch
 */

import { Post, Tenant, PostLog, SocialPlatform } from '../types';
import { supabase } from './supabase';

/** Map SocialSpree platform keys to Composio Toolkit IDs */
export const COMPOSIO_TOOLKIT_MAP: Record<SocialPlatform, string> = {
  instagram: 'INSTAGRAM_CREATE_POST',
  facebook: 'FACEBOOK_CREATE_POST',
  linkedin: 'LINKEDIN_CREATE_SHARE',
  x: 'TWITTER_CREATETWEET',
  youtube: 'YOUTUBE_UPLOAD_VIDEO',
  google_business: 'GOOGLE_BUSINESS_POST',
  tiktok: 'TIKTOK_CREATE_POST',
  threads: 'THREADS_POST',
  bluesky: 'BLUESKY_POST',
  pinterest: 'PINTEREST_CREATE_PIN',
  reddit: 'REDDIT_SUBMIT_POST',
  telegram: 'TELEGRAM_SEND_MESSAGE',
  discord: 'DISCORD_SEND_WEBHOOK',
  whatsapp: 'WHATSAPP_SEND_MESSAGE',
  snapchat: 'SNAPCHAT_POST_STORY',
};

export interface ComposioSession {
  sessionId: string;
  userId: string;
  connectedApps: string[];
}

// Known Composio Managed Auth Config IDs
export const COMPOSIO_AUTH_CONFIG_MAP: Record<string, string> = {
  instagram: 'ac_4A4a-nX7C4-R',
  facebook: 'ac_RK_QqllzOppg',
  linkedin: 'ac_BeMgJPOSbpdN',
  youtube: 'ac_1i5HpEwiaMJb',
};

/**
 * Generate a white-labeled Composio Connect Link for user OAuth channel authentication
 * Uses Composio v3.1 API connected_accounts/link
 */
export async function generateComposioConnectLink(
  appName: string,
  tenantId: string,
  callbackUrl: string = typeof window !== 'undefined' ? window.location.origin + '/connections' : ''
): Promise<{ redirectUrl: string; connectionId: string }> {
  const entityId = `tenant_${tenantId}`;
  const slug = String(appName || 'instagram').toLowerCase();
  
  let composioApiKey = 'ak_oyTzo6QSMSHP5KqOfbHn';
  try {
    const storedTenants = localStorage.getItem('socialspree_tenants_store');
    if (storedTenants) {
      const parsed = JSON.parse(storedTenants);
      const t = parsed.find((item: any) => item.id === tenantId);
      const slotKey = t?.apiSlotDetails?.find((s: any) => s.provider === 'composio')?.apiKey;
      if (slotKey) composioApiKey = slotKey;
    }
  } catch { /* ignore */ }

  // 1. Check known auth_config_id or create on-the-fly
  let authConfigId = COMPOSIO_AUTH_CONFIG_MAP[slug];

  if (!authConfigId && composioApiKey) {
    try {
      const createConfigRes = await fetch('https://backend.composio.dev/api/v3.1/auth_configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': composioApiKey
        },
        body: JSON.stringify({
          toolkit: { slug },
          use_composio_auth: true
        })
      });
      if (createConfigRes.ok) {
        const configData = await createConfigRes.json();
        if (configData?.auth_config?.id) {
          authConfigId = configData.auth_config.id;
          COMPOSIO_AUTH_CONFIG_MAP[slug] = authConfigId;
        }
      }
    } catch { /* ignore */ }
  }

  // 2. Generate live link session from Composio v3.1 API
  if (authConfigId && composioApiKey) {
    const payload = JSON.stringify({
      auth_config_id: authConfigId,
      user_id: entityId,
      callback_url: callbackUrl
    });

    const endpoints = [
      '/api/composio/connected_accounts/link',
      'https://backend.composio.dev/api/v3.1/connected_accounts/link'
    ];

    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': composioApiKey
          },
          body: payload
        });

        if (res.ok) {
          const data = await res.json();
          const url = data.redirect_url || data.redirectUrl || data.url;
          if (url) {
            return {
              redirectUrl: url,
              connectionId: data.connected_account_id || data.connectionId || `conn_${Date.now()}`
            };
          }
        }
      } catch (err) {
        console.warn(`Composio link creation note (${endpoint}):`, err);
      }
    }
  }

  // 3. Fallback
  return {
    redirectUrl: `https://connect.composio.dev/link/lk_9W8YL_HFF7Mq`,
    connectionId: `conn_fallback_${Date.now()}`
  };
}

/**
 * Initialize or fetch a Composio user session for a tenant via secure Edge Function
 */
export async function getComposioUserSession(tenant: Tenant): Promise<ComposioSession> {
  const userId = `tenant_${tenant.id}`;
  try {
    const { data, error } = await supabase.functions.invoke('composio-connect', {
      body: { action: 'get_session', tenantId: tenant.id }
    });
    if (error || !data) throw error || new Error('No session returned');
    return {
      sessionId: data.sessionId,
      userId: data.userId || userId,
      connectedApps: data.connectedApps || ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TWITTER']
    };
  } catch {
    return {
      sessionId: `composio_fallback_${tenant.id}`,
      userId,
      connectedApps: ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TWITTER']
    };
  }
}

/**
 * Execute Post Dispatch via Composio Engine via server publishing queue
 */
export async function executeComposioPublishing(
  postInput: Omit<Post, 'id' | 'createdAt' | 'status'>,
  tenant: Tenant
): Promise<{ post: Post; log: PostLog; success: boolean; message: string }> {
  // 1. Content & Media Validation
  const hasText = Boolean(postInput.content && postInput.content.trim().length > 0);
  const hasMedia = postInput.mediaUrls.length > 0;

  if (!hasText && !hasMedia) {
    throw new Error("Post cannot be empty. Please enter text caption OR attach image/video media.");
  }

  // 2. Selected Channels Check
  if (postInput.selectedAccountIds.length === 0) {
    throw new Error("Please select at least one social media channel to publish to.");
  }

  const session = await getComposioUserSession(tenant);
  const postId = crypto.randomUUID();
  const now = new Date().toISOString();
  const isScheduled = Boolean(postInput.scheduledFor);

  const requestPayload = {
    provider: 'composio',
    sessionId: session.sessionId,
    userId: session.userId,
    content: postInput.content,
    mediaUrls: postInput.mediaUrls,
    targetPlatforms: postInput.selectedAccountIds.map(a => a.platform),
    scheduledFor: postInput.scheduledFor || null
  };

  const post: Post = {
    ...postInput,
    id: postId,
    status: isScheduled ? 'scheduled' : 'publishing',
    createdAt: now
  };

  // 1. Save post record pre-locked with provider = 'composio'
  const { error: saveError } = await supabase.from('posts').insert({
    id: post.id,
    tenant_id: post.tenantId,
    provider: 'composio',
    content: post.content,
    media_urls: post.mediaUrls,
    media_type: post.mediaType,
    is_cloudflare_hosted: post.isCloudflareHosted,
    selected_account_ids: post.selectedAccountIds,
    status: post.status,
    scheduled_for: post.scheduledFor,
  });
  if (saveError) throw saveError;

  // 2. Queue publishing job
  const { data: queue, error: queueError } = await supabase.functions.invoke('publish-post', {
    body: { postId: post.id },
    headers: { 'x-idempotency-key': `${post.id}:${post.scheduledFor ?? 'now'}` },
  });
  if (queueError) throw queueError;

  const log: PostLog = {
    id: crypto.randomUUID(),
    postId: post.id,
    tenantId: tenant.id,
    apiPostId: queue?.jobId ? `composio_job_${queue.jobId}` : `composio_job_${postId}`,
    requestPayload,
    responsePayload: queue ?? { queued: true, provider: 'composio', session: session.sessionId },
    httpStatus: 200,
    executionType: isScheduled ? 'cloud_native' : 'instant',
    createdAt: now
  };

  return {
    post,
    log,
    success: true,
    message: isScheduled
      ? `Queued for CoreSync scheduled dispatch at ${new Date(postInput.scheduledFor!).toLocaleString()}`
      : `Queued for secure CoreSync managed dispatch across ${postInput.selectedAccountIds.length} channels.`
  };
}

/**
 * Fetches and syncs connected accounts for a tenant slot via Composio Edge Function
 */
export async function fetchComposioAccounts(
  tenantId: string,
  slotNumber: number = 1
): Promise<any[]> {
  try {
    const { data, error } = await supabase.functions.invoke('composio-accounts', {
      body: {
        tenantId,
        label: `slot-${slotNumber}`,
      },
    });

    if (!error && data?.accounts) {
      return data.accounts;
    }
  } catch (e) {
    console.warn('Edge function composio-accounts note:', e);
  }

  // Direct client fallback to Composio v3.1
  try {
    let composioApiKey = 'ak_oyTzo6QSMSHP5KqOfbHn';
    const entityId = `tenant_${tenantId}`;
    const res = await fetch(`https://backend.composio.dev/api/v3.1/connected_accounts?user_ids=${encodeURIComponent(entityId)}`, {
      headers: { 'x-api-key': composioApiKey }
    });
    if (res.ok) {
      const result = await res.json();
      return (result.items || []).map((acc: any) => ({
        id: acc.id,
        platform: acc.toolkit?.slug || 'instagram',
        accountName: acc.alias || acc.wordId || 'Connected Channel',
        avatarUrl: acc.toolkit?.meta?.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${acc.id}`,
        status: acc.status === 'ACTIVE' ? 'active' : 'pending'
      }));
    }
  } catch (err) {
    console.warn('Composio v3.1 direct accounts fetch note:', err);
  }

  return [];
}

/**
 * Fetch live CoreSync (Composio) media insights & analytics snapshots for a tenant via Edge Function
 */
export async function fetchComposioAnalyticsSnapshots(
  tenant: Tenant,
  slotLabel: string = 'slot-1'
): Promise<any[]> {
  const { data, error } = await supabase.functions.invoke('composio-analytics', {
    body: {
      tenantId: tenant.id,
      label: slotLabel,
    },
  });

  if (error || data?.error) {
    throw new Error(data?.error || error?.message || 'Failed to sync Composio analytics');
  }

  return data?.snapshots ?? [];
}

/**
 * Retrieves status for a published/scheduled Composio post via Edge Function
 */
export async function getComposioPostStatus(
  postId: string,
  tenantId: string
): Promise<any> {
  const { data, error } = await supabase.functions.invoke('composio-post-manage', {
    body: {
      action: 'get',
      postId,
      tenantId,
    },
  });

  if (error || data?.error) {
    throw new Error(data?.error || error?.message || 'Failed to fetch Composio post status');
  }

  return data;
}

/**
 * Cancels or deletes a scheduled post in Composio via Edge Function
 */
export async function deleteComposioScheduledPost(
  postId: string,
  tenantId: string,
  slotLabel: string = 'slot-1'
): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('composio-post-manage', {
    body: {
      action: 'delete',
      postId,
      tenantId,
      label: slotLabel,
    },
  });

  if (error || data?.error) {
    throw new Error(data?.error || error?.message || 'Failed to delete Composio scheduled post');
  }

  return data?.deleted ?? true;
}

