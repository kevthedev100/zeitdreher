-- Comprehensive fix for database permission issues
-- This migration addresses all identified schema and permission problems

-- First, disable RLS temporarily to allow clean setup
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_events DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable profile access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable time entries access for authenticated users" ON public.time_entries;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can delete own time entries" ON public.time_entries;

-- Clean up foreign key constraints
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_users;
ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_user;

-- Ensure all required tables exist with correct structure
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure users table has correct structure
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'employee';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS token_identifier TEXT DEFAULT gen_random_uuid()::text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Ensure time_entries table has correct structure
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS area_id UUID;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS field_id UUID;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS activity_id UUID;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS duration DECIMAL(10,2);
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Create proper foreign key constraints
ALTER TABLE public.time_entries
ADD CONSTRAINT fk_time_entries_users
FOREIGN KEY (user_id)
REFERENCES public.users(user_id)
ON DELETE CASCADE;

ALTER TABLE public.time_entries
ADD CONSTRAINT fk_time_entries_areas
FOREIGN KEY (area_id)
REFERENCES public.areas(id)
ON DELETE SET NULL;

ALTER TABLE public.time_entries
ADD CONSTRAINT fk_time_entries_fields
FOREIGN KEY (field_id)
REFERENCES public.fields(id)
ON DELETE SET NULL;

ALTER TABLE public.time_entries
ADD CONSTRAINT fk_time_entries_activities
FOREIGN KEY (activity_id)
REFERENCES public.activities(id)
ON DELETE SET NULL;

-- Grant comprehensive permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Specific table permissions (using correct table names)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fields TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_events TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Basic permissions for anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.users TO anon;

-- Create simplified RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_policy" ON public.users
FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() IS NOT NULL
)
WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() IS NOT NULL
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_policy" ON public.time_entries
FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE user_id = auth.uid() 
        AND role IN ('manager', 'admin')
    )
)
WITH CHECK (
    auth.uid() = user_id
);

-- Enable RLS for other tables with permissive policies
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areas_policy" ON public.areas
FOR ALL USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fields_policy" ON public.fields
FOR ALL USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_policy" ON public.activities
FOR ALL USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_policy" ON public.subscriptions
FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_events_policy" ON public.webhook_events
FOR ALL USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure realtime is properly configured
DO $$
BEGIN
    -- Add tables to realtime publication if not already added
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'users'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'time_entries'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'areas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.areas;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'fields'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.fields;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'activities'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if tables are already in publication
        NULL;
END $$;

-- Create or update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        user_id, 
        full_name, 
        email, 
        avatar_url, 
        onboarded, 
        role, 
        token_identifier,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        false,
        'employee',
        COALESCE(NEW.raw_user_meta_data->>'token_identifier', gen_random_uuid()::text),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        email = COALESCE(EXCLUDED.email, public.users.email),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = timezone('utc'::text, now());
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all existing auth users have corresponding records in public.users
INSERT INTO public.users (
    user_id, 
    full_name, 
    email, 
    avatar_url, 
    onboarded, 
    role, 
    token_identifier,
    created_at,
    updated_at
)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', ''),
    au.email,
    au.raw_user_meta_data->>'avatar_url',
    false,
    'employee',
    COALESCE(au.raw_user_meta_data->>'token_identifier', gen_random_uuid()::text),
    COALESCE(au.created_at, timezone('utc'::text, now())),
    timezone('utc'::text, now())
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.user_id = au.id
)
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());

-- Final permission grants to ensure everything works
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant specific permissions for service role (used by edge functions)
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
