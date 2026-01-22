/*
  # Add email field to clients table

  1. Changes
    - Add `email` column to `clients` table
      - Type: text
      - Nullable to support existing records
      - Will store client email addresses for contact purposes
  
  2. Notes
    - Uses IF NOT EXISTS to safely add column if it doesn't exist
    - Existing clients will have NULL email values until updated
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'email'
  ) THEN
    ALTER TABLE clients ADD COLUMN email text;
  END IF;
END $$;