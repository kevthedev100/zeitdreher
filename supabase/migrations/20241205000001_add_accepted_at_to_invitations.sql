-- Add accepted_at column to team_invitations table
ALTER TABLE team_invitations 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Update the accepted column to be NOT NULL with default false
ALTER TABLE team_invitations 
ALTER COLUMN accepted SET DEFAULT false;

-- Update existing records to have accepted = false if null
UPDATE team_invitations 
SET accepted = false 
WHERE accepted IS NULL;

-- Make accepted column NOT NULL
ALTER TABLE team_invitations 
ALTER COLUMN accepted SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_email_accepted 
ON team_invitations(email, accepted);

CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at 
ON team_invitations(expires_at);
