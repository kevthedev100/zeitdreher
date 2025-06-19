-- Fix users table constraints to ensure proper handling of user_id

-- First, check if the users table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Make sure user_id is NOT NULL
    ALTER TABLE public.users ALTER COLUMN user_id SET NOT NULL;
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_user_id_key') THEN
      ALTER TABLE public.users ADD CONSTRAINT users_user_id_key UNIQUE (user_id);
    END IF;
    
    -- Make sure email can be NULL (for cases where auth.users doesn't have email)
    ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
  END IF;
END $$;

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
