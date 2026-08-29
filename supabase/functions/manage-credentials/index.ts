import { actor, cors, encrypt, json } from '../_shared/server.ts';
import { zernioClient } from '../_shared/zernio.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const { db, profile } = await actor(req);
    if (!profile.is_super_admin) return json({ error: 'Forbidden' }, 403);
    const { tenantId, provider, label = 'default', secret, remove = false, generate = false } = await req.json();
    if (!tenantId || !provider) return json({ error: 'tenantId and provider are required' }, 400);
    if (remove) {
      const { error } = await db.rpc('delete_provider_credential', { target_tenant: tenantId, target_provider: provider, target_label: label });
      if (error) throw error;
      return json({ removed: true });
    }
    const clearSecret = generate ? `ssp_${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}` : secret;
    if (typeof clearSecret !== 'string' || clearSecret.length < 8) return json({ error: 'A valid secret is required' }, 400);
    let validation: unknown = undefined;
    if (provider === 'zernio') {
      const { data } = await zernioClient(clearSecret).accounts.listAccounts();
      validation = { accountCount: data?.accounts?.length ?? 0 };
    }
    const ciphertext = await encrypt(clearSecret);
    const { error } = await db.rpc('store_provider_credential', { target_tenant: tenantId, target_provider: provider, target_label: label, target_ciphertext: ciphertext });
    if (error) throw error;
    return json({ saved: true, masked: `••••${clearSecret.slice(-4)}`, validation, generatedSecret: generate ? clearSecret : undefined });
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'Request failed' }, 400); }
});
