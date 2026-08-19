-- ==============================================================================
-- SOCIALSPREE MULTI-TENANT SOCIAL MANAGER SAAS - SUPABASE DATABASE SCHEMA
-- Target Supabase Project: https://qglhbesenigpspgkgbac.supabase.co
-- Identity provider: Clerk via Supabase Third-Party Auth
-- PRIVACY POLICY: Super Admin manages tenant accounts but CANNOT view tenant content/posts/logs
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tenants (Organizations / Business Clients)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id TEXT,
    owner_email TEXT NOT NULL,
    tier_plan TEXT NOT NULL DEFAULT 'free' CHECK (tier_plan IN ('free', 'starter', 'pro', 'agency', 'influencer', 'enterprise')),
    allocated_api_slots INT NOT NULL DEFAULT 2,
    max_social_accounts INT NOT NULL DEFAULT 4,
    ai_credits INT NOT NULL DEFAULT 1000,
    dispatch_engine TEXT NOT NULL DEFAULT 'zenith' CHECK (dispatch_engine IN ('zenith', 'coresync', 'dual')),
    enabled_engines JSONB NOT NULL DEFAULT '["zenith"]'::jsonb,
    cloudinary_config JSONB,
    custom_zernio_daily_limit INT DEFAULT 100,
    custom_zernio_monthly_limit INT DEFAULT 3000,
    zernio_daily_dispatch_count INT DEFAULT 0,
    zernio_monthly_dispatch_count INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed', 'trialing')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    renewal_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Profiles (Clerk subject IDs, e.g. user_2xxx)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    job_title TEXT,
    phone_number TEXT,
    timezone TEXT DEFAULT 'UTC',
    notifications JSONB DEFAULT '{"emailDigest": true, "postFailureAlerts": true, "securityAlerts": true}'::jsonb,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'agency', 'influencer', 'business_user', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
    provider TEXT DEFAULT 'zernio',
    content TEXT, -- Text is optional if media_urls is provided
    media_urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of image/video URLs
    media_type TEXT DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video')),
    is_cloudflare_hosted BOOLEAN NOT NULL DEFAULT false,
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
    price_yearly NUMERIC,
    currency TEXT NOT NULL DEFAULT 'USD',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    target_role TEXT DEFAULT 'business_user',
    allocated_api_slots INT NOT NULL DEFAULT 1,
    max_social_accounts INT NOT NULL DEFAULT 2,
    ai_credits INT NOT NULL DEFAULT 1000,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. API Allocation Slots
CREATE TABLE IF NOT EXISTS public.api_allocation_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    slot_number INT NOT NULL,
    slot_name TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'zernio' CHECK (provider IN ('zernio', 'composio')),
    api_key TEXT DEFAULT '',
    max_channels INT NOT NULL DEFAULT 2,
    connected_account_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT api_allocation_slots_tenant_slot_uniq UNIQUE (tenant_id, slot_number)
);

-- 9. AI Credit Logs
CREATE TABLE IF NOT EXISTS public.ai_credit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tenant_name TEXT NOT NULL,
    action TEXT NOT NULL,
    credits_amount INT NOT NULL,
    remaining_balance INT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Media Assets (Media Vault)
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    file_size TEXT,
    dimensions TEXT,
    format TEXT,
    storage_provider TEXT NOT NULL DEFAULT 'cloudinary',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Google Reviews
CREATE TABLE IF NOT EXISTS public.google_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    relative_time TEXT,
    reply JSONB,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Auto Responder Rules
CREATE TABLE IF NOT EXISTS public.auto_responder_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Auto Reply Bot',
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'both')),
    trigger_type TEXT NOT NULL DEFAULT 'keyword' CHECK (trigger_type IN ('keyword', 'all_comments', 'sentiment')),
    trigger_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    match_type TEXT NOT NULL DEFAULT 'contains' CHECK (match_type IN ('exact', 'contains', 'regex')),
    action_type TEXT NOT NULL DEFAULT 'both' CHECK (action_type IN ('comment_reply', 'private_dm', 'both')),
    public_reply_template TEXT DEFAULT '',
    public_reply_templates JSONB NOT NULL DEFAULT '[]'::jsonb,
    private_dm_template TEXT DEFAULT '',
    private_dm_templates JSONB NOT NULL DEFAULT '[]'::jsonb,
    attached_media_url TEXT,
    use_ai_context BOOLEAN NOT NULL DEFAULT true,
    ai_persona_prompt TEXT,
    rate_limit_minutes INT DEFAULT 60,
    target_post_scope TEXT NOT NULL DEFAULT 'all_posts' CHECK (target_post_scope IN ('all_posts', 'specific_posts')),
    target_post_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    trigger_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Live Comment Trigger Logs
CREATE TABLE IF NOT EXISTS public.live_comment_trigger_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.auto_responder_rules(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    commenter_username TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    reply_dispatched TEXT NOT NULL,
    matched_keyword TEXT,
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Agency Brands
CREATE TABLE IF NOT EXISTS public.agency_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    brand_logo TEXT,
    brand_color TEXT,
    brand_description TEXT,
    social_account_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
ALTER TABLE public.api_allocation_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_responder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_comment_trigger_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE SCHEMA IF NOT EXISTS private;

-- Helper Function: privileges come only from the DB row for the signed Clerk subject.
CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (auth.jwt() ->> 'sub') AND is_super_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_super_admin() TO authenticated;

-- Helper Function: check tenant membership
CREATE OR REPLACE FUNCTION private.user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.profiles WHERE id = (auth.jwt() ->> 'sub') LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

REVOKE ALL ON FUNCTION private.user_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.user_tenant_id() TO authenticated;


-- 1. RLS Policy: Tenants
CREATE POLICY "Tenants: Members view own tenant metadata"
    ON public.tenants FOR SELECT
    USING (
        id = private.user_tenant_id()
        OR private.is_super_admin()
    );

CREATE POLICY "Tenants: Super Admin account management"
    ON public.tenants FOR ALL
    TO authenticated
    USING (private.is_super_admin())
    WITH CHECK (private.is_super_admin());

-- 2. RLS Policy: Profiles
CREATE POLICY "Profiles: Members view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = (auth.jwt() ->> 'sub') OR private.is_super_admin());

CREATE POLICY "Profiles: Members update own non-privileged profile row"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = (auth.jwt() ->> 'sub'))
    WITH CHECK (
        id = (auth.jwt() ->> 'sub')
        AND is_super_admin = false
        AND role <> 'super_admin'
    );

-- 3. RLS Policy: Social Connections (STRICT PRIVACY: Members ONLY)
CREATE POLICY "SocialConnections: Strict tenant member isolation"
    ON public.social_connections FOR ALL
    USING (tenant_id = private.user_tenant_id())
    WITH CHECK (tenant_id = private.user_tenant_id());

-- 4. RLS Policy: Posts (STRICT PRIVACY: Members ONLY)
CREATE POLICY "Posts: Strict tenant member content isolation"
    ON public.posts FOR ALL
    USING (tenant_id = private.user_tenant_id())
    WITH CHECK (tenant_id = private.user_tenant_id());

-- 5. RLS Policy: Post Logs (STRICT PRIVACY: Members ONLY)
CREATE POLICY "PostLogs: Strict tenant member audit log isolation"
    ON public.post_logs FOR ALL
    USING (tenant_id = private.user_tenant_id())
    WITH CHECK (tenant_id = private.user_tenant_id());

-- 6. RLS Policy: Plans (Public read, Super Admin write)
CREATE POLICY "Plans: Public read access"
    ON public.plans FOR SELECT
    USING (true);

CREATE POLICY "Plans: Super Admin full control"
    ON public.plans FOR ALL
    TO authenticated
    USING (private.is_super_admin())
    WITH CHECK (private.is_super_admin());

-- 7. RLS Policy: API Allocation Slots
CREATE POLICY "ApiSlots: Tenant member and Super Admin access"
    ON public.api_allocation_slots FOR ALL
    USING (tenant_id = private.user_tenant_id() OR private.is_super_admin())
    WITH CHECK (tenant_id = private.user_tenant_id() OR private.is_super_admin());

-- 8. RLS Policy: AI Credit Logs
CREATE POLICY "AiLogs: Tenant member and Super Admin view"
    ON public.ai_credit_logs FOR ALL
    USING (tenant_id = private.user_tenant_id() OR private.is_super_admin())
    WITH CHECK (tenant_id = private.user_tenant_id() OR private.is_super_admin());

-- 9. RLS Policy: Media Assets (STRICT PRIVACY: Members ONLY)
CREATE POLICY "MediaAssets: Strict tenant member isolation"
    ON public.media_assets FOR ALL
    USING (tenant_id = private.user_tenant_id())
    WITH CHECK (tenant_id = private.user_tenant_id());

-- 10. RLS Policy: Google Reviews (STRICT PRIVACY: Members ONLY)
CREATE POLICY "GoogleReviews: Strict tenant member isolation"
    ON public.google_reviews FOR ALL
    USING (tenant_id = private.user_tenant_id())
    WITH CHECK (tenant_id = private.user_tenant_id());

-- 11. RLS Policy: Auto Responder Rules (STRICT PRIVACY: Members ONLY)
CREATE POLICY "AutoResponderRules: Strict tenant member isolation"
    ON public.auto_responder_rules FOR ALL
    USING (tenant_id = private.user_tenant_id())
    WITH CHECK (tenant_id = private.user_tenant_id());

-- 12. RLS Policy: Live Comment Trigger Logs (STRICT PRIVACY: Members ONLY)
CREATE POLICY "LiveCommentLogs: Strict tenant member isolation"
    ON public.live_comment_trigger_logs FOR ALL
    USING (tenant_id = private.user_tenant_id())
    WITH CHECK (tenant_id = private.user_tenant_id());

-- 13. RLS Policy: Agency Brands (STRICT PRIVACY: Members ONLY)
CREATE POLICY "AgencyBrands: Strict tenant member isolation"
    ON public.agency_brands FOR ALL
    USING (tenant_id = private.user_tenant_id())
    WITH CHECK (tenant_id = private.user_tenant_id());

-- 14. RLS Policy: System Settings (Read-all, Super Admin write)
CREATE POLICY "SystemSettings: Authenticated read"
    ON public.system_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "SystemSettings: Super Admin full control"
    ON public.system_settings FOR ALL
    TO authenticated
    USING (private.is_super_admin())
    WITH CHECK (private.is_super_admin());
