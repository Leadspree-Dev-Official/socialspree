-- ==============================================================================
-- 20260830180000_feature_waitlist.sql
-- Persist "notify me" signups.
--
-- The Google Reviews waitlist wrote to localStorage only, so every signup was
-- lost the moment the customer cleared their browser — and no one on the team
-- could ever see who had asked for the feature. These are demand signals for
-- an unbuilt module; they belong in the database.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.feature_waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature     TEXT NOT NULL,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, feature, email)
);

CREATE INDEX IF NOT EXISTS idx_feature_waitlist_feature
  ON public.feature_waitlist (feature, created_at DESC);

ALTER TABLE public.feature_waitlist ENABLE ROW LEVEL SECURITY;

-- A member can register interest for their own workspace.
DROP POLICY IF EXISTS "Tenant joins waitlist" ON public.feature_waitlist;
CREATE POLICY "Tenant joins waitlist"
  ON public.feature_waitlist FOR INSERT TO authenticated
  WITH CHECK (tenant_id = private.current_tenant_id());

-- And can see what their own workspace has registered.
DROP POLICY IF EXISTS "Tenant reads own waitlist" ON public.feature_waitlist;
CREATE POLICY "Tenant reads own waitlist"
  ON public.feature_waitlist FOR SELECT TO authenticated
  USING (tenant_id = private.current_tenant_id() OR private.is_super_admin());
