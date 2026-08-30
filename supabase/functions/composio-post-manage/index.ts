/**
 * Reads and deletes published posts on the platforms themselves.
 *
 * The previous implementation named two actions that do not exist —
 * GET_POST_STATUS and DELETE_POST — and sent them in the retired v1 body
 * shape. Delete was the damaging one: the remote call always failed, the
 * failure was swallowed by .catch(() => null), and the local rows were deleted
 * anyway. The post vanished from the dashboard while staying live on the
 * customer's feed, with nothing on screen to say so.
 *
 * Deletion is per-platform and keyed by each channel's native post id.
 */
import { actor, cors, json } from '../_shared/server.ts';
import { getComposioKey, normalizeComposioError, executeTool } from '../_shared/composio.ts';

/** Verified against the live Composio v3 catalogue. */
const DELETE_TOOLS: Record<string, { tool: string; idField: string }> = {
  facebook: { tool: 'FACEBOOK_DELETE_POST', idField: 'post_id' },
  linkedin: { tool: 'LINKEDIN_DELETE_LINKED_IN_POST', idField: 'share_id' },
  // Instagram exposes no delete tool — the Graph API does not support deleting
  // published media. Callers are told rather than being left to assume.
};

function platformPostId(channel: any): string | null {
  return channel?.response?.id
    ?? channel?.response?.data?.id
    ?? channel?.response?.platformPostId
    ?? null;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });

  try {
    const { db, profile } = await actor(req);
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenantId || profile.tenant_id;
    if (!profile.is_super_admin && tenantId !== profile.tenant_id) {
      return json({ error: 'Forbidden' }, 403, req);
    }

    const action = body.action || 'get';
    const { data: postRow } = await db.from('posts')
      .select('*').eq('id', body.postId).eq('tenant_id', tenantId).maybeSingle();
    if (!postRow) return json({ error: 'Post not found' }, 404, req);

    const apiKey = await getComposioKey(db, tenantId);
    const entityId = `tenant_${tenantId}`;
    const channels: any[] = Array.isArray(postRow.platform_results) ? postRow.platform_results : [];

    if (action === 'get') {
      // The authoritative record of what was delivered is what dispatch wrote.
      return json({
        post: postRow,
        status: postRow.status,
        channels: channels.map((c: any) => ({
          platform: c.platform,
          status: c.status,
          postId: platformPostId(c),
          error: c.error ?? null,
        })),
      }, 200, req);
    }

    if (action === 'delete') {
      const removed: string[] = [];
      const notRemoved: string[] = [];

      if (apiKey) {
        for (const channel of channels) {
          if (channel?.status !== 'success') continue;

          const platform = String(channel.platform ?? '').toLowerCase();
          const config = DELETE_TOOLS[platform];
          const nativeId = platformPostId(channel);

          if (!config) {
            notRemoved.push(
              platform === 'instagram'
                ? 'Instagram does not support deleting a published post through its API — remove it in the Instagram app.'
                : `${platform}: no delete tool available.`
            );
            continue;
          }
          if (!nativeId || !channel.accountId) {
            notRemoved.push(`${platform}: no published post id was recorded.`);
            continue;
          }

          try {
            const result = await executeTool(
              apiKey, config.tool, channel.accountId, entityId, { [config.idField]: nativeId }
            );
            if (result.ok) removed.push(platform);
            else notRemoved.push(`${platform}: ${result.error}`);
          } catch (err) {
            notRemoved.push(`${platform}: ${err instanceof Error ? err.message : 'delete failed'}`);
          }
        }
      } else if (channels.some((c: any) => c?.status === 'success')) {
        notRemoved.push('Composio is not configured, so live posts could not be removed.');
      }

      await db.from('publishing_jobs').delete().eq('post_id', body.postId);
      await db.from('posts').delete().eq('id', body.postId).eq('tenant_id', tenantId);

      return json({
        deleted: true,
        postId: body.postId,
        removedFrom: removed,
        // Never let the caller assume a live post is gone when it is not.
        stillLive: notRemoved.length > 0 ? notRemoved : undefined,
      }, 200, req);
    }

    return json({ error: 'Invalid action specified' }, 400, req);
  } catch (e) {
    const n = normalizeComposioError(e);
    return json({ error: n.message, code: n.code }, n.statusCode || 400, req);
  }
});
