/*
  # Add Verdeler-Level Testing Workflow

  1. New Tables
    - `verdeler_testing_notifications` - Track testing notifications sent to testers
      - `id` (uuid, primary key)
      - `distributor_id` (uuid, references distributors)
      - `project_id` (uuid, references projects)
      - `status` (text) - 'pending', 'in_review', 'approved', 'declined'
      - `notified_at` (timestamp)
      - `reviewed_at` (timestamp)
      - `reviewed_by` (text)
      - `created_at` (timestamp)

  2. Functions
    - Trigger function to notify testers when verdeler status changes to 'Testen'

  3. Security
    - Enable RLS on new table
    - Add policies for authenticated users

  4. Notes
    - This enables individual verdelers to move to testing independently
    - Each verdeler can be tested and approved separately
    - Testers will receive notifications for each verdeler entering testing phase
*/

-- Create verdeler testing notifications table
CREATE TABLE IF NOT EXISTS verdeler_testing_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id uuid REFERENCES distributors(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  notified_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE verdeler_testing_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view testing notifications"
  ON verdeler_testing_notifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create testing notifications"
  ON verdeler_testing_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update testing notifications"
  ON verdeler_testing_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to automatically create notification when verdeler status changes to 'Testen'
CREATE OR REPLACE FUNCTION notify_testers_on_verdeler_testing()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed TO 'Testen'
  IF NEW.status = 'Testen' AND (OLD.status IS NULL OR OLD.status != 'Testen') THEN
    -- Create notification record
    INSERT INTO verdeler_testing_notifications (distributor_id, project_id, status)
    VALUES (NEW.id, NEW.project_id, 'pending');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on distributors table
DROP TRIGGER IF EXISTS trigger_verdeler_testing_notification ON distributors;
CREATE TRIGGER trigger_verdeler_testing_notification
  AFTER UPDATE OF status ON distributors
  FOR EACH ROW
  EXECUTE FUNCTION notify_testers_on_verdeler_testing();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_verdeler_testing_notifications_distributor 
  ON verdeler_testing_notifications(distributor_id);

CREATE INDEX IF NOT EXISTS idx_verdeler_testing_notifications_status 
  ON verdeler_testing_notifications(status);

CREATE INDEX IF NOT EXISTS idx_verdeler_testing_notifications_project 
  ON verdeler_testing_notifications(project_id);