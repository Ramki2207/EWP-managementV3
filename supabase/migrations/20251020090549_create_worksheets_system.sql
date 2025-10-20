/*
  # Create Worksheets System

  1. New Tables
    - `worksheets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users.id)
      - `week_number` (integer) - ISO week number
      - `year` (integer)
      - `location` (text) - Leerdam, Naaldwijk, or Rotterdam
      - `job_number` (text) - Bonnummer
      - `date` (date)
      - `work_type` (text) - Montage, Onderhoud, or Garantie
      - `job_order_number` (text) - Opdrachtnummer
      - `client_name` (text) - Opdrachtgever
      - `address` (text)
      - `city` (text) - Woonplaats
      - `contact_phone` (text)
      - `contact_fax` (text)
      - `contact_person` (text)
      - `job_description` (text)
      - `status` (text) - draft, submitted, approved, rejected
      - `client_notes` (text)
      - `worker_signature` (text)
      - `client_signature` (text)
      - `monteur_name` (text)
      - `work_completed` (text)
      - `total_amount` (decimal)
      - `created_at`, `updated_at`, `submitted_at`, `reviewed_at` (timestamptz)
      - `reviewed_by` (uuid, references users.id)

    - `worksheet_daily_entries`
      - `id`, `worksheet_id`, entry details (date, hours, kilometers, amounts)

    - `worksheet_materials`
      - `id`, `worksheet_id`, material details (quantity, number, description, prices)

  2. Security
    - Enable RLS on all tables
    - Users can CRUD their own worksheets (drafts only)
    - Admins can view and update all worksheets
*/

-- Create worksheets table
CREATE TABLE IF NOT EXISTS worksheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  week_number integer NOT NULL,
  year integer NOT NULL,
  location text NOT NULL CHECK (location IN ('Leerdam', 'Naaldwijk', 'Rotterdam')),
  job_number text,
  date date NOT NULL,
  work_type text CHECK (work_type IN ('Montage', 'Onderhoud', 'Garantie')),
  job_order_number text,
  client_name text,
  address text,
  city text,
  contact_phone text,
  contact_fax text,
  contact_person text,
  job_description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  client_notes text,
  worker_signature text,
  client_signature text,
  monteur_name text,
  work_completed text,
  total_amount decimal(10,2) DEFAULT 0
);

-- Create worksheet_daily_entries table
CREATE TABLE IF NOT EXISTS worksheet_daily_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id uuid REFERENCES worksheets(id) ON DELETE CASCADE NOT NULL,
  entry_date date NOT NULL,
  work_hours decimal(5,2) DEFAULT 0,
  travel_hours decimal(5,2) DEFAULT 0,
  kilometers decimal(10,2) DEFAULT 0,
  hourly_rate decimal(10,2) DEFAULT 0,
  amount decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create worksheet_materials table
CREATE TABLE IF NOT EXISTS worksheet_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worksheet_id uuid REFERENCES worksheets(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 0,
  item_number text,
  description text,
  unit_price decimal(10,2) DEFAULT 0,
  total_price decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheet_daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE worksheet_materials ENABLE ROW LEVEL SECURITY;

-- Policies for worksheets table
CREATE POLICY "Users can view own worksheets"
  ON worksheets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all worksheets"
  ON worksheets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can create own worksheets"
  ON worksheets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft worksheets"
  ON worksheets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any worksheet"
  ON worksheets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can delete own draft worksheets"
  ON worksheets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- Policies for worksheet_daily_entries
CREATE POLICY "Users can view own worksheet entries"
  ON worksheet_daily_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worksheets
      WHERE worksheets.id = worksheet_daily_entries.worksheet_id
      AND worksheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all worksheet entries"
  ON worksheet_daily_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own worksheet entries"
  ON worksheet_daily_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worksheets
      WHERE worksheets.id = worksheet_daily_entries.worksheet_id
      AND worksheets.user_id = auth.uid()
      AND worksheets.status = 'draft'
    )
  );

CREATE POLICY "Users can update own worksheet entries"
  ON worksheet_daily_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worksheets
      WHERE worksheets.id = worksheet_daily_entries.worksheet_id
      AND worksheets.user_id = auth.uid()
      AND worksheets.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worksheets
      WHERE worksheets.id = worksheet_daily_entries.worksheet_id
      AND worksheets.user_id = auth.uid()
      AND worksheets.status = 'draft'
    )
  );

CREATE POLICY "Users can delete own worksheet entries"
  ON worksheet_daily_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worksheets
      WHERE worksheets.id = worksheet_daily_entries.worksheet_id
      AND worksheets.user_id = auth.uid()
      AND worksheets.status = 'draft'
    )
  );

-- Policies for worksheet_materials
CREATE POLICY "Users can view own worksheet materials"
  ON worksheet_materials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worksheets
      WHERE worksheets.id = worksheet_materials.worksheet_id
      AND worksheets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all worksheet materials"
  ON worksheet_materials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own worksheet materials"
  ON worksheet_materials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worksheets
      WHERE worksheets.id = worksheet_materials.worksheet_id
      AND worksheets.user_id = auth.uid()
      AND worksheets.status = 'draft'
    )
  );

CREATE POLICY "Users can update own worksheet materials"
  ON worksheet_materials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worksheets
      WHERE worksheets.id = worksheet_materials.worksheet_id
      AND worksheets.user_id = auth.uid()
      AND worksheets.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worksheets
      WHERE worksheets.id = worksheet_materials.worksheet_id
      AND worksheets.user_id = auth.uid()
      AND worksheets.status = 'draft'
    )
  );

CREATE POLICY "Users can delete own worksheet materials"
  ON worksheet_materials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worksheets
      WHERE worksheets.id = worksheet_materials.worksheet_id
      AND worksheets.user_id = auth.uid()
      AND worksheets.status = 'draft'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_worksheets_user_id ON worksheets(user_id);
CREATE INDEX IF NOT EXISTS idx_worksheets_week_year ON worksheets(week_number, year);
CREATE INDEX IF NOT EXISTS idx_worksheets_location ON worksheets(location);
CREATE INDEX IF NOT EXISTS idx_worksheets_status ON worksheets(status);
CREATE INDEX IF NOT EXISTS idx_worksheet_daily_entries_worksheet_id ON worksheet_daily_entries(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_worksheet_materials_worksheet_id ON worksheet_materials(worksheet_id);