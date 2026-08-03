ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS provider_profile_id TEXT,
  ADD COLUMN IF NOT EXISTS health_status TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS social_connections_tenant_provider_account_idx ON public.social_connections(tenant_id, channel_account_id);

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS zernio_post_id TEXT,
  ADD COLUMN IF NOT EXISTS platform_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS platform_results JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  zernio_post_id TEXT NOT NULL,
  platform TEXT,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  views BIGINT NOT NULL DEFAULT 0, likes BIGINT NOT NULL DEFAULT 0,
  comments BIGINT NOT NULL DEFAULT 0, shares BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0, engagement_rate NUMERIC NOT NULL DEFAULT 0,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, zernio_post_id)
);
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Analytics tenant read" ON public.analytics_snapshots FOR SELECT TO authenticated
USING (tenant_id=private.current_tenant_id() OR private.is_super_admin());
GRANT SELECT ON public.analytics_snapshots TO authenticated;
