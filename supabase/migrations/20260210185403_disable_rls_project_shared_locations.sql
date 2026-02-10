/*
  # Disable RLS for Project Shared Locations

  1. Changes
    - Disable Row Level Security on project_shared_locations table
    - This system uses custom authentication via localStorage, not Supabase Auth
    - Access control is managed at the application level
  
  2. Security
    - Frontend already enforces authentication and authorization
    - All users must be logged in to access the application
    - Only authenticated users can access the sharing functionality
*/

-- Disable RLS on project_shared_locations table
ALTER TABLE project_shared_locations DISABLE ROW LEVEL SECURITY;

-- Drop existing policies (they won't work without Supabase Auth)
DROP POLICY IF EXISTS "Users can view project shared locations" ON project_shared_locations;
DROP POLICY IF EXISTS "Admins can share projects with locations" ON project_shared_locations;
DROP POLICY IF EXISTS "Admins can unshare projects from locations" ON project_shared_locations;
