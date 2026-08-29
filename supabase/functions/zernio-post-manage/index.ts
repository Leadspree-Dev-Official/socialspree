import { actor, cors, json } from '../_shared/server.ts';
import { slotKey, zernioClient, normalizeZernioError } from '../_shared/zernio.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const { db, profile } = await actor(req);
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenantId || profile.tenant_id;
    if (!profile.is_super_admin && tenantId !== profile.tenant_id) return json({ error: 'Forbidden' }, 403, req);

    const label = body.label || 'slot-1';
    const key = await slotKey(db, tenantId, label);
    const client = zernioClient(key);
    const action = body.action || 'get';

    if (action === 'get') {
      const { data: postRow } = await db.from('posts').select('*').eq('id', body.postId).eq('tenant_id', tenantId).maybeSingle();
      if (!postRow) return json({ error: 'Post not found' }, 404, req);
      if (!postRow.zernio_post_id) return json({ post: postRow, remoteStatus: postRow.status }, 200, req);

      const { data: remoteData } = await client.posts.getPost({ path: { id: postRow.zernio_post_id } } as any);
      return json({ post: postRow, remotePost: remoteData }, 200, req);
    }

    if (action === 'delete') {
      const { data: postRow } = await db.from('posts').select('*').eq('id', body.postId).eq('tenant_id', tenantId).maybeSingle();
      if (!postRow) return json({ error: 'Post not found' }, 404, req);

      if (postRow.zernio_post_id) {
        await client.posts.deletePost({ path: { id: postRow.zernio_post_id } } as any).catch(() => null);
      }

      await db.from('posts').update({ status: 'failed', error_message: 'Cancelled by user' }).eq('id', body.postId);
      await db.from('publishing_jobs').update({ status: 'dead_letter', last_error: 'Cancelled by user' }).eq('post_id', body.postId);

      return json({ deleted: true, postId: body.postId }, 200, req);
    }

    return json({ error: 'Invalid action specified' }, 400, req);
  } catch (e) {
    const n = normalizeZernioError(e);
    return json({ error: n.message, code: n.code }, 400, req);
  }
});
