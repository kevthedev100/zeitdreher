-- First, check if the foreign key already exists to avoid errors
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_time_entries_users' 
    AND table_name = 'time_entries'
  ) THEN
    -- Add the foreign key constraint if it doesn't exist
    ALTER TABLE public.time_entries
    ADD CONSTRAINT fk_time_entries_users
    FOREIGN KEY (user_id)
    REFERENCES public.users(user_id);
  END IF;
END $$;

-- Make sure the user_id column in time_entries is of the same type as user_id in users
ALTER TABLE public.time_entries
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Refresh the realtime publication to ensure it includes all necessary tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
