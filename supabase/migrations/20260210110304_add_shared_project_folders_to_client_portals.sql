/*
  # Add shared project folders to client portals

  1. Changes
    - Add `shared_project_folders` array column to `client_portals` table
      - Allows storing which project-level document folders should be shared with clients
      - Defaults to empty array
      - Complements existing `shared_folders` which handles verdeler-level folders

  2. Purpose
    - Enable client portal admins to share project-level document folders (like "Offerte", "Calculatie", etc.)
    - Provides more granular control over what project documents clients can access
    - Previously only verdeler-level folders could be shared
*/

-- Add shared_project_folders column to client_portals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_portals' AND column_name = 'shared_project_folders'
  ) THEN
    ALTER TABLE client_portals ADD COLUMN shared_project_folders text[] DEFAULT '{}';
  END IF;
END $$;