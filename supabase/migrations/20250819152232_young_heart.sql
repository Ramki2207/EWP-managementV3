/*
  # Fix Users Table RLS Policy

  1. Security Updates
    - Update RLS policies to allow user creation by administrators
    - Add proper INSERT policy for super_admin users
    - Ensure existing policies work correctly

  2. Changes
    - Drop existing restrictive policies
    - Add new policies that allow proper user management
    - Maintain security while enabling functionality
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "users_bootstrap_policy" ON users;
DROP POLICY IF EXISTS "users_admin_full_access" ON users;
DROP POLICY IF EXISTS "users_read_basic_info" ON users;
DROP POLICY IF EXISTS "users_update_own_profile" ON users;

-- Create new policies that allow proper user management

-- Allow initial user creation when no users exist (bootstrap)
CREATE POLICY "users_bootstrap_insert" 
ON users FOR INSERT 
TO public
WITH CHECK (
  NOT EXISTS (SELECT 1 FROM users LIMIT 1)
);

-- Allow super_admin users to perform all operations
CREATE POLICY "users_super_admin_full_access" 
ON users FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Allow admin users to create and manage users
CREATE POLICY "users_admin_management" 
ON users FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow all authenticated users to read basic user info
CREATE POLICY "users_read_access" 
ON users FOR SELECT 
TO authenticated
USING (true);

-- Allow users to update their own profile (but not change role)
CREATE POLICY "users_update_own_profile" 
ON users FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (
    SELECT role FROM users WHERE id = auth.uid()
  )
);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;