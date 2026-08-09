import { admin, cors, json } from '../_shared/server.ts';
import { normalizeZernioError, slotKey, zernioClient } from '../_shared/zernio.ts';

const LEASE_MS = 10 * 60 * 1000;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.headers.get('x-worker-secret') !== Deno.env.get('WORKER_SECRET')) return json({ error: 'Unauthorized' }, 401);

  const db = admin();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - LEASE_MS).toISOString();

  // Recover jobs whose worker died after acquiring the lease.
  await db.from('publishing_jobs')
    .update({ status: 'queued', locked_at: null, run_after: now.toISOString(), updated_at: now.toISOString() })
    .eq('status', 'processing')
    .lt('locked_at', staleBefore);

  const { data: jobs, error } = await db.from('publishing_jobs')
    .select('*,posts(*)')
    .eq('status', 'queued')
    .lte('run_after', now.toISOString())
    .order('created_at')
    .limit(25);
  if (error) return json({ error: 'Unable to load jobs' }, 500);

  let succeeded = 0;
  for (const job of jobs ?? []) {
    const lockTime = new Date().toISOString();
    const { data: locked } = await db.from('publishing_jobs')
      .update({ status: 'processing', attempts: job.attempts + 1, locked_at: lockTime, updated_at: lockTime })
      .eq('id', job.id)
      .eq('status', 'queued')
      .select('id')
      .maybeSingle();
    if (!locked) continue;

    try {
      if (!job.posts) throw new Error('Post not found');
      const refs = Array.isArray(job.posts.selected_account_ids) ? job.posts.selected_account_ids : [];
      const ids = refs.map((x: any) => x.accountId).filter(Boolean);
      if (!ids.length) throw new Error('No social accounts selected');

      const { data: connections, error: connectionError } = await db.from('social_connections')
        .select('*')
        .eq('tenant_id', job.tenant_id)
        .in('channel_account_id', ids);
      if (connectionError) throw connectionError;
      if (!connections?.length || connections.length !== ids.length) throw new Error('One or more selected accounts are invalid');

      const groups = new Map<number, any[]>();
      for (const account of connections) {
        if (account.status !== 'active') throw new Error(`Account ${account.account_name || account.channel_account_id} is not active`);
        groups.set(account.slot_number, [...(groups.get(account.slot_number) ?? []), account]);
      }

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
      await db.from('publishing_jobs').update({ status: 'succeeded', locked_at: null, result, updated_at: new Date().toISOString() }).eq('id', job.id);
      const first: any = results[0];
      await db.from('posts').update({ status: 'published', published_at: new Date().toISOString(), zernio_post_id: first?.post?.id ?? first?.id ?? null, platform_results: results }).eq('id', job.post_id);
      succeeded++;
    } catch (e) {
      const attempts = job.attempts + 1;
      const z = normalizeZernioError(e);
      const terminal = !z.retryable || attempts >= job.max_attempts;
      const delay = z.retryAfterSeconds ? z.retryAfterSeconds * 1000 : Math.min(3600000, 2 ** attempts * 1000);
      await db.from('publishing_jobs').update({ status: terminal ? 'dead_letter' : 'queued', locked_at: null, run_after: new Date(Date.now() + delay).toISOString(), last_error: z.message, result: { error: z }, updated_at: new Date().toISOString() }).eq('id', job.id);
      await db.from('posts').update({ status: terminal ? 'failed' : 'publishing', error_message: terminal ? z.message : null }).eq('id', job.post_id);
    }
  }
  return json({ processed: jobs?.length ?? 0, succeeded });
});
