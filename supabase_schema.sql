-- ==============================================================================
-- SOCIALSPREE MULTI-TENANT SOCIAL MANAGER SAAS - SUPABASE DATABASE SCHEMA
-- Target Supabase Project: https://qglhbesenigpspgkgbac.supabase.co
-- Super Admin Root Email: leadspree24x7@gmail.com
-- PRIVACY POLICY: Super Admin manages tenant accounts but CANNOT view tenant content/posts/logs
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tenants (Organizations / Business Clients)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_email TEXT NOT NULL,
    api_key TEXT DEFAULT 'key_allocated_live_99481a',
    tier_plan TEXT NOT NULL DEFAULT 'free' CHECK (tier_plan IN ('free', 'pro', 'agency')),
    allocated_api_slots INT NOT NULL DEFAULT 2,
    max_social_accounts INT NOT NULL DEFAULT 4,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Profiles (User Profiles linked to Auth & Tenant)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Social Connections (Connected Accounts per Tenant)
CREATE TABLE IF NOT EXISTS public.social_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'linkedin', 'youtube', 'x', 'google_business', 'tiktok', 'threads', 'bluesky', 'pinterest', 'reddit', 'telegram', 'discord', 'whatsapp', 'snapchat')),
    channel_account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_handle TEXT,
    account_avatar TEXT,
    slot_number INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected')),
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Posts (Composed, Instant & Scheduled Posts)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    content TEXT, -- Text is optional if media_urls is provided
    media_urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of image/video URLs
    media_type TEXT DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video')),
    is_cloudflare_hosted BOOLEAN NOT NULL DEFAULT false, -- Mandatory true for scheduled posts with media
    selected_account_ids JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { platform, accountId }
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
    scheduled_for TIMESTAMPTZ, -- If present, post is scheduled
    published_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Post Audit Logs (HTTP Payload & Response History)
CREATE TABLE IF NOT EXISTS public.post_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    api_post_id TEXT,
    request_payload JSONB NOT NULL,
    response_payload JSONB NOT NULL,
    http_status INT NOT NULL DEFAULT 200,
    execution_type TEXT NOT NULL CHECK (execution_type IN ('instant', 'background_cron', 'cloud_native')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Subscription Plans (Managed by Super Admin)
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly NUMERIC NOT NULL,
    allocated_api_slots INT NOT NULL DEFAULT 1,
    max_social_accounts INT NOT NULL DEFAULT 2,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- STRICT ROW LEVEL SECURITY (RLS) POLICIES FOR DATA PRIVACY
-- ==============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE SCHEMA IF NOT EXISTS private;

-- Helper Function: authorization data is server-maintained, not user metadata/email.
CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_super_admin = true
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_super_admin() TO authenticated;

-- 1. RLS Policy: Tenants (Super Admin can manage tenant account metadata & limits)
CREATE POLICY "Tenants: Members view own tenant metadata"
    ON public.tenants FOR SELECT
    USING (
        id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
        OR private.is_super_admin()
    );

CREATE POLICY "Tenants: Super Admin account management"
    ON public.tenants FOR ALL
    TO authenticated
    USING (private.is_super_admin())
    WITH CHECK (private.is_super_admin());

CREATE POLICY "Profiles: Members view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = (SELECT auth.uid()) OR private.is_super_admin());

CREATE POLICY "Profiles: Members update own non-privileged profile row"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (
        id = (SELECT auth.uid())
        AND is_super_admin = false
        AND role <> 'super_admin'
    );

-- 2. RLS Policy: Social Connections (STRICT PRIVACY: Members ONLY, Super Admin blocked)
CREATE POLICY "SocialConnections: Strict tenant member isolation"
    ON public.social_connections FOR ALL
    USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 3. RLS Policy: Posts (STRICT PRIVACY: Members ONLY, Super Admin blocked)
CREATE POLICY "Posts: Strict tenant member content isolation"
    ON public.posts FOR ALL
    USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 4. RLS Policy: Post Logs (STRICT PRIVACY: Members ONLY, Super Admin blocked)
CREATE POLICY "PostLogs: Strict tenant member audit log isolation"
    ON public.post_logs FOR ALL
    USING (
        tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
    WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 5. RLS Policy: Plans (Everyone can read, Super Admin can create/update)
CREATE POLICY "Plans: Public read access"
    ON public.plans FOR SELECT
    USING (true);

CREATE POLICY "Plans: Super Admin full control"
    ON public.plans FOR ALL
    TO authenticated
    USING (private.is_super_admin())
    WITH CHECK (private.is_super_admin());
