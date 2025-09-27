/*
  # Add contact person column to projects table

  1. Changes
    - Add `contact_person` column to `projects` table
    - Column stores the name of the selected contact person for the project
    - Column is optional (nullable) to maintain compatibility with existing projects

  2. Notes
    - This enables tracking which specific contact person is responsible for each project
    - Existing projects will have NULL values for this field initially
    - New projects can specify a contact person during creation
*/

-- Add contact_person column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_person TEXT;