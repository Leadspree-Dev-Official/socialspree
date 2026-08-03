import { actor, cors, encrypt, json, sha256 } from '../_shared/server.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { db, user, profile } = await actor(req);
    const body = await req.json();
    const provider = String(body.provider || '').toUpperCase();
    const tenantId = body.tenantId || profile.tenant_id;
    if (!tenantId || (!profile.is_super_admin && tenantId !== profile.tenant_id)) return json({ error: 'Forbidden' }, 403);
    const clientId = Deno.env.get(`${provider}_CLIENT_ID`);
    const clientSecret = Deno.env.get(`${provider}_CLIENT_SECRET`);
    const authorizeUrl = Deno.env.get(`${provider}_AUTHORIZE_URL`);
    const tokenUrl = Deno.env.get(`${provider}_TOKEN_URL`);
    if (!clientId || !clientSecret || !authorizeUrl || !tokenUrl) return json({ error: 'OAuth provider is not configured' }, 503);
    if (body.action === 'start') {
      const state = crypto.randomUUID();
      const verifier = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
      const challengeBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      const challenge = btoa(String.fromCharCode(...new Uint8Array(challengeBytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
      await db.rpc('create_oauth_state', { target_hash: await sha256(state), target_tenant: tenantId, target_provider: provider, target_redirect: body.redirectUri, target_verifier: verifier, target_expiry: new Date(Date.now() + 600000).toISOString(), target_user: user.id });
      const url = new URL(authorizeUrl); url.searchParams.set('client_id', clientId); url.searchParams.set('redirect_uri', body.redirectUri); url.searchParams.set('response_type', 'code'); url.searchParams.set('state', state); url.searchParams.set('code_challenge', challenge); url.searchParams.set('code_challenge_method', 'S256'); if (body.scope) url.searchParams.set('scope', body.scope);
      return json({ authorizationUrl: url.toString() });
    }
    if (body.action === 'callback') {
      const stateHash = await sha256(body.state || '');
      const { data: states } = await db.rpc('consume_oauth_state', { target_hash: stateHash });
      const saved = states?.[0];
      if (!saved) return json({ error: 'Invalid or expired OAuth state' }, 400);
      const tokenResponse = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code: body.code, client_id: clientId, client_secret: clientSecret, redirect_uri: saved.redirect_uri, code_verifier: saved.code_verifier || '' }) });
      if (!tokenResponse.ok) return json({ error: 'OAuth token exchange failed' }, 502);
      const tokens = await tokenResponse.json();
      const ciphertext = await encrypt(JSON.stringify(tokens));
      await db.rpc('store_provider_credential', { target_tenant: saved.tenant_id, target_provider: provider.toLowerCase(), target_label: 'oauth', target_ciphertext: ciphertext });
      return json({ connected: true, expiresIn: tokens.expires_in });
    }
    return json({ error: 'Unknown action' }, 400);
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'OAuth request failed' }, 400); }
});
