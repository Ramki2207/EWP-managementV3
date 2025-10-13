/*
  # Add stuurspanning and ka_waarde fields to distributors table

  1. New Columns
    - `stuurspanning` (text) - Control voltage specification (230V AC, 24V AC, etc.)
    - `ka_waarde` (text) - kA value for electrical specifications

  2. Purpose
    - Support detailed electrical specifications for distributors
    - Enable accurate M-Print label generation
    - Enhance technical documentation

  3. Notes
    - Uses IF NOT EXISTS to prevent errors on re-run
    - Columns are nullable to support existing records
    - Values are stored as text to preserve formatting
*/

-- Add stuurspanning column for control voltage specification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'stuurspanning'
  ) THEN
    ALTER TABLE distributors ADD COLUMN stuurspanning text;
  END IF;
END $$;

-- Add ka_waarde column for kA value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'ka_waarde'
  ) THEN
    ALTER TABLE distributors ADD COLUMN ka_waarde text;
  END IF;
END $$;
