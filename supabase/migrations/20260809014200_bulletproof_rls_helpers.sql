-- Bulletproof RLS helpers to match by Clerk sub OR email claim OR master email

CREATE OR REPLACE FUNCTION private.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tenant_id FROM public.profiles
  WHERE id = (auth.jwt() ->> 'sub')
     OR lower(email) = lower(auth.jwt() ->> 'email')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE((
    SELECT is_super_admin FROM public.profiles
    WHERE id = (auth.jwt() ->> 'sub')
       OR lower(email) = lower(auth.jwt() ->> 'email')
       OR lower(email) = 'leadspree24x7@gmail.com'
    LIMIT 1
  ), false);
$$;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_tenant_id(), private.is_super_admin() TO authenticated;
