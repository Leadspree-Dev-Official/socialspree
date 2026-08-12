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
