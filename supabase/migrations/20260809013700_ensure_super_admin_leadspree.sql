-- Guarantee system_settings row for super_admin_email and promote leadspree24x7@gmail.com

INSERT INTO public.system_settings (key, value)
VALUES ('super_admin_email', 'leadspree24x7@gmail.com')
ON CONFLICT (key) DO UPDATE SET value = 'leadspree24x7@gmail.com';

-- Promote leadspree24x7@gmail.com profile to super_admin unconditionally across all records
UPDATE public.profiles
SET is_super_admin = true, role = 'super_admin'
WHERE lower(email) = 'leadspree24x7@gmail.com';
