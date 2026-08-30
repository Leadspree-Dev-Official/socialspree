/**
 * Pulls real engagement metrics for published posts.
 *
 * The previous implementation could never have returned a number. It POSTed to
 * /api/v3/tools/execute with no tool slug in the path, sent a v1-shaped body
 * (actionName / entityId / params), and named an action — GET_METRICS — that
 * does not exist in Composio's catalogue. Every call failed, the error was
 * swallowed per-post, and a row of zeros was written. That is why analytics
 * has always shown zero.
 *
 * Insights are per-platform and keyed by the platform's own post id, so this
 * reads the ids recorded on the post at dispatch time and calls the verified
 * tool for each channel.
 */
import { actor, cors, json } from '../_shared/server.ts';
import { getComposioKey, normalizeComposioError, executeTool } from '../_shared/composio.ts';

/** Verified against the live Composio v3 catalogue. */
const INSIGHT_TOOLS: Record<string, { tool: string; idField: string; extraArgs?: Record<string, unknown> }> = {
  // Verified live against a real published post. Omitting `metric` makes the
  // tool default to a set that includes 'impressions', which the Insights API
  // now rejects for single-image posts: "The Media Insights API does not
  // support the impressions metric for this media product type." It also
  // must be a JSON array — a comma-separated string fails a separate way
  // ("Input should be a valid list").
  instagram: {
    tool: 'INSTAGRAM_GET_POST_INSIGHTS',
    idField: 'ig_post_id',
    extraArgs: { metric: ['reach', 'saved', 'likes', 'comments', 'shares'] },
  },
  // Facebook's `metrics` parameter has a working default on Composio's side
  // (a comma-separated string of impression/engagement metrics); left
  // unset deliberately rather than guessing a replacement for an untested path.
  facebook: { tool: 'FACEBOOK_GET_POST_INSIGHTS', idField: 'post_id' },
};

/**
 * Meta returns insights as [{ name, values: [{ value }] }]; normalise that into
 * the columns analytics_snapshots stores.
 */
function readMetrics(payload: any): { views: number; likes: number; comments: number; shares: number } {
  const totals = { views: 0, likes: 0, comments: 0, shares: 0 };
  const container = payload?.response_data ?? payload?.data ?? payload;
  const rows = container?.data ?? container;
  if (!Array.isArray(rows)) return totals;

  for (const row of rows) {
    const name = String(row?.name ?? '').toLowerCase();
    const value = Number(row?.values?.[0]?.value ?? row?.value ?? 0) || 0;

    if (name.includes('impression') || name === 'views' || name === 'reach') {
      totals.views = Math.max(totals.views, value);
    } else if (name.includes('like') || name.includes('reaction')) {
      totals.likes += value;
    } else if (name.includes('comment')) {
      totals.comments += value;
    } else if (name.includes('share')) {
      totals.shares += value;
    }
  }
  return totals;
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

    const apiKey = await getComposioKey(db, tenantId);
    if (!apiKey) return json({ error: 'Composio is not configured for this workspace' }, 503, req);

    const entityId = `tenant_${tenantId}`;

    const { data: posts } = await db.from('posts')
      .select('id, zernio_post_id, platform_results')
      .eq('tenant_id', tenantId)
      .eq('provider', 'composio')
      .eq('status', 'published');

    const snapshots: any[] = [];
    const failures: string[] = [];
    const now = new Date().toISOString();

    for (const post of posts ?? []) {
      // platform_results holds what dispatch actually delivered, including each
      // channel's native post id — the only thing insights can be keyed on.
      const channels: any[] = Array.isArray(post.platform_results) ? post.platform_results : [];

      for (const channel of channels) {
        if (channel?.status !== 'success') continue;

        const platform = String(channel.platform ?? '').toLowerCase();
        const config = INSIGHT_TOOLS[platform];
        if (!config) continue; // no insight tool for this channel

        const platformPostId =
          channel?.response?.id ??
          channel?.response?.data?.id ??
          channel?.response?.platformPostId;
        if (!platformPostId || !channel.accountId) continue;

        let metrics = { views: 0, likes: 0, comments: 0, shares: 0 };
        try {
          const result = await executeTool(
            apiKey,
            config.tool,
            channel.accountId,
            entityId,
            { [config.idField]: platformPostId, ...(config.extraArgs ?? {}) }
          );

          if (!result.ok) {
            failures.push(`${platform} ${platformPostId}: ${result.error}`);
            continue;
          }
          metrics = readMetrics(result.data);
        } catch (err) {
          failures.push(`${platform} ${platformPostId}: ${err instanceof Error ? err.message : 'request failed'}`);
          continue;
        }

        const engagement = metrics.views > 0
          ? ((metrics.likes + metrics.comments + metrics.shares) / metrics.views) * 100
          : 0;

        const row = {
          tenant_id: tenantId,
          post_id: post.id,
          zernio_post_id: String(platformPostId),
          platform,
          views: metrics.views,
          likes: metrics.likes,
          comments: metrics.comments,
          shares: metrics.shares,
          engagement_rate: Number(engagement.toFixed(2)),
          raw_payload: { provider: 'composio', platform, metrics },
          synced_at: now,
        };

        await db.from('analytics_snapshots').upsert(row, { onConflict: 'tenant_id,zernio_post_id' });
        snapshots.push(row);
      }
    }

    // Report what could not be read rather than presenting zeros as real data.
    return json({ snapshots, failures: failures.length > 0 ? failures : undefined }, 200, req);
  } catch (e) {
    const n = normalizeComposioError(e);
    return json({ error: n.message, code: n.code }, n.statusCode || 400, req);
  }
});
