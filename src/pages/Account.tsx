import React, { useState, useEffect } from 'react';
import { User, Mail, Key, Save, Upload, UserCircle, Shield, Calendar, Clock, Edit, X, Database, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';
import { dataService } from '../lib/supabase';
import { UserPermissions } from '../types/userRoles';
import { migrateDocumentsToStorage } from '../lib/migrateData';

interface UserData {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
  profilePicture?: string;
  profile_picture?: string;
  permissions?: UserPermissions;
}

const Account = () => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState({ current: 0, total: 0 });
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profilePicture: '',
  });

  useEffect(() => {
    const loggedInUserId = localStorage.getItem('currentUserId');
    if (loggedInUserId) {
      loadCurrentUser(loggedInUserId);
    }
  }, []);

  const loadCurrentUser = async (userId: string) => {
    try {
      // First try to get from localStorage (which is always available)
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = localUsers.find((u: UserData) => u.id === userId);
      
      if (user) {
        setCurrentUser(user);
        setFormData(prev => ({
          ...prev,
          email: user.email,
          profilePicture: user.profilePicture || user.profile_picture || '',
        }));
        return;
      }
      
      // If not found in localStorage, try database as fallback
      try {
        const dbUsers = await dataService.getUsers();
        const dbUser = dbUsers.find((u: UserData) => u.id === userId);
        if (dbUser) {
          setCurrentUser(dbUser);
          setFormData(prev => ({
            ...prev,
            email: dbUser.email,
            profilePicture: dbUser.profilePicture || dbUser.profile_picture || '',
          }));
        }
      } catch (dbError) {
        console.error('Database fallback failed:', dbError);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      email: currentUser?.email || '',
      profilePicture: currentUser?.profilePicture || currentUser?.profile_picture || '',
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      let updatedUser = { ...currentUser };

      // Validate current password if trying to change password
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          toast.error('Vul je huidige wachtwoord in!');
          return;
        }

        if (!bcrypt.compareSync(formData.currentPassword, currentUser.password)) {
          toast.error('Huidig wachtwoord is onjuist!');
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('Nieuwe wachtwoorden komen niet overeen!');
          return;
        }

        // Update password
        updatedUser.password = bcrypt.hashSync(formData.newPassword, 10);
      }

      // Update email and profile picture
      if (formData.email !== currentUser.email || formData.profilePicture !== (currentUser.profilePicture || currentUser.profile_picture)) {
        // Check if email is already in use
        if (formData.email !== currentUser.email) {
          const users = await dataService.getUsers();
          if (users.some((u: UserData) => u.id !== currentUser.id && u.email === formData.email)) {
            toast.error('Dit e-mailadres is al in gebruik!');
            return;
          }
        }

        updatedUser.email = formData.email;
        updatedUser.profilePicture = formData.profilePicture;
      }

      // Update user in database
      await dataService.updateUser(currentUser.id, updatedUser);
      
      // Update local state
      setCurrentUser(updatedUser);
      setIsEditing(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      toast.success('Account gegevens bijgewerkt!');
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Fall back to localStorage update
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: UserData) => u.id === currentUser.id);

      if (userIndex !== -1) {
        let updatedUser = { ...currentUser };
        
        if (formData.newPassword && bcrypt.compareSync(formData.currentPassword, currentUser.password)) {
          updatedUser.password = bcrypt.hashSync(formData.newPassword, 10);
        }
        
        updatedUser.email = formData.email;
        updatedUser.profilePicture = formData.profilePicture;
        
        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
        setCurrentUser(updatedUser);
        setIsEditing(false);
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        toast.success('Account gegevens bijgewerkt (lokaal)!');
      }
    }
  };

  const handleMigrateDocuments = async () => {
    if (!window.confirm('Weet u zeker dat u alle documenten wilt migreren naar Supabase Storage? Dit kan enkele minuten duren.')) {
      return;
    }

    setIsMigrating(true);
    setMigrationProgress({ current: 0, total: 0 });

    try {
      const result = await migrateDocumentsToStorage((current, total) => {
        setMigrationProgress({ current, total });
      });

      console.log('Migration result:', result);

      if (result.success) {
        toast.success(`Migratie voltooid! ${result.migrated} documenten gemigreerd.`);
      } else {
        toast.error(`Migratie voltooid met fouten. ${result.migrated} succesvol, ${result.failed} mislukt.`);
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Fout tijdens migratie');
    } finally {
      setIsMigrating(false);
      setMigrationProgress({ current: 0, total: 0 });
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <UserCircle size={32} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Gebruiker niet gevonden</h3>
              <p className="text-gray-400 mb-4">
                Er is een probleem opgetreden bij het laden van je accountgegevens.
              </p>
              <button
                onClick={() => {
                  localStorage.removeItem('loggedIn');
                  localStorage.removeItem('currentUserId');
                  window.location.href = '/login';
                }}
                className="btn-primary"
              >
                Opnieuw inloggen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
          
          <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
            {/* Profile Section */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                {formData.profilePicture ? (
                  <img
                    src={formData.profilePicture}
                    alt={currentUser.username}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/30 shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-4 ring-blue-500/30 shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-[#1E2530] flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">
                    {currentUser.username}
                  </h1>
                  {currentUser.role === 'admin' && (
                    <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-full">
                      <Shield size={16} className="text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">Administrator</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-400 text-lg mb-1">{currentUser.email}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>Lid sinds {new Date(currentUser.createdAt).toLocaleDateString('nl-NL')}</span>
                  </div>
                  {currentUser.lastLogin && (
                    <div className="flex items-center space-x-1">
                      <Clock size={14} />
                      <span>Laatst actief {new Date(currentUser.lastLogin).toLocaleDateString('nl-NL')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
                >
                  <Edit size={20} />
                  <span className="font-semibold">Profiel bewerken</span>
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelEdit}
                    className="bg-[#2A303C] hover:bg-[#374151] text-white px-4 py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
                  >
                    <X size={20} />
                    <span>Annuleren</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
                  >
                    <Save size={20} />
                    <span className="font-semibold">Wijzigingen opslaan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Account Type</h3>
              <p className="text-lg font-semibold text-white">
                {currentUser.role === 'admin' ? 'Administrator' : 'Gebruiker'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <Calendar size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Account leeftijd</h3>
              <p className="text-lg font-semibold text-white">
                {Math.floor((new Date().getTime() - new Date(currentUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))} dagen
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Laatste login</h3>
              <p className="text-lg font-semibold text-white">
                {currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleDateString('nl-NL') : 'Nooit'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="card p-6 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <User size={20} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold">Account Informatie</h2>
        </div>
        
        <div className="space-y-6">
          {isEditing && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
              <label className="block text-sm text-gray-400 mb-3">Profielfoto</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                  id="profile-picture"
                />
                <label
                  htmlFor="profile-picture"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 flex items-center space-x-2 cursor-pointer transform hover:scale-105"
                >
                  <Upload size={20} />
                  <span>Nieuwe foto uploaden</span>
                </label>
                {formData.profilePicture && (
                  <div className="flex items-center space-x-2">
                    <img
                      src={formData.profilePicture}
                      alt="Preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                    />
                    <span className="text-sm text-green-400">✓ Nieuwe foto geselecteerd</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Gebruikersnaam</label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="input-field pl-10 bg-[#2A303C]/50 cursor-not-allowed"
                    value={currentUser.username}
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Gebruikersnaam kan niet worden gewijzigd</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">E-mailadres</label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className={`input-field pl-10 ${!isEditing ? 'bg-[#2A303C]/50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Account rol</label>
                <div className="relative">
                  <Shield size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <div className="input-field pl-10 bg-[#2A303C]/50 flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentUser.role === 'admin' 
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {currentUser.role === 'admin' ? 'Administrator' : 'Gebruiker'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Account aangemaakt</label>
                <div className="relative">
                  <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <div className="input-field pl-10 bg-[#2A303C]/50">
                    {new Date(currentUser.createdAt).toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      {isEditing && (
        <div className="card p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Key size={20} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold">Wachtwoord wijzigen</h2>
            <span className="text-sm text-gray-400">(Optioneel)</span>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Huidig wachtwoord</label>
                <div className="relative">
                  <Key size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    className="input-field pl-10 focus:ring-2 focus:ring-orange-500"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="Voer huidig wachtwoord in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nieuw wachtwoord</label>
                <div className="relative">
                  <Key size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    className="input-field pl-10 focus:ring-2 focus:ring-green-500"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Voer nieuw wachtwoord in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Bevestig nieuw wachtwoord</label>
                <div className="relative">
                  <Key size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    className="input-field pl-10 focus:ring-2 focus:ring-green-500"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Bevestig nieuw wachtwoord"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-black font-bold">!</span>
                </div>
                <div className="text-sm text-yellow-300">
                  <p className="font-medium mb-1">Wachtwoord vereisten:</p>
                  <ul className="text-xs space-y-1 text-yellow-200">
                    <li>• Minimaal 8 karakters lang</li>
                    <li>• Combinatie van letters en cijfers aanbevolen</li>
                    <li>• Laat velden leeg om wachtwoord ongewijzigd te laten</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Security & Activity */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Shield size={20} className="text-green-400" />
          </div>
          <h2 className="text-xl font-semibold">Account Beveiliging & Activiteit</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Security Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Beveiligingsstatus</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[#2A303C] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Wachtwoord beveiliging</span>
                </div>
                <span className="text-green-400 text-sm font-medium">Actief</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-[#2A303C] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-gray-300">Account verificatie</span>
                </div>
                <span className="text-green-400 text-sm font-medium">Geverifieerd</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-[#2A303C] rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-300">Sessie beveiliging</span>
                </div>
                <span className="text-blue-400 text-sm font-medium">Beveiligd</span>
              </div>
            </div>
          </div>

          {/* Account Activity */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Account Details</h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-[#2A303C] rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Account ID</span>
                  <span className="text-xs font-mono text-gray-300">{currentUser.id.slice(0, 8)}...</span>
                </div>
              </div>
              
              <div className="p-4 bg-[#2A303C] rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Account aangemaakt</span>
                  <span className="text-sm text-gray-300">
                    {new Date(currentUser.createdAt).toLocaleString('nl-NL')}
                  </span>
                </div>
              </div>
              
              {currentUser.lastLogin && (
                <div className="p-4 bg-[#2A303C] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Laatste login</span>
                    <span className="text-sm text-gray-300">
                      {new Date(currentUser.lastLogin).toLocaleString('nl-NL')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Section (for non-admin users) */}
      {currentUser.role !== 'admin' && currentUser.permissions && (
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Shield size={20} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold">Toegangsrechten</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(currentUser.permissions).map(([module, modulePerms]) => (
              <div key={module} className="p-4 bg-[#2A303C] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-300 capitalize">{module}</span>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      modulePerms.read ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {modulePerms.read ? 'Lezen' : 'Geen toegang'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      modulePerms.update ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {modulePerms.update ? 'Schrijven' : 'Alleen lezen'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Tools Section (for admin users only) */}
      {currentUser.role === 'admin' && (
        <div className="card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Database size={20} className="text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold">Systeemtools</h2>
          </div>

          <div className="p-4 bg-[#2A303C] rounded-lg">
            <h3 className="font-medium text-gray-300 mb-2">Document Migratie naar Storage</h3>
            <p className="text-sm text-gray-400 mb-4">
              Migreer alle documenten van base64 opslag in de database naar Supabase Storage voor betere prestaties.
              Dit maakt het laden van documenten veel sneller.
            </p>

            {isMigrating && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                  <span>Migratie bezig...</span>
                  <span>{migrationProgress.current} / {migrationProgress.total}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: migrationProgress.total > 0
                        ? `${(migrationProgress.current / migrationProgress.total) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleMigrateDocuments}
              disabled={isMigrating}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMigrating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Bezig met migreren...</span>
                </>
              ) : (
                <>
                  <Database size={16} />
                  <span>Start Migratie</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;