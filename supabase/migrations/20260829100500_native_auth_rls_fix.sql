-- Native Supabase Auth RLS Helpers & Profiles Alignment

CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE((
    SELECT is_super_admin
    FROM public.profiles
    WHERE id = auth.uid()::text
       OR id = (auth.jwt() ->> 'sub')
       OR email = lower(trim(COALESCE(auth.jwt() ->> 'email', '')))
    LIMIT 1
  ), (lower(trim(COALESCE(auth.jwt() ->> 'email', ''))) = 'leadspree24x7@gmail.com'), false);
$$;

REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_super_admin() TO authenticated;

CREATE OR REPLACE FUNCTION private.current_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()::text
         OR id = (auth.jwt() ->> 'sub')
         OR email = lower(trim(COALESCE(auth.jwt() ->> 'email', '')))
      LIMIT 1
    ),
    CASE 
      WHEN lower(trim(COALESCE(auth.jwt() ->> 'email', ''))) = 'leadspree24x7@gmail.com' 
      THEN '00000000-0000-0000-0000-000000000001'::uuid 
      ELSE NULL 
    END
  );
$$;

REVOKE ALL ON FUNCTION private.current_tenant_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_tenant_id() TO authenticated;

-- Ensure Master Super Admin profile exists and is linked
UPDATE public.profiles
SET is_super_admin = true,
    role = 'super_admin',
    tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'leadspree24x7@gmail.com';

-- Update RLS policies on posts to ensure authenticated users see their posts & super admins see all
DROP POLICY IF EXISTS "Posts: strict tenant isolation" ON public.posts;
DROP POLICY IF EXISTS "Posts: Strict tenant member content isolation" ON public.posts;
DROP POLICY IF EXISTS "Posts tenant" ON public.posts;

CREATE POLICY "Posts: strict tenant isolation"
  ON public.posts FOR ALL
  TO authenticated
  USING (
    tenant_id = private.current_tenant_id() 
    OR private.is_super_admin()
  )
  WITH CHECK (
    tenant_id = private.current_tenant_id() 
    OR private.is_super_admin()
  );
