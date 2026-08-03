import { actor, cors, json } from '../_shared/server.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { db, user, profile } = await actor(req);
    const { email, tenantId = profile.tenant_id, role = 'member', redirectTo } = await req.json();
    if (!tenantId || !email || !['admin', 'member'].includes(role)) return json({ error: 'Invalid invitation' }, 400);
    if (!profile.is_super_admin && (profile.tenant_id !== tenantId || profile.role !== 'admin')) return json({ error: 'Forbidden' }, 403);
    const normalizedEmail = email.toLowerCase();
    await db.from('tenant_invitations').upsert({ tenant_id: tenantId, email: normalizedEmail, role, invited_by: user.id }, { onConflict: 'tenant_id,email' });
    const { data, error } = await db.auth.admin.inviteUserByEmail(normalizedEmail, { redirectTo, data: { invited: true } });
    if (error) throw error;
    if (data.user) {
      await db.from('profiles').update({ tenant_id: tenantId, role, is_super_admin: false }).eq('id', data.user.id);
    }
    return json({ invited: true, userId: data.user?.id });
  } catch (e) { return json({ error: e instanceof Error ? e.message : 'Request failed' }, 400); }
});
