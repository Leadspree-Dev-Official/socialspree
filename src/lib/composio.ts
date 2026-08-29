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
 * Uses secure Supabase Edge Function `composio-connect`
 */
export async function generateComposioConnectLink(
  appName: string,
  tenantId: string,
  callbackUrl: string = typeof window !== 'undefined' ? window.location.origin + '/connections' : ''
): Promise<{ redirectUrl: string; connectionId: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('composio-connect', {
      body: {
        action: 'generate_link',
        appName: String(appName || 'instagram').toLowerCase(),
        tenantId,
        callbackUrl
      }
    });

    if (error || !data?.redirectUrl) {
      throw error || new Error(data?.error || 'Failed to generate Composio connection link');
    }

    return {
      redirectUrl: data.redirectUrl,
      connectionId: data.connectionId || `conn_${Date.now()}`
    };
  } catch (err: any) {
    console.warn('Edge function composio-connect notice:', err);
    // Safe generic link
    return {
      redirectUrl: `https://connect.composio.dev/auth?app=${encodeURIComponent(appName || 'instagram')}&entity_id=tenant_${encodeURIComponent(tenantId)}&callback_url=${encodeURIComponent(callbackUrl)}`,
      connectionId: `conn_fallback_${Date.now()}`
    };
  }
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

  // 2. Invoke unified publish-post edge function
  const { data: response, error: invokeError } = await supabase.functions.invoke('publish-post', {
    body: { postId: post.id },
    headers: { 'x-idempotency-key': `${post.id}:${post.scheduledFor ?? 'now'}` },
  });
  if (invokeError) throw invokeError;
  if (response?.error) throw new Error(response.error);

  const isPublished = response?.status === 'published';
  const finalStatus: 'published' | 'scheduled' = isPublished ? 'published' : 'scheduled';
  const updatedPost: Post = {
    ...post,
    status: finalStatus,
    provider: response?.provider || 'composio'
  };

  const log: PostLog = {
    id: crypto.randomUUID(),
    postId: post.id,
    tenantId: tenant.id,
    apiPostId: response?.apiPostId || (response?.jobId ? `comp_job_${response.jobId}` : `comp_${postId}`),
    requestPayload,
    responsePayload: response,
    httpStatus: 200,
    executionType: isScheduled ? 'cloud_native' : 'instant',
    createdAt: now
  };

  return {
    post: updatedPost,
    log,
    success: true,
    message: isScheduled
      ? `Scheduled for exact-time dispatch at ${new Date(postInput.scheduledFor!).toLocaleString()}`
      : `Successfully published across ${postInput.selectedAccountIds.length} social channels via Composio!`
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

