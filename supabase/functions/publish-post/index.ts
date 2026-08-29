import { actor, cors, json, sha256 } from '../_shared/server.ts';
import { dispatchPost } from '../_shared/dispatcher.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const { db, profile } = await actor(req);
    const { postId } = await req.json();
    const { data: post, error } = await db.from('posts').select('*').eq('id', postId).single();
    if (error || !post) return json({ error: 'Post not found' }, 404, req);
    if (!profile.is_super_admin && profile.tenant_id !== post.tenant_id) return json({ error: 'Forbidden' }, 403, req);

    const isScheduled = Boolean(post.scheduled_for);
    const supplied = req.headers.get('x-idempotency-key') || `${post.id}:${post.scheduled_for ?? 'now'}`;
    const idempotency_key = await sha256(supplied);

    // =========================================================================
    // 1. INSTANT "PUBLISH POST NOW" -> SYNCHRONOUS DIRECT DISPATCH
    // =========================================================================
    if (!isScheduled) {
      // Mark as publishing while executing
      await db.from('posts').update({ status: 'publishing' }).eq('id', post.id);

      try {
        const result = await dispatchPost(db, post, post.tenant_id, {
          idempotencyKey: idempotency_key,
          publishNow: true
        });

        // Update post with published confirmation
        await db.from('posts').update({
          status: 'published',
          provider: result.provider,
          published_at: result.publishedAt,
          zernio_post_id: result.apiPostId,
          platform_results: result.rawResponse,
          error_message: null
        }).eq('id', post.id);

        // Record in publishing_jobs for audit consistency
        await db.from('publishing_jobs').upsert({
          tenant_id: post.tenant_id,
          post_id: post.id,
          provider: result.provider,
          idempotency_key,
          status: 'succeeded',
          result: result.rawResponse,
          run_after: new Date().toISOString()
        }, { onConflict: 'idempotency_key' });

        // Record in post_logs
        await db.from('post_logs').insert({
          id: crypto.randomUUID(),
          post_id: post.id,
          tenant_id: post.tenant_id,
          api_post_id: result.apiPostId,
          request_payload: { post_id: post.id, content: post.content, media_urls: post.media_urls },
          response_payload: result.rawResponse,
          http_status: 200,
          execution_type: 'instant'
        });

        return json({
          success: true,
          status: 'published',
          postId: post.id,
          provider: result.provider,
          apiPostId: result.apiPostId,
          dispatchedChannels: result.dispatchedChannels,
          publishedAt: result.publishedAt
        }, 200, req);
      } catch (dispatchErr: any) {
        const errorMsg = dispatchErr instanceof Error ? dispatchErr.message : String(dispatchErr);
        await db.from('posts').update({
          status: 'failed',
          error_message: errorMsg
        }).eq('id', post.id);

        await db.from('publishing_jobs').upsert({
          tenant_id: post.tenant_id,
          post_id: post.id,
          provider: post.provider || 'composio',
          idempotency_key,
          status: 'dead_letter',
          last_error: errorMsg,
          run_after: new Date().toISOString()
        }, { onConflict: 'idempotency_key' });

        return json({
          error: errorMsg,
          status: 'failed',
          postId: post.id
        }, 422, req);
      }
    }

    // =========================================================================
    // 2. SCHEDULED POST -> PRECISE ONE-SHOT REGISTRATION (NO 24/7 POLLING)
    // =========================================================================
    const { data: job, error: jobError } = await db.from('publishing_jobs').upsert({
      tenant_id: post.tenant_id,
      post_id: post.id,
      provider: post.provider || 'composio',
      idempotency_key,
      status: 'queued',
      run_after: post.scheduled_for
    }, { onConflict: 'idempotency_key', ignoreDuplicates: false }).select('*').single();

    if (jobError) throw jobError;
    await db.from('posts').update({ status: 'scheduled' }).eq('id', post.id);

    // Register precise one-shot trigger if pg_cron is enabled
    try {
      const scheduledDate = new Date(post.scheduled_for);
      if (!isNaN(scheduledDate.getTime())) {
        const min = scheduledDate.getUTCMinutes();
        const hour = scheduledDate.getUTCHours();
        const day = scheduledDate.getUTCDate();
        const month = scheduledDate.getUTCMonth() + 1;
        const cronExpr = `${min} ${hour} ${day} ${month} *`;
        const jobName = `pub_post_${post.id.replace(/-/g, '_').slice(0, 20)}`;

        await db.rpc('schedule_precise_post_publish', {
          job_name: jobName,
          cron_expr: cronExpr,
          target_post_id: post.id
        }).catch(() => null);
      }
    } catch {
      // Dynamic one-shot cron helper graceful fallback
    }

    return json({
      success: true,
      queued: true,
      status: 'scheduled',
      jobId: job.id,
      scheduledFor: post.scheduled_for
    }, 200, req);

  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request failed' }, 400, req);
  }
});
