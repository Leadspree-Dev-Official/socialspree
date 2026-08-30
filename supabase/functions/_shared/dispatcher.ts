import { resolveAction, buildParams, requiresZernio, toZernioPlatform } from './platforms.ts';
import { getComposioKey, executeTool } from './composio.ts';
import { slotKey, zernioClient } from './zernio.ts';

export interface DispatchResult {
  success: boolean;
  provider: 'composio' | 'zernio' | 'mixed';
  publishedAt: string;
  apiPostId: string;
  dispatchedChannels: Array<{
    platform: string;
    accountId: string;
    status: 'success' | 'failed' | 'unsupported';
    response?: any;
    error?: string;
  }>;
  rawResponse: any;
  /** Set when the post went out on some channels but not all. */
  partialFailure?: string;
}

type ChannelOutcome = DispatchResult['dispatchedChannels'][number];

/**
 * Dispatches a post to every selected channel, routing each one to whichever
 * engine actually serves it.
 *
 * This is genuinely per-platform, not per-tenant: Threads and Google Business
 * have no Composio toolkit at all, so those two always go to Zernio — verified
 * against @zernio/node's own type definitions (ThreadsPlatformData,
 * GoogleBusinessPlatformData) — regardless of which engine the tenant prefers
 * for everything else. Composio-eligible channels still fail over to Zernio if
 * Composio rejects them, preserving the existing safety net.
 */
export async function dispatchPost(
  db: any,
  post: any,
  tenantId: string,
  options: { idempotencyKey?: string; publishNow?: boolean; scheduledFor?: string } = {}
): Promise<DispatchResult> {
  const refs = Array.isArray(post.selected_account_ids) ? post.selected_account_ids : [];
  const targetPlatforms = refs.map((x: any) => String(x?.platform || '').toLowerCase()).filter(Boolean);
  const accountIds = refs.map((x: any) => x?.accountId || x?.id || x?.channel_account_id || x?.channelAccountId).filter(Boolean);

  const { data: allConnections, error: connError } = await db.from('social_connections')
    .select('id,platform,channel_account_id,slot_number,provider_profile_id,account_handle,account_name')
    .eq('tenant_id', tenantId);

  if (connError) throw connError;
  if (!allConnections || allConnections.length === 0) {
    throw new Error('No connected social accounts found for this workspace. Please connect accounts in the Social Accounts tab.');
  }

  let connections = allConnections.filter((conn: any) =>
    accountIds.includes(conn.channel_account_id) ||
    accountIds.includes(conn.id) ||
    (targetPlatforms.length > 0 && targetPlatforms.includes(String(conn.platform).toLowerCase()))
  );
  if (connections.length === 0) {
    connections = allConnections; // graceful fallback: every connected account
  }

  const { data: tenant } = await db.from('tenants').select('dispatch_engine').eq('id', tenantId).maybeSingle();
  const forceZernio = tenant?.dispatch_engine === 'zenith';

  const idempotencyKey = options.idempotencyKey || `post_${post.id}_${Date.now()}`;
  const mediaUrls = Array.isArray(post.media_urls)
    ? post.media_urls
    : (post.media_urls ? [post.media_urls] : []);

  // A channel goes to Zernio from the start if the tenant forces it, or if
  // Composio has no toolkit for that platform at all (Threads, Google Business).
  const zernioFromStart = connections.filter((c: any) =>
    forceZernio || requiresZernio(String(c.platform).toLowerCase())
  );
  const composioEligible = connections.filter((c: any) => !zernioFromStart.includes(c));

  const results: ChannelOutcome[] = [];
  let composioUsed = false;
  let zernioUsed = false;

  // ===========================================================================
  // 1. COMPOSIO — everything eligible, unless the tenant forces Zernio for all.
  // ===========================================================================
  const composioFailed: any[] = [];

  if (composioEligible.length > 0) {
    const composioApiKey = await getComposioKey(db, tenantId);
    if (!composioApiKey) {
      // No key configured — these fall through to Zernio below, same as a
      // per-channel failure would.
      composioFailed.push(...composioEligible);
    } else {
      const entityId = `tenant_${tenantId}`;

      for (const conn of composioEligible) {
        const platformLower = String(conn.platform).toLowerCase();

        let actionName: string;
        try {
          actionName = resolveAction(platformLower);
        } catch {
          // No Composio path for this channel; let Zernio try it.
          composioFailed.push(conn);
          continue;
        }

        const identity = conn.provider_profile_id;
        if (!identity) {
          results.push({
            platform: conn.platform,
            accountId: conn.channel_account_id,
            status: 'failed',
            error: `${conn.platform} is connected but its account id has not been resolved yet. Use Refresh on the Connections page.`,
          });
          composioUsed = true;
          continue;
        }

        try {
          let execution;

          if (platformLower === 'instagram') {
            if (mediaUrls.length === 0) throw new Error('Instagram posts require an image or video.');

            const container = await executeTool(
              composioApiKey,
              'INSTAGRAM_CREATE_MEDIA_CONTAINER',
              conn.channel_account_id,
              entityId,
              { ig_user_id: identity, image_url: mediaUrls[0], caption: post.content || '' },
              `${idempotencyKey}_${conn.channel_account_id}_container`
            );
            if (!container.ok) throw new Error(container.error || 'Could not stage the Instagram media.');

            const creationId = container.data?.id ?? container.data?.creation_id ?? container.data?.data?.id;
            if (!creationId) throw new Error('Instagram did not return a media container id.');

            execution = await executeTool(
              composioApiKey,
              'INSTAGRAM_CREATE_POST',
              conn.channel_account_id,
              entityId,
              { ig_user_id: identity, creation_id: creationId },
              `${idempotencyKey}_${conn.channel_account_id}`
            );
          } else {
            execution = await executeTool(
              composioApiKey,
              actionName,
              conn.channel_account_id,
              entityId,
              buildParams(platformLower, identity, { content: post.content || '', mediaUrls }),
              `${idempotencyKey}_${conn.channel_account_id}`
            );
          }

          composioUsed = true;
          if (execution.ok) {
            results.push({
              platform: conn.platform,
              accountId: conn.channel_account_id,
              status: 'success',
              response: execution.data,
            });
          } else {
            // A Composio-side failure still gets a real shot at Zernio if the
            // channel is one Zernio also supports (e.g. Instagram, Facebook).
            composioFailed.push(conn);
            results.push({
              platform: conn.platform,
              accountId: conn.channel_account_id,
              status: 'failed',
              error: execution.error || 'Dispatch failed',
            });
          }
        } catch (dispatchErr) {
          composioUsed = true;
          composioFailed.push(conn);
          results.push({
            platform: conn.platform,
            accountId: conn.channel_account_id,
            status: 'failed',
            error: dispatchErr instanceof Error ? dispatchErr.message : 'Dispatch failed',
          });
        }
      }
    }
  }

  // Only retry through Zernio the ones Composio actually failed on — a
  // channel Composio already delivered must not get double-posted.
  const zernioCandidates = [...zernioFromStart, ...composioFailed];

  // ===========================================================================
  // 2. ZERNIO — Threads, Google Business, anything forced, and Composio's failures.
  // ===========================================================================
  if (zernioCandidates.length > 0) {
    const groups = new Map<number, any[]>();
    for (const conn of zernioCandidates) {
      const slot = conn.slot_number ?? 1;
      groups.set(slot, [...(groups.get(slot) ?? []), conn]);
    }

    for (const [slot, groupConnections] of groups) {
      let key: string;
      try {
        key = await slotKey(db, tenantId, `slot-${slot}`);
      } catch (keyErr) {
        for (const conn of groupConnections) {
          // Composio already logged a 'failed' row for these; don't duplicate it.
          if (composioFailed.includes(conn)) {
            const existing = results.find(r => r.accountId === conn.channel_account_id);
            if (existing) {
              existing.error = `${existing.error} — and no Zernio key for slot ${slot}: ${keyErr instanceof Error ? keyErr.message : keyErr}`;
              continue;
            }
          }
          results.push({
            platform: conn.platform,
            accountId: conn.channel_account_id,
            status: 'failed',
            error: `No Zernio API key configured for slot ${slot}.`,
          });
        }
        continue;
      }

      const client = zernioClient(key);
      const mediaItems = mediaUrls.map((url: string) => ({
        url,
        type: post.media_type === 'video' ? 'video' : 'image',
      }));

      const platforms = groupConnections.map((c: any) => ({
        platform: toZernioPlatform(c.platform),
        accountId: c.channel_account_id,
      }));

      const payload: any = {
        content: post.content || undefined,
        mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
        platforms,
        ...(options.scheduledFor ? { scheduledFor: options.scheduledFor } : { publishNow: true }),
      };

      try {
        const { data } = await client.posts.createPost({ body: payload } as any);
        zernioUsed = true;

        // The API reports per-platform outcomes on the post itself — read them
        // rather than assuming the whole batch succeeded, which is what this
        // code did before and could not have distinguished a genuine publish
        // from a silent per-channel failure.
        const platformResults: any[] = data?.post?.platforms ?? [];

        for (const conn of groupConnections) {
          const zPlatform = toZernioPlatform(conn.platform);
          const match = platformResults.find(
            (p) => p?.platform === zPlatform &&
              (typeof p?.accountId === 'string' ? p.accountId === conn.channel_account_id
                : p?.accountId?._id === conn.channel_account_id)
          );

          const outcome: ChannelOutcome = match?.status === 'failed'
            ? { platform: conn.platform, accountId: conn.channel_account_id, status: 'failed', error: match.errorMessage || 'Zernio reported this channel failed.' }
            : { platform: conn.platform, accountId: conn.channel_account_id, status: 'success', response: match ?? data?.post };

          // Composio already left a 'failed' row for this channel if it was a
          // fallback candidate — replace it rather than reporting it twice.
          const priorIndex = results.findIndex(r => r.accountId === conn.channel_account_id);
          if (priorIndex >= 0) results[priorIndex] = outcome;
          else results.push(outcome);
        }
      } catch (zernioErr) {
        zernioUsed = true;
        const message = zernioErr instanceof Error ? zernioErr.message : 'Zernio dispatch failed';
        for (const conn of groupConnections) {
          const outcome: ChannelOutcome = { platform: conn.platform, accountId: conn.channel_account_id, status: 'failed', error: message };
          const priorIndex = results.findIndex(r => r.accountId === conn.channel_account_id);
          if (priorIndex >= 0) results[priorIndex] = outcome;
          else results.push(outcome);
        }
      }
    }
  }

  const anySuccess = results.some(r => r.status === 'success');
  const notDelivered = results.filter(r => r.status !== 'success');

  if (!anySuccess) {
    const reasons = results.map(r => `${r.platform}: ${r.error || 'dispatch failed'}`).join('; ');
    throw new Error(results.length > 0 ? `Publishing failed on every channel. ${reasons}` : 'No channel was eligible to publish to.');
  }

  const primary = results.find(r => r.status === 'success');
  const apiPostId = primary?.response?.data?.id || primary?.response?.id || primary?.response?.platformPostId
    || `post_${post.id.slice(0, 8)}`;

  return {
    success: true,
    provider: composioUsed && zernioUsed ? 'mixed' : (zernioUsed ? 'zernio' : 'composio'),
    publishedAt: new Date().toISOString(),
    apiPostId,
    dispatchedChannels: results,
    rawResponse: results,
    partialFailure: notDelivered.length > 0
      ? notDelivered.map(r => `${r.platform}: ${r.error || 'not delivered'}`).join('; ')
      : undefined,
  };
}
