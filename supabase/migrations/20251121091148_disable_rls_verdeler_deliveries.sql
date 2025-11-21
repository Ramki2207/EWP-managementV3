/*
  # Temporarily Disable RLS on verdeler_deliveries

  1. Changes
    - Disable RLS on verdeler_deliveries table for testing
    
  2. Security
    - This is temporary to diagnose the issue
    - Should be re-enabled with proper policies after testing
*/

ALTER TABLE verdeler_deliveries DISABLE ROW LEVEL SECURITY;