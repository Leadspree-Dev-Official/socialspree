-- ==============================================================================
-- 20260830150000_autoresponder_delivery.sql
-- Make the comment autoresponder auditable, and record whether a reply was
-- actually delivered.
--
-- The webhook was inserting rule_id, commenter_username and reply_dispatched
-- into live_comment_trigger_logs — none of which exist on that table. Every
-- insert failed, and a bare .catch() hid it, so the audit trail was empty
-- while the UI reported success.
-- ==============================================================================

ALTER TABLE public.live_comment_trigger_logs
  ADD COLUMN IF NOT EXISTS rule_id          UUID,
  ADD COLUMN IF NOT EXISTS comment_id       TEXT,
  ADD COLUMN IF NOT EXISTS post_id          TEXT,
  ADD COLUMN IF NOT EXISTS public_reply_status  TEXT,
  ADD COLUMN IF NOT EXISTS private_dm_status    TEXT,
  ADD COLUMN IF NOT EXISTS delivery_error   TEXT;

-- 'replied' no longer covers the real outcomes: a rule can match and still fail
-- to deliver because a token expired or Meta rate-limited us.
ALTER TABLE public.live_comment_trigger_logs
  DROP CONSTRAINT IF EXISTS live_comment_trigger_logs_status_check;

ALTER TABLE public.live_comment_trigger_logs
  ADD CONSTRAINT live_comment_trigger_logs_status_check
  CHECK (status IN ('replied', 'pending', 'filtered', 'partial', 'failed', 'rate_limited'));

-- Rate limiting and duplicate suppression both query by rule and commenter.
CREATE INDEX IF NOT EXISTS idx_trigger_logs_rule_sender
  ON public.live_comment_trigger_logs (rule_id, sender_username, created_at DESC);

-- One reply per comment, even if Meta redelivers the webhook.
CREATE UNIQUE INDEX IF NOT EXISTS idx_trigger_logs_comment_rule
  ON public.live_comment_trigger_logs (rule_id, comment_id)
  WHERE comment_id IS NOT NULL AND rule_id IS NOT NULL;

COMMENT ON COLUMN public.live_comment_trigger_logs.public_reply_status IS
  'sent | failed | skipped — outcome of POST /{comment-id}/replies';
COMMENT ON COLUMN public.live_comment_trigger_logs.private_dm_status IS
  'sent | failed | skipped — outcome of POST /{page-or-ig-id}/messages';
