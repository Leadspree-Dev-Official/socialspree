-- Migration: Update profiles table and RLS for Clerk user IDs and leadspree24x7@gmail.com

-- 1. Drop all dependent policies referencing profiles.id across all schemas
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename, schemaname 
        FROM pg_policies 
        WHERE schemaname IN ('public', 'storage')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE;', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 2. Update profiles table to support Clerk text user IDs (e.g. user_2xxx) alongside UUIDs
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey CASCADE;
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.profiles ADD PRIMARY KEY (id);

-- 3. Update role constraint to include super_admin, agency, influencer, business_user, admin, member
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('super_admin', 'agency', 'influencer', 'business_user', 'admin', 'member'));

-- 4. Update private.is_super_admin helper function for Clerk JWT support & leadspree24x7@gmail.com
CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email' = 'leadspree24x7@gmail.com')
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE (id = auth.jwt() ->> 'sub' OR email = auth.jwt() ->> 'email')
        AND is_super_admin = true
    )
  );
END;
$$;

-- 5. Re-create core RLS policies
CREATE POLICY "Tenants: Members view own tenant metadata"
    ON public.tenants FOR SELECT
    USING (
        id IN (SELECT tenant_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR email = (auth.jwt() ->> 'email'))
        OR private.is_super_admin()
    );

CREATE POLICY "Tenants: Super Admin account management"
    ON public.tenants FOR ALL
    TO authenticated
    USING (private.is_super_admin())
    WITH CHECK (private.is_super_admin());

CREATE POLICY "Profiles: Members view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = (auth.jwt() ->> 'sub') OR email = (auth.jwt() ->> 'email') OR private.is_super_admin());

CREATE POLICY "Profiles: Members update own non-privileged profile row"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = (auth.jwt() ->> 'sub') OR email = (auth.jwt() ->> 'email'))
    WITH CHECK (
        (id = (auth.jwt() ->> 'sub') OR email = (auth.jwt() ->> 'email'))
        AND is_super_admin = false
        AND role <> 'super_admin'
    );

CREATE POLICY "SocialConnections: Strict tenant member isolation"
    ON public.social_connections FOR ALL
    USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR email = (auth.jwt() ->> 'email'))
    )
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR email = (auth.jwt() ->> 'email')));

CREATE POLICY "Posts: Strict tenant member content isolation"
    ON public.posts FOR ALL
    USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR email = (auth.jwt() ->> 'email'))
    )
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR email = (auth.jwt() ->> 'email')));

CREATE POLICY "PostLogs: Strict tenant member audit log isolation"
    ON public.post_logs FOR ALL
    USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR email = (auth.jwt() ->> 'email'))
    )
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') OR email = (auth.jwt() ->> 'email')));

CREATE POLICY "Plans: Public read access"
    ON public.plans FOR SELECT
    USING (true);

CREATE POLICY "Plans: Super Admin full control"
    ON public.plans FOR ALL
    TO authenticated
    USING (private.is_super_admin())
    WITH CHECK (private.is_super_admin());

-- 6. Seed default Super Admin profile for leadspree24x7@gmail.com
INSERT INTO public.profiles (id, email, full_name, is_super_admin, role)
VALUES ('clerk_super_admin_seed', 'leadspree24x7@gmail.com', 'LeadSpree Super Admin', true, 'super_admin')
ON CONFLICT (email) DO UPDATE SET is_super_admin = true, role = 'super_admin';


