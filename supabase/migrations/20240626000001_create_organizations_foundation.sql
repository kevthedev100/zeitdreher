-- Step 1: Create organizations foundation
-- This creates the basic organization structure

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create organization_members junction table for flexible role assignments
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
  invited_by UUID REFERENCES public.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Basic policies for organizations
DROP POLICY IF EXISTS "Organizations viewable by members" ON public.organizations;
CREATE POLICY "Organizations viewable by members"
  ON public.organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE om.organization_id = organizations.id
      AND u.user_id = auth.uid()::text
      AND om.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Organizations manageable by admins" ON public.organizations;
CREATE POLICY "Organizations manageable by admins"
  ON public.organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE om.organization_id = organizations.id
      AND u.user_id = auth.uid()::text
      AND om.role = 'admin'
      AND om.is_active = TRUE
    )
  );

-- Policies for organization_members (fixed to avoid infinite recursion)
DROP POLICY IF EXISTS "Organization members viewable by org members" ON public.organization_members;
CREATE POLICY "Organization members viewable by org members"
  ON public.organization_members
  FOR SELECT
  USING (
    -- Users can see their own membership
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = organization_members.user_id
      AND u.user_id = auth.uid()::text
    )
    OR
    -- Admins and managers can see all members in their organization
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()::text
      AND u.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Organization members manageable by admins" ON public.organization_members;
CREATE POLICY "Organization members manageable by admins"
  ON public.organization_members
  FOR ALL
  USING (
    -- Only admins can manage organization members
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()::text
      AND u.role = 'admin'
    )
  );

-- Enable realtime (with error handling for existing tables)
DO $
BEGIN
  -- Add organizations to realtime if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, skip
      NULL;
  END;
  
  -- Add organization_members to realtime if not already added
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_members;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, skip
      NULL;
  END;
END $;