import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [supabaseClient, app, authGate, api, main, vite, headers, vercel, config, migration] = await Promise.all([
  read('src/lib/supabase.ts'),
  read('src/App.tsx'),
  read('src/components/auth/AuthGate.tsx'),
  read('src/lib/api.ts'),
  read('src/main.tsx'),
  read('vite.config.ts'),
  read('public/_headers'),
  read('vercel.json'),
  read('supabase/config.toml'),
  read('supabase/migrations/20260808161512_clerk_profiles_bootstrap.sql'),
]);

assert.match(supabaseClient, /accessToken:\s*async/);
assert.match(app, /getToken/);
assert.match(app, /ensure_clerk_profile/);
assert.doesNotMatch(app, /handleDemoLogin|unsafeMetadata|leadspree24x7@gmail\.com/);

assert.match(authGate, /SignInButton/);
assert.match(authGate, /SignUpButton/);
assert.doesNotMatch(authGate, /useSignIn|onDemoLogin|passwordInput/);

assert.doesNotMatch(api, /supabase\.auth\.|isSuperAdminEmail/);
assert.doesNotMatch(main, /pk_test_/);
assert.match(main, /Missing VITE_CLERK_PUBLISHABLE_KEY/);

for (const csp of [vite, headers, vercel]) {
  assert.match(csp, /clerk\.accounts\.dev/);
  assert.match(csp, /challenges\.cloudflare\.com/);
}

assert.match(config, /\[auth\.third_party\.clerk\][\s\S]*enabled = true/);
assert.match(config, /domain = "flexible-ladybird-31\.clerk\.accounts\.dev"/);
assert.match(migration, /auth\.jwt\(\) ->> 'sub'/);
assert.match(migration, /REVOKE INSERT, DELETE, UPDATE ON public\.profiles/);
assert.doesNotMatch(migration, /WHERE email = \(auth\.jwt/);

console.log('Clerk auth architecture checks passed.');
