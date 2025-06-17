-- Drop conflicting RLS policies on users table
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated selects" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated updates" ON public.users;

-- Ensure is_active column exists with default true
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies for authenticated users and service role
CREATE POLICY "Allow authenticated inserts" ON public.users
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Allow authenticated selects" ON public.users
  FOR SELECT
  TO authenticated, service_role
  USING (true);

CREATE POLICY "Allow authenticated updates" ON public.users
  FOR UPDATE
  TO authenticated, service_role
  USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO service_role;

-- Enable realtime on users table
ALTER TABLE public.users REPLICA IDENTITY FULL;
