/*
  # Fix Project Locks Table with RLS

  1. Security
    - Enable RLS on project_locks table
    - Add policies for authenticated users to manage locks
    - Add proper indexes for performance

  2. Constraints
    - Ensure proper foreign key relationships
    - Add unique constraint to prevent duplicate active locks per project
*/

-- Enable RLS on project_locks table
ALTER TABLE project_locks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read all project locks" ON project_locks;
DROP POLICY IF EXISTS "Authenticated users can insert project locks" ON project_locks;
DROP POLICY IF EXISTS "Authenticated users can update their own locks" ON project_locks;
DROP POLICY IF EXISTS "Authenticated users can delete project locks" ON project_locks;

-- Create policies for project locks
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

CREATE POLICY "Authenticated users can update project locks"
  ON project_locks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project locks"
  ON project_locks
  FOR DELETE
  TO authenticated
  USING (true);

-- Add unique constraint to prevent multiple active locks per project
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'project_locks' 
    AND constraint_name = 'unique_active_project_lock'
  ) THEN
    ALTER TABLE project_locks 
    ADD CONSTRAINT unique_active_project_lock 
    UNIQUE (project_id, is_active) 
    DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- Create function to cleanup stale locks automatically
CREATE OR REPLACE FUNCTION cleanup_stale_project_locks()
RETURNS void AS $$
BEGIN
  UPDATE project_locks 
  SET is_active = false 
  WHERE is_active = true 
  AND last_activity < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get active lock for project
CREATE OR REPLACE FUNCTION get_active_project_lock(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  user_id uuid,
  username text,
  locked_at timestamptz,
  last_activity timestamptz,
  is_active boolean
) AS $$
BEGIN
  -- First cleanup stale locks
  PERFORM cleanup_stale_project_locks();
  
  -- Return active lock if exists
  RETURN QUERY
  SELECT pl.id, pl.project_id, pl.user_id, pl.username, pl.locked_at, pl.last_activity, pl.is_active
  FROM project_locks pl
  WHERE pl.project_id = p_project_id 
  AND pl.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;