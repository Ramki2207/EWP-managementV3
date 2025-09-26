/*
  # Add missing columns to distributors table

  1. New Columns
    - `toegewezen_monteur` (text) - Assigned technician for the distributor
    - `gewenste_lever_datum` (timestamptz) - Desired delivery date

  2. Purpose
    - Support technician assignment workflow
    - Enable delivery date planning
    - Enhance project management capabilities

  3. Notes
    - Uses IF NOT EXISTS to prevent errors on re-run
    - Columns are nullable to support existing records
    - Compatible with existing data structure
*/

-- Add toegewezen_monteur column for technician assignment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'toegewezen_monteur'
  ) THEN
    ALTER TABLE distributors ADD COLUMN toegewezen_monteur text;
  END IF;
END $$;

-- Add gewenste_lever_datum column for delivery planning
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'gewenste_lever_datum'
  ) THEN
    ALTER TABLE distributors ADD COLUMN gewenste_lever_datum timestamptz;
  END IF;
END $$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_distributors_toegewezen_monteur ON distributors(toegewezen_monteur);
CREATE INDEX IF NOT EXISTS idx_distributors_gewenste_lever_datum ON distributors(gewenste_lever_datum);