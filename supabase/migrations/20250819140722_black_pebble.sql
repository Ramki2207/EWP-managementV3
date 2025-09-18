/*
  # Enhanced RBAC System for EWP Management

  1. New Tables
    - `roles` - Predefined and custom role definitions
    - `teams` - Organizational structure for team-based permissions
    - `project_assignments` - User-project assignments for scoped access
    - `permission_audit_log` - Comprehensive audit trail for all permission usage

  2. Enhanced Tables
    - `users` - Extended with RBAC fields (role_id, team_id, assigned_projects, etc.)

  3. Security
    - Enhanced RLS policies for all tables
    - Permission validation functions
    - Audit logging triggers
    - Scope-based access control

  4. Performance
    - Optimized indexes for permission queries
    - Materialized views for complex permission checks
    - Efficient RLS policy implementation
*/

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add RBAC columns to users table
DO $$
BEGIN
  -- Add role_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE users ADD COLUMN role_id uuid;
  END IF;

  -- Add team_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE users ADD COLUMN team_id uuid;
  END IF;

  -- Add assigned_projects column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'assigned_projects'
  ) THEN
    ALTER TABLE users ADD COLUMN assigned_projects uuid[] DEFAULT '{}';
  END IF;

  -- Add assigned_clients column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'assigned_clients'
  ) THEN
    ALTER TABLE users ADD COLUMN assigned_clients uuid[] DEFAULT '{}';
  END IF;

  -- Add is_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  -- Add last_permission_update column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_permission_update'
  ) THEN
    ALTER TABLE users ADD COLUMN last_permission_update timestamptz DEFAULT now();
  END IF;
END $$;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}',
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Create project_assignments table
CREATE TABLE IF NOT EXISTS project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  role text NOT NULL,
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id, is_active)
);

-- Create permission_audit_log table
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  module text NOT NULL,
  permission_type text NOT NULL,
  resource_id uuid,
  resource_type text,
  granted_by uuid,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  session_id text,
  request_id text,
  duration_ms integer,
  risk_level text DEFAULT 'low',
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
DO $$
BEGIN
  -- Add foreign key for users.role_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'users' AND constraint_name = 'users_role_id_fkey'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for users.team_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'users' AND constraint_name = 'users_team_id_fkey'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_team_id_fkey 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for teams.manager_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'teams' AND constraint_name = 'teams_manager_id_fkey'
  ) THEN
    ALTER TABLE teams ADD CONSTRAINT teams_manager_id_fkey 
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for project_assignments.user_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'project_assignments' AND constraint_name = 'project_assignments_user_id_fkey'
  ) THEN
    ALTER TABLE project_assignments ADD CONSTRAINT project_assignments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for project_assignments.project_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'project_assignments' AND constraint_name = 'project_assignments_project_id_fkey'
  ) THEN
    ALTER TABLE project_assignments ADD CONSTRAINT project_assignments_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- Add foreign key for project_assignments.assigned_by if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'project_assignments' AND constraint_name = 'project_assignments_assigned_by_fkey'
  ) THEN
    ALTER TABLE project_assignments ADD CONSTRAINT project_assignments_assigned_by_fkey 
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for permission_audit_log.user_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'permission_audit_log' AND constraint_name = 'permission_audit_log_user_id_fkey'
  ) THEN
    ALTER TABLE permission_audit_log ADD CONSTRAINT permission_audit_log_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key for permission_audit_log.granted_by if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'permission_audit_log' AND constraint_name = 'permission_audit_log_granted_by_fkey'
  ) THEN
    ALTER TABLE permission_audit_log ADD CONSTRAINT permission_audit_log_granted_by_fkey 
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_assigned_projects ON users USING GIN(assigned_projects);
CREATE INDEX IF NOT EXISTS idx_users_assigned_clients ON users USING GIN(assigned_clients);

CREATE INDEX IF NOT EXISTS idx_project_assignments_user_id ON project_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project_id ON project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_active ON project_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_project_assignments_expires_at ON project_assignments(expires_at);

CREATE INDEX IF NOT EXISTS idx_permission_audit_log_user_id ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_module ON permission_audit_log(module);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_action ON permission_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_created_at ON permission_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_risk_level ON permission_audit_log(risk_level);

-- Enable RLS on new tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for roles table
CREATE POLICY "roles_read_policy" ON roles
  FOR SELECT TO authenticated
  USING (
    -- Super admins can see all roles
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
    OR
    -- Other users can see system roles only
    is_system_role = true
  );

CREATE POLICY "roles_write_policy" ON roles
  FOR ALL TO authenticated
  USING (
    -- Only super admins can modify roles
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
  );

-- Create RLS policies for teams table
CREATE POLICY "teams_read_policy" ON teams
  FOR SELECT TO authenticated
  USING (
    -- Super admins and project managers can see all teams
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('super_admin', 'project_manager')
    )
    OR
    -- Users can see their own team
    auth.uid() IN (
      SELECT id FROM users WHERE team_id = teams.id
    )
  );

CREATE POLICY "teams_write_policy" ON teams
  FOR ALL TO authenticated
  USING (
    -- Super admins and project managers can modify teams
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('super_admin', 'project_manager')
    )
    OR
    -- Team managers can modify their own team
    manager_id = auth.uid()
  );

-- Create RLS policies for project_assignments table
CREATE POLICY "project_assignments_read_policy" ON project_assignments
  FOR SELECT TO authenticated
  USING (
    -- Super admins and project managers can see all assignments
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('super_admin', 'project_manager')
    )
    OR
    -- Users can see their own assignments
    user_id = auth.uid()
    OR
    -- Users can see assignments for projects they manage
    auth.uid() IN (
      SELECT manager_id FROM teams t
      JOIN users u ON u.team_id = t.id
      WHERE u.id = project_assignments.user_id
    )
  );

CREATE POLICY "project_assignments_write_policy" ON project_assignments
  FOR ALL TO authenticated
  USING (
    -- Super admins and project managers can modify assignments
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('super_admin', 'project_manager')
    )
  );

-- Create RLS policies for permission_audit_log table
CREATE POLICY "audit_log_read_policy" ON permission_audit_log
  FOR SELECT TO authenticated
  USING (
    -- Super admins can see all audit logs
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
    OR
    -- Users can see their own audit logs
    user_id = auth.uid()
    OR
    -- Managers can see their team's audit logs
    auth.uid() IN (
      SELECT manager_id FROM teams t
      JOIN users u ON u.team_id = t.id
      WHERE u.id = permission_audit_log.user_id
    )
  );

CREATE POLICY "audit_log_write_policy" ON permission_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Users can only create audit logs for themselves
    user_id = auth.uid()
    OR
    -- System can create audit logs for any user
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
  );

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
  user_id uuid,
  module_name text,
  action_name text,
  resource_id uuid DEFAULT NULL,
  resource_type text DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  user_record users%ROWTYPE;
  user_permissions jsonb;
  module_perms jsonb;
  scope_type text;
  is_assigned boolean := false;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM users WHERE id = user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Super admins have all permissions
  IF user_record.role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  -- Get user permissions
  user_permissions := user_record.permissions;
  module_perms := user_permissions->module_name;
  
  -- Check if module permission exists
  IF module_perms IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check action permission
  IF NOT COALESCE((module_perms->'actions'->>action_name)::boolean, false) THEN
    RETURN false;
  END IF;
  
  -- Check scope limitations
  scope_type := module_perms->>'scope';
  
  CASE scope_type
    WHEN 'all' THEN
      RETURN true;
      
    WHEN 'own' THEN
      RETURN COALESCE(resource_id = user_id, true);
      
    WHEN 'assigned' THEN
      -- Check project assignments
      IF resource_type = 'project' OR resource_type IS NULL THEN
        SELECT EXISTS (
          SELECT 1 FROM project_assignments 
          WHERE user_id = check_user_permission.user_id 
          AND project_id = resource_id 
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > now())
        ) INTO is_assigned;
        
        IF is_assigned THEN
          RETURN true;
        END IF;
      END IF;
      
      -- Check if resource is in assigned projects array
      IF resource_id = ANY(user_record.assigned_projects) THEN
        RETURN true;
      END IF;
      
      -- Check if resource is in assigned clients array
      IF resource_id = ANY(user_record.assigned_clients) THEN
        RETURN true;
      END IF;
      
      RETURN false;
      
    WHEN 'team' THEN
      -- Check team membership
      IF user_record.team_id IS NULL THEN
        RETURN false;
      END IF;
      
      RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = resource_id 
        AND team_id = user_record.team_id
      );
      
    WHEN 'none' THEN
      RETURN false;
      
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log permission usage
CREATE OR REPLACE FUNCTION log_permission_usage(
  user_id uuid,
  module_name text,
  action_name text,
  resource_id uuid DEFAULT NULL,
  resource_type text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO permission_audit_log (
    user_id,
    action,
    module,
    permission_type,
    resource_id,
    resource_type,
    success
  ) VALUES (
    user_id,
    'permission_used',
    module_name,
    action_name,
    resource_id,
    resource_type,
    true
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the main operation if audit logging fails
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policies for existing tables

-- Projects table enhanced RLS
DROP POLICY IF EXISTS "projects_enhanced_access" ON projects;
CREATE POLICY "projects_enhanced_access" ON projects
  FOR SELECT TO authenticated
  USING (check_user_permission(auth.uid(), 'projects', 'read', id, 'project'));

DROP POLICY IF EXISTS "projects_enhanced_insert" ON projects;
CREATE POLICY "projects_enhanced_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (check_user_permission(auth.uid(), 'projects', 'create'));

DROP POLICY IF EXISTS "projects_enhanced_update" ON projects;
CREATE POLICY "projects_enhanced_update" ON projects
  FOR UPDATE TO authenticated
  USING (check_user_permission(auth.uid(), 'projects', 'update', id, 'project'));

DROP POLICY IF EXISTS "projects_enhanced_delete" ON projects;
CREATE POLICY "projects_enhanced_delete" ON projects
  FOR DELETE TO authenticated
  USING (check_user_permission(auth.uid(), 'projects', 'delete', id, 'project'));

-- Distributors table enhanced RLS
DROP POLICY IF EXISTS "distributors_enhanced_access" ON distributors;
CREATE POLICY "distributors_enhanced_access" ON distributors
  FOR SELECT TO authenticated
  USING (
    check_user_permission(auth.uid(), 'distributors', 'read', project_id, 'project')
    OR check_user_permission(auth.uid(), 'distributors', 'read', id, 'distributor')
  );

DROP POLICY IF EXISTS "distributors_enhanced_insert" ON distributors;
CREATE POLICY "distributors_enhanced_insert" ON distributors
  FOR INSERT TO authenticated
  WITH CHECK (check_user_permission(auth.uid(), 'distributors', 'create', project_id, 'project'));

DROP POLICY IF EXISTS "distributors_enhanced_update" ON distributors;
CREATE POLICY "distributors_enhanced_update" ON distributors
  FOR UPDATE TO authenticated
  USING (
    check_user_permission(auth.uid(), 'distributors', 'update', project_id, 'project')
    OR check_user_permission(auth.uid(), 'distributors', 'update', id, 'distributor')
  );

DROP POLICY IF EXISTS "distributors_enhanced_delete" ON distributors;
CREATE POLICY "distributors_enhanced_delete" ON distributors
  FOR DELETE TO authenticated
  USING (
    check_user_permission(auth.uid(), 'distributors', 'delete', project_id, 'project')
    OR check_user_permission(auth.uid(), 'distributors', 'delete', id, 'distributor')
  );

-- Documents table enhanced RLS
DROP POLICY IF EXISTS "documents_enhanced_access" ON documents;
CREATE POLICY "documents_enhanced_access" ON documents
  FOR SELECT TO authenticated
  USING (
    check_user_permission(auth.uid(), 'documents', 'read', project_id, 'project')
    OR check_user_permission(auth.uid(), 'documents', 'read', distributor_id, 'distributor')
  );

DROP POLICY IF EXISTS "documents_enhanced_insert" ON documents;
CREATE POLICY "documents_enhanced_insert" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (
    check_user_permission(auth.uid(), 'documents', 'create', project_id, 'project')
  );

DROP POLICY IF EXISTS "documents_enhanced_update" ON documents;
CREATE POLICY "documents_enhanced_update" ON documents
  FOR UPDATE TO authenticated
  USING (
    check_user_permission(auth.uid(), 'documents', 'update', project_id, 'project')
  );

DROP POLICY IF EXISTS "documents_enhanced_delete" ON documents;
CREATE POLICY "documents_enhanced_delete" ON documents
  FOR DELETE TO authenticated
  USING (
    check_user_permission(auth.uid(), 'documents', 'delete', project_id, 'project')
  );

-- Insert default system roles
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
  ('super_admin', 'Full system access and configuration', '{}', true),
  ('project_manager', 'Complete project lifecycle management', '{}', true),
  ('technical_lead', 'Technical oversight and quality control', '{}', true),
  ('workshop_technician', 'Manufacturing and basic testing operations', '{}', true),
  ('field_engineer', 'On-site installation and commissioning', '{}', true),
  ('quality_inspector', 'Quality assurance and compliance verification', '{}', true),
  ('client_viewer', 'Limited client access to project information', '{}', true),
  ('service_technician', 'Maintenance and repair operations', '{}', true)
ON CONFLICT (name) DO NOTHING;

-- Create trigger to automatically log permission changes
CREATE OR REPLACE FUNCTION audit_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log permission updates
  IF TG_OP = 'UPDATE' AND OLD.permissions IS DISTINCT FROM NEW.permissions THEN
    INSERT INTO permission_audit_log (
      user_id,
      action,
      module,
      permission_type,
      resource_id,
      resource_type,
      success
    ) VALUES (
      NEW.id,
      'permissions_changed',
      'users',
      'update',
      NEW.id,
      'user_permissions',
      true
    );
  END IF;
  
  -- Log role changes
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO permission_audit_log (
      user_id,
      action,
      module,
      permission_type,
      resource_id,
      resource_type,
      success
    ) VALUES (
      NEW.id,
      'role_changed',
      'users',
      'update',
      NEW.id,
      'user_role',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
DROP TRIGGER IF EXISTS audit_user_permission_changes ON users;
CREATE TRIGGER audit_user_permission_changes
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_permission_changes();

-- Create function to cleanup expired assignments
CREATE OR REPLACE FUNCTION cleanup_expired_assignments()
RETURNS integer AS $$
DECLARE
  cleanup_count integer;
BEGIN
  UPDATE project_assignments 
  SET is_active = false 
  WHERE expires_at < now() 
  AND is_active = true;
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Log cleanup activity
  INSERT INTO permission_audit_log (
    user_id,
    action,
    module,
    permission_type,
    success
  ) VALUES (
    NULL,
    'expired_assignments_cleanup',
    'system',
    'configure',
    true
  );
  
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's effective permissions
CREATE OR REPLACE FUNCTION get_user_effective_permissions(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  user_record users%ROWTYPE;
  base_permissions jsonb;
  effective_permissions jsonb;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM users WHERE id = user_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN '{}'::jsonb;
  END IF;
  
  -- Start with base permissions
  base_permissions := user_record.permissions;
  effective_permissions := base_permissions;
  
  -- Apply any role-based modifications here
  -- (Future enhancement for dynamic permission calculation)
  
  RETURN effective_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create materialized view for permission analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS permission_usage_stats AS
SELECT 
  module,
  permission_type,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', created_at) as usage_date
FROM permission_audit_log
WHERE action = 'permission_used'
AND created_at >= now() - interval '30 days'
GROUP BY module, permission_type, DATE_TRUNC('day', created_at)
ORDER BY usage_date DESC, usage_count DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_permission_usage_stats_date ON permission_usage_stats(usage_date);
CREATE INDEX IF NOT EXISTS idx_permission_usage_stats_module ON permission_usage_stats(module);

-- Refresh materialized view daily
-- Note: In production, this should be handled by a scheduled job