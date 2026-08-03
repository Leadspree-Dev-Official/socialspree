import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !service) throw new Error('Missing Supabase test configuration');
const admin = createClient(url, service, { auth: { persistSession: false } });
const stamp = Date.now();
const password = `T3st-${crypto.randomUUID()}!`;
const users = [];
const tenantIds = [crypto.randomUUID(), crypto.randomUUID()];

try {
  for (let i = 0; i < 2; i++) {
    const email = `socialspree-rls-${stamp}-${i}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    users.push({ id: data.user.id, email });
    const { error: tenantError } = await admin.from('tenants').insert({ id: tenantIds[i], name: `RLS Tenant ${i}`, owner_email: email, owner_id: data.user.id });
    if (tenantError) throw tenantError;
    const { error: profileError } = await admin.from('profiles').update({ tenant_id: tenantIds[i], role: 'member', is_super_admin: false }).eq('id', data.user.id);
    if (profileError) throw profileError;
  }

  const clients = [];
  for (const user of users) {
    const client = createClient(url, anon, { auth: { persistSession: false } });
    const { error } = await client.auth.signInWithPassword({ email: user.email, password });
    if (error) throw error;
    clients.push(client);
  }

  const own = await clients[0].from('tenants').select('id');
  if (own.error) throw own.error;
  assert.deepEqual(own.data?.map(r => r.id), [tenantIds[0]]);
  const foreign = await clients[0].from('tenants').select('id').eq('id', tenantIds[1]);
  assert.deepEqual(foreign.data, []);

  const foreignPost = await clients[0].from('posts').insert({ tenant_id: tenantIds[1], content: 'cross tenant attempt' });
  assert.ok(foreignPost.error, 'Cross-tenant insert unexpectedly succeeded');

  await clients[0].from('profiles').update({ role: 'super_admin', is_super_admin: true, tenant_id: tenantIds[1] }).eq('id', users[0].id);
  const { data: unchanged, error: readError } = await clients[0].from('profiles').select('tenant_id,role,is_super_admin').eq('id', users[0].id).single();
  if (readError) throw readError;
  assert.deepEqual(unchanged, { tenant_id: tenantIds[0], role: 'member', is_super_admin: false }, 'Profile privilege escalation changed protected fields');

  console.log('Authenticated cross-tenant and role-escalation checks passed.');
} finally {
  for (const user of users) await admin.auth.admin.deleteUser(user.id);
  await admin.from('tenants').delete().in('id', tenantIds);
}
