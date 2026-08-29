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
