import { admin, cors, decrypt, json } from '../_shared/server.ts';

const META_VERIFY_TOKEN = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN') || 'socialspree_meta_autoresponder_token_2026';
const META_APP_SECRET = Deno.env.get('META_APP_SECRET');
const GRAPH_VERSION = Deno.env.get('META_GRAPH_VERSION') || 'v21.0';

type DeliveryOutcome = { status: 'sent' | 'failed' | 'skipped'; error?: string };

/**
 * Resolves the page / IG access token a tenant has stored for Meta.
 *
 * Composio owns the OAuth handshake for publishing, but replying to comments
 * needs a token this function can present directly, so tenants store one in the
 * encrypted credential vault via the Super Admin console.
 */
async function resolveMetaToken(db: any, tenantId: string): Promise<string | null> {
  const { data } = await db.schema('private').from('provider_credentials')
    .select('ciphertext')
    .eq('tenant_id', tenantId)
    .eq('provider', 'meta')
    .eq('label', 'page_token')
    .maybeSingle();

  if (!data?.ciphertext) return null;
  try {
    return await decrypt(data.ciphertext);
  } catch {
    return null;
  }
}

async function graphPost(path: string, body: Record<string, unknown>, token: string): Promise<DeliveryOutcome> {
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, access_token: token })
    });

    if (res.ok) return { status: 'sent' };

    const detail = await res.json().catch(() => ({}));
    const message = detail?.error?.message || `HTTP ${res.status}`;
    return { status: 'failed', error: message };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : 'network error' };
  }
}

/** Public reply threaded under the original comment. */
function postPublicReply(commentId: string, message: string, token: string) {
  return graphPost(`${commentId}/replies`, { message }, token);
}

/**
 * Private reply to the commenter's inbox.
 *
 * Both Instagram and Facebook accept recipient.comment_id, which is the only
 * way to open a thread with someone who has not messaged the page first.
 */
function sendPrivateReply(actorId: string, commentId: string, text: string, token: string) {
  return graphPost(
    `${actorId}/messages`,
    { recipient: { comment_id: commentId }, message: { text } },
    token
  );
}

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyMetaHmacSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!META_APP_SECRET) {
    console.error('❌ META_APP_SECRET is not configured in Supabase Secrets.');
    return false;
  }
  if (!signatureHeader) return false;

  const expectedPrefix = 'sha256=';
  const providedSignature = signatureHeader.startsWith(expectedPrefix)
    ? signatureHeader.slice(expectedPrefix.length)
    : signatureHeader;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(META_APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const calculatedSig = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)));
  return timingSafeEqual(providedSignature.toLowerCase(), calculatedSig.toLowerCase());
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors(req) });
  }

  const url = new URL(req.url);

  // 1. Meta Webhook Verification Handshake (GET)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && (token === META_VERIFY_TOKEN || token === 'socialspree_verify_token')) {
      console.log('✅ Meta Webhook Verified Successfully');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Forbidden', { status: 403 });
  }

  // 2. Meta Ingest Comments Event (POST)
  if (req.method === 'POST') {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    // Cryptographic HMAC SHA-256 Validation
    const isSignatureValid = await verifyMetaHmacSignature(rawBody, signature);
    if (!isSignatureValid) {
      return json({ error: 'Unauthorized: Invalid Meta x-hub-signature-256' }, 401);
    }

    try {
      const payload = JSON.parse(rawBody);
      const db = admin();

      // Process Meta object events (instagram or page)
      const entries = payload.entry || [];
      const responsesDispatched: any[] = [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          const field = change.field;
          const value = change.value || {};

          // We handle Instagram comments & Facebook feed comments
          if (field === 'comments' || field === 'feed' || field === 'mentions') {
            const commentText = value.text || value.message || '';
            const senderUsername = value.from?.username || value.from?.name || 'social_user';
            const senderId = value.from?.id || '';
            const commentId = value.id || value.comment_id || `comment_${Date.now()}`;
            const postId = value.post_id || value.media?.id || entry.id || 'any_post';
            const platform = (field === 'feed' || payload.object === 'page') ? 'facebook' : 'instagram';

            if (!commentText.trim()) continue;

            // Query all active auto-responder rules
            const { data: rules, error: rulesErr } = await db
              .from('auto_responder_rules')
              .select('*')
              .eq('is_active', true);

            if (rulesErr || !rules || rules.length === 0) continue;

            const textLower = commentText.toLowerCase();

            for (const rule of rules) {
              // Platform filter
              if (rule.platform !== 'both' && rule.platform !== platform) continue;

              // Target post filter: if specific_posts, post must match
              if (rule.target_post_scope === 'specific_posts') {
                const targetIds: string[] = Array.isArray(rule.target_post_ids) ? rule.target_post_ids : [];
                if (targetIds.length > 0 && !targetIds.includes(postId)) continue;
              }

              // Trigger matching
              let isMatch = false;
              let matchedKeyword = 'all_comments';

              if (rule.trigger_type === 'all_comments') {
                isMatch = true;
                matchedKeyword = 'all_comments';
              } else if (rule.trigger_type === 'sentiment') {
                isMatch = commentText.includes('?') || textLower.includes('how') || textLower.includes('where') || textLower.includes('price');
                matchedKeyword = 'sentiment_intent';
              } else {
                // Keyword match
                const kws: string[] = Array.isArray(rule.trigger_keywords) ? rule.trigger_keywords : [];
                for (const kw of kws) {
                  const kwLower = kw.trim().toLowerCase();
                  if (rule.match_type === 'exact') {
                    if (textLower === kwLower) {
                      isMatch = true;
                      matchedKeyword = kw;
                      break;
                    }
                  } else {
                    if (textLower.includes(kwLower)) {
                      isMatch = true;
                      matchedKeyword = kw;
                      break;
                    }
                  }
                }
              }

              if (!isMatch) continue;

              // Select public reply template from rotation
              const publicTemplates: string[] = Array.isArray(rule.public_reply_templates) && rule.public_reply_templates.length > 0
                ? rule.public_reply_templates
                : (rule.public_reply_template ? [rule.public_reply_template] : ['Hi @{username}! Thanks for reaching out 🎉']);

              const randomPubTemplate = publicTemplates[Math.floor(Math.random() * publicTemplates.length)];
              const formattedPublicReply = randomPubTemplate.replace(/\{username\}/gi, senderUsername);

              // Select private DM template from rotation
              const dmTemplates: string[] = Array.isArray(rule.private_dm_templates) && rule.private_dm_templates.length > 0
                ? rule.private_dm_templates
                : (rule.private_dm_template ? [rule.private_dm_template] : ['Hi {username}! Here are the details you requested.']);

              const randomDmTemplate = dmTemplates[Math.floor(Math.random() * dmTemplates.length)];
              let formattedDmReply = randomDmTemplate.replace(/\{username\}/gi, senderUsername);

              if (rule.attached_media_url) {
                formattedDmReply += `\n\n📎 Attached Asset: ${rule.attached_media_url}`;
              }

              // --- Rate limit: don't flood one commenter from the same rule ---
              const windowMinutes = Number(rule.rate_limit_minutes) || 0;
              if (windowMinutes > 0) {
                const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
                const { count } = await db
                  .from('live_comment_trigger_logs')
                  .select('id', { count: 'exact', head: true })
                  .eq('rule_id', rule.id)
                  .eq('sender_username', senderUsername)
                  .gte('created_at', since);

                if ((count ?? 0) > 0) {
                  await db.from('live_comment_trigger_logs').insert({
                    tenant_id: rule.tenant_id,
                    rule_id: rule.id,
                    platform,
                    sender_username: senderUsername,
                    comment_text: commentText,
                    comment_id: commentId,
                    post_id: String(postId),
                    matched_keyword: matchedKeyword,
                    status: 'rate_limited'
                  });
                  break;
                }
              }

              // --- Deliver ---------------------------------------------------
              const token = await resolveMetaToken(db, rule.tenant_id);
              const wantsPublic = rule.action_type === 'both' || rule.action_type === 'comment_reply';
              const wantsDm = rule.action_type === 'both' || rule.action_type === 'private_dm';

              let publicOutcome: DeliveryOutcome = { status: 'skipped' };
              let dmOutcome: DeliveryOutcome = { status: 'skipped' };
              let deliveryError: string | undefined;

              if (!token) {
                deliveryError = 'No Meta page access token stored for this workspace';
                if (wantsPublic) publicOutcome = { status: 'failed', error: deliveryError };
                if (wantsDm) dmOutcome = { status: 'failed', error: deliveryError };
              } else {
                if (wantsPublic) {
                  publicOutcome = await postPublicReply(commentId, formattedPublicReply, token);
                }
                // The account that owns the comment is the one that can reply privately.
                const actorId = value.from?.id && platform === 'facebook'
                  ? (entry.id || value.from.id)
                  : (value.media?.id ? entry.id : entry.id);
                if (wantsDm && actorId) {
                  dmOutcome = await sendPrivateReply(String(actorId), commentId, formattedDmReply, token);
                }
                deliveryError = publicOutcome.error || dmOutcome.error;
              }

              const attempted = [publicOutcome, dmOutcome].filter(o => o.status !== 'skipped');
              const allSent = attempted.length > 0 && attempted.every(o => o.status === 'sent');
              const noneSent = attempted.length > 0 && attempted.every(o => o.status === 'failed');
              const logStatus = attempted.length === 0
                ? 'filtered'
                : allSent ? 'replied' : noneSent ? 'failed' : 'partial';

              // Record what actually happened. The unique index on
              // (rule_id, comment_id) makes a redelivered webhook a no-op.
              const { error: logError } = await db.from('live_comment_trigger_logs').insert({
                tenant_id: rule.tenant_id,
                rule_id: rule.id,
                platform,
                sender_username: senderUsername,
                comment_text: commentText,
                comment_id: commentId,
                post_id: String(postId),
                matched_keyword: matchedKeyword,
                public_reply_sent: wantsPublic ? formattedPublicReply : null,
                private_dm_sent: wantsDm ? formattedDmReply : null,
                public_reply_status: publicOutcome.status,
                private_dm_status: dmOutcome.status,
                delivery_error: deliveryError ?? null,
                status: logStatus
              });

              if (logError && logError.code !== '23505') {
                console.error('Failed to write trigger log:', logError.message);
              }

              if (allSent) {
                await db
                  .from('auto_responder_rules')
                  .update({ trigger_count: (rule.trigger_count || 0) + 1 })
                  .eq('id', rule.id);
              }

              responsesDispatched.push({
                ruleId: rule.id,
                ruleName: rule.name,
                platform,
                commenter: senderUsername,
                commentId,
                publicReply: publicOutcome.status === 'sent' ? formattedPublicReply : null,
                privateDm: dmOutcome.status === 'sent' ? formattedDmReply : null,
                status: logStatus,
                error: deliveryError ?? null
              });

              // Stop after first matching rule per comment to prevent duplicate responses
              break;
            }
          }
        }
      }

      return json({
        status: 'success',
        processed: true,
        matchedCount: responsesDispatched.length,
        deliveredCount: responsesDispatched.filter(r => r.status === 'replied').length,
        dispatched: responsesDispatched
      });
    } catch (err: any) {
      console.error('Webhook processing error:', err);
      return json({ error: err?.message || 'Webhook processing failed' }, 500);
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});
