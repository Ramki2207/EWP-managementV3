/*
  # Disable RLS on employee_absences table

  The application uses a custom authentication system, not Supabase Auth,
  so auth.uid() is not available. Disabling RLS to match the pattern
  used by other tables in this project (leave_requests, admin_tasks, etc.).
*/

ALTER TABLE employee_absences DISABLE ROW LEVEL SECURITY;
