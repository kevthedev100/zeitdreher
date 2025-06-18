-- Create helper functions for the hierarchical system
-- These functions help with role management and team queries

-- Function to get user's role in a specific organization
CREATE OR REPLACE FUNCTION get_user_role_in_org(user_uuid TEXT, org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT om.role INTO user_role
  FROM public.organization_members om
  JOIN public.users u ON u.id = om.user_id
  WHERE u.user_id = user_uuid
  AND om.organization_id = org_id
  AND om.is_active = TRUE;
  
  RETURN COALESCE(user_role, 'none');
END;
$$;

-- Function to check if a user can manage another user
CREATE OR REPLACE FUNCTION can_user_manage(manager_uuid TEXT, target_user_id UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  manager_role TEXT;
  manager_id UUID;
BEGIN
  -- Get manager's role and ID
  SELECT u.id, om.role INTO manager_id, manager_role
  FROM public.users u
  JOIN public.organization_members om ON om.user_id = u.id
  WHERE u.user_id = manager_uuid
  AND om.organization_id = org_id
  AND om.is_active = TRUE;
  
  -- Admins can manage anyone
  IF manager_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Managers can manage their team members
  IF manager_role = 'manager' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.team_hierarchies th
      WHERE th.organization_id = org_id
      AND th.manager_id = manager_id
      AND th.member_id = target_user_id
      AND th.is_active = TRUE
    );
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Function to get team members for a manager
CREATE OR REPLACE FUNCTION get_user_team_members(user_uuid TEXT, org_id UUID)
RETURNS TABLE(
  member_id UUID,
  member_name TEXT,
  member_email TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  manager_id UUID;
BEGIN
  -- Get manager's ID
  SELECT u.id INTO manager_id
  FROM public.users u
  WHERE u.user_id = user_uuid;
  
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.email,
    om.joined_at
  FROM public.team_hierarchies th
  JOIN public.users u ON u.id = th.member_id
  JOIN public.organization_members om ON om.user_id = u.id AND om.organization_id = th.organization_id
  WHERE th.organization_id = org_id
  AND th.manager_id = manager_id
  AND th.is_active = TRUE
  AND om.is_active = TRUE;
END;
$$;

-- Function to change user role (with proper authorization)
CREATE OR REPLACE FUNCTION change_user_role(target_user_id UUID, new_role TEXT, org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role TEXT;
  current_user_id UUID;
BEGIN
  -- Validate role
  IF new_role NOT IN ('admin', 'manager', 'member') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- Get current user's role and ID
  SELECT u.id, om.role INTO current_user_id, current_user_role
  FROM public.users u
  JOIN public.organization_members om ON om.user_id = u.id
  WHERE u.user_id = auth.uid()::text
  AND om.organization_id = org_id
  AND om.is_active = TRUE;
  
  -- Only admins can change roles
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  -- Update the role
  UPDATE public.organization_members
  SET role = new_role, updated_at = NOW()
  WHERE user_id = target_user_id
  AND organization_id = org_id;
  
  RETURN TRUE;
END;
$$;

-- Create views for easier querying
DROP VIEW IF EXISTS organization_hierarchy;
CREATE VIEW organization_hierarchy AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  u.id as user_id,
  u.full_name as user_name,
  u.email as user_email,
  om.role as user_role,
  CASE 
    WHEN om.role = 'manager' THEN (
      SELECT COUNT(*) FROM team_hierarchies th 
      WHERE th.manager_id = u.id AND th.organization_id = o.id AND th.is_active = TRUE
    )
    ELSE 0
  END as team_size,
  CASE 
    WHEN om.role IN ('member', 'manager') THEN (
      SELECT u2.full_name FROM team_hierarchies th2
      JOIN users u2 ON u2.id = th2.manager_id
      WHERE th2.member_id = u.id AND th2.organization_id = o.id AND th2.is_active = TRUE
      LIMIT 1
    )
    ELSE NULL
  END as manager_name
FROM organizations o
JOIN organization_members om ON om.organization_id = o.id
JOIN users u ON u.id = om.user_id
WHERE o.is_active = TRUE AND om.is_active = TRUE;

-- Create view for manager team performance
DROP VIEW IF EXISTS manager_team_performance;
CREATE VIEW manager_team_performance AS
SELECT 
  th.organization_id,
  th.manager_id,
  m.full_name as manager_name,
  th.member_id,
  u.full_name as member_name,
  u.email as member_email,
  COUNT(te.id) as entries_this_month,
  COALESCE(SUM(te.duration), 0) as total_hours_this_month,
  CASE 
    WHEN COUNT(te.id) > 0 THEN COALESCE(SUM(te.duration), 0) / COUNT(te.id)
    ELSE 0
  END as avg_hours_per_entry
FROM team_hierarchies th
JOIN users u ON u.id = th.member_id
JOIN users m ON m.id = th.manager_id
LEFT JOIN time_entries te ON te.user_id::text = u.user_id 
  AND te.date >= date_trunc('month', CURRENT_DATE)
  AND te.status = 'active'
WHERE th.is_active = TRUE
GROUP BY th.organization_id, th.manager_id, m.full_name, th.member_id, u.full_name, u.email;
