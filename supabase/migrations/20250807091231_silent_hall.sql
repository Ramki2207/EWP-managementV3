/*
  # Client Portal System for Delivery Notifications

  1. New Tables
    - `client_portals`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `client_id` (uuid, foreign key to clients)
      - `access_code` (text, unique)
      - `portal_url` (text)
      - `expires_at` (timestamp)
      - `is_active` (boolean)
      - `email_sent` (boolean)
      - `email_sent_at` (timestamp)
      - `last_accessed` (timestamp)
      - `access_count` (integer)
      - `delivery_status` (text)
      - `created_at` (timestamp)

    - `delivery_notifications`
      - `id` (uuid, primary key)
      - `portal_id` (uuid, foreign key to client_portals)
      - `email_template` (text)
      - `email_subject` (text)
      - `sent_at` (timestamp)
      - `delivery_date` (date)
      - `special_instructions` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users

  3. Indexes
    - Add indexes for performance
*/

-- Create client_portals table
CREATE TABLE IF NOT EXISTS client_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  access_code text UNIQUE NOT NULL,
  portal_url text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  last_accessed timestamptz,
  access_count integer DEFAULT 0,
  delivery_status text DEFAULT 'preparing',
  created_at timestamptz DEFAULT now()
);

-- Create delivery_notifications table
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  email_template text NOT NULL,
  email_subject text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  delivery_date date,
  special_instructions text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for client_portals
CREATE POLICY "Authenticated users can read all client portals"
  ON client_portals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client portals"
  ON client_portals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client portals"
  ON client_portals
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for delivery_notifications
CREATE POLICY "Authenticated users can read all delivery notifications"
  ON delivery_notifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert delivery notifications"
  ON delivery_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update delivery notifications"
  ON delivery_notifications
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_portals_project_id ON client_portals(project_id);
CREATE INDEX IF NOT EXISTS idx_client_portals_access_code ON client_portals(access_code);
CREATE INDEX IF NOT EXISTS idx_client_portals_active ON client_portals(is_active);
CREATE INDEX IF NOT EXISTS idx_client_portals_expires_at ON client_portals(expires_at);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_portal_id ON delivery_notifications(portal_id);