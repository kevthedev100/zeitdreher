-- Create areas table if not exists
CREATE TABLE IF NOT EXISTS areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fields table if not exists
CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_id UUID NOT NULL REFERENCES areas(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table if not exists
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id UUID NOT NULL REFERENCES fields(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_entries table if not exists
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  area_id UUID NOT NULL REFERENCES areas(id),
  field_id UUID NOT NULL REFERENCES fields(id),
  activity_id UUID NOT NULL REFERENCES activities(id),
  duration NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table if not exists (for profile data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'employee',
  department TEXT,
  position TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default areas if none exist
INSERT INTO areas (name, color, description)
SELECT 'Entwicklung', '#3B82F6', 'Software development tasks'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE name = 'Entwicklung');

INSERT INTO areas (name, color, description)
SELECT 'Design', '#8B5CF6', 'UI/UX design tasks'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE name = 'Design');

INSERT INTO areas (name, color, description)
SELECT 'Marketing', '#10B981', 'Marketing and promotion tasks'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE name = 'Marketing');

INSERT INTO areas (name, color, description)
SELECT 'Management', '#F59E0B', 'Project management tasks'
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE name = 'Management');

-- Insert default fields for Entwicklung area
DO $$
DECLARE
  entwicklung_id UUID;
BEGIN
  SELECT id INTO entwicklung_id FROM areas WHERE name = 'Entwicklung' LIMIT 1;
  
  IF entwicklung_id IS NOT NULL THEN
    -- Insert Frontend field if it doesn't exist
    INSERT INTO fields (area_id, name, description)
    SELECT entwicklung_id, 'Frontend', 'Frontend development tasks'
    WHERE NOT EXISTS (SELECT 1 FROM fields WHERE area_id = entwicklung_id AND name = 'Frontend');
    
    -- Insert Backend field if it doesn't exist
    INSERT INTO fields (area_id, name, description)
    SELECT entwicklung_id, 'Backend', 'Backend development tasks'
    WHERE NOT EXISTS (SELECT 1 FROM fields WHERE area_id = entwicklung_id AND name = 'Backend');
    
    -- Insert Testing field if it doesn't exist
    INSERT INTO fields (area_id, name, description)
    SELECT entwicklung_id, 'Testing', 'QA and testing tasks'
    WHERE NOT EXISTS (SELECT 1 FROM fields WHERE area_id = entwicklung_id AND name = 'Testing');
  END IF;
END $$;

-- Insert default activities for Frontend field
DO $$
DECLARE
  frontend_id UUID;
BEGIN
  SELECT f.id INTO frontend_id FROM fields f
  JOIN areas a ON f.area_id = a.id
  WHERE a.name = 'Entwicklung' AND f.name = 'Frontend'
  LIMIT 1;
  
  IF frontend_id IS NOT NULL THEN
    -- Insert React Development activity if it doesn't exist
    INSERT INTO activities (field_id, name, description)
    SELECT frontend_id, 'React Development', 'React component development'
    WHERE NOT EXISTS (SELECT 1 FROM activities WHERE field_id = frontend_id AND name = 'React Development');
    
    -- Insert CSS/Styling activity if it doesn't exist
    INSERT INTO activities (field_id, name, description)
    SELECT frontend_id, 'CSS/Styling', 'CSS and styling tasks'
    WHERE NOT EXISTS (SELECT 1 FROM activities WHERE field_id = frontend_id AND name = 'CSS/Styling');
  END IF;
END $$;

-- Enable realtime for all tables (only if not already added)
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'areas'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.areas';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fields'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.fields';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activities'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.activities';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'time_entries'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'users'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.users';
  END IF;
END $;
