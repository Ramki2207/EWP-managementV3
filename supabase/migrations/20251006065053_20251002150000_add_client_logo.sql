/*
  # Add client logo support

  1. Changes
    - Add `logo_url` column to `clients` table
      - `logo_url` (text, nullable) - URL to the client's logo stored in Supabase storage

  2. Notes
    - Existing clients will have NULL logo_url by default
    - Logo files will be stored in Supabase storage bucket 'client-logos'
*/

-- Add logo_url column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE clients ADD COLUMN logo_url text;
  END IF;
END $$;