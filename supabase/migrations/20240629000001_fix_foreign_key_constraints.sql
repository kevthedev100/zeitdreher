-- Fix foreign key constraint issues between time_entries and users tables
-- This migration ensures all user_id columns have consistent types

-- First, check and fix the time_entries table structure
DO $
BEGIN
    -- Drop existing foreign key constraints that might be causing issues
    ALTER TABLE IF EXISTS public.time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
    ALTER TABLE IF EXISTS public.time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_users;
    
    -- Ensure time_entries.user_id is text type to match users.user_id
    -- Check if the column exists and alter its type if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'time_entries' 
               AND column_name = 'user_id' 
               AND table_schema = 'public') THEN
        
        -- Convert user_id to text if it's not already
        ALTER TABLE public.time_entries 
        ALTER COLUMN user_id TYPE text USING user_id::text;
        
        -- Make sure it's not null
        ALTER TABLE public.time_entries 
        ALTER COLUMN user_id SET NOT NULL;
    END IF;
    
    -- Ensure users table has the correct structure
    -- The users.user_id should be text (Clerk user ID)
    -- The users.id should be uuid (internal primary key)
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'users' 
               AND table_schema = 'public') THEN
        
        -- Ensure user_id is text and unique
        ALTER TABLE public.users 
        ALTER COLUMN user_id TYPE text USING user_id::text;
        
        -- Add unique constraint if it doesn't exist (handle duplicate constraint error)
        BEGIN
            ALTER TABLE public.users 
            ADD CONSTRAINT users_user_id_unique UNIQUE (user_id);
        EXCEPTION
            WHEN duplicate_object THEN
                -- Constraint already exists, continue
                NULL;
        END;
        
    END IF;
    
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, continue
        NULL;
    WHEN others THEN
        -- Log the error but continue
        RAISE NOTICE 'Error during constraint modification: %', SQLERRM;
END $;

-- Now recreate the foreign key constraint with correct types (use the same name as previous migration)
DO $
BEGIN
    ALTER TABLE public.time_entries 
    ADD CONSTRAINT time_entries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, continue
        NULL;
END $;

-- Also fix other foreign key constraints to ensure they reference the correct columns
-- Areas, fields, and activities should reference their respective id columns (uuid)
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_areas;
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_fields;
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_activities;

-- Recreate with proper references
ALTER TABLE public.time_entries 
ADD CONSTRAINT fk_time_entries_areas 
FOREIGN KEY (area_id) REFERENCES public.areas(id) ON DELETE CASCADE;

ALTER TABLE public.time_entries 
ADD CONSTRAINT fk_time_entries_fields 
FOREIGN KEY (field_id) REFERENCES public.fields(id) ON DELETE CASCADE;

ALTER TABLE public.time_entries 
ADD CONSTRAINT fk_time_entries_activities 
FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_area_id ON public.time_entries(area_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_field_id ON public.time_entries(field_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_activity_id ON public.time_entries(activity_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries(date);

-- Update RLS policies for time_entries to work with the corrected foreign keys
DROP POLICY IF EXISTS "Users can view own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can delete own time entries" ON public.time_entries;

-- Create comprehensive RLS policies for time_entries
CREATE POLICY "Users can view own time entries" ON public.time_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own time entries" ON public.time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own time entries" ON public.time_entries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own time entries" ON public.time_entries
  FOR DELETE
  TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

-- Allow service role full access
CREATE POLICY "Service role full access to time entries" ON public.time_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT ALL ON public.time_entries TO service_role;

-- Enable realtime for time_entries
ALTER TABLE public.time_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
