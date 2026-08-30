/**
 * Cloudinary upload signer.
 *
 * The browser previously uploaded straight to Cloudinary with an unsigned
 * preset. That works only while the preset stays unrestricted — anyone who
 * learns the cloud name and preset can upload to the account, and the moment
 * the preset is locked down in the Cloudinary dashboard every upload path in
 * the product breaks at once.
 *
 * This endpoint signs a narrowly-scoped upload request instead. The API secret
 * never leaves the server, the folder is pinned to the caller's tenant so one
 * workspace cannot write into another's namespace, and the signature expires.
 */
import { actor, cors, json } from '../_shared/server.ts';

const SIGNATURE_TTL_SECONDS = 300;

/** Cloudinary signs the SHA-1 of sorted `key=value` pairs joined by `&`, plus the secret. */
async function signParams(params: Record<string, string>, apiSecret: string): Promise<string> {
  const canonical = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const digest = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(`${canonical}${apiSecret}`)
  );

  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });

  try {
    const { profile } = await actor(req);
    if (!profile.tenant_id) return json({ error: 'No tenant assigned' }, 403, req);

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      return json({ error: 'Media storage is not configured' }, 503, req);
    }

    const body = await req.json().catch(() => ({}));

    // Tenant-scoped folder. Callers may nest below it but never escape it.
    const requestedSubfolder = typeof body.subfolder === 'string' ? body.subfolder : '';
    const safeSubfolder = requestedSubfolder
      .replace(/\.\./g, '')
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-zA-Z0-9/_-]/g, '');
    const folder = safeSubfolder
      ? `socialspree/${profile.tenant_id}/${safeSubfolder}`
      : `socialspree/${profile.tenant_id}`;

    const timestamp = Math.floor(Date.now() / 1000);

    // Only these parameters are signed, so only these can be sent with the upload.
    const signedParams: Record<string, string> = {
      folder,
      timestamp: String(timestamp),
    };

    const signature = await signParams(signedParams, apiSecret);

    return json(
      {
        cloudName,
        apiKey,
        timestamp,
        folder,
        signature,
        expiresAt: new Date((timestamp + SIGNATURE_TTL_SECONDS) * 1000).toISOString(),
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      },
      200,
      req
    );
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request failed' }, 400, req);
  }
});
