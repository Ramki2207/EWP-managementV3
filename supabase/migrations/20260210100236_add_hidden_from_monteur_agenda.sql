/*
  # Add hidden_from_monteur_agenda field to distributors

  1. Changes
    - Add `hidden_from_monteur_agenda` boolean field to distributors table
    - Default value is false (visible)
    - This allows Dave Moret to hide distributors from the Monteur Toewijzing Agenda
      without deleting them

  2. Notes
    - Projects remain in the system and can be unhidden later
    - This helps keep the planning view clean and focused
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'hidden_from_monteur_agenda'
  ) THEN
    ALTER TABLE distributors ADD COLUMN hidden_from_monteur_agenda boolean DEFAULT false;
  END IF;
END $$;