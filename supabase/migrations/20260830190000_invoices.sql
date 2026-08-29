-- ==============================================================================
-- 20260830190000_invoices.sql
-- Sequential invoices for settled orders.
--
-- B2B customers need an invoice for their own accounting, and Indian B2B
-- invoicing must carry the supplier's GST number and a sequential, gapless
-- invoice number. Neither existed: an order simply flipped to paid.
--
-- Issued from grant_plan_entitlement so every payment source — manual approval
-- today, Razorpay once activation clears — produces one automatically.
-- ==============================================================================

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1;

CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL UNIQUE REFERENCES public.checkout_orders(id) ON DELETE RESTRICT,
  tenant_id       UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  invoice_number  TEXT NOT NULL UNIQUE,

  -- Snapshot the commercial facts. A later plan rename or price change must
  -- never alter an invoice that has already been issued.
  plan_name       TEXT NOT NULL,
  billing_cycle   TEXT NOT NULL,
  amount_minor    INT  NOT NULL,
  currency        TEXT NOT NULL,
  payment_method  TEXT NOT NULL,
  payment_reference TEXT,

  bill_to_name    TEXT,
  bill_to_email   TEXT,

  supplier_name   TEXT,
  supplier_gst    TEXT,

  issued_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices (tenant_id, issued_at DESC);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant reads own invoices" ON public.invoices;
CREATE POLICY "Tenant reads own invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (tenant_id = private.current_tenant_id() OR private.is_super_admin());

-- Supplier details live in settings so finance can change them without a deploy.
INSERT INTO public.system_settings (key, value)
VALUES
  ('billing_entity_name', 'SocialSpree'),
  ('billing_gst_number', '')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS TEXT
LANGUAGE SQL
VOLATILE
AS $$
  SELECT 'INV-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.invoice_number_seq')::text, 5, '0');
$$;

-- ---------------------------------------------------------------------------
-- Issue an invoice as part of granting the entitlement.
-- Replaces the function defined in 20260830160000 so both stay in one place.
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
  v_invoice TEXT;
  v_tenant  public.tenants%ROWTYPE;
BEGIN
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
    WHERE id = v_order.tenant_id
    RETURNING * INTO v_tenant;
  END IF;

  -- One invoice per order; a retried webhook must not consume a number.
  SELECT invoice_number INTO v_invoice FROM public.invoices WHERE order_id = v_order.id;

  IF v_invoice IS NULL THEN
    v_invoice := public.next_invoice_number();
    INSERT INTO public.invoices (
      order_id, tenant_id, invoice_number, plan_name, billing_cycle,
      amount_minor, currency, payment_method, payment_reference,
      bill_to_name, bill_to_email, supplier_name, supplier_gst
    ) VALUES (
      v_order.id, v_order.tenant_id, v_invoice, v_plan.name,
      COALESCE(v_order.billing_cycle, 'monthly'),
      v_order.amount_minor, v_order.currency, v_order.payment_method,
      COALESCE(payment_reference, v_order.manual_reference, v_order.provider_payment_id),
      v_tenant.name, v_tenant.owner_email,
      (SELECT value FROM public.system_settings WHERE key = 'billing_entity_name'),
      (SELECT value FROM public.system_settings WHERE key = 'billing_gst_number')
    )
    ON CONFLICT (order_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'granted', true,
    'order_id', v_order.id,
    'reference', v_order.reference,
    'invoice_number', v_invoice,
    'tenant_id', v_order.tenant_id,
    'plan_id', v_order.plan_id,
    'tier', v_tier,
    'method', v_order.payment_method
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_plan_entitlement(UUID, TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_plan_entitlement(UUID, TEXT, UUID) TO service_role;
