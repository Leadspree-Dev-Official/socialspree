/**
 * Auth architecture guard.
 *
 * SocialSpree runs on native Supabase Auth. It previously used Clerk as a
 * third-party token issuer; that migration is complete and must not regress —
 * a half-reverted auth model is how tenants end up reading each other's data.
 *
 * These are static checks: they read source, not a live database. Live
 * multi-tenant isolation is covered by tests/live-rls.mjs.
 */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [supabaseClient, app, authGate, authView, main, vite, headers, vercel, config] =
  await Promise.all([
    read('src/lib/supabase.ts'),
    read('src/App.tsx'),
    read('src/components/auth/AuthGate.tsx'),
    read('src/components/auth/AuthView.tsx'),
    read('src/main.tsx'),
    read('vite.config.ts'),
    read('public/_headers'),
    read('vercel.json'),
    read('supabase/config.toml'),
  ]);

// --- The client is a plain Supabase client with session persistence ----------
assert.match(supabaseClient, /createClient\(/);
assert.match(supabaseClient, /persistSession:\s*true/);
assert.match(supabaseClient, /autoRefreshToken:\s*true/);
assert.match(supabaseClient, /detectSessionInUrl:\s*true/);
// A third-party accessToken hook and persistSession are mutually exclusive in
// supabase-js; its presence would mean Clerk had crept back in.
assert.doesNotMatch(supabaseClient, /accessToken:\s*async/);

// --- Auth flows are native --------------------------------------------------
assert.match(authView, /signInWithPassword/);
assert.match(authView, /signUp/);
assert.match(authView, /resetPasswordForEmail/);
assert.match(app, /onAuthStateChange/);

// --- No Clerk anywhere in shipped source ------------------------------------
const walk = async (dir) => {
  const entries = await readdir(new URL(`../${dir}`, import.meta.url), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const child = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await walk(child)));
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(child);
  }
  return files;
};

for (const file of await walk('src')) {
  const source = await read(file);
  assert.doesNotMatch(source, /clerk/i, `Clerk reference found in ${file}`);
}
assert.doesNotMatch(main, /pk_test_/);
assert.doesNotMatch(vite, /clerk/i);

// --- Clerk is no longer a trusted token issuer on the project ---------------
assert.match(
  config,
  /\[auth\.third_party\.clerk\][\s\S]*?enabled = false/,
  'Clerk third-party auth must be disabled in supabase/config.toml'
);

// --- Shipped CSP is closed to the removed provider and open to what we use ---
for (const [name, csp] of [['public/_headers', headers], ['vercel.json', vercel]]) {
  assert.doesNotMatch(csp, /clerk/i, `${name} still allows Clerk origins`);
  assert.match(csp, /connect-src[^;]*api\.cloudinary\.com/, `${name} must allow Cloudinary uploads`);
  assert.match(csp, /connect-src[^;]*supabase\.co/, `${name} must allow the Supabase project`);
  assert.match(csp, /frame-src[^;]*checkout\.razorpay\.com/, `${name} must allow the Razorpay modal`);
  assert.match(csp, /object-src 'none'/, `${name} must forbid plugins`);
  assert.match(csp, /base-uri 'self'/, `${name} must pin base-uri`);
}

// --- The browser bundle must never carry a service role key -----------------
for (const file of await walk('src')) {
  const source = await read(file);
  assert.doesNotMatch(
    source,
    /service_role|SUPABASE_SERVICE_ROLE_KEY/,
    `Service role key referenced in browser code: ${file}`
  );
}

console.log('Native Supabase auth architecture checks passed.');
