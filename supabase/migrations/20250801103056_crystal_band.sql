/*
  # Update Users RLS Policy
  
  1. Security Changes
    - Update RLS policy for users table to allow authenticated users to read all users
    - This is needed because the app uses localStorage authentication instead of Supabase auth
    - Add policies for insert, update, and delete operations
*/

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new policies that work with the app's authentication system
CREATE POLICY "Authenticated users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (true);