/**
 * Mints a Composio OAuth link so a customer can connect a channel.
 *
 * Rewritten for the v3 API. The previous implementation called
 * /api/v1/connectedAccounts/link, which now returns 410 Gone, and fell back to
 * a hand-built connect.composio.dev URL when no key was present — a link that
 * looks plausible and cannot work. Both paths produced a "connect" flow that
 * could never actually connect anything.
 */
import { actor, cors, json } from '../_shared/server.ts';
import { getComposioKey } from '../_shared/composio.ts';

const COMPOSIO_V3 = 'https://backend.composio.dev/api/v3';

/** Finds the auth config for a toolkit. Absent means the channel was never set up in Composio. */
async function findAuthConfig(apiKey: string, toolkitSlug: string): Promise<string | null> {
  const res = await fetch(`${COMPOSIO_V3}/auth_configs?limit=100`, {
    headers: { 'x-api-key': apiKey },
  });
  if (!res.ok) return null;

  const body = await res.json().catch(() => ({}));
  const match = (body?.items ?? []).find(
    (item: any) => String(item?.toolkit?.slug ?? '').toLowerCase() === toolkitSlug
  );
  return match?.id ?? null;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });

  try {
    const { db, profile } = await actor(req);
    const body = await req.json().catch(() => ({}));
    const { action, appName, tenantId, callbackUrl } = body;

    const targetTenantId = profile.is_super_admin ? (tenantId || profile.tenant_id) : profile.tenant_id;
    if (!targetTenantId) return json({ error: 'No tenant assigned' }, 403, req);

    const entityId = `tenant_${targetTenantId}`;
    const composioApiKey = await getComposioKey(db, targetTenantId);

    // Without a key there is no honest link to hand back. Say so rather than
    // returning a decorative URL that fails after the customer clicks it.
    if (!composioApiKey) {
      return json({ error: 'Composio is not configured for this workspace.' }, 503, req);
    }

    if (action === 'generate_link') {
      const toolkitSlug = String(appName || '').toLowerCase();
      if (!toolkitSlug) return json({ error: 'A channel is required' }, 400, req);

      const authConfigId = await findAuthConfig(composioApiKey, toolkitSlug);
      if (!authConfigId) {
        return json(
          {
            error: `${appName} is not set up in your Composio account yet. Add an auth config for it in the Composio dashboard, then try again.`,
          },
          422,
          req
        );
      }

      const res = await fetch(`${COMPOSIO_V3}/connected_accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': composioApiKey },
        body: JSON.stringify({
          auth_config: { id: authConfigId },
          connection: {
            user_id: entityId,
            ...(callbackUrl ? { callback_url: callbackUrl } : {}),
          },
        }),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = { raw };
      }

      if (!res.ok) {
        return json(
          { error: data?.error?.message || `Composio rejected the connect request (${res.status}).` },
          502,
          req
        );
      }

      const redirectUrl =
        data?.connection_data?.val?.redirectUrl ??
        data?.redirect_url ??
        data?.redirectUrl ??
        data?.connection_data?.redirect_url;

      if (!redirectUrl) {
        return json({ error: 'Composio did not return an authorisation URL.' }, 502, req);
      }

      return json({ redirectUrl, connectionId: data?.id ?? null }, 200, req);
    }

    if (action === 'get_session') {
      // v3 has no session concept; report what is actually connected instead.
      const res = await fetch(
        `${COMPOSIO_V3}/connected_accounts?user_ids=${encodeURIComponent(entityId)}&limit=100`,
        { headers: { 'x-api-key': composioApiKey } }
      );
      if (!res.ok) return json({ error: 'Could not read connected accounts' }, 502, req);

      const data = await res.json().catch(() => ({}));
      const connectedApps = [
        ...new Set(
          (data?.items ?? [])
            .filter((item: any) => item?.status === 'ACTIVE')
            .map((item: any) => String(item?.toolkit?.slug ?? '').toUpperCase())
            .filter(Boolean)
        ),
      ];

      return json({ userId: entityId, connectedApps }, 200, req);
    }

    return json({ error: 'Invalid action requested' }, 400, req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Composio request failed' }, 400, req);
  }
});
