/*
  # Disable RLS on planning_overrides table

  This application uses a custom authentication system, not Supabase Auth,
  so auth.uid() is not available. Disabling RLS to match the pattern used
  by all other tables in this project (employee_absences, admin_tasks,
  folder_notes, verdeler_deliveries, etc.).
*/

ALTER TABLE planning_overrides DISABLE ROW LEVEL SECURITY;
