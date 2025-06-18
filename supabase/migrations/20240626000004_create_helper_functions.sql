-- Step 4: Create helper functions and views for the hierarchy system

-- Function to get user's role in an organization
CREATE OR REPLACE FUNCTION get_user_role_in_org(user_uuid UUID, org_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT om.role INTO user_role
  FROM public.organization_members om
  JOIN public.users u ON u.id = om.user_id
  WHERE u.user_id = user_uuid::text
  AND om.organization_id = org_id
  AND om.is_active = TRUE;
  
  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's team members (for managers)
CREATE OR REPLACE FUNCTION get_user_team_members(user_uuid UUID, org_id UUID)
RETURNS TABLE(
  member_id UUID,
  member_name TEXT,
  member_email TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as member_id,
    u.full_name as member_name,
    u.email as member_email,
    th.created_at as joined_at
  FROM public.team_hierarchies th
  JOIN public.users manager ON manager.id = th.manager_id
  JOIN public.users u ON u.id = th.member_id
  WHERE manager.user_id = user_uuid::text
  AND th.organization_id = org_id
  AND th.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage another user
CREATE OR REPLACE FUNCTION can_user_manage(manager_uuid UUID, target_user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  manager_role TEXT;
  is_team_member BOOLEAN := FALSE;
BEGIN
  -- Get manager's role
  SELECT get_user_role_in_org(manager_uuid, org_id) INTO manager_role;
  
  -- Admins can manage anyone in the organization
  IF manager_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Managers can manage their direct team members
  IF manager_role = 'manager' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.team_hierarchies th
      JOIN public.users manager ON manager.id = th.manager_id
      WHERE manager.user_id = manager_uuid::text
      AND th.member_id = target_user_id
      AND th.organization_id = org_id
      AND th.is_active = TRUE
    ) INTO is_team_member;
    
    RETURN is_team_member;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for organization hierarchy overview
CREATE OR REPLACE VIEW organization_hierarchy AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  u.id as user_id,
  u.full_name as user_name,
  u.email as user_email,
  om.role as user_role,
  manager.full_name as manager_name,
  COUNT(members.id) as team_size
FROM public.organizations o
JOIN public.organization_members om ON om.organization_id = o.id
JOIN public.users u ON u.id = om.user_id
LEFT JOIN public.team_hierarchies th ON th.member_id = u.id AND th.is_active = TRUE
LEFT JOIN public.users manager ON manager.id = th.manager_id
LEFT JOIN public.team_hierarchies members ON members.manager_id = u.id AND members.is_active = TRUE
WHERE om.is_active = TRUE AND o.is_active = TRUE
GROUP BY o.id, o.name, u.id, u.full_name, u.email, om.role, manager.full_name;

-- View for manager performance dashboard
CREATE OR REPLACE VIEW manager_team_performance AS
SELECT 
  th.organization_id,
  manager.id as manager_id,
  manager.full_name as manager_name,
  member.id as member_id,
  member.full_name as member_name,
  member.email as member_email,
  COALESCE(SUM(te.duration), 0) as total_hours_this_month,
  COUNT(te.id) as entries_this_month,
  COALESCE(AVG(te.duration), 0) as avg_hours_per_entry
FROM public.team_hierarchies th
JOIN public.users manager ON manager.id = th.manager_id
JOIN public.users member ON member.id = th.member_id
LEFT JOIN public.time_entries te ON te.user_id = member.id 
  AND te.date >= DATE_TRUNC('month', CURRENT_DATE)
  AND te.status = 'active'
WHERE th.is_active = TRUE
GROUP BY th.organization_id, manager.id, manager.full_name, member.id, member.full_name, member.email;

-- Function to change user role (with proper authorization)
CREATE OR REPLACE FUNCTION change_user_role(
  target_user_id UUID,
  new_role TEXT,
  org_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Check if current user can change roles
  SELECT get_user_role_in_org(auth.uid(), org_id) INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  -- Validate new role
  IF new_role NOT IN ('admin', 'manager', 'member') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- Update the role
  UPDATE public.organization_members
  SET role = new_role, updated_at = NOW()
  WHERE user_id = target_user_id AND organization_id = org_id;
  
  -- If changing from manager, remove team hierarchies
  IF new_role != 'manager' THEN
    UPDATE public.team_hierarchies
    SET is_active = FALSE, updated_at = NOW()
    WHERE manager_id = target_user_id AND organization_id = org_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;