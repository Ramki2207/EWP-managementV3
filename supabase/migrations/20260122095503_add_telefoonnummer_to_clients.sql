/*
  # Add phone number field to clients table

  1. Changes
    - Add `telefoonnummer` column to `clients` table
      - Type: text (to allow for formatted phone numbers like "06 12345678" or "+31 6 12345678")
      - Nullable: true (optional field)
      - No default value
  
  2. Notes
    - This field stores the main phone number for the client organization
    - Field is optional as not all clients may have a phone number on file
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'telefoonnummer'
  ) THEN
    ALTER TABLE clients ADD COLUMN telefoonnummer text;
  END IF;
END $$;