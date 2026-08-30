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

// Secret Exposure Prevention Regression
const [appSource, supabaseSource, apiSource] = await Promise.all([
  read('src/App.tsx'),
  read('src/lib/supabase.ts'),
  read('src/lib/api.ts'),
]);
assert.doesNotMatch(appSource + supabaseSource + apiSource, /ghp_[a-zA-Z0-9]{20,}/, 'No GitHub PATs in frontend source');
assert.doesNotMatch(appSource + supabaseSource + apiSource, /service_role/, 'No service role keys in frontend source');
assert.doesNotMatch(appSource + supabaseSource + apiSource, /RAZORPAY_WEBHOOK_SECRET/, 'No webhook secrets in frontend source');

console.log('Static security regression checks passed.');

// ---------------------------------------------------------------------------
// Production-readiness regressions
//
// Each of these guards a defect that shipped once. They are cheap to keep and
// expensive to rediscover in front of a customer.
// ---------------------------------------------------------------------------
const [connections, mediaLib, webhook, signer, publishPost, composerSource] = await Promise.all([
  read('src/components/connections/SocialConnectionsView.tsx'),
  read('src/lib/media.ts'),
  read('supabase/functions/meta-comment-webhook/index.ts'),
  read('supabase/functions/cloudinary-sign/index.ts'),
  read('supabase/functions/publish-post/index.ts'),
  read('src/components/composer/PostComposer.tsx'),
]);

// A closed OAuth popup told us nothing, yet the UI registered a channel anyway.
assert.doesNotMatch(
  connections,
  /channelAccountId:\s*`chan_/,
  'connections must never fabricate a channel account id'
);
assert.match(
  connections,
  /e\.origin !== window\.location\.origin/,
  'postMessage handler must reject foreign origins'
);
assert.match(connections, /fetchComposioAccounts/, 'connections must read state from the provider');

// Uploads must be signed server-side; the secret must never reach the browser.
assert.match(signer, /CLOUDINARY_API_SECRET/, 'signer must use the API secret');
// The signature is minted server-side; the browser must never hold the secret
// or append it to an upload. (The env var name appears only in a hint message.)
assert.doesNotMatch(mediaLib, /append\(['"]api_secret/, 'browser must not send an API secret');
assert.doesNotMatch(mediaLib, /Deno\.env/, 'browser code must not read server env');
assert.match(mediaLib, /cloudinary-sign/, 'uploads must request a server signature');

// The media guard used to match every https URL, so it could never fail.
assert.doesNotMatch(
  mediaLib,
  /url\.startsWith\('https:\/\/'\)\s*\)/,
  'media validation must not accept any https URL unconditionally'
);
assert.match(composerSource, /validateSchedulableMedia/, 'composer must validate media before scheduling');

// The autoresponder matched, logged, and never actually replied.
assert.match(webhook, /graph\.facebook\.com/, 'autoresponder must call the Graph API');
assert.match(webhook, /\/replies/, 'autoresponder must post public replies');
assert.match(webhook, /comment_id/, 'autoresponder must support private replies');

// Scheduling reported success even when no trigger could be registered.
assert.doesNotMatch(
  publishPost,
  /scheduled:\s*true/,
  'publish-post must not hardcode scheduling success'
);
assert.match(publishPost, /preciseTrigger/, 'publish-post must report whether an exact trigger exists');

// X was removed as a channel; nothing should dispatch to it.
const dispatcher = await read('supabase/functions/_shared/dispatcher.ts');
assert.doesNotMatch(dispatcher, /TWITTER_/, 'dispatcher must not map removed X actions');

console.log('Production-readiness regression checks passed.');

// The dispatcher must never invent a Composio action slug for an unmapped
// channel — that failed at the provider long after the customer was told the
// post had been scheduled.
const [dispatcher2, capabilities] = await Promise.all([
  read('supabase/functions/_shared/dispatcher.ts'),
  read('supabase/functions/_shared/platforms.ts'),
]);
assert.doesNotMatch(
  dispatcher2,
  /\$\{platformLower\.toUpperCase\(\)\}_CREATE_POST/,
  'dispatcher must not guess action names'
);
assert.match(dispatcher2, /resolveAction/, 'dispatcher must resolve actions from the capability map');
assert.match(capabilities, /unverified/, 'capability map must distinguish verified from unverified channels');

console.log('Channel capability checks passed.');

// Credentials must never be reported as saved before the vault confirms it.
// This shipped once: the Super Admin portal showed a success toast and then
// fired the vault write with .catch(() => {}), so rejected keys vanished
// silently and the workspace could not publish with no visible reason.
const adminPortal = await read('src/components/admin/SuperAdminPortal.tsx');
assert.doesNotMatch(
  adminPortal,
  /void supabase\.functions\.invoke\('manage-credentials'/,
  'credential saves must be awaited, not fire-and-forget'
);
assert.match(
  adminPortal,
  /await supabase\.functions\.invoke\('manage-credentials'/,
  'credential saves must await the vault result'
);
assert.doesNotMatch(
  adminPortal,
  /successfully saved!`\);/,
  'success must not be claimed before the vault responds'
);

console.log('Credential persistence checks passed.');
