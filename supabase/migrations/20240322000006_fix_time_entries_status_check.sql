-- Drop the existing constraint
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_status_check;

-- Add the constraint back with 'active' as an allowed value
ALTER TABLE time_entries ADD CONSTRAINT time_entries_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'active'));
