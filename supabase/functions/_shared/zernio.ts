import Zernio, { RateLimitError, ValidationError, ZernioApiError } from 'npm:@zernio/node@0.2.481';
import { decrypt } from './server.ts';

export { RateLimitError, ValidationError, ZernioApiError };

export function zernioClient(apiKey: string) {
  return new Zernio({ apiKey, baseURL: 'https://zernio.com/api', timeout: 60000 });
}

/**
 * Resolves the Zernio key for a slot.
 *
 * Per-tenant vault entry first, then a global ZERNIO_API_KEY secret — the same
 * precedence getComposioKey() uses. Without the fallback a workspace could only
 * publish once a super admin had stored a key by hand, which meant Zernio-only
 * channels (Threads, Google Business) were unreachable even with a valid key
 * available to the platform.
 */
export async function slotKey(db: any, tenantId: string, label: string) {
  try {
    const { data } = await db.schema('private').from('provider_credentials')
      .select('ciphertext').eq('tenant_id', tenantId).eq('provider', 'zernio').eq('label', label).maybeSingle();
    if (data?.ciphertext) return await decrypt(data.ciphertext);
  } catch {
    // Fall through to the platform-wide key.
  }

  const fallback = Deno.env.get('ZERNIO_API_KEY');
  if (fallback) return fallback;

  throw new Error(`Zernio API key is not configured for ${label}`);
}

export function normalizeZernioError(error: unknown) {
  if (error instanceof RateLimitError) return { code: 'rate_limit', message: error.message, retryAfterSeconds: error.getSecondsUntilReset(), retryable: true, statusCode: 429 };
  if (error instanceof ValidationError) return { code: 'validation', message: error.message, fields: error.fields, retryable: false, statusCode: 422 };
  if (error instanceof ZernioApiError) return { code: 'api_error', message: error.message, statusCode: error.statusCode, retryable: error.statusCode === 408 || error.statusCode === 409 || error.statusCode === 429 || error.statusCode >= 500 };
  return { code: 'unknown', message: error instanceof Error ? error.message : 'Zernio request failed', retryable: true, statusCode: 500 };
}
