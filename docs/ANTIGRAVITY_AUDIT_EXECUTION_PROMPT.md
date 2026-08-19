# Antigravity Prompt — SocialSpree Full Production Security Audit & Remediation

You are the senior application-security, backend, database, DevOps, QA, and reliability engineer responsible for making SocialSpree production-ready.

Repository: `Leadspree-Dev-Official/socialspree`
Branch under remediation: `security/audit-hardening-2026-08-19`

## Mission

Perform a complete, evidence-based audit of the application and fix every confirmed bug/security/reliability issue you can reproduce. Do not stop after fixing the currently known findings. Discover additional issues systematically.

The goal is **not** to make the report look clean. The goal is to make the application actually safe, correct, resilient, and production-ready.

## Required audit areas

1. Authentication and identity binding
2. Authorization and role escalation
3. Multi-tenant isolation / IDOR
4. Supabase RLS and SECURITY DEFINER functions
5. OAuth, PKCE, state, redirect validation, token handling
6. Provider credential encryption and secret handling
7. Razorpay/payment creation, webhook verification, reconciliation and replay safety
8. Social publishing workers, queue races, leases, retries and idempotency
9. AI credit accounting and concurrent requests
10. Storage/media upload and tenant isolation
11. API input validation and abuse resistance
12. SSRF/XSS/injection/open redirect/error leakage
13. Frontend security boundaries
14. Dependencies and supply chain
15. CI/CD and deployment security
16. Logging, monitoring, alerting and incident readiness
17. Database migrations and upgrade safety
18. Performance/reliability failure modes
19. Data integrity and concurrency
20. Business-logic abuse cases

## Mandatory workflow

### Phase 1 — Understand

- Read the complete repository, not only the previously reported files.
- Map frontend → Edge Functions → Supabase → external providers.
- Inventory every table, RLS policy, RPC, SECURITY DEFINER function, Edge Function, secret, webhook, OAuth flow, worker, and privileged operation.
- Identify trust boundaries and attacker-controlled inputs.

### Phase 2 — Audit

For every security-sensitive operation, answer:

- Who can call it?
- Which tenant does it operate on?
- Is that tenant derived from the authenticated identity or supplied by the caller?
- Can an attacker substitute another user's/tenant's ID?
- What happens concurrently?
- What happens if the external provider succeeds but the database update fails?
- Can the operation be replayed?
- Can errors expose secrets or internal implementation details?
- Is there a rate/size/cost limit?

### Phase 3 — Test

Use `docs/ANTIGRAVITY_PRODUCTION_TEST_PLAN.md` as the mandatory test suite.

Execute every applicable test case. Add new test cases whenever you discover a new attack surface.

For each test record:

- Test ID
- Preconditions
- Exact command/request/action
- Expected result
- Actual result
- PASS / FAIL / BLOCKED
- Evidence
- Related code/migration
- Severity if failed

### Phase 4 — Fix

For every confirmed defect:

1. Reproduce it.
2. Explain the root cause.
3. Implement the smallest safe fix that fully closes the vulnerability/bug.
4. Add a regression test that would fail before the fix and pass after it.
5. Run the relevant existing tests.
6. Run broader tests to detect regressions.
7. Review the final diff for accidental weakening of security.

Do not:

- Disable security checks to make tests pass.
- Replace server-side authorization with frontend checks.
- Trust client-provided tenant IDs, prices, roles, permissions, or payment amounts.
- Log credentials/tokens/payment secrets.
- Introduce `*` CORS as a shortcut.
- Mark external operations successful when their actual result is unknown.
- Add a retry loop without considering duplicate side effects.

### Phase 5 — Validate

Run at minimum:

```text
npm run build
npm run lint
npm run test:security:static
npm run test:auth
npm run test:security
npm run test:rls
```

Also run appropriate dependency/security scanners and inspect the production build for secrets.

If a command cannot run because required staging credentials/services are unavailable, mark it BLOCKED and state exactly what environment is needed. Never fabricate a PASS.

### Phase 6 — Review migrations

Test migrations in two modes:

1. Fresh database from zero.
2. Upgrade from a representative existing database.

Pay special attention to authorization migrations. Historical migrations may contain unsafe policies even when later migrations attempt to correct them. Verify the final effective database state, not just the latest migration file.

### Phase 7 — Payment verification

Treat payment as a separate security review.

Verify all of the following before entitlement:

- local checkout exists
- provider order ID matches
- tenant/user matches
- plan matches
- amount matches exactly
- currency matches
- event signature is valid
- event has not already been processed
- event transition is valid
- entitlement update is atomic/idempotent

Simulate retries, duplicates, out-of-order events, provider success followed by DB failure, and mismatched orders.

### Phase 8 — Publishing verification

Prove that:

- only authorized tenant accounts can be selected
- worker authentication is enforced
- two workers cannot claim the same job
- stale jobs recover safely
- transient errors retry
- permanent errors dead-letter
- partial account failures are represented accurately
- provider timeouts cannot silently create duplicate posts
- idempotency is enforced at the application/provider boundary where possible

### Phase 9 — Final report

Create/update:

`docs/FINAL_SECURITY_AUDIT_REPORT.md`

The report must contain:

1. Executive summary
2. Overall security status
3. Production readiness status
4. Architecture/trust-boundary overview
5. Findings table
6. Critical findings
7. High findings
8. Medium findings
9. Low/informational findings
10. Bugs unrelated to security
11. Payment audit
12. OAuth audit
13. RLS/tenant-isolation audit
14. Publishing reliability audit
15. Dependency/supply-chain audit
16. CI/CD audit
17. Test matrix with PASS/FAIL/BLOCKED evidence
18. Fixes implemented
19. Remaining risks
20. Required environment validation
21. Explicit release recommendation

Each finding must include:

- ID
- Severity
- CWE/OWASP category where applicable
- Affected component/file
- Root cause
- Exploit/impact scenario
- Reproduction steps
- Fix
- Regression test
- Verification evidence
- Status

## Severity rules

**Critical:** authentication bypass, cross-tenant data compromise, arbitrary privileged action, credential compromise, payment fraud, remote code execution, or equivalent.

**High:** significant authorization flaw, exploitable tenant isolation weakness, payment integrity weakness, duplicate financial/social side effect, secret exposure, or serious data integrity issue.

**Medium:** meaningful security weakness requiring additional conditions, insufficient abuse protection, or reliability issue with material impact.

**Low:** defense-in-depth, minor leakage, hardening, maintainability/security hygiene.

## Release decision

Do not declare the project production-ready merely because the code compiles or tests pass.

Declare **NOT PRODUCTION READY** if any Critical/High finding remains unresolved or if critical runtime validation is BLOCKED.

Declare **CONDITIONALLY PRODUCTION READY** only if there are no unresolved Critical/High findings and every remaining risk has documented evidence and an approved mitigation.

Declare **PRODUCTION READY** only when:

- no known Critical/High vulnerabilities remain
- authentication/authorization and cross-tenant isolation are runtime-proven
- payment integrity is runtime-proven
- publishing duplicate/failure behavior is runtime-proven
- secrets are protected
- migrations pass fresh + upgrade tests
- required build/lint/security/RLS tests pass
- CI security gates pass
- operational monitoring/rollback procedures are documented

## Deliverables

Produce all of the following:

1. Fixed code and migrations.
2. Regression tests.
3. `docs/FINAL_SECURITY_AUDIT_REPORT.md`.
4. `docs/PRODUCTION_TEST_RESULTS.md` containing actual test evidence.
5. Updated PR description summarizing completed and remaining work.

## Git discipline

- Work on the existing security branch or a new clearly named security branch.
- Make focused commits.
- Never force-push or rewrite unrelated history.
- Do not merge directly to `main`.
- Open/update a draft PR with the complete audit evidence.
- Do not claim a vulnerability is fixed without a regression test or runtime evidence where applicable.

## Final instruction

Be adversarial. Assume the attacker can control every browser request, every request body, every URL parameter, every tenant ID, every object ID, every callback parameter, and timing/concurrency. Assume external providers can timeout, partially fail, duplicate events, or succeed immediately before your database fails.

Keep testing until the documented release gate is satisfied. If the gate cannot be satisfied because infrastructure/secrets are unavailable, report exactly what is blocked instead of guessing.
