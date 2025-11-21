/*
  # Fix Verdeler Deliveries RLS Policies

  1. Changes
    - Drop existing policies that may be too restrictive
    - Create new permissive policies for authenticated users
    - Allow all authenticated users to manage verdeler deliveries

  2. Security
    - Policies allow authenticated users full access
    - RLS remains enabled for protection against anonymous access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view verdeler deliveries" ON verdeler_deliveries;
DROP POLICY IF EXISTS "Authenticated users can create verdeler deliveries" ON verdeler_deliveries;
DROP POLICY IF EXISTS "Authenticated users can update verdeler deliveries" ON verdeler_deliveries;
DROP POLICY IF EXISTS "Authenticated users can delete verdeler deliveries" ON verdeler_deliveries;

-- Create new permissive policies
CREATE POLICY "Allow authenticated users to select verdeler deliveries"
  ON verdeler_deliveries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert verdeler deliveries"
  ON verdeler_deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update verdeler deliveries"
  ON verdeler_deliveries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete verdeler deliveries"
  ON verdeler_deliveries
  FOR DELETE
  TO authenticated
  USING (true);