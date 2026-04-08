/*
  # Create admin tasks table

  1. New Tables
    - `admin_tasks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users) - the admin who created the task
      - `title` (text) - task title
      - `description` (text, nullable) - optional task description
      - `priority` (text) - high, medium, low
      - `status` (text) - pending, in_progress, completed
      - `due_date` (date, nullable) - optional deadline
      - `project_id` (uuid, nullable, foreign key to projects) - optional link to a project
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `admin_tasks` table
    - Add policies so only the task owner (admin) can read/write their own tasks
*/

CREATE TABLE IF NOT EXISTS admin_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  description text DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  project_id uuid REFERENCES projects(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT admin_tasks_priority_check CHECK (priority IN ('high', 'medium', 'low')),
  CONSTRAINT admin_tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed'))
);

ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON admin_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks"
  ON admin_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON admin_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON admin_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_admin_tasks_user_id ON admin_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_status ON admin_tasks(status);
CREATE INDEX IF NOT EXISTS idx_admin_tasks_due_date ON admin_tasks(due_date);
