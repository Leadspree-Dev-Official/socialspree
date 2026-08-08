-- Update ensure_clerk_profile so new signups receive the Free Plan (2 posts/mo, 2 social accounts)

CREATE OR REPLACE FUNCTION public.ensure_clerk_profile(
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  jwt_sub TEXT := auth.jwt() ->> 'sub';
  jwt_role TEXT := auth.jwt() ->> 'role';
  requested_email TEXT := lower(trim(p_email));
  configured_admin_email TEXT;
  verified_admin BOOLEAN := false;
  target_id TEXT;
  assigned_role TEXT;
  result public.profiles%ROWTYPE;
BEGIN
  IF requested_email = '' THEN RAISE EXCEPTION 'A primary email is required'; END IF;
  
  IF jwt_sub IS NOT NULL AND jwt_sub <> '' THEN
    target_id := jwt_sub;
  ELSE
    SELECT id INTO target_id FROM public.profiles WHERE lower(email) = requested_email LIMIT 1;
    IF target_id IS NULL THEN
      target_id := 'clerk_' || md5(requested_email);
    END IF;
  END IF;

  SELECT value INTO configured_admin_email
  FROM public.system_settings WHERE key = 'super_admin_email';
  
  verified_admin := requested_email = lower(COALESCE(configured_admin_email, 'leadspree24x7@gmail.com'));

  IF verified_admin THEN
    assigned_role := 'super_admin';
  ELSIF jwt_role IN ('agency', 'influencer', 'business_user', 'admin') THEN
    assigned_role := jwt_role;
  ELSE
    assigned_role := 'business_user';
  END IF;

  UPDATE public.profiles
  SET id = target_id,
      email = requested_email,
      full_name = COALESCE(NULLIF(trim(p_email), ''), full_name),
      avatar_url = COALESCE(p_avatar_url, avatar_url),
      is_super_admin = is_super_admin OR verified_admin,
      role = CASE 
        WHEN is_super_admin OR verified_admin THEN 'super_admin' 
        WHEN role IN ('agency', 'influencer', 'super_admin') THEN role
        ELSE assigned_role 
      END,
      updated_at = now()
  WHERE lower(email) = requested_email
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, is_super_admin, role)
    VALUES (
      target_id, requested_email, NULLIF(trim(p_full_name), ''), p_avatar_url,
      verified_admin, assigned_role
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
      is_super_admin = public.profiles.is_super_admin OR verified_admin,
      role = CASE 
        WHEN public.profiles.is_super_admin OR verified_admin THEN 'super_admin' 
        WHEN public.profiles.role IN ('agency', 'influencer', 'super_admin') THEN public.profiles.role
        ELSE EXCLUDED.role 
      END,
      updated_at = now()
    RETURNING * INTO result;
  END IF;

  -- Provision default tenant with Free Plan (2 posts/mo, 2 social channels = 1 API slot)
  IF result.tenant_id IS NULL THEN
    DECLARE
      new_tenant_id UUID := gen_random_uuid();
    BEGIN
      INSERT INTO public.tenants (
        id, name, owner_email, owner_id, tier_plan, allocated_api_slots, custom_zernio_monthly_limit
      )
      VALUES (
        new_tenant_id, 
        COALESCE(result.full_name, 'Workspace') || ' Workspace', 
        requested_email, 
        target_id, 
        CASE 
          WHEN verified_admin THEN 'enterprise' 
          WHEN result.role = 'agency' THEN 'agency'
          WHEN result.role = 'influencer' THEN 'pro'
          ELSE 'free' 
        END,
        CASE
          WHEN verified_admin THEN 10
          WHEN result.role = 'agency' THEN 5
          WHEN result.role = 'influencer' THEN 2
          ELSE 1
        END,
        CASE
          WHEN verified_admin THEN 10000
          WHEN result.role = 'agency' THEN 5000
          WHEN result.role = 'influencer' THEN 500
          ELSE 2
        END
      )
      ON CONFLICT DO NOTHING;
      
      UPDATE public.profiles SET tenant_id = new_tenant_id WHERE id = result.id RETURNING * INTO result;
    END;
  END IF;

  RETURN result;
END;
$$;

GRANT USAGE ON SCHEMA public TO authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.ensure_clerk_profile(TEXT, TEXT, TEXT) TO authenticated, anon, public;
