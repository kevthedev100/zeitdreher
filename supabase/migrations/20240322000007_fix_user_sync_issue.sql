-- Fix the time_entries status check constraint to include 'active' status
ALTER TABLE IF EXISTS public.time_entries
DROP CONSTRAINT IF EXISTS time_entries_status_check;

ALTER TABLE IF EXISTS public.time_entries
ADD CONSTRAINT time_entries_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'active'));

-- Ensure the handle_new_user function is properly creating users
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
