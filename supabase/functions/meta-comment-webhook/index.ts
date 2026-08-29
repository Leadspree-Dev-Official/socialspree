import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { admin, cors, json } from '../_shared/server.ts';

const META_VERIFY_TOKEN = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN') || 'socialspree_meta_autoresponder_token_2026';
const META_APP_SECRET = Deno.env.get('META_APP_SECRET');

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

serve(async (req: Request) => {
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

              // Record in live_comment_trigger_logs
              const logEntry = {
                tenant_id: rule.tenant_id,
                rule_id: rule.id,
                platform,
                commenter_username: senderUsername,
                comment_text: commentText,
                reply_dispatched: formattedPublicReply,
                matched_keyword: matchedKeyword,
              };

              await db.from('live_comment_trigger_logs').insert(logEntry).catch(() => {});

              // Increment rule trigger count
              await db
                .from('auto_responder_rules')
                .update({ trigger_count: (rule.trigger_count || 0) + 1 })
                .eq('id', rule.id)
                .catch(() => {});

              responsesDispatched.push({
                ruleId: rule.id,
                ruleName: rule.name,
                platform,
                commenter: senderUsername,
                commentId,
                publicReply: formattedPublicReply,
                privateDm: formattedDmReply
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
        dispatchedCount: responsesDispatched.length,
        dispatched: responsesDispatched
      });
    } catch (err: any) {
      console.error('Webhook processing error:', err);
      return json({ error: err?.message || 'Webhook processing failed' }, 500);
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});
