import assert from 'node:assert/strict';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');

async function request(path, init = {}) {
  return fetch(`${url}${path}`, { ...init, headers: { apikey: key, 'Content-Type': 'application/json', ...(init.headers || {}) } });
}

for (const fn of ['manage-credentials', 'publish-post', 'ai-generate', 'invite-member', 'create-checkout']) {
  const response = await request(`/functions/v1/${fn}`, { method: 'POST', body: '{}' });
  const body = await response.json();
  assert.notEqual(response.status, 200, `${fn} accepted an anonymous request`);
  assert.match(String(body.error), /unauthorized|jwt/i);
}

const profiles = await request('/rest/v1/profiles?select=id,tenant_id,is_super_admin,role');
assert.ok([200, 401, 403].includes(profiles.status));
if (profiles.status === 200) assert.deepEqual(await profiles.json(), [], 'Anonymous caller could read profiles');

const tenants = await request('/rest/v1/tenants?select=id,name');
assert.ok([200, 401, 403].includes(tenants.status));
if (tenants.status === 200) assert.deepEqual(await tenants.json(), [], 'Anonymous caller could read tenants');

const invalidWebhook = await request('/functions/v1/razorpay-webhook', {
  method: 'POST', headers: { 'x-razorpay-signature': 'invalid' }, body: '{"event":"payment.captured"}'
});
assert.notEqual(invalidWebhook.status, 200, 'Invalid Razorpay signature was accepted');

console.log('Security boundary checks passed.');
