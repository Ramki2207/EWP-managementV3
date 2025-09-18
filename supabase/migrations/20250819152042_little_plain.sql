/*
  # Add RBAC columns to users table

  1. New Columns
    - `permissions` (jsonb) - User-specific permissions override
    - `assigned_projects` (uuid[]) - Array of assigned project IDs
    - `assigned_clients` (uuid[]) - Array of assigned client IDs
    - `team_id` (uuid) - Reference to user's team
    - `is_active` (boolean) - User account status
    - `last_permission_update` (timestamptz) - Last permission change timestamp
    - `role_id` (uuid) - Reference to role table (for future use)

  2. Security
    - Maintain existing RLS policies
    - Add indexes for performance

  3. Data Migration
    - Set default values for existing users
    - Ensure backward compatibility
*/

-- Add missing columns to users table
DO $$
BEGIN
  -- Add permissions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE users ADD COLUMN permissions jsonb DEFAULT '{}';
  END IF;

  -- Add assigned_projects column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'assigned_projects'
  ) THEN
    ALTER TABLE users ADD COLUMN assigned_projects uuid[] DEFAULT '{}';
  END IF;

  -- Add assigned_clients column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'assigned_clients'
  ) THEN
    ALTER TABLE users ADD COLUMN assigned_clients uuid[] DEFAULT '{}';
  END IF;

  -- Add team_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE users ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;

  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  -- Add last_permission_update column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_permission_update'
  ) THEN
    ALTER TABLE users ADD COLUMN last_permission_update timestamptz DEFAULT now();
  END IF;

  -- Add role_id column if it doesn't exist (for future RBAC expansion)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE users ADD COLUMN role_id uuid REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_assigned_projects ON users USING gin (assigned_projects);
CREATE INDEX IF NOT EXISTS idx_users_assigned_clients ON users USING gin (assigned_clients);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users (team_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Update existing users with default permissions based on their role
UPDATE users 
SET permissions = CASE 
  WHEN role = 'admin' THEN '{
    "dashboard": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "projects": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "verdelers": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "clients": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "uploads": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "testing": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "meldingen": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "gebruikers": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "access_codes": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "client_portals": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "insights": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true},
    "account": {"create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true}
  }'::jsonb
  WHEN role = 'standard_user' THEN '{
    "dashboard": {"create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false},
    "projects": {"create": true, "read": true, "update": true, "delete": true, "approve": false, "configure": false, "export": true, "assign": false},
    "verdelers": {"create": true, "read": true, "update": true, "delete": true, "approve": false, "configure": false, "export": true, "assign": false},
    "clients": {"create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": true, "assign": false},
    "uploads": {"create": true, "read": true, "update": true, "delete": true, "approve": false, "configure": false, "export": true, "assign": false},
    "testing": {"create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false},
    "meldingen": {"create": false, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false},
    "gebruikers": {"create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false},
    "access_codes": {"create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false},
    "client_portals": {"create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false},
    "insights": {"create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false},
    "account": {"create": false, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false}
  }'::jsonb
  ELSE '{}'::jsonb
END
WHERE permissions IS NULL OR permissions = '{}'::jsonb;