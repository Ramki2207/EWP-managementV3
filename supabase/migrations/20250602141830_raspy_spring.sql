-- Drop existing table if it exists
DROP TABLE IF EXISTS notifications;

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verdeler_id text NOT NULL,
  project_number text NOT NULL,
  kast_naam text,
  type text NOT NULL,
  status text DEFAULT 'pending',
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  worker_name text NOT NULL,
  photos jsonb, -- Changed from text[] to jsonb to better handle base64 images
  priority text DEFAULT 'medium',
  read boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert access for authenticated users"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users"
  ON notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update access for authenticated users"
  ON notifications FOR UPDATE
  TO authenticated
  USING (true);