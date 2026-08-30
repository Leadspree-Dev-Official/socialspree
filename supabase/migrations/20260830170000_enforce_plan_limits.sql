-- ==============================================================================
-- 20260830170000_enforce_plan_limits.sql
-- Enforce the channel limit tenants are actually paying for.
--
-- max_social_accounts was modelled on both plans and tenants but never checked
-- anywhere, so a Starter workspace could connect as many channels as an Agency
-- one. Enforcement lives in the database rather than an edge function because
-- connections arrive through several paths (manual connect, provider sync,
-- super admin tooling) and every one of them must respect the same ceiling.
-- ==============================================================================

CREATE OR REPLACE FUNCTION private.enforce_channel_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_limit   INT;
  v_current INT;
BEGIN
  -- Re-syncing an existing channel is not a new connection.
  IF EXISTS (
    SELECT 1 FROM public.social_connections
    WHERE tenant_id = NEW.tenant_id
      AND channel_account_id = NEW.channel_account_id
  ) THEN
    RETURN NEW;
  END IF;

  -- A disconnected channel occupies no seat.
  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  SELECT max_social_accounts INTO v_limit
  FROM public.tenants WHERE id = NEW.tenant_id;

  IF v_limit IS NULL THEN
    RETURN NEW; -- tenant row missing; referential integrity handles it
  END IF;

  SELECT count(*) INTO v_current
  FROM public.social_connections
  WHERE tenant_id = NEW.tenant_id AND status = 'active';

  IF v_current >= v_limit THEN
    RAISE EXCEPTION
      'Channel limit reached: your plan allows % connected channel(s). Disconnect one or upgrade to add more.',
      v_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_channel_limit_trigger ON public.social_connections;
CREATE TRIGGER enforce_channel_limit_trigger
  BEFORE INSERT ON public.social_connections
  FOR EACH ROW EXECUTE FUNCTION private.enforce_channel_limit();

-- Reactivating a dormant channel has to respect the ceiling too.
CREATE OR REPLACE FUNCTION private.enforce_channel_limit_on_reactivate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_limit   INT;
  v_current INT;
BEGIN
  IF NEW.status <> 'active' OR OLD.status = 'active' THEN
    RETURN NEW;
  END IF;

  SELECT max_social_accounts INTO v_limit
  FROM public.tenants WHERE id = NEW.tenant_id;
  IF v_limit IS NULL THEN RETURN NEW; END IF;

  SELECT count(*) INTO v_current
  FROM public.social_connections
  WHERE tenant_id = NEW.tenant_id AND status = 'active' AND id <> NEW.id;

  IF v_current >= v_limit THEN
    RAISE EXCEPTION
      'Channel limit reached: your plan allows % connected channel(s). Disconnect one or upgrade to add more.',
      v_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_channel_limit_reactivate_trigger ON public.social_connections;
CREATE TRIGGER enforce_channel_limit_reactivate_trigger
  BEFORE UPDATE OF status ON public.social_connections
  FOR EACH ROW EXECUTE FUNCTION private.enforce_channel_limit_on_reactivate();
