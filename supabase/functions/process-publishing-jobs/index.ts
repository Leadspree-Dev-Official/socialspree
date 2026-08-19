import { admin, cors, json } from '../_shared/server.ts';
import { normalizeZernioError, slotKey, zernioClient } from '../_shared/zernio.ts';
import { getComposioKey, normalizeComposioError } from '../_shared/composio.ts';

const LEASE_MS = 10 * 60 * 1000;

async function publishComposioJob(db: any, job: any, idempotencyKey: string) {
  const composioApiKey = await getComposioKey(db, job.tenant_id);
  if (!composioApiKey) throw new Error('Composio provider is not configured');

  const refs = Array.isArray(job.posts.selected_account_ids) ? job.posts.selected_account_ids : [];
  const ids = refs.map((x: any) => x?.accountId).filter(Boolean);
  if (!ids.length) throw new Error('No accounts selected');

  const { data: connections, error: connectionError } = await db.from('social_connections')
    .select('platform,channel_account_id')
    .eq('tenant_id', job.tenant_id)
    .in('channel_account_id', ids);
  if (connectionError) throw connectionError;
  if (!connections?.length) throw new Error('No valid Composio connected channels selected');

  const entityId = `tenant_${job.tenant_id}`;
  const dispatchedChannels: any[] = [];
  for (const conn of connections) {
    const res = await fetch('https://backend.composio.dev/api/v1/actions/execute', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'x-api-key': composioApiKey,
        'x-idempotency-key': `${idempotencyKey}_${conn.channel_account_id}`
      },
      body: JSON.stringify({
        actionName: `${String(conn.platform).toUpperCase()}_CREATE_POST`,
        entityId,
        params: {
          content: job.posts.content || '',
          mediaUrls: job.posts.media_urls || [],
          connectedAccountId: conn.channel_account_id
        }
      })
    });
    const responseText = await res.text();
    if (!res.ok) {
      throw new Error(`Composio publish failed (${res.status}): ${responseText.slice(0, 200)}`);
    }
    let response: unknown = undefined;
    try { response = responseText ? JSON.parse(responseText) : undefined; } catch { /* keep response undefined */ }
    dispatchedChannels.push({ platform: conn.platform, accountId: conn.channel_account_id, response });
  }

  return {
    provider: 'composio',
    entityId,
    publishedAt: new Date().toISOString(),
    channelsCount: connections.length,
    dispatchedChannels,
    id: `comp_pub_${job.id.slice(0, 8)}`
  };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  const workerSecret = Deno.env.get('WORKER_SECRET');
  const suppliedSecret = req.headers.get('x-worker-secret');
  if (!workerSecret || !suppliedSecret || suppliedSecret !== workerSecret) return json({ error: 'Unauthorized' }, 401, req);

  const db = admin();
  const now = new Date();
  const leaseExpired = new Date(now.getTime() - LEASE_MS).toISOString();

  // Recover jobs abandoned by a crashed worker before selecting new work.
  await db.from('publishing_jobs')
    .update({ status: 'queued', locked_at: null, run_after: now.toISOString(), updated_at: now.toISOString() })
    .eq('status', 'processing')
    .lt('locked_at', leaseExpired)
    .lt('attempts', 5);

  const { data: jobs, error } = await db.from('publishing_jobs')
    .select('*,posts(*)')
    .eq('status', 'queued')
    .lte('run_after', now.toISOString())
    .order('created_at')
    .limit(25);
  if (error) return json({ error: 'Unable to load jobs' }, 500, req);

  let succeeded = 0;
  for (const job of jobs ?? []) {
    const nextAttempt = (job.attempts || 0) + 1;
    const { data: locked } = await db.from('publishing_jobs')
      .update({ status: 'processing', attempts: nextAttempt, locked_at: new Date().toISOString() })
      .eq('id', job.id)
      .eq('status', 'queued')
      .select('id')
      .maybeSingle();
    if (!locked) continue;

    const provider = job.provider === 'composio' ? 'composio' : 'zernio';
    const idempotencyKey = `post_${job.post_id || job.id}_${Date.now()}_att${nextAttempt}`;

    try {
      let result: any;
      if (provider === 'composio') {
        result = await publishComposioJob(db, job, idempotencyKey);
      } else {
        const refs = Array.isArray(job.posts.selected_account_ids) ? job.posts.selected_account_ids : [];
        const ids = refs.map((x: any) => x?.accountId).filter(Boolean);
        if (!ids.length) throw new Error('No accounts selected');
        const { data: connections, error: connectionError } = await db.from('social_connections')
          .select('platform,channel_account_id,slot_number')
          .eq('tenant_id', job.tenant_id)
          .in('channel_account_id', ids);
        if (connectionError) throw connectionError;
        if (!connections?.length) throw new Error('No valid Zernio accounts selected');

        const groups = new Map<number, any[]>();
        for (const account of connections) {
          const slot = account.slot_number ?? 1;
          groups.set(slot, [...(groups.get(slot) ?? []), account]);
        }
        const results: unknown[] = [];
        for (const [slot, accounts] of groups) {
          const key = await slotKey(db, job.tenant_id, `slot-${slot}`);
          if (!key) throw new Error(`Missing Zernio credential for slot ${slot}`);
          const { data } = await zernioClient(key).posts.createPost({ body: {
            content: job.posts.content || undefined,
            mediaItems: (job.posts.media_urls ?? []).map((url: string) => ({ url, type: job.posts.media_type === 'video' ? 'video' : 'image' })),
            platforms: accounts.map(a => ({ platform: a.platform === 'x' ? 'twitter' : a.platform, accountId: a.channel_account_id })),
            ...(job.posts.scheduled_for ? { scheduledFor: job.posts.scheduled_for } : { publishNow: true }),
          } as any });
          results.push(data);
        }
        result = { posts: results, provider: 'zernio' };
      }

      const postResult: any = provider === 'composio'
        ? result.dispatchedChannels?.map((d: any) => d.response).find(Boolean)
        : (Array.isArray(result?.posts) ? result.posts[0] : result);
      const storedPostId = postResult?.post?.id ?? postResult?.data?.id ?? postResult?.id ?? `pub_${job.id.slice(0, 8)}`;

      await db.from('publishing_jobs').update({
        status: 'succeeded', result, locked_at: null, updated_at: new Date().toISOString()
      }).eq('id', job.id).eq('status', 'processing');
      await db.from('posts').update({
        status: 'published', published_at: new Date().toISOString(), zernio_post_id: storedPostId, platform_results: result
      }).eq('id', job.post_id).eq('tenant_id', job.tenant_id);
      succeeded++;
    } catch (e) {
      const z = provider === 'composio' ? normalizeComposioError(e) : normalizeZernioError(e);
      const terminal = !z.retryable || nextAttempt >= (job.max_attempts || 3);
      const delay = z.retryAfterSeconds ? z.retryAfterSeconds * 1000 : Math.min(3600000, 2 ** nextAttempt * 1000);
      await db.from('publishing_jobs').update({
        status: terminal ? 'dead_letter' : 'queued',
        run_after: new Date(Date.now() + delay).toISOString(),
        locked_at: null,
        last_error: z.message,
        result: { error: z, provider },
        updated_at: new Date().toISOString()
      }).eq('id', job.id).eq('status', 'processing');
      await db.from('posts').update({
        status: terminal ? 'failed' : 'publishing',
        error_message: terminal ? z.message : null
      }).eq('id', job.post_id).eq('tenant_id', job.tenant_id);
    }
  }

  return json({ processed: jobs?.length ?? 0, succeeded }, 200, req);
});
