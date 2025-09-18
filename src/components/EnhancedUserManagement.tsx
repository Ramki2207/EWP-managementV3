import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit, Trash2, Save, X, Eye, EyeOff, 
  Shield, UserPlus, Search, Filter, Crown, Calendar,
  Package, Truck, Wrench, DollarSign, CheckSquare, Headphones
} from 'lucide-react';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '../lib/supabase';
import { 
  SystemRole, 
  EnhancedUser, 
  ROLE_TEMPLATES, 
  UserPermissions,
  ModulePermissions,
  SystemModule,
  AVAILABLE_LOCATIONS,
  Location
} from '../types/userRoles';

const EnhancedUserManagement = () => {
  const [users, setUsers] = useState<EnhancedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<EnhancedUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'standard_user' as SystemRole,
    assignedLocations: [] as string[],
    profilePicture: '',
    notes: '',
    customPermissions: false
  });
  const [customPermissions, setCustomPermissions] = useState<UserPermissions>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Always load from localStorage first (primary source)
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      console.log('Loaded users from localStorage:', localUsers.length);
      
      // Convert to enhanced user format
      const enhancedUsers: EnhancedUser[] = localUsers.map((user: any) => ({
        ...user,
        permissions: user.permissions || getDefaultPermissions(user.role || 'standard_user'),
        isActive: user.isActive !== false,
        assignedLocations: user.assignedLocations || [] // Default to empty array if not set
      }));
      
      setUsers(enhancedUsers);
      
      // Try to sync with database in background
      try {
        const dbUsers = await dataService.getUsers();
        console.log('Database users loaded:', dbUsers.length);
        
        // Merge database users with localStorage (localStorage takes precedence)
        const mergedUsers = enhancedUsers.map(localUser => {
          const dbUser = dbUsers.find((u: any) => u.id === localUser.id);
          return dbUser ? { ...dbUser, ...localUser } : localUser;
        });
        
        setUsers(mergedUsers);
      } catch (dbError) {
        console.log('Database sync failed, using localStorage only:', dbError);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Er is een fout opgetreden bij het laden van de gebruikers');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPermissions = (role: SystemRole): UserPermissions => {
    return ROLE_TEMPLATES[role]?.permissions || ROLE_TEMPLATES.standard_user.permissions;
  };

  const handleRoleChange = (newRole: SystemRole) => {
    console.log('Role changing to:', newRole);
    
    const newPermissions = getDefaultPermissions(newRole);
    
    // Always update form data
    setFormData(prev => ({ ...prev, role: newRole }));
    setCustomPermissions(newPermissions);
    
    // If editing, also update the editing user
    if (editingUser) {
      const updatedUser = {
        ...editingUser,
        role: newRole,
        permissions: newPermissions
      };
      console.log('Updated editing user with new role:', updatedUser);
      setEditingUser(updatedUser);
    }
  };

  const handleEditUser = (user: EnhancedUser) => {
    console.log('Editing user:', user);
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      assignedLocations: user.assignedLocations || [],
      profilePicture: user.profilePicture || '',
      notes: user.notes || '',
      customPermissions: false
    });
    setCustomPermissions(user.permissions);
    setShowUserForm(true);
  };

  const handleSaveUser = async () => {
    // Validation
    if (!formData.username.trim() || !formData.email.trim()) {
      toast.error('Vul alle verplichte velden in!');
      return;
    }

    if (editingUser) {
      // Editing existing user
      if (formData.password && formData.password !== formData.confirmPassword) {
        toast.error('Wachtwoorden komen niet overeen!');
        return;
      }

      // Check for duplicate username/email (excluding current user)
      const existingUser = users.find(u => 
        u.id !== editingUser.id && 
        (u.username === formData.username || u.email === formData.email)
      );
      
      if (existingUser) {
        toast.error('Gebruikersnaam of e-mail is al in gebruik!');
        return;
      }

      try {
        // CRITICAL: Use custom permissions if checkbox is enabled, otherwise use role defaults
        let finalPermissions: UserPermissions;
        
        if (formData.customPermissions) {
          console.log('🔐 SAVE: Using CUSTOM permissions');
          console.log('🔐 SAVE: Custom permissions state:', customPermissions);
          finalPermissions = { ...customPermissions }; // Deep copy to ensure no reference issues
        } else {
          console.log('🔐 SAVE: Using ROLE-BASED permissions for role:', formData.role);
          finalPermissions = getDefaultPermissions(formData.role);
        }

        console.log('🔐 SAVE: Final permissions being saved:', finalPermissions);
        console.log('🔐 SAVE: Custom permissions enabled:', formData.customPermissions);

        const updatedUser: EnhancedUser = {
          ...editingUser,
          username: formData.username,
          email: formData.email,
          password: formData.password ? bcrypt.hashSync(formData.password, 10) : editingUser.password,
          role: formData.role,
          permissions: finalPermissions,
         assignedLocations: formData.assignedLocations,
          assignedLocations: formData.assignedLocations,
          profilePicture: formData.profilePicture,
          notes: formData.notes,
          lastModifiedAt: new Date().toISOString(),
          lastModifiedBy: getCurrentUserId()
        };

        console.log('🔐 SAVE: Complete updated user object:', updatedUser);
        console.log('🔐 SAVE: User role changed from', editingUser.role, 'to', updatedUser.role);
        console.log('🔐 SAVE: User permissions:', updatedUser.permissions);
        console.log('🌍 SAVE: User assigned locations:', updatedUser.assignedLocations);
        console.log('🌍 SAVE: Form data locations:', formData.assignedLocations);

        // Update in database
        try {
          await dataService.updateUser(updatedUser.id, updatedUser);
          console.log('✅ SAVE: User updated in database successfully');
        } catch (dbError) {
          console.log('⚠️ SAVE: Database update failed, updating localStorage only:', dbError);
        }

        // CRITICAL: Update localStorage with new permissions
        const updatedUsers = users.map(u => u.id === editingUser.id ? updatedUser : u);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        console.log('✅ SAVE: Updated localStorage with new user data');
        console.log('✅ SAVE: Saved assigned locations to localStorage:', updatedUser.assignedLocations);
        
        // Verify the save worked
        const verifyUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const verifyUser = verifyUsers.find((u: any) => u.id === editingUser.id);
        console.log('🔍 VERIFY: User after localStorage save:', verifyUser?.assignedLocations);
        
        setUsers(updatedUsers);

        // If editing current user, refresh permissions
        const currentUserId = localStorage.getItem('currentUserId');
        if (currentUserId === editingUser.id) {
          console.log('🔄 SAVE: Updated current user - forcing permission refresh');
          
          // Force immediate permission refresh
          setTimeout(() => {
            console.log('🔄 SAVE: Reloading page to refresh all permissions...');
            window.location.reload();
          }, 500);
        }

        toast.success('Gebruiker succesvol bijgewerkt!');
        handleCancelForm();
      } catch (error) {
        console.error('Error updating user:', error);
        toast.error('Er is een fout opgetreden bij het bijwerken van de gebruiker');
      }
    } else {
      // Creating new user
      if (!formData.password || formData.password !== formData.confirmPassword) {
        toast.error('Wachtwoorden zijn verplicht en moeten overeenkomen!');
        return;
      }

      // Check for duplicate username/email
      const existingUser = users.find(u => 
        u.username === formData.username || u.email === formData.email
      );
      
      if (existingUser) {
        toast.error('Gebruikersnaam of e-mail is al in gebruik!');
        return;
      }

      try {
        // Use custom permissions if enabled, otherwise use role-based permissions
        const finalPermissions = formData.customPermissions 
          ? customPermissions 
          : getDefaultPermissions(formData.role);

        const newUser: EnhancedUser = {
          id: uuidv4(),
          username: formData.username,
          email: formData.email,
          password: bcrypt.hashSync(formData.password, 10),
          role: formData.role,
          permissions: finalPermissions,
         assignedLocations: formData.assignedLocations,
          assignedLocations: formData.assignedLocations,
          profilePicture: formData.profilePicture,
          notes: formData.notes,
          createdAt: new Date().toISOString(),
          createdBy: getCurrentUserId(),
          isActive: true
        };

        console.log('Creating new user:', newUser);
        console.log('🌍 NEW USER: Assigned locations:', newUser.assignedLocations);

        // Save to database
        try {
          await dataService.createUser(newUser);
          console.log('User created in database successfully');
        } catch (dbError) {
          console.log('Database creation failed, saving to localStorage only:', dbError);
        }

        // Save to localStorage
        const updatedUsers = [newUser, ...users];
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);

        toast.success('Gebruiker succesvol aangemaakt!');
        handleCancelForm();
      } catch (error) {
        console.error('Error creating user:', error);
        toast.error('Er is een fout opgetreden bij het aanmaken van de gebruiker');
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (window.confirm(`Weet je zeker dat je gebruiker "${userToDelete.username}" wilt verwijderen?`)) {
      try {
        // Delete from database
        try {
          await dataService.deleteUser(userId);
          console.log('User deleted from database');
        } catch (dbError) {
          console.log('Database deletion failed, removing from localStorage only:', dbError);
        }

        // Remove from localStorage
        const updatedUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);

        toast.success('Gebruiker verwijderd!');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Er is een fout opgetreden bij het verwijderen van de gebruiker');
      }
    }
  };

  const handleCancelForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'standard_user',
      assignedLocations: [],
      profilePicture: '',
      notes: '',
      customPermissions: false
    });
    setCustomPermissions(getDefaultPermissions('standard_user'));
    setShowPassword(false);
  };

  const handlePermissionChange = (module: SystemModule, permission: keyof ModulePermissions, value: boolean) => {
    setCustomPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: value
      }
    }));
  };

  const handleLocationChange = (location: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assignedLocations: checked 
        ? [...prev.assignedLocations, location]
        : prev.assignedLocations.filter(loc => loc !== location)
    }));
  };

  const handleSelectAllLocations = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      assignedLocations: checked ? [...AVAILABLE_LOCATIONS] : []
    }));
  };

  const getCurrentUserId = () => {
    return localStorage.getItem('currentUserId') || 'unknown';
  };

  const getRoleIcon = (role: SystemRole) => {
    const iconMap = {
      admin: Shield,
      standard_user: Users,
      tester: CheckSquare,
      servicedesk: Headphones,
      planner: Calendar,
      projectleider: Crown,
      magazijn: Package,
      logistiek: Truck,
      montage: Wrench,
      finance: DollarSign
    };
    return iconMap[role] || Users;
  };

  const getRoleColor = (role: SystemRole) => {
    return ROLE_TEMPLATES[role]?.color || 'bg-gray-500';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (roleFilter !== 'all') count++;
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Gebruikers laden...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">Gebruikersbeheer</h1>
            <p className="text-gray-400">Beheer gebruikers, rollen en toegangsrechten</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center space-x-2 ${
                getActiveFilterCount() > 0 ? 'bg-blue-500/20 text-blue-400' : ''
              }`}
            >
              <Filter size={16} />
              <span>Filters</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowUserForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <UserPlus size={20} />
              <span>Gebruiker toevoegen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Zoeken op naam, email of rol..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="input-field"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">Alle rollen</option>
                {Object.entries(ROLE_TEMPLATES).map(([role, template]) => (
                  <option key={role} value={role}>{template.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card p-6 mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="table-header text-left">Gebruiker</th>
                <th className="table-header text-left">Rol</th>
                <th className="table-header text-left">E-mail</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Aangemaakt</th>
                <th className="table-header text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <tr key={user.id} className="table-row">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">{user.username}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {user.assignedLocations && user.assignedLocations.length > 0 ? (
                              user.assignedLocations.length === AVAILABLE_LOCATIONS.length ? (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                  Alle locaties
                                </span>
                              ) : (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                                  {user.assignedLocations.join(', ')}
                                </span>
                              )
                            ) : (
                              <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full">
                                Geen locaties
                              </span>
                            )}
                          </div>
                          {user.notes && (
                            <p className="text-sm text-gray-400 truncate max-w-xs">{user.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${getRoleColor(user.role)}/20`}>
                          <RoleIcon size={16} className={`${getRoleColor(user.role).replace('bg-', 'text-')}`} />
                        </div>
                        <div>
                          <span className="font-medium text-white">
                            {ROLE_TEMPLATES[user.role]?.name || user.role}
                          </span>
                          <p className="text-xs text-gray-400">
                            {ROLE_TEMPLATES[user.role]?.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">{user.email}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        user.isActive 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="py-4 text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 bg-[#2A303C] hover:bg-blue-500/20 rounded-lg transition-colors group"
                          title="Bewerken"
                        >
                          <Edit size={16} className="text-gray-400 group-hover:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 bg-[#2A303C] hover:bg-red-500/20 rounded-lg transition-colors group"
                          title="Verwijderen"
                        >
                          <Trash2 size={16} className="text-gray-400 group-hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">Geen gebruikers gevonden</p>
            </div>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-blue-400">
                {editingUser ? 'Gebruiker bewerken' : 'Nieuwe gebruiker aanmaken'}
              </h2>
              <button
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Basis Informatie</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Gebruikersnaam <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Voer gebruikersnaam in"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        E-mail <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        className="input-field"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="gebruiker@bedrijf.nl"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        {editingUser ? 'Nieuw wachtwoord (optioneel)' : 'Wachtwoord'} 
                        {!editingUser && <span className="text-red-400">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="input-field pr-10"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={editingUser ? "Laat leeg om ongewijzigd te laten" : "Voer wachtwoord in"}
                          required={!editingUser}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        {editingUser ? 'Bevestig nieuw wachtwoord' : 'Bevestig wachtwoord'}
                        {!editingUser && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="input-field"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder={editingUser ? "Bevestig nieuw wachtwoord" : "Bevestig wachtwoord"}
                        required={!editingUser || !!formData.password}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Opmerkingen</label>
                      <textarea
                        className="input-field h-24"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Optionele opmerkingen over deze gebruiker..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Role & Permissions */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">Rol & Toegangsrechten</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Gebruikersrol <span className="text-red-400">*</span>
                      </label>
                      <select
                        className="input-field"
                        value={formData.role}
                        onChange={(e) => {
                          console.log('Role dropdown changed to:', e.target.value);
                          handleRoleChange(e.target.value as SystemRole);
                        }}
                      >
                        {Object.entries(ROLE_TEMPLATES).map(([role, template]) => (
                          <option key={role} value={role}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      
                      {/* Show selected role confirmation */}
                      <div className="mt-2 p-3 bg-[#2A303C]/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const currentRole = formData.role;
                            const RoleIcon = getRoleIcon(currentRole);
                            return (
                              <>
                                <RoleIcon size={16} className="text-blue-400" />
                                <span className="text-sm text-blue-400">
                                  Geselecteerde rol: {ROLE_TEMPLATES[currentRole]?.name}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {ROLE_TEMPLATES[formData.role]?.description}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2 mb-4">
                        <input
                          type="checkbox"
                          checked={formData.customPermissions}
                          onChange={(e) => setFormData({ ...formData, customPermissions: e.target.checked })}
                          className="form-checkbox"
                        />
                        <span className="text-gray-400">Aangepaste permissies</span>
                      </label>

                      {formData.customPermissions && (
                        <div className="bg-[#2A303C]/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                          <h4 className="font-medium text-gray-300 mb-4">Module Toegangsrechten</h4>
                          <div className="space-y-4">
                            {Object.entries(customPermissions).map(([module, perms]) => (
                              <div key={module} className="bg-[#1E2530] p-4 rounded-lg">
                                <h5 className="font-medium text-blue-400 mb-3 capitalize">{module}</h5>
                                <div className="grid grid-cols-4 gap-3">
                                  {Object.entries(perms).map(([permission, value]) => (
                                    <label key={permission} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={value}
                                        onChange={(e) => handlePermissionChange(
                                          module as SystemModule, 
                                          permission as keyof ModulePermissions, 
                                          e.target.checked
                                        )}
                                        className="form-checkbox"
                                      />
                                      <span className="text-xs text-gray-400 capitalize">{permission}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-300 mb-4">Locatie Toegang</h4>
                      <div className="bg-[#2A303C]/50 rounded-lg p-4">
                        <div className="mb-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.assignedLocations.length === AVAILABLE_LOCATIONS.length}
                              onChange={(e) => handleSelectAllLocations(e.target.checked)}
                              className="form-checkbox"
                            />
                            <span className="text-gray-400 font-medium">Alle locaties</span>
                          </label>
                        </div>
                        
                        <div className="space-y-2">
                          {AVAILABLE_LOCATIONS.map((location) => (
                            <label key={location} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.assignedLocations.includes(location)}
                                onChange={(e) => handleLocationChange(location, e.target.checked)}
                                className="form-checkbox"
                              />
                              <span className="text-gray-400">{location}</span>
                            </label>
                          ))}
                        </div>
                        
                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-xs text-blue-300">
                            💡 Gebruikers zien alleen projecten van hun toegewezen locaties. 
                            Selecteer "Alle locaties" voor volledige toegang.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={handleCancelForm}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveUser}
                className="btn-primary flex items-center space-x-2"
              >
                <Save size={20} />
                <span>{editingUser ? 'Gebruiker bijwerken' : 'Gebruiker aanmaken'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedUserManagement;