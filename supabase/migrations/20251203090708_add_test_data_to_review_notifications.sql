/*
  # Add test_data column to test_review_notifications

  1. Changes
    - Add `test_data` (jsonb, nullable) column to store draft test form data
    - This allows saving incomplete test data when user clicks "Opslaan en later verdergaan"
    - Admin can view the saved test data when reviewing from any device

  2. Notes
    - test_data will contain the full test form state as JSON
    - When test is completed, data moves to the distributor's test results
    - Nullable because existing records don't have test data
*/

-- Add test_data column to store draft test information
ALTER TABLE test_review_notifications
ADD COLUMN IF NOT EXISTS test_data jsonb;
