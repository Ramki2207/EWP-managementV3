/*
  # Add Leave and Vacation Tracking System

  ## Summary
  This migration adds comprehensive leave (verlof) and vacation tracking capabilities
  to support the new "Urenstaat & Verlof" functionality and "Personeelsbeheer" admin panel.

  ## New Tables

  1. **leave_requests** (verlof aanvragen)
     - Tracks individual leave requests (sick days, appointments, special leave, etc.)
     - Supports approval workflow
     - Date range and description

  2. **vacation_requests** (vakantie aanvragen)
     - Tracks vacation day requests
     - Approval workflow
     - Date range tracking

  3. **user_vacation_balance** (vakantiedagen saldo)
     - Tracks available vacation days per user per year
     - Automatic calculation of used vs available days

  ## Security
  - Enable RLS on all tables
  - Users can create and view their own requests
  - Admins can view and approve/decline all requests
*/

-- Create leave_requests table for tracking verlof (sick, appointments, etc.)
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('sick', 'doctor', 'specialist', 'special_leave', 'public_holiday', 'adv', 'time_for_time')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_count decimal(3,1) NOT NULL, -- Can be 0.5 for half days
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  rejection_reason text
);

-- Create vacation_requests table for tracking vakantie
CREATE TABLE IF NOT EXISTS vacation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_count decimal(3,1) NOT NULL, -- Can be 0.5 for half days
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  rejection_reason text
);

-- Create user_vacation_balance table for tracking available vacation days
CREATE TABLE IF NOT EXISTS user_vacation_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  total_days decimal(4,1) NOT NULL DEFAULT 25.0, -- Standard vacation days per year
  used_days decimal(4,1) DEFAULT 0,
  pending_days decimal(4,1) DEFAULT 0,
  available_days decimal(4,1) GENERATED ALWAYS AS (total_days - used_days - pending_days) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year)
);

-- Enable RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vacation_balance ENABLE ROW LEVEL SECURITY;

-- Policies for leave_requests
CREATE POLICY "Users can view own leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can create own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any leave request"
  ON leave_requests FOR UPDATE
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

CREATE POLICY "Users can delete own pending leave requests"
  ON leave_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Policies for vacation_requests
CREATE POLICY "Users can view own vacation requests"
  ON vacation_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vacation requests"
  ON vacation_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can create own vacation requests"
  ON vacation_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending vacation requests"
  ON vacation_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any vacation request"
  ON vacation_requests FOR UPDATE
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

CREATE POLICY "Users can delete own pending vacation requests"
  ON vacation_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Policies for user_vacation_balance
CREATE POLICY "Users can view own vacation balance"
  ON user_vacation_balance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vacation balances"
  ON user_vacation_balance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert vacation balances"
  ON user_vacation_balance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update vacation balances"
  ON user_vacation_balance FOR UPDATE
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_id ON vacation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_dates ON vacation_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_status ON vacation_requests(status);

CREATE INDEX IF NOT EXISTS idx_user_vacation_balance_user_year ON user_vacation_balance(user_id, year);

-- Create function to automatically update vacation balance when request is approved
CREATE OR REPLACE FUNCTION update_vacation_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if status changed to 'approved' or 'declined'
  IF NEW.status != OLD.status THEN
    IF NEW.status = 'approved' THEN
      -- Move days from pending to used
      UPDATE user_vacation_balance
      SET
        used_days = used_days + NEW.days_count,
        pending_days = pending_days - NEW.days_count,
        updated_at = now()
      WHERE user_id = NEW.user_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);

    ELSIF NEW.status = 'declined' THEN
      -- Remove days from pending
      UPDATE user_vacation_balance
      SET
        pending_days = pending_days - NEW.days_count,
        updated_at = now()
      WHERE user_id = NEW.user_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add days to pending when vacation request is created
CREATE OR REPLACE FUNCTION add_to_pending_on_vacation_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Add days to pending when request is created or updated to pending
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'pending' AND OLD.status != 'pending') THEN
    -- Ensure vacation balance record exists for the year
    INSERT INTO user_vacation_balance (user_id, year, total_days, pending_days)
    VALUES (NEW.user_id, EXTRACT(YEAR FROM NEW.start_date), 25.0, NEW.days_count)
    ON CONFLICT (user_id, year)
    DO UPDATE SET
      pending_days = user_vacation_balance.pending_days + NEW.days_count,
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER vacation_approval_trigger
  AFTER UPDATE ON vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_vacation_balance_on_approval();

CREATE TRIGGER vacation_request_pending_trigger
  AFTER INSERT OR UPDATE ON vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION add_to_pending_on_vacation_request();
