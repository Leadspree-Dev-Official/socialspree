/**
 * Production-readiness checks across the flows a customer actually uses.
 *
 * Static analysis of real code paths — no database or network required, so it
 * runs in CI. Each assertion pins a bug that shipped once and would otherwise
 * be invisible: the app swallows most failures in try/catch, so a broken flow
 * looks identical to a working one from the UI.
 *
 * Live database and API behaviour is verified separately; these guard the
 * source of truth so a regression cannot slip back in silently.
 */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push(`  PASS  ${name}`);
  } catch (err) {
    results.push(`  FAIL  ${name}\n        ${err.message.split('\n')[0]}`);
    process.exitCode = 1;
  }
};

const [
  api, app, settings, dispatcher, platformsShared, worker, publishPost,
  analytics, postManage, helpCenter, connectionsView, composioShared,
  grantMigration, aiGrantMigration,
] = await Promise.all([
  read('src/lib/api.ts'),
  read('src/App.tsx'),
  read('src/components/settings/SettingsView.tsx'),
  read('supabase/functions/_shared/dispatcher.ts'),
  read('supabase/functions/_shared/platforms.ts'),
  read('supabase/functions/process-publishing-jobs/index.ts'),
  read('supabase/functions/publish-post/index.ts'),
  read('supabase/functions/composio-analytics/index.ts'),
  read('supabase/functions/composio-post-manage/index.ts'),
  read('src/components/help/HelpCenterView.tsx'),
  read('src/components/connections/SocialConnectionsView.tsx'),
  read('supabase/functions/_shared/composio.ts'),
  read('supabase/migrations/20260830210000_fix_profile_write_grant.sql'),
  read('supabase/migrations/20260830220000_fix_ai_credit_log_grant.sql'),
]);

// --- Profile sync across browsers -------------------------------------------
console.log('\nProfile & cross-browser sync');

check('profile writes reach the profiles table', () => {
  assert.match(api, /from\('profiles'\)\.upsert/, 'updateProfile must persist to the database');
});

check('profile writes also reach auth metadata', () => {
  assert.match(api, /supabase\.auth\.updateUser\(\{ data: authMetaUpdates \}\)/);
});

check('profiles UPDATE grant migration exists', () => {
  // The RLS policy alone is not enough: Postgres checks grants BEFORE row
  // level security, so without the table grant every profile save failed with
  // a permission error that updateProfile swallows in a try/catch.
  assert.match(grantMigration, /GRANT UPDATE \(/);
  for (const col of ['full_name', 'avatar_url', 'job_title']) {
    assert.ok(grantMigration.includes(col), `grant must cover ${col}`);
  }
});

check('profile grant does not expose privilege columns', () => {
  // Granting these would let a client make itself a super admin.
  const granted = grantMigration.slice(
    grantMigration.indexOf('GRANT UPDATE ('),
    grantMigration.indexOf('ON public.profiles')
  );
  for (const col of ['is_super_admin', 'role', 'tenant_id', 'email']) {
    assert.ok(!granted.includes(col), `${col} must not be client-writable`);
  }
});

check('ai_credit_logs can be written by its owner', () => {
  assert.match(aiGrantMigration, /GRANT INSERT.*ON public\.ai_credit_logs TO authenticated/);
});

check('disconnect revokes at the provider', () => {
  // Deleting only the local row is not a disconnect: the next sync re-creates
  // it and the channel reappears after a reload.
  assert.match(composioShared, /deleteConnectedAccount/);
  assert.match(app, /disconnectComposioAccount/);
});

check('app hydrates all state from cloud on sign-in', () => {
  assert.match(app, /await hydrateFromCloud\(\)/);
  for (const setter of ['setPosts(cloud.posts)', 'setLogs(cloud.logs)', 'setAccounts(cloud.accounts)', 'setMediaAssets(cloud.media)']) {
    assert.ok(app.includes(setter), `missing hydration: ${setter}`);
  }
});

check('avatar upload no longer targets a nonexistent bucket', () => {
  assert.doesNotMatch(settings, /storage\s*\n?\s*\.from\('avatars'\)/);
  assert.match(settings, /uploadToMediaVault/);
});

// --- Publishing: instant and scheduled, both engines -------------------------
console.log('\nPublishing');

check('dispatcher routes per platform, not per tenant', () => {
  assert.match(dispatcher, /requiresZernio/);
  assert.match(dispatcher, /zernioFromStart/);
});

check('no dead Composio v1 endpoints remain', () => {
  const strip = (s) => s.replace(/^\s*\*.*$/gm, '');
  for (const [name, src] of [['dispatcher', dispatcher], ['analytics', analytics], ['postManage', postManage], ['composio', composioShared]]) {
    assert.doesNotMatch(strip(src), /backend\.composio\.dev\/api\/v1/, `${name} still calls v1`);
  }
});

check('tool execution sends user_id (v3 requires it)', () => {
  assert.match(composioShared, /user_id:\s*entityId/);
});

check('action slugs are the verified ones', () => {
  assert.match(platformsShared, /LINKEDIN_CREATE_LINKED_IN_POST/);
  assert.doesNotMatch(platformsShared, /'LINKEDIN_CREATE_POST'/);
  assert.doesNotMatch(platformsShared, /THREADS_POST|BLUESKY_POST|SNAPCHAT_POST_STORY|GOOGLE_BUSINESS_POST/);
});

check('no invented Composio actions anywhere', () => {
  // Strip comments first: these files explain the old invented names, and the
  // explanation should not itself trip the check.
  const stripComments = (s) =>
    s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const [name, src] of [['analytics', analytics], ['postManage', postManage]]) {
    assert.doesNotMatch(
      stripComments(src),
      /'GET_METRICS'|'GET_POST_STATUS'|'DELETE_POST'|actionName:/,
      `${name} uses an invented action or the retired v1 body shape`
    );
  }
});

check('Instagram uses the two-step container flow', () => {
  assert.match(dispatcher, /INSTAGRAM_CREATE_MEDIA_CONTAINER/);
  assert.match(dispatcher, /creation_id/);
});

check('Zernio results are read per platform, not assumed', () => {
  assert.match(dispatcher, /platformResults/);
  assert.doesNotMatch(
    dispatcher,
    /dispatchedChannels:\s*connections\.map\(c\s*=>\s*\(\{[\s\S]{0,80}status:\s*'success'/
  );
});

check('google_business is translated for Zernio', () => {
  assert.match(platformsShared, /toZernioPlatform/);
  assert.match(platformsShared, /googlebusiness/);
});

// --- Audit logs --------------------------------------------------------------
console.log('\nAudit logs');

check('instant publishes are logged', () => {
  assert.match(publishPost, /from\('post_logs'\)\.insert/);
});

check('scheduled publishes are logged too', () => {
  // These were silently absent from the audit trail entirely.
  assert.match(worker, /from\('post_logs'\)\.insert/, 'worker must write an audit row');
  assert.match(worker, /background_cron/);
});

check('scheduled failures are logged', () => {
  const inserts = worker.match(/from\('post_logs'\)\.insert/g) || [];
  assert.ok(inserts.length >= 2, 'worker must log both success and failure');
});

// --- Connections -------------------------------------------------------------
console.log('\nConnections');

check('connections never fabricate an account', () => {
  assert.doesNotMatch(connectionsView, /channelAccountId:\s*`chan_/);
});

check('OAuth postMessage rejects foreign origins', () => {
  assert.match(connectionsView, /e\.origin !== window\.location\.origin/);
});

check('connection state is read back from the provider', () => {
  assert.match(connectionsView, /fetchComposioAccounts/);
  assert.match(connectionsView, /syncConnections/);
});

check('Zernio-only channels bypass the Composio connect flow', () => {
  assert.match(connectionsView, /zernioOnly/);
});

// --- Analytics ---------------------------------------------------------------
console.log('\nAnalytics');

check('analytics uses real per-platform insight tools', () => {
  assert.match(analytics, /INSTAGRAM_GET_POST_INSIGHTS/);
  assert.match(analytics, /FACEBOOK_GET_POST_INSIGHTS/);
});

check('analytics reads real platform post ids', () => {
  assert.match(analytics, /platform_results/);
});

check('analytics reports failures instead of writing zeros', () => {
  assert.match(analytics, /failures/);
});

// --- Post deletion -----------------------------------------------------------
console.log('\nPost management');

check('delete uses verified per-platform tools', () => {
  assert.match(postManage, /FACEBOOK_DELETE_POST/);
  assert.match(postManage, /LINKEDIN_DELETE_LINKED_IN_POST/);
});

check('delete tells the caller when a post is still live', () => {
  // It used to delete the local row while the post stayed on the feed.
  assert.match(postManage, /stillLive/);
});

// --- Help centre -------------------------------------------------------------
console.log('\nHelp centre');

check('help centre has no stale Cloudflare/R2 guidance', () => {
  assert.doesNotMatch(helpCenter, /Cloudflare|R2 bucket/i);
});

check('help centre does not reference the removed X channel', () => {
  assert.doesNotMatch(helpCenter, /\bTwitter\b/);
});

// --- Secret hygiene ----------------------------------------------------------
console.log('\nSecret hygiene');

const walk = async (dir) => {
  const entries = await readdir(new URL(`../${dir}`, import.meta.url), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const child = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await walk(child)));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(child);
  }
  return files;
};

const srcFiles = await walk('src');
check('no provider API keys hardcoded in the browser bundle', async () => {
  for (const file of srcFiles) {
    const source = await read(file);
    assert.doesNotMatch(source, /\bak__[A-Za-z0-9]{12,}/, `Composio key in ${file}`);
    assert.doesNotMatch(source, /\bsk_[a-f0-9]{32,}/, `Zernio key in ${file}`);
    assert.doesNotMatch(source, /\bsbp_[a-f0-9]{20,}/, `Supabase token in ${file}`);
  }
});

// --- Cross-provider dispatch safety ------------------------------------------
console.log('\nCross-provider dispatch');

check('a Composio failure never retries with Composio\'s own account id on Zernio', () => {
  // Composio's channel_account_id (e.g. "ca_xkmrFchvyoRD") means nothing to
  // Zernio, which rejects it with "Invalid accountId format". Falling back
  // must use a genuinely separate Zernio-provider connection for the same
  // platform, never the failed connection's own id.
  assert.match(dispatcher, /zernioProviderByPlatform/, 'must look up a same-platform Zernio connection before falling back');
  assert.doesNotMatch(
    dispatcher,
    /const zernioCandidates = \[\.\.\.zernioFromStart, \.\.\.composioFailed\]/,
    'must not reuse composioFailed connections directly as Zernio dispatch targets'
  );
});

console.log(results.join('\n'));
const failed = results.filter(r => r.startsWith('  FAIL')).length;
console.log(
  failed === 0
    ? `\nAll ${results.length} production-readiness checks passed.`
    : `\n${failed} of ${results.length} checks FAILED.`
);
