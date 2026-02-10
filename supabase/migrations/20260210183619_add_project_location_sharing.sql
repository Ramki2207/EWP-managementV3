/*
  # Add Project Location Sharing System

  1. New Tables
    - `project_shared_locations`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `location` (text) - The location this project is shared with
      - `shared_by` (uuid, foreign key to users) - Admin who shared the project
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `project_shared_locations` table
    - Add policies for authenticated users to read shared locations
    - Add policies for admins to manage shared locations
  
  3. Purpose
    - Allows admins to share projects across different locations (Leerdam, Naaldwijk, Rotterdam, Leerdam - PM)
    - Users from shared locations can view and edit the project
    - Tracks who shared the project and when
*/

-- Create project_shared_locations table
CREATE TABLE IF NOT EXISTS project_shared_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  location text NOT NULL CHECK (location IN ('Leerdam', 'Naaldwijk', 'Rotterdam', 'Leerdam - PM')),
  shared_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_shared_locations_project_id ON project_shared_locations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_shared_locations_location ON project_shared_locations(location);

-- Prevent duplicate entries (same project shared with same location multiple times)
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_shared_locations_unique ON project_shared_locations(project_id, location);

-- Enable RLS
ALTER TABLE project_shared_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all shared locations
CREATE POLICY "Users can view project shared locations"
  ON project_shared_locations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Admins can insert shared locations
CREATE POLICY "Admins can share projects with locations"
  ON project_shared_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can remove shared locations
CREATE POLICY "Admins can unshare projects from locations"
  ON project_shared_locations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
