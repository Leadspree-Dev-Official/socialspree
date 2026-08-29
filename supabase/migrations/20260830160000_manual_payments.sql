-- ==============================================================================
-- 20260830160000_manual_payments.sql
-- Manual payment rail, and one shared entitlement grant for every payment source.
--
-- Razorpay activation is still pending, so revenue arrives by bank transfer or
-- UPI arranged over WhatsApp. That path has to be as auditable as the automated
-- one, and — critically — has to grant entitlements through the *same* code, so
-- switching Razorpay on later is configuration rather than a second billing
-- implementation to keep in sync.
-- ==============================================================================

-- ---------------------------------------------------------------------------
-- 1. Orders gain a payment method, a human reference, and an approval trail.
-- ---------------------------------------------------------------------------
ALTER TABLE public.checkout_orders
  ADD COLUMN IF NOT EXISTS payment_method    TEXT NOT NULL DEFAULT 'razorpay',
  ADD COLUMN IF NOT EXISTS reference         TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle     TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS manual_reference  TEXT,
  ADD COLUMN IF NOT EXISTS manual_note       TEXT,
  ADD COLUMN IF NOT EXISTS approved_by       UUID,
  ADD COLUMN IF NOT EXISTS approved_at       TIMESTAMPTZ;

ALTER TABLE public.checkout_orders
  DROP CONSTRAINT IF EXISTS checkout_orders_status_check;

ALTER TABLE public.checkout_orders
  ADD CONSTRAINT checkout_orders_status_check
  CHECK (status IN ('created', 'awaiting_payment', 'paid', 'failed', 'expired', 'cancelled'));

ALTER TABLE public.checkout_orders
  DROP CONSTRAINT IF EXISTS checkout_orders_payment_method_check;

ALTER TABLE public.checkout_orders
  ADD CONSTRAINT checkout_orders_payment_method_check
  CHECK (payment_method IN ('razorpay', 'manual'));

-- Human-quotable reference. The customer says "SS-2026-0042" on WhatsApp and
-- the operator finds the order without asking for a UUID.
CREATE SEQUENCE IF NOT EXISTS public.checkout_reference_seq START 1;

CREATE OR REPLACE FUNCTION public.next_checkout_reference()
RETURNS TEXT
LANGUAGE SQL
VOLATILE
AS $$
  SELECT 'SS-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.checkout_reference_seq')::text, 4, '0');
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_orders_reference
  ON public.checkout_orders (reference) WHERE reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_checkout_orders_pending
  ON public.checkout_orders (status, created_at DESC)
  WHERE status = 'awaiting_payment';

-- ---------------------------------------------------------------------------
-- 2. The single entitlement grant.
--    Both the Razorpay webhook and manual approval call this. It is idempotent:
--    only a not-yet-paid order transitions, so a redelivered webhook or a
--    double-clicked approve button cannot upgrade a tenant twice.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_plan_entitlement(
  target_order_id UUID,
  payment_reference TEXT DEFAULT NULL,
  approver UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_order   public.checkout_orders%ROWTYPE;
  v_plan    public.plans%ROWTYPE;
  v_tier    TEXT;
  v_days    INT;
BEGIN
  -- Claim the order. The status predicate is the idempotency guard.
  UPDATE public.checkout_orders
  SET status           = 'paid',
      paid_at          = now(),
      manual_reference = COALESCE(payment_reference, manual_reference),
      approved_by      = COALESCE(approver, approved_by),
      approved_at      = CASE WHEN approver IS NOT NULL THEN now() ELSE approved_at END
  WHERE id = target_order_id
    AND status IN ('created', 'awaiting_payment')
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'order_not_claimable');
  END IF;

  SELECT * INTO v_plan FROM public.plans WHERE id = v_order.plan_id;
  IF v_plan.id IS NULL THEN
    RAISE EXCEPTION 'Plan % referenced by order % does not exist', v_order.plan_id, target_order_id;
  END IF;

  v_tier := COALESCE(v_plan.tier_code, 'pro');
  IF v_tier NOT IN ('free', 'pro', 'agency') THEN
    RAISE EXCEPTION 'Plan % has an invalid tier_code: %', v_plan.id, v_tier;
  END IF;

  v_days := CASE WHEN v_order.billing_cycle = 'yearly' THEN 365 ELSE 30 END;

  IF v_order.tenant_id IS NOT NULL THEN
    UPDATE public.tenants
    SET plan_id             = v_order.plan_id,
        payment_status      = 'paid',
        tier_plan           = v_tier,
        allocated_api_slots = COALESCE(v_plan.allocated_api_slots, 2),
        max_social_accounts = COALESCE(v_plan.max_social_accounts, 10),
        ai_credits          = COALESCE(v_plan.ai_credits, 1000),
        billing_cycle       = COALESCE(v_order.billing_cycle, 'monthly'),
        next_renewal_date   = now() + (v_days || ' days')::interval,
        updated_at          = now()
    WHERE id = v_order.tenant_id;
  END IF;

  RETURN jsonb_build_object(
    'granted', true,
    'order_id', v_order.id,
    'reference', v_order.reference,
    'tenant_id', v_order.tenant_id,
    'plan_id', v_order.plan_id,
    'tier', v_tier,
    'method', v_order.payment_method
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_plan_entitlement(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_plan_entitlement(UUID, TEXT, UUID) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Visibility. A customer sees their own orders; a super admin sees all.
--    Neither can write — orders are created and settled by edge functions.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Tenant reads own checkout orders" ON public.checkout_orders;
CREATE POLICY "Tenant reads own checkout orders"
  ON public.checkout_orders FOR SELECT TO authenticated
  USING (
    tenant_id = private.current_tenant_id()
    OR private.is_super_admin()
  );
