import { admin, cors, json } from '../_shared/server.ts';
import { dispatchPost } from '../_shared/dispatcher.ts';

const LEASE_MS = 10 * 60 * 1000;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  const workerSecret = Deno.env.get('WORKER_SECRET');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const suppliedSecret = req.headers.get('x-worker-secret');
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const isWorkerAuthorized = Boolean(workerSecret && suppliedSecret && suppliedSecret === workerSecret);
  const isServiceAuthorized = Boolean(serviceKey && token && token === serviceKey);

  if (!isWorkerAuthorized && !isServiceAuthorized) {
    return json({ error: 'Unauthorized: Valid worker secret or service token required' }, 401, req);
  }

  const db = admin();
  const url = new URL(req.url);
  const targetPostId = url.searchParams.get('postId');
  const now = new Date();
  const leaseExpired = new Date(now.getTime() - LEASE_MS).toISOString();

  // Recover jobs abandoned by a crashed worker before selecting new work.
  const { data: stalled } = await db.from('publishing_jobs')
    .select('id, attempts, max_attempts')
    .eq('status', 'processing')
    .lt('locked_at', leaseExpired);

  for (const job of stalled ?? []) {
    const exhausted = (job.attempts || 0) >= (job.max_attempts ?? 5);
    await db.from('publishing_jobs')
      .update(exhausted
        ? { status: 'dead_letter', locked_at: null, last_error: 'Worker lease expired after final attempt', updated_at: now.toISOString() }
        : { status: 'queued', locked_at: null, run_after: now.toISOString(), updated_at: now.toISOString() })
      .eq('id', job.id);
  }

  let query = db.from('publishing_jobs')
    .select('*,posts(*)')
    .eq('status', 'queued')
    .lte('run_after', now.toISOString())
    .order('created_at')
    .limit(25);

  if (targetPostId) {
    query = db.from('publishing_jobs')
      .select('*,posts(*)')
      .eq('post_id', targetPostId)
      .limit(1);
  }

  const { data: jobs, error } = await query;
  if (error) return json({ error: 'Unable to load jobs' }, 500, req);

  let succeeded = 0;
  for (const job of jobs ?? []) {
    const nextAttempt = (job.attempts || 0) + 1;
    const { data: locked } = await db.from('publishing_jobs')
      .update({ status: 'processing', attempts: nextAttempt, locked_at: new Date().toISOString() })
      .eq('id', job.id)
      .select('id')
      .maybeSingle();
    if (!locked) continue;

    const idempotencyKey = `post_${job.post_id || job.id}_${Date.now()}_att${nextAttempt}`;

    try {
      const result = await dispatchPost(db, job.posts, job.tenant_id, {
        idempotencyKey,
        publishNow: true
      });

      await db.from('publishing_jobs').update({
        status: 'succeeded',
        provider: result.provider,
        result: result.rawResponse,
        locked_at: null,
        updated_at: new Date().toISOString()
      }).eq('id', job.id);

      await db.from('posts').update({
        status: 'published',
        provider: result.provider,
        published_at: result.publishedAt,
        zernio_post_id: result.apiPostId,
        platform_results: result.rawResponse,
        error_message: null
      }).eq('id', job.post_id).eq('tenant_id', job.tenant_id);

      succeeded++;
    } catch (e: any) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      const terminal = nextAttempt >= (job.max_attempts ?? 5);
      const delay = Math.min(3600000, 2 ** nextAttempt * 1000);

      await db.from('publishing_jobs').update({
        status: terminal ? 'dead_letter' : 'queued',
        run_after: new Date(Date.now() + delay).toISOString(),
        locked_at: null,
        last_error: errorMsg,
        result: { error: errorMsg },
        updated_at: new Date().toISOString()
      }).eq('id', job.id);

      await db.from('posts').update({
        status: terminal ? 'failed' : 'publishing',
        error_message: terminal ? errorMsg : null
      }).eq('id', job.post_id).eq('tenant_id', job.tenant_id);
    }
  }

  return json({ processed: jobs?.length ?? 0, succeeded }, 200, req);
});
