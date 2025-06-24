-- Create team_activities table for tracking team activities
CREATE TABLE IF NOT EXISTS team_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_activities_organization_id ON team_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_activities_created_at ON team_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_activities_activity_type ON team_activities(activity_type);

-- Enable RLS
ALTER TABLE team_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view team activities in their organization" ON team_activities;
CREATE POLICY "Users can view team activities in their organization"
ON team_activities FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM organization_members om 
    JOIN users u ON u.id = om.user_id 
    WHERE u.user_id::text = auth.uid()::text AND om.is_active = true
  )
);

DROP POLICY IF EXISTS "Admins and managers can create team activities" ON team_activities;
CREATE POLICY "Admins and managers can create team activities"
ON team_activities FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT om.organization_id 
    FROM organization_members om 
    JOIN users u ON u.id = om.user_id 
    WHERE u.user_id::text = auth.uid()::text 
    AND om.is_active = true 
    AND om.role IN ('admin', 'manager', 'admin_member')
  )
);

-- Enable realtime
alter publication supabase_realtime add table team_activities;
