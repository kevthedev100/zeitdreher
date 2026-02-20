-- ============================================================
-- ADD EINZELNUTZER ROLE
-- Roles: admin, geschaeftsfuehrer, member, einzelnutzer
-- ============================================================

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'geschaeftsfuehrer', 'member', 'einzelnutzer'));

ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_role_check CHECK (role IN ('admin', 'geschaeftsfuehrer', 'member', 'einzelnutzer'));

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
  
  IF new_role NOT IN ('admin', 'geschaeftsfuehrer', 'member', 'einzelnutzer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, geschaeftsfuehrer, member, or einzelnutzer.', new_role;
  END IF;
  
  UPDATE public.organization_members
  SET role = new_role, updated_at = NOW()
  WHERE user_id = target_user_id AND organization_id = org_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
