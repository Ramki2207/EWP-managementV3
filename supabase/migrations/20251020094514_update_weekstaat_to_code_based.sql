/*
  # Update Weekstaat System to Code-Based Structure

  ## Changes
  
  1. Drop old tables and recreate with new structure
  2. New structure uses activity codes (100, 102, 103, etc.)
  3. Each row represents one activity with hours per day of the week
  4. Supports overtime tracking separately
  
  ## New Tables
  
  - `weekstaten` (replaces worksheets)
    - Basic info: user, week, year, status
    - Simplified structure
  
  - `weekstaat_entries` (replaces daily_entries and materials)
    - Each entry has: activity_code, description, workorder_number
    - Hours for each day: monday through sunday
    - Overtime hours separately
    - Start/end times for overtime days

  ## Activity Codes
  - 100-105: Installation work (Montage)
  - 181: Warehouse/preparation
  - 302: Administration
  - 402-405: Internal activities
  - 500-509: Leave/absence/overtime
*/

-- Drop old tables if they exist
DROP TABLE IF EXISTS worksheet_materials CASCADE;
DROP TABLE IF EXISTS worksheet_daily_entries CASCADE;
DROP TABLE IF EXISTS worksheets CASCADE;

-- Create weekstaten table
CREATE TABLE IF NOT EXISTS weekstaten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  week_number integer NOT NULL,
  year integer NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  UNIQUE(user_id, week_number, year)
);

-- Create weekstaat_entries table
CREATE TABLE IF NOT EXISTS weekstaat_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekstaat_id uuid REFERENCES weekstaten(id) ON DELETE CASCADE NOT NULL,
  activity_code text NOT NULL,
  activity_description text NOT NULL,
  workorder_number text,
  overtime_start_time text,
  overtime_end_time text,
  monday decimal(5,2) DEFAULT 0,
  tuesday decimal(5,2) DEFAULT 0,
  wednesday decimal(5,2) DEFAULT 0,
  thursday decimal(5,2) DEFAULT 0,
  friday decimal(5,2) DEFAULT 0,
  saturday decimal(5,2) DEFAULT 0,
  sunday decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE weekstaten ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekstaat_entries ENABLE ROW LEVEL SECURITY;

-- Policies for weekstaten
CREATE POLICY "Users can view own weekstaten"
  ON weekstaten FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all weekstaten"
  ON weekstaten FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can create own weekstaten"
  ON weekstaten FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft weekstaten"
  ON weekstaten FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any weekstaat"
  ON weekstaten FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can delete own draft weekstaten"
  ON weekstaten FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- Policies for weekstaat_entries
CREATE POLICY "Users can view own entries"
  ON weekstaat_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weekstaten
      WHERE weekstaten.id = weekstaat_entries.weekstaat_id
      AND weekstaten.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all entries"
  ON weekstaat_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own entries"
  ON weekstaat_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekstaten
      WHERE weekstaten.id = weekstaat_entries.weekstaat_id
      AND weekstaten.user_id = auth.uid()
      AND weekstaten.status = 'draft'
    )
  );

CREATE POLICY "Users can update own entries"
  ON weekstaat_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weekstaten
      WHERE weekstaten.id = weekstaat_entries.weekstaat_id
      AND weekstaten.user_id = auth.uid()
      AND weekstaten.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekstaten
      WHERE weekstaten.id = weekstaat_entries.weekstaat_id
      AND weekstaten.user_id = auth.uid()
      AND weekstaten.status = 'draft'
    )
  );

CREATE POLICY "Users can delete own entries"
  ON weekstaat_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM weekstaten
      WHERE weekstaten.id = weekstaat_entries.weekstaat_id
      AND weekstaten.user_id = auth.uid()
      AND weekstaten.status = 'draft'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_weekstaten_user_id ON weekstaten(user_id);
CREATE INDEX IF NOT EXISTS idx_weekstaten_week_year ON weekstaten(week_number, year);
CREATE INDEX IF NOT EXISTS idx_weekstaten_status ON weekstaten(status);
CREATE INDEX IF NOT EXISTS idx_weekstaat_entries_weekstaat_id ON weekstaat_entries(weekstaat_id);
CREATE INDEX IF NOT EXISTS idx_weekstaat_entries_activity_code ON weekstaat_entries(activity_code);