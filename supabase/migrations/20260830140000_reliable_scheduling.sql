-- ==============================================================================
-- 20260830140000_reliable_scheduling.sql
-- Make scheduled publishing actually fire, and stop lying when it cannot.
--
-- Three defects in the previous helper:
--   1. It wrapped cron.schedule in EXCEPTION WHEN OTHERS THEN NULL and still
--      returned {"scheduled": true} — a silent false success whenever pg_cron
--      or pg_net was unavailable.
--   2. The command read vault secrets ('supabase_url', 'service_role_key')
--      that no migration ever created, so the HTTP call had a NULL URL.
--   3. The cron expression 'min hour day month *' has no year field, so a
--      one-shot job re-fired every year and was never unscheduled.
--
-- The design here: a recurring sweeper is the primary mechanism, and per-post
-- one-shot jobs are a latency optimisation on top of it. If one-shots cannot
-- be registered, posts still go out — just on the sweeper's cadence.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ---------------------------------------------------------------------------
-- 1. Runtime configuration for the worker callback.
--    Values are set by an operator, not baked into the migration.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS private.worker_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

REVOKE ALL ON private.worker_config FROM anon, authenticated;

COMMENT ON TABLE private.worker_config IS
  'Operator-set values for the publishing worker. Populate before scheduling works:
     select private.set_worker_config(''supabase_url'', ''https://<ref>.supabase.co'');
     select private.set_worker_config(''worker_secret'', ''<WORKER_SECRET>'');';

CREATE OR REPLACE FUNCTION private.set_worker_config(config_key TEXT, config_value TEXT)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'private'
AS $$
  INSERT INTO private.worker_config (key, value, updated_at)
  VALUES (config_key, config_value, now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
$$;

REVOKE ALL ON FUNCTION private.set_worker_config(TEXT, TEXT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.worker_config_value(config_key TEXT)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'private'
AS $$
  SELECT value FROM private.worker_config WHERE key = config_key;
$$;

REVOKE ALL ON FUNCTION private.worker_config_value(TEXT) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 2. Invoke the publishing worker over HTTP.
--    Authenticates with WORKER_SECRET rather than the service role key, so the
--    most privileged credential in the project is not stored in the database.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.invoke_publishing_worker(target_post_id UUID DEFAULT NULL)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'private', 'public'
AS $$
DECLARE
  v_base_url  TEXT := private.worker_config_value('supabase_url');
  v_secret    TEXT := private.worker_config_value('worker_secret');
  v_url       TEXT;
  v_request_id BIGINT;
BEGIN
  IF v_base_url IS NULL OR v_secret IS NULL THEN
    RAISE EXCEPTION
      'Publishing worker is not configured. Set supabase_url and worker_secret via private.set_worker_config().';
  END IF;

  v_url := rtrim(v_base_url, '/') || '/functions/v1/process-publishing-jobs';
  IF target_post_id IS NOT NULL THEN
    v_url := v_url || '?postId=' || target_post_id::text;
  END IF;

  SELECT net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-worker-secret', v_secret
    ),
    body    := '{}'::jsonb
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION private.invoke_publishing_worker(UUID) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- 3. Recurring sweeper — the mechanism posts actually rely on.
--    Every minute it drains anything whose run_after has passed, which also
--    covers retries and jobs whose one-shot registration failed.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM cron.unschedule('socialspree_publishing_sweeper');
EXCEPTION WHEN OTHERS THEN
  NULL; -- not previously scheduled
END $$;

SELECT cron.schedule(
  'socialspree_publishing_sweeper',
  '* * * * *',
  $$SELECT private.invoke_publishing_worker()$$
);

-- ---------------------------------------------------------------------------
-- 4. One-shot registration for exact-time delivery.
--    Reports honestly: callers are told whether a precise trigger exists, and
--    the sweeper is named as the fallback so failure is not silent.
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.schedule_precise_post_publish(TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.schedule_precise_post_publish(
  target_post_id UUID,
  run_at         TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'private', 'public'
AS $$
DECLARE
  v_job_name TEXT := 'pub_post_' || replace(target_post_id::text, '-', '');
  v_cron     TEXT;
  v_utc      TIMESTAMPTZ := run_at AT TIME ZONE 'UTC';
BEGIN
  -- Past or imminent work belongs to the sweeper; a cron entry would only race it.
  IF run_at <= now() + interval '90 seconds' THEN
    RETURN jsonb_build_object(
      'precise', false,
      'reason', 'imminent',
      'fallback', 'sweeper',
      'post_id', target_post_id
    );
  END IF;

  -- pg_cron has no year field, so include the day-of-month and month and
  -- unschedule on execution. Anything beyond ~11 months ahead would collide
  -- with the same date next year, so leave those to the sweeper.
  IF run_at > now() + interval '300 days' THEN
    RETURN jsonb_build_object(
      'precise', false,
      'reason', 'too_far_out',
      'fallback', 'sweeper',
      'post_id', target_post_id
    );
  END IF;

  v_cron := format('%s %s %s %s *',
    extract(minute from v_utc)::int,
    extract(hour   from v_utc)::int,
    extract(day    from v_utc)::int,
    extract(month  from v_utc)::int
  );

  BEGIN
    PERFORM cron.unschedule(v_job_name);
  EXCEPTION WHEN OTHERS THEN
    NULL; -- no previous registration
  END;

  -- The job unschedules itself after firing, so it cannot repeat next year.
  PERFORM cron.schedule(
    v_job_name,
    v_cron,
    format(
      $cmd$SELECT private.invoke_publishing_worker(%L::uuid); SELECT cron.unschedule(%L);$cmd$,
      target_post_id, v_job_name
    )
  );

  RETURN jsonb_build_object(
    'precise', true,
    'post_id', target_post_id,
    'job_name', v_job_name,
    'cron', v_cron
  );
EXCEPTION WHEN OTHERS THEN
  -- Registration failed. Say so — the sweeper still delivers the post.
  RETURN jsonb_build_object(
    'precise', false,
    'reason', SQLERRM,
    'fallback', 'sweeper',
    'post_id', target_post_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.schedule_precise_post_publish(UUID, TIMESTAMPTZ) TO service_role;
REVOKE ALL ON FUNCTION public.schedule_precise_post_publish(UUID, TIMESTAMPTZ) FROM anon, authenticated;
