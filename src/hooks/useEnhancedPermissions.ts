import { useState, useEffect, useCallback } from 'react';
import { EnhancedUser, SystemModule, ModulePermissions, ROLE_TEMPLATES, SystemRole, UserPermissions } from '../types/userRoles';

export const useEnhancedPermissions = () => {
  const [currentUser, setCurrentUser] = useState<EnhancedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadCurrentUser();
  }, [refreshTrigger]);

  const loadCurrentUser = () => {
    try {
      const currentUserId = localStorage.getItem('currentUserId');
      console.log('🔍 PERMISSIONS: Loading user with ID:', currentUserId);
      
      if (!currentUserId) {
        console.log('❌ PERMISSIONS: No current user ID found');
        setLoading(false);
        return;
      }

      // Force fresh read from localStorage every time
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === currentUserId);
      console.log('👤 PERMISSIONS: Found user:', user?.username, 'Role:', user?.role);
      console.log('🔐 PERMISSIONS: Raw user permissions from localStorage:', user?.permissions);
      
      if (user) {
        // Ensure user has proper permissions structure
        const enhancedUser: EnhancedUser = {
          ...user,
          permissions: user.permissions || getDefaultPermissions(user.role || 'standard_user'),
          assignedLocations: user.assignedLocations || user.assigned_locations || [],
          isActive: user.isActive !== false
        };
        
        console.log('🌍 PERMISSIONS: User loaded with locations:', enhancedUser.assignedLocations);
        console.log('🌍 PERMISSIONS: Raw user data locations (assignedLocations):', user.assignedLocations);
        console.log('🌍 PERMISSIONS: Raw user data locations (assigned_locations):', user.assigned_locations);
        
        setCurrentUser(enhancedUser);
        console.log('✅ PERMISSIONS: Current user set with permissions:', enhancedUser.username);
        console.log('🔐 PERMISSIONS: FINAL LOADED PERMISSIONS:', enhancedUser.permissions);
        
        // Debug specific modules
        console.log('🔍 PERMISSIONS DEBUG:');
        console.log('  - access_codes:', enhancedUser.permissions.access_codes);
        console.log('  - client_portals:', enhancedUser.permissions.client_portals);
        console.log('  - insights:', enhancedUser.permissions.insights);
        console.log('  - verdelers:', enhancedUser.permissions.verdelers);
      } else {
        console.log('❌ PERMISSIONS: User not found in localStorage');
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get default permissions for a role
  const getDefaultPermissions = (role: SystemRole): UserPermissions => {
    const template = ROLE_TEMPLATES[role];
    return template?.permissions || ROLE_TEMPLATES.standard_user.permissions;
  };

  const hasPermission = useCallback((
    module: SystemModule,
    permission: keyof ModulePermissions
  ): boolean => {
    console.log(`🔍 PERMISSION CHECK: ${module}.${permission} for user:`, currentUser?.username, 'Role:', currentUser?.role);

    if (!currentUser) return false;

    // Check if admin is viewing as projectleider
    const viewAsProjectleider = localStorage.getItem('viewAsProjectleider') === 'true';
    const effectiveRole = currentUser.role === 'admin' && viewAsProjectleider ? 'projectleider' : currentUser.role;

    console.log(`🔄 EFFECTIVE ROLE: ${effectiveRole} (actual: ${currentUser.role}, viewAsProjectleider: ${viewAsProjectleider})`);

    // Admins have all permissions (unless viewing as projectleider)
    if (effectiveRole === 'admin') {
      console.log('✅ PERMISSION: Admin user - all permissions granted for', module, permission);
      return true;
    }

    // Special access for Zouhair Taha and Ibrahim Abdalla - montage + tester role
    if (currentUser.username === 'Zouhair Taha' || currentUser.username === 'Ibrahim Abdalla') {
      // Grant tester permissions
      if (module === 'projects' && (permission === 'update' || permission === 'read' || permission === 'approve')) {
        console.log(`✅ PERMISSION: ${currentUser.username} - special tester access granted for`, module, permission);
        return true;
      }
      if (module === 'verdelers' && (permission === 'update' || permission === 'read')) {
        console.log(`✅ PERMISSION: ${currentUser.username} - special tester access granted for`, module, permission);
        return true;
      }
    }

    // If viewing as projectleider, use projectleider permissions
    let modulePermissions;
    if (effectiveRole === 'projectleider' && currentUser.role === 'admin') {
      const projectleiderPerms = getDefaultPermissions('projectleider');
      modulePermissions = projectleiderPerms[module];
      console.log(`🔄 USING PROJECTLEIDER PERMISSIONS for ${module}:`, modulePermissions);
    } else {
      modulePermissions = currentUser.permissions?.[module];
    }

    const hasAccess = modulePermissions?.[permission] || false;

    console.log(`🔐 PERMISSION RESULT: ${module}.${permission} = ${hasAccess} (User: ${currentUser.username}, Effective Role: ${effectiveRole})`);
    console.log(`🔐 PERMISSION DETAILS: Module permissions for ${module}:`, modulePermissions);
    
    // Extra debug for problematic modules
    if (['access_codes', 'client_portals', 'insights'].includes(module)) {
      console.log(`🚨 RESTRICTED MODULE CHECK: ${module}`);
      console.log(`   User permissions for ${module}:`, modulePermissions);
      console.log(`   Requested permission (${permission}):`, modulePermissions?.[permission]);
      console.log(`   FINAL RESULT:`, hasAccess);
      console.log(`   Full user permissions object:`, currentUser.permissions);
    }
    
    return hasAccess;
  }, [currentUser]);

  const canAccessModule = useCallback((module: SystemModule): boolean => {
    const readAccess = hasPermission(module, 'read');
    console.log(`🔍 MODULE ACCESS: ${module} read permission = ${readAccess}`);
    return readAccess;
  }, [hasPermission]);

  const refreshPermissions = useCallback(() => {
    console.log('🔄 PERMISSIONS: Force refreshing permissions from localStorage...');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const getModulePermissions = useCallback((module: SystemModule): ModulePermissions => {
    if (!currentUser) {
      return {
        create: false,
        read: false,
        update: false,
        delete: false,
        approve: false,
        configure: false,
        export: false,
        assign: false
      };
    }

    if (currentUser.role === 'admin') {
      return {
        create: true,
        read: true,
        update: true,
        delete: true,
        approve: true,
        configure: true,
        export: true,
        assign: true
      };
    }

    // Special access for Zouhair Taha and Ibrahim Abdalla - montage + tester role
    if (currentUser.username === 'Zouhair Taha' || currentUser.username === 'Ibrahim Abdalla') {
      if (module === 'projects') {
        return {
          create: false,
          read: true,
          update: true,
          delete: false,
          approve: true,
          configure: false,
          export: false,
          assign: false
        };
      }
      if (module === 'verdelers') {
        return {
          create: false,
          read: true,
          update: true,
          delete: false,
          approve: false,
          configure: false,
          export: false,
          assign: false
        };
      }
    }

    return currentUser.permissions?.[module] || {
      create: false,
      read: false,
      update: false,
      delete: false,
      approve: false,
      configure: false,
      export: false,
      assign: false
    };
  }, [currentUser]);

  const isAdmin = useCallback((): boolean => {
    return currentUser?.role === 'admin' || false;
  }, [currentUser]);

  const isTester = useCallback((): boolean => {
    return currentUser?.role === 'tester' || false;
  }, [currentUser]);

  const isServicedesk = useCallback((): boolean => {
    return currentUser?.role === 'servicedesk' || false;
  }, [currentUser]);

  const getUserRole = useCallback((): string => {
    return currentUser?.role || 'unknown';
  }, [currentUser]);


  return {
    currentUser,
    loading,
    hasPermission,
    canAccessModule,
    getModulePermissions,
    isAdmin,
    isTester,
    isServicedesk,
    getUserRole,
    refreshPermissions
  };
};

// Permission checking utilities
export const checkPermission = (
  user: EnhancedUser | null,
  module: SystemModule,
  permission: keyof ModulePermissions
): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.[module]?.[permission] || false;
};

export const filterUsersByPermission = (
  users: EnhancedUser[],
  module: SystemModule,
  permission: keyof ModulePermissions
): EnhancedUser[] => {
  return users.filter(user => checkPermission(user, module, permission));
};

export const getUsersWithRole = (users: EnhancedUser[], role: SystemRole): EnhancedUser[] => {
  return users.filter(user => user.role === role);
};