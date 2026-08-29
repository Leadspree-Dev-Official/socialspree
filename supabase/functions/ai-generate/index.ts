import { actor, cors, json } from '../_shared/server.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  try {
    const { db, profile } = await actor(req);
    if (!profile.tenant_id) return json({ error: 'No tenant assigned' }, 403, req);

    const body = await req.json().catch(() => ({}));
    const prompt = body.prompt;
    const mode = typeof body.mode === 'string' ? body.mode : 'caption';
    if (typeof prompt !== 'string' || !prompt.trim()) return json({ error: 'Prompt required' }, 400);
    if (prompt.length > 8000) return json({ error: 'Prompt too long' }, 422);
    if (!['caption', 'hashtag', 'description'].includes(mode)) return json({ error: 'Unsupported AI mode' }, 422);

    const cost = 10;
    const { data: remaining, error: reserveError } = await db.rpc('reserve_ai_credits', {
      target_tenant: profile.tenant_id,
      credit_cost: cost,
      log_action: mode === 'hashtag' ? 'hashtag_generation' : 'text_generation',
      log_description: `AI ${mode} generation reservation`
    });
    if (reserveError) return json({ error: 'Insufficient AI credits' }, 402);

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      await db.rpc('refund_ai_credits', { target_tenant: profile.tenant_id, credit_amount: cost, log_description: 'AI provider unavailable' });
      return json({ error: 'AI provider is not configured' }, 503);
    }

    try {
      const ai = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: `Create a concise social media ${mode}.` },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });
      if (!ai.ok) throw new Error('AI provider request failed');
      const result = await ai.json();
      const content = result.choices?.[0]?.message?.content ?? '';
      return json({ content, creditsRemaining: remaining });
    } catch (providerError) {
      await db.rpc('refund_ai_credits', {
        target_tenant: profile.tenant_id,
        credit_amount: cost,
        log_description: providerError instanceof Error ? providerError.message : 'AI provider failure'
      });
      return json({ error: providerError instanceof Error ? providerError.message : 'AI provider request failed' }, 502);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Request failed' }, 500);
  }
});
