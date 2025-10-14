import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FolderOpen, Users, Bell, Upload, LayoutDashboard, UserCircle,
  HelpCircle, Server, Building, BarChart, Menu, X, Key, Globe,
  Calendar, Crown, Package, Truck, Wrench, DollarSign
} from 'lucide-react';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { SystemModule } from '../types/userRoles';
import ewpLogo from '../assets/ewp-logo.png';
import processLogo from '../assets/process-logo.png';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Startpagina', module: 'dashboard' as SystemModule },
  { path: '/projects', icon: FolderOpen, label: 'Projecten', module: 'projects' as SystemModule },
  { path: '/verdelers', icon: Server, label: 'Verdelers', module: 'verdelers' as SystemModule },
  { path: '/clients', icon: Building, label: 'Klanten', module: 'clients' as SystemModule },
  { path: '/meldingen', icon: Bell, label: 'Meldingen', module: 'meldingen' as SystemModule },
  { path: '/uploads', icon: Upload, label: 'Uploads', module: 'uploads' as SystemModule },
  { path: '/gebruikers', icon: Users, label: 'Gebruikers', module: 'gebruikers' as SystemModule },
  { path: '/access-codes', icon: Key, label: 'Toegangscodes', module: 'access_codes' as SystemModule },
  { path: '/client-portals', icon: Globe, label: 'Klant Portals', module: 'client_portals' as SystemModule },
  { path: '/insights', icon: BarChart, label: 'Inzichten', module: 'insights' as SystemModule },
];

const bottomNavItems = [
  { path: '/account', icon: UserCircle, label: 'Mijn account', module: 'account' as SystemModule },
  { path: '/help', icon: HelpCircle, label: 'Help', module: undefined },
];

const Sidebar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Load user data directly without using the hook to avoid dependency issues
  useEffect(() => {
    const loadUser = () => {
      try {
        const currentUserId = localStorage.getItem('currentUserId');
        console.log('🔍 SIDEBAR: Loading user with ID:', currentUserId);
        
        if (!currentUserId) {
          console.log('❌ SIDEBAR: No current user ID found');
          setUserLoading(false);
          return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find((u: any) => u.id === currentUserId);
        console.log('👤 SIDEBAR: Found user:', user?.username, 'Role:', user?.role);
        
        if (user) {
          setCurrentUser(user);
          console.log('✅ SIDEBAR: Current user set:', user.username);
        } else {
          console.log('❌ SIDEBAR: User not found in localStorage');
        }
      } catch (error) {
        console.error('❌ SIDEBAR: Error loading user:', error);
      } finally {
        setUserLoading(false);
      }
    };

    loadUser();
  }, []);

  const hasModuleAccess = (module?: SystemModule) => {
    if (!module) return true;
    if (!currentUser) {
      console.log('❌ SIDEBAR: No current user available for module access check', { userLoading });
      return false;
    }
    
    // Admin users have access to everything
    if (currentUser.role === 'admin') {
      console.log('✅ SIDEBAR: Admin user - access granted to', module);
      return true;
    }
    
    // Check specific module permissions
    const modulePermissions = currentUser.permissions?.[module];
    const hasAccess = modulePermissions?.read || false;
    console.log(`🔍 SIDEBAR: Module access check for ${module}:`, hasAccess, 'User:', currentUser.username);
    console.log(`🔍 SIDEBAR: Module permissions:`, modulePermissions);
    
    return hasAccess;
  };

  // Show loading state while user data is being loaded
  if (userLoading) {
    return (
      <div className="hidden md:flex w-64 bg-[#1E2530]/80 backdrop-blur-lg border-r border-white/10 text-white h-screen fixed left-0 top-0 flex-col overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm">Laden...</span>
          </div>
        </div>
      </div>
    );
  }

  const NavContent = () => (
    <>
      <div className="p-6">
        <div className="flex items-center justify-center mb-8">
          <img 
            src={ewpLogo}
            alt="EWP Paneelbouw" 
            className="h-20 max-w-[250px] object-contain mx-auto"
          />
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (!hasModuleAccess(item.module)) return null;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-[#2A303C]/80 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-white/10">
        <nav className="space-y-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-[#2A303C]/80 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="flex items-center justify-center">
            <img 
              src={processLogo}
              alt="Process Improvement" 
              className="h-8 object-contain"
            />
          </div>
          <p className="text-center text-sm text-gray-400 mt-2">
            Powered by Process Improvement B.V.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 right-4 z-50 p-2 bg-[#2A303C] rounded-lg md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile navigation */}
      {isMobileMenuOpen && (
        <div className="mobile-nav">
          <div className="mobile-nav-content">
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop navigation */}
      <div className="hidden md:flex w-64 bg-[#1E2530]/80 backdrop-blur-lg border-r border-white/10 text-white h-screen fixed left-0 top-0 flex-col overflow-y-auto">
        <NavContent />
      </div>
    </>
  );
};

export default Sidebar;