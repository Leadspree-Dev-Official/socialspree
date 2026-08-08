-- Complete the migration from Supabase Auth UUIDs to Clerk subjects.
-- Supabase Third-Party Auth validates the Clerk JWT before these helpers/RLS
-- policies run; authorization is stored in profiles, never inferred in React.

-- Drop all existing RLS policies on public and storage tables FIRST so column type changes are unblocked.
DO $$
DECLARE policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  END LOOP;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS notifications JSONB NOT NULL DEFAULT '{"emailDigest":true,"postFailureAlerts":true,"securityAlerts":true}'::jsonb;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.profiles ADD PRIMARY KEY (id);

ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_owner_id_fkey;
ALTER TABLE public.tenants ALTER COLUMN owner_id TYPE TEXT USING owner_id::text;
ALTER TABLE public.tenant_invitations DROP CONSTRAINT IF EXISTS tenant_invitations_invited_by_fkey;
ALTER TABLE public.tenant_invitations ALTER COLUMN invited_by TYPE TEXT USING invited_by::text;
ALTER TABLE public.checkout_orders DROP CONSTRAINT IF EXISTS checkout_orders_user_id_fkey;
ALTER TABLE public.checkout_orders ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE private.oauth_states DROP CONSTRAINT IF EXISTS oauth_states_created_by_fkey;
ALTER TABLE private.oauth_states ALTER COLUMN created_by TYPE TEXT USING created_by::text;

DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- Remove the fake seed identity. A real Clerk user is promoted only from a
-- verified Clerk email claim or by an explicit server-side DB update.
DELETE FROM public.profiles WHERE id = 'clerk_super_admin_seed';

CREATE OR REPLACE FUNCTION public.current_clerk_user_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$ SELECT auth.jwt() ->> 'sub' $$;

REVOKE ALL ON FUNCTION public.current_clerk_user_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_clerk_user_id() TO authenticated;

CREATE OR REPLACE FUNCTION private.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub');
$$;

CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT is_super_admin FROM public.profiles WHERE id = (auth.jwt() ->> 'sub')
  ), false);
$$;

CREATE OR REPLACE FUNCTION private.is_tenant_admin(target_tenant UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT tenant_id = target_tenant AND role IN ('admin', 'super_admin')
    FROM public.profiles WHERE id = (auth.jwt() ->> 'sub')
  ), false) OR private.is_super_admin();
$$;

REVOKE ALL ON FUNCTION private.current_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_tenant_admin(UUID) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_tenant_id(), private.is_super_admin(), private.is_tenant_admin(UUID) TO authenticated;

-- First-login provisioning. The caller can supply display fields, but cannot
-- supply tenant, role, or privilege. Super-admin bootstrap requires a signed
-- Clerk `email` claim matching the DB-owned configured address.
CREATE OR REPLACE FUNCTION public.ensure_clerk_profile(
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  subject TEXT := auth.jwt() ->> 'sub';
  jwt_email TEXT := lower(auth.jwt() ->> 'email');
  requested_email TEXT := lower(trim(p_email));
  configured_admin_email TEXT;
  verified_admin BOOLEAN := false;
  result public.profiles%ROWTYPE;
BEGIN
  IF subject IS NULL OR subject = '' THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF requested_email = '' THEN RAISE EXCEPTION 'A primary email is required'; END IF;
  IF jwt_email IS NOT NULL AND jwt_email <> requested_email THEN
    RAISE EXCEPTION 'Email does not match the authenticated Clerk session';
  END IF;

  SELECT value INTO configured_admin_email
  FROM public.system_settings WHERE key = 'super_admin_email';
  verified_admin := jwt_email IS NOT NULL AND jwt_email = lower(configured_admin_email);

  INSERT INTO public.profiles (id, email, full_name, avatar_url, is_super_admin, role)
  VALUES (
    subject, requested_email, NULLIF(trim(p_full_name), ''), p_avatar_url,
    verified_admin, CASE WHEN verified_admin THEN 'super_admin' ELSE 'member' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    is_super_admin = public.profiles.is_super_admin OR verified_admin,
    role = CASE WHEN public.profiles.is_super_admin OR verified_admin THEN 'super_admin' ELSE public.profiles.role END,
    updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_clerk_profile(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_clerk_profile(TEXT, TEXT, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.create_oauth_state(TEXT, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID);
CREATE FUNCTION public.create_oauth_state(
  target_hash TEXT,
  target_tenant UUID,
  target_provider TEXT,
  target_redirect TEXT,
  target_verifier TEXT,
  target_expiry TIMESTAMPTZ,
  target_user TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;
  INSERT INTO private.oauth_states(state_hash, tenant_id, provider, redirect_uri, code_verifier, expires_at, created_by)
  VALUES(target_hash, target_tenant, target_provider, target_redirect, target_verifier, target_expiry, target_user);
END;
$$;
REVOKE ALL ON FUNCTION public.create_oauth_state(TEXT, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_oauth_state(TEXT, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT) TO service_role;

-- Rebuild the complete Clerk-subject policy set so every browser-visible table is covered.
CREATE POLICY "Tenants read own" ON public.tenants FOR SELECT TO authenticated
USING (id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "Tenants admin manage" ON public.tenants FOR ALL TO authenticated
USING (private.is_super_admin()) WITH CHECK (private.is_super_admin());

CREATE POLICY "Profiles read own" ON public.profiles FOR SELECT TO authenticated
USING (id = (auth.jwt() ->> 'sub') OR private.is_super_admin());
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE TO authenticated
USING (id = (auth.jwt() ->> 'sub')) WITH CHECK (id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Plans public read" ON public.plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Plans admin manage" ON public.plans FOR ALL TO authenticated
USING (private.is_super_admin()) WITH CHECK (private.is_super_admin());

CREATE POLICY "Api slots tenant read" ON public.api_allocation_slots FOR SELECT TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "Api slots tenant admin manage" ON public.api_allocation_slots FOR ALL TO authenticated
USING (private.is_tenant_admin(tenant_id)) WITH CHECK (private.is_tenant_admin(tenant_id));

CREATE POLICY "Social connections tenant" ON public.social_connections FOR ALL TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin())
WITH CHECK (tenant_id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "Posts tenant" ON public.posts FOR ALL TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin())
WITH CHECK (tenant_id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "Post logs tenant" ON public.post_logs FOR ALL TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin())
WITH CHECK (tenant_id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "AI logs tenant" ON public.ai_credit_logs FOR ALL TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin())
WITH CHECK (tenant_id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "Media assets tenant" ON public.media_assets FOR ALL TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin())
WITH CHECK (tenant_id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "Reviews tenant" ON public.google_reviews FOR ALL TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin())
WITH CHECK (tenant_id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "Autoresponder tenant" ON public.auto_responder_rules FOR ALL TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin())
WITH CHECK (tenant_id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "Trigger logs tenant" ON public.live_comment_trigger_logs FOR ALL TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin())
WITH CHECK (tenant_id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "Analytics tenant read" ON public.analytics_snapshots FOR SELECT TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin());

CREATE POLICY "Invitations tenant admins read" ON public.tenant_invitations FOR SELECT TO authenticated
USING (private.is_tenant_admin(tenant_id));
CREATE POLICY "Publishing jobs tenant read" ON public.publishing_jobs FOR SELECT TO authenticated
USING (tenant_id = private.current_tenant_id() OR private.is_super_admin());
CREATE POLICY "Checkout orders owner read" ON public.checkout_orders FOR SELECT TO authenticated
USING (user_id = (auth.jwt() ->> 'sub') OR private.is_super_admin());
CREATE POLICY "System settings admin read" ON public.system_settings FOR SELECT TO authenticated
USING (private.is_super_admin());

CREATE POLICY "Tenant media read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'socialspree-media' AND ((storage.foldername(name))[1] = private.current_tenant_id()::text OR private.is_super_admin()));
CREATE POLICY "Tenant media insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'socialspree-media' AND ((storage.foldername(name))[1] = private.current_tenant_id()::text OR private.is_super_admin()));
CREATE POLICY "Tenant media update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'socialspree-media' AND ((storage.foldername(name))[1] = private.current_tenant_id()::text OR private.is_super_admin()))
WITH CHECK (bucket_id = 'socialspree-media' AND ((storage.foldername(name))[1] = private.current_tenant_id()::text OR private.is_super_admin()));
CREATE POLICY "Tenant media delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'socialspree-media' AND ((storage.foldername(name))[1] = private.current_tenant_id()::text OR private.is_super_admin()));

-- Profile privilege fields are not writable through the Data API.
REVOKE INSERT, DELETE, UPDATE ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, avatar_url, job_title, phone_number, timezone, notifications, updated_at) ON public.profiles TO authenticated;

REVOKE ALL ON public.payment_events FROM anon, authenticated;
