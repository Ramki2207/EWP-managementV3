/*
  # Disable RLS on admin_tasks

  The application uses custom authentication (not Supabase Auth),
  so RLS policies based on auth.uid() won't work.
  Disabling RLS to be consistent with other tables in this application.
*/

ALTER TABLE admin_tasks DISABLE ROW LEVEL SECURITY;
