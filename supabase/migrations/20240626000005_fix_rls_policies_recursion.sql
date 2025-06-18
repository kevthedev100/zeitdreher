-- Fix RLS policies to prevent infinite recursion
-- This migration addresses the circular dependency issues in organization_members policies

-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "Organization members viewable by org members" ON public.organization_members;
DROP POLICY IF EXISTS "Organization members manageable by admins" ON public.organization_members;
DROP POLICY IF EXISTS "Organizations viewable by members" ON public.organizations;
DROP POLICY IF EXISTS "Organizations manageable by admins" ON public.organizations;

-- Create simplified, non-recursive policies for organization_members
CREATE POLICY "Users can view their own org memberships"
  ON public.organization_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = organization_members.user_id
      AND u.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage org memberships"
  ON public.organization_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()::text
      AND u.role = 'admin'
    )
  );

-- Create simplified policies for organizations
CREATE POLICY "Users can view orgs they belong to"
  ON public.organizations
  FOR SELECT
  USING (
    -- Check if user is a member of this organization
    id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE u.user_id = auth.uid()::text
      AND om.is_active = TRUE
    )
  );

CREATE POLICY "Admins can manage organizations"
  ON public.organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()::text
      AND u.role = 'admin'
    )
    OR
    -- Organization creators can manage their organizations
    created_by IN (
      SELECT u.id FROM public.users u
      WHERE u.user_id = auth.uid()::text
    )
  );

-- Update team_hierarchies policies to be more efficient
DROP POLICY IF EXISTS "Team hierarchies viewable by org members" ON public.team_hierarchies;
DROP POLICY IF EXISTS "Team hierarchies manageable by admins and managers" ON public.team_hierarchies;

CREATE POLICY "Team hierarchies viewable by org members"
  ON public.team_hierarchies
  FOR SELECT
  USING (
    -- Users can see hierarchies in organizations they belong to
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE u.user_id = auth.uid()::text
      AND om.is_active = TRUE
    )
  );

CREATE POLICY "Team hierarchies manageable by admins and managers"
  ON public.team_hierarchies
  FOR ALL
  USING (
    -- Admins can manage all hierarchies
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()::text
      AND u.role = 'admin'
    )
    OR
    -- Managers can manage hierarchies in their organizations
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE u.user_id = auth.uid()::text
      AND om.role IN ('admin', 'manager')
      AND om.is_active = TRUE
    )
  );

-- Update teams policies
DROP POLICY IF EXISTS "Teams viewable by org members" ON public.teams;
DROP POLICY IF EXISTS "Teams manageable by admins" ON public.teams;

CREATE POLICY "Teams viewable by org members"
  ON public.teams
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE u.user_id = auth.uid()::text
      AND om.is_active = TRUE
    )
  );

CREATE POLICY "Teams manageable by admins and managers"
  ON public.teams
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()::text
      AND u.role = 'admin'
    )
    OR
    organization_id IN (
      SELECT om.organization_id 
      FROM public.organization_members om
      JOIN public.users u ON u.id = om.user_id
      WHERE u.user_id = auth.uid()::text
      AND om.role IN ('admin', 'manager')
      AND om.is_active = TRUE
    )
  );
