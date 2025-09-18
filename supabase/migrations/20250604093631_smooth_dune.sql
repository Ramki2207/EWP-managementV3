/*
  # Fix contacts table RLS policies
  
  1. Changes
    - Enable RLS on contacts table if not already enabled
    - Add policies for authenticated users to:
      - Insert new contacts
      - Read all contacts
      - Update contacts
      - Delete contacts
    
  2. Notes
    - Uses DO blocks to check for existing policies
    - Only creates policies if they don't already exist
*/

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'contacts' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add insert policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Authenticated users can insert contacts'
  ) THEN
    CREATE POLICY "Authenticated users can insert contacts"
    ON contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- Add select policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Authenticated users can read all contacts'
  ) THEN
    CREATE POLICY "Authenticated users can read all contacts"
    ON contacts
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Add update policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Authenticated users can update contacts'
  ) THEN
    CREATE POLICY "Authenticated users can update contacts"
    ON contacts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Add delete policy if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'contacts' 
    AND policyname = 'Authenticated users can delete contacts'
  ) THEN
    CREATE POLICY "Authenticated users can delete contacts"
    ON contacts
    FOR DELETE
    TO authenticated
    USING (true);
  END IF;
END $$;