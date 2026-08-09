-- Migration: Provider Isolation, Provider Locking & Audit Governance
-- Date: 2026-08-09

-- 1. Add provider locking column to social_connections
ALTER TABLE public.social_connections
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'zernio';

-- Backfill provider on social_connections based on channel_account_id
UPDATE public.social_connections
SET provider = 'composio'
WHERE channel_account_id LIKE 'composio_%' OR channel_account_id LIKE 'conn_%';

-- 2. Add provider locking column to posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS provider TEXT;

-- 3. Add provider locking column to publishing_jobs
ALTER TABLE public.publishing_jobs
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'zernio';

-- 4. Create Provider Change Audit Logs table
CREATE TABLE IF NOT EXISTS public.provider_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_id TEXT,
  previous_provider TEXT,
  new_provider TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on provider_audit_logs
ALTER TABLE public.provider_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view provider audit logs"
  ON public.provider_audit_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub')
    ) OR (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') AND is_super_admin = true)
    )
  );

-- 5. Trigger function to prevent non-super-admins from mutating dispatch_engine on public.tenants
CREATE OR REPLACE FUNCTION public.enforce_admin_provider_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  calling_user_id TEXT := auth.jwt() ->> 'sub';
  is_admin BOOLEAN := false;
BEGIN
  IF OLD.dispatch_engine IS DISTINCT FROM NEW.dispatch_engine THEN
    IF calling_user_id IS NOT NULL THEN
      SELECT is_super_admin INTO is_admin
      FROM public.profiles
      WHERE id = calling_user_id;

      IF NOT COALESCE(is_admin, false) THEN
        RAISE EXCEPTION 'Only authorized administrators can modify the tenant dispatch provider assignment.';
      END IF;
    END IF;

    -- Record audit log event for provider change
    INSERT INTO public.provider_audit_logs (
      tenant_id, actor_id, previous_provider, new_provider
    ) VALUES (
      NEW.id, calling_user_id, OLD.dispatch_engine, NEW.dispatch_engine
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_admin_provider_assignment ON public.tenants;
CREATE TRIGGER trg_enforce_admin_provider_assignment
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_admin_provider_assignment();
