import { actor, cors, json } from '../_shared/server.ts';
import { getComposioKey, normalizeComposioError } from '../_shared/composio.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { db, profile } = await actor(req);
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenantId || profile.tenant_id;
    if (!profile.is_super_admin && tenantId !== profile.tenant_id) return json({ error: 'Forbidden' }, 403);

    const action = body.action || 'get';
    const { data: postRow } = await db.from('posts').select('*').eq('id', body.postId).eq('tenant_id', tenantId).maybeSingle();
    if (!postRow) return json({ error: 'Post not found' }, 404);

    const apiKey = await getComposioKey(db, tenantId);

    if (action === 'get') {
      if (!postRow.zernio_post_id || !apiKey) {
        return json({ post: postRow, remoteStatus: postRow.status });
      }

      let remoteData = null;
      try {
        const res = await fetch(`https://backend.composio.dev/api/v1/actions/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          },
          body: JSON.stringify({
            actionName: 'GET_POST_STATUS',
            entityId: `tenant_${tenantId}`,
            params: { postId: postRow.zernio_post_id }
          })
        });
        if (res.ok) {
          remoteData = await res.json();
        }
      } catch {
        // fallback
      }

      return json({ post: postRow, remotePost: remoteData || { status: postRow.status } });
    }

    if (action === 'delete') {
      if (postRow.zernio_post_id && apiKey) {
        await fetch(`https://backend.composio.dev/api/v1/actions/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          },
          body: JSON.stringify({
            actionName: 'DELETE_POST',
            entityId: `tenant_${tenantId}`,
            params: { postId: postRow.zernio_post_id }
          })
        }).catch(() => null);
      }

      await db.from('publishing_jobs').delete().eq('post_id', body.postId);
      await db.from('posts').delete().eq('id', body.postId);

      return json({ deleted: true, postId: body.postId });
    }

    return json({ error: 'Invalid action specified' }, 400);
  } catch (e) {
    const n = normalizeComposioError(e);
    return json({ error: n.message, code: n.code }, n.statusCode || 400);
  }
});
