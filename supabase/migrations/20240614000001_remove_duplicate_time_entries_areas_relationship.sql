-- Drop duplicate foreign key constraints between time_entries and areas
-- First, identify all constraints
DO $$
DECLARE
    constraint_record RECORD;
    constraint_count INTEGER := 0;
    constraint_to_keep TEXT;
BEGIN
    -- Count constraints and remember the first one to keep
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.time_entries'::regclass
        AND confrelid = 'public.areas'::regclass
    LOOP
        constraint_count := constraint_count + 1;
        IF constraint_count = 1 THEN
            constraint_to_keep := constraint_record.conname;
        ELSIF constraint_count > 1 THEN
            -- Drop additional constraints
            EXECUTE 'ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
            RAISE NOTICE 'Dropped duplicate constraint: %', constraint_record.conname;
        END IF;
    END LOOP;
    
    -- If we found constraints, make sure the one we kept is named consistently
    IF constraint_count > 0 THEN
        -- Rename the kept constraint to a consistent name if it's not already named correctly
        IF constraint_to_keep != 'fk_time_entries_areas' THEN
            EXECUTE 'ALTER TABLE public.time_entries RENAME CONSTRAINT ' || constraint_to_keep || ' TO fk_time_entries_areas';
            RAISE NOTICE 'Renamed constraint % to fk_time_entries_areas', constraint_to_keep;
        END IF;
    ELSE
        -- No constraints found, create one
        BEGIN
            EXECUTE 'ALTER TABLE public.time_entries ADD CONSTRAINT fk_time_entries_areas FOREIGN KEY (area_id) REFERENCES public.areas(id)';
            RAISE NOTICE 'Created missing foreign key constraint: fk_time_entries_areas';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Constraint fk_time_entries_areas already exists';
        END;
    END IF;
END;
$$;

-- Ensure the realtime publication includes the time_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
