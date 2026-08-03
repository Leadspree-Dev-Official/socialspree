import { admin, cors, json } from '../_shared/server.ts';
import { normalizeZernioError, slotKey, zernioClient } from '../_shared/zernio.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.headers.get('x-worker-secret') !== Deno.env.get('WORKER_SECRET')) return json({ error: 'Unauthorized' }, 401);
  const db = admin();
  const { data: jobs, error } = await db.from('publishing_jobs').select('*,posts(*)').eq('status', 'queued').lte('run_after', new Date().toISOString()).order('created_at').limit(25);
  if (error) return json({ error: 'Unable to load jobs' }, 500);
  let succeeded = 0;
  for (const job of jobs ?? []) {
    const { data: locked } = await db.from('publishing_jobs').update({ status: 'processing', attempts: job.attempts + 1, locked_at: new Date().toISOString() }).eq('id', job.id).eq('status', 'queued').select('id').maybeSingle();
    if (!locked) continue;
    try {
      const refs = Array.isArray(job.posts.selected_account_ids) ? job.posts.selected_account_ids : [];
      const ids = refs.map((x: any) => x.accountId);
      const { data: connections } = await db.from('social_connections').select('*').eq('tenant_id', job.tenant_id).in('channel_account_id', ids);
      if (!connections?.length) throw new Error('No valid Zernio accounts selected');
      const groups = new Map<number, any[]>();
      for (const account of connections) groups.set(account.slot_number, [...(groups.get(account.slot_number) ?? []), account]);
      const results: unknown[] = [];
      for (const [slot, accounts] of groups) {
        const key = await slotKey(db, job.tenant_id, `slot-${slot}`);
        const { data } = await zernioClient(key).posts.createPost({ body: {
          content: job.posts.content || undefined,
          mediaItems: (job.posts.media_urls ?? []).map((url: string) => ({ url, type: job.posts.media_type === 'video' ? 'video' : 'image' })),
          platforms: accounts.map(a => ({ platform: a.platform === 'x' ? 'twitter' : a.platform, accountId: a.channel_account_id })),
          ...(job.posts.scheduled_for ? { scheduledFor: job.posts.scheduled_for } : { publishNow: true }),
        } as any });
        results.push(data);
      }
      const result = { posts: results };
      await db.from('publishing_jobs').update({ status: 'succeeded', result, updated_at: new Date().toISOString() }).eq('id', job.id);
      const first: any = results[0];
      await db.from('posts').update({ status: 'published', published_at: new Date().toISOString(), zernio_post_id: first?.post?.id ?? first?.id ?? null, platform_results: results }).eq('id', job.post_id);
      succeeded++;
    } catch (e) {
      const attempts = job.attempts + 1;
      const z = normalizeZernioError(e); const terminal = !z.retryable || attempts >= job.max_attempts;
      const delay = z.retryAfterSeconds ? z.retryAfterSeconds * 1000 : Math.min(3600000, 2 ** attempts * 1000);
      await db.from('publishing_jobs').update({ status: terminal ? 'dead_letter' : 'queued', run_after: new Date(Date.now() + delay).toISOString(), last_error: z.message, result: { error: z }, updated_at: new Date().toISOString() }).eq('id', job.id);
      await db.from('posts').update({ status: terminal ? 'failed' : 'publishing', error_message: terminal ? z.message : null }).eq('id', job.post_id);
    }
  }
  return json({ processed: jobs?.length ?? 0, succeeded });
});
