-- ==============================================================================
-- 20260830120000_remove_x_platform.sql
-- Remove X (formerly Twitter) as a supported publishing channel.
--
-- X write access sits behind a paid API tier we are not carrying at launch.
-- This drops the channel from the platform whitelist and clears any connection
-- or queued job that referenced it, so nothing can be dispatched to a channel
-- we no longer support.
--
-- Order matters: queued work is failed first, while the X connection rows it
-- refers to still exist.
-- ==============================================================================

-- 1. Fail queued work aimed at an X connection, and tell the tenant why.
--    posts.selected_account_ids holds social_connections.id values as JSON text.
WITH x_targeted AS (
  SELECT DISTINCT p.id
  FROM public.posts p
  JOIN jsonb_array_elements_text(COALESCE(p.selected_account_ids, '[]'::jsonb)) AS sel(connection_id)
    ON TRUE
  JOIN public.social_connections sc
    ON sc.id::text = sel.connection_id
  WHERE sc.platform = 'x'
)
UPDATE public.publishing_jobs j
SET status     = 'failed',
    last_error = 'X (Twitter) is no longer a supported channel',
    updated_at = now()
WHERE j.status IN ('queued', 'processing')
  AND j.post_id IN (SELECT id FROM x_targeted);

-- 2. Drop X connections. channel_account_id is meaningless without the channel.
DELETE FROM public.social_connections WHERE platform = 'x';

-- 3. Narrow the platform whitelist. The original constraint is inline and
--    unnamed, so Postgres generated the name below; drop defensively and re-add.
ALTER TABLE public.social_connections
  DROP CONSTRAINT IF EXISTS social_connections_platform_check;

ALTER TABLE public.social_connections
  ADD CONSTRAINT social_connections_platform_check
  CHECK (platform IN (
    'instagram','facebook','linkedin','youtube','google_business',
    'tiktok','threads','bluesky','pinterest','reddit',
    'telegram','discord','whatsapp','snapchat'
  ));

-- 4. Stop pricing copy from advertising a channel we no longer publish to.
UPDATE public.plans
SET features = (
  SELECT COALESCE(jsonb_agg(f), '[]'::jsonb)
  FROM jsonb_array_elements(features) AS f
  WHERE f #>> '{}' NOT ILIKE '%twitter%'
)
WHERE features::text ILIKE '%twitter%';
