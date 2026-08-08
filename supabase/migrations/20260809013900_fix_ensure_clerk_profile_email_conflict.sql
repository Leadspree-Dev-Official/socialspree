-- Fix email unique constraint conflict in ensure_clerk_profile by relinking existing email profiles to Clerk subject IDs

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
  subject TEXT := auth.jwt() ->> 'sub';
  jwt_email TEXT := lower(auth.jwt() ->> 'email');
  requested_email TEXT := lower(trim(p_email));
  configured_admin_email TEXT;
  verified_admin BOOLEAN := false;
  existing_profile_id TEXT;
  result public.profiles%ROWTYPE;
BEGIN
  IF requested_email = '' THEN RAISE EXCEPTION 'A primary email is required'; END IF;
  
  -- Fallback subject key if JWT sub is absent
  IF subject IS NULL OR subject = '' THEN
    subject := 'clerk_' || md5(requested_email);
  END IF;

  SELECT value INTO configured_admin_email
  FROM public.system_settings WHERE key = 'super_admin_email';
  
  verified_admin := requested_email = lower(COALESCE(configured_admin_email, 'leadspree24x7@gmail.com'));

  -- Check if a profile with this email already exists under a legacy/different ID
  SELECT id INTO existing_profile_id
  FROM public.profiles
  WHERE lower(email) = requested_email
  LIMIT 1;

  IF existing_profile_id IS NOT NULL AND existing_profile_id <> subject THEN
    -- Relink existing profile row to the new Clerk subject ID
    UPDATE public.profiles
    SET id = subject,
        full_name = COALESCE(NULLIF(trim(p_full_name), ''), full_name),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        is_super_admin = is_super_admin OR verified_admin,
        role = CASE WHEN is_super_admin OR verified_admin THEN 'super_admin' ELSE role END,
        updated_at = now()
    WHERE id = existing_profile_id
    RETURNING * INTO result;
  ELSE
    -- Insert or update profile by subject ID
    INSERT INTO public.profiles (id, email, full_name, avatar_url, is_super_admin, role)
    VALUES (
      subject, requested_email, NULLIF(trim(p_full_name), ''), p_avatar_url,
      verified_admin, CASE WHEN verified_admin THEN 'super_admin' ELSE 'member' END
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
      is_super_admin = public.profiles.is_super_admin OR verified_admin,
      role = CASE WHEN public.profiles.is_super_admin OR verified_admin THEN 'super_admin' ELSE public.profiles.role END,
      updated_at = now()
    RETURNING * INTO result;
  END IF;

  -- Auto-provision default tenant if user has no assigned tenant_id
  IF result.tenant_id IS NULL THEN
    DECLARE
      new_tenant_id UUID := gen_random_uuid();
    BEGIN
      INSERT INTO public.tenants (id, name, owner_email, owner_id, tier_plan)
      VALUES (
        new_tenant_id, 
        COALESCE(result.full_name, 'Workspace') || ' Workspace', 
        requested_email, 
        subject, 
        CASE WHEN verified_admin THEN 'enterprise' ELSE 'starter' END
      )
      ON CONFLICT DO NOTHING;
      
      UPDATE public.profiles SET tenant_id = new_tenant_id WHERE id = subject RETURNING * INTO result;
    END;
  END IF;

  RETURN result;
END;
$$;

GRANT USAGE ON SCHEMA public TO authenticated, anon, public;
GRANT EXECUTE ON FUNCTION public.ensure_clerk_profile(TEXT, TEXT, TEXT) TO authenticated, anon, public;
