CREATE OR REPLACE FUNCTION private.current_tenant_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;
CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;
CREATE OR REPLACE FUNCTION private.is_tenant_admin(target_tenant UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT tenant_id = target_tenant AND role IN ('admin','super_admin') FROM public.profiles WHERE id = auth.uid()), false)
    OR private.is_super_admin();
$$;

REVOKE ALL ON FUNCTION private.current_tenant_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_tenant_admin(UUID) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_tenant_id(), private.is_super_admin(), private.is_tenant_admin(UUID) TO authenticated;

-- Replace recursive profile subqueries in tenant-owned policies.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE schemaname='public' LOOP
    NULL;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Tenants: Members view own tenant metadata" ON public.tenants;
CREATE POLICY "Tenants: Members view own tenant metadata" ON public.tenants FOR SELECT TO authenticated
USING (id = private.current_tenant_id() OR private.is_super_admin());
DROP POLICY IF EXISTS "Profiles: Members view own profile" ON public.profiles;
CREATE POLICY "Profiles: Members view own profile" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR private.is_super_admin());

DROP POLICY IF EXISTS "ApiSlots: tenant read" ON public.api_allocation_slots;
CREATE POLICY "ApiSlots: tenant read" ON public.api_allocation_slots FOR SELECT TO authenticated USING (tenant_id = private.current_tenant_id() OR private.is_super_admin());

-- Rewrite standard tenant policies with the non-recursive helper.
DROP POLICY IF EXISTS "SocialConnections: strict tenant isolation" ON public.social_connections;
CREATE POLICY "SocialConnections: strict tenant isolation" ON public.social_connections FOR ALL TO authenticated USING (tenant_id=private.current_tenant_id() OR private.is_super_admin()) WITH CHECK (tenant_id=private.current_tenant_id() OR private.is_super_admin());
DROP POLICY IF EXISTS "Posts: strict tenant isolation" ON public.posts;
CREATE POLICY "Posts: strict tenant isolation" ON public.posts FOR ALL TO authenticated USING (tenant_id=private.current_tenant_id() OR private.is_super_admin()) WITH CHECK (tenant_id=private.current_tenant_id() OR private.is_super_admin());
DROP POLICY IF EXISTS "PostLogs: strict tenant isolation" ON public.post_logs;
CREATE POLICY "PostLogs: strict tenant isolation" ON public.post_logs FOR ALL TO authenticated USING (tenant_id=private.current_tenant_id() OR private.is_super_admin()) WITH CHECK (tenant_id=private.current_tenant_id() OR private.is_super_admin());
DROP POLICY IF EXISTS "MediaAssets: strict tenant isolation" ON public.media_assets;
CREATE POLICY "MediaAssets: strict tenant isolation" ON public.media_assets FOR ALL TO authenticated USING (tenant_id=private.current_tenant_id() OR private.is_super_admin()) WITH CHECK (tenant_id=private.current_tenant_id() OR private.is_super_admin());
DROP POLICY IF EXISTS "GoogleReviews: strict tenant isolation" ON public.google_reviews;
CREATE POLICY "GoogleReviews: strict tenant isolation" ON public.google_reviews FOR ALL TO authenticated USING (tenant_id=private.current_tenant_id() OR private.is_super_admin()) WITH CHECK (tenant_id=private.current_tenant_id() OR private.is_super_admin());
DROP POLICY IF EXISTS "AutoResponderRules: strict tenant isolation" ON public.auto_responder_rules;
CREATE POLICY "AutoResponderRules: strict tenant isolation" ON public.auto_responder_rules FOR ALL TO authenticated USING (tenant_id=private.current_tenant_id() OR private.is_super_admin()) WITH CHECK (tenant_id=private.current_tenant_id() OR private.is_super_admin());
DROP POLICY IF EXISTS "TriggerLogs: strict tenant isolation" ON public.live_comment_trigger_logs;
CREATE POLICY "TriggerLogs: strict tenant isolation" ON public.live_comment_trigger_logs FOR ALL TO authenticated USING (tenant_id=private.current_tenant_id() OR private.is_super_admin()) WITH CHECK (tenant_id=private.current_tenant_id() OR private.is_super_admin());
DROP POLICY IF EXISTS "AiCreditLogs: tenant read" ON public.ai_credit_logs;
CREATE POLICY "AiCreditLogs: tenant read" ON public.ai_credit_logs FOR SELECT TO authenticated USING (tenant_id=private.current_tenant_id() OR private.is_super_admin());
DROP POLICY IF EXISTS "Publishing jobs tenant read" ON public.publishing_jobs;
CREATE POLICY "Publishing jobs tenant read" ON public.publishing_jobs FOR SELECT TO authenticated USING (tenant_id=private.current_tenant_id() OR private.is_super_admin());
