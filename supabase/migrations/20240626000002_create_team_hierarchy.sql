-- Step 2: Create team hierarchy system
-- This enables manager-team member relationships within organizations

-- Create team_hierarchies table for manager-member relationships
CREATE TABLE IF NOT EXISTS public.team_hierarchies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  -- Prevent self-assignment and duplicate relationships
  CHECK (manager_id != member_id),
  UNIQUE(organization_id, manager_id, member_id)
);

-- Create teams table for grouping members under managers
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID NOT NULL REFERENCES public.users(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(organization_id, name)
);

-- Create team_members_new table (will replace old team_members)
CREATE TABLE IF NOT EXISTS public.team_members_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES public.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(team_id, member_id)
);

-- Enable RLS
ALTER TABLE public.team_hierarchies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members_new ENABLE ROW LEVEL SECURITY;

-- Policies for team_hierarchies
DROP POLICY IF EXISTS "Team hierarchies viewable by org members" ON public.team_hierarchies;
CREATE POLICY "Team hierarchies viewable by org members"
  ON public.team_hierarchies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE om.organization_id = team_hierarchies.organization_id
      AND u.user_id = auth.uid()::text
      AND om.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Team hierarchies manageable by admins and managers" ON public.team_hierarchies;
CREATE POLICY "Team hierarchies manageable by admins and managers"
  ON public.team_hierarchies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE om.organization_id = team_hierarchies.organization_id
      AND u.user_id = auth.uid()::text
      AND om.role IN ('admin', 'manager')
      AND om.is_active = TRUE
    )
  );

-- Policies for teams
DROP POLICY IF EXISTS "Teams viewable by org members" ON public.teams;
CREATE POLICY "Teams viewable by org members"
  ON public.teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE om.organization_id = teams.organization_id
      AND u.user_id = auth.uid()::text
      AND om.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Teams manageable by admins" ON public.teams;
CREATE POLICY "Teams manageable by admins"
  ON public.teams
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE om.organization_id = teams.organization_id
      AND u.user_id = auth.uid()::text
      AND om.role = 'admin'
      AND om.is_active = TRUE
    )
  );

-- Policies for team_members_new
DROP POLICY IF EXISTS "Team members viewable by team and managers" ON public.team_members_new;
CREATE POLICY "Team members viewable by team and managers"
  ON public.team_members_new
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.organization_members om ON om.organization_id = t.organization_id
      JOIN public.users u ON u.id = om.user_id
      WHERE t.id = team_members_new.team_id
      AND u.user_id = auth.uid()::text
      AND (
        om.role IN ('admin', 'manager') OR
        team_members_new.member_id = u.id
      )
      AND om.is_active = TRUE
    )
  );

-- Enable realtime (with error handling for existing tables)
DO $
BEGIN
  -- Add team_hierarchies to realtime if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_hierarchies;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, skip
      NULL;
  END;
  
  -- Add teams to realtime if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, skip
      NULL;
  END;
  
  -- Add team_members_new to realtime if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members_new;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, skip
      NULL;
  END;
END $;