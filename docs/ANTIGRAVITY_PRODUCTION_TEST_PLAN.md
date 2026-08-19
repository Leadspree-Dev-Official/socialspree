# SocialSpree — Antigravity Production Test Plan

## Purpose

Use this document as the mandatory verification plan for the SocialSpree security hardening work. Execute every test against a disposable/staging environment first. Do not use real payment credentials, production social accounts, or production secrets.

## Rules

- Every test must produce PASS / FAIL / BLOCKED with evidence.
- Never mark a test PASS from code inspection alone when runtime verification is possible.
- A Critical or High security failure blocks production release.
- A flaky test must be treated as a failure until the root cause is understood.
- Do not weaken a test to make it pass.
- Redact tokens, cookies, API keys, OAuth codes, payment secrets, and personal data from reports.
- Run tests against both a fresh database and a database containing representative migrated data.

---

## A. Authentication & Identity

### AUTH-001 — Anonymous Edge Function access
**Goal:** Ensure protected functions reject anonymous callers.
**Steps:** Call every authenticated Edge Function without Authorization.
**Expected:** 401/403; no sensitive response body.
**Evidence:** response status + sanitized body.

### AUTH-002 — Invalid bearer token
Send a random/expired/malformed bearer token to protected functions.
**Expected:** 401; no user/profile resolution.

### AUTH-003 — Valid user → exact profile binding
Authenticate as User A and verify the backend resolves only `profiles.id = auth user id`.
**Expected:** User A's profile only.

### AUTH-004 — Email collision test
Create two identities with equivalent/case-variant email values where the test environment permits it.
Attempt access as each identity.
**Expected:** identity is determined by authenticated subject ID, never email matching.

### AUTH-005 — Unprovisioned account
Authenticate a valid identity with no profile.
**Expected:** request fails closed; no automatic tenant/profile creation.

### AUTH-006 — Tenant switching attempt
User A attempts to submit another tenant's UUID to all tenant-aware functions.
**Expected:** 403 or equivalent; no data mutation.

### AUTH-007 — Super-admin privilege boundary
Normal tenant admin/member attempts every super-admin-only operation.
**Expected:** denied.

### AUTH-008 — Role escalation
Attempt direct profile UPDATE changing `role`, `is_super_admin`, `tenant_id`, or privileged fields.
**Expected:** RLS/function boundary rejects mutation.

---

## B. Multi-Tenant Isolation / IDOR

### TENANT-001 — Cross-tenant SELECT
User A requests User B's tenant, posts, connections, jobs, analytics, invitations, checkout orders, and profile records by ID.
**Expected:** zero unauthorized records.

### TENANT-002 — Cross-tenant INSERT
User A attempts to create tenant-owned data with User B's tenant ID.
**Expected:** rejected.

### TENANT-003 — Cross-tenant UPDATE
User A attempts to modify User B's post/job/connection/configuration.
**Expected:** rejected.

### TENANT-004 — Cross-tenant DELETE
User A attempts deletion by another tenant's object ID.
**Expected:** rejected.

### TENANT-005 — UUID enumeration
Enumerate random/known UUIDs through REST and Edge Functions.
**Expected:** no cross-tenant disclosure; error responses must not reveal sensitive existence information.

### TENANT-006 — Service-role boundary
Verify service-role operations are never callable directly from browser clients.
**Expected:** no service-role credential appears in frontend bundles or API responses.

---

## C. OAuth Security

### OAUTH-001 — Provider allowlist
Submit unknown provider values, path-like values, environment-variable-like values, and case variants.
**Expected:** only explicitly supported providers accepted.

### OAUTH-002 — Redirect allowlist
Test allowed redirect, wrong origin, wrong path, HTTP, subdomain confusion, encoded URLs, userinfo URLs, and URL parser edge cases.
**Expected:** only exact configured origin/path is accepted.

### OAUTH-003 — State replay
Complete a valid OAuth callback twice with the same state.
**Expected:** first succeeds; second fails.

### OAUTH-004 — State expiration
Use an expired state.
**Expected:** rejected.

### OAUTH-005 — State tenant mismatch
Use a valid state belonging to Tenant A while authenticated as Tenant B.
**Expected:** rejected.

### OAUTH-006 — State user mismatch
Use a valid state created by User A while authenticated as User B in the same tenant.
**Expected:** rejected.

### OAUTH-007 — PKCE verification
Tamper with the authorization code verifier/challenge flow.
**Expected:** token exchange fails.

### OAUTH-008 — Callback code substitution
Use a code issued for another client/provider/redirect.
**Expected:** token exchange fails; no credential stored.

### OAUTH-009 — OAuth token secrecy
Inspect API responses, logs, database browser access, and frontend state.
**Expected:** access/refresh tokens never exposed to unauthorized clients/logs.

---

## D. Provider Credentials / Secrets

### SECRET-001 — Browser cannot read credential table
Attempt direct REST/table access to private provider credentials.
**Expected:** denied.

### SECRET-002 — Credential encryption
Verify stored credential ciphertext is not plaintext and cannot be decrypted without the server secret.

### SECRET-003 — Secret rotation
Rotate encryption key according to the application's supported procedure and verify existing credentials remain recoverable or are migrated safely.

### SECRET-004 — Secret leakage scan
Scan repository, built frontend, source maps, logs, error messages, and CI artifacts for provider secrets.
**Expected:** zero real secrets.

---

## E. Payments / Razorpay

### PAY-001 — Server-side price authority
Modify frontend-submitted amount, plan price, currency, and billing cycle.
**Expected:** server ignores client price and calculates from trusted plan data.

### PAY-002 — Plan tampering
Submit nonexistent, disabled, or unauthorized plan IDs.
**Expected:** rejected.

### PAY-003 — Currency mismatch
Create order then attempt webhook with a different currency.
**Expected:** entitlement not granted.

### PAY-004 — Amount mismatch
Send a validly signed webhook whose payment/order amount differs from local checkout amount.
**Expected:** payment not granted/marked paid.

### PAY-005 — Order mismatch
Use a valid signature but a payment belonging to another checkout order/tenant.
**Expected:** rejected.

### PAY-006 — Webhook signature invalid
Send modified payload or invalid signature.
**Expected:** rejected.

### PAY-007 — Webhook replay
Submit the exact same valid event multiple times.
**Expected:** one effective entitlement transition; subsequent requests are idempotent.

### PAY-008 — Out-of-order events
Deliver payment.failed before payment.captured, then captured, then duplicate captured.
**Expected:** final state is correct and transitions are safe.

### PAY-009 — Crash/retry simulation
Force failure after provider payment success but before local entitlement update.
**Expected:** retry/reconciliation eventually produces exactly one correct entitlement.

### PAY-010 — Refund/cancel handling
If supported, verify refund/chargeback/cancel events cannot create or preserve invalid entitlements.

---

## F. Publishing / Social Platforms

### PUB-001 — Unauthorized publish
Normal user attempts to publish to another tenant's connection/account ID.
**Expected:** rejected.

### PUB-002 — Invalid account selection
Submit nonexistent, duplicated, malformed, and cross-tenant account IDs.
**Expected:** rejected safely.

### PUB-003 — Worker authentication
Call worker endpoint without secret, with wrong secret, and with malformed secret.
**Expected:** 401.

### PUB-004 — Queue claim race
Run two workers simultaneously against the same queued job.
**Expected:** only one worker claims/processes the job.

### PUB-005 — Stale processing recovery
Leave a job in `processing` beyond lease timeout.
**Expected:** safe recovery/requeue without concurrent duplicate processing.

### PUB-006 — Provider timeout after acceptance
Simulate provider accepting a post while the application receives a timeout.
**Expected:** retry does not create an unintended duplicate; provider/application idempotency is verified.

### PUB-007 — Provider 4xx
Provider returns permanent failure.
**Expected:** job fails/dead-letters according to retry policy; never marked succeeded.

### PUB-008 — Provider 5xx
Provider returns transient failure.
**Expected:** bounded retry with backoff; eventual dead-letter after max attempts.

### PUB-009 — Partial multi-account failure
One account succeeds and another fails.
**Expected:** platform results accurately represent each account; final job state is not falsely reported as fully successful.

### PUB-010 — Tenant-bound post update
After processing, verify only the intended tenant/post is updated.

### PUB-011 — Malformed media
Test unsupported MIME, oversized media, invalid URLs, empty media arrays, and mixed media.
**Expected:** rejected safely.

---

## G. RLS / Database Security

### RLS-001 — Anonymous reads
Test every browser-visible table.
**Expected:** no unauthorized data.

### RLS-002 — Member vs admin
Verify each table/function has the intended member/admin boundary.

### RLS-003 — Super-admin boundary
Verify super-admin can perform only explicitly intended global operations.

### RLS-004 — Direct financial mutation
Attempt direct INSERT/UPDATE/DELETE against payment events, checkout orders, AI credit logs, and publishing jobs.
**Expected:** browser role denied.

### RLS-005 — SECURITY DEFINER functions
Inventory every SECURITY DEFINER function and verify search_path, caller checks, argument validation, and grants.

### RLS-006 — Search-path injection
Attempt object/function shadowing where relevant.
**Expected:** SECURITY DEFINER functions remain deterministic and safe.

### RLS-007 — Fresh migration
Apply all migrations to a clean database from zero.
**Expected:** success with no manual edits.

### RLS-008 — Upgrade migration
Apply migrations to representative existing data.
**Expected:** no privilege regression, data loss, or broken foreign keys.

---

## H. API / Input Security

### API-001 — JSON type confusion
Send nulls, arrays, objects, booleans, huge strings, numbers, and nested objects where strings/UUIDs are expected.
**Expected:** validation failure, no crash.

### API-002 — Oversized request
Send requests above configured body limits.
**Expected:** bounded rejection.

### API-003 — SQL/RPC injection
Test malicious strings against every RPC/function parameter.
**Expected:** no SQL execution or query manipulation.

### API-004 — SSRF
Where URLs are accepted, test localhost, private IPs, metadata endpoints, IPv6 loopback, redirects, DNS rebinding patterns, and non-HTTP schemes.
**Expected:** blocked unless explicitly required and safely constrained.

### API-005 — Error leakage
Trigger expected errors and internal failures.
**Expected:** clients receive safe errors; stack traces/secrets/internal SQL are not exposed.

### API-006 — Rate limiting
Stress login-sensitive, OAuth, payment, publishing, AI, and expensive endpoints.
**Expected:** abuse is bounded and service remains available.

---

## I. Storage / Media

### STORAGE-001 — Tenant path isolation
User A attempts read/write/delete under Tenant B's storage path.
**Expected:** denied.

### STORAGE-002 — MIME spoofing
Upload files with misleading extensions/MIME headers.
**Expected:** server-side validation prevents unsafe content.

### STORAGE-003 — Size abuse
Attempt maximum-size and oversized uploads.
**Expected:** enforced limits.

### STORAGE-004 — Private bucket exposure
Verify media is not publicly accessible without authorized access.

### STORAGE-005 — Dangerous content
Test SVG/script-bearing content and unexpected file types.
**Expected:** safely rejected or served with safe content handling.

---

## J. AI / Credits

### AI-001 — Credit race
Run concurrent AI requests against a low-credit tenant.
**Expected:** credits never become negative and exactly one valid debit occurs per accepted request.

### AI-002 — Cross-tenant credit target
Attempt to charge another tenant's UUID.
**Expected:** rejected.

### AI-003 — Replay/idempotency
Retry the same AI request where applicable.
**Expected:** no unintended double charge.

### AI-004 — Provider failure
Force AI provider failure after credit reservation/debit.
**Expected:** documented refund/reconciliation behavior; no silent credit loss.

---

## K. Frontend Security

### FE-001 — Authorization is server enforced
Manipulate hidden UI controls/routes/API calls.
**Expected:** backend still denies unauthorized operations.

### FE-002 — XSS
Test user-controlled post content, names, descriptions, analytics fields, error messages, and imported provider data.
**Expected:** rendered safely; no script execution.

### FE-003 — Token exposure
Inspect localStorage/sessionStorage/network responses/frontend bundle.
**Expected:** no service-role key or provider secret.

### FE-004 — Open redirect
Test every client-controlled navigation/redirect parameter.
**Expected:** only safe destinations.

---

## L. Dependencies / Supply Chain

### SUPPLY-001 — Dependency vulnerability scan
Run the repository's package audit and a second independent scanner.
**Expected:** no known Critical/High vulnerabilities without an accepted exception.

### SUPPLY-002 — Lockfile integrity
Verify lockfile is committed and dependency resolution is deterministic.

### SUPPLY-003 — Suspicious dependency review
Review newly added/unmaintained/high-risk packages and postinstall scripts.

### SUPPLY-004 — Secret scanning
Run GitHub secret scanning/trufflehog-equivalent against full git history where permitted.

---

## M. CI/CD / Production Configuration

### CI-001 — TypeScript build
`npm run build`
**Expected:** PASS.

### CI-002 — Lint
`npm run lint`
**Expected:** PASS with no security-relevant suppressed findings.

### CI-003 — Static security tests
`npm run test:security:static`
**Expected:** PASS.

### CI-004 — Auth security tests
`npm run test:auth`
**Expected:** PASS in configured environment.

### CI-005 — Live security tests
`npm run test:security`
**Expected:** PASS.

### CI-006 — RLS tests
`npm run test:rls`
**Expected:** PASS.

### CI-007 — Production build inspection
Inspect generated assets for secrets, debug flags, source-map exposure policy, and unexpected environment values.

### CI-008 — Environment variable audit
Verify every required secret is present only in the correct server environment and no server-only variable is prefixed for frontend exposure.

---

## N. Reliability / Observability

### REL-001 — Worker crash recovery
Kill worker after claim, before external call, during external call, and after external success.
**Expected:** no permanent stuck jobs and no unintended duplicates.

### REL-002 — Database outage
Simulate database unavailability.
**Expected:** safe failures and retry behavior; no data corruption.

### REL-003 — Provider outage
Simulate social/payment/AI provider outage.
**Expected:** bounded retries and useful operational status.

### REL-004 — Structured audit logs
Verify security-sensitive operations have enough telemetry for investigation without logging secrets.

### REL-005 — Alerting
Verify alerts exist for repeated auth failures, payment verification failures, publishing dead letters, worker stalls, and unusual error rates.

---

# Release Gate

Production is **BLOCKED** if any of the following is true:

- Any Critical vulnerability remains.
- Any High authentication/authorization/RLS vulnerability remains.
- Cross-tenant isolation is not proven by runtime tests.
- Payment amount/order/currency reconciliation is not proven.
- Publishing duplicate protection is not proven.
- Service-role or provider secrets can reach the browser.
- Fresh and upgrade migrations fail.
- Required security/CI tests fail.
- Critical test cases are BLOCKED without an approved compensating control.

Production can be considered for approval only after every applicable test has PASS status and the evidence is attached to the audit report.
