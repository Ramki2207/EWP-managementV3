/*
  # Add Folder Notes System
  
  1. New Tables
    - `folder_notes`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `distributor_id` (uuid, nullable, foreign key to distributors)
      - `folder_name` (text) - name of the folder
      - `note` (text) - the note content
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on `folder_notes` table
    - Add policy for authenticated users to read notes
    - Add policy for authenticated users to create notes
    - Add policy for note creators to update their own notes
    - Add policy for note creators to delete their own notes
*/

-- Create folder_notes table
CREATE TABLE IF NOT EXISTS folder_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  distributor_id uuid REFERENCES distributors(id) ON DELETE CASCADE,
  folder_name text NOT NULL,
  note text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE folder_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all folder notes
CREATE POLICY "Authenticated users can read folder notes"
  ON folder_notes
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create folder notes
CREATE POLICY "Authenticated users can create folder notes"
  ON folder_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own folder notes
CREATE POLICY "Users can update their own folder notes"
  ON folder_notes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Policy: Users can delete their own folder notes
CREATE POLICY "Users can delete their own folder notes"
  ON folder_notes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_folder_notes_project_folder 
  ON folder_notes(project_id, folder_name);

CREATE INDEX IF NOT EXISTS idx_folder_notes_distributor_folder 
  ON folder_notes(distributor_id, folder_name) 
  WHERE distributor_id IS NOT NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_folder_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_folder_notes_updated_at_trigger ON folder_notes;
CREATE TRIGGER update_folder_notes_updated_at_trigger
  BEFORE UPDATE ON folder_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_notes_updated_at();