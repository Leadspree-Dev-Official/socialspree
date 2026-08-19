-- Security hardening: authorization must be bound to the verified Clerk subject.
-- Do not grant privileges from a browser-supplied email address.

CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT is_super_admin
    FROM public.profiles
    WHERE id = (auth.jwt() ->> 'sub')
  ), false);
$$;

REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_super_admin() TO authenticated;

CREATE OR REPLACE FUNCTION private.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = (auth.jwt() ->> 'sub');
$$;

REVOKE ALL ON FUNCTION private.current_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_tenant_id() TO authenticated;

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
  jwt_email TEXT := lower(trim(COALESCE(auth.jwt() ->> 'email', auth.jwt() -> 'user_metadata' ->> 'email', '')));
  requested_email TEXT := lower(trim(p_email));
  result public.profiles%ROWTYPE;
BEGIN
  IF subject IS NULL OR subject = '' THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF requested_email = '' THEN RAISE EXCEPTION 'A primary email is required'; END IF;
  IF jwt_email <> '' AND jwt_email <> requested_email THEN
    RAISE EXCEPTION 'Email does not match the authenticated session';
  END IF;

  -- Identity is keyed exclusively by the verified Clerk subject.
  INSERT INTO public.profiles (id, email, full_name, avatar_url, is_super_admin, role)
  VALUES (subject, requested_email, NULLIF(trim(p_full_name), ''), p_avatar_url, false, 'member')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_clerk_profile(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_clerk_profile(TEXT, TEXT, TEXT) TO authenticated;

-- Existing privileged records remain explicit; no email-based promotion is allowed.
DELETE FROM public.profiles WHERE id = 'clerk_super_admin_seed';

-- Remove the hard-coded bootstrap setting. Super-admin status must be maintained
-- by an explicit server-side/admin workflow, not by a mutable email string.
DELETE FROM public.system_settings WHERE key = 'super_admin_email';

-- Keep tenant-owned invitation/user IDs aligned with Clerk subjects.
ALTER TABLE public.tenant_invitations ALTER COLUMN invited_by TYPE TEXT USING invited_by::text;
ALTER TABLE public.checkout_orders ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE private.oauth_states ALTER COLUMN created_by TYPE TEXT USING created_by::text;

-- Enforce complete worker state lifecycle and prevent impossible negative attempts.
ALTER TABLE public.publishing_jobs
  ADD CONSTRAINT publishing_jobs_attempts_nonnegative CHECK (attempts >= 0),
  ADD CONSTRAINT publishing_jobs_max_attempts_positive CHECK (max_attempts > 0);

CREATE INDEX IF NOT EXISTS publishing_jobs_processing_lease_idx
  ON public.publishing_jobs(status, locked_at)
  WHERE status = 'processing';

-- Public plans are presentation/configuration data; financial state remains server managed.
REVOKE INSERT, UPDATE, DELETE ON public.checkout_orders FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payment_events FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.publishing_jobs FROM anon, authenticated;
