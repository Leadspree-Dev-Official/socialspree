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
    const { data } = await zernioClient(key).accounts.listAccounts();
    const accounts = data?.accounts ?? [];
    for (const account of accounts) {
      const platform = account.platform === 'twitter' ? 'x' : account.platform === 'googlebusiness' ? 'google_business' : account.platform;
      await db.from('social_connections').upsert({ tenant_id: tenantId, platform, channel_account_id: account._id, provider_profile_id: typeof account.profileId === 'string' ? account.profileId : account.profileId?._id, account_name: account.displayName || account.username || account._id, account_handle: account.username ? `@${account.username}` : null, account_avatar: account.profilePicture || null, slot_number: Number(String(label).replace(/\D/g, '')) || 1, status: account.isActive ? 'active' : 'disconnected', health_status: account.needsReconnection ? 'reconnect_required' : 'healthy', provider_payload: account, last_synced_at: new Date().toISOString() }, { onConflict: 'tenant_id,channel_account_id' });
    }
    return json({ accounts }, 200, req);
  } catch (e) { const n = normalizeZernioError(e); return json({ error: n.message, code: n.code, retryAfterSeconds: n.retryAfterSeconds }, n.statusCode && n.statusCode >= 400 ? n.statusCode : 400, req); }
});
