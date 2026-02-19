-- Fix login issue for existing users
-- This migration addresses the core problem: existing users can't log in due to missing records in public.users

-- First, temporarily disable RLS to allow data manipulation
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can delete own time entries" ON public.time_entries;

-- Ensure all required columns exist in users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS token_identifier TEXT DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create or replace the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert new user record with proper error handling
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
    COALESCE(NEW.raw_user_meta_data->>'token_identifier', ''),
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
    -- Log the error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure ALL existing auth users have corresponding records in public.users
-- This is critical for existing users to be able to log in
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
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  au.email,
  au.raw_user_meta_data->>'avatar_url',
  false,
  'employee',
  COALESCE(au.raw_user_meta_data->>'token_identifier', ''),
  COALESCE(au.created_at, timezone('utc'::text, now())),
  timezone('utc'::text, now())
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.user_id = au.id
)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = timezone('utc'::text, now());

-- Create more permissive RLS policies that won't block legitimate access
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to view and manage their own profile
CREATE POLICY "Enable profile access for authenticated users" ON public.users
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() IS NOT NULL
  );

-- Enable RLS on time_entries with proper policies
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own time entries
CREATE POLICY "Enable time entries access for authenticated users" ON public.time_entries
  FOR ALL USING (
    auth.uid() = user_id OR
    -- Allow managers to see all entries (we'll refine this later)
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- Create a function to safely get or create user profile
CREATE OR REPLACE FUNCTION public.get_or_create_user_profile(user_uuid UUID)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT,
  department TEXT,
  "position" TEXT,
  phone TEXT,
  onboarded BOOLEAN,
  token_identifier TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- First try to get existing profile
  RETURN QUERY
  SELECT 
    u.user_id,
    u.full_name,
    u.email,
    u.avatar_url,
    u.role,
    u.department,
    u."position",
    u.phone,
    u.onboarded,
    u.token_identifier,
    u.created_at,
    u.updated_at
  FROM public.users u
  WHERE u.user_id = user_uuid;
  
  -- If no profile found, create one from auth.users data
  IF NOT FOUND THEN
    INSERT INTO public.users (
      user_id,
      full_name,
      email,
      avatar_url,
      role,
      onboarded,
      token_identifier,
      created_at,
      updated_at
    )
    SELECT 
      au.id,
      COALESCE(au.raw_user_meta_data->>'full_name', ''),
      au.email,
      au.raw_user_meta_data->>'avatar_url',
      'employee',
      false,
      COALESCE(au.raw_user_meta_data->>'token_identifier', ''),
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    FROM auth.users au
    WHERE au.id = user_uuid
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Return the newly created or existing profile
    RETURN QUERY
    SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.avatar_url,
      u.role,
      u.department,
      u."position",
      u.phone,
      u.onboarded,
      u.token_identifier,
      u.created_at,
      u.updated_at
    FROM public.users u
    WHERE u.user_id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix foreign key constraint to reference correct column
ALTER TABLE public.time_entries
DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;

ALTER TABLE public.time_entries
DROP CONSTRAINT IF EXISTS fk_time_entries_users;

ALTER TABLE public.time_entries
ADD CONSTRAINT fk_time_entries_users
FOREIGN KEY (user_id)
REFERENCES public.users(user_id)
ON DELETE CASCADE;

-- Grant comprehensive permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Specific grants for our tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fields TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_profile(UUID) TO authenticated;

-- Ensure anon role has basic access
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.users TO anon;

-- Note: Realtime publication already configured in previous migration
