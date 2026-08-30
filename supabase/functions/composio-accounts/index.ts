import { actor, cors, json } from '../_shared/server.ts';
import { getComposioKey, normalizeComposioError, listConnectedAccounts, executeTool, extractIdentity } from '../_shared/composio.ts';
import { capabilityFor } from '../_shared/platforms.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const { db, profile } = await actor(req);
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenantId || profile.tenant_id;
    if (!profile.is_super_admin && tenantId !== profile.tenant_id) return json({ error: 'Forbidden' }, 403, req);

    const apiKey = await getComposioKey(db, tenantId);
    const entityId = `tenant_${tenantId}`;
    const label = body.label || 'slot-1';

    if (!apiKey) return json({ error: 'Composio is not configured for this workspace' }, 503, req);

    // v1 returns 410 Gone; v3 is the live listing endpoint.
    const accounts: any[] = await listConnectedAccounts(apiKey, entityId);

    const syncedAccounts = [];
    for (const acc of accounts) {
      // v3 nests the toolkit; keep the older shapes as a fallback.
      const rawAppName = String(
        acc?.toolkit?.slug || acc.appName || acc.app_name || acc.toolkit || ''
      ).toLowerCase();
      let platform = rawAppName;
      if (platform === 'twitter' || platform === 'x') continue; // X is not a supported channel
      if (platform === 'googlebusiness') platform = 'google_business';

      // Build a stable, deterministic channel ID for upsert idempotency.
      // Prefer Composio's own stable IDs; fall back to a deterministic key from entityId+platform.
      const channelAccountId = acc.id || acc.connectionId || acc.connectedAccountId
        || `composio_${entityId}_${platform}_${rawAppName}`;
      // Publishing needs a page id / user id / author URN, and none of them are
      // on the connected account. Resolve it here so dispatch never has to.
      let publishingIdentity: string | null = null;
      const capability = capabilityFor(platform);
      if (capability.identityAction && acc.status === 'ACTIVE') {
        try {
          const identityResult = await executeTool(
            apiKey, capability.identityAction, channelAccountId, entityId, {}
          );
          if (identityResult.ok) {
            publishingIdentity = extractIdentity(platform, identityResult.data);
          }
        } catch {
          // Leave it unresolved; dispatch reports it rather than failing blind.
        }
      }

      const record = {
        tenant_id: tenantId,
        platform,
        channel_account_id: channelAccountId,
        provider: 'composio',
        provider_profile_id: publishingIdentity ?? null,
        account_name: acc.accountName || acc.displayName || acc.name || `${platform.toUpperCase()} Account`,
        account_handle: acc.handle ? `@${acc.handle}` : null,
        account_avatar: acc.avatar || null,
        slot_number: Number(String(label).replace(/\D/g, '')) || 1,
        status: acc.status === 'ACTIVE' || acc.status === 'active' ? 'active' : 'disconnected',
        health_status: acc.status === 'EXPIRED' || acc.status === 'FAILED' ? 'reconnect_required' : (publishingIdentity ? 'healthy' : 'needs_identity'),
        provider_payload: acc,
        last_synced_at: new Date().toISOString()
      };

      await db.from('social_connections').upsert(record, { onConflict: 'tenant_id,channel_account_id' });
      syncedAccounts.push(record);
    }

    return json({ accounts: syncedAccounts }, 200, req);
  } catch (e) {
    const n = normalizeComposioError(e);
    return json({ error: n.message, code: n.code }, n.statusCode || 400, req);
  }
});
