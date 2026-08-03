# SocialSpree Security Audit

Date: 2026-08-01

## Scope and architecture

SocialSpree is currently a Vite/React browser application. It models tenants, social accounts, posts, media, billing, API credentials, and a super-admin portal largely in React state and `localStorage`. Supabase client setup and a proposed RLS schema exist, but the main application does not currently authenticate users or use Supabase as its authoritative data store. Publishing can call a configured dispatcher directly from the browser.

## Confirmed findings

### Critical: unauthenticated super-admin access

- Evidence: `src/App.tsx` initializes `isSuperAdminMode` to `true`, selects the first stored tenant, and exposes a client-side toggle. No authenticated session or server-side authorization gate is checked.
- Impact: any visitor can enter administrative UI, alter plans/tenants/credits, and inspect locally stored tenant metadata.
- Fix applied: the app no longer initializes in super-admin mode, and the client cannot enter elevated mode through the toggle. Complete the server-side fix by adding Supabase Auth, loading the user's profile from the database, and authorizing admin operations on the server/RLS. Never infer privileges from React state or an email string.

### Critical: secrets stored and processed in the browser

- Evidence: tenant and API-slot keys are part of the client-side `Tenant` model, saved through `saveStoredTenants`, displayed in settings/admin, and sent as a Bearer token by `src/lib/zernio.ts`.
- Impact: XSS, malicious extensions, shared devices, source-map inspection, or any user with DevTools can extract provider credentials and impersonate tenants.
- Fix applied: removed the credential from client-side audit payloads, removed the embedded AI key, and require Supabase public configuration from deployment environment variables.
- Remaining fix: move provider keys to a server/Edge Function secret store. The browser should send only the authenticated user's request; the server should resolve the tenant and provider credential after authorization.

### High: authorization and tenant isolation are not enforced by the running app

- Evidence: tenant selection and all mutations occur against mutable browser arrays/localStorage. IDs supplied by UI handlers determine which tenant changes.
- Impact: users can modify browser state to read/change another locally stored tenant and bypass plan limits, payment status, credits, or account quotas.
- Status: architectural fix required. Persist authoritative records in Supabase and perform all mutations under RLS/server authorization.

### High: media vault displayed assets across tenants

- Evidence: the app passed the complete global `mediaAssets` array into each tenant's Media Vault even though every asset has a `tenantId`.
- Impact: switching workspaces could expose another tenant's asset URLs, titles, and media previews.
- Fix applied: Media Vault input is filtered by the active tenant. This remains defense-in-depth until RLS-backed storage becomes authoritative.

### Medium: untrusted media URLs could create unsafe external links

- Evidence: stored asset URLs were used directly as external anchor destinations.
- Impact: a crafted URL using a dangerous or unexpected scheme could be opened from the application.
- Fix applied: external media links are enabled only for valid HTTPS URLs.

### High: central mutation handlers lacked tenant ownership checks

- Evidence: post deletion, review replies, media deletion, media creation, and publish callbacks accepted IDs/objects from child components without checking that the record belonged to the active tenant.
- Impact: a manipulated UI event or stale component could mutate another tenant's browser-resident records.
- Fix applied: central handlers now reject cross-tenant media, posts, reviews, and publish/log callbacks before state changes.
- Remaining risk: this is client-side defense-in-depth only; Supabase RLS/server authorization must remain authoritative.

### High: browser persistence could expose provider credentials

- Evidence: tenant objects are persisted through `localStorage`, while the tenant model includes provider/API credentials.
- Fix applied: `saveStoredTenants` now strips tenant and API-slot credentials before writing browser storage, and seeded demo credentials are empty.
- Remaining risk: credentials still exist in React memory and some UI paths accept them. Complete the server migration described above and remove credential fields from browser-facing types.

### High: unsafe RLS helper and incomplete policies

- Evidence: `supabase_schema.sql` defines a `SECURITY DEFINER` function in `public`, trusts an email JWT claim, and does not revoke public execute. Several `FOR ALL` policies omit `WITH CHECK`; `profiles` has RLS enabled but no policies.
- Impact: privileged function exposure, fragile privilege escalation rules, row reassignment attempts, and unusable or accidentally broadened profile access.
- Recommendation: store roles in protected `app_metadata` or a server-maintained membership table; use `SECURITY INVOKER` where possible. If a definer function is unavoidable, move it to a private schema, set `search_path`, revoke `EXECUTE` from `PUBLIC`, explicitly grant intended roles, and add `USING` plus `WITH CHECK` per operation.

### Medium: dispatcher failure is reported as success

- Evidence: `executePublishing` catches live API errors, creates a queued-looking response, then returns `success: true` without proving durable queue persistence.
- Impact: users believe content is safely queued when it may be lost, damaging audit integrity.
- Fix applied: raw backend error details are no longer persisted to the client audit log. A real fix requires a durable server queue and an honest `failed`/`queued` status returned by that backend.

### Critical: simulated browser payment granted paid entitlements

- Evidence: `RazorpaySandbox` used timers to invoke a success callback, after which `App.tsx` provisioned the selected plan with `paymentStatus: 'paid'`. No gateway signature or server webhook was involved.
- Impact: anyone could obtain paid-looking entitlements without payment and alter plan/credit values in browser state.
- Fix applied: sandbox completion now creates an explicitly non-paid `trial` preview and the UI states that no payment occurred.
- Remaining work: create orders server-side, verify Razorpay signatures and webhooks server-side, make webhook processing idempotent, derive price/plan entitlements from server records, and activate subscriptions only from verified payment events.

### Medium: weak client-generated API keys

- Evidence: multiple keys are made with `Math.random()` in `src/App.tsx` and `src/components/admin/SuperAdminPortal.tsx`.
- Impact: predictable, low-entropy credentials if treated as real authentication secrets.
- Fix applied: browser-side fallback key generation and placeholder credentials were removed. The frontend now leaves credential fields empty.
- Remaining work: generate at least 256 bits with a cryptographically secure server-side generator, store only a hash where verification permits, show the plaintext once, and support rotation/revocation.

## Fixes implemented in this audit

- Supabase URL and public anon key now come from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` instead of source code.
- The embedded AI API key was removed.
- Support/admin display email is configurable through `VITE_SUPPORT_EMAIL` rather than being a privileged authorization constant.
- Client audit payloads no longer contain even a masked tenant credential.
- Dispatcher endpoints must use HTTPS.
- Raw dispatcher errors are no longer copied into user-visible audit payloads.

## Required deployment actions

1. Rotate every credential that has ever been committed or shipped in a browser build, even if it looked like test data.
2. Add environment values for `VITE_SUPABASE_URL` and a Supabase publishable/anon key. Never use `service_role` in Vite variables.
3. Implement authentication before exposing the app UI; derive tenant membership and roles from protected database state.
4. Move social-provider dispatch, AI calls, payment verification, credit accounting, and key generation to a backend or Supabase Edge Functions.
5. Replace localStorage tenant persistence with RLS-protected tables and add automated cross-tenant isolation tests.

## Product ideas to make SocialSpree distinctive

1. **Approval graph and brand guardrails:** multi-stage campaign approvals, prohibited-claim checks, per-brand vocabulary, legal disclaimers, and immutable approval evidence.
2. **Explainable cross-channel optimizer:** recommend timing, format, caption length, and creative variants with a visible explanation and confidence score.
3. **Social inbox with revenue attribution:** unify comments/DMs/reviews, connect conversations to leads and bookings, and show which post produced revenue.
4. **Campaign experiments:** automatically create channel-native variants, enforce an experiment budget, declare winners, and recycle learnings into future briefs.
5. **Client-safe agency workspaces:** branded portals, scoped guest approvals, content request forms, SLA tracking, and downloadable proof-of-work reports.
6. **Reliability control plane:** preflight platform checks, durable queues, idempotent publishing, retry policies, incident timeline, and status-page transparency.
7. **Content provenance:** attach source assets, AI-generation metadata, licenses, consent expiry, and usage rights to every published item.
8. **Local business growth loop:** connect Google reviews, offers, scheduled posts, WhatsApp follow-up, bookings, and attribution into one automated workflow.

## Verification

- Run `npm run build` after setting the required Vite environment variables.
- Security tests should include unauthenticated access, ordinary-user admin denial, cross-tenant CRUD denial, credential absence from bundles/storage/logs, payment webhook replay, and dispatcher retry/idempotency.

## Dependency and deployment checks

- `npm audit --audit-level=moderate` could not reach the npm registry in the audit environment (`ENOTFOUND registry.npmjs.org`), so dependency advisories remain unverified. Run it in CI with network access and fail builds on high/critical findings.
- Added baseline `nosniff`, strict-origin referrer, and restrictive Permissions-Policy headers for Vite dev/preview servers and HTML fallback metadata. Configure the same headers (plus a tested CSP and HSTS) at the production CDN/hosting layer.
- A production CSP must be tailored to the current Google Fonts, Cloudinary, Supabase, dispatcher, and social-provider origins; deploy it at the CDN after exercising uploads, auth, and publishing flows in a staging environment.
