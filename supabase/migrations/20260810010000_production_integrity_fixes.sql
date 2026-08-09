-- Production integrity fixes
-- 1) Give plans an authoritative entitlement tier so payment webhooks never
--    derive a constrained tier from a display name.
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS tier_code TEXT NOT NULL DEFAULT 'pro';

ALTER TABLE public.plans
  DROP CONSTRAINT IF EXISTS plans_tier_code_check;
ALTER TABLE public.plans
  ADD CONSTRAINT plans_tier_code_check CHECK (tier_code IN ('free','pro','agency'));

UPDATE public.plans
SET tier_code = CASE
  WHEN id = 'plan-enterprise' THEN 'agency'
  WHEN id IN ('plan-starter','plan-pro') THEN 'pro'
  ELSE COALESCE(NULLIF(tier_code, ''), 'pro')
END
WHERE tier_code IS NULL OR id IN ('plan-starter','plan-pro','plan-enterprise');

-- 2) Persist the billing cycle used to create a checkout order.
ALTER TABLE public.checkout_orders
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE public.checkout_orders
  DROP CONSTRAINT IF EXISTS checkout_orders_billing_cycle_check;
ALTER TABLE public.checkout_orders
  ADD CONSTRAINT checkout_orders_billing_cycle_check CHECK (billing_cycle IN ('monthly','yearly'));

-- 3) AI credits are reserved atomically before a provider call. If the provider
--    fails, credits are refunded atomically. This prevents concurrent requests
--    from spending provider money before credits are secured.
ALTER TABLE public.ai_credit_logs
  DROP CONSTRAINT IF EXISTS ai_credit_logs_action_check;
ALTER TABLE public.ai_credit_logs
  ADD CONSTRAINT ai_credit_logs_action_check CHECK (
    action IN ('text_generation','hashtag_generation','superadmin_topup','plan_grant','provider_refund')
  );

CREATE OR REPLACE FUNCTION public.reserve_ai_credits(
  target_tenant UUID,
  credit_cost INT,
  log_action TEXT,
  log_description TEXT
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  remaining INT;
  tenant_name TEXT;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;
  IF credit_cost <= 0 THEN RAISE EXCEPTION 'invalid credit cost'; END IF;

  UPDATE public.tenants
  SET ai_credits = ai_credits - credit_cost
  WHERE id = target_tenant AND ai_credits >= credit_cost
  RETURNING ai_credits, name INTO remaining, tenant_name;

  IF remaining IS NULL THEN RAISE EXCEPTION 'insufficient AI credits'; END IF;

  INSERT INTO public.ai_credit_logs
    (tenant_id, tenant_name, action, credits_amount, remaining_balance, description)
  VALUES
    (target_tenant, tenant_name, log_action, -credit_cost, remaining, log_description);

  RETURN remaining;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_ai_credits(
  target_tenant UUID,
  credit_amount INT,
  log_description TEXT
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  remaining INT;
  tenant_name TEXT;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;
  IF credit_amount <= 0 THEN RAISE EXCEPTION 'invalid refund amount'; END IF;

  UPDATE public.tenants
  SET ai_credits = ai_credits + credit_amount
  WHERE id = target_tenant
  RETURNING ai_credits, name INTO remaining, tenant_name;

  IF remaining IS NULL THEN RAISE EXCEPTION 'tenant not found'; END IF;

  INSERT INTO public.ai_credit_logs
    (tenant_id, tenant_name, action, credits_amount, remaining_balance, description)
  VALUES
    (target_tenant, tenant_name, 'provider_refund', credit_amount, remaining, log_description);

  RETURN remaining;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_ai_credits(UUID,INT,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_ai_credits(UUID,INT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_credits(UUID,INT,TEXT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_ai_credits(UUID,INT,TEXT) TO service_role;

-- 4) OAuth state consumption returns the user that created the state so the
--    callback can explicitly bind the exchange to the initiating account.
DROP FUNCTION IF EXISTS public.consume_oauth_state(TEXT);
CREATE OR REPLACE FUNCTION public.consume_oauth_state(target_hash TEXT)
RETURNS TABLE(tenant_id UUID, provider TEXT, redirect_uri TEXT, code_verifier TEXT, created_by UUID)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = private AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;
  RETURN QUERY
  DELETE FROM private.oauth_states s
  WHERE s.state_hash = target_hash AND s.expires_at > now()
  RETURNING s.tenant_id, s.provider, s.redirect_uri, s.code_verifier, s.created_by;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_oauth_state(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_oauth_state(TEXT) TO service_role;

-- 5) Add an index used by the publishing worker when recovering abandoned jobs.
CREATE INDEX IF NOT EXISTS publishing_jobs_processing_lock_idx
  ON public.publishing_jobs(status, locked_at);
