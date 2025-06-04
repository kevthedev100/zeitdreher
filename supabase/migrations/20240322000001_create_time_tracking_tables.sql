-- Time tracking tables for Zeitdreher platform

-- Areas table (top level categories like Development, Design, etc.)
CREATE TABLE IF NOT EXISTS public.areas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    color text DEFAULT '#3B82F6',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fields table (subcategories within areas like Frontend, Backend, etc.)
CREATE TABLE IF NOT EXISTS public.fields (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    area_id uuid REFERENCES public.areas(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activities table (specific activities within fields like React Development, etc.)
CREATE TABLE IF NOT EXISTS public.activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    field_id uuid REFERENCES public.fields(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Time entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id) ON DELETE CASCADE,
    area_id uuid REFERENCES public.areas(id),
    field_id uuid REFERENCES public.fields(id),
    activity_id uuid REFERENCES public.activities(id),
    duration decimal(5,2) NOT NULL CHECK (duration > 0),
    date date NOT NULL,
    description text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS areas_name_idx ON public.areas(name);
CREATE INDEX IF NOT EXISTS fields_area_id_idx ON public.fields(area_id);
CREATE INDEX IF NOT EXISTS activities_field_id_idx ON public.activities(field_id);
CREATE INDEX IF NOT EXISTS time_entries_user_id_idx ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS time_entries_date_idx ON public.time_entries(date);
CREATE INDEX IF NOT EXISTS time_entries_area_id_idx ON public.time_entries(area_id);

-- Insert default data
INSERT INTO public.areas (name, description, color) VALUES
    ('Entwicklung', 'Software development activities', '#3B82F6'),
    ('Design', 'UI/UX design and creative work', '#8B5CF6'),
    ('Marketing', 'Marketing and promotional activities', '#10B981'),
    ('Management', 'Management and administrative tasks', '#F59E0B')
ON CONFLICT DO NOTHING;

-- Get area IDs for inserting fields
DO $$
DECLARE
    dev_area_id uuid;
    design_area_id uuid;
    marketing_area_id uuid;
    mgmt_area_id uuid;
    frontend_field_id uuid;
    backend_field_id uuid;
    testing_field_id uuid;
BEGIN
    -- Get area IDs
    SELECT id INTO dev_area_id FROM public.areas WHERE name = 'Entwicklung';
    SELECT id INTO design_area_id FROM public.areas WHERE name = 'Design';
    SELECT id INTO marketing_area_id FROM public.areas WHERE name = 'Marketing';
    SELECT id INTO mgmt_area_id FROM public.areas WHERE name = 'Management';
    
    -- Insert fields for Development
    INSERT INTO public.fields (area_id, name, description) VALUES
        (dev_area_id, 'Frontend', 'Frontend development work'),
        (dev_area_id, 'Backend', 'Backend development work'),
        (dev_area_id, 'Testing', 'Testing and quality assurance')
    ON CONFLICT DO NOTHING;
    
    -- Insert fields for Design
    INSERT INTO public.fields (area_id, name, description) VALUES
        (design_area_id, 'UI Design', 'User interface design'),
        (design_area_id, 'UX Research', 'User experience research'),
        (design_area_id, 'Prototyping', 'Creating prototypes and mockups')
    ON CONFLICT DO NOTHING;
    
    -- Insert fields for Marketing
    INSERT INTO public.fields (area_id, name, description) VALUES
        (marketing_area_id, 'Content Creation', 'Creating marketing content'),
        (marketing_area_id, 'Social Media', 'Social media management'),
        (marketing_area_id, 'Campaigns', 'Marketing campaigns')
    ON CONFLICT DO NOTHING;
    
    -- Insert fields for Management
    INSERT INTO public.fields (area_id, name, description) VALUES
        (mgmt_area_id, 'Planning', 'Project planning and strategy'),
        (mgmt_area_id, 'Meetings', 'Meetings and discussions'),
        (mgmt_area_id, 'Reporting', 'Reports and documentation')
    ON CONFLICT DO NOTHING;
    
    -- Get field IDs for activities
    SELECT id INTO frontend_field_id FROM public.fields WHERE name = 'Frontend' AND area_id = dev_area_id;
    SELECT id INTO backend_field_id FROM public.fields WHERE name = 'Backend' AND area_id = dev_area_id;
    SELECT id INTO testing_field_id FROM public.fields WHERE name = 'Testing' AND area_id = dev_area_id;
    
    -- Insert activities for Frontend
    INSERT INTO public.activities (field_id, name, description) VALUES
        (frontend_field_id, 'React Development', 'Working with React components'),
        (frontend_field_id, 'CSS/Styling', 'Styling and layout work'),
        (frontend_field_id, 'Performance Optimization', 'Optimizing frontend performance')
    ON CONFLICT DO NOTHING;
    
    -- Insert activities for Backend
    INSERT INTO public.activities (field_id, name, description) VALUES
        (backend_field_id, 'API Development', 'Creating and maintaining APIs'),
        (backend_field_id, 'Database Work', 'Database design and queries'),
        (backend_field_id, 'Deployment', 'Deployment and DevOps tasks')
    ON CONFLICT DO NOTHING;
    
    -- Insert activities for Testing
    INSERT INTO public.activities (field_id, name, description) VALUES
        (testing_field_id, 'Unit Testing', 'Writing and running unit tests'),
        (testing_field_id, 'Integration Testing', 'Integration and E2E testing'),
        (testing_field_id, 'Bug Fixing', 'Fixing bugs and issues')
    ON CONFLICT DO NOTHING;
END $$;

-- Enable realtime for all tables
alter publication supabase_realtime add table areas;
alter publication supabase_realtime add table fields;
alter publication supabase_realtime add table activities;
alter publication supabase_realtime add table time_entries;
