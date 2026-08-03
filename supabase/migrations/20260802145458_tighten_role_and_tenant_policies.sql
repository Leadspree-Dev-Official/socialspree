CREATE OR REPLACE FUNCTION private.is_tenant_admin(target_tenant UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND tenant_id = target_tenant AND role IN ('admin','super_admin')
  ) OR private.is_super_admin();
$$;
REVOKE ALL ON FUNCTION private.is_tenant_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_tenant_admin(UUID) TO authenticated;

-- Profiles are server-managed. Users may read their row, but membership and role
-- changes go through invite-member/admin workflows only.
DROP POLICY IF EXISTS "Profiles: Members insert own profile row" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Members update own non-privileged profile row" ON public.profiles;

-- Tenant metadata and API-slot allocation are administrative configuration.
DROP POLICY IF EXISTS "ApiSlots: tenant isolation" ON public.api_allocation_slots;
CREATE POLICY "ApiSlots: tenant read" ON public.api_allocation_slots FOR SELECT TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) OR private.is_super_admin());
CREATE POLICY "ApiSlots: tenant admin mutation" ON public.api_allocation_slots FOR ALL TO authenticated
USING (private.is_tenant_admin(tenant_id)) WITH CHECK (private.is_tenant_admin(tenant_id));

-- Members may create content and operate tenant-owned application data, but they
-- cannot cross tenant boundaries. Sensitive tenant configuration remains admin-only.
DROP POLICY IF EXISTS "Tenants: Members view own tenant metadata" ON public.tenants;
CREATE POLICY "Tenants: Members view own tenant metadata" ON public.tenants FOR SELECT TO authenticated
USING (id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) OR private.is_super_admin());

-- Prevent direct browser mutation of financial/credit ledgers. Edge Functions use service_role.
DROP POLICY IF EXISTS "AiCreditLogs: strict tenant isolation" ON public.ai_credit_logs;
CREATE POLICY "AiCreditLogs: tenant read" ON public.ai_credit_logs FOR SELECT TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) OR private.is_super_admin());

REVOKE INSERT, UPDATE, DELETE ON public.ai_credit_logs, public.checkout_orders,
  public.payment_events, public.publishing_jobs FROM authenticated;
