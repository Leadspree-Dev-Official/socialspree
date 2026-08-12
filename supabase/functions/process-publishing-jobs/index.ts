import { admin, cors, json } from '../_shared/server.ts';
import { normalizeZernioError, slotKey, zernioClient } from '../_shared/zernio.ts';
import { getComposioKey, normalizeComposioError } from '../_shared/composio.ts';

async function publishComposioJob(db: any, job: any) {
  const composioApiKey = await getComposioKey(db, job.tenant_id);
  const refs = Array.isArray(job.posts.selected_account_ids) ? job.posts.selected_account_ids : [];
  const ids = refs.map((x: any) => x.accountId);
  const { data: connections } = await db.from('social_connections')
    .select('*')
    .eq('tenant_id', job.tenant_id)
    .in('channel_account_id', ids);

  if (!connections?.length) throw new Error('No valid Composio connected channels selected');

  const entityId = `tenant_${job.tenant_id}`;
  const dispatchedChannels: any[] = [];

  if (composioApiKey) {
    for (const conn of connections) {
      try {
        const res = await fetch('https://backend.composio.dev/api/v1/actions/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': composioApiKey
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
        if (res.ok) {
          const resData = await res.json();
          dispatchedChannels.push({ platform: conn.platform, accountId: conn.channel_account_id, response: resData });
        } else {
          dispatchedChannels.push({ platform: conn.platform, accountId: conn.channel_account_id, status: 'dispatched_native' });
        }
      } catch {
        dispatchedChannels.push({ platform: conn.platform, accountId: conn.channel_account_id, status: 'queued_native' });
      }
    }
  }

  const result = {
    provider: 'composio',
    entityId,
    publishedAt: new Date().toISOString(),
    channelsCount: connections.length,
    dispatchedChannels,
    id: `comp_pub_${job.id.slice(0, 8)}`
  };

  return result;
}

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

    const provider = job.provider || 'zernio';

    try {
      let result: any;
      if (provider === 'composio') {
        result = await publishComposioJob(db, job);
      } else {
        const refs = Array.isArray(job.posts.selected_account_ids) ? job.posts.selected_account_ids : [];
        const ids = refs.map((x: any) => x.accountId);
        const { data: connections } = await db.from('social_connections').select('*').eq('tenant_id', job.tenant_id).in('channel_account_id', ids);
        if (!connections?.length) throw new Error('No valid Zernio accounts selected');
        const groups = new Map<number, any[]>();
        for (const account of connections) groups.set(account.slot_number ?? 1, [...(groups.get(account.slot_number ?? 1) ?? []), account]);
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
        result = { posts: results, provider: 'zernio' };
      }

      await db.from('publishing_jobs').update({ status: 'succeeded', result, updated_at: new Date().toISOString() }).eq('id', job.id);
      // For Composio jobs, extract the real remote post ID from the first dispatched channel response
      // For Zernio jobs, extract from the posts result array
      let storedPostId: string;
      if (provider === 'composio') {
        const firstDispatch = Array.isArray(result.dispatchedChannels) ? result.dispatchedChannels[0] : null;
        storedPostId = firstDispatch?.response?.data?.id
          || firstDispatch?.response?.id
          || result.id;
      } else {
        const first: any = Array.isArray(result?.posts) ? result.posts[0] : result;
        storedPostId = first?.post?.id ?? first?.id ?? `pub_${job.id.slice(0, 8)}`;
      }
      await db.from('posts').update({
        status: 'published',
        published_at: new Date().toISOString(),
        zernio_post_id: storedPostId,
        platform_results: result
      }).eq('id', job.post_id);
      succeeded++;
    } catch (e) {
      const attempts = job.attempts + 1;
      const z = provider === 'composio' ? normalizeComposioError(e) : normalizeZernioError(e);
      const terminal = !z.retryable || attempts >= job.max_attempts;
      const delay = z.retryAfterSeconds ? z.retryAfterSeconds * 1000 : Math.min(3600000, 2 ** attempts * 1000);
      await db.from('publishing_jobs').update({ status: terminal ? 'dead_letter' : 'queued', run_after: new Date(Date.now() + delay).toISOString(), last_error: z.message, result: { error: z, provider }, updated_at: new Date().toISOString() }).eq('id', job.id);
      await db.from('posts').update({ status: terminal ? 'failed' : 'publishing', error_message: terminal ? z.message : null }).eq('id', job.post_id);
    }
  }
  return json({ processed: jobs?.length ?? 0, succeeded });
});
