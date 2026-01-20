/*
  # Add created_by tracking and fix client location assignments

  1. Changes to `clients` table
    - Add `created_by` column to track which user created each client
    - Update location assignments for proper access control:
      - Set "Rotterdam" for clients accessible to Naaldwijk/Rotterdam users
      - Keep "Leerdam" for clients accessible to Leerdam users

  2. Security
    - Users with Naaldwijk or Rotterdam locations should see:
      - Clients with location "Rotterdam" or null
      - Clients they created
    - Users with Leerdam location should see:
      - Clients with location "Leerdam"
      - Clients they created
*/

-- Add created_by column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE clients ADD COLUMN created_by uuid REFERENCES users(id);
  END IF;
END $$;

-- Update the three special clients to have location "Rotterdam"
-- These clients should be visible to users with Naaldwijk or Rotterdam locations
UPDATE clients 
SET location = 'Rotterdam'
WHERE name IN ('Technische unie Rotterdam', 'Batenburg', 'VD-Installaties B.V.')
AND (location IS NULL OR location != 'Rotterdam');
