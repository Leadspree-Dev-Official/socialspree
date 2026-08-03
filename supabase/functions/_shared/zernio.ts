import Zernio, { RateLimitError, ValidationError, ZernioApiError } from 'npm:@zernio/node@0.2.481';
import { decrypt } from './server.ts';

export { RateLimitError, ValidationError, ZernioApiError };

export function zernioClient(apiKey: string) {
  return new Zernio({ apiKey, baseURL: 'https://zernio.com/api', timeout: 60000 });
}

export async function slotKey(db: any, tenantId: string, label: string) {
  const { data, error } = await db.schema('private').from('provider_credentials')
    .select('ciphertext').eq('tenant_id', tenantId).eq('provider', 'zernio').eq('label', label).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Zernio API key is not configured for ${label}`);
  return decrypt(data.ciphertext);
}

export function normalizeZernioError(error: unknown) {
  if (error instanceof RateLimitError) return { code: 'rate_limit', message: error.message, retryAfterSeconds: error.getSecondsUntilReset(), retryable: true };
  if (error instanceof ValidationError) return { code: 'validation', message: error.message, fields: error.fields, retryable: false };
  if (error instanceof ZernioApiError) return { code: 'api_error', message: error.message, statusCode: error.statusCode, retryable: error.statusCode === 408 || error.statusCode === 409 || error.statusCode === 429 || error.statusCode >= 500 };
  return { code: 'unknown', message: error instanceof Error ? error.message : 'Zernio request failed', retryable: true };
}
