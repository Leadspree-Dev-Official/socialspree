import { actor, cors, json } from '../_shared/server.ts';
import { slotKey, zernioClient, normalizeZernioError } from '../_shared/zernio.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const { db, profile } = await actor(req); const body = await req.json();
    const tenantId = body.tenantId || profile.tenant_id;
    if (!profile.is_super_admin && tenantId !== profile.tenant_id) return json({ error: 'Forbidden' }, 403, req);
    const key = await slotKey(db, tenantId, body.label || 'slot-1');
    const client = zernioClient(key);
    let profileId = body.profileId;
    if (!profileId) {
      const { data: profiles } = await client.profiles.listProfiles();
      profileId = profiles?.profiles?.[0]?._id;
    }
    if (!profileId) return json({ error: 'No Zernio profile exists for this API key' }, 400, req);
    const platform = body.platform === 'google_business' ? 'googlebusiness' : body.platform;
    const { data } = await client.connect.getConnectUrl({ path: { platform }, query: { redirect_url: body.redirectUrl, profileId, headless: false } } as any);
    return json(data, 200, req);
  } catch (e) { const n = normalizeZernioError(e); return json({ error: n.message, code: n.code }, 400, req); }
});
