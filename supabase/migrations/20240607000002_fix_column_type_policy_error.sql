-- Fix the UUID vs text comparison issue without modifying columns used in policies

-- Instead of altering the column type directly, we'll use casting in our functions and policies

-- Update the verify_user_access function to use proper UUID casting
CREATE OR REPLACE FUNCTION public.verify_user_access()
RETURNS TABLE(user_exists BOOLEAN, can_access BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS(SELECT 1 FROM public.users WHERE user_id::uuid = auth.uid()::uuid) as user_exists,
        auth.uid() IS NOT NULL as can_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.verify_user_access() TO authenticated, anon;

-- Update the handle_new_user function to ensure proper UUID handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        user_id, 
        full_name, 
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

-- Ensure all UUID comparisons in RLS policies use explicit casting
DROP POLICY IF EXISTS "Users can view their own time entries" ON public.time_entries;
CREATE POLICY "Users can view their own time entries"
  ON public.time_entries
  FOR SELECT
  USING (auth.uid()::uuid = user_id::uuid);

DROP POLICY IF EXISTS "Users can insert their own time entries" ON public.time_entries;
CREATE POLICY "Users can insert their own time entries"
  ON public.time_entries
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id::uuid);

DROP POLICY IF EXISTS "Users can update their own time entries" ON public.time_entries;
CREATE POLICY "Users can update their own time entries"
  ON public.time_entries
  FOR UPDATE
  USING (auth.uid()::uuid = user_id::uuid);

DROP POLICY IF EXISTS "Users can delete their own time entries" ON public.time_entries;
CREATE POLICY "Users can delete their own time entries"
  ON public.time_entries
  FOR DELETE
  USING (auth.uid()::uuid = user_id::uuid);

-- Ensure the specific user has a proper record with correct UUID typing
INSERT INTO public.users (
    id,
    user_id, 
    full_name, 
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
    'k.bahnmueller@videyou.de',
    false,
    'employee',
    gen_random_uuid()::text,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
)
ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());