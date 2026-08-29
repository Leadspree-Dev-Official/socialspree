import { admin, cors, json } from '../_shared/server.ts';

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  const raw = await req.text();
  try {
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) return json({ error: 'Webhook is not configured' }, 503, req);
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)));
    if (!equal(signature, expected)) return json({ error: 'Invalid signature' }, 401, req);

    const payload = JSON.parse(raw);
    const eventId = req.headers.get('x-razorpay-event-id') || `${payload.event}:${payload.payload?.payment?.entity?.id ?? crypto.randomUUID()}`;
    const db = admin();
    const { error: eventError } = await db.from('payment_events').insert({ provider: 'razorpay', provider_event_id: eventId, event_type: payload.event, payload });
    if (eventError?.code === '23505') {
      // Duplicate delivery is normally safe. Reconciliation is handled below by
      // the order state, so the endpoint is idempotent without double-granting.
      return json({ duplicate: true }, 200, req);
    }
    if (eventError) throw eventError;

    if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
      const orderId = payload.payload?.payment?.entity?.order_id ?? payload.payload?.order?.entity?.id;
      if (!orderId) return json({ error: 'Payment event has no order id' }, 422, req);

      const { data: order, error: orderError } = await db
        .from('checkout_orders')
        .select('*,plans(*)')
        .eq('provider_order_id', orderId)
        .single();
      if (orderError || !order) return json({ error: 'Checkout order not found' }, 404, req);

      // Amount and Currency Verification
      const paymentEntity = payload.payload?.payment?.entity;
      const expectedAmount = Number(order.amount_minor ?? order.amount_in_cents ?? 0);
      if (paymentEntity?.amount && expectedAmount > 0) {
        if (Number(paymentEntity.amount) < expectedAmount) {
          return json({ error: 'Payment amount mismatch' }, 422, req);
        }
      }
      if (paymentEntity?.currency && order.currency) {
        if (String(paymentEntity.currency).toUpperCase() !== String(order.currency).toUpperCase()) {
          return json({ error: 'Payment currency mismatch' }, 422, req);
        }
      }

      const plan = order.plans;
      const tier = plan?.tier_code ?? 'pro';
      if (!['free', 'pro', 'agency'].includes(tier)) return json({ error: 'Invalid plan entitlement' }, 422, req);

      // Only the created -> paid transition grants the entitlement. Repeated
      // webhook deliveries cannot grant credits twice.
      const { data: transitioned, error: transitionError } = await db
        .from('checkout_orders')
        .update({ 
          status: 'paid', 
          paid_at: new Date().toISOString(),
          provider_payment_id: paymentEntity?.id || null 
        })
        .eq('id', order.id)
        .eq('status', 'created')
        .select('id')
        .maybeSingle();
      if (transitionError) throw transitionError;

      if (transitioned && order.tenant_id) {
        const renewalDays = order.billing_cycle === 'yearly' ? 365 : 30;
        const nextRenewal = new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000).toISOString();

        const { error: tenantError } = await db.from('tenants').update({
          plan_id: order.plan_id,
          payment_status: 'paid',
          tier_plan: tier,
          allocated_api_slots: plan?.allocated_api_slots ?? 2,
          max_social_accounts: plan?.max_social_accounts ?? 10,
          ai_credits: plan?.ai_credits ?? 1000,
          billing_cycle: order.billing_cycle ?? 'monthly',
          next_renewal_date: nextRenewal,
          updated_at: new Date().toISOString()
        }).eq('id', order.tenant_id);
        if (tenantError) throw tenantError;
      }
    }

    await db.from('payment_events').update({ processed_at: new Date().toISOString() }).eq('provider_event_id', eventId);
    return json({ received: true }, 200, req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Webhook failed' }, 500, req);
  }
});
