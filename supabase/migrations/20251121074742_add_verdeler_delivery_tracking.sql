/*
  # Add Per-Verdeler Delivery Tracking

  1. New Tables
    - `verdeler_deliveries`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `distributor_id` (uuid, foreign key to distributors)
      - `delivery_status` (text) - 'pending', 'ready_for_delivery', 'delivered'
      - `fysiek_checklist` (jsonb) - Physical checklist items
      - `documentatie_checklist` (jsonb) - Documentation checklist items
      - `delivery_photos` (jsonb) - Array of photo storage paths
      - `completed_by` (text) - Username who completed the checklist
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `verdeler_deliveries` table
    - Add policies for authenticated users to manage delivery checklists

  3. Notes
    - This allows tracking delivery status per verdeler
    - Multiple verdelers can be in different delivery states
    - Photos are stored per verdeler for verification
*/

-- Create verdeler_deliveries table
CREATE TABLE IF NOT EXISTS verdeler_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  distributor_id uuid REFERENCES distributors(id) ON DELETE CASCADE NOT NULL,
  delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'ready_for_delivery', 'delivered')),
  fysiek_checklist jsonb DEFAULT '[]'::jsonb,
  documentatie_checklist jsonb DEFAULT '[]'::jsonb,
  delivery_photos jsonb DEFAULT '[]'::jsonb,
  completed_by text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, distributor_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_verdeler_deliveries_project ON verdeler_deliveries(project_id);
CREATE INDEX IF NOT EXISTS idx_verdeler_deliveries_distributor ON verdeler_deliveries(distributor_id);
CREATE INDEX IF NOT EXISTS idx_verdeler_deliveries_status ON verdeler_deliveries(delivery_status);

-- Enable RLS
ALTER TABLE verdeler_deliveries ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all delivery records
CREATE POLICY "Authenticated users can view verdeler deliveries"
  ON verdeler_deliveries
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert delivery records
CREATE POLICY "Authenticated users can create verdeler deliveries"
  ON verdeler_deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update delivery records
CREATE POLICY "Authenticated users can update verdeler deliveries"
  ON verdeler_deliveries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete delivery records
CREATE POLICY "Authenticated users can delete verdeler deliveries"
  ON verdeler_deliveries
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verdeler_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_verdeler_deliveries_updated_at_trigger ON verdeler_deliveries;
CREATE TRIGGER update_verdeler_deliveries_updated_at_trigger
  BEFORE UPDATE ON verdeler_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_verdeler_deliveries_updated_at();