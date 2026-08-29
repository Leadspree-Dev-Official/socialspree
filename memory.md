# 🧠 Project Context & Memory: SocialSpree SaaS

This document serves as the authoritative, permanent reference for the **SocialSpree Multi-Tenant Social Manager SaaS** project.

---

## 📌 1. Project Overview & Identity
- **Project Name:** SocialSpree SaaS (Multi-Tenant B2B Social Media Manager)
- **Primary Goal:** Multi-tenant B2B SaaS web application enabling business clients to connect social accounts (Instagram, LinkedIn, X, YouTube, Facebook, Google Business), compose, schedule, and publish posts, and track real-time audit logs.
- **Tech Stack:** React 19 + Vite + TypeScript + Tailwind CSS v4 + Lucide Icons + Supabase JS Client & Cloud PostgreSQL.
- **Stitch Project ID:** `18411527533274806022`
- **Cloud Supabase URL:** `https://qglhbesenigpspgkgbac.supabase.co` (Ref: `qglhbesenigpspgkgbac`)
- **Clean Production Initial State:** Removed all demo client accounts (`Acme Digital Marketing`, `Pulse Social Agency`), demo posts, demo audit logs, and demo Google reviews. Only the root Super Admin account (`LeadSpree HQ (Master Super Admin)`) exists initially so the user can provision all client tenants and connect social accounts from scratch.
- **Super Admin Master Workspace:** `LeadSpree HQ (Master Super Admin)` initialized with **`pro`** tier plan badge. When Super Admin mode is active, the active workspace defaults automatically to Master Super Admin (`PRO` Tier Engine).

---

## 🔒 2. Super Admin API Allocation & Strict White-Label Rules
1. **Super Admin API Key Allocation:**
   - Super Admin (`leadspree24x7@gmail.com`) can create, allocate, set, and edit the underlying Master API Integration Key for any client organization/tenant in the Super Admin Management Console.
   - Super Admin can assign API keys directly during account provisioning or edit existing tenant API keys with live key allocation controls.
2. **Strict White-Label Rule:**
   - **The underlying engine provider name is NEVER displayed or mentioned anywhere in the app.**
   - All end users operate under white-labeled branding terms: *Master API Integration Key*, *Publishing Engine API*, *Standard / Pro Tier Engine*, *Channel Account ID*, and *Cloud Dispatcher*.

---

## 🎨 3. Stitch Project Assets & Responsive Layouts
- **Desktop View (`>= md`):**
  - Left Sidebar: Dark Slate / Black (`bg-black`) sticky sidebar containing brand identity (`SocialSpree Pro`), navigation links, Create Post button (`#5D3FD3`), and Super Admin Portal link.
  - Sticky Top Header: Glassmorphic top navbar (`bg-[#F8FAFF]/90 backdrop-blur-xl`) with dynamic page title, strict organization workspace badge (no dropdown switcher to other client accounts), Super Admin access toggle, global search, and user avatar.
    ├── composer/
    │   ├── PostComposer.tsx    # Stitch Reordered Post Composer (clean layout starting directly with channel selector & post editor), Cloudinary, API Keys, Social App Credentials & Org Profile)
    ├── help/
    │   └── HelpCenterView.tsx  # Help Center, FAQ accordions, video tutorials & Super Admin support ticket desk
    ├── layout/
    │   ├── Sidebar.tsx         # Stitch Dark Slate Sidebar (Desktop) with Settings & Help Center
    │   ├── MobileNav.tsx       # Stitch Fixed Bottom Navigation Bar (Mobile) with Settings & HelpNav.tsx`): Home, Compose, Accounts, Logs, Reviews, and Admin tabs for touch navigation.
- **Live Device Preview:** High-fidelity smartphone shell with time/status bar (`9:41`), dynamic platform-authentic feed previews (Instagram, LinkedIn, X/Twitter, YouTube, Facebook, Google Business Profile), and platform-specific Pro Tip panel.

---

## 🔒 4. Supabase Cloud Integration (`qglhbesenigpspgkgbac`)
Database schema defined in [`supabase_schema.sql`](file:///Users/aniruddhadas/Ani/Coding%20Projects/Google%20Antigravity/Development%20Products/SaaS/SocialSpree/supabase_schema.sql):
- **`tenants`:** Multi-tenant organization records, allocated API keys (`api_key`), subscription tiers (`tier_plan`), and social connection limits (`max_social_accounts`).
- **`profiles`:** User profile identities linked to Auth & Tenant, with `is_super_admin` flag.
- **`social_connections`:** Active social channels (Instagram, Facebook, LinkedIn, YouTube, X, Google Business) per tenant.
- **`posts`:** Composed posts with media URLs, Cloudflare hosting flags, scheduled timestamps, and execution status.
- **`post_logs`:** HTTP audit log trail storing `request_payload`, `response_payload`, HTTP status code (200/201 vs 400+), and execution mode (`instant`, `background_cron`, `cloud_native`).
- **Permanent Database & Storage Persistence Layer:**
  - Added `public.plans` table to Supabase PostgreSQL schema (`supabase_schema.sql`).
  - Integrated persistent data getters and auto-saving storage listeners (`getStoredPlans()`, `saveStoredPlans()`, `getStoredTenants()`, `saveStoredTenants()`, `getStoredAccounts()`, `saveStoredAccounts()`).
  - **No Data Reset on Refresh:** Creating a subscription plan, provisioning a tenant account, or connecting a social channel is saved permanently and persists across page reloads and browser sessions.
- **Rebuilt Super Admin Panel Architecture (Auto-Collapsible Submenus):**
  - **Auto-Collapsed by Default & On Navigation:** The Super Admin Portal submenu in the sidebar stays auto-collapsed by default (`adminMenuOpen: false`). Clicking any non-admin main navigation item (*Dashboard*, *Composer*, *Analytics*, *Reviews*, *Social Accounts*, *Activity Logs*, *Help Center*, *Settings*) automatically closes/collapses the Super Admin Panel submenu.
  - **100% 2-Way Synchronization:** Connected `activeSubTab` and `onSelectSubTab` state directly between `Sidebar.tsx`, `App.tsx`, and `SuperAdminPortal.tsx`. Clicking any sidebar sub-item (e.g. *API Allocation*, *Subscriptions*, *Plans*) instantly switches the page and highlights the active sub-navbar tab.
  - Default View when opening Super Admin: **Dashboard** (Overview metrics, total tenants, total allocated API slots, CDN status).
  - **Submenu 1 (Dashboard):** Super Admin system overview metrics, tenant status overview, and Provision Tenant account action.
  - **Submenu 2 (Subscription Management):** Complete Subscription Control Console with **MRR Financial Widgets** (USD, INR, GBP), dynamic **Plan Selector Dropdown** (assign any created plan), **Payment Status Toggle** (`Paid ✓`, `Unpaid ⚠️`, `Overdue ✖`, `Trial 🎁`), **Renewal Date Picker** (`type="date"`), **Active/Suspended Account Toggle**, Tenant Provisioning Modal, and Delete Tenant.
  - **Submenu 3 (Plans):** Full Plan Editor & Multi-Currency Regional Plan Creator (*Starter*, *Pro Agency*, *Enterprise Tier*). Supports per-plan currency selection (**INR ₹**, **USD $**, **GBP £**), custom monthly pricing, allocated Zernio API key slots (1 slot = 2 channels), and feature lists.
  - **Submenu 4 (API Allocation):** **`+ Add API Slots`** button aligned on the **EXACT SAME LINE** as `Zernio API Slot Provisioning Console` header text. Opens line-by-line modal where Super Admin selects User/Tenant and specifies API Count (e.g. 3). Dynamically generates input lines (`API 1`, `API 2`, `API 3`...) for Super Admin to input individual secret API key strings.
  - **Strict White-Labeling:** Client UI (Dashboard, Composer, Social Connections, Settings, Audit Logs) contains **ZERO** mentions of the word Zernio. Client sees channel slots (`ACCOUNT SLOT 1`, `ACCOUNT SLOT 2`, `ACCOUNT SLOT 3`) with active **CONNECT** buttons enabled once Super Admin provisions API keys.
  - **Clean Header Layout:** Removed top dark banner from Super Admin Portal. Positioned **`+ Provision Tenant Account`** button right alongside the sub-tabs navigation bar on the right side.
  - **Clean Sidebar Layout:** Removed sub-menu accordion items under Super Admin Panel from the left sidebar. The sidebar features a clean, single-button navigation item for **Super Admin Panel**, while all 6 sub-tabs (`Dashboard`, `Subscriptions`, `Plans`, `API Allocation`, `Cloudinary & Storage CDN`, `Settings`) remain organized horizontally inside the Super Admin Portal.
  - **Multi-Cloudinary Account Manager (Super Admin & User Settings):** Super Admin and client users can add, edit, select active, and manage **Multiple Cloudinary CDN Accounts / Buckets** using 3 fields: `Cloudinary Cloud Name` (e.g. `djmww1dwr`), `Unsigned Upload Preset (Direct Uploads)` (e.g. `ml_default`), and `Storage Bucket Name` (e.g. `socialspree-media-vault`).
  - **Clean Connected Target Channel Pills:** In `PostComposer.tsx`, target channel buttons now display **only the platform icon and clean channel name** (e.g. `[TikTok Icon] TikTok ✓`, `[Instagram Icon] Instagram ✓`), completely removing long tenant organization strings and duplicated text labels.
  - **Public Marketing Site & Dual Payment Modal:** Added public landing page navigation (`LandingHero`, `FeaturesView`, `PricingView`, `TestimonialsView`, `AboutContactView`) with a dual Razorpay + Stripe payment checkout modal (`CheckoutModal`), seamlessly toggling between the marketing site and SaaS app workspace.
  - **Authentic iPhone 16 Pro Device Mockup:** Designed an ultra-realistic smartphone hardware chassis in `LivePreviewDrawer.tsx` complete with titanium border trim, left volume rocker keys, right power button, Dynamic Island top camera notch, iOS status bar (`9:41 AM`), bottom home indicator bar, platform switcher tabs (**Instagram default**), and real-time feed rendering.
  - **AI Content & Hashtag Generator:** Positioned directly below the Post Composer editor. Generates full post captions, viral hashtag clusters, and engaging hooks. Consumes 10 AI Credits per generation, updates tenant balance, and includes **"Insert into Post Content"** button and an interactive **AI Credit Deduction Logs Drawer**.
  - **Submenu 6 (AI Credits & Settings):** Dedicated Super Admin console to configure global AI Provider API keys (Gemini / OpenAI), set default 1,000 credit allocation for new tenants, grant/top-up credits per tenant, and view real-time credit deduction audit logs.
  - **Submenu 7 (System & Currency Settings):** Global Super Admin System & Currency Settings page with live selector for **INR (₹ - Indian Rupee)**, **USD ($ - US Dollar)**, and **GBP (£ - British Pound)**.
- **Live Backend Dispatcher Integration:** `src/lib/zernio.ts` configured with `VITE_ZERNIO_API_URL` environment endpoint checks to dispatch posts live to backend server API gateways.
- **Production Readiness Audit Report:** Generated [`production_readiness_audit.md`](file:///Users/aniruddhadas/.gemini/antigravity/brain/158b050d-3bca-4cfd-bcaf-75675f11fba8/production_readiness_audit.md) outlining full frontend & database readiness plus OAuth app developer setup.
- **White-Labeled 2-Channel API Slot Connection Architecture:**
  - Each underlying Zernio API key slot yields **2 social account connections**.
  - Super Admin allocates API slots to tenants (e.g. 1 slot = 2 accounts, 3 slots = 6 accounts firing in parallel).
  - **End Users NEVER see the API key value** (masked as `••••••••••••••••••••••••`). Clients connect social channels against each allocated slot group (Account 1, Account 2, etc.) directly in the app.
  - Matches the exact design grid: Facebook, Instagram, TikTok, LinkedIn, X (Twitter), YouTube, Threads, Bluesky, Pinterest, Reddit, Telegram, Discord, WhatsApp, Snapchat, Google Business Profile (with `CONNECTED`, `LIMIT`, and `SOON` indicators).

---

## ⚡ 5. Critical Core Business Rules

### A. Cloudflare Link & Cloudinary Storage Integration for Scheduled Posts
- **Publish Now (Instant Publishing):** Supports **Direct File Upload**, **Cloudflare Link**, and **Cloudinary Upload**.
- **Scheduled Posts (`scheduled_for` set):** MUST use a hosted CDN link, either via **Cloudflare Link** or **Cloudinary Upload** (which automatically uploads files to Cloudinary and yields a hosted CDN URL).
- **Cloudflare Link Label:** Cleaned up labels to **"Cloudflare Link"** (removed "R2" text).
- **Super Admin & User Cloudinary Control:** Super Admin can configure and manage a **Global Cloudinary Storage Pool** with multiple default Cloudinary accounts (e.g. *Primary Master CDN*, *High-Speed Video CDN*, *Backup Storage CDN*). Super Admin can add new Cloudinary accounts to the pool, set any account as the **Primary Active Default**, or delete unused accounts. Client users automatically upload media through the active default account in the pool (or configure their own custom Cloudinary account).

### B. Text Caption Optionality
- Caption/text content is **NOT mandatory** for any post containing an attached image or video.

### C. Super Admin Console (`leadspree24x7@gmail.com`)
- **Root Admin Email:** `leadspree24x7@gmail.com`
- **Super Admin Portal Tab:** Accessible via Super Admin mode toggle.
- **Capabilities:**
  1. Create new client tenant/admin accounts.
  2. Allocate and update Master API Integration Keys per tenant.
  3. Delete tenant accounts.
  4. Manage Tier Plans (`Standard / Free` vs `Pro`).
  5. Adjust Max Social Account limits per tenant.
  6. Global audit log tracking across all business clients.

---

## 🔑 6. Native Supabase Authentication (Clerk-Free Architecture)
- **Primary Auth Engine:** 100% Native Supabase Auth (`@supabase/supabase-js`) connected strictly to `https://qglhbesenigpspgkgbac.supabase.co`.
- **Clerk Dropped:** Complete removal of `@clerk/react` across all UI views, providers, and headers.
- **Native Auth Views & Flow:**
  - `src/components/auth/AuthView.tsx`: Sign In (`supabase.auth.signInWithPassword`), Sign Up (`supabase.auth.signUp`), Forgot Password / Recovery email submission (`supabase.auth.resetPasswordForEmail`), and Instant Demo Sandbox launchers (`business_user`, `agency`, `super_admin`).
  - `src/components/auth/SetNewPasswordView.tsx`: Password recovery view picking up recovery tokens and executing `supabase.auth.updateUser({ password })`, with auto-redirect to `/login`.
  - `src/components/settings/SettingsView.tsx`: In-app password change and account security card via `supabase.auth.updateUser({ password })`.
- **Profile Synchronization:** `auth.getProfile()` queries `supabase.auth.getSession()` and syncs authenticated credentials directly to `public.profiles` table with automatic row provisioning.

