-- Fix admin access to categories for time entry management
-- This allows admins and managers to view categories from other users when managing time entries

-- Update areas policies to allow admin/manager access
DROP POLICY IF EXISTS "Users can view their own areas" ON public.areas;
DROP POLICY IF EXISTS "Users can manage their own areas" ON public.areas;

CREATE POLICY "Users can view areas"
  ON public.areas
  FOR SELECT
  USING (
    -- Users can see their own areas
    user_id::uuid IN (
      SELECT u.id FROM public.users u
      WHERE u.user_id = auth.uid()
    )
    OR
    -- Admins can see all areas
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()
      AND u.role = 'admin'
    )
    OR
    -- Managers can see areas of their team members
    user_id::uuid IN (
      SELECT th.member_id
      FROM public.team_hierarchies th
      JOIN public.users u ON u.id = th.manager_id
      WHERE u.user_id = auth.uid()
      AND th.is_active = TRUE
    )
  );

CREATE POLICY "Users can manage their own areas"
  ON public.areas
  FOR ALL
  USING (
    user_id::uuid IN (
      SELECT u.id FROM public.users u
      WHERE u.user_id = auth.uid()
    )
  );

-- Update fields policies to allow admin/manager access
DROP POLICY IF EXISTS "Users can view their own fields" ON public.fields;
DROP POLICY IF EXISTS "Users can manage their own fields" ON public.fields;

CREATE POLICY "Users can view fields"
  ON public.fields
  FOR SELECT
  USING (
    user_id::uuid IN (
      SELECT u.id FROM public.users u
      WHERE u.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()
      AND u.role = 'admin'
    )
    OR
    user_id::uuid IN (
      SELECT th.member_id
      FROM public.team_hierarchies th
      JOIN public.users u ON u.id = th.manager_id
      WHERE u.user_id = auth.uid()
      AND th.is_active = TRUE
    )
  );

CREATE POLICY "Users can manage their own fields"
  ON public.fields
  FOR ALL
  USING (
    user_id::uuid IN (
      SELECT u.id FROM public.users u
      WHERE u.user_id = auth.uid()
    )
  );

-- Update activities policies to allow admin/manager access
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can manage their own activities" ON public.activities;

CREATE POLICY "Users can view activities"
  ON public.activities
  FOR SELECT
  USING (
    user_id::uuid IN (
      SELECT u.id FROM public.users u
      WHERE u.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()
      AND u.role = 'admin'
    )
    OR
    user_id::uuid IN (
      SELECT th.member_id
      FROM public.team_hierarchies th
      JOIN public.users u ON u.id = th.manager_id
      WHERE u.user_id = auth.uid()
      AND th.is_active = TRUE
    )
  );

CREATE POLICY "Users can manage their own activities"
  ON public.activities
  FOR ALL
  USING (
    user_id::uuid IN (
      SELECT u.id FROM public.users u
      WHERE u.user_id = auth.uid()
    )
  );

-- Update time_entries policies to allow admin/manager access
DROP POLICY IF EXISTS "Users can view time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can manage time entries" ON public.time_entries;

CREATE POLICY "Users can view time entries"
  ON public.time_entries
  FOR SELECT
  USING (
    user_id::uuid = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()
      AND u.role = 'admin'
    )
    OR
    user_id::uuid IN (
      SELECT u.user_id
      FROM public.team_hierarchies th
      JOIN public.users u ON u.id = th.member_id
      JOIN public.users m ON m.id = th.manager_id
      WHERE m.user_id = auth.uid()
      AND th.is_active = TRUE
    )
  );

CREATE POLICY "Users can manage time entries"
  ON public.time_entries
  FOR ALL
  USING (
    user_id::uuid = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.user_id = auth.uid()
      AND u.role = 'admin'
    )
    OR
    user_id::uuid IN (
      SELECT u.user_id
      FROM public.team_hierarchies th
      JOIN public.users u ON u.id = th.member_id
      JOIN public.users m ON m.id = th.manager_id
      WHERE m.user_id = auth.uid()
      AND th.is_active = TRUE
    )
  );