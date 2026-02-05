/*
  # Add Leerdam (PM) Location Support

  1. Changes
    - Update worksheets table CHECK constraint to allow 'Leerdam (PM)' as a valid location
    - This allows for separate project prefixes for Leerdam-based projects (PU and PM)

  2. Notes
    - Existing 'Leerdam' location remains unchanged for backward compatibility
    - 'Leerdam (PM)' represents Leerdam projects with PM prefix
*/

-- Drop existing CHECK constraint on worksheets.location
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'worksheets' AND constraint_name LIKE '%location%'
  ) THEN
    ALTER TABLE worksheets DROP CONSTRAINT IF EXISTS worksheets_location_check;
  END IF;
END $$;

-- Add new CHECK constraint that includes 'Leerdam (PM)'
ALTER TABLE worksheets 
ADD CONSTRAINT worksheets_location_check 
CHECK (location IN ('Leerdam', 'Leerdam (PM)', 'Naaldwijk', 'Rotterdam'));
