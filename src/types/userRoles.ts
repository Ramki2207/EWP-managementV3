// Enhanced User Roles and Permissions Type Definitions

export type SystemRole = 'admin' | 'standard_user' | 'tester' | 'servicedesk' | 'planner' | 'projectleider' | 'magazijn' | 'logistiek' | 'montage' | 'finance';

export type SystemModule = 
  | 'dashboard'
  | 'projects' 
  | 'verdelers'
  | 'clients'
  | 'uploads'
  | 'testing'
  | 'meldingen'
  | 'gebruikers'
  | 'access_codes'
  | 'client_portals'
  | 'insights'
  | 'account';

export interface ModulePermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  approve: boolean;
  configure: boolean;
  export: boolean;
  assign: boolean;
}

export interface UserPermissions {
  [module: string]: ModulePermissions;
}

export interface EnhancedUser {
  id: string;
  username: string;
  email: string;
  password: string;
  role: SystemRole;
  permissions: UserPermissions;
  assignedLocations: string[]; // Array of locations user can access
  profilePicture?: string;
  createdAt: string;
  lastLogin?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  isActive: boolean;
  notes?: string;
}

export const AVAILABLE_LOCATIONS = [
  'Leerdam',
  'Naaldwijk', 
  'Rotterdam'
] as const;

export type Location = typeof AVAILABLE_LOCATIONS[number];

export interface RoleTemplate {
  name: string;
  description: string;
  permissions: UserPermissions;
  color: string;
  icon: string;
}

export interface PermissionOverride {
  module: SystemModule;
  permission: keyof ModulePermissions;
  value: boolean;
  reason?: string;
  grantedBy: string;
  grantedAt: string;
}

export interface UserCreationData {
  username: string;
  email: string;
  password: string;
  role: SystemRole;
  customPermissions?: PermissionOverride[];
  profilePicture?: string;
  notes?: string;
}

export interface PermissionAuditEntry {
  id: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'permission_changed';
  module?: SystemModule;
  oldValue?: any;
  newValue?: any;
  performedBy: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// Default role templates
export const ROLE_TEMPLATES: Record<SystemRole, RoleTemplate> = {
  admin: {
    name: 'Administrator',
    description: 'Volledige toegang tot alle systeem functies',
    color: 'bg-red-500',
    icon: 'Shield',
    permissions: {
      dashboard: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      projects: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      verdelers: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      clients: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      uploads: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      testing: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      meldingen: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      gebruikers: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      access_codes: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      client_portals: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      insights: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      account: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true }
    }
  },

  standard_user: {
    name: 'Standaard Gebruiker',
    description: 'Reguliere bedrijfsoperaties en projectbeheer',
    color: 'bg-blue-500',
    icon: 'User',
    permissions: {
      dashboard: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      projects: { create: true, read: true, update: true, delete: true, approve: false, configure: false, export: true, assign: false },
      verdelers: { create: true, read: true, update: true, delete: true, approve: false, configure: false, export: true, assign: false },
      clients: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: false },
      uploads: { create: true, read: true, update: true, delete: true, approve: false, configure: false, export: true, assign: false },
      testing: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      meldingen: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      gebruikers: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      access_codes: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      client_portals: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      insights: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      account: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false }
    }
  },

  tester: {
    name: 'Tester',
    description: 'Kwaliteitsborging en test workflows',
    color: 'bg-green-500',
    icon: 'CheckSquare',
    permissions: {
      dashboard: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      projects: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      verdelers: { create: false, read: true, update: true, delete: false, approve: true, configure: false, export: true, assign: false },
      clients: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      uploads: { create: true, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      testing: { create: true, read: true, update: true, delete: false, approve: true, configure: true, export: true, assign: true },
      meldingen: { create: false, read: true, update: true, delete: false, approve: true, configure: false, export: false, assign: false },
      gebruikers: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      access_codes: { create: true, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      client_portals: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      insights: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      account: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false }
    }
  },

  servicedesk: {
    name: 'Servicedesk',
    description: 'Onderhoud en klantenservice operaties',
    color: 'bg-orange-500',
    icon: 'Headphones',
    permissions: {
      dashboard: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      projects: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      verdelers: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      clients: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      uploads: { create: true, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      testing: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      meldingen: { create: true, read: true, update: true, delete: true, approve: true, configure: true, export: true, assign: true },
      gebruikers: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      access_codes: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      client_portals: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      insights: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      account: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false }
    }
  },

  planner: {
    name: 'Planner',
    description: 'Project planning en resource management',
    color: 'bg-indigo-500',
    icon: 'Calendar',
    permissions: {
      dashboard: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      projects: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: true },
      verdelers: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: true },
      clients: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: false },
      uploads: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: false },
      testing: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: true },
      meldingen: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: true },
      gebruikers: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      access_codes: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      client_portals: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      insights: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      account: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false }
    }
  },

  projectleider: {
    name: 'Projectleider',
    description: 'Volledige projectverantwoordelijkheid en team coördinatie',
    color: 'bg-purple-500',
    icon: 'Crown',
    permissions: {
      dashboard: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      projects: { create: true, read: true, update: true, delete: true, approve: true, configure: false, export: true, assign: true },
      verdelers: { create: true, read: true, update: true, delete: true, approve: true, configure: false, export: true, assign: true },
      clients: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: false },
      uploads: { create: true, read: true, update: true, delete: true, approve: false, configure: false, export: true, assign: false },
      testing: { create: false, read: true, update: true, delete: false, approve: true, configure: false, export: true, assign: true },
      meldingen: { create: false, read: true, update: true, delete: false, approve: true, configure: false, export: true, assign: true },
      gebruikers: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      access_codes: { create: true, read: true, update: true, delete: true, approve: false, configure: false, export: false, assign: false },
      client_portals: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      insights: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      account: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false }
    }
  },

  magazijn: {
    name: 'Magazijn',
    description: 'Voorraad en materiaal beheer',
    color: 'bg-amber-500',
    icon: 'Package',
    permissions: {
      dashboard: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      projects: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      verdelers: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: false },
      clients: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      uploads: { create: true, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      testing: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      meldingen: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: false },
      gebruikers: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      access_codes: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      client_portals: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      insights: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      account: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false }
    }
  },

  logistiek: {
    name: 'Logistiek',
    description: 'Transport en levering coördinatie',
    color: 'bg-cyan-500',
    icon: 'Truck',
    permissions: {
      dashboard: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      projects: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: false },
      verdelers: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: false },
      clients: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: false },
      uploads: { create: true, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      testing: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      meldingen: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: true, assign: false },
      gebruikers: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      access_codes: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      client_portals: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      insights: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      account: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false }
    }
  },

  montage: {
    name: 'Montage',
    description: 'Assemblage en productie werkzaamheden',
    color: 'bg-emerald-500',
    icon: 'Wrench',
    permissions: {
      dashboard: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      projects: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      verdelers: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      clients: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      uploads: { create: true, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      testing: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      meldingen: { create: true, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false },
      gebruikers: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      access_codes: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      client_portals: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      insights: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      account: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false }
    }
  },

  finance: {
    name: 'Finance',
    description: 'Financiële administratie en facturatie',
    color: 'bg-yellow-500',
    icon: 'DollarSign',
    permissions: {
      dashboard: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      projects: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      verdelers: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      clients: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      uploads: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      testing: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      meldingen: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      gebruikers: { create: false, read: false, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      access_codes: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: false, assign: false },
      client_portals: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      insights: { create: false, read: true, update: false, delete: false, approve: false, configure: false, export: true, assign: false },
      account: { create: false, read: true, update: true, delete: false, approve: false, configure: false, export: false, assign: false }
    }
  }
};

// Permission validation utilities
export const validatePermissions = (permissions: UserPermissions): boolean => {
  const requiredModules: SystemModule[] = [
    'dashboard', 'projects', 'verdelers', 'clients', 'uploads', 
    'testing', 'meldingen', 'gebruikers', 'access_codes', 
    'client_portals', 'insights', 'account'
  ];

  for (const module of requiredModules) {
    if (!permissions[module]) return false;
    
    const requiredPerms: (keyof ModulePermissions)[] = [
      'create', 'read', 'update', 'delete', 'approve', 'configure', 'export', 'assign'
    ];
    
    for (const perm of requiredPerms) {
      if (typeof permissions[module][perm] !== 'boolean') {
        return false;
      }
    }
  }
  
  return true;
};

export const getDefaultPermissions = (role: SystemRole): UserPermissions => {
  return ROLE_TEMPLATES[role]?.permissions || {};
};

export const applyPermissionOverrides = (
  basePermissions: UserPermissions,
  overrides: PermissionOverride[]
): UserPermissions => {
  const result = JSON.parse(JSON.stringify(basePermissions)); // Deep clone
  
  overrides.forEach(override => {
    if (result[override.module]) {
      result[override.module][override.permission] = override.value;
    }
  });
  
  return result;
};

export const comparePermissions = (
  oldPerms: UserPermissions,
  newPerms: UserPermissions
): PermissionOverride[] => {
  const changes: PermissionOverride[] = [];
  
  Object.keys(newPerms).forEach(module => {
    Object.keys(newPerms[module]).forEach(permission => {
      const oldValue = oldPerms[module]?.[permission as keyof ModulePermissions] || false;
      const newValue = newPerms[module][permission as keyof ModulePermissions];
      
      if (oldValue !== newValue) {
        changes.push({
          module: module as SystemModule,
          permission: permission as keyof ModulePermissions,
          value: newValue,
          grantedBy: 'system',
          grantedAt: new Date().toISOString()
        });
      }
    });
  });
  
  return changes;
};