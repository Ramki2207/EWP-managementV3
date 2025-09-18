-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verdeler_id text NOT NULL,
  project_number text NOT NULL,
  kast_naam text,
  type text NOT NULL,
  status text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  worker_name text NOT NULL,
  photos jsonb,
  priority text NOT NULL,
  read boolean DEFAULT false,
  FOREIGN KEY (project_number) REFERENCES projects(project_number) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Authenticated users can read all notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (true);