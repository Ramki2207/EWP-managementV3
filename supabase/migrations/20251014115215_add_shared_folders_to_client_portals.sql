/*
  # Add Shared Folders to Client Portals

  1. Changes
    - Add `shared_folders` column to `client_portals` table
    - This column will store an array of folder names that are visible to the client
    - Default folders: Factuur, Offerte, Test certificaat, Installatie schema

  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_portals' AND column_name = 'shared_folders'
  ) THEN
    ALTER TABLE client_portals 
    ADD COLUMN shared_folders text[] DEFAULT ARRAY['Factuur', 'Offerte', 'Test certificaat', 'Installatie schema'];
  END IF;
END $$;