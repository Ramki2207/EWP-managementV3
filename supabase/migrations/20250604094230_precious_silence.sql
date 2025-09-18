/*
  # Fix contacts table RLS policies
  
  1. Changes
    - Drop existing policies to avoid conflicts
    - Re-create RLS policies for contacts table
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users to:
      - Insert new contacts
      - Read contacts
      - Update contacts
      - Delete contacts
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can read contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can delete contacts" ON contacts;

-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy for inserting contacts
CREATE POLICY "Authenticated users can insert contacts"
ON contacts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for reading contacts
CREATE POLICY "Authenticated users can read contacts"
ON contacts
FOR SELECT
TO authenticated
USING (true);

-- Policy for updating contacts
CREATE POLICY "Authenticated users can update contacts"
ON contacts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for deleting contacts
CREATE POLICY "Authenticated users can delete contacts"
ON contacts
FOR DELETE
TO authenticated
USING (true);