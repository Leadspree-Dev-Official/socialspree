import { actor, cors, json } from '../_shared/server.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { db, user, profile } = await actor(req);
    const body = await req.json().catch(() => ({}));
    const planId = String(body.planId || '');
    const billingCycle = body.billingCycle === 'yearly' ? 'yearly' : 'monthly';
    if (!planId) return json({ error: 'Plan is required' }, 400);

    const { data: plan, error } = await db.from('plans').select('*').eq('id', planId).single();
    if (error || !plan) return json({ error: 'Plan not found' }, 404);
    const monthly = Number(plan.price_monthly);
    if (!Number.isFinite(monthly) || monthly <= 0) return json({ error: 'Invalid plan price' }, 422);

    const totalMajor = billingCycle === 'yearly' ? Math.round(monthly * 12 * 0.8 * 100) / 100 : monthly;
    const amount = Math.round(totalMajor * 100);
    const currency = String(plan.currency || 'USD').toUpperCase();
    if (!['USD', 'INR', 'GBP'].includes(currency)) return json({ error: 'Unsupported plan currency' }, 422);

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) return json({ error: 'Payment provider is not configured' }, 503);

    const provider = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency,
        receipt: crypto.randomUUID(),
        notes: { user_id: user.id, tenant_id: profile.tenant_id ?? '', plan_id: plan.id, billing_cycle: billingCycle }
      })
    });
    if (!provider.ok) return json({ error: 'Unable to create payment order' }, 502);
    const order = await provider.json();

    const { data: local, error: localError } = await db.from('checkout_orders').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      plan_id: plan.id,
      provider_order_id: order.id,
      amount_minor: amount,
      currency,
      billing_cycle: billingCycle
    }).select('id').single();
    if (localError) throw localError;

    return json({ checkoutId: local.id, orderId: order.id, keyId, amount, currency, planName: plan.name, billingCycle });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request failed' }, 500);
  }
});
