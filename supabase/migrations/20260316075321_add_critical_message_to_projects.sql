/*
  # Add Critical Message to Projects

  1. Changes
    - Add `critical_message` column to `projects` table
      - Type: text (can be null for projects without critical messages)
      - Nullable: true (not all projects need critical messages)
    - Add `critical_message_updated_at` column to track when it was last modified
    - Add `critical_message_updated_by` column to track who last modified it

  2. Purpose
    - Allow authorized users (Radjesh, Ronald, Michel de Ruiter) to add important messages
    - Display these messages prominently on project details and documentation
*/

-- Add critical message fields to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'critical_message'
  ) THEN
    ALTER TABLE projects ADD COLUMN critical_message text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'critical_message_updated_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN critical_message_updated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'critical_message_updated_by'
  ) THEN
    ALTER TABLE projects ADD COLUMN critical_message_updated_by uuid REFERENCES auth.users(id);
  END IF;
END $$;