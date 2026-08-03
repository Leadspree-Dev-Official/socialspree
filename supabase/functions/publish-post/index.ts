import { actor, cors, json, sha256 } from '../_shared/server.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { db, profile } = await actor(req);
    const { postId } = await req.json();
    const { data: post, error } = await db.from('posts').select('id,tenant_id,scheduled_for,status').eq('id', postId).single();
    if (error || !post) return json({ error: 'Post not found' }, 404);
    if (!profile.is_super_admin && profile.tenant_id !== post.tenant_id) return json({ error: 'Forbidden' }, 403);
    const supplied = req.headers.get('x-idempotency-key') || `${post.id}:${post.scheduled_for ?? 'now'}`;
    const idempotency_key = await sha256(supplied);
    const { data: job, error: jobError } = await db.from('publishing_jobs').upsert({ tenant_id: post.tenant_id, post_id: post.id, idempotency_key, run_after: post.scheduled_for ?? new Date().toISOString() }, { onConflict: 'idempotency_key', ignoreDuplicates: false }).select('*').single();
    if (jobError) throw jobError;
    await db.from('posts').update({ status: post.scheduled_for ? 'scheduled' : 'publishing' }).eq('id', post.id);
    return json({ queued: true, jobId: job.id, status: job.status }, 202);
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'Request failed' }, 400); }
});
