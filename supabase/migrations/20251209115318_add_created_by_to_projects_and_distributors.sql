/*
  # Add Created By Tracking for Projects and Distributors
  
  1. Changes
    - Add `created_by` column to `projects` table to track which user created the project
    - Add `created_by` column to `distributors` table to track which user created the verdeler
    - Both columns reference the `users` table and are nullable for existing records
  
  2. Purpose
    - Enable filtering of projects and verdelers based on creator
    - Specific users (Stefano de Weger, Patrick Herman) will only see their own created items when viewing as "Projectleider"
*/

-- Add created_by to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE projects ADD COLUMN created_by uuid REFERENCES users(id);
  END IF;
END $$;

-- Add created_by to distributors table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'distributors' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE distributors ADD COLUMN created_by uuid REFERENCES users(id);
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_distributors_created_by ON distributors(created_by);
