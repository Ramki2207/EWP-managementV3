/*
  # Add location field to clients table

  1. Changes
    - Add `location` column to `clients` table to track which location each client belongs to
    - This enables location-based filtering so users only see clients from their assigned locations
  
  2. Notes
    - Existing clients will have NULL location initially
    - Each client should be assigned to exactly one location (Leerdam or Naaldwijk)
*/

-- Add location column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'location'
  ) THEN
    ALTER TABLE clients ADD COLUMN location text;
  END IF;
END $$;
