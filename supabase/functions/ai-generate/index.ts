import { actor, cors, json } from '../_shared/server.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { db, profile } = await actor(req);
    if (!profile.tenant_id) return json({ error: 'No tenant assigned' }, 403);
    const { prompt, mode = 'caption' } = await req.json();
    if (typeof prompt !== 'string' || !prompt.trim()) return json({ error: 'Prompt required' }, 400);
    const cost = 10;
    const { data: tenant } = await db.from('tenants').select('id,name,ai_credits').eq('id', profile.tenant_id).single();
    if (!tenant || tenant.ai_credits < cost) return json({ error: 'Insufficient AI credits' }, 402);
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return json({ error: 'AI provider is not configured' }, 503);
    const ai = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-mini', messages: [{ role: 'system', content: `Create a concise social media ${mode}.` }, { role: 'user', content: prompt }], temperature: 0.7 }) });
    if (!ai.ok) return json({ error: 'AI provider request failed' }, 502);
    const result = await ai.json();
    const content = result.choices?.[0]?.message?.content ?? '';
    const { data: remaining, error: debitError } = await db.rpc('consume_ai_credits', { target_tenant: tenant.id, credit_cost: cost, log_action: 'text_generation', log_description: `AI ${mode} generation` });
    if (debitError) return json({ error: 'Unable to debit AI credits' }, 409);
    return json({ content, creditsRemaining: remaining });
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'Request failed' }, 400); }
});
