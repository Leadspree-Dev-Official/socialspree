import { createClient } from 'npm:@supabase/supabase-js@2.48.1';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://socialspree.leadspree.in',
  'https://socialspree.pages.dev',
  'https://socialspree.vercel.app',
  'https://leadspree.io',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

export const ALLOWED_WEB_ORIGINS = () => {
  const envVal = Deno.env.get('ALLOWED_WEB_ORIGINS') || '';
  const parsed = envVal.split(',').map(v => v.trim()).filter(Boolean);
  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...parsed]));
};

export function cors(req?: Request) {
  const origin = req?.headers.get('Origin') || '';
  const allow = ALLOWED_WEB_ORIGINS();
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key, x-worker-secret, x-chatgpt-api-key, x-api-key',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin'
  };
  if (
    origin &&
    (allow.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.pages.dev') ||
      origin.endsWith('.leadspree.in') ||
      origin.endsWith('.leadspree.io'))
  ) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (!origin) {
    headers['Access-Control-Allow-Origin'] = '*';
  }
  return headers;
}

export const json = (body: unknown, status = 200, req?: Request) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

export const admin = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function actor(req: Request) {
  const authorization = req.headers.get('Authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error('Unauthorized');

  const token = match[1].trim();
  if (!token) throw new Error('Unauthorized');

  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) throw new Error('Unauthorized');

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id,tenant_id,is_super_admin,role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw new Error('Unable to resolve account profile');
  if (!profile) throw new Error('Your account profile is not provisioned yet.');
  if (!profile.tenant_id && !profile.is_super_admin) throw new Error('Your account has no tenant assigned.');

  return { db, user, profile };
}

export function isPublicSafeUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const host = u.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function sha256(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function encryptionKey() {
  const raw = Deno.env.get('CREDENTIAL_ENCRYPTION_KEY');
  if (!raw) throw new Error('Credential encryption is not configured');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encrypt(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await encryptionKey(),
    new TextEncoder().encode(value)
  );
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

export async function decrypt(value: string) {
  const parts = value.split('.');
  if (parts.length !== 2) throw new Error('Invalid encrypted credential format');
  const [ivText, bodyText] = parts;
  const iv = Uint8Array.from(atob(ivText), c => c.charCodeAt(0));
  const body = Uint8Array.from(atob(bodyText), c => c.charCodeAt(0));
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await encryptionKey(), body);
  return new TextDecoder().decode(clear);
}
