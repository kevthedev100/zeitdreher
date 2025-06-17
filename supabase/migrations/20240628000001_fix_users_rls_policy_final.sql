-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.users;
DROP POLICY IF EXISTS "Allow service role inserts" ON public.users;
DROP POLICY IF EXISTS "Allow anon inserts" ON public.users;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert their own data
CREATE POLICY "Allow authenticated inserts" ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow anonymous users to insert data (needed for sign-up)
CREATE POLICY "Allow anon inserts" ON public.users
FOR INSERT
TO anon
WITH CHECK (true);

-- Create policy to allow service role to insert any data
CREATE POLICY "Allow service role inserts" ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create policy to allow users to select their own data
DROP POLICY IF EXISTS "Allow users to select their own data" ON public.users;
CREATE POLICY "Allow users to select their own data" ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid()::text = user_id);

-- Create policy to allow service role to select any data
DROP POLICY IF EXISTS "Allow service role to select any data" ON public.users;
CREATE POLICY "Allow service role to select any data" ON public.users
FOR SELECT
TO service_role
USING (true);

-- Create policy to allow users to update their own data
DROP POLICY IF EXISTS "Allow users to update their own data" ON public.users;
CREATE POLICY "Allow users to update their own data" ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid()::text = user_id);

-- Create policy to allow service role to update any data
DROP POLICY IF EXISTS "Allow service role to update any data" ON public.users;
CREATE POLICY "Allow service role to update any data" ON public.users
FOR UPDATE
TO service_role
USING (true);
