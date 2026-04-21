/*
  # Create employee absences table for Verlof registratie

  1. New Tables
    - `employee_absences`
      - `id` (uuid, primary key) - unique identifier
      - `user_id` (uuid, FK to users) - the employee who is absent
      - `absence_type` (text) - either 'ziek' or 'afwezig'
      - `start_date` (date) - first day of absence
      - `end_date` (date, nullable) - last day of absence, null means open-ended (until reported better)
      - `is_open_ended` (boolean) - true when no end date set, tracked until manager marks back
      - `is_active` (boolean) - whether the absence is currently active
      - `registered_by` (uuid, FK to users) - admin who registered the absence
      - `resolved_by` (uuid, nullable, FK to users) - admin who marked employee as back to work
      - `resolved_at` (timestamptz, nullable) - when the employee was marked back to work
      - `notes` (text) - optional notes
      - `created_at` (timestamptz) - creation timestamp

  2. Security
    - RLS enabled on `employee_absences` table
    - Policy for authenticated users to read all absences
    - Policy for authenticated users to insert absences
    - Policy for authenticated users to update absences
*/

CREATE TABLE IF NOT EXISTS employee_absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  absence_type text NOT NULL CHECK (absence_type IN ('ziek', 'afwezig')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_open_ended boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  registered_by uuid NOT NULL REFERENCES public.users(id),
  resolved_by uuid REFERENCES public.users(id),
  resolved_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read absences"
  ON employee_absences FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert absences"
  ON employee_absences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update absences"
  ON employee_absences FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
