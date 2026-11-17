/*
  # Allow the planning app to use buitenklussen and employee_work_schedules

  The app logs users in through its own users table and talks to the database with the
  public (anon) key, so it never has an "authenticated" database session. The policies
  created for these two tables only allowed "authenticated", which meant the app could not
  read or save buitenklussen or work days.

  1. Security changes
    - Grant SELECT/INSERT/UPDATE/DELETE on both tables to anon (in addition to authenticated)
    - Recreate the four policies on each table for anon and authenticated
  2. Notes
    1. This matches how the other planning tables (planning_overrides, employee_absences) are reachable.
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON buitenklussen TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON employee_work_schedules TO anon, authenticated;

DROP POLICY IF EXISTS "Staff can read buitenklussen" ON buitenklussen;
CREATE POLICY "Staff can read buitenklussen" ON buitenklussen FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Staff can insert buitenklussen" ON buitenklussen;
CREATE POLICY "Staff can insert buitenklussen" ON buitenklussen FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Staff can update buitenklussen" ON buitenklussen;
CREATE POLICY "Staff can update buitenklussen" ON buitenklussen FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Staff can delete buitenklussen" ON buitenklussen;
CREATE POLICY "Staff can delete buitenklussen" ON buitenklussen FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Staff can read work schedules" ON employee_work_schedules;
CREATE POLICY "Staff can read work schedules" ON employee_work_schedules FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Staff can insert work schedules" ON employee_work_schedules;
CREATE POLICY "Staff can insert work schedules" ON employee_work_schedules FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Staff can update work schedules" ON employee_work_schedules;
CREATE POLICY "Staff can update work schedules" ON employee_work_schedules FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Staff can delete work schedules" ON employee_work_schedules;
CREATE POLICY "Staff can delete work schedules" ON employee_work_schedules FOR DELETE
  TO anon, authenticated USING (true);
