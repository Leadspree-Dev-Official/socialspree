# SOCIALSPREE PROVIDER ASSIGNMENT & PROVIDER ISOLATION AUDIT REPORT

**Date:** August 9, 2026  
**Target Application:** SocialSpree (Multi-Provider Social Media Publishing SaaS)  
**Evaluated Providers:** Zernio (Zenith Engine) & Composio (CoreSync Engine)  

---

## EXECUTIVE SUMMARY & AUDIT INVARIANT EVALUATION

> **Audit Invariant:**
> *"A SocialSpree user can only execute social operations through the provider assigned to that user by an authorized administrator, using only the provider configuration and social connections belonging to that user/tenant."*

### **Audit Status: CRITICAL VULNERABILITIES DETECTED / AUDIT FAILED**

The SocialSpree application **fails** the required provider assignment & isolation invariant across multiple critical security boundaries:

1. **Client-Side Control Dependency & Arbitrary Execution:** In [`src/lib/zernio.ts:47`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/lib/zernio.ts#L47), provider selection is performed client-side based on `tenant.dispatchEngine`. If set to `'coresync'` or `'composio'`, publishing routes directly to Composio in the browser via hardcoded client API calls ([`src/lib/composio.ts:144`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/lib/composio.ts#L144)). Otherwise, it invokes the Supabase Edge Function `publish-post`, which queues a job for `process-publishing-jobs`.
2. **Asynchronous Dispatch Engine Ignorance (Worker Provider Lock-Out):** The background worker Edge Function [`process-publishing-jobs`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/supabase/functions/process-publishing-jobs/index.ts#L23-L30) **unconditionally uses Zernio** regardless of what `dispatch_engine` is set to on `public.tenants`. Scheduled or queued posts for a Composio-assigned tenant will attempt to execute via Zernio in the background worker and fail with *"No valid Zernio accounts selected"*.
3. **Secret Leakage in Client Bundles:** The frontend bundle reads `VITE_COMPOSIO_API_KEY` ([`src/lib/composio.ts:17`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/lib/composio.ts#L17)), exposing global provider credentials directly inside compiled browser JavaScript.
4. **Lack of Provider Locking in Scheduled Posts:** Database tables `public.posts` and `public.publishing_jobs` do not record the assigned `provider` / `dispatch_engine` at scheduling time, creating state corruption and job failure if an admin switches a tenant's provider while jobs are queued.

---

## 1. ACTUAL PROVIDER ASSIGNMENT ARCHITECTURE

* **Storage Location:** Database table `public.tenants` in column `dispatch_engine` (values: `'dual'`, `'zenith'`, `'coresync'`).
* **Assignment Scope:** **Per Organization / Tenant** (`tenant_id`). All users attached to a single tenant share the tenant's `dispatch_engine`.
* **Selection Mechanism During Publishing:**
  - **Client side:** [`src/lib/zernio.ts:47`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/lib/zernio.ts#L47) inspects `tenant.dispatchEngine`. If set to `'coresync'` or `'composio'`, it invokes `executeComposioPublishing(...)` directly from the client.
  - **Server / Worker side:** [`process-publishing-jobs/index.ts:23`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/supabase/functions/process-publishing-jobs/index.ts#L23) ignores tenant `dispatch_engine` completely and attempts to load Zernio slot keys (`slotKey(...)`) and call `zernioClient(...)`.
* **Modification Authorization:** Super Admins via [`SuperAdminPortal.tsx:400`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/components/admin/SuperAdminPortal.tsx#L400) or Tenant Owners via Tenant API setting update.
* **Default When Unassigned:** `dispatch_engine` defaults to `'dual'` via database migration [`20260809032000_dispatch_engine_governance.sql:4`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/supabase/migrations/20260809032000_dispatch_engine_governance.sql#L4).

---

## 2. PROVIDER ASSIGNMENT MODEL

```text
public.profiles (user)
       ↓ (tenant_id)
public.tenants (workspace / tenant)
       ↓ (dispatch_engine column: 'zenith' | 'coresync' | 'dual')
┌───────────────────────┬────────────────────────┐
│ Zenith (Zernio Engine)│ CoreSync (Composio Eng)│
└───────────────────────┴────────────────────────┘
```

**Database Columns Responsible:**
* `public.tenants.dispatch_engine` (`TEXT NOT NULL DEFAULT 'dual'`)
* `public.tenants.enabled_engines` (`TEXT[] NOT NULL DEFAULT ARRAY['zenith', 'coresync']`)

---

## 3. PROVIDER ISOLATION AUDIT

* **Client Control Trust Vulnerability (HIGH):** The client application reads the tenant's `dispatchEngine` property passed via state. However, because client JS handles the branching ([`src/lib/zernio.ts:47`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/lib/zernio.ts#L47)), a compromised or tampered client can bypass this check and directly trigger Composio SDK calls via [`generateComposioConnectLink`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/lib/composio.ts#L51) or `executeComposioPublishing` using client-held credentials.
* **Server-side Verification Deficit:** The Edge Function `publish-post` does **not** verify the tenant's `dispatch_engine` before creating a job in `publishing_jobs`.

---

## 4. PROVIDER TAMPERING AUDIT

* **Frontend Controls:** Restricted in UI to Super Admins.
* **Row Level Security (RLS) & RPCs:** Tenant update policies allow tenant admins/owners to update `dispatch_engine` on their `public.tenants` row.
* **Direct Manipulation Risk:** If an authenticated user calls Supabase client updates directly (`supabase.from('tenants').update({ dispatch_engine: 'coresync' })`), RLS policies on `tenants` permit tenant owners to alter their engine without administrative approval unless blocked by specific trigger checks.

---

## 5. PROVIDER CREDENTIAL ISOLATION

### Zernio Credentials
* **Location:** Stored securely in schema table `private.provider_credentials` encrypted with AES-256-GCM via `pgcrypto` ([`20260802133248_secure_backend_foundation.sql:2`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/supabase/migrations/20260802133248_secure_backend_foundation.sql#L2)).
* **Access Permissions:** `REVOKE ALL FROM PUBLIC, anon, authenticated`. Only accessible via Edge Functions using Supabase `SERVICE_ROLE_KEY`.

### Composio Credentials
* **Location:** Stored in environment variable `VITE_COMPOSIO_API_KEY` ([`src/lib/composio.ts:17`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/lib/composio.ts#L17)).
* **Protection Deficit:** **CRITICAL**. Because `VITE_COMPOSIO_API_KEY` uses the `VITE_` prefix, Vite embeds the secret directly into the compiled public React JS bundle. Any end user can extract the Composio API key from browser network tab or bundle source!

---

## 6. EXPOSED PROVIDER SECRETS AUDIT

| Secret Identifier | Found Location | Exposure Type | Severity |
| :--- | :--- | :--- | :--- |
| `VITE_COMPOSIO_API_KEY` | [`src/lib/composio.ts:17`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/lib/composio.ts#L17) | Client JS Bundle | **CRITICAL** |
| `ZERNIO_API_KEY` / Slot keys | `private.provider_credentials` | Database (Encrypted) / Vault | **SECURE** |

*All actual production key values are redacted per instructions.*

---

## 7. PROVIDER SELECTION DURING PUBLISHING

**Resolution Entry Point:** `executePublishing` in [`src/lib/zernio.ts:43`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/lib/zernio.ts#L43).

```typescript
// src/lib/zernio.ts
if (tenant.dispatchEngine === 'coresync' || (tenant.dispatchEngine as string) === 'composio') {
  return executeComposioPublishing(postInput, tenant);
}
```

---

## 8. PROVIDER SELECTION CONSISTENCY & CRITICAL BUG

* **Immediate Publish (Composio User):** Executes client-side Composio mock/dispatch.
* **Scheduled / Queue-processed Publish (Composio User):** Inserts post row, queues `publishing_jobs`, and invokes `publish-post`. The worker process [`process-publishing-jobs/index.ts`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/supabase/functions/process-publishing-jobs/index.ts#L23) picks up the job and **hardcodes Zernio publishing**, failing to process Composio jobs.

> 🔴 **FINDING:** Publishing paths are **inconsistent**. Immediate posting for Composio uses Composio; scheduled posting for Composio routes through worker code that only supports Zernio.

---

## 9. PROVIDER CHANGE HANDLING & 10. SCHEDULED POST LOCKING

* **Current Design:** **Dynamic Provider (Design A)**. `publishing_jobs` and `posts` do **NOT** lock or store `provider` / `dispatch_engine` at scheduling time.
* **Consequence of Admin Switching Provider (Zernio → Composio):**
  - Previously scheduled jobs in `publishing_jobs` will run via worker `process-publishing-jobs`. The worker reads `social_connections` and attempts Zernio API calls, failing because Composio channel account IDs (e.g. `composio_...`) do not exist in Zernio.

---

## 11 & 12. SOCIAL ACCOUNT MAPPING & INTEGRITY

Social accounts are stored in `public.social_connections`.
- Zernio connections populate `channel_account_id` and `slot_number`.
- Composio connections populate `channel_account_id` as `composio_${platform}_${timestamp}` ([`SocialConnectionsView.tsx:120`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/src/components/connections/SocialConnectionsView.tsx#L120)).

There is **no database column explicitly tagging provider origin** (`provider ENUM('zernio', 'composio')`) on `social_connections`. Switching providers causes account mapping confusion and invalid ID references.

---

## 13. PROVIDER CAPABILITY MATRIX

| Capability | Zernio | Composio | SocialSpree UI Support |
| :--- | :--- | :--- | :--- |
| Text Posts | ✅ Yes | ✅ Yes | Supported |
| Image Posts | ✅ Yes | ✅ Yes | Supported |
| Video Posts | ✅ Yes | ✅ Limited | Supported |
| Scheduling | ✅ Server Queue | ⚠️ Client Mock | UI exposes for both |
| Cloudflare R2 | ✅ Mandatory Check | ❌ Unenforced | Enforced in client UI regardless |

---

## 14 - 18. RESPONSE NORMALIZATION, ERROR HANDLING & FAILOVER AUDIT

* **Response Normalization:** Both functions return standard `PublishResult` / `PostLog` types.
* **Failover Isolation:** **PASSED**. There is **NO automatic fallback** from Zernio to Composio or vice-versa upon publishing errors. If Zernio fails, it enters retry backoff within `publishing_jobs`; if Composio fails, it throws a standard error.

---

## 19 & 20. AUDIT LOG PROVIDER TRACKING

* `public.post_logs` captures `requestPayload` containing `provider` (`'composio'` or implicit Zernio).
* **Missing Audit Event:** Administrative provider changes (`Zernio → Composio`) on `public.tenants` are **NOT** currently logged to an audit trail table.

---

## 21 - 25. SECURITY & MULTI-TENANT ISOLATION AUDIT

* **Multi-Tenant Isolation:** `private.provider_credentials` enforces tenant isolation via `tenant_id` and strict database permissions.
* **Null / Unassigned Provider Handling:** Defaults to `'dual'`. If credentials are not configured, client UI generates demo links or returns configuration errors gracefully.

---

## 26. AUDIT LOG MATRIX

| Event | Zernio User | Composio User | Logged? | Provider Captured? |
| :--- | :--- | :--- | :--- | :--- |
| Provider Changed | ✅ | ✅ | ❌ No | ❌ No |
| Account Connected | ✅ | ✅ | ✅ Yes | ⚠️ Partial (via `channel_account_id` prefix) |
| Post Scheduled | ✅ | ✅ | ✅ Yes | ✅ Yes (in `post_logs`) |
| Publish Started | ✅ | ✅ | ✅ Yes | ✅ Yes |
| Publish Success | ✅ | ⚠️ Client Only | ✅ Yes | ✅ Yes |
| Publish Failed | ✅ | ❌ UI throw | ✅ Yes (Zernio) | ❌ No (Composio) |

---

## 27. PRODUCTION COMPARISON SCENARIO SUMMARY

1. **Zernio Workflow:** End-to-end server-side execution via Edge Functions (`publish-post` -> `process-publishing-jobs` -> Zernio API). Full queue retry capabilities.
2. **Composio Workflow:** Hybrid client-heavy execution via `src/lib/composio.ts`. Instant posts succeed via client fetch, but scheduled posts fail when worker attempts execution.

---

## 28. FINAL ARCHITECTURAL ANSWERS & SUMMARY

```text
               Admin / System Default
                         ↓
               public.tenants.dispatch_engine
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
Zernio (Zenith Engine)          Composio (CoreSync Engine)
        │                                 │
  Server-Side Edge Queue           Client Session / Connect
  (process-publishing-jobs)       (src/lib/composio.ts)
        │                                 │
        └────────────────┬────────────────┘
                         ▼
                   Social Platform
```

1. **Where stored?** `public.tenants.dispatch_engine`.
2. **Who can change it?** Super Admin / Tenant Owners.
3. **Can users manipulate it?** Potential RLS gap if tenant owners update their own tenant table row.
4. **How resolved?** Evaluated at dispatch time in `src/lib/zernio.ts`.
5. **Are all publishing paths identical?** **No**. Scheduled worker path only implements Zernio.
6. **Are scheduled jobs provider-safe?** **No**. Provider is not locked on post creation.
7. **Are credentials isolated?** Zernio is isolated in DB vault; Composio API key is currently exposed in Vite bundle (`VITE_COMPOSIO_API_KEY`).
8. **Does failure trigger secondary provider failover?** **No**. Failures remain isolated to assigned provider.

---

## MANDATORY REMEDIATION ACTION PLAN

1. **Remove Exposed Front-End Secrets:** Move `VITE_COMPOSIO_API_KEY` to Edge Function environment secrets and route all Composio API calls through a secure Edge Function proxy.
2. **Lock Provider on Scheduled Jobs:** Add `provider` column to `public.posts` and `public.publishing_jobs` upon creation to prevent provider mismatch when admin settings change.
3. **Update Worker Edge Function:** Update `process-publishing-jobs` to inspect the job's locked provider and execute either Zernio or Composio accordingly.
4. **Enforce Provider Tagging on Social Connections:** Add `provider` column to `public.social_connections`.
