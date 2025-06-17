-- Add is_active column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Fix RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated updates" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated selects" ON public.users;

-- Create new policies
CREATE POLICY "Allow authenticated inserts" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated updates" ON public.users
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated selects" ON public.users
FOR SELECT
TO authenticated
USING (true);
