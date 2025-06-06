-- Add onboarded column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' 
                AND column_name = 'onboarded') THEN
    ALTER TABLE users ADD COLUMN onboarded BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Update existing users to be considered onboarded
UPDATE users SET onboarded = TRUE WHERE onboarded IS NULL;

-- Add this table to realtime publication only if it's not already a member
DO $ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END $;
