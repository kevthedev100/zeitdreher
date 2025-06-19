-- Ensure the public.users table has the right permissions

-- Make sure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;

-- Create policies for users to manage their own data
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT manager_id FROM organization_hierarchy 
  WHERE user_id = auth.uid() OR 
  (SELECT role FROM users WHERE user_id = auth.uid()) = 'admin'
));

CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow insert for authenticated users"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = user_id OR 
  (SELECT role FROM users WHERE user_id = auth.uid()) = 'admin' OR 
  auth.uid() IN (SELECT manager_id FROM organization_hierarchy));

-- Make sure the email column is nullable to prevent errors
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
