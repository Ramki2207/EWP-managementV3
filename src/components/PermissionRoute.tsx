import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { SystemModule, ModulePermissions } from '../types/userRoles';

interface PermissionRouteProps {
  children: JSX.Element;
  requiredPermission?: {
    module: SystemModule;
    permission: keyof ModulePermissions;
  };
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ children, requiredPermission }) => {
  const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
  
  // For routes without specific permission requirements, just check login
  if (!requiredPermission) {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }
  
  // For routes with permission requirements, use dynamic import to avoid Supabase dependency
  const [permissionState, setPermissionState] = React.useState<{
    loading: boolean;
    hasAccess: boolean;
    user: any;
  }>({ loading: true, hasAccess: false, user: null });

  React.useEffect(() => {
    const checkPermissions = async () => {
      if (!isLoggedIn) {
        setPermissionState({ loading: false, hasAccess: false, user: null });
        return;
      }

      try {
        // Dynamically import the permissions hook to avoid Supabase dependency
        const { useEnhancedPermissions } = await import('../hooks/useEnhancedPermissions');
        
        // Get current user from localStorage
        const currentUserId = localStorage.getItem('currentUserId');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = users.find((u: any) => u.id === currentUserId);
        
        if (!currentUser) {
          setPermissionState({ loading: false, hasAccess: false, user: null });
          return;
        }

        // Check permissions
        let hasAccess = false;

        if (currentUser.role === 'admin') {
          hasAccess = true;
          console.log('🔐 ROUTE: Admin user - access granted to', requiredPermission.module);
        } else if (currentUser.username === 'Annemieke' && requiredPermission.module === 'worksheets') {
          // Special access for Annemieke to Personeelsbeheer
          hasAccess = true;
          console.log('🔐 ROUTE: Special access granted to Annemieke for worksheets');
        } else {
          const modulePerms = currentUser.permissions?.[requiredPermission.module];
          hasAccess = modulePerms?.[requiredPermission.permission] || false;
          console.log('🔐 ROUTE: Permission check for', requiredPermission.module, requiredPermission.permission, '=', hasAccess);
          console.log('🔐 ROUTE: Module permissions:', modulePerms);
          console.log('🔐 ROUTE: User:', currentUser.username, 'Role:', currentUser.role);
        }

        setPermissionState({ loading: false, hasAccess, user: currentUser });
      } catch (error) {
        console.error('Error checking permissions:', error);
        setPermissionState({ loading: false, hasAccess: false, user: null });
      }
    };

    checkPermissions();
  }, [isLoggedIn, requiredPermission]);
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (permissionState.loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Toegangsrechten controleren...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!permissionState.user) {
    return <Navigate to="/login" replace />;
  }

  if (!permissionState.hasAccess) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-red-400 text-2xl">🚫</div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Toegang Geweigerd</h2>
            <p className="text-gray-400 mb-4">
              Je hebt geen toegang tot deze pagina
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-300">
                <strong>Vereiste permissie:</strong> {requiredPermission.permission} op {requiredPermission.module}
              </p>
              <p className="text-sm text-red-300 mt-1">
                <strong>Jouw rol:</strong> {permissionState.user.role}
              </p>
              <p className="text-sm text-red-300 mt-1">
                <strong>Jouw {requiredPermission.module} permissies:</strong> {JSON.stringify(permissionState.user.permissions?.[requiredPermission.module] || {}, null, 2)}
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="btn-primary mt-4"
            >
              Terug
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default PermissionRoute;