import { admin, cors, json } from '../_shared/server.ts';
function hex(bytes: ArrayBuffer) { return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join(''); }
function equal(a: string, b: string) { if (a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0; }
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const raw = await req.text();
  try {
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) return json({ error: 'Webhook is not configured' }, 503);
    const signature = req.headers.get('x-razorpay-signature') ?? '';
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)));
    if (!equal(signature, expected)) return json({ error: 'Invalid signature' }, 401);
    const payload = JSON.parse(raw);
    const eventId = req.headers.get('x-razorpay-event-id') || `${payload.event}:${payload.payload?.payment?.entity?.id ?? crypto.randomUUID()}`;
    const db = admin();
    const { error: eventError } = await db.from('payment_events').insert({ provider: 'razorpay', provider_event_id: eventId, event_type: payload.event, payload });
    if (eventError?.code === '23505') return json({ duplicate: true });
    if (eventError) throw eventError;
    if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
      const orderId = payload.payload?.payment?.entity?.order_id ?? payload.payload?.order?.entity?.id;
      const { data: order } = await db.from('checkout_orders').select('*,plans(*)').eq('provider_order_id', orderId).single();
      if (order && order.status !== 'paid') {
        await db.from('checkout_orders').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', order.id).eq('status', 'created');
        if (order.tenant_id) await db.from('tenants').update({ plan_id: order.plan_id, payment_status: 'paid', tier_plan: order.plans?.name ?? 'pro', allocated_api_slots: order.plans?.allocated_api_slots, max_social_accounts: order.plans?.max_social_accounts, ai_credits: order.plans?.ai_credits }).eq('id', order.tenant_id);
      }
    }
    await db.from('payment_events').update({ processed_at: new Date().toISOString() }).eq('provider_event_id', eventId);
    return json({ received: true });
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'Webhook failed' }, 400); }
});
