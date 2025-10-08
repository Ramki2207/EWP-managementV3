/*
  # Add Project Delivery Tracking and Expected Hours

  ## Changes Made
  
  ### 1. Projects Table
  - Add `expected_delivery_date` column (DATE) - Verwachte leverdatum for the entire project
  
  ### 2. Distributors Table
  - Add `expected_hours` column (NUMERIC) - Voorcalculatorische uren per distributor
  - Note: `gewenste_lever_datum` already exists for distributor-specific delivery dates
  
  ## Purpose
  This migration enables:
  - Project-level expected delivery date tracking
  - Per-distributor expected working hours (voorcalculatorische uren)
  - Comparison between expected and actual hours logged in work_entries table
*/

-- Add expected delivery date to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'expected_delivery_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN expected_delivery_date DATE;
  END IF;
END $$;

-- Add expected hours to distributors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'expected_hours'
  ) THEN
    ALTER TABLE distributors ADD COLUMN expected_hours NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;