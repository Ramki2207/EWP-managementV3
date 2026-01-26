/*
  # Disable RLS for folder_notes table
  
  The application uses localStorage authentication instead of Supabase Auth.
  Therefore, we need to disable RLS on the folder_notes table to allow operations.
  
  Changes:
  - Disable RLS on folder_notes table
*/

ALTER TABLE folder_notes DISABLE ROW LEVEL SECURITY;
