-- Server-only credentials. Ciphertext is produced and consumed by Edge Functions.
CREATE TABLE IF NOT EXISTS private.provider_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'default',
  ciphertext TEXT NOT NULL,
  key_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, label)
);
REVOKE ALL ON private.provider_credentials FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','member')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS public.publishing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','succeeded','failed','dead_letter')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  run_after TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  last_error TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS publishing_jobs_ready_idx ON public.publishing_jobs(status, run_after);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.checkout_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  provider_order_id TEXT UNIQUE,
  amount_minor INT NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed','expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitations tenant admins read" ON public.tenant_invitations FOR SELECT TO authenticated
USING (private.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
CREATE POLICY "Publishing jobs tenant read" ON public.publishing_jobs FOR SELECT TO authenticated
USING (private.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Checkout orders owner read" ON public.checkout_orders FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.is_super_admin());

-- Payment events and job mutation are service-role-only.
REVOKE ALL ON public.payment_events FROM anon, authenticated;
GRANT SELECT ON public.tenant_invitations, public.publishing_jobs, public.checkout_orders TO authenticated;

-- Browser-visible tables must not contain provider credentials.
ALTER TABLE public.tenants DROP COLUMN IF EXISTS api_key;
ALTER TABLE public.api_allocation_slots DROP COLUMN IF EXISTS api_key;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('socialspree-media', 'socialspree-media', false, 52428800, ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Tenant media read" ON storage.objects;
CREATE POLICY "Tenant media read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'socialspree-media' AND (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Tenant media insert" ON storage.objects;
CREATE POLICY "Tenant media insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'socialspree-media' AND (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "Tenant media delete" ON storage.objects;
CREATE POLICY "Tenant media delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'socialspree-media' AND (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()));
