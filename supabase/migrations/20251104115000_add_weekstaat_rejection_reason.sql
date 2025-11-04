/*
  # Add Rejection Reason to Weekstaten

  1. Changes
    - Add `rejection_reason` field to `weekstaten` table
    - This field stores admin feedback when a weekstaat is rejected
    - Allows montage users to understand what needs to be fixed

  2. Purpose
    - Enable admin to provide feedback when rejecting a weekstaat
    - Help montage users understand and fix issues
*/

-- Add rejection_reason column to weekstaten table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'weekstaten' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE weekstaten ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;
