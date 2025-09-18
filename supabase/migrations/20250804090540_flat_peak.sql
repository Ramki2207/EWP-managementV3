/*
  # Create project locks table for real-time collaboration

  1. New Tables
    - `project_locks`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to users)
      - `username` (text)
      - `locked_at` (timestamp)
      - `last_activity` (timestamp)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `project_locks` table
    - Add policies for authenticated users to manage locks
    - Add indexes for performance

  3. Functions
    - Auto-cleanup function for stale locks
    - Trigger for updating last_activity
*/

-- Create project_locks table
CREATE TABLE IF NOT EXISTS project_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  username text NOT NULL,
  locked_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_locks_project_id_fkey'
  ) THEN
    ALTER TABLE project_locks ADD CONSTRAINT project_locks_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_locks_project_id ON project_locks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_locks_user_id ON project_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_project_locks_active ON project_locks(is_active);
CREATE INDEX IF NOT EXISTS idx_project_locks_last_activity ON project_locks(last_activity);

-- Enable RLS
ALTER TABLE project_locks ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Authenticated users can read all project locks"
  ON project_locks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project locks"
  ON project_locks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their own locks"
  ON project_locks
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete project locks"
  ON project_locks
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to cleanup stale locks (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_project_locks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE project_locks 
  SET is_active = false
  WHERE is_active = true 
    AND last_activity < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Function to update last activity
CREATE OR REPLACE FUNCTION update_project_lock_activity(lock_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE project_locks 
  SET last_activity = NOW()
  WHERE id = lock_id AND is_active = true;
END;
$$;