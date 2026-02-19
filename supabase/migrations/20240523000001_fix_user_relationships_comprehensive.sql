-- This migration fixes the inconsistencies between auth.users, public.users, and related tables
-- by ensuring proper relationships and consistent user_id types

-- First, ensure the public.users table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.users (
    user_id uuid PRIMARY KEY,
    full_name text,
    email text,
    token_identifier text,
    role text DEFAULT 'employee',
    onboarded boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- IMPORTANT: Synchronize users from auth.users to public.users BEFORE adding foreign key constraints
-- This ensures that all referenced users exist in the public.users table
INSERT INTO public.users (user_id, email, token_identifier, role, onboarded)
SELECT 
  id::uuid, 
  email, 
  encode(gen_random_bytes(16), 'hex'),
  'employee',
  false
FROM 
  auth.users
WHERE 
  id::uuid NOT IN (SELECT user_id FROM public.users WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Drop all policies on time_entries table
DO $$
BEGIN
    -- Drop all policies on time_entries table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'time_entries' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.time_entries';
    END LOOP;
END $$;

-- Fix the time_entries table to properly reference users
ALTER TABLE IF EXISTS public.time_entries
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  DROP CONSTRAINT IF EXISTS fk_time_entries_users,
  ADD CONSTRAINT fk_time_entries_users FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Recreate the policies for time_entries
CREATE POLICY "Users can view their own time entries"
  ON public.time_entries
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own time entries"
  ON public.time_entries
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own time entries"
  ON public.time_entries
  FOR UPDATE
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own time entries"
  ON public.time_entries
  FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- Drop all policies on areas table
DO $$
BEGIN
    -- Drop all policies on areas table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'areas' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.areas';
    END LOOP;
END $$;

-- Fix the areas table to properly reference users
ALTER TABLE IF EXISTS public.areas
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  DROP CONSTRAINT IF EXISTS areas_user_id_fkey,
  ADD CONSTRAINT areas_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Recreate the policies for areas
CREATE POLICY "Users can view their own areas"
  ON public.areas
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own areas"
  ON public.areas
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own areas"
  ON public.areas
  FOR UPDATE
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own areas"
  ON public.areas
  FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- Drop all policies on fields table
DO $$
BEGIN
    -- Drop all policies on fields table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'fields' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.fields';
    END LOOP;
END $$;

-- Fix the fields table to properly reference users
ALTER TABLE IF EXISTS public.fields
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  DROP CONSTRAINT IF EXISTS fields_user_id_fkey,
  ADD CONSTRAINT fields_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Recreate the policies for fields
CREATE POLICY "Users can view their own fields"
  ON public.fields
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own fields"
  ON public.fields
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own fields"
  ON public.fields
  FOR UPDATE
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own fields"
  ON public.fields
  FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- Drop all policies on activities table
DO $$
BEGIN
    -- Drop all policies on activities table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'activities' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.activities';
    END LOOP;
END $$;

-- Fix the activities table to properly reference users
ALTER TABLE IF EXISTS public.activities
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  DROP CONSTRAINT IF EXISTS activities_user_id_fkey,
  ADD CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Recreate the policies for activities
CREATE POLICY "Users can view their own activities"
  ON public.activities
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.activities
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.activities
  FOR UPDATE
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.activities
  FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- First, drop all policies on subscriptions table
DO $$
BEGIN
    -- Drop all policies on subscriptions table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subscriptions' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.subscriptions';
    END LOOP;
END $$;

-- Fix the subscriptions table to properly reference users
ALTER TABLE IF EXISTS public.subscriptions
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey,
  ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Recreate the policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.subscriptions
  FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- Create a trigger to automatically create a public.users record when a new auth.users record is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO public.users (user_id, full_name, email, token_identifier, role, onboarded)
  VALUES (
    NEW.id::uuid,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    encode(gen_random_bytes(16), 'hex'),
    'employee',
    false
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is properly configured for the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for the users table
DROP POLICY IF EXISTS "Users can view their own user data" ON public.users;
CREATE POLICY "Users can view their own user data"
  ON public.users
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

DROP POLICY IF EXISTS "Users can update their own user data" ON public.users;
CREATE POLICY "Users can update their own user data"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::uuid = user_id);

-- We already synchronized users at the beginning of the migration