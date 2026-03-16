/*
  # Fix Critical Message Foreign Key Constraint

  1. Changes
    - Drop the incorrect foreign key constraint on `critical_message_updated_by` that references `auth.users`
    - Create a new foreign key constraint that references `public.users` instead
    
  2. Purpose
    - The application uses a custom users table in the public schema, not Supabase Auth
    - This fixes the constraint violation when updating critical messages
*/

-- Drop the incorrect foreign key constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'projects_critical_message_updated_by_fkey'
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects DROP CONSTRAINT projects_critical_message_updated_by_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint pointing to public.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'projects_critical_message_updated_by_users_fkey'
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects 
    ADD CONSTRAINT projects_critical_message_updated_by_users_fkey 
    FOREIGN KEY (critical_message_updated_by) 
    REFERENCES users(id);
  END IF;
END $$;