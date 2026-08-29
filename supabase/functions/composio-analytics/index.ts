import { actor, cors, json } from '../_shared/server.ts';
import { getComposioKey, normalizeComposioError } from '../_shared/composio.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const { db, profile } = await actor(req);
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenantId || profile.tenant_id;
    if (!profile.is_super_admin && tenantId !== profile.tenant_id) return json({ error: 'Forbidden' }, 403, req);

    const apiKey = await getComposioKey(db, tenantId);
    // Only fetch analytics for published posts; queued/publishing posts have no remote metrics
    const { data: posts } = await db.from('posts')
      .select('id, zernio_post_id, content, selected_account_ids')
      .eq('tenant_id', tenantId)
      .eq('provider', 'composio')
      .eq('status', 'published');

    const snapshots: any[] = [];
    const now = new Date().toISOString();

    for (const post of posts ?? []) {
      const postId = post.id;
      const composioPostId = post.zernio_post_id || `composio_${postId.slice(0, 8)}`;
      let metrics = { views: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0 };

      if (apiKey && post.zernio_post_id) {
        try {
          const res = await fetch(`https://backend.composio.dev/api/v1/actions/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({
              actionName: 'GET_METRICS',
              entityId: `tenant_${tenantId}`,
              params: { postId: post.zernio_post_id }
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              metrics = {
                views: data.data.views || data.data.impressions || 0,
                likes: data.data.likes || data.data.reactions || 0,
                comments: data.data.comments || 0,
                shares: data.data.shares || data.data.reposts || 0,
                engagementRate: data.data.engagementRate || 0
              };
            }
          }
        } catch {
          // Per-post isolation: if one API call fails, continue with others
        }
      }

      const row = {
        tenant_id: tenantId,
        post_id: postId,
        zernio_post_id: composioPostId,
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        engagement_rate: metrics.engagementRate,
        raw_payload: { provider: 'composio', metrics },
        synced_at: now
      };

      await db.from('analytics_snapshots').upsert(row, { onConflict: 'tenant_id,zernio_post_id' });
      snapshots.push(row);
    }

    return json({ snapshots }, 200, req);
  } catch (e) {
    const n = normalizeComposioError(e);
    return json({ error: n.message, code: n.code }, n.statusCode || 400, req);
  }
});
