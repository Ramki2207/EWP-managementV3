/*
  # Add activity log to notifications

  1. Changes
    - Add `activity_log` column to `notifications` table as JSONB to store activity history
      - Column is nullable since not all notifications will have activity logs initially
      - Uses JSONB type to store structured activity data including:
        - Action performed
        - User who performed it
        - Timestamp
        - Additional details

  2. Security
    - Maintains existing RLS policies
    - No additional policies needed as this is just a column addition
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' 
    AND column_name = 'activity_log'
  ) THEN
    ALTER TABLE notifications 
    ADD COLUMN activity_log JSONB;
  END IF;
END $$;