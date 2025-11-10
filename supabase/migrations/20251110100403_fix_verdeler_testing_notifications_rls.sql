/*
  # Fix RLS Policies for Verdeler Testing Notifications

  1. Changes
    - Update RLS policies to allow the database trigger to insert notifications
    - The trigger runs with the permissions of the user updating the distributor
    - Need to allow any authenticated user to insert notifications (since trigger creates them)

  2. Security
    - Keep read/update policies restricted to authenticated users
    - Allow inserts since they're controlled by database trigger logic
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can create testing notifications" ON verdeler_testing_notifications;

-- Create new insert policy that allows the trigger to work
CREATE POLICY "Allow trigger to create testing notifications"
  ON verdeler_testing_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also need to ensure the trigger can insert regardless of who updates the distributor
-- Update the trigger function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION notify_testers_on_verdeler_testing()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
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