/*
  # Add intake form support to projects table

  1. New Columns
    - `intake_form` (jsonb) - Stores the intake form data as JSON

  2. Purpose
    - Store intake form data when project status is "Intake"
    - Allow retrieval and display of intake form in project details
    - Support for structured intake process data
*/

-- Add intake_form column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'intake_form'
  ) THEN
    ALTER TABLE projects ADD COLUMN intake_form jsonb;
  END IF;
END $$;