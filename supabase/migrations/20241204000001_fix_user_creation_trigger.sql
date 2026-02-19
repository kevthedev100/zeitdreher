-- Drop existing trigger and functions to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the corrected function that handles both id and user_id fields
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  invitation_role text;
  user_role text := 'admin';  -- Default role
BEGIN
  -- Check if user was invited and get their intended role
  SELECT role INTO invitation_role
  FROM public.team_invitations
  WHERE email = NEW.email
    AND expires_at > NOW()
    AND accepted IS NOT TRUE
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If user has a pending invitation, use the invitation role
  IF invitation_role IS NOT NULL THEN
    user_role := invitation_role;
    
    -- Mark the invitation as accepted
    UPDATE public.team_invitations
    SET accepted = true
    WHERE email = NEW.email
      AND expires_at > NOW()
      AND accepted IS NOT TRUE;
  END IF;
  
  -- Insert into public.users with both id (UUID) and user_id (text) fields
  INSERT INTO public.users (
    id,        -- UUID primary key
    user_id,   -- text field with same UUID value
    email, 
    full_name, 
    onboarded, 
    role,
    token_identifier
  )
  VALUES (
    NEW.id,    -- UUID from auth.users.id
    NEW.id::text,  -- Same UUID converted to text
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false,
    user_role,  -- Use determined role (admin by default, or invitation role)
    gen_random_uuid()::text  -- Generate unique token identifier as text
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    token_identifier = COALESCE(public.users.token_identifier, EXCLUDED.token_identifier);
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create public user record: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that runs after a new auth user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- Update existing users that might have missing id values
-- This ensures any existing users have both fields properly set
UPDATE public.users 
SET id = user_id::uuid 
WHERE id IS NULL AND user_id IS NOT NULL;

-- Also ensure user_id is set for any records that might be missing it
UPDATE public.users 
SET user_id = id::text 
WHERE user_id IS NULL AND id IS NOT NULL;

-- Update existing users to have admin role and token identifier if missing
UPDATE public.users 
SET 
  role = 'admin',
  token_identifier = COALESCE(token_identifier, gen_random_uuid()::text)
WHERE role = 'employee' OR token_identifier IS NULL;