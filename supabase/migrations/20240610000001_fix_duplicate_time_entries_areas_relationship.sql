-- This migration fixes the duplicate relationship between time_entries and areas tables

-- First, identify all foreign key constraints between time_entries and areas
DO $$
DECLARE
    fk_constraints RECORD;
    constraint_count INTEGER := 0;
    kept_constraint TEXT;
BEGIN
    -- Count how many foreign key constraints exist between time_entries and areas
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'time_entries'
    AND ccu.table_name = 'areas'
    AND tc.table_schema = 'public';
    
    RAISE NOTICE 'Found % foreign key constraints between time_entries and areas', constraint_count;
    
    -- If more than one constraint exists, keep only one (preferably fk_time_entries_areas)
    IF constraint_count > 1 THEN
        -- Find the first constraint to keep
        SELECT constraint_name INTO kept_constraint
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'time_entries'
        AND ccu.table_name = 'areas'
        AND tc.table_schema = 'public'
        ORDER BY CASE WHEN tc.constraint_name = 'fk_time_entries_areas' THEN 0 ELSE 1 END
        LIMIT 1;
        
        RAISE NOTICE 'Keeping constraint: %', kept_constraint;
        
        -- Drop all other constraints
        FOR fk_constraints IN 
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'time_entries'
            AND ccu.table_name = 'areas'
            AND tc.table_schema = 'public'
            AND tc.constraint_name != kept_constraint
        LOOP
            RAISE NOTICE 'Dropping constraint: %', fk_constraints.constraint_name;
            EXECUTE 'ALTER TABLE public.time_entries DROP CONSTRAINT IF EXISTS ' || quote_ident(fk_constraints.constraint_name);
        END LOOP;
        
        -- Ensure the kept constraint has the correct name
        IF kept_constraint != 'fk_time_entries_areas' THEN
            EXECUTE 'ALTER TABLE public.time_entries RENAME CONSTRAINT ' || quote_ident(kept_constraint) || ' TO fk_time_entries_areas';
            RAISE NOTICE 'Renamed constraint % to fk_time_entries_areas', kept_constraint;
        END IF;
    ELSIF constraint_count = 0 THEN
        -- If no constraint exists, create one
        RAISE NOTICE 'No foreign key constraint found between time_entries and areas. Creating one.';
        BEGIN
            EXECUTE 'ALTER TABLE public.time_entries ADD CONSTRAINT fk_time_entries_areas FOREIGN KEY (area_id) REFERENCES public.areas(id)';
            RAISE NOTICE 'Created constraint fk_time_entries_areas';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating constraint: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Only one foreign key constraint exists between time_entries and areas. No action needed.';
    END IF;
    
    -- Verify the result
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'time_entries'
    AND ccu.table_name = 'areas'
    AND tc.table_schema = 'public';
    
    RAISE NOTICE 'After cleanup: % foreign key constraint(s) between time_entries and areas', constraint_count;
END;
$$;
