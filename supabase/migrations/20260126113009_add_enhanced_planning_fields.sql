/*
  # Enhanced Planning Fields

  1. New Columns Added
    
    **Projects Table:**
    - `project_naam` (text) - Actual project name/location name for easier identification
    - `installateur_type` (text) - Type of installer (VD Installatie, Hintelaar, Elektro Actief, etc.)
    - `project_leader` (uuid) - References the user who leads the project (can differ from creator)
    
    **Distributors Table:**
    - `delivery_week` (integer) - Preferred delivery week number for planning
    - `is_closed` (boolean) - Whether the distributor is closed/completed (Gesl?)
    - `is_ready` (boolean) - Whether the distributor is ready (Klaar?)
    - `is_tested` (boolean) - Whether testing is complete (Getest)
    - `is_delivered` (boolean) - Whether the distributor has been delivered (Afgeleverd)
    - `week_status` (text) - Color-coded week status indicator
    
  2. Notes
    - toegewezen_monteur already supports text, so we can store multiple monteurs comma-separated
    - expected_hours already exists for workload planning
    - We'll use created_by from users table to show project leaders
*/

-- Add columns to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_naam'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_naam text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'installateur_type'
  ) THEN
    ALTER TABLE projects ADD COLUMN installateur_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'project_leader'
  ) THEN
    ALTER TABLE projects ADD COLUMN project_leader uuid REFERENCES users(id);
  END IF;
END $$;

-- Add columns to distributors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'delivery_week'
  ) THEN
    ALTER TABLE distributors ADD COLUMN delivery_week integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'is_closed'
  ) THEN
    ALTER TABLE distributors ADD COLUMN is_closed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'is_ready'
  ) THEN
    ALTER TABLE distributors ADD COLUMN is_ready boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'is_tested'
  ) THEN
    ALTER TABLE distributors ADD COLUMN is_tested boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'is_delivered'
  ) THEN
    ALTER TABLE distributors ADD COLUMN is_delivered boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'week_status'
  ) THEN
    ALTER TABLE distributors ADD COLUMN week_status text;
  END IF;
END $$;
