-- ==============================================================================
-- SocialSpree hardened schema
-- Supabase is the AUTHORITATIVE data store. The browser is a thin client that
-- only holds a write-through localStorage cache (no credentials, no privilege logic).
--
-- Ordering is deliberate so the migration is idempotent on re-apply:
--   1. tables / columns            (CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS)
--   2. DROP ALL POLICIES           (clean slate; removes prior-migration policies)
--   3. guarded TYPE conversions    (only when column is still an enum/legacy type,
--      so re-apply is a no-op and never hits "column used in policy")
--   4. backfills + seed
--   5. triggers + RLS + hardened policies
-- ==============================================================================

-- 1. Extensions ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Private schema + security helper (SECURITY INVOKER: runs with caller rights)
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = private
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$;

REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_super_admin() TO authenticated;

-- 3. System settings (server-managed bootstrap config, NOT client state) --------
CREATE TABLE IF NOT EXISTS public.system_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO public.system_settings (key, value)
VALUES
  ('super_admin_email', 'leadspree24x7@gmail.com'),
  ('support_email',      'support@example.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Profiles: one row per Auth user. Role is server-maintained. ---------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT UNIQUE NOT NULL,
  full_name      TEXT,
  tenant_id      UUID,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  role           TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin','admin','member')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS full_name      TEXT,
  ADD COLUMN IF NOT EXISTS tenant_id      UUID,
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS role           TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin','admin','member')),
  ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles (tenant_id);

-- Trigger: auto-create / upsert profile on signup; bootstrap the configured super-admin.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _super_admin_email TEXT;
BEGIN
  SELECT value INTO _super_admin_email FROM public.system_settings WHERE key = 'super_admin_email';
  INSERT INTO public.profiles (id, email, full_name, tenant_id, is_super_admin, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    CASE WHEN NEW.email = _super_admin_email THEN '00000000-0000-0000-0000-000000000001'::uuid ELSE NULL END,
    NEW.email = _super_admin_email,
    CASE WHEN NEW.email = _super_admin_email THEN 'super_admin' ELSE 'member' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    tenant_id = EXCLUDED.tenant_id,
    is_super_admin = EXCLUDED.is_super_admin,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$;

-- Remove ANY pre-existing signup profile trigger on auth.users (older migrations
-- used different trigger names) to avoid duplicate profile inserts. Idempotent.
DO $$
DECLARE
  _tg text;
BEGIN
  FOR _tg IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'users' AND n.nspname = 'auth'
      AND t.tgname NOT LIKE 'pg_%'
      AND t.tgname NOT LIKE 'RI_%'        -- never drop FK enforcement triggers
      AND t.tgname NOT LIKE 'refresh_tokens_%'
      AND t.tgname NOT LIKE 'identities_%'
      AND t.tgname <> 'handle_new_user'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(_tg) || ' ON auth.users';
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
CREATE TRIGGER handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- 5. Tenants (organizations) ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  owner_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_email     TEXT NOT NULL,
  tier_plan       TEXT NOT NULL DEFAULT 'free' CHECK (tier_plan IN ('free','pro','agency')),
  plan_id         TEXT,
  allocated_api_slots  INT NOT NULL DEFAULT 2,
  max_social_accounts  INT NOT NULL DEFAULT 4,
  ai_credits      INT NOT NULL DEFAULT 1000,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  payment_status  TEXT DEFAULT 'trial' CHECK (payment_status IN ('paid','unpaid','overdue','trial')),
  renewal_date    TIMESTAMPTZ,
  billing_cycle   TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  currency        TEXT DEFAULT 'USD',
  currency_symbol TEXT DEFAULT '$',
  cloudinary_config JSONB,
  api_key         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS plan_id          TEXT,
  ADD COLUMN IF NOT EXISTS ai_credits       INT NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS status           TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS payment_status   TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS renewal_date     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS billing_cycle    TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS currency         TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS currency_symbol  TEXT DEFAULT '$',
  ADD COLUMN IF NOT EXISTS cloudinary_config JSONB,
  ADD COLUMN IF NOT EXISTS api_key          TEXT,
  ADD COLUMN IF NOT EXISTS created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now();

-- 6. Subscription plans (managed by super admin) -------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  price_monthly       NUMERIC NOT NULL,
  allocated_api_slots INT NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS name              TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS price_monthly     NUMERIC NOT NULL,
  ADD COLUMN IF NOT EXISTS currency          TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS currency_symbol   TEXT NOT NULL DEFAULT '$',
  ADD COLUMN IF NOT EXISTS allocated_api_slots INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS max_social_accounts INT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS ai_credits        INT NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS features          JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_popular        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ NOT NULL DEFAULT now();

-- 7. API allocation slots (metadata only; provider tokens live in Edge Function secrets)
CREATE TABLE IF NOT EXISTS public.api_allocation_slots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  slot_number         INT NOT NULL,
  slot_name           TEXT,
  max_channels        INT NOT NULL DEFAULT 2,
  connected_account_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  api_key             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slot_number)
);

ALTER TABLE public.api_allocation_slots
  ADD COLUMN IF NOT EXISTS tenant_id           UUID NOT NULL,
  ADD COLUMN IF NOT EXISTS slot_number         INT NOT NULL,
  ADD COLUMN IF NOT EXISTS slot_name           TEXT,
  ADD COLUMN IF NOT EXISTS max_channels        INT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS connected_account_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS api_key             TEXT,
  ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ NOT NULL DEFAULT now();

-- 8. Connected social accounts (per tenant) ------------------------------------
CREATE TABLE IF NOT EXISTS public.social_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  platform        TEXT NOT NULL CHECK (platform IN ('instagram','facebook','linkedin','youtube','x','google_business','tiktok','threads','bluesky','pinterest','reddit','telegram','discord','whatsapp','snapchat')),
  channel_account_id TEXT NOT NULL,
  account_name    TEXT NOT NULL,
  account_handle  TEXT,
  account_avatar  TEXT,
  slot_number     INT NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disconnected')),
  last_synced_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at     TIMESTAMPTZ NOT NULL DEFAULT now();

-- 9. Posts -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL,
  content                TEXT,
  media_urls             JSONB NOT NULL DEFAULT '[]'::jsonb,
  media_type             TEXT DEFAULT 'none' CHECK (media_type IN ('none','image','video')),
  is_cloudflare_hosted   BOOLEAN NOT NULL DEFAULT false,
  selected_account_ids   JSONB NOT NULL DEFAULT '[]'::jsonb,
  status                 TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','publishing','published','failed')),
  scheduled_for          TIMESTAMPTZ,
  published_at           TIMESTAMPTZ,
  error_message          TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS media_type          TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS is_cloudflare_hosted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_account_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status              TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS scheduled_for       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_message       TEXT,
  ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ NOT NULL DEFAULT now();

-- 10. Post audit logs -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID,
  tenant_id       UUID NOT NULL,
  api_post_id     TEXT,
  request_payload JSONB NOT NULL,
  response_payload JSONB NOT NULL,
  http_status     INT NOT NULL DEFAULT 200,
  execution_type  TEXT NOT NULL CHECK (execution_type IN ('instant','background_cron','cloud_native')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.post_logs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 11. Media assets (Media Vault) ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('image','video')),
  cloud_name  TEXT,
  file_size   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 12. Google reviews ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,
  author_name   TEXT NOT NULL,
  author_avatar TEXT,
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  relative_time TEXT,
  sentiment     TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive','neutral','negative')),
  reply         JSONB,
  replied_at    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.google_reviews
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 13. AI credit ledger ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_credit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  tenant_name     TEXT,
  action          TEXT NOT NULL CHECK (action IN ('text_generation','hashtag_generation','superadmin_topup','plan_grant')),
  credits_amount  INT NOT NULL,
  remaining_balance INT NOT NULL,
  description     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_credit_logs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 14. Auto-responder: keyword rules + live comment trigger logs -----------------
CREATE TABLE IF NOT EXISTS public.auto_responder_rules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL,
  name                TEXT NOT NULL,
  platform            TEXT NOT NULL CHECK (platform IN ('instagram','facebook')),
  trigger_keywords    JSONB NOT NULL DEFAULT '[]'::jsonb,
  match_type          TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('exact','contains','regex')),
  action_type         TEXT NOT NULL DEFAULT 'both' CHECK (action_type IN ('comment_reply','private_dm','both')),
  public_reply_template TEXT,
  private_dm_template   TEXT,
  use_ai_context      BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  trigger_count       INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_comment_trigger_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  platform        TEXT NOT NULL CHECK (platform IN ('instagram','facebook')),
  media_title     TEXT,
  sender_username TEXT NOT NULL,
  comment_text    TEXT NOT NULL,
  matched_keyword TEXT,
  public_reply_sent TEXT,
  private_dm_sent   TEXT,
  status          TEXT NOT NULL DEFAULT 'replied' CHECK (status IN ('replied','pending','filtered')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for query performance (tenant-scoped lookups)
CREATE INDEX IF NOT EXISTS idx_social_connections_tenant    ON public.social_connections (tenant_id);
CREATE INDEX IF NOT EXISTS idx_posts_tenant_created         ON public.posts (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_logs_tenant_created     ON public.post_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_tenant_created         ON public.media_assets (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_created       ON public.google_reviews (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_tenant_created       ON public.ai_credit_logs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responder_rules_tenant       ON public.auto_responder_rules (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_trigger_logs_tenant_created  ON public.live_comment_trigger_logs (tenant_id, created_at DESC);

-- updated_at maintenance trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO authenticated;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.tenants;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS set_updated_at ON public.posts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==============================================================================
-- DROP ALL EXISTING POLICIES on public tables (clean slate for the hardened set
-- below). This also removes any prior-migration policies that could otherwise
-- block the guarded type conversions. Idempotent.
-- ==============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.polname, c.relname
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.polname) || ' ON public.' || quote_ident(r.relname);
  END LOOP;
END;
$$;

-- ==============================================================================
-- GUARDED TYPE CONVERSIONS: only convert columns that are still not the target
-- type (e.g. legacy enums like `user_role`). On re-apply the columns are already
-- TEXT/boolean so the conversions are skipped -> no "column used in policy" error.
-- ==============================================================================
DO $$
DECLARE
  coltype text;
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT t, c, tgt FROM (
      VALUES
        ('profiles','role','text'),
        ('profiles','is_super_admin','boolean'),
        ('tenants','tier_plan','text'),
        ('tenants','status','text'),
        ('tenants','payment_status','text'),
        ('tenants','billing_cycle','text'),
        ('tenants','currency','text'),
        ('tenants','currency_symbol','text'),
        ('plans','currency','text'),
        ('plans','currency_symbol','text')
    ) AS v(t, c, tgt)
  LOOP
    SELECT format_type(a.atttypid, a.atttypmod) INTO coltype
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = rec.t AND n.nspname = 'public'
      AND a.attname = rec.c AND a.attnum > 0 AND NOT a.attisdropped;
    IF coltype IS NOT NULL THEN
      IF rec.tgt = 'text' AND coltype NOT IN ('text','character varying','varchar') THEN
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE TEXT USING %I::text', rec.t, rec.c, rec.c);
      ELSIF rec.tgt = 'boolean' AND coltype <> 'boolean' THEN
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE BOOLEAN USING %I::boolean', rec.t, rec.c, rec.c);
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Backfill legacy nulls (role is now text; is_super_admin is boolean).
UPDATE public.profiles SET role = 'member' WHERE role IS NULL;
UPDATE public.profiles SET is_super_admin = false WHERE is_super_admin IS NULL;

-- ==============================================================================
-- ROW LEVEL SECURITY — tenant isolation + server-derived privileges
-- ==============================================================================
ALTER TABLE public.tenants              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_allocation_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_responder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_comment_trigger_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants: Members view own tenant metadata"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR private.is_super_admin()
  );

CREATE POLICY "Tenants: Super Admin full control"
  ON public.tenants FOR ALL
  TO authenticated
  USING (private.is_super_admin())
  WITH CHECK (private.is_super_admin());

CREATE POLICY "Profiles: Members view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR private.is_super_admin());

CREATE POLICY "Profiles: Members insert own profile row"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles: Members update own non-privileged profile row"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND is_super_admin = false);

CREATE POLICY "Plans: Public read access"
  ON public.plans FOR SELECT
  USING (true);

CREATE POLICY "Plans: Super Admin full control"
  ON public.plans FOR ALL
  TO authenticated
  USING (private.is_super_admin())
  WITH CHECK (private.is_super_admin());

CREATE POLICY "ApiSlots: tenant isolation"
  ON public.api_allocation_slots FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "SocialConnections: strict tenant isolation"
  ON public.social_connections FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Posts: strict tenant isolation"
  ON public.posts FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "PostLogs: strict tenant isolation"
  ON public.post_logs FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "MediaAssets: strict tenant isolation"
  ON public.media_assets FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "GoogleReviews: strict tenant isolation"
  ON public.google_reviews FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "AiCreditLogs: strict tenant isolation"
  ON public.ai_credit_logs FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "AutoResponderRules: strict tenant isolation"
  ON public.auto_responder_rules FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "TriggerLogs: strict tenant isolation"
  ON public.live_comment_trigger_logs FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==============================================================================
-- SEED: plans + master super-admin tenant (matches INITIAL_TENANTS in store.ts)
-- ==============================================================================
INSERT INTO public.plans (id, name, price_monthly, currency, currency_symbol, allocated_api_slots, max_social_accounts, ai_credits, features, is_popular)
VALUES
  ('plan-starter',   'Starter Plan (US/Global)',      19,   'USD', '$', 1,  2,  500,  '["1 Zernio API Key Slot (2 Social Channels)","500 AI Content & Hashtag Credits/mo","Instant & Scheduled Posting","Cloudflare & Cloudinary CDN Integration","Basic Activity Audit Logs"]'::jsonb, false),
  ('plan-pro',       'Pro Agency Plan (India Region)', 1499,'INR','₹', 3,  6,  2500, '["3 Zernio API Key Slots (6 Social Channels)","2,500 AI Content & Hashtag Credits/mo","Parallel Key Firing Engine","Cloud Native Execution & Webhooks","Google Review Auto-AI Responder","Priority Super Admin Support"]'::jsonb, true),
  ('plan-enterprise','Enterprise Agency Tier (UK/EU)',119,'GBP','£',10,20,10000,'["10 Zernio API Key Slots (20 Social Channels)","10,000 AI Content & Hashtag Credits/mo","Unlimited Parallel Dispatch Engine","Custom Storage Buckets & CDN","Dedicated Account Manager & SLA"]'::jsonb, false)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, price_monthly = EXCLUDED.price_monthly, currency = EXCLUDED.currency,
      currency_symbol = EXCLUDED.currency_symbol, allocated_api_slots = EXCLUDED.allocated_api_slots,
      max_social_accounts = EXCLUDED.max_social_accounts, ai_credits = EXCLUDED.ai_credits,
      features = EXCLUDED.features, is_popular = EXCLUDED.is_popular;

INSERT INTO public.tenants (
  id, name, owner_email, tier_plan, plan_id, allocated_api_slots, max_social_accounts,
  ai_credits, cloudinary_config, status, payment_status, renewal_date, billing_cycle, currency, currency_symbol, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'LeadSpree HQ (Master Super Admin)',
  'leadspree24x7@gmail.com',
  'pro', 'plan-pro', 5, 10, 1000,
  '{"cloudName":"djmww1dwr","uploadPreset":"ml_default","bucketName":"socialspree-media-vault","useSuperAdminDefault":true,"selectedDefaultAccountId":"cld-master-01"}'::jsonb,
  'active', 'paid', '2026-12-31', 'monthly', 'USD', '$', '2026-01-01T00:00:00Z'
)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, tier_plan = EXCLUDED.tier_plan, plan_id = EXCLUDED.plan_id,
      allocated_api_slots = EXCLUDED.allocated_api_slots, max_social_accounts = EXCLUDED.max_social_accounts,
      ai_credits = EXCLUDED.ai_credits, cloudinary_config = EXCLUDED.cloudinary_config,
      status = EXCLUDED.status, payment_status = EXCLUDED.payment_status,
      renewal_date = EXCLUDED.renewal_date, billing_cycle = EXCLUDED.billing_cycle,
      currency = EXCLUDED.currency, currency_symbol = EXCLUDED.currency_symbol;

INSERT INTO public.api_allocation_slots (tenant_id, slot_number, slot_name, max_channels, connected_account_ids, api_key)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, n, 'API '||n, 2, '[]'::jsonb, ''
FROM (VALUES (1),(2),(3),(4),(5)) AS v(n)
ON CONFLICT (tenant_id, slot_number) DO NOTHING;
