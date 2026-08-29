import { getComposioKey, normalizeComposioError } from './composio.ts';
import { slotKey, zernioClient, normalizeZernioError } from './zernio.ts';

export interface DispatchResult {
  success: boolean;
  provider: 'composio' | 'zernio';
  publishedAt: string;
  apiPostId: string;
  dispatchedChannels: Array<{
    platform: string;
    accountId: string;
    status: 'success' | 'failed';
    response?: any;
    error?: string;
  }>;
  rawResponse: any;
}

/**
 * Dispatches a post prioritizing Composio as primary engine with Zernio as automatic fallback
 */
export async function dispatchPost(
  db: any,
  post: any,
  tenantId: string,
  options: { idempotencyKey?: string; publishNow?: boolean; scheduledFor?: string } = {}
): Promise<DispatchResult> {
  const refs = Array.isArray(post.selected_account_ids) ? post.selected_account_ids : [];
  const accountIds = refs.map((x: any) => x?.accountId).filter(Boolean);
  if (!accountIds.length) {
    throw new Error('No target social channels selected for dispatch.');
  }

  // Fetch connection metadata for selected accounts
  const { data: connections, error: connError } = await db.from('social_connections')
    .select('platform,channel_account_id,slot_number,account_handle,account_name')
    .eq('tenant_id', tenantId)
    .in('channel_account_id', accountIds);

  if (connError) throw connError;
  if (!connections || connections.length === 0) {
    throw new Error('Selected social accounts are not connected or authorization expired.');
  }

  const { data: tenant } = await db.from('tenants').select('dispatch_engine').eq('id', tenantId).maybeSingle();
  const enginePreference = tenant?.dispatch_engine || 'composio';

  const idempotencyKey = options.idempotencyKey || `post_${post.id}_${Date.now()}`;
  let composioError: any = null;

  // =========================================================================
  // 1. PRIMARY DISPATCH ENGINE: COMPOSIO
  // =========================================================================
  if (enginePreference !== 'zenith') {
    try {
      const composioApiKey = await getComposioKey(db, tenantId);
      if (composioApiKey) {
        const entityId = `tenant_${tenantId}`;
        const dispatchedChannels: any[] = [];

        for (const conn of connections) {
          const actionMap: Record<string, string> = {
            instagram: 'INSTAGRAM_CREATE_POST',
            facebook: 'FACEBOOK_CREATE_POST',
            linkedin: 'LINKEDIN_CREATE_POST',
            x: 'TWITTER_CREATION_OF_A_POST',
            twitter: 'TWITTER_CREATION_OF_A_POST',
            youtube: 'YOUTUBE_UPLOAD_VIDEO',
            google_business: 'GOOGLE_BUSINESS_CREATE_POST'
          };

          const platformLower = String(conn.platform).toLowerCase();
          const actionName = actionMap[platformLower] || `${platformLower.toUpperCase()}_CREATE_POST`;

          const payload: any = {
            actionName,
            entityId,
            params: {
              content: post.content || '',
              mediaUrls: Array.isArray(post.media_urls) ? post.media_urls : (post.media_urls ? [post.media_urls] : []),
              connectedAccountId: conn.channel_account_id,
            }
          };

          if (options.scheduledFor) {
            payload.params.scheduledFor = options.scheduledFor;
          }

          const res = await fetch('https://backend.composio.dev/api/v1/actions/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': composioApiKey,
              'x-idempotency-key': `${idempotencyKey}_${conn.channel_account_id}`
            },
            body: JSON.stringify(payload)
          });

          const responseText = await res.text();
          let parsedResponse: any = null;
          try {
            parsedResponse = responseText ? JSON.parse(responseText) : null;
          } catch {
            parsedResponse = { raw: responseText };
          }

          if (res.ok) {
            dispatchedChannels.push({
              platform: conn.platform,
              accountId: conn.channel_account_id,
              status: 'success',
              response: parsedResponse
            });
          } else {
            dispatchedChannels.push({
              platform: conn.platform,
              accountId: conn.channel_account_id,
              status: 'failed',
              error: responseText
            });
          }
        }

        const anySuccess = dispatchedChannels.some(c => c.status === 'success');
        if (anySuccess) {
          const primaryResp = dispatchedChannels.find(c => c.status === 'success')?.response;
          const apiPostId = primaryResp?.data?.id || primaryResp?.id || `comp_${post.id.slice(0, 8)}`;
          return {
            success: true,
            provider: 'composio',
            publishedAt: new Date().toISOString(),
            apiPostId,
            dispatchedChannels,
            rawResponse: dispatchedChannels
          };
        } else {
          composioError = new Error(`Composio dispatch failed for all channels: ${JSON.stringify(dispatchedChannels)}`);
        }
      }
    } catch (err) {
      composioError = err;
      console.warn('Composio dispatch attempt encountered error, attempting Zernio backup fallback:', err);
    }
  }

  // =========================================================================
  // 2. BACKUP / FALLBACK DISPATCH ENGINE: ZERNIO
  // =========================================================================
  try {
    const groups = new Map<number, any[]>();
    for (const conn of connections) {
      const slot = conn.slot_number ?? 1;
      groups.set(slot, [...(groups.get(slot) ?? []), conn]);
    }

    const zernioResults: any[] = [];
    for (const [slot, groupConnections] of groups) {
      const key = await slotKey(db, tenantId, `slot-${slot}`);
      if (!key) {
        throw new Error(`Missing Zernio API key for slot ${slot}`);
      }

      const client = zernioClient(key);
      const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : (post.media_urls ? [post.media_urls] : []);
      const mediaItems = mediaUrls.map((url: string) => ({
        url,
        type: post.media_type === 'video' ? 'video' : 'image'
      }));

      const platforms = groupConnections.map(c => ({
        platform: c.platform === 'x' ? 'twitter' : c.platform,
        accountId: c.channel_account_id
      }));

      const payload: any = {
        content: post.content || undefined,
        mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
        platforms,
        ...(options.scheduledFor ? { scheduledFor: options.scheduledFor } : { publishNow: true })
      };

      const { data } = await client.posts.createPost({ body: payload } as any);
      zernioResults.push(data);
    }

    const firstResult = zernioResults[0];
    const apiPostId = firstResult?.post?.id || firstResult?.id || `zern_${post.id.slice(0, 8)}`;

    return {
      success: true,
      provider: 'zernio',
      publishedAt: new Date().toISOString(),
      apiPostId,
      dispatchedChannels: connections.map(c => ({
        platform: c.platform,
        accountId: c.channel_account_id,
        status: 'success'
      })),
      rawResponse: zernioResults
    };
  } catch (zernioError: any) {
    console.error('All dispatch engines failed. Composio Error:', composioError, 'Zernio Error:', zernioError);
    const finalErrorMsg = composioError
      ? `Dispatch Failed across providers. Composio: ${composioError.message || composioError}. Zernio: ${zernioError.message || zernioError}`
      : (zernioError.message || 'Publish dispatch failed');
    throw new Error(finalErrorMsg);
  }
}
