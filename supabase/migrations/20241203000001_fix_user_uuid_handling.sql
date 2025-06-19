-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();

-- Create the function that handles new auth users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users using the UUID directly without casting
  INSERT INTO public.users (user_id, email, full_name, onboarded, role)
  VALUES (
    NEW.id, -- Use the UUID directly from auth.users.id
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    false,
    'employee'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that runs after a new auth user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- Create a function to manually create public users from auth users
CREATE OR REPLACE FUNCTION public.create_public_user_from_auth(auth_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  auth_user_record auth.users%ROWTYPE;
  success BOOLEAN;
BEGIN
  -- Get the auth user record
  SELECT * INTO auth_user_record FROM auth.users WHERE id = auth_user_id;
  
  IF auth_user_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insert into public.users using the UUID directly
  INSERT INTO public.users (user_id, email, full_name, onboarded, role)
  VALUES (
    auth_user_record.id,
    auth_user_record.email,
    COALESCE(auth_user_record.raw_user_meta_data->>'full_name', ''),
    false,
    'employee'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
    
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to sync all auth users to public users
CREATE OR REPLACE FUNCTION public.sync_all_auth_users_to_public()
RETURNS TABLE(user_id UUID, success BOOLEAN) AS $$
DECLARE
  auth_user_record auth.users%ROWTYPE;
  result BOOLEAN;
BEGIN
  FOR auth_user_record IN SELECT * FROM auth.users LOOP
    SELECT public.create_public_user_from_auth(auth_user_record.id) INTO result;
    user_id := auth_user_record.id;
    success := result;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
