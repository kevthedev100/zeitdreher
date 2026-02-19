-- Add trial tracking columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP WITH TIME ZONE;

-- Create function to initialize trial for new users
CREATE OR REPLACE FUNCTION initialize_user_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Set trial start to now and trial end to 14 days from now
  NEW.trial_start = NOW();
  NEW.trial_end = NOW() + INTERVAL '14 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set trial period for new users
DROP TRIGGER IF EXISTS set_user_trial_on_insert ON users;
CREATE TRIGGER set_user_trial_on_insert
  BEFORE INSERT ON users
  FOR EACH ROW
  WHEN (NEW.trial_start IS NULL)
  EXECUTE FUNCTION initialize_user_trial();

-- Update existing users without trial_start to have a trial period
UPDATE users 
SET 
  trial_start = created_at,
  trial_end = created_at + INTERVAL '14 days'
WHERE trial_start IS NULL;

-- Create function to check if user trial is active
CREATE OR REPLACE FUNCTION is_trial_active(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_trial_end TIMESTAMP WITH TIME ZONE;
  has_active_subscription BOOLEAN;
BEGIN
  -- Check if user has active subscription
  SELECT EXISTS(
    SELECT 1 FROM subscriptions 
    WHERE user_id = user_uuid 
    AND status IN ('active', 'trialing')
  ) INTO has_active_subscription;
  
  -- If user has active subscription, trial status doesn't matter
  IF has_active_subscription THEN
    RETURN TRUE;
  END IF;
  
  -- Check trial end date
  SELECT trial_end INTO user_trial_end
  FROM users 
  WHERE user_id = user_uuid;
  
  -- Return true if trial hasn't expired
  RETURN user_trial_end IS NOT NULL AND user_trial_end > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_trial_active(UUID) TO authenticated;

-- Enable realtime for users table (only if not already a member)
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END
$;
