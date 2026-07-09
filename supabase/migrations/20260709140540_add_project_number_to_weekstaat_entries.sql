/*
# Add project_number field to weekstaat_entries

1. Modified Tables
   - `weekstaat_entries`
     - Added `project_number` (text) - optional project number reference for the entry

2. Important Notes
   - Column is nullable to maintain backwards compatibility with existing entries
   - No RLS changes needed as the table already has appropriate policies
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekstaat_entries' AND column_name = 'project_number'
  ) THEN
    ALTER TABLE weekstaat_entries ADD COLUMN project_number text;
  END IF;
END $$;
