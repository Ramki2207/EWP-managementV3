/*
  # Add Phase Tracking to Work Entries and Distributors

  1. Changes to `work_entries` table
    - Add `phase` column to track work phase (werkvoorbereiding, productie, testen)
    - This allows tracking hours per phase for better insights

  2. Changes to `distributors` table
    - Add `expected_werkvoorbereiding_hours` for estimated preparation hours
    - Add `expected_productie_hours` for estimated production hours
    - Add `expected_testen_hours` for estimated testing hours
    - Keep existing `expected_hours` as total estimated hours

  3. Migration of existing data
    - Parse existing notes field to categorize phases
    - Update phase field based on note content

  4. Notes
    - This enables better tracking of voorcalculatorische uren vs actual hours
    - Helps clients optimize their time estimates for future projects
*/

-- Add phase column to work_entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'work_entries' AND column_name = 'phase'
  ) THEN
    ALTER TABLE work_entries ADD COLUMN phase text CHECK (phase IN ('werkvoorbereiding', 'productie', 'testen', 'overig'));
  END IF;
END $$;

-- Add estimated hours breakdown to distributors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'expected_werkvoorbereiding_hours'
  ) THEN
    ALTER TABLE distributors ADD COLUMN expected_werkvoorbereiding_hours numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'expected_productie_hours'
  ) THEN
    ALTER TABLE distributors ADD COLUMN expected_productie_hours numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'expected_testen_hours'
  ) THEN
    ALTER TABLE distributors ADD COLUMN expected_testen_hours numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Migrate existing data - categorize by notes field
UPDATE work_entries
SET phase = CASE
  WHEN notes ILIKE '%werkvoorbereiding%' OR notes ILIKE '%teken uren%' THEN 'werkvoorbereiding'
  WHEN notes ILIKE '%test uren%' OR notes ILIKE '%testen%' THEN 'testen'
  WHEN notes ILIKE '%productie%' OR notes ILIKE '%montage%' THEN 'productie'
  ELSE 'overig'
END
WHERE phase IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_work_entries_phase ON work_entries(phase);
CREATE INDEX IF NOT EXISTS idx_work_entries_distributor_phase ON work_entries(distributor_id, phase);