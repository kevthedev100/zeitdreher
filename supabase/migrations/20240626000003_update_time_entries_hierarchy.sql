-- Step 3: Update time entries for hierarchical access
-- This enables managers to view their team members' time entries

-- Add organization_id to time_entries for better organization
ALTER TABLE public.time_entries 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_organization_id ON public.time_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_org ON public.time_entries(user_id, organization_id);

-- Update existing time entries policies to support hierarchy
DROP POLICY IF EXISTS "Time entries are viewable by user and their managers" ON public.time_entries;
CREATE POLICY "Time entries are viewable by user and their managers"
  ON public.time_entries
  FOR SELECT
  USING (
    -- User can see their own entries
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = time_entries.user_id
      AND u.user_id = auth.uid()::text
    )
    OR
    -- Managers can see their team members' entries
    EXISTS (
      SELECT 1 FROM public.team_hierarchies th
      JOIN public.users manager ON manager.id = th.manager_id
      WHERE th.member_id = time_entries.user_id
      AND manager.user_id = auth.uid()::text
      AND th.is_active = TRUE
    )
    OR
    -- Organization admins can see all entries in their org
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE om.organization_id = time_entries.organization_id
      AND u.user_id = auth.uid()::text
      AND om.role = 'admin'
      AND om.is_active = TRUE
    )
  );

-- Policy for inserting time entries
DROP POLICY IF EXISTS "Time entries can be inserted by user" ON public.time_entries;
CREATE POLICY "Time entries can be inserted by user"
  ON public.time_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = time_entries.user_id
      AND u.user_id = auth.uid()::text
    )
  );

-- Policy for updating time entries
DROP POLICY IF EXISTS "Time entries can be updated by user and managers" ON public.time_entries;
CREATE POLICY "Time entries can be updated by user and managers"
  ON public.time_entries
  FOR UPDATE
  USING (
    -- User can update their own entries
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = time_entries.user_id
      AND u.user_id = auth.uid()::text
    )
    OR
    -- Managers can update their team members' entries
    EXISTS (
      SELECT 1 FROM public.team_hierarchies th
      JOIN public.users manager ON manager.id = th.manager_id
      WHERE th.member_id = time_entries.user_id
      AND manager.user_id = auth.uid()::text
      AND th.is_active = TRUE
    )
    OR
    -- Organization admins can update all entries in their org
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE om.organization_id = time_entries.organization_id
      AND u.user_id = auth.uid()::text
      AND om.role = 'admin'
      AND om.is_active = TRUE
    )
  );

-- Create function to automatically set organization_id for time entries
CREATE OR REPLACE FUNCTION set_time_entry_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Set organization_id based on user's primary organization
  IF NEW.organization_id IS NULL THEN
    SELECT om.organization_id INTO NEW.organization_id
    FROM public.organization_members om
    WHERE om.user_id = NEW.user_id
    AND om.is_active = TRUE
    ORDER BY om.created_at ASC
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set organization_id
DROP TRIGGER IF EXISTS trigger_set_time_entry_organization ON public.time_entries;
CREATE TRIGGER trigger_set_time_entry_organization
  BEFORE INSERT ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION set_time_entry_organization();