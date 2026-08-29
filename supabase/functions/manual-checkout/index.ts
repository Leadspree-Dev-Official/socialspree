/**
 * Manual payment rail.
 *
 * Razorpay activation is still pending, so customers pay by UPI or bank
 * transfer arranged over WhatsApp. This turns that into a real, auditable
 * flow rather than an unrecorded conversation:
 *
 *   create   customer picks a plan -> order with a quotable reference
 *   pending  operator sees every unpaid order in one queue
 *   approve  operator confirms receipt -> grant_plan_entitlement() provisions
 *
 * Approval calls the same entitlement function as the Razorpay webhook, so the
 * automated path inherits logic already proven in production.
 */
import { actor, cors, json } from '../_shared/server.ts';

const SUPPORTED_CURRENCIES = ['USD', 'INR', 'GBP'];

function priceFor(plan: any, billingCycle: string): number | null {
  const monthly = Number(plan.price_monthly);
  if (!Number.isFinite(monthly) || monthly <= 0) return null;
  // Yearly carries the same 20% discount the checkout UI advertises.
  const totalMajor = billingCycle === 'yearly'
    ? Math.round(monthly * 12 * 0.8 * 100) / 100
    : monthly;
  return Math.round(totalMajor * 100);
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });

  try {
    const { db, user, profile } = await actor(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'create');

    // ---------------------------------------------------------------- create
    if (action === 'create') {
      if (!profile.tenant_id) return json({ error: 'No tenant assigned' }, 403, req);

      const planId = String(body.planId || '');
      if (!planId) return json({ error: 'Plan is required' }, 400, req);

      const billingCycle = body.billingCycle === 'yearly' ? 'yearly' : 'monthly';

      const { data: plan, error: planError } = await db
        .from('plans').select('*').eq('id', planId).single();
      if (planError || !plan) return json({ error: 'Plan not found' }, 404, req);

      const amountMinor = priceFor(plan, billingCycle);
      if (amountMinor === null) return json({ error: 'Invalid plan price' }, 422, req);

      const currency = String(body.currency || plan.currency || 'INR').toUpperCase();
      if (!SUPPORTED_CURRENCIES.includes(currency)) {
        return json({ error: 'Unsupported plan currency' }, 422, req);
      }

      // One open order per tenant+plan; re-asking should not spawn duplicates
      // the operator then has to reconcile by hand.
      const { data: existing } = await db
        .from('checkout_orders')
        .select('id, reference, amount_minor, currency, billing_cycle')
        .eq('tenant_id', profile.tenant_id)
        .eq('plan_id', planId)
        .eq('status', 'awaiting_payment')
        .maybeSingle();

      if (existing) {
        return json({
          orderId: existing.id,
          reference: existing.reference,
          amountMinor: existing.amount_minor,
          currency: existing.currency,
          billingCycle: existing.billing_cycle,
          planName: plan.name,
          reused: true
        }, 200, req);
      }

      const { data: reference, error: refError } = await db.rpc('next_checkout_reference');
      if (refError) throw refError;

      const { data: order, error: orderError } = await db
        .from('checkout_orders')
        .insert({
          tenant_id: profile.tenant_id,
          user_id: user.id,
          plan_id: planId,
          amount_minor: amountMinor,
          currency,
          billing_cycle: billingCycle,
          payment_method: 'manual',
          status: 'awaiting_payment',
          reference
        })
        .select('*')
        .single();
      if (orderError) throw orderError;

      return json({
        orderId: order.id,
        reference: order.reference,
        amountMinor: order.amount_minor,
        currency: order.currency,
        billingCycle: order.billing_cycle,
        planName: plan.name,
        reused: false
      }, 200, req);
    }

    // --------------------------------------------------------------- pending
    if (action === 'pending') {
      if (!profile.is_super_admin) return json({ error: 'Forbidden' }, 403, req);

      const { data: orders, error } = await db
        .from('checkout_orders')
        .select('*,plans(name,tier_code),tenants(name,owner_email)')
        .eq('payment_method', 'manual')
        .eq('status', 'awaiting_payment')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;

      return json({ orders: orders ?? [] }, 200, req);
    }

    // --------------------------------------------------------------- approve
    if (action === 'approve') {
      if (!profile.is_super_admin) return json({ error: 'Forbidden' }, 403, req);

      const orderId = String(body.orderId || '');
      if (!orderId) return json({ error: 'Order is required' }, 400, req);

      const manualReference = typeof body.manualReference === 'string'
        ? body.manualReference.trim()
        : '';
      if (!manualReference) {
        return json({ error: 'Record the bank or UPI transaction reference before approving' }, 422, req);
      }

      const { data: result, error: grantError } = await db.rpc('grant_plan_entitlement', {
        target_order_id: orderId,
        payment_reference: manualReference,
        approver: user.id
      });
      if (grantError) throw grantError;

      if (!result?.granted) {
        return json({
          error: result?.reason === 'order_not_claimable'
            ? 'That order is not awaiting payment — it may already be approved.'
            : 'Entitlement could not be granted.'
        }, 409, req);
      }

      if (typeof body.note === 'string' && body.note.trim()) {
        await db.from('checkout_orders')
          .update({ manual_note: body.note.trim() })
          .eq('id', orderId);
      }

      return json({ approved: true, ...result }, 200, req);
    }

    // ---------------------------------------------------------------- cancel
    if (action === 'cancel') {
      if (!profile.is_super_admin) return json({ error: 'Forbidden' }, 403, req);

      const orderId = String(body.orderId || '');
      if (!orderId) return json({ error: 'Order is required' }, 400, req);

      const { data: cancelled, error } = await db
        .from('checkout_orders')
        .update({ status: 'cancelled', manual_note: String(body.note || '').trim() || null })
        .eq('id', orderId)
        .eq('status', 'awaiting_payment')
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!cancelled) return json({ error: 'Order is no longer awaiting payment' }, 409, req);

      return json({ cancelled: true }, 200, req);
    }

    return json({ error: 'Unsupported action' }, 400, req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request failed' }, 400, req);
  }
});
