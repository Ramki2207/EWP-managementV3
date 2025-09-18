# EWP Management System - Role-Based Access Control (RBAC) Design

## Executive Summary

This document defines a comprehensive Role-Based Access Control (RBAC) system for the EWP Management System, providing granular permissions across all modules while maintaining security, scalability, and maintainability.

## 1. Role Definitions & Responsibilities

### 1.1 Core Roles

#### **Super Admin**
- **Purpose**: System administration and configuration
- **Scope**: Full system access including user management and system configuration
- **Key Responsibilities**:
  - System configuration and maintenance
  - User role assignment and permission management
  - Database administration and backup oversight
  - Security policy enforcement
  - Audit log review and compliance

#### **Project Manager**
- **Purpose**: Complete project lifecycle management
- **Scope**: Full project control with team coordination
- **Key Responsibilities**:
  - Project creation, planning, and execution
  - Resource allocation and timeline management
  - Client communication and relationship management
  - Quality assurance and delivery oversight
  - Team coordination and task assignment

#### **Technical Lead**
- **Purpose**: Technical oversight and quality control
- **Scope**: Technical aspects of projects and testing
- **Key Responsibilities**:
  - Technical specification review and approval
  - Testing workflow oversight and validation
  - Quality control and compliance verification
  - Technical documentation review
  - Engineering decision making

#### **Workshop Technician**
- **Purpose**: Hands-on manufacturing and testing
- **Scope**: Workshop operations and basic testing
- **Key Responsibilities**:
  - Distributor assembly and manufacturing
  - Workshop checklist execution
  - Basic testing and measurements
  - Documentation of work performed
  - Equipment maintenance reporting

#### **Field Engineer**
- **Purpose**: On-site installation and commissioning
- **Scope**: Field operations and customer site work
- **Key Responsibilities**:
  - On-site testing and commissioning
  - Installation supervision and verification
  - Customer training and handover
  - Field issue resolution
  - Maintenance and service calls

#### **Quality Inspector**
- **Purpose**: Quality assurance and compliance
- **Scope**: Quality control and certification
- **Key Responsibilities**:
  - Final inspection and approval
  - Compliance verification
  - Certificate generation and validation
  - Non-conformance investigation
  - Process improvement recommendations

#### **Client Viewer**
- **Purpose**: Limited client access to project information
- **Scope**: Read-only access to specific project data
- **Key Responsibilities**:
  - View assigned project status and progress
  - Access approved documentation
  - Download certificates and reports
  - Submit feedback and requests

#### **Service Technician**
- **Purpose**: Maintenance and repair operations
- **Scope**: Service desk and maintenance workflows
- **Key Responsibilities**:
  - Maintenance request processing
  - Repair work execution and documentation
  - Service report generation
  - Customer communication for service issues
  - Preventive maintenance scheduling

## 2. Granular Permission System

### 2.1 Permission Types (CRUD + Extended)

```typescript
interface Permission {
  module: string;
  actions: {
    create: boolean;    // Create new records
    read: boolean;      // View existing records
    update: boolean;    // Modify existing records
    delete: boolean;    // Remove records
    approve: boolean;   // Approve/reject items
    configure: boolean; // System configuration
    export: boolean;    // Export data/reports
    assign: boolean;    // Assign to others
  };
  scope: 'all' | 'own' | 'team' | 'assigned'; // Data scope limitation
  conditions?: string[]; // Additional conditions
}
```

### 2.2 System Modules

1. **projects** - Project Management
2. **distributors** - Distributor/Verdeler Management
3. **documents** - Document Management
4. **testing** - Testing Workflows
5. **notifications** - Service Desk & Notifications
6. **client_portals** - Client Portal Management
7. **access_codes** - QR Code & Access Management
8. **insights** - Analytics & Reporting
9. **users** - User Management
10. **clients** - Client Information Management
11. **system** - System Configuration

## 3. Role-Permission Matrix

### 3.1 Super Admin
```json
{
  "projects": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "distributors": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "documents": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "testing": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "notifications": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "client_portals": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "access_codes": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "insights": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "users": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "clients": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "system": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" }
}
```

### 3.2 Project Manager
```json
{
  "projects": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": false, "export": true, "assign": true, "scope": "all" },
  "distributors": { "create": true, "read": true, "update": true, "delete": true, "approve": false, "configure": false, "export": true, "assign": true, "scope": "all" },
  "documents": { "create": true, "read": true, "update": true, "delete": true, "approve": false, "configure": false, "export": true, "assign": false, "scope": "all" },
  "testing": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": true, "scope": "all" },
  "notifications": { "create": false, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": true, "assign": true, "scope": "all" },
  "client_portals": { "create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" },
  "access_codes": { "create": true, "read": true, "update": true, "delete": true, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" },
  "insights": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false, "scope": "all" },
  "users": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "team" },
  "clients": { "create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": true, "assign": false, "scope": "all" },
  "system": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" }
}
```

### 3.3 Technical Lead
```json
{
  "projects": { "create": false, "read": true, "update": true, "delete": false, "approve": true, "configure": false, "export": true, "assign": false, "scope": "all" },
  "distributors": { "create": true, "read": true, "update": true, "delete": false, "approve": true, "configure": false, "export": true, "assign": false, "scope": "all" },
  "documents": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": false, "export": true, "assign": false, "scope": "all" },
  "testing": { "create": true, "read": true, "update": true, "delete": false, "approve": true, "configure": true, "export": true, "assign": true, "scope": "all" },
  "notifications": { "create": false, "read": true, "update": true, "delete": false, "approve": true, "configure": false, "export": true, "assign": true, "scope": "all" },
  "client_portals": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" },
  "access_codes": { "create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" },
  "insights": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false, "scope": "all" },
  "users": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "team" },
  "clients": { "create": false, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" },
  "system": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" }
}
```

### 3.4 Workshop Technician
```json
{
  "projects": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "distributors": { "create": false, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "documents": { "create": true, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false, "scope": "assigned" },
  "testing": { "create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "own" },
  "notifications": { "create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "own" },
  "client_portals": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" },
  "access_codes": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" },
  "insights": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "own" },
  "users": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" },
  "clients": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "system": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" }
}
```

### 3.5 Field Engineer
```json
{
  "projects": { "create": false, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "distributors": { "create": false, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "documents": { "create": true, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false, "scope": "assigned" },
  "testing": { "create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": true, "assign": false, "scope": "assigned" },
  "notifications": { "create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "client_portals": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "access_codes": { "create": true, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "insights": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "users": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" },
  "clients": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "system": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" }
}
```

### 3.6 Quality Inspector
```json
{
  "projects": { "create": false, "read": true, "update": true, "delete": false, "approve": true, "configure": false, "export": true, "assign": false, "scope": "all" },
  "distributors": { "create": false, "read": true, "update": true, "delete": false, "approve": true, "configure": false, "export": true, "assign": false, "scope": "all" },
  "documents": { "create": true, "read": true, "update": false, "delete": false, "approve": true, "configure": false, "export": true, "assign": false, "scope": "all" },
  "testing": { "create": false, "read": true, "update": false, "delete": false, "approve": true, "configure": false, "export": true, "assign": false, "scope": "all" },
  "notifications": { "create": false, "read": true, "update": true, "delete": false, "approve": true, "configure": false, "export": true, "assign": false, "scope": "all" },
  "client_portals": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" },
  "access_codes": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" },
  "insights": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false, "scope": "all" },
  "users": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "team" },
  "clients": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" },
  "system": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" }
}
```

### 3.7 Client Viewer
```json
{
  "projects": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "distributors": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "documents": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false, "scope": "assigned" },
  "testing": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false, "scope": "assigned" },
  "notifications": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" },
  "client_portals": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "own" },
  "access_codes": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" },
  "insights": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "users": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" },
  "clients": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "own" },
  "system": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" }
}
```

### 3.8 Service Technician
```json
{
  "projects": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "distributors": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "documents": { "create": true, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": true, "assign": false, "scope": "assigned" },
  "testing": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "notifications": { "create": true, "read": true, "update": true, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "all" },
  "client_portals": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" },
  "access_codes": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "insights": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "users": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" },
  "clients": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "assigned" },
  "system": { "create": false, "read": false, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false, "scope": "none" }
}
```

## 4. Database Implementation

### 4.1 Enhanced Users Table Structure
```sql
-- Enhanced users table with RBAC support
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES roles(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_projects uuid[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_clients uuid[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_permission_update timestamptz DEFAULT now();
```

### 4.2 New RBAC Tables
```sql
-- Roles table for predefined roles
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}',
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Teams table for organizational structure
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Permission audit log
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL, -- 'granted', 'revoked', 'used'
  module text NOT NULL,
  permission_type text NOT NULL, -- 'create', 'read', 'update', etc.
  resource_id uuid, -- ID of the resource being accessed
  resource_type text, -- 'project', 'distributor', etc.
  granted_by uuid REFERENCES users(id),
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Project assignments for scoped access
CREATE TABLE IF NOT EXISTS project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  project_id uuid REFERENCES projects(id),
  role text NOT NULL, -- 'manager', 'technician', 'viewer'
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, project_id)
);
```

### 4.3 Row Level Security (RLS) Policies

#### Projects RLS
```sql
-- Projects: Users can only see projects they're assigned to or have role access
CREATE POLICY "projects_access_policy" ON projects
  FOR ALL TO authenticated
  USING (
    -- Super admins and project managers see all
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('super_admin', 'project_manager')
    )
    OR
    -- Users see assigned projects
    auth.uid() IN (
      SELECT user_id FROM project_assignments 
      WHERE project_id = projects.id AND is_active = true
    )
    OR
    -- Users with 'all' scope for projects module
    auth.uid() IN (
      SELECT id FROM users 
      WHERE permissions->>'projects'->>'scope' = 'all'
      AND permissions->>'projects'->>'read' = 'true'
    )
  );
```

#### Distributors RLS
```sql
-- Distributors: Access based on project assignment and role
CREATE POLICY "distributors_access_policy" ON distributors
  FOR ALL TO authenticated
  USING (
    -- Check project access first
    project_id IN (
      SELECT id FROM projects 
      WHERE -- Use projects RLS policy
    )
    AND
    (
      -- Technical roles have broader access
      auth.uid() IN (
        SELECT id FROM users 
        WHERE role IN ('super_admin', 'project_manager', 'technical_lead', 'quality_inspector')
      )
      OR
      -- Technicians see assigned distributors
      auth.uid() IN (
        SELECT user_id FROM project_assignments 
        WHERE project_id = distributors.project_id 
        AND is_active = true
      )
    )
  );
```

#### Documents RLS
```sql
-- Documents: Access based on project/distributor assignment
CREATE POLICY "documents_access_policy" ON documents
  FOR ALL TO authenticated
  USING (
    -- Check project access
    project_id IN (
      SELECT id FROM projects 
      WHERE -- Use projects RLS policy
    )
    AND
    (
      -- Management roles see all documents
      auth.uid() IN (
        SELECT id FROM users 
        WHERE role IN ('super_admin', 'project_manager', 'technical_lead')
      )
      OR
      -- Others see documents for assigned projects
      auth.uid() IN (
        SELECT user_id FROM project_assignments 
        WHERE project_id = documents.project_id 
        AND is_active = true
      )
    )
  );
```

## 5. Frontend Implementation

### 5.1 Enhanced Permission Hook
```typescript
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<PermissionSet>({});

  const hasPermission = (
    module: string, 
    action: PermissionAction, 
    resourceId?: string
  ): boolean => {
    if (!user || !permissions[module]) return false;
    
    const modulePerms = permissions[module];
    
    // Check basic permission
    if (!modulePerms.actions[action]) return false;
    
    // Check scope limitations
    switch (modulePerms.scope) {
      case 'all':
        return true;
      case 'own':
        return user.id === resourceId;
      case 'team':
        return user.team_id && isInSameTeam(resourceId);
      case 'assigned':
        return isAssignedToResource(resourceId);
      default:
        return false;
    }
  };

  const canAccessModule = (module: string): boolean => {
    return permissions[module]?.actions.read || false;
  };

  return { user, permissions, hasPermission, canAccessModule };
};
```

### 5.2 Enhanced Permission Route Component
```typescript
// src/components/EnhancedPermissionRoute.tsx
interface EnhancedPermissionRouteProps {
  children: React.ReactNode;
  module: string;
  action: PermissionAction;
  resourceId?: string;
  fallback?: React.ReactNode;
}

const EnhancedPermissionRoute: React.FC<EnhancedPermissionRouteProps> = ({
  children,
  module,
  action,
  resourceId,
  fallback
}) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(module, action, resourceId)) {
    return fallback || <AccessDenied module={module} action={action} />;
  }
  
  return <>{children}</>;
};
```

### 5.3 Permission Audit Service
```typescript
// src/lib/permissionAudit.ts
class PermissionAuditService {
  async logPermissionUsage(
    module: string,
    action: PermissionAction,
    resourceId?: string,
    resourceType?: string
  ) {
    try {
      const { error } = await supabase
        .from('permission_audit_log')
        .insert([{
          user_id: getCurrentUserId(),
          action: 'used',
          module,
          permission_type: action,
          resource_id: resourceId,
          resource_type: resourceType,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        }]);
      
      if (error) console.error('Audit logging failed:', error);
    } catch (error) {
      console.error('Permission audit error:', error);
    }
  }

  async getPermissionHistory(userId: string, days: number = 30) {
    const { data, error } = await supabase
      .from('permission_audit_log')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    return data || [];
  }
}
```

## 6. Supabase RLS Implementation

### 6.1 Dynamic RLS Function
```sql
-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
  user_id uuid,
  module_name text,
  action_name text,
  resource_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  user_record users%ROWTYPE;
  user_permissions jsonb;
  module_perms jsonb;
  scope_type text;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM users WHERE id = user_id;
  
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
  IF NOT (module_perms->'actions'->>action_name)::boolean THEN
    RETURN false;
  END IF;
  
  -- Check scope limitations
  scope_type := module_perms->>'scope';
  
  CASE scope_type
    WHEN 'all' THEN
      RETURN true;
    WHEN 'own' THEN
      RETURN resource_id = user_id;
    WHEN 'assigned' THEN
      -- Check project assignments
      RETURN EXISTS (
        SELECT 1 FROM project_assignments 
        WHERE user_id = check_user_permission.user_id 
        AND project_id = resource_id 
        AND is_active = true
      );
    WHEN 'team' THEN
      -- Check team membership
      RETURN EXISTS (
        SELECT 1 FROM users u1, users u2 
        WHERE u1.id = check_user_permission.user_id 
        AND u2.id = resource_id 
        AND u1.team_id = u2.team_id 
        AND u1.team_id IS NOT NULL
      );
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6.2 Module-Specific RLS Policies
```sql
-- Projects with enhanced RLS
CREATE POLICY "projects_enhanced_access" ON projects
  FOR ALL TO authenticated
  USING (check_user_permission(auth.uid(), 'projects', 'read', id));

CREATE POLICY "projects_enhanced_update" ON projects
  FOR UPDATE TO authenticated
  USING (check_user_permission(auth.uid(), 'projects', 'update', id));

CREATE POLICY "projects_enhanced_delete" ON projects
  FOR DELETE TO authenticated
  USING (check_user_permission(auth.uid(), 'projects', 'delete', id));

-- Similar policies for other tables...
```

## 7. Custom Roles & Future Extensibility

### 7.1 Custom Role Creation
```typescript
interface CustomRole {
  id: string;
  name: string;
  description: string;
  baseRole: string; // Inherit from existing role
  customPermissions: PermissionOverride[];
  conditions: RoleCondition[];
}

interface PermissionOverride {
  module: string;
  action: PermissionAction;
  granted: boolean;
  reason: string;
}

interface RoleCondition {
  type: 'time_based' | 'location_based' | 'project_based';
  parameters: Record<string, any>;
}
```

### 7.2 Role Inheritance System
```typescript
class RoleManager {
  createCustomRole(baseRole: string, overrides: PermissionOverride[]): CustomRole {
    const basePermissions = this.getBaseRolePermissions(baseRole);
    const customPermissions = this.applyOverrides(basePermissions, overrides);
    
    return {
      id: generateId(),
      name: `Custom ${baseRole}`,
      baseRole,
      permissions: customPermissions,
      customPermissions: overrides
    };
  }

  validateRoleHierarchy(role: CustomRole): boolean {
    // Ensure custom roles don't exceed base role capabilities
    // Prevent privilege escalation
    return this.isValidRoleEscalation(role);
  }
}
```

## 8. Best Practices for RBAC Implementation

### 8.1 Security Best Practices

1. **Principle of Least Privilege**
   - Users get minimum permissions needed for their role
   - Regular permission audits and reviews
   - Automatic permission expiration for temporary access

2. **Defense in Depth**
   - Frontend permission checks for UX
   - Backend RLS policies for data security
   - API-level validation for all operations
   - Audit logging for accountability

3. **Permission Validation**
   ```typescript
   // Always validate permissions at multiple layers
   const validateAction = async (action: string, resourceId: string) => {
     // 1. Frontend check (UX)
     if (!hasPermission(module, action)) {
       throw new UIError('Access denied');
     }
     
     // 2. API validation (Security)
     const allowed = await checkPermissionAPI(module, action, resourceId);
     if (!allowed) {
       throw new SecurityError('Unauthorized');
     }
     
     // 3. Database RLS (Final barrier)
     // Handled automatically by Supabase RLS policies
   };
   ```

### 8.2 Scalability Considerations

1. **Permission Caching**
   - Cache user permissions in localStorage
   - Invalidate cache on permission changes
   - Background refresh for long sessions

2. **Lazy Loading**
   - Load permissions on-demand
   - Module-specific permission loading
   - Efficient permission queries

3. **Performance Optimization**
   - Index permission columns
   - Optimize RLS policy queries
   - Use materialized views for complex permission checks

### 8.3 Maintainability Guidelines

1. **Centralized Permission Logic**
   - Single source of truth for permissions
   - Reusable permission checking functions
   - Consistent naming conventions

2. **Documentation**
   - Document all permission changes
   - Maintain role-permission mapping
   - Version control for permission schemas

3. **Testing**
   - Unit tests for permission logic
   - Integration tests for RLS policies
   - Security testing for privilege escalation

## 9. Auditing & Accountability

### 9.1 Audit Trail Implementation
```typescript
interface AuditEvent {
  id: string;
  userId: string;
  action: string;
  module: string;
  resourceId?: string;
  resourceType?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
}

class AuditService {
  async logAction(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
    await supabase.from('audit_log').insert([{
      ...event,
      timestamp: new Date().toISOString()
    }]);
  }

  async getAuditTrail(filters: AuditFilters) {
    return supabase
      .from('audit_log')
      .select('*')
      .match(filters)
      .order('timestamp', { ascending: false });
  }
}
```

### 9.2 Real-time Permission Monitoring
```typescript
// Monitor permission usage in real-time
const usePermissionMonitoring = () => {
  useEffect(() => {
    const subscription = supabase
      .channel('permission_monitoring')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'permission_audit_log'
      }, (payload) => {
        // Real-time permission usage alerts
        if (payload.new.action === 'unauthorized_attempt') {
          showSecurityAlert(payload.new);
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);
};
```

## 10. Implementation Roadmap

### Phase 1: Core RBAC (Immediate)
- [ ] Implement enhanced permission system
- [ ] Create role management interface
- [ ] Add permission audit logging
- [ ] Update RLS policies

### Phase 2: Advanced Features (Short-term)
- [ ] Custom role creation
- [ ] Team-based permissions
- [ ] Project assignment system
- [ ] Permission analytics dashboard

### Phase 3: Enterprise Features (Long-term)
- [ ] SSO integration
- [ ] Advanced audit reporting
- [ ] Compliance frameworks
- [ ] API access control

## 11. Final Role-Permission Overview Table

| Role | Projects | Distributors | Documents | Testing | Notifications | Client Portals | Access Codes | Insights | Users | Clients | System |
|------|----------|--------------|-----------|---------|---------------|----------------|--------------|----------|-------|---------|---------|
| **Super Admin** | Full | Full | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| **Project Manager** | CRUD+Approve | CRUD | CRUD | Read+Export | Read+Update+Assign | CRUD | CRUD | Read+Export | Read (Team) | CRUD | Read |
| **Technical Lead** | Read+Update+Approve | CRUD+Approve | CRUD+Approve | Full | Read+Update+Approve | Read | CRUD | Read+Export | Read (Team) | Read+Update | Read |
| **Workshop Technician** | Read (Assigned) | Read+Update (Assigned) | Create+Read (Assigned) | Create+Update (Own) | Create+Update (Own) | None | None | Read (Own) | None | Read (Assigned) | None |
| **Field Engineer** | Read+Update (Assigned) | Read+Update (Assigned) | Create+Read (Assigned) | Create+Update (Assigned) | Create+Update (Assigned) | Read (Assigned) | Create+Read (Assigned) | Read (Assigned) | None | Read (Assigned) | None |
| **Quality Inspector** | Read+Update+Approve | Read+Update+Approve | Create+Read+Approve | Read+Approve | Read+Update+Approve | Read | Read | Read+Export | Read (Team) | Read | Read |
| **Client Viewer** | Read (Assigned) | Read (Assigned) | Read+Export (Assigned) | Read+Export (Assigned) | None | Read (Own) | None | Read (Assigned) | None | Read (Own) | None |
| **Service Technician** | Read (Assigned) | Read (Assigned) | Create+Read (Assigned) | Read (Assigned) | CRUD | None | Read (Assigned) | Read (Assigned) | None | Read (Assigned) | None |

### Legend:
- **Full**: All permissions (CRUD + Approve + Configure + Export + Assign)
- **CRUD**: Create, Read, Update, Delete
- **Scope Indicators**:
  - (All): Access to all records
  - (Own): Only records created by user
  - (Team): Records within user's team
  - (Assigned): Records user is assigned to
  - (None): No access

## 12. Security Recommendations

### 12.1 Implementation Priorities
1. **Immediate**: Implement RLS policies for all sensitive tables
2. **Short-term**: Add permission audit logging
3. **Medium-term**: Implement team-based access control
4. **Long-term**: Add advanced compliance features

### 12.2 Monitoring & Alerts
- Real-time alerts for unauthorized access attempts
- Daily permission usage reports
- Weekly security reviews
- Monthly compliance audits

This RBAC system provides enterprise-grade security while maintaining flexibility for future growth and customization needs.