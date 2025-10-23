/*
  # Disable RLS for Leave and Vacation Tables

  ## Summary
  This migration disables Row Level Security on the leave and vacation tables
  because the application uses custom authentication (localStorage-based) rather
  than Supabase Auth. The RLS policies rely on auth.uid() which is not available
  with custom authentication.

  ## Changes
  - Disable RLS on leave_requests table
  - Disable RLS on vacation_requests table  
  - Disable RLS on user_vacation_balance table

  ## Security Note
  Application-level security is handled through the custom authentication system
  and permission checks in the frontend/backend code.
*/

-- Disable RLS on all three tables
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_vacation_balance DISABLE ROW LEVEL SECURITY;