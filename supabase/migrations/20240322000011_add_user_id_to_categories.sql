-- Add user_id column to areas table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'areas' AND column_name = 'user_id') THEN
    ALTER TABLE areas ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add user_id column to fields table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fields' AND column_name = 'user_id') THEN
    ALTER TABLE fields ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add user_id column to activities table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'user_id') THEN
    ALTER TABLE activities ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Update existing records to associate with their proper user through relationships
UPDATE fields f
SET user_id = a.user_id
FROM areas a
WHERE f.area_id = a.id AND f.user_id IS NULL AND a.user_id IS NOT NULL;

UPDATE activities act
SET user_id = f.user_id
FROM fields f
WHERE act.field_id = f.id AND act.user_id IS NULL AND f.user_id IS NOT NULL;

-- Create RLS policies for user-specific access
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own areas" ON areas;
DROP POLICY IF EXISTS "Users can insert their own areas" ON areas;
DROP POLICY IF EXISTS "Users can update their own areas" ON areas;

DROP POLICY IF EXISTS "Users can view their own fields" ON fields;
DROP POLICY IF EXISTS "Users can insert their own fields" ON fields;
DROP POLICY IF EXISTS "Users can update their own fields" ON fields;

DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON activities;

-- Create policies for areas
CREATE POLICY "Users can view their own areas"
ON areas FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own areas"
ON areas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own areas"
ON areas FOR UPDATE
USING (auth.uid() = user_id);

-- Create policies for fields
CREATE POLICY "Users can view their own fields"
ON fields FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own fields"
ON fields FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fields"
ON fields FOR UPDATE
USING (auth.uid() = user_id);

-- Create policies for activities
CREATE POLICY "Users can view their own activities"
ON activities FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own activities"
ON activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
ON activities FOR UPDATE
USING (auth.uid() = user_id);
