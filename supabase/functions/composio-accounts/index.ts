import { actor, cors, json } from '../_shared/server.ts';
import { getComposioKey, normalizeComposioError } from '../_shared/composio.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const { db, profile } = await actor(req);
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenantId || profile.tenant_id;
    if (!profile.is_super_admin && tenantId !== profile.tenant_id) return json({ error: 'Forbidden' }, 403);

    const apiKey = await getComposioKey(db, tenantId);
    const entityId = `tenant_${tenantId}`;
    const label = body.label || 'slot-1';

    let accounts: any[] = [];
    if (apiKey) {
      const res = await fetch(`https://backend.composio.dev/api/v1/connectedAccounts?entityId=${encodeURIComponent(entityId)}`, {
        headers: { 'x-api-key': apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        accounts = data.connectedAccounts || data.items || data || [];
      }
    }

    const syncedAccounts = [];
    for (const acc of accounts) {
      const rawAppName = String(acc.appName || acc.app_name || acc.toolkit || '').toLowerCase();
      let platform = rawAppName;
      if (platform === 'twitter') platform = 'x';
      if (platform === 'googlebusiness') platform = 'google_business';

      // Build a stable, deterministic channel ID for upsert idempotency.
      // Prefer Composio's own stable IDs; fall back to a deterministic key from entityId+platform.
      const channelAccountId = acc.id || acc.connectionId || acc.connectedAccountId
        || `composio_${entityId}_${platform}_${rawAppName}`;
      const record = {
        tenant_id: tenantId,
        platform,
        channel_account_id: channelAccountId,
        provider: 'composio',
        provider_profile_id: entityId,
        account_name: acc.accountName || acc.displayName || acc.name || `${platform.toUpperCase()} Account`,
        account_handle: acc.handle ? `@${acc.handle}` : null,
        account_avatar: acc.avatar || null,
        slot_number: Number(String(label).replace(/\D/g, '')) || 1,
        status: acc.status === 'ACTIVE' || acc.status === 'active' || !acc.status ? 'active' : 'disconnected',
        health_status: acc.status === 'FAILED' ? 'reconnect_required' : 'healthy',
        provider_payload: acc,
        last_synced_at: new Date().toISOString()
      };

      await db.from('social_connections').upsert(record, { onConflict: 'tenant_id,channel_account_id' });
      syncedAccounts.push(record);
    }

    return json({ accounts: syncedAccounts });
  } catch (e) {
    const n = normalizeComposioError(e);
    return json({ error: n.message, code: n.code }, n.statusCode || 400);
  }
});
