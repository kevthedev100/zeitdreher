-- First, ensure the users table has a proper primary key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_pkey' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Ensure user_id in users table has a unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_user_id_key' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Drop any existing foreign key constraints from time_entries to users to avoid duplicates
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_time_entries_users' AND conrelid = 'public.time_entries'::regclass
  ) THEN
    ALTER TABLE public.time_entries DROP CONSTRAINT fk_time_entries_users;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'time_entries_user_id_fkey' AND conrelid = 'public.time_entries'::regclass
  ) THEN
    ALTER TABLE public.time_entries DROP CONSTRAINT time_entries_user_id_fkey;
  END IF;
END $$;

-- Ensure the user_id column in time_entries is of type UUID
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_entries' AND column_name = 'user_id' 
    AND table_schema = 'public' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.time_entries ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
  END IF;
END $$;

-- Create the foreign key constraint from time_entries to users
ALTER TABLE public.time_entries
  ADD CONSTRAINT fk_time_entries_users
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Update the realtime publication to include time_entries
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
  END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
