-- ==============================================================================
-- 20260830200000_fix_worker_auth.sql
-- Give the cron sweeper an Authorization header.
--
-- 20260830140000 sent only x-worker-secret. Supabase's gateway rejects a
-- request with no Authorization header before it ever reaches the function, so
-- every sweep returned 401 UNAUTHORIZED_NO_AUTH_HEADER and no scheduled post
-- would ever have gone out — the exact failure that migration set out to fix.
--
-- The bearer token only has to satisfy the gateway; the function still does its
-- own authorization against WORKER_SECRET. So the publishable key is the right
-- credential here: it is already public in the browser bundle, and using it
-- keeps the service role key out of the database.
-- ==============================================================================

CREATE OR REPLACE FUNCTION private.invoke_publishing_worker(target_post_id UUID DEFAULT NULL)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'private', 'public'
AS $$
DECLARE
  v_base_url   TEXT := private.worker_config_value('supabase_url');
  v_secret     TEXT := private.worker_config_value('worker_secret');
  v_anon_key   TEXT := private.worker_config_value('anon_key');
  v_url        TEXT;
  v_request_id BIGINT;
BEGIN
  IF v_base_url IS NULL OR v_secret IS NULL OR v_anon_key IS NULL THEN
    RAISE EXCEPTION
      'Publishing worker is not configured. Set supabase_url, worker_secret and anon_key via private.set_worker_config().';
  END IF;

  v_url := rtrim(v_base_url, '/') || '/functions/v1/process-publishing-jobs';
  IF target_post_id IS NOT NULL THEN
    v_url := v_url || '?postId=' || target_post_id::text;
  END IF;

  SELECT net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      -- Satisfies the platform gateway.
      'Authorization', 'Bearer ' || v_anon_key,
      'apikey', v_anon_key,
      -- The credential that actually authorizes the work.
      'x-worker-secret', v_secret
    ),
    body    := '{}'::jsonb
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION private.invoke_publishing_worker(UUID) FROM PUBLIC;
