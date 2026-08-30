-- ==============================================================================
-- 20260830220000_fix_ai_credit_log_grant.sql
-- Let AI credit usage actually be recorded.
--
-- ai_credit_logs has an "AI logs tenant" policy covering ALL commands, but the
-- table grant for authenticated is SELECT only. Postgres checks grants before
-- RLS, so every insert fails — and App.tsx writes these with
-- `void cloudAiLogs.create(...).catch(() => {})`, which discards the error.
--
-- The result: AI credits are spent, the balance drops, and the log that is
-- supposed to explain where they went stays empty. Same shape as the profiles
-- grant bug, on a different table.
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_credit_logs' AND policyname = 'AI logs tenant'
  ) THEN
    RAISE EXCEPTION
      'AI logs tenant policy is missing — refusing to grant writes without it.';
  END IF;
END $$;

-- The policy already confines rows to the caller's tenant.
GRANT INSERT, UPDATE ON public.ai_credit_logs TO authenticated;

COMMENT ON TABLE public.ai_credit_logs IS
  'Per-tenant record of AI credit consumption. Writes are confined to the caller''s own tenant by the "AI logs tenant" policy.';
