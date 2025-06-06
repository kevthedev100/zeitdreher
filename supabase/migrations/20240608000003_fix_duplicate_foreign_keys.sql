-- Fix duplicate foreign key constraints that are causing Supabase embed errors
-- Remove duplicate foreign key constraints while keeping the necessary ones

-- Drop duplicate foreign key constraints from time_entries table
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_area_id_fkey;
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_field_id_fkey;
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_activity_id_fkey;
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;

-- Drop duplicate foreign key constraints from other tables
ALTER TABLE areas DROP CONSTRAINT IF EXISTS areas_user_id_fkey;
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_area_id_fkey;
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_user_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_field_id_fkey;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_user_id_fkey;

-- Drop any existing named foreign key constraints that might conflict
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_areas;
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_fields;
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_activities;
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_users;
ALTER TABLE areas DROP CONSTRAINT IF EXISTS fk_areas_users;
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fk_fields_areas;
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fk_fields_users;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS fk_activities_fields;
ALTER TABLE activities DROP CONSTRAINT IF EXISTS fk_activities_users;

-- Now create the proper foreign key constraints
-- For time_entries table
ALTER TABLE time_entries 
ADD CONSTRAINT fk_time_entries_areas 
FOREIGN KEY (area_id) REFERENCES areas(id);

ALTER TABLE time_entries 
ADD CONSTRAINT fk_time_entries_fields 
FOREIGN KEY (field_id) REFERENCES fields(id);

ALTER TABLE time_entries 
ADD CONSTRAINT fk_time_entries_activities 
FOREIGN KEY (activity_id) REFERENCES activities(id);

-- For the user relationship, we need to check which table structure is being used
-- If users table exists with user_id column, use that; otherwise use auth.users
DO $$
BEGIN
    -- Check if public.users table exists and has user_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'user_id'
    ) THEN
        -- Use public.users(user_id) - this has a unique constraint
        ALTER TABLE time_entries 
        ADD CONSTRAINT fk_time_entries_users 
        FOREIGN KEY (user_id) REFERENCES users(user_id);
    ELSE
        -- Fallback to auth.users(id) if public.users doesn't exist
        ALTER TABLE time_entries 
        ADD CONSTRAINT fk_time_entries_users 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If there's still an issue, just log it and continue
        RAISE WARNING 'Could not create user foreign key constraint: %', SQLERRM;
END $$;

-- Create foreign key constraints for other tables (these don't reference users)
ALTER TABLE fields 
ADD CONSTRAINT fk_fields_areas 
FOREIGN KEY (area_id) REFERENCES areas(id);

ALTER TABLE activities 
ADD CONSTRAINT fk_activities_fields 
FOREIGN KEY (field_id) REFERENCES fields(id);

-- Only add user foreign keys to areas, fields, and activities if they have user_id columns
DO $$
BEGIN
    -- Check if areas table has user_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'areas' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE areas 
        ADD CONSTRAINT fk_areas_users 
        FOREIGN KEY (user_id) REFERENCES users(user_id);
    END IF;
    
    -- Check if fields table has user_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'fields' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE fields 
        ADD CONSTRAINT fk_fields_users 
        FOREIGN KEY (user_id) REFERENCES users(user_id);
    END IF;
    
    -- Check if activities table has user_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE activities 
        ADD CONSTRAINT fk_activities_users 
        FOREIGN KEY (user_id) REFERENCES users(user_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Could not create some user foreign key constraints: %', SQLERRM;
END $$;
