-- ============================================================
-- ROLE SIMPLIFICATION: admin + member only
-- Drops: teams, team_members_new, team_hierarchies, 
--         team_activities, team_invitations, team_members
-- Simplifies: users.role, organization_members.role
-- ============================================================

-- 1. Drop views that depend on removed tables
DROP VIEW IF EXISTS public.manager_team_performance CASCADE;
DROP VIEW IF EXISTS public.organization_hierarchy CASCADE;

-- 2. Drop functions that reference removed tables/roles
DROP FUNCTION IF EXISTS public.get_user_team_members(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_user_manage(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.change_user_role(UUID, TEXT, UUID) CASCADE;

-- 3. Remove tables from realtime publication (ignore errors if not present)
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.team_hierarchies; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.teams; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.team_members_new; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.team_activities; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.team_invitations; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.team_members; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 4. Drop unnecessary tables
DROP TABLE IF EXISTS public.team_members_new CASCADE;
DROP TABLE IF EXISTS public.team_hierarchies CASCADE;
DROP TABLE IF EXISTS public.team_activities CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.team_invitations CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;

-- 5. Migrate existing roles to admin/member
UPDATE public.users SET role = 'admin' WHERE role IN ('manager', 'admin_member');
UPDATE public.users SET role = 'member' WHERE role IN ('employee', 'member');
UPDATE public.users SET role = 'admin' WHERE role NOT IN ('admin', 'member');

UPDATE public.organization_members SET role = 'admin' WHERE role IN ('manager', 'admin_member');
UPDATE public.organization_members SET role = 'member' WHERE role NOT IN ('admin', 'member') OR role IS NULL;

-- 6. Update CHECK constraints on users.role
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'member'));

-- 7. Update CHECK constraints on organization_members.role
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_role_check CHECK (role IN ('admin', 'member'));

-- 8. Set default role to 'member' for new users
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'member';

-- 9. Recreate simplified helper functions

-- get_user_role_in_org: unchanged but ensure it exists
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

-- Simplified change_user_role: only admin/member
CREATE OR REPLACE FUNCTION change_user_role(
  target_user_id UUID,
  new_role TEXT,
  org_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  SELECT get_user_role_in_org(auth.uid(), org_id) INTO current_user_role;
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  IF new_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin or member.', new_role;
  END IF;
  
  UPDATE public.organization_members
  SET role = new_role, updated_at = NOW()
  WHERE user_id = target_user_id AND organization_id = org_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Simplified organization members view
CREATE OR REPLACE VIEW organization_hierarchy AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  u.id as user_id,
  u.full_name as user_name,
  u.email as user_email,
  om.role as user_role
FROM public.organizations o
JOIN public.organization_members om ON om.organization_id = o.id
JOIN public.users u ON u.id = om.user_id
WHERE om.is_active = TRUE AND o.is_active = TRUE;
