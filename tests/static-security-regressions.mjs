import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [server, oauth, worker, migration] = await Promise.all([
  read('supabase/functions/_shared/server.ts'),
  read('supabase/functions/social-oauth/index.ts'),
  read('supabase/functions/process-publishing-jobs/index.ts'),
  read('supabase/migrations/20260819000000_security_hardening.sql'),
]);

assert.match(server, /\.eq\('id', user\.id\)/, 'actor must resolve profile by verified subject');
assert.doesNotMatch(server, /\.ilike\('email'/, 'actor must not fall back to email identity');
assert.doesNotMatch(server, /from\('tenants'\)\.insert/, 'actor must not auto-create tenants');
assert.match(server, /ALLOWED_WEB_ORIGINS/, 'CORS must be origin restricted');
assert.match(server, /Cache-Control.*no-store/, 'API responses must be non-cacheable');

assert.match(oauth, /OAUTH_PROVIDERS/, 'OAuth provider must be explicitly allowlisted');
assert.match(oauth, /saved\.tenant_id.*tenantId/, 'OAuth callback must remain tenant-bound');
assert.match(oauth, /saved\.provider.*provider/, 'OAuth callback must remain provider-bound');

assert.match(worker, /LEASE_MS/, 'worker must define a processing lease');
assert.match(worker, /status.*processing.*locked_at/, 'worker must recover abandoned processing jobs');
assert.doesNotMatch(worker, /status: 'dispatched_native'/, 'Composio errors must not be reported as successful dispatch');
assert.doesNotMatch(worker, /status: 'queued_native'/, 'Composio exceptions must not be reported as successful dispatch');
assert.match(worker, /\.eq\('tenant_id', job\.tenant_id\)/, 'post mutation must remain tenant-bound');

assert.match(migration, /CREATE OR REPLACE FUNCTION private\.is_super_admin/, 'super-admin helper must be subject-based');
assert.match(migration, /WHERE id = \(auth\.jwt\(\) ->> 'sub'\)/, 'super-admin helper must use verified subject');
assert.match(migration, /DELETE FROM public\.system_settings WHERE key = 'super_admin_email'/, 'email bootstrap must be removed');

console.log('Static security regression checks passed.');
