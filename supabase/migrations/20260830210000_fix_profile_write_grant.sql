-- ==============================================================================
-- 20260830210000_fix_profile_write_grant.sql
-- Let users actually save their own profile.
--
-- 20260808161512 revoked INSERT/UPDATE/DELETE on public.profiles to stop
-- clients forging role and tenant_id. A later migration added a "Profiles
-- update own" RLS policy, but the table GRANT was never restored — and
-- Postgres checks grants BEFORE row-level security, so the policy never got a
-- chance to run.
--
-- Every profile save therefore failed with a permission error that
-- auth.updateProfile swallows in a try/catch. The UI reported success, the
-- value lived only in that browser's localStorage, and the row in the database
-- still shows avatar_url and job_title as null.
--
-- The privilege is granted column-by-column so the original protection holds:
-- id, email, tenant_id, role and is_super_admin remain unwritable by clients,
-- which is what the revoke was actually defending.
-- ==============================================================================

GRANT UPDATE (
  full_name,
  avatar_url,
  job_title,
  phone_number,
  timezone,
  notifications,
  updated_at
) ON public.profiles TO authenticated;

-- The "Profiles update own" policy already restricts this to the caller's own
-- row; assert it exists so this migration cannot silently widen access if that
-- policy is ever dropped.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Profiles update own'
  ) THEN
    RAISE EXCEPTION
      'Profiles update own policy is missing — refusing to grant UPDATE without it.';
  END IF;
END $$;

COMMENT ON TABLE public.profiles IS
  'Clients may update only their own presentation fields. id, email, tenant_id, role and is_super_admin are deliberately not granted — those are set server-side.';
