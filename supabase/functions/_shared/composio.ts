import { decrypt } from './server.ts';

export async function getComposioKey(db: any, tenantId: string) {
  try {
    const { data } = await db.schema('private').from('provider_credentials')
      .select('ciphertext').eq('tenant_id', tenantId).eq('provider', 'composio').maybeSingle();
    if (data?.ciphertext) return await decrypt(data.ciphertext);
  } catch {
    // fallback to env secret if per-tenant key isn't custom provisioned
  }
  return Deno.env.get('COMPOSIO_API_KEY') || '';
}

export function normalizeComposioError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error || 'Composio request failed');
  if (/\b429\b/.test(msg) || msg.toLowerCase().includes('rate limit')) {
    return { code: 'rate_limit', message: msg, statusCode: 429, retryable: true };
  }
  if (/\b40[13]\b/.test(msg) || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('forbidden')) {
    return { code: 'unauthorized', message: msg, statusCode: 401, retryable: false };
  }
  if (/\b422\b/.test(msg) || msg.toLowerCase().includes('validation')) {
    return { code: 'validation', message: msg, statusCode: 422, retryable: false };
  }
  return { code: 'unknown', message: msg, statusCode: 500, retryable: true };
}

// ---------------------------------------------------------------------------
// Composio v3 client
//
// The v1 API this integration was built on now returns 410 Gone:
// "This endpoint is no longer available. Please upgrade to v3 APIs."
// Every dispatch was therefore failing at the transport layer, before payload
// shape even mattered.
// ---------------------------------------------------------------------------

const COMPOSIO_V3 = 'https://backend.composio.dev/api/v3';

export interface ComposioExecution {
  ok: boolean;
  data?: any;
  error?: string;
}

/**
 * Runs one Composio tool against a connected account.
 *
 * `connectedAccountId` targets the exact channel; without it Composio would
 * have to guess which of several connected accounts to use.
 */
export async function executeTool(
  apiKey: string,
  toolSlug: string,
  connectedAccountId: string,
  entityId: string,
  args: Record<string, unknown>,
  idempotencyKey?: string
): Promise<ComposioExecution> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };
  if (idempotencyKey) headers['x-idempotency-key'] = idempotencyKey;

  const res = await fetch(`${COMPOSIO_V3}/tools/execute/${toolSlug}`, {
    method: 'POST',
    headers,
    // user_id is required even with connected_account_id; without it v3
    // returns 400 'User ID is required with connected account'.
    body: JSON.stringify({
      connected_account_id: connectedAccountId,
      user_id: entityId,
      arguments: args,
    }),
  });

  const raw = await res.text();
  let parsed: any = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = { raw };
  }

  if (!res.ok) {
    return { ok: false, error: parsed?.error?.message || parsed?.message || `HTTP ${res.status}` };
  }
  // A 200 can still carry a tool-level failure.
  if (parsed && parsed.successful === false) {
    return { ok: false, error: parsed.error || 'Tool reported failure', data: parsed };
  }
  return { ok: true, data: parsed?.data ?? parsed };
}

/** Lists the accounts Composio holds for a tenant entity. */
export async function listConnectedAccounts(apiKey: string, entityId: string): Promise<any[]> {
  const res = await fetch(
    `${COMPOSIO_V3}/connected_accounts?user_ids=${encodeURIComponent(entityId)}&limit=100`,
    { headers: { 'x-api-key': apiKey } }
  );
  if (!res.ok) return [];
  const body = await res.json().catch(() => ({}));
  return Array.isArray(body?.items) ? body.items : [];
}

/**
 * Digs the account identifier out of an identity tool's response.
 *
 * Each platform nests it differently, and a wrong guess here produces a
 * confusing downstream validation error, so search rather than assume.
 */
export function extractIdentity(platform: string, payload: any): string | null {
  if (!payload) return null;

  const firstOf = (...candidates: unknown[]) =>
    candidates.find(v => typeof v === 'string' && v.length > 0) as string | undefined;

  // Facebook wraps its result in response_data; Instagram returns it flat.
  const outer = payload?.data ?? payload;
  const container = outer?.response_data ?? outer;

  switch (String(platform).toLowerCase()) {
    case 'facebook': {
      // FACEBOOK_GET_USER_PAGES -> { response_data: { data: [ { id, name } ] } }
      const pages = container?.data ?? container?.pages ?? container;
      const page = Array.isArray(pages) ? pages[0] : pages;
      return firstOf(page?.id, page?.page_id) ?? null;
    }
    case 'instagram': {
      const user = container?.user ?? container;
      return firstOf(user?.id, user?.ig_user_id, user?.user_id) ?? null;
    }
    case 'linkedin': {
      const me = container?.author ?? container;
      const id = firstOf(me?.author, me?.sub, me?.id, me?.urn);
      if (!id) return null;
      return id.startsWith('urn:') ? id : `urn:li:person:${id}`;
    }
    default:
      return null;
  }
}
