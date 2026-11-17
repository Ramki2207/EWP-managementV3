/*
  # Buitenklussen en werkdagen per medewerker

  Adds two tables used by the Productieplanning on the Startpagina.

  1. New Tables
    - `buitenklussen` - external jobs (work on location) planned for one or more monteurs
      - `id` (uuid, primary key)
      - `client` (text, required) - klant
      - `project_number` (text, optional) - linked project number
      - `location` (text) - werklocatie / adres
      - `contact_person` (text) - contactpersoon op locatie
      - `contact_phone` (text) - telefoonnummer contactpersoon
      - `monteurs` (text[], required) - usernames of the assigned monteurs
      - `start_date` (date, required), `end_date` (date, required)
      - `start_time` (text) - aanvangstijd, e.g. 07:30
      - `transport` (text) - vervoer (bedrijfsbus / eigen vervoer / ...)
      - `description` (text) - omschrijving werkzaamheden
      - `materials` (text) - benodigde materialen / gereedschap
      - `notes` (text) - opmerkingen
      - `created_by` (text) - username of the planner
      - `created_at`, `updated_at` (timestamptz)
    - `employee_work_schedules` - which weekdays an employee works
      - `user_id` (uuid, primary key, FK users) - the employee
      - `work_days` (smallint[]) - ISO weekdays worked (1 = maandag ... 5 = vrijdag), default all five
      - `updated_by` (text), `updated_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Signed-in staff can read, create, update and delete (shared planning data, same as planning_overrides)
    - Grants for the authenticated role only

  3. Notes
    1. End date must be on or after start date.
    2. Employees without a row in employee_work_schedules are treated as working Monday to Friday.
*/

CREATE TABLE IF NOT EXISTS buitenklussen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client text NOT NULL,
  project_number text DEFAULT '',
  location text DEFAULT '',
  contact_person text DEFAULT '',
  contact_phone text DEFAULT '',
  monteurs text[] NOT NULL DEFAULT '{}',
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time text DEFAULT '',
  transport text DEFAULT '',
  description text DEFAULT '',
  materials text DEFAULT '',
  notes text DEFAULT '',
  created_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT buitenklussen_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS buitenklussen_dates_idx ON buitenklussen(start_date, end_date);

ALTER TABLE buitenklussen ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON buitenklussen TO authenticated;

DROP POLICY IF EXISTS "Staff can read buitenklussen" ON buitenklussen;
CREATE POLICY "Staff can read buitenklussen" ON buitenklussen FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can insert buitenklussen" ON buitenklussen;
CREATE POLICY "Staff can insert buitenklussen" ON buitenklussen FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Staff can update buitenklussen" ON buitenklussen;
CREATE POLICY "Staff can update buitenklussen" ON buitenklussen FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Staff can delete buitenklussen" ON buitenklussen;
CREATE POLICY "Staff can delete buitenklussen" ON buitenklussen FOR DELETE
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS employee_work_schedules (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  work_days smallint[] NOT NULL DEFAULT '{1,2,3,4,5}',
  updated_by text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employee_work_schedules ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON employee_work_schedules TO authenticated;

DROP POLICY IF EXISTS "Staff can read work schedules" ON employee_work_schedules;
CREATE POLICY "Staff can read work schedules" ON employee_work_schedules FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can insert work schedules" ON employee_work_schedules;
CREATE POLICY "Staff can insert work schedules" ON employee_work_schedules FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Staff can update work schedules" ON employee_work_schedules;
CREATE POLICY "Staff can update work schedules" ON employee_work_schedules FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Staff can delete work schedules" ON employee_work_schedules;
CREATE POLICY "Staff can delete work schedules" ON employee_work_schedules FOR DELETE
  TO authenticated USING (true);
