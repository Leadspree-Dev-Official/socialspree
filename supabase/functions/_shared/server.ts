import { createClient } from 'npm:@supabase/supabase-js@2.48.1';

export const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key' };
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
export const admin = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

export async function actor(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Unauthorized');
  const db = admin();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) throw new Error('Unauthorized');
  // Supabase Third-Party Auth maps Clerk's JWT subject to the user identity.
  // Keep the lookup keyed to the verified token subject, never an email or
  // browser-supplied profile ID.
  let { data: profile } = await db.from('profiles').select('id,tenant_id,is_super_admin,role').eq('id', user.id).maybeSingle();

  if (!profile && user.email) {
    const emailLower = user.email.toLowerCase().trim();
    const { data: emailProfile } = await db.from('profiles').select('id,tenant_id,is_super_admin,role').ilike('email', emailLower).maybeSingle();
    if (emailProfile) {
      await db.from('profiles').update({ id: user.id }).eq('id', emailProfile.id);
      profile = { ...emailProfile, id: user.id };
    } else {
      const newTenantId = crypto.randomUUID();
      await db.from('tenants').insert({
        id: newTenantId,
        name: `${user.email.split('@')[0]}'s Workspace`,
        owner_email: emailLower,
        tier_plan: 'free',
        status: 'active',
        payment_status: 'paid'
      }).catch(() => {});

      const { data: newProfile } = await db.from('profiles').upsert({
        id: user.id,
        email: emailLower,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        tenant_id: newTenantId,
        role: 'business_user',
        is_super_admin: false
      }).select('id,tenant_id,is_super_admin,role').single();

      profile = newProfile;
    }
  }

  if (!profile) throw new Error('Your account profile is not provisioned yet.');
  return { db, user, profile };
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
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(), new TextEncoder().encode(value));
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}
export async function decrypt(value: string) {
  const [ivText, bodyText] = value.split('.');
  const iv = Uint8Array.from(atob(ivText), c => c.charCodeAt(0));
  const body = Uint8Array.from(atob(bodyText), c => c.charCodeAt(0));
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await encryptionKey(), body);
  return new TextDecoder().decode(clear);
}
