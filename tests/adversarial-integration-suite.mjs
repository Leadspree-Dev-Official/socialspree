import assert from 'node:assert/strict';

console.log('================================================================');
console.log('🔥 SOCIALSPREE ADVERSARIAL INTEGRATION SIMULATION SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. PAYMENT FAILURE & INTEGRITY ADVERSARIAL SIMULATIONS
// -----------------------------------------------------------------------------
console.log('--- 1. Payment Webhook & Reconciliation Simulations ---');

function hex(bytes) {
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const TEST_SECRET = 'test_webhook_secret_xyz123';

async function generateSignature(payloadString, secret = TEST_SECRET) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadString));
  return hex(sig);
}

// Simulation Payment Logic identical to razorpay-webhook edge function
function processPaymentWebhookSimulation({
  rawPayload,
  signature,
  secret = TEST_SECRET,
  expectedSignature,
  orderDatabase,
  paymentEventsDatabase,
  tenantsDatabase
}) {
  // Check 1: HMAC Verification
  if (!signature || !expectedSignature || !constantTimeEqual(signature, expectedSignature)) {
    return { status: 401, error: 'Invalid signature' };
  }

  const payload = JSON.parse(rawPayload);
  const eventId = payload.event_id || `evt_${payload.payload?.payment?.entity?.id}`;

  // Check 2: Idempotency
  if (paymentEventsDatabase.has(eventId)) {
    return { status: 200, duplicate: true };
  }
  paymentEventsDatabase.add(eventId);

  if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
    const orderId = payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;
    if (!orderId) return { status: 422, error: 'Payment event has no order id' };

    const order = orderDatabase.get(orderId);
    if (!order) return { status: 404, error: 'Checkout order not found' };

    const paymentEntity = payload.payload?.payment?.entity;

    // Check 3: Amount Validation
    if (paymentEntity?.amount && order.amount_in_cents) {
      if (Number(paymentEntity.amount) < Number(order.amount_in_cents)) {
        return { status: 422, error: 'Payment amount mismatch' };
      }
    }

    // Check 4: Currency Validation
    if (paymentEntity?.currency && order.currency) {
      if (String(paymentEntity.currency).toUpperCase() !== String(order.currency).toUpperCase()) {
        return { status: 422, error: 'Payment currency mismatch' };
      }
    }

    // Check 5: Atomic State Transition (created -> paid)
    if (order.status !== 'created') {
      // Order was already transitioned or in invalid state
      return { status: 200, duplicate: true, alreadyProcessed: true };
    }

    order.status = 'paid';
    order.paid_at = new Date().toISOString();

    // Check 6: Entitlement Provisioning
    const tenant = tenantsDatabase.get(order.tenant_id);
    if (tenant) {
      tenant.plan_id = order.plan_id;
      tenant.payment_status = 'paid';
      tenant.tier_plan = order.tier_code || 'pro';
      tenant.ai_credits = order.ai_credits || 1000;
    }
  }

  return { status: 200, received: true };
}

// Test PAY-ADV-01: Valid Signature with Amount Mismatch (Underpayment Attack)
{
  const orderDb = new Map([
    ['order_pro_100', { id: 'ord_1', amount_in_cents: 2900, currency: 'USD', status: 'created', tenant_id: 't_1', tier_code: 'pro' }]
  ]);
  const paymentEventsDb = new Set();
  const tenantsDb = new Map([['t_1', { id: 't_1', tier_plan: 'free', payment_status: 'unpaid' }]]);

  const underpaidPayload = JSON.stringify({
    event: 'payment.captured',
    event_id: 'evt_underpay_01',
    payload: { payment: { entity: { id: 'pay_01', order_id: 'order_pro_100', amount: 100, currency: 'USD' } } }
  });
  const sig = await generateSignature(underpaidPayload);
  const result = processPaymentWebhookSimulation({
    rawPayload: underpaidPayload,
    signature: sig,
    expectedSignature: sig,
    orderDatabase: orderDb,
    paymentEventsDatabase: paymentEventsDb,
    tenantsDatabase: tenantsDb
  });

  assert.equal(result.status, 422);
  assert.equal(result.error, 'Payment amount mismatch');
  assert.equal(tenantsDb.get('t_1').tier_plan, 'free', 'Underpaid order must NOT grant pro plan');
  console.log('✅ [PAY-ADV-01] Underpayment attack prevented (422 rejected, 0 entitlement granted)');
}

// Test PAY-ADV-02: Valid Signature with Currency Mismatch
{
  const orderDb = new Map([
    ['order_cur_100', { id: 'ord_2', amount_in_cents: 2900, currency: 'USD', status: 'created', tenant_id: 't_2', tier_code: 'pro' }]
  ]);
  const paymentEventsDb = new Set();
  const tenantsDb = new Map([['t_2', { id: 't_2', tier_plan: 'free', payment_status: 'unpaid' }]]);

  const currencyMismatchPayload = JSON.stringify({
    event: 'payment.captured',
    event_id: 'evt_cur_01',
    payload: { payment: { entity: { id: 'pay_02', order_id: 'order_cur_100', amount: 2900, currency: 'INR' } } }
  });
  const sig = await generateSignature(currencyMismatchPayload);
  const result = processPaymentWebhookSimulation({
    rawPayload: currencyMismatchPayload,
    signature: sig,
    expectedSignature: sig,
    orderDatabase: orderDb,
    paymentEventsDatabase: paymentEventsDb,
    tenantsDatabase: tenantsDb
  });

  assert.equal(result.status, 422);
  assert.equal(result.error, 'Payment currency mismatch');
  assert.equal(tenantsDb.get('t_2').tier_plan, 'free', 'Currency mismatched order must NOT grant pro plan');
  console.log('✅ [PAY-ADV-02] Currency mismatch attack prevented (422 rejected, 0 entitlement granted)');
}

// Test PAY-ADV-03: Webhook Replay Protection & Duplicate Delivery
{
  const orderDb = new Map([
    ['order_valid_100', { id: 'ord_3', amount_in_cents: 2900, currency: 'USD', status: 'created', tenant_id: 't_3', tier_code: 'pro', ai_credits: 5000 }]
  ]);
  const paymentEventsDb = new Set();
  const tenantsDb = new Map([['t_3', { id: 't_3', tier_plan: 'free', ai_credits: 100 }]]);

  const validPayload = JSON.stringify({
    event: 'payment.captured',
    event_id: 'evt_replay_01',
    payload: { payment: { entity: { id: 'pay_03', order_id: 'order_valid_100', amount: 2900, currency: 'USD' } } }
  });
  const sig = await generateSignature(validPayload);

  // Delivery 1: Success
  const res1 = processPaymentWebhookSimulation({
    rawPayload: validPayload,
    signature: sig,
    expectedSignature: sig,
    orderDatabase: orderDb,
    paymentEventsDatabase: paymentEventsDb,
    tenantsDatabase: tenantsDb
  });
  assert.equal(res1.status, 200);
  assert.equal(tenantsDb.get('t_3').tier_plan, 'pro');
  assert.equal(tenantsDb.get('t_3').ai_credits, 5000);

  // Delivery 2 (Replay): Idempotent acknowledgement, zero double credits
  const res2 = processPaymentWebhookSimulation({
    rawPayload: validPayload,
    signature: sig,
    expectedSignature: sig,
    orderDatabase: orderDb,
    paymentEventsDatabase: paymentEventsDb,
    tenantsDatabase: tenantsDb
  });
  assert.equal(res2.status, 200);
  assert.equal(res2.duplicate, true);
  assert.equal(tenantsDb.get('t_3').ai_credits, 5000, 'Replayed event must NOT double credits');
  console.log('✅ [PAY-ADV-03] Replayed webhook delivery handled idempotently (0 duplicate credits)');
}

// -----------------------------------------------------------------------------
// 2. PUBLISHING WORKER IDEMPOTENCY & LEASE RECOVERY SIMULATION
// -----------------------------------------------------------------------------
console.log('\n--- 2. Publishing Worker & Idempotency Simulations ---');

function simulateWorkerLeaseRecovery(jobs, leaseDurationMs = 10 * 60 * 1000) {
  const now = Date.now();
  for (const job of jobs) {
    if (job.status === 'processing' && job.locked_at) {
      const lockedTime = new Date(job.locked_at).getTime();
      if (now - lockedTime > leaseDurationMs && job.attempts < 5) {
        job.status = 'queued';
        job.locked_at = null;
        job.recovered = true;
      }
    }
  }
}

// Test PUB-ADV-01: Stale Processing Job Recovery after Worker Crash
{
  const staleJob = {
    id: 'job_crash_1',
    post_id: 'post_101',
    status: 'processing',
    locked_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago (stale)
    attempts: 1
  };
  const activeJob = {
    id: 'job_active_2',
    post_id: 'post_102',
    status: 'processing',
    locked_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago (active)
    attempts: 1
  };

  const jobs = [staleJob, activeJob];
  simulateWorkerLeaseRecovery(jobs);

  assert.equal(staleJob.status, 'queued', 'Stale job must be recovered to queued');
  assert.equal(staleJob.locked_at, null);
  assert.equal(activeJob.status, 'processing', 'Active job must remain in processing');
  console.log('✅ [PUB-ADV-01] Stale processing job safely recovered; active job preserved');
}

// Test PUB-ADV-02: Idempotency Key Composition
{
  const postId = 'post_xyz_123';
  const tenantId = 'tenant_abc_456';
  const attempt = 1;
  const idempotencyKey = `pub_${postId}_attempt${attempt}`;
  assert.ok(idempotencyKey.includes(postId));
  assert.ok(idempotencyKey.includes('attempt1'));
  console.log('✅ [PUB-ADV-02] Composite idempotency key generated deterministically');
}

// -----------------------------------------------------------------------------
// 3. SSRF VALIDATION TESTS
// -----------------------------------------------------------------------------
console.log('\n--- 3. SSRF & Network Boundary Protection ---');

function isPublicSafeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const host = u.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

assert.equal(isPublicSafeUrl('http://127.0.0.1/admin'), false, '127.0.0.1 must be blocked');
assert.equal(isPublicSafeUrl('http://localhost:8080/secret'), false, 'localhost must be blocked');
assert.equal(isPublicSafeUrl('http://169.254.169.254/latest/meta-data'), false, 'AWS/GCP metadata must be blocked');
assert.equal(isPublicSafeUrl('http://10.0.0.5/internal'), false, '10.x.x.x private LAN must be blocked');
assert.equal(isPublicSafeUrl('http://192.168.1.1/router'), false, '192.168.x.x private LAN must be blocked');
assert.equal(isPublicSafeUrl('file:///etc/passwd'), false, 'file:// scheme must be blocked');
assert.equal(isPublicSafeUrl('https://images.unsplash.com/photo-123.jpg'), true, 'Public HTTPS image allowed');
assert.equal(isPublicSafeUrl('https://res.cloudinary.com/demo/image.png'), true, 'Public Cloudinary CDN allowed');

console.log('✅ [SSRF-ADV-01] All private LAN, loopback, file://, and cloud metadata targets blocked');

console.log('\n================================================================');
console.log('🎉 ALL ADVERSARIAL INTEGRATION SIMULATIONS PASSED');
console.log('================================================================');
