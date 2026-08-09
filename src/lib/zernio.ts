import { Post, Tenant, PostLog, SocialPlatform } from '../types';
import { supabase } from './supabase';

export interface PublishResult {
  post: Post;
  log: PostLog;
  success: boolean;
  message: string;
}

/**
 * Validates Cloudflare media links for scheduled posts
 */
export function validateCloudflareMediaForScheduling(mediaUrls: string[], isCloudflareHosted: boolean): { isValid: boolean; message?: string } {
  if (mediaUrls.length === 0) return { isValid: true };
  
  if (isCloudflareHosted) return { isValid: true };

  // Check if URLs match Cloudflare or external CDN patterns
  const isCloudflareUrl = mediaUrls.every(url => 
    url.includes('r2.dev') || 
    url.includes('cloudflare') || 
    url.includes('imagedelivery.net') ||
    url.includes('cloudinary') ||
    url.startsWith('https://')
  );

  if (!isCloudflareUrl) {
    return {
      isValid: false,
      message: "For scheduling, media MUST use a Cloudflare R2 / hosted CDN link. Direct local file uploads cannot be scheduled."
    };
  }

  return { isValid: true };
}

import { executeComposioPublishing } from './composio';

/**
 * Execute Enterprise Publishing Engine / Dispatcher (Zernio or Composio)
 */
export async function executePublishing(
  postInput: Omit<Post, 'id' | 'createdAt' | 'status'>,
  tenant: Tenant
): Promise<PublishResult> {
  if (tenant.dispatchEngine === 'coresync' || (tenant.dispatchEngine as string) === 'composio') {
    return executeComposioPublishing(postInput, tenant);
  }

  const isScheduled = Boolean(postInput.scheduledFor);

  // 1. Content & Media Validation
  const hasText = Boolean(postInput.content && postInput.content.trim().length > 0);
  const hasMedia = postInput.mediaUrls.length > 0;

  if (!hasText && !hasMedia) {
    throw new Error("Post cannot be empty. Please enter text caption OR attach image/video media.");
  }

  // 2. Cloudflare Link Enforcement for Scheduling
  if (isScheduled && hasMedia) {
    const cfCheck = validateCloudflareMediaForScheduling(postInput.mediaUrls, postInput.isCloudflareHosted);
    if (!cfCheck.isValid) {
      throw new Error(cfCheck.message);
    }
  }

  // 3. Selected Channels Check
  if (postInput.selectedAccountIds.length === 0) {
    throw new Error("Please select at least one social media channel to publish to.");
  }

  const postId = crypto.randomUUID();
  const now = new Date().toISOString();

  const requestPayload = {
    tenantId: tenant.id,
    accounts: postInput.selectedAccountIds.map(a => a.accountId),
    content: postInput.content || null,
    mediaUrls: postInput.mediaUrls,
    mediaType: postInput.mediaType,
    isCloudflareHosted: postInput.isCloudflareHosted,
    publishNow: !isScheduled,
    scheduledFor: postInput.scheduledFor || null,
    // Secrets are never included in client-side audit payloads.
  };

  const post: Post = {
    ...postInput,
    id: postId,
    status: isScheduled ? 'scheduled' : 'publishing',
    createdAt: now
  };

  const { error: saveError } = await supabase.from('posts').insert({
    id: post.id, tenant_id: post.tenantId, content: post.content,
    media_urls: post.mediaUrls, media_type: post.mediaType,
    is_cloudflare_hosted: post.isCloudflareHosted,
    selected_account_ids: post.selectedAccountIds, status: post.status,
    scheduled_for: post.scheduledFor,
  });
  if (saveError) throw saveError;
  const { data: queue, error: queueError } = await supabase.functions.invoke('publish-post', {
    body: { postId: post.id },
    headers: { 'x-idempotency-key': `${post.id}:${post.scheduledFor ?? 'now'}` },
  });
  if (queueError) throw queueError;

  const responsePayload = queue ?? { queued: true };
  const apiPostId = queue?.jobId;
  const message = isScheduled
    ? `Post queued for ${new Date(postInput.scheduledFor!).toLocaleString()}.`
    : 'Post accepted by the secure publishing queue.';

  const log: PostLog = {
    id: crypto.randomUUID(),
    postId: post.id,
    tenantId: tenant.id,
    apiPostId,
    requestPayload,
    responsePayload,
    httpStatus: 202,
    executionType: isScheduled ? 'cloud_native' : 'instant',
    createdAt: now
  };

  return { post, log, success: true, message };
}
