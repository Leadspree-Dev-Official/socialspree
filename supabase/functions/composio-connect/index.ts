import { actor, cors, json } from '../_shared/server.ts';
import { getComposioKey } from '../_shared/composio.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { db, profile } = await actor(req);
    const body = await req.json();
    const { action, appName, tenantId, callbackUrl } = body;

    const targetTenantId = profile.is_super_admin ? (tenantId || profile.tenant_id) : profile.tenant_id;
    const entityId = `tenant_${targetTenantId}`;
    // Resolve per-tenant key from vault, falling back to global COMPOSIO_API_KEY env secret
    const composioApiKey = await getComposioKey(db, targetTenantId);

    if (action === 'generate_link') {
      if (!composioApiKey) {
        const demoUrl = `https://connect.composio.dev/auth?app=${encodeURIComponent(appName || 'socialspree')}&entity_id=${encodeURIComponent(entityId)}&callback_url=${encodeURIComponent(callbackUrl || '')}`;
        return json({ redirectUrl: demoUrl, connectionId: `conn_demo_${Date.now()}` });
      }

      const res = await fetch('https://backend.composio.dev/api/v1/connectedAccounts/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': composioApiKey
        },
        body: JSON.stringify({
          appName: String(appName || 'socialspree').toLowerCase(),
          entityId,
          callbackUrl
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        return json({ error: `Composio Connect Link Error (${res.status}): ${errText}` }, 502);
      }

      const data = await res.json();
      return json({
        redirectUrl: data.redirectUrl || data.url || data.link || '',
        connectionId: data.connectionId || data.id || `conn_${Date.now()}`
      });
    }

    if (action === 'get_session') {
      if (!composioApiKey) {
        return json({
          sessionId: `composio_demo_${targetTenantId}`,
          userId: entityId,
          connectedApps: ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TWITTER', 'YOUTUBE']
        });
      }

      const res = await fetch('https://backend.composio.dev/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': composioApiKey
        },
        body: JSON.stringify({ user_id: entityId })
      });

      if (!res.ok) return json({ error: 'Failed to create Composio session' }, 502);
      const data = await res.json();
      return json({
        sessionId: data.session_id || data.id,
        userId: entityId,
        connectedApps: data.connected_apps || ['INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'TWITTER']
      });
    }

    return json({ error: 'Invalid action requested' }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Composio request failed' }, 400);
  }
});
