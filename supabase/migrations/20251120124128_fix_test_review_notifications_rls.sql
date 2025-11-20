/*
  # Fix Test Review Notifications RLS

  This migration disables RLS on the test_review_notifications table because
  the application uses localStorage-based authentication instead of Supabase Auth.
  
  ## Changes
  - Disable RLS on test_review_notifications table
  - Drop existing policies that require Supabase authentication
  
  ## Security Note
  The application has its own authentication layer via localStorage and checks
  user permissions in the frontend code before allowing actions.
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can create test review notifications" ON test_review_notifications;
DROP POLICY IF EXISTS "Authenticated users can view test review notifications" ON test_review_notifications;
DROP POLICY IF EXISTS "Authenticated users can update test review notifications" ON test_review_notifications;
DROP POLICY IF EXISTS "Authenticated users can delete test review notifications" ON test_review_notifications;

-- Disable RLS on the table
ALTER TABLE test_review_notifications DISABLE ROW LEVEL SECURITY;
