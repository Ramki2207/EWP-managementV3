/*
  # Add Time Support to Leave Requests

  1. Changes
    - Add `is_partial_day` boolean column to indicate if leave is for partial day
    - Add `start_time` column to store start time for partial day leave
    - Add `end_time` column to store end time for partial day leave
    - Add `hours_count` column to store calculated hours for partial day leave
    
  2. Notes
    - For full day leave, `is_partial_day` will be false and times will be null
    - For partial day leave, `is_partial_day` will be true and times must be set
    - `days_count` will be used for full days, `hours_count` for partial days
*/

-- Add time support columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'is_partial_day'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN is_partial_day boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN start_time time;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN end_time time;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'hours_count'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN hours_count numeric(5,2);
  END IF;
END $$;