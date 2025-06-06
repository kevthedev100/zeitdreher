-- Add name field to user creation process

-- Update the handle_new_user function to include the name field
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
        gen_random_uuid()::text,
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

-- Update the specific user record to include the name field
UPDATE public.users
SET name = full_name
WHERE name IS NULL AND full_name IS NOT NULL;

-- Ensure the specific user has a proper record with name field
INSERT INTO public.users (
    id,
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
    gen_random_uuid(),
    'b1621ed6-f83a-4b8d-95f3-edb493ee1421',
    'kev',
    'kev',
    'k.bahnmueller@videyou.de',
    false,
    'employee',
    gen_random_uuid()::text,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
)
ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    name = COALESCE(EXCLUDED.name, public.users.name),
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());