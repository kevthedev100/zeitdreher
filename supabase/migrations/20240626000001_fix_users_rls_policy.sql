-- Fix RLS policies for users table to allow Clerk webhook to insert users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.users;
DROP POLICY IF EXISTS "Allow service role inserts" ON public.users;

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated inserts" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow service role to insert users (for Clerk webhook)
CREATE POLICY "Allow service role inserts" ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);
