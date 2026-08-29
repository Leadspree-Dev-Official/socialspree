import { actor, cors, json } from '../_shared/server.ts';
import { normalizeZernioError, slotKey, zernioClient } from '../_shared/zernio.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const { db, profile } = await actor(req);
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenantId || profile.tenant_id;
    if (!profile.is_super_admin && tenantId !== profile.tenant_id) return json({ error: 'Forbidden' }, 403);
    const { data: posts } = await db.from('posts').select('id,zernio_post_id').eq('tenant_id', tenantId).not('zernio_post_id', 'is', null);
    // Fetch the API key ONCE before iterating to avoid N redundant DB roundtrips
    const key = await slotKey(db, tenantId, body.label || 'slot-1');
    const client = zernioClient(key);
    const snapshots = [];
    for (const post of posts ?? []) {
      const { data } = await client.analytics.getAnalytics({ query: { postId: post.zernio_post_id } });
      const a = data?.analytics ?? {};
      const row = { tenant_id: tenantId, post_id: post.id, zernio_post_id: post.zernio_post_id, views: a.views ?? 0, likes: a.likes ?? 0, comments: a.comments ?? 0, shares: a.shares ?? 0, engagement_rate: a.engagementRate ?? 0, raw_payload: data ?? {}, synced_at: new Date().toISOString() };
      await db.from('analytics_snapshots').upsert(row, { onConflict: 'tenant_id,zernio_post_id' });
      snapshots.push(row);
    }
    return json({ snapshots });
  } catch (e) { const n = normalizeZernioError(e); return json({ error: n.message, code: n.code }, 400); }
});
