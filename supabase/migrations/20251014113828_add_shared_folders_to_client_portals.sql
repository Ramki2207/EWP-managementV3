/*
  # Add Shared Folders Configuration to Client Portals

  1. Changes
    - Add `shared_folders` column to `client_portals` table
      - Type: text[] (array of folder names)
      - Default: ['Verdeler aanzicht', 'Test certificaat', 'Installatie schema']
      - Nullable: false

  2. Purpose
    - Allow users to customize which document folders are shared with clients
    - Maintain backward compatibility with default folders
    - Support flexible folder sharing per project

  3. Security
    - No RLS changes needed (existing policies still apply)
*/

-- Add shared_folders column with default folders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_portals' AND column_name = 'shared_folders'
  ) THEN
    ALTER TABLE client_portals
    ADD COLUMN shared_folders text[] DEFAULT ARRAY['Verdeler aanzicht', 'Test certificaat', 'Installatie schema'];
  END IF;
END $$;

-- Update existing records to have the default folders
UPDATE client_portals
SET shared_folders = ARRAY['Verdeler aanzicht', 'Test certificaat', 'Installatie schema']
WHERE shared_folders IS NULL;
