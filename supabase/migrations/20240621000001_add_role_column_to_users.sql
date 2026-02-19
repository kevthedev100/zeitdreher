-- Add role column to users table with admin as default
-- This migration ensures all new users are admins by default

-- Add role column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';

-- Update existing users without a role to be admins
UPDATE public.users 
SET role = 'admin' 
WHERE role IS NULL OR role = '';

-- Make role column NOT NULL with default
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'admin';

-- Update the handle_new_user function to ensure new users get admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        user_id, 
        full_name,
        name,
        email, 
        avatar_url, 
        onboarded, 
        role, 
        token_identifier,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        false,
        'admin', -- Ensure all new users are admins
        md5(random()::text || clock_timestamp()::text)::text,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        name = COALESCE(EXCLUDED.name, public.users.name),
        email = COALESCE(EXCLUDED.email, public.users.email),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        role = COALESCE(EXCLUDED.role, 'admin'), -- Ensure role is set to admin if not already set
        updated_at = timezone('utc'::text, now());
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the auth process if user creation fails
        RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index on role column for better performance
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);

-- Add comment to document the role system
COMMENT ON COLUMN public.users.role IS 'User role: admin, manager, or employee. Defaults to admin for new users.';
