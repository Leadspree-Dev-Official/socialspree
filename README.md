# SocialSpree

SocialSpree is a multi-tenant social media publishing platform built for managing connected social accounts, creating posts, scheduling/publishing content, and providing AI-assisted content generation.

This repository is the application codebase. Treat this README as the developer onboarding and operating guide, not as a product marketing page.

> **Current status:** Beta / active development. Production-sensitive areas such as payments, OAuth, AI credits, provider credentials, and publishing workers require validation before changes are merged to `main`.

## Contents

- [Product at a glance](#product-at-a-glance)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Repository structure](#repository-structure)
- [Core flows](#core-flows)
- [Multi-tenancy and authorization](#multi-tenancy-and-authorization)
- [Provider credential model](#provider-credential-model)
- [Local development](#local-development)
- [Environment variables and secrets](#environment-variables-and-secrets)
- [Supabase development](#supabase-development)
- [Edge Functions](#edge-functions)
- [Database and migrations](#database-and-migrations)
- [Publishing architecture](#publishing-architecture)
- [AI credit architecture](#ai-credit-architecture)
- [Payments](#payments)
- [OAuth](#oauth)
- [Testing and validation](#testing-and-validation)
- [Git workflow](#git-workflow)
- [Production deployment](#production-deployment)
- [Security rules](#security-rules)
- [Troubleshooting](#troubleshooting)
- [Development priorities](#development-priorities)

## Product at a glance

SocialSpree is designed around four main responsibilities:

1. **Account management** - connect and manage social accounts for a tenant.
2. **Content management** - create posts, attach media, select accounts, and schedule content.
3. **Publishing** - execute publishing jobs through the configured social provider and handle retries/failures.
4. **Business platform services** - subscriptions, payment provisioning, AI credits, tenant limits, and provider credentials.

The platform is multi-tenant. A user's authenticated profile resolves to a tenant, and tenant ownership must be enforced at every data and provider boundary.

## Architecture

```text
┌───────────────────────────────┐
│ React + TypeScript + Vite     │
│ Web application               │
└───────────────┬───────────────┘
                │ Supabase Auth / API
                ▼
┌───────────────────────────────┐
│ Supabase                      │
│ PostgreSQL + Auth + Functions │
└───────┬───────────┬───────────┘
        │           │
        │           ├──────────────────────┐
        │           │                      │
        ▼           ▼                      ▼
  Tenant data   Edge Functions        Private credentials
                    │                      │
          ┌─────────┼─────────┐            │
          ▼         ▼         ▼            ▼
       Razorpay   OpenAI    Zernio     AES-GCM encrypted
       payments     AI     publishing     provider data
                    │
                    ▼
              Publishing jobs
                    │
                    ▼
             Social platforms
```

### Important boundary

The browser is never the authority for:

- payment amounts
- plan entitlements
- AI credit balances
- provider API keys
- OAuth client secrets
- tenant ownership
- publishing credentials

Those decisions belong in trusted server-side Edge Functions or PostgreSQL functions.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build | Vite 6 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Server functions | Supabase Edge Functions / Deno |
| Social publishing | Zernio SDK |
| AI | OpenAI API |
| Payments | Razorpay |
| Tests | Node-based security/RLS tests |

The exact versions are defined in `package.json` and should be changed deliberately rather than casually upgraded.

## Repository structure

The repository is intentionally split between the browser application and Supabase backend:

```text
/
├── src/                         # React application
├── public/                      # Static frontend assets
├── tests/                       # Security and RLS validation
├── supabase/
│   ├── functions/               # Edge Functions
│   │   ├── _shared/             # Shared trusted backend helpers
│   │   ├── ai-generate/         # AI generation
│   │   ├── create-checkout/     # Razorpay order creation
│   │   ├── process-publishing-jobs/ # Publishing worker
│   │   ├── razorpay-webhook/    # Payment webhook
│   │   └── social-oauth/        # Social OAuth flow
│   ├── migrations/              # Database migrations
│   ├── config.toml              # Local Supabase configuration
│   └── seed.sql                 # Local seed data
├── package.json
└── README.md
```

Use the actual repository tree as the source of truth when adding new modules. Keep business-critical logic out of the frontend when it requires trust.

## Core flows

### 1. User authentication

1. User authenticates with Supabase Auth.
2. The access token is sent as a Bearer token to protected Edge Functions.
3. The shared `actor()` helper validates the token using Supabase Auth.
4. The user's `profiles` record resolves `tenant_id`, role, and super-admin status.
5. Functions use the resolved tenant context for authorization.

Never trust a tenant ID supplied by the browser without checking it against the authenticated profile.

### 2. Social account connection

The OAuth flow is handled by `supabase/functions/social-oauth`.

The flow is:

```text
Browser
  │
  ├─ start OAuth
  ▼
Social OAuth Edge Function
  │
  ├─ validate provider
  ├─ validate redirect against allowlist
  ├─ create one-time state + PKCE verifier
  └─ return authorization URL
  │
  ▼
Social provider
  │
  ▼
OAuth callback
  │
  ├─ consume state
  ├─ verify user / tenant / provider binding
  ├─ exchange authorization code
  └─ encrypt and store credential
```

OAuth state is single-use and must never be accepted solely because the state value exists.

### 3. Post creation and publishing

Posts should be treated as durable application records. Publishing is performed asynchronously through `publishing_jobs` rather than relying on a long-running browser request.

```text
Create post
   │
   ▼
posts
   │
   ▼
publishing_jobs
   │
   ▼
queued
   │
   ▼
worker claims job
   │
   ▼
processing
   │
   ├── success ──> succeeded / posts.published
   │
   └── failure
          │
          ├── retryable ──> queued
          └── terminal ───> dead_letter / posts.failed
```

A worker must claim a job atomically. Never assume that selecting a queued job means the current worker owns it.

### 4. AI generation

AI generation uses a fixed credit cost per operation.

The safe order is:

```text
Validate request
      │
      ▼
Atomically reserve credits
      │
      ▼
Call AI provider
      │
   ┌──┴──┐
 success failure
   │       │
   ▼       ▼
return   refund credits
```

Do not call an external paid provider first and debit credits afterwards. Concurrent requests can otherwise overspend the tenant balance.

### 5. Payment and provisioning

The payment lifecycle is:

```text
Select plan
   │
   ▼
create-checkout
   │
   ├─ read plan from database
   ├─ calculate authoritative amount
   ├─ create Razorpay order
   └─ persist checkout_orders
          │
          ▼
      Razorpay
          │
          ▼
   razorpay-webhook
          │
          ├─ verify signature
          ├─ deduplicate event
          ├─ locate local checkout
          └─ provision tenant entitlement
```

The webhook is the authoritative payment confirmation. A successful browser checkout callback is not enough to provision a subscription.

## Multi-tenancy and authorization

Every tenant-owned operation must follow this pattern:

1. Authenticate the request.
2. Resolve the user's profile.
3. Resolve the user's tenant.
4. Check role/super-admin privileges where appropriate.
5. Query or mutate only records belonging to the authorized tenant.
6. For external providers, retrieve credentials using the same tenant boundary.

### Roles

The database currently distinguishes ordinary tenant users and super-admin access through profile fields. Do not implement authorization by hiding UI elements alone. The backend must enforce the permission.

### RLS

Row Level Security remains a critical second boundary for direct database access. Any migration that adds a tenant-owned table should include appropriate RLS policies and indexes.

## Provider credential model

Provider credentials are sensitive data.

The shared backend helper uses AES-GCM encryption with a secret-derived key before provider credentials are stored. The encryption key is supplied through `CREDENTIAL_ENCRYPTION_KEY`.

Never:

- commit provider API keys
- expose decrypted credentials to the browser
- log credentials
- put credentials in post records
- use a provider credential from another tenant
- rotate or delete credentials without considering active publishing jobs

### Zernio slots

SocialSpree supports provider slots so the platform can work with a configured Zernio API credential for a tenant.

Treat slot identity as stable. A slot number is not merely an array index. If a credential is deleted, do not silently renumber other credentials because existing connections and publishing jobs may still reference the original slot.

This is an important area for future hardening.

## Local development

### Prerequisites

Install:

- Node.js 20+ recommended
- npm
- Docker Desktop
- Supabase CLI
- Git

Check versions:

```bash
node --version
npm --version
supabase --version
```

### Install dependencies

```bash
npm install
```

### Start the frontend

```bash
npm run dev
```

Vite will print the local development URL.

### Start Supabase locally

From the repository root:

```bash
supabase start
```

The local Supabase configuration is in `supabase/config.toml`.

To stop local Supabase:

```bash
supabase stop
```

### Apply migrations locally

```bash
supabase db reset
```

Use this only when you are comfortable resetting the local database. It runs migrations and seed data.

## Environment variables and secrets

Keep secrets out of Git.

### Frontend

The frontend should only receive public configuration such as the Supabase project URL and anonymous/publishable key. Never place service-role keys, provider secrets, encryption keys, Razorpay secrets, or OAuth client secrets in `VITE_*` variables.

### Edge Functions

Backend functions currently depend on secrets/configuration including:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CREDENTIAL_ENCRYPTION_KEY
OPENAI_API_KEY
OPENAI_MODEL
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
WORKER_SECRET
ALLOWED_OAUTH_REDIRECTS
```

Provider-specific OAuth configuration follows the pattern used by `social-oauth`:

```text
<PROVIDER>_CLIENT_ID
<PROVIDER>_CLIENT_SECRET
<PROVIDER>_AUTHORIZE_URL
<PROVIDER>_TOKEN_URL
```

For example, if a provider is represented internally as `FACEBOOK`, the corresponding environment names are `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_AUTHORIZE_URL`, and `FACEBOOK_TOKEN_URL`.

Provider credentials stored in the database must remain encrypted.

### OAuth redirect allowlist

`ALLOWED_OAUTH_REDIRECTS` should contain only exact HTTPS callback URLs that the application actually uses, separated by commas.

Do not allow arbitrary domains or wildcard redirects.

## Supabase development

Useful commands:

```bash
supabase start
supabase status
supabase db reset
supabase migration new <migration-name>
supabase db diff
supabase functions serve
supabase functions deploy <function-name>
```

Before applying a migration to production:

1. Review the SQL manually.
2. Test it against a fresh local database.
3. Test it against representative existing data.
4. Check RLS and grants.
5. Check indexes and query paths.
6. Verify that the migration is safe to run only once.

### Migration rules

- Never edit an already-applied production migration to change history.
- Create a new migration for corrections.
- Prefer additive changes.
- Make indexes and constraints explicit.
- Avoid destructive changes without a rollback/migration plan.
- Document data transformations inside the migration.

## Edge Functions

Edge Functions live under `supabase/functions`.

Shared security-sensitive code belongs in `supabase/functions/_shared`.

The shared `server.ts` provides:

- CORS handling
- JSON responses
- service-role Supabase client creation
- authenticated actor resolution
- SHA-256 hashing
- credential encryption/decryption

### Function design rules

Every protected function should:

```text
Authenticate
   ↓
Validate input
   ↓
Authorize tenant / role
   ↓
Load trusted database state
   ↓
Perform external operation
   ↓
Persist result
   ↓
Return minimal response
```

Do not expose raw database errors or provider responses if they may contain secrets or implementation details.

Use appropriate HTTP status codes:

| Situation | Status |
|---|---:|
| Invalid input | 400 |
| Missing/invalid authentication | 401 |
| Authenticated but forbidden | 403 |
| Resource not found | 404 |
| Insufficient AI credits | 402 |
| Provider unavailable/configuration missing | 503 |
| External provider failure | 502 |
| Unexpected server error | 500 |

## Publishing architecture

Publishing jobs must be resilient to retries and worker crashes.

### Job states

Typical states are:

```text
queued → processing → succeeded
                  ↘ queued
                  ↘ dead_letter
```

### Retry policy

Retry only failures that are likely to succeed later, such as rate limits, temporary network errors, conflicts, and provider 5xx responses.

Do not retry permanent validation failures indefinitely.

Always preserve enough information in `last_error` and `result` to diagnose a failed job without exposing credentials.

### Worker leases

A worker sets `locked_at` when claiming a job. Jobs abandoned during processing must be recoverable after the lease timeout.

When changing worker behavior, test at least:

- two workers claiming the same job
- worker crash after claim
- provider timeout
- provider rate limit
- invalid social account
- maximum retry attempt
- duplicate webhook/provider response

## AI credit architecture

AI credits are tenant-owned accounting data.

The database is the source of truth.

Use atomic SQL functions for balance changes. Never implement credit deduction as:

```text
SELECT balance
→ calculate balance - cost
→ UPDATE balance
```

That pattern is race-prone.

Instead use a conditional atomic update or a transaction-backed function that guarantees the balance cannot become negative because of concurrent requests.

Every credit movement should have an audit record containing enough information to answer:

- which tenant changed
- why credits changed
- how many credits changed
- remaining balance
- when the event happened

## Payments

Razorpay integration consists of two separate responsibilities:

### Checkout creation

`create-checkout`:

- authenticates the user
- reads the selected plan from the database
- calculates the amount server-side
- creates the Razorpay order
- persists a local checkout record

Never accept the final payment amount from the browser.

### Webhook

`razorpay-webhook`:

- validates the Razorpay signature
- deduplicates events
- finds the local checkout by provider order ID
- updates the local payment state
- provisions the tenant only once

Plan display names are presentation data. Entitlement tiers must come from an authoritative plan field such as `tier_code`.

## OAuth

OAuth security requirements:

- HTTPS redirects only in production
- exact redirect allowlist
- cryptographically random state
- one-time state consumption
- PKCE verifier/challenge
- state bound to user and tenant
- provider binding checked on callback
- authorization code exchanged server-side
- provider tokens encrypted at rest

If any of these checks fail, reject the callback.

## Testing and validation

The project includes security-focused test commands:

```bash
npm run test:security
npm run test:rls
```

Also run:

```bash
npm run lint
npm run build
```

### Minimum pre-merge checklist

- [ ] TypeScript build passes
- [ ] ESLint passes
- [ ] Security tests pass
- [ ] RLS tests pass
- [ ] Migration tested locally
- [ ] No secrets committed
- [ ] Tenant isolation verified
- [ ] Payment flow tested
- [ ] OAuth flow tested
- [ ] Publishing retry behavior tested
- [ ] AI credit race conditions considered
- [ ] Error responses use appropriate status codes
- [ ] No provider credential is returned to the browser

## Git workflow

Use short-lived feature/fix branches.

Recommended pattern:

```text
main
 │
 ├── feature/<short-description>
 ├── fix/<short-description>
 └── chore/<short-description>
```

### Typical workflow

```bash
git checkout main
git pull
git checkout -b fix/my-change

# develop and test
npm run lint
npm run build
npm run test:security
npm run test:rls

git add .
git commit -m "fix: describe the change"
git push -u origin fix/my-change
```

Open a pull request into `main`.

### Pull request expectations

A PR should explain:

- what changed
- why it changed
- database changes
- security implications
- provider/API changes
- migration/deployment requirements
- how it was tested
- known limitations

Do not merge production-sensitive changes merely because the frontend compiles.

## Production deployment

Production deployment should happen in this order:

```text
1. Review PR
      ↓
2. Run application tests
      ↓
3. Validate migration
      ↓
4. Apply database migration
      ↓
5. Deploy Edge Functions
      ↓
6. Configure/verify secrets
      ↓
7. Run smoke tests
      ↓
8. Deploy frontend
      ↓
9. Verify monitoring/logs
```

### Supabase functions

Deploy individual functions deliberately:

```bash
supabase functions deploy ai-generate
supabase functions deploy create-checkout
supabase functions deploy process-publishing-jobs
supabase functions deploy razorpay-webhook
supabase functions deploy social-oauth
```

Do not deploy a function that depends on a new database function/column before the migration exists in the target environment.

### Secrets

Set production secrets through the Supabase project configuration/secret management process. Never commit a `.env` file containing production secrets.

## Security rules

These are non-negotiable development rules.

### Never commit

```text
.env
.env.local
Supabase service-role keys
Razorpay secret keys
Razorpay webhook secrets
OpenAI API keys
Zernio API keys
OAuth client secrets
credential encryption keys
worker secrets
```

### Never trust the client for

```text
tenant_id
user_id
role
plan tier
payment amount
AI credit balance
provider credential
publishing account ownership
OAuth redirect URL
```

### Never log

```text
Authorization headers
access tokens
refresh tokens
API keys
OAuth client secrets
encrypted credential payloads
full payment signatures
```

## Troubleshooting

### `Unauthorized` from an Edge Function

Check that the frontend sends:

```text
Authorization: Bearer <supabase-access-token>
```

Then verify the user's `profiles` row exists and has a valid tenant assignment.

### AI generation says credits are unavailable

Check:

1. tenant exists
2. tenant has enough `ai_credits`
3. the atomic reservation function is deployed
4. `OPENAI_API_KEY` exists
5. the Edge Function is using the expected database project

### OAuth callback fails

Check:

1. redirect URL is HTTPS
2. redirect URL is present exactly in `ALLOWED_OAUTH_REDIRECTS`
3. provider callback URL matches the provider dashboard
4. state has not already been consumed
5. state belongs to the same user/tenant/provider
6. provider client credentials are configured

### Publishing job remains stuck in `processing`

Check:

1. worker logs
2. `locked_at`
3. worker secret
4. provider credential availability
5. provider rate limits
6. retry/dead-letter state

An abandoned job should become recoverable after the configured lease period.

### Payment is captured but tenant is not upgraded

Check:

1. Razorpay webhook is reaching the Edge Function
2. webhook signature is valid
3. `payment_events` contains the event
4. `checkout_orders.provider_order_id` matches Razorpay's order ID
5. the plan exists
6. tenant provisioning did not violate a constraint
7. webhook function logs contain no database error

Never manually mark a tenant paid without understanding why the webhook failed. Fix the underlying idempotency/provisioning issue first.

## Development priorities

When deciding what to fix next, use this order:

### P0 - Data/security integrity

- tenant isolation
- credential leakage
- payment entitlement corruption
- AI credit overspending
- OAuth account takeover paths
- duplicate publishing/payment side effects

### P1 - Reliability

- publishing worker recovery
- retries and idempotency
- provider failure handling
- webhook processing
- background job observability

### P2 - Product correctness

- plan limits
- social account lifecycle
- scheduling behavior
- analytics accuracy
- UI state consistency

### P3 - Developer experience

- test coverage
- CI/CD
- documentation
- local seed data
- logging/observability
- code organization

## Working principles

SocialSpree is a system where an incorrect backend decision can cost money, publish content to the wrong account, or expose another tenant's data. Development should therefore favor correctness and explicit boundaries over clever shortcuts.

The most important rules are:

1. **The database is the source of truth for tenant-owned state.**
2. **The server is the source of truth for payments and entitlements.**
3. **Credits are accounting data and must be updated atomically.**
4. **Provider credentials stay server-side and encrypted.**
5. **Publishing is asynchronous and idempotency-aware.**
6. **OAuth callbacks must be bound to the initiating session.**
7. **Every tenant boundary must be enforced server-side.**
8. **Migrations are part of the application and must be reviewed like code.**
9. **Production changes go through a branch and pull request.**
10. **If a behavior can create a duplicate charge, duplicate post, cross-tenant access, or credential leak, treat it as a security/integrity issue first.**

## License

This repository is maintained as a proprietary SocialSpree application. Licensing and redistribution terms should be defined by the repository owner before public distribution.
