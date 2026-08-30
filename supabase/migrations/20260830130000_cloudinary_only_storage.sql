-- ==============================================================================
-- 20260830130000_cloudinary_only_storage.sql
-- Cloudinary is the only media backend. Cloudflare R2 was never implemented —
-- the app merely labelled media as "Cloudflare hosted" and checked URLs for
-- keywords. This removes the misleading naming from the schema and the
-- customer-facing plan copy.
-- ==============================================================================

-- 1. posts.is_cloudflare_hosted -> is_cdn_hosted
--    The flag records whether media sits on our own CDN, which is now Cloudinary.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts'
      AND column_name = 'is_cloudflare_hosted'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts'
      AND column_name = 'is_cdn_hosted'
  ) THEN
    ALTER TABLE public.posts RENAME COLUMN is_cloudflare_hosted TO is_cdn_hosted;
  END IF;
END $$;

-- Fresh databases that never had the old column still need the new one.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_cdn_hosted BOOLEAN NOT NULL DEFAULT false;

-- 2. Correct the flag for existing rows: true only for Cloudinary-hosted media.
UPDATE public.posts p
SET is_cdn_hosted = (
  jsonb_array_length(COALESCE(p.media_urls, '[]'::jsonb)) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(COALESCE(p.media_urls, '[]'::jsonb)) AS m(url)
    WHERE m.url NOT ILIKE 'https://res.cloudinary.com/%'
      AND m.url NOT ILIKE 'https://%.cloudinary.com/%'
  )
);

-- 3. Stop selling a storage backend that does not exist.
UPDATE public.plans
SET features = (
  SELECT COALESCE(
    jsonb_agg(
      to_jsonb(
        replace(
          replace(f #>> '{}', 'Cloudflare & Cloudinary CDN Integration', 'Cloudinary CDN Media Storage'),
          'Cloudflare CDN Media Vault', 'Cloudinary CDN Media Vault'
        )
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(features) AS f
)
WHERE features::text ILIKE '%cloudflare%';
