-- Fix both the UUID comparison error and the gen_random_bytes error

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix the auth.set_last_sign_in_at function to handle UUID comparison correctly
CREATE OR REPLACE FUNCTION auth.set_last_sign_in_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET last_sign_in_at = now()
  WHERE id = NEW.user_id::uuid;
  RETURN NEW;
END;
$$;

-- Update the handle_new_user function to avoid using gen_random_bytes directly
-- and use a more reliable method for generating the token_identifier
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
        'employee',
        md5(random()::text || clock_timestamp()::text)::text,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        name = COALESCE(EXCLUDED.name, public.users.name),
        email = COALESCE(EXCLUDED.email, public.users.email),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = timezone('utc'::text, now());
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the auth process if user creation fails
        RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the specific user has a proper record with correct UUID typing
-- Use md5 instead of gen_random_uuid for token_identifier
INSERT INTO public.users (
    user_id, 
    full_name,
    name,
    email, 
    onboarded, 
    role, 
    token_identifier,
    created_at,
    updated_at
)
VALUES (
    'b1621ed6-f83a-4b8d-95f3-edb493ee1421'::UUID,
    'kev',
    'kev',
    'k.bahnmueller@videyou.de',
    false,
    'employee',
    md5(random()::text || clock_timestamp()::text)::text,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
)
ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    name = COALESCE(EXCLUDED.name, public.users.name),
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());

-- Update any existing users with NULL token_identifier
UPDATE public.users
SET token_identifier = md5(random()::text || clock_timestamp()::text)::text
WHERE token_identifier IS NULL;
