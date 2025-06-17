-- Create a stored procedure to bypass RLS for user creation
CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_token_identifier TEXT,
  p_role TEXT DEFAULT 'employee',
  p_onboarded BOOLEAN DEFAULT false
) RETURNS void AS $$
BEGIN
  INSERT INTO public.users (
    user_id,
    full_name,
    name,
    email,
    role,
    token_identifier,
    onboarded,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_full_name,
    p_full_name,
    p_email,
    p_role,
    p_token_identifier,
    p_onboarded,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    name = COALESCE(EXCLUDED.name, public.users.name),
    email = COALESCE(EXCLUDED.email, public.users.email),
    updated_at = timezone('utc'::text, now());

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for %: %', p_user_id, SQLERRM;
    -- Re-raise the exception
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated, anon, service_role;

-- Create a more permissive policy for the users table
DROP POLICY IF EXISTS "allow_all_authenticated_users" ON public.users;

CREATE POLICY "allow_all_authenticated_users" ON public.users
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure the service_role can bypass RLS
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Grant all privileges to service_role
GRANT ALL PRIVILEGES ON public.users TO service_role;
