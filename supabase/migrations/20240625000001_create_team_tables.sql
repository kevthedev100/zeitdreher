-- Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES public.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  invited_by UUID REFERENCES public.users(id),
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted BOOLEAN DEFAULT FALSE
);

-- Enable row level security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Add policies for team_members
DROP POLICY IF EXISTS "Team members are viewable by admin users" ON public.team_members;
CREATE POLICY "Team members are viewable by admin users"
  ON public.team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Team members can be inserted by admin users" ON public.team_members;
CREATE POLICY "Team members can be inserted by admin users"
  ON public.team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Team members can be deleted by admin users" ON public.team_members;
CREATE POLICY "Team members can be deleted by admin users"
  ON public.team_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

-- Add policies for team_invitations
DROP POLICY IF EXISTS "Team invitations are viewable by admin users" ON public.team_invitations;
CREATE POLICY "Team invitations are viewable by admin users"
  ON public.team_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Team invitations can be inserted by admin users" ON public.team_invitations;
CREATE POLICY "Team invitations can be inserted by admin users"
  ON public.team_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

-- Add realtime publication
alter publication supabase_realtime add table public.team_members;
alter publication supabase_realtime add table public.team_invitations;