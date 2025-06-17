-- Fix users table schema to ensure consistency
-- Drop existing users table and recreate with proper schema

-- First, drop dependent foreign key constraints
ALTER TABLE IF EXISTS public.time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;

-- Drop the existing users table
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with proper schema
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text UNIQUE NOT NULL,
    email text,
    full_name text,
    name text,
    role text DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
    department text,
    position text,
    phone text,
    avatar_url text,
    onboarded boolean DEFAULT false,
    token_identifier text,
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Recreate the foreign key constraint for time_entries
ALTER TABLE public.time_entries 
ADD CONSTRAINT time_entries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_user_id_idx ON public.users(user_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated inserts" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated selects" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated updates" ON public.users;

-- Create RLS policies for authenticated users and service role
CREATE POLICY "Allow authenticated and service role inserts" ON public.users
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "Allow authenticated and service role selects" ON public.users
  FOR SELECT
  TO authenticated, service_role
  USING (true);

CREATE POLICY "Allow authenticated and service role updates" ON public.users
  FOR UPDATE
  TO authenticated, service_role
  USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO service_role;
GRANT ALL ON public.users TO postgres;

-- Enable realtime
ALTER TABLE public.users REPLICA IDENTITY FULL;
alter publication supabase_realtime add table users;
