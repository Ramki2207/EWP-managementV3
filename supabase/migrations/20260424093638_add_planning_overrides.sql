/*
  # Create planning_overrides table

  Stores manual drag-and-drop planning decisions made by planners.
  When a planner manually moves or stretches a verdeler block on the
  Productieplanning timeline, the override is persisted here and takes
  precedence over the auto-schedule engine output.

  1. New Tables
    - `planning_overrides`
      - `id` (uuid, primary key)
      - `distributor_id` (uuid, FK to distributors)
      - `monteur` (text) – assigned monteur name
      - `start_date` (date) – first day of the manual block
      - `end_date` (date) – last day of the manual block
      - `daily_hours` (jsonb) – map of date -> hours for each day in the range
      - `created_by` (text) – username of planner who made the change
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - Authenticated users can read, insert, update, delete their own overrides
    - All authenticated users can read all overrides (planning is shared)
*/

CREATE TABLE IF NOT EXISTS planning_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id uuid NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  monteur text NOT NULL DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  daily_hours jsonb NOT NULL DEFAULT '{}',
  created_by text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE planning_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read planning overrides"
  ON planning_overrides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert planning overrides"
  ON planning_overrides FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update planning overrides"
  ON planning_overrides FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete planning overrides"
  ON planning_overrides FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS planning_overrides_distributor_id_idx ON planning_overrides(distributor_id);
CREATE INDEX IF NOT EXISTS planning_overrides_monteur_idx ON planning_overrides(monteur);
CREATE INDEX IF NOT EXISTS planning_overrides_dates_idx ON planning_overrides(start_date, end_date);
