-- Fix RLS policies for the users table to allow the service role to insert records

-- First, ensure the handle_new_user function is properly creating users with ON CONFLICT DO NOTHING
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    user_id,
    email,
    name,
    full_name,
    avatar_url,
    token_identifier,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  ) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies for users table
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Create policies that allow users to view their own data
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
USING (auth.uid()::text = user_id);

-- Create policy to allow the service role to insert/update users
-- This is needed for the handle_new_user trigger function
CREATE POLICY "Service role can manage users"
ON public.users
FOR ALL
USING (true)
WITH CHECK (true);
