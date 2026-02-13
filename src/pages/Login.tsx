import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import logo from '../assets/ewp-logo.png';
import bcrypt from 'bcryptjs';
import toast from 'react-hot-toast';
import { migrateLocalStorageToSupabase } from '../lib/migrateData';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '../lib/supabase';

// Helper function to ensure user has proper UUID
const ensureUserHasUUID = (user: any) => {
  if (!user.id || typeof user.id !== 'string' || user.id.length < 10) {
    // Generate new UUID for user
    return { ...user, id: uuidv4() };
  }
  return user;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);

  // Ensure default admin users exist
  React.useEffect(() => {
    ensureDefaultAdmins();
  }, []);

  
  const ensureDefaultAdmins = () => {
    const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // First, ensure all existing users have proper UUIDs
    const usersWithUUIDs = localUsers.map(ensureUserHasUUID);
    if (usersWithUUIDs.length !== localUsers.length || 
        usersWithUUIDs.some((u, i) => u.id !== localUsers[i]?.id)) {
      localStorage.setItem('users', JSON.stringify(usersWithUUIDs));
    }
    
    if (localUsers.length === 0) {
      const defaultAdmins = [
        {
          id: uuidv4(),
          username: 'admin',
          email: 'admin@ewp.nl',
          password: bcrypt.hashSync('admin123', 10),
          role: 'admin',
          createdAt: new Date().toISOString(),
          profilePicture: '',
        },
        {
          id: uuidv4(),
          username: 'Patrick Herman',
          email: 'patrick@ewpmidden.nl',
          password: bcrypt.hashSync('Welkom123', 10),
          role: 'admin',
          createdAt: new Date().toISOString(),
          profilePicture: '',
        },
        {
          id: uuidv4(),
          username: 'Stefano de Weger',
          email: 'stefano.deweger@ewp-paneelbouw.nl',
          password: bcrypt.hashSync('Welkom123', 10),
          role: 'admin',
          createdAt: new Date().toISOString(),
          profilePicture: '',
        },
        {
          id: uuidv4(),
          username: 'Lysander koenraadt',
          email: 'lysander.koenraadt@ewp-paneelbouw.nl',
          password: bcrypt.hashSync('Welkom123', 10),
          role: 'admin',
          createdAt: new Date().toISOString(),
          profilePicture: '',
        }
      ];
      localStorage.setItem('users', JSON.stringify(defaultAdmins));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setErrorMessage('');

    if (!username || !password) {
      setError(true);
      setErrorMessage('Vul je gebruikersnaam en wachtwoord in!');
      return;
    }

    try {
      // First try to authenticate against database
      console.log('Attempting database authentication for:', username);
      
      let user = null;
      let users = [];
      
      try {
        // Get users from database first
        const dbUsers = await dataService.getUsers();
        console.log('Database users found:', dbUsers.length);
        
        user = dbUsers.find((u: any) => u.username === username);
        users = dbUsers;
        
        if (user) {
          console.log('User found in database:', user.username);
          // Sync database users to localStorage for offline access
          localStorage.setItem('users', JSON.stringify(dbUsers));
        }
      } catch (dbError) {
        console.log('Database authentication failed, trying localStorage:', dbError);
      }

      // Always check localStorage (primary source for now)
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (!user) {
        user = localUsers.find((u: any) => u.username === username);
        users = localUsers;
        
        if (user) {
          console.log('User found in localStorage:', user.username);
        }
      }

      if (!user) {
        setError(true);
        setErrorMessage('Gebruiker niet gevonden. Controleer je gebruikersnaam.');
        return;
      }

      // Check if user is blocked
      if (user.isActive === false) {
        setError(true);
        setErrorMessage('Je account is geblokkeerd. Neem contact op met de beheerder.');
        return;
      }

      if (!bcrypt.compareSync(password, user.password)) {
        setError(true);
        setErrorMessage('Verkeerd wachtwoord. Probeer het opnieuw.');
        return;
      }

      console.log('Authentication successful for:', user.username);

      // Ensure user has proper UUID
      const userWithUUID = ensureUserHasUUID(user);
      
      // Update last login
      const updatedUser = { ...userWithUUID, lastLogin: new Date().toISOString() };
      
      // Update in database
      try {
        await dataService.updateUser(updatedUser.id, updatedUser);
        console.log('Last login updated in database');
      } catch (updateError) {
        console.log('Failed to update last login in database:', updateError);
      }
      
      // Update localStorage
      const updatedUsers = users.map((u: any) => 
        u.username === username ? updatedUser : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      // Set current user
      localStorage.setItem('currentUserId', updatedUser.id);
      localStorage.setItem('loggedIn', 'true');

      // Force permission refresh by clearing any cached data
      console.log('🔄 LOGIN: Forcing permission refresh for user:', updatedUser.username);
      
      // Check if there's data to migrate
      const hasLocalData = localStorage.getItem('projects') || localStorage.getItem('distributors');
      
      if (hasLocalData) {
        setIsMigrating(true);
        const migrationSuccess = await migrateLocalStorageToSupabase();
        setIsMigrating(false);

        if (migrationSuccess) {
        }
      }

      toast.success('Succesvol ingelogd!');
      
      // Small delay to ensure localStorage is updated before navigation
      setTimeout(() => {
        navigate('/dashboard');
      }, 100);
      
    } catch (error) {
      console.error('Login error:', error);
      setError(true);
      setErrorMessage('Er is een fout opgetreden bij het inloggen. Probeer het opnieuw.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-[#1a1a1a] to-[#111] p-4">
      <div className="mb-8">
        <img src={logo} alt="EWP Paneelbouw" className="h-32 w-auto" />
      </div>
      
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welkom terug</h2>
            <p className="text-gray-400">Log in op je account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Gebruikersnaam
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`input-field ${error ? 'border-red-500' : ''}`}
                  placeholder="Voer je gebruikersnaam in"
                  disabled={isMigrating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Wachtwoord
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`input-field pr-10 ${error ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                    disabled={isMigrating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm">{errorMessage}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center space-x-2 min-h-[44px]"
              disabled={isMigrating}
            >
              {isMigrating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Gegevens migreren...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Inloggen</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          © 2025 Process Improvement B.V. Alle rechten voorbehouden.
        </p>
      </div>
    </div>
  );
};

export default Login;