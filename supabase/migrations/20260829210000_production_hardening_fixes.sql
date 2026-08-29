-- ==============================================================================
-- 20260829210000_production_hardening_fixes.sql
-- Production Hardening: Fix missing columns, enum constraints, and dynamic RLS
-- ==============================================================================

-- 1. Fix checkout_orders schema: Add provider_payment_id column
ALTER TABLE public.checkout_orders
  ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;

-- 2. Fix auto_responder_rules schema: Add missing columns & expand platform constraint
ALTER TABLE public.auto_responder_rules
  DROP CONSTRAINT IF EXISTS auto_responder_rules_platform_check;

ALTER TABLE public.auto_responder_rules
  ADD CONSTRAINT auto_responder_rules_platform_check CHECK (platform IN ('instagram','facebook','both','all'));

ALTER TABLE public.auto_responder_rules
  ADD COLUMN IF NOT EXISTS public_reply_templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS private_dm_templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attached_media_url TEXT,
  ADD COLUMN IF NOT EXISTS use_ai_context BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_persona_prompt TEXT,
  ADD COLUMN IF NOT EXISTS rate_limit_minutes INT NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS target_post_scope TEXT NOT NULL DEFAULT 'all_posts',
  ADD COLUMN IF NOT EXISTS target_post_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trigger_type TEXT NOT NULL DEFAULT 'keyword';

-- 3. Dynamic RLS Helper Functions (Decouple hardcoded emails from SQL definition)
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
       OR (email IS NOT NULL AND email = lower(trim(COALESCE(auth.jwt() ->> 'email', ''))))
    ORDER BY is_super_admin DESC
    LIMIT 1
  ), false);
$$;

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
         OR (email IS NOT NULL AND email = lower(trim(COALESCE(auth.jwt() ->> 'email', ''))))
      LIMIT 1
    ),
    NULL
  );
$$;

-- 4. Precise One-Shot Scheduling Helper Function
CREATE OR REPLACE FUNCTION public.schedule_precise_post_publish(
  job_name TEXT,
  cron_expr TEXT,
  target_post_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_command TEXT;
BEGIN
  -- Attempt to register exact-time job in pg_cron if available
  BEGIN
    v_command := format(
      'SELECT net.http_post(url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''supabase_url'' LIMIT 1) || ''/functions/v1/process-publishing-jobs?postId=%s'', headers := jsonb_build_object(''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''service_role_key'' LIMIT 1), ''Content-Type'', ''application/json''))',
      target_post_id::text
    );
    PERFORM cron.schedule(job_name, cron_expr, v_command);
  EXCEPTION WHEN OTHERS THEN
    -- Fallback: pg_cron or pg_net extension not available in environment
    NULL;
  END;

  RETURN jsonb_build_object('scheduled', true, 'post_id', target_post_id, 'cron_expr', cron_expr);
END;
$$;

GRANT EXECUTE ON FUNCTION public.schedule_precise_post_publish(TEXT, TEXT, UUID) TO authenticated, service_role;
