-- This migration fixes the row-level security policy for the users table
-- by allowing both authenticated users and the service role to insert new records

-- First, drop any existing policies on the users table to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow insert for service role" ON public.users;
DROP POLICY IF EXISTS "Allow insert for all" ON public.users;

-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies for the users table
-- Allow users to view their own data
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow service role to manage all users
CREATE POLICY "Service role can manage all users"
ON public.users
TO service_role
USING (true);

-- Allow insert for authenticated users (themselves)
CREATE POLICY "Allow insert for authenticated users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow insert for service role (any user)
CREATE POLICY "Allow insert for service role"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow insert for all users (needed for sign-up flow)
CREATE POLICY "Allow insert for all"
ON public.users
FOR INSERT
TO anon
WITH CHECK (true);

-- Ensure the is_active column exists with a default value
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.users TO anon;

-- Add realtime support
BEGIN;
  DROP publication IF EXISTS supabase_realtime;
  CREATE publication supabase_realtime;
COMMIT;
ALTER publication supabase_realtime ADD TABLE public.users;
