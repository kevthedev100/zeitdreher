-- Add start_time column to time_entries table
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS start_time TIME;

-- Add end_time column to time_entries table (calculated field)
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS end_time TIME;

-- Update existing entries to have default start_time (9:00 AM) if null
UPDATE time_entries 
SET start_time = '09:00:00' 
WHERE start_time IS NULL;

-- Update existing entries to calculate end_time based on start_time and duration
UPDATE time_entries 
SET end_time = (start_time::time + (duration || ' hours')::interval)::time
WHERE end_time IS NULL AND start_time IS NOT NULL;
