-- Add trial_start column to subscriptions table if it doesn't exist
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS trial_start INTEGER;

-- Enable realtime for subscriptions table
alter publication supabase_realtime add table subscriptions;
