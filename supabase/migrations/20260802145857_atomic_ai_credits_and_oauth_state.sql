CREATE TABLE IF NOT EXISTS private.oauth_states (
  state_hash TEXT PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  code_verifier TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
REVOKE ALL ON private.oauth_states FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_ai_credits(
  target_tenant UUID,
  credit_cost INT,
  log_action TEXT,
  log_description TEXT
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  remaining INT;
  tenant_name TEXT;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  UPDATE public.tenants
  SET ai_credits = ai_credits - credit_cost
  WHERE id = target_tenant AND ai_credits >= credit_cost
  RETURNING ai_credits, name INTO remaining, tenant_name;
  IF remaining IS NULL THEN RAISE EXCEPTION 'insufficient AI credits'; END IF;
  INSERT INTO public.ai_credit_logs (tenant_id, tenant_name, action, credits_amount, remaining_balance, description)
  VALUES (target_tenant, tenant_name, log_action, -credit_cost, remaining, log_description);
  RETURN remaining;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_ai_credits(UUID,INT,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_credits(UUID,INT,TEXT,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.store_provider_credential(target_tenant UUID, target_provider TEXT, target_label TEXT, target_ciphertext TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = private, public AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  INSERT INTO private.provider_credentials(tenant_id, provider, label, ciphertext, updated_at)
  VALUES(target_tenant, target_provider, target_label, target_ciphertext, now())
  ON CONFLICT(tenant_id,provider,label) DO UPDATE SET ciphertext=EXCLUDED.ciphertext, updated_at=now(), key_version=private.provider_credentials.key_version+1;
END; $$;
REVOKE ALL ON FUNCTION public.store_provider_credential(UUID,TEXT,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_provider_credential(UUID,TEXT,TEXT,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.delete_provider_credential(target_tenant UUID, target_provider TEXT, target_label TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = private AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  DELETE FROM private.provider_credentials WHERE tenant_id=target_tenant AND provider=target_provider AND label=target_label;
END; $$;
REVOKE ALL ON FUNCTION public.delete_provider_credential(UUID,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_provider_credential(UUID,TEXT,TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.create_oauth_state(target_hash TEXT,target_tenant UUID,target_provider TEXT,target_redirect TEXT,target_verifier TEXT,target_expiry TIMESTAMPTZ,target_user UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = private AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  INSERT INTO private.oauth_states(state_hash,tenant_id,provider,redirect_uri,code_verifier,expires_at,created_by)
  VALUES(target_hash,target_tenant,target_provider,target_redirect,target_verifier,target_expiry,target_user);
END; $$;
REVOKE ALL ON FUNCTION public.create_oauth_state(TEXT,UUID,TEXT,TEXT,TEXT,TIMESTAMPTZ,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_oauth_state(TEXT,UUID,TEXT,TEXT,TEXT,TIMESTAMPTZ,UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.consume_oauth_state(target_hash TEXT)
RETURNS TABLE(tenant_id UUID,provider TEXT,redirect_uri TEXT,code_verifier TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = private AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role' THEN RAISE EXCEPTION 'service role required'; END IF;
  RETURN QUERY DELETE FROM private.oauth_states s WHERE s.state_hash=target_hash AND s.expires_at>now()
  RETURNING s.tenant_id,s.provider,s.redirect_uri,s.code_verifier;
END; $$;
REVOKE ALL ON FUNCTION public.consume_oauth_state(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_oauth_state(TEXT) TO service_role;
