/*
  # Add Test Review Notifications Table

  1. New Tables
    - `test_review_notifications`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `distributor_id` (uuid, foreign key to distributors)
      - `test_type` (text) - Type of test (verdeler_testing, verdeler_test_simpel, verdeler_vanaf_630)
      - `status` (text) - Status: pending_review, approved, rejected
      - `submitted_by` (text) - User who submitted for review
      - `submitted_at` (timestamptz) - When submitted for review
      - `reviewed_by` (text, nullable) - Admin who reviewed
      - `reviewed_at` (timestamptz, nullable) - When reviewed
      - `review_notes` (text, nullable) - Optional notes from reviewer

  2. Security
    - Enable RLS on `test_review_notifications` table
    - Add policies for authenticated users to create notifications
    - Add policies for admins to view and update notifications
*/

CREATE TABLE IF NOT EXISTS test_review_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  distributor_id uuid NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  test_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending_review',
  submitted_by text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text
);

-- Enable RLS
ALTER TABLE test_review_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can create notifications
CREATE POLICY "Authenticated users can create test review notifications"
  ON test_review_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can view all notifications
CREATE POLICY "Authenticated users can view test review notifications"
  ON test_review_notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can update notifications (for admin review)
CREATE POLICY "Authenticated users can update test review notifications"
  ON test_review_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete notifications
CREATE POLICY "Authenticated users can delete test review notifications"
  ON test_review_notifications
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_test_review_notifications_project_id ON test_review_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_test_review_notifications_distributor_id ON test_review_notifications(distributor_id);
CREATE INDEX IF NOT EXISTS idx_test_review_notifications_status ON test_review_notifications(status);
CREATE INDEX IF NOT EXISTS idx_test_review_notifications_submitted_at ON test_review_notifications(submitted_at DESC);