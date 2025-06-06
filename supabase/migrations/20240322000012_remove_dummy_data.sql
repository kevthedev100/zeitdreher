-- Remove any dummy data that doesn't belong to a real user

-- Delete time entries that don't have a valid user
DELETE FROM time_entries
WHERE user_id::text NOT IN (SELECT id::text FROM auth.users);

-- Delete activities that don't have a valid user
DELETE FROM activities
WHERE user_id::text NOT IN (SELECT id::text FROM auth.users);

-- Delete fields that don't have a valid user
DELETE FROM fields
WHERE user_id::text NOT IN (SELECT id::text FROM auth.users);

-- Delete areas that don't have a valid user
DELETE FROM areas
WHERE user_id::text NOT IN (SELECT id::text FROM auth.users);

-- Delete any entries with mock IDs
DELETE FROM time_entries WHERE id::text LIKE 'mock-%';
DELETE FROM activities WHERE id::text LIKE 'mock-%' OR id::text LIKE 'activity%';
DELETE FROM fields WHERE id::text LIKE 'mock-%' OR id::text LIKE 'field%';
DELETE FROM areas WHERE id::text LIKE 'mock-%' OR id::text LIKE 'area%';
