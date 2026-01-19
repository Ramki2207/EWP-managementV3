import React, { useState, useEffect } from 'react';
import { Plus, Search, Key, Trash2, Edit, Copy, Clock, Users, CheckCircle, XCircle, AlertTriangle, Server } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService, testConnection } from '../lib/supabase';
import VerdelerSearchSelect from '../components/VerdelerSearchSelect';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';

interface AccessCode {
  id: string;
  code: string;
  created_by: string;
  expires_at: string;
  is_active: boolean;
  usage_count: number;
  max_uses: number | null;
  created_at: string;
  last_used_at: string | null;
  verdeler_id?: string;
  project_number?: string;
}

const AccessCodes = () => {
  const { hasPermission, currentUser } = useEnhancedPermissions();
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [verdelers, setVerdelers] = useState<any[]>([]);
  const [newCode, setNewCode] = useState({
    code: '',
    expiresAt: '',
    maxUses: '',
    isActive: true,
    verdeler_id: '',
    project_number: ''
  });

  useEffect(() => {
    checkConnectionAndLoadData();
  }, []);

  const checkConnectionAndLoadData = async () => {
    try {
      setLoading(true);
      setConnectionError(false);
      
      // Test connection first
      const connectionOk = await testConnection();
      if (!connectionOk) {
        setConnectionError(true);
        toast.error('Kan geen verbinding maken met de database');
        return;
      }

      await Promise.all([loadAccessCodes(), loadVerdelers()]);
    } catch (error) {
      console.error('Error during initialization:', error);
      setConnectionError(true);
      toast.error('Er is een fout opgetreden bij het laden van de pagina');
    } finally {
      setLoading(false);
    }
  };

  const loadAccessCodes = async () => {
    try {
      let data = await dataService.getAccessCodes();

      // Role-based filtering for Tester users
      if (currentUser?.role === 'tester') {
        // Get all projects to check which ones are in testing phase
        const projects = await dataService.getProjects();
        const testingProjects = projects.filter((project: any) =>
          project.status?.toLowerCase() === 'testen'
        );
        const testingProjectNumbers = testingProjects.map(p => p.project_number);

        const beforeFilter = data?.length || 0;
        data = data?.filter((code: any) => {
          // Show codes that are either global (no project_number) or for testing projects
          const isGlobal = !code.project_number;
          const isForTestingProject = code.project_number && testingProjectNumbers.includes(code.project_number);
          const shouldShow = isGlobal || isForTestingProject;

          if (!shouldShow) {
            console.log(`🧪 ACCESS_CODES TESTER FILTER: Hiding access code ${code.code} (project: ${code.project_number}) from tester ${currentUser.username} - NOT FOR TESTING PROJECT`);
          }

          return shouldShow;
        });
        console.log(`🧪 ACCESS_CODES TESTER FILTER: Filtered ${beforeFilter} access codes down to ${data?.length || 0} for tester ${currentUser.username}`);
      }

      // Location-based filtering for Projectleider users
      if (currentUser?.role === 'projectleider' && currentUser?.assignedLocations?.length > 0) {
        const projects = await dataService.getProjects();
        const allowedProjectNumbers = projects
          .filter((project: any) => currentUser.assignedLocations.includes(project.location))
          .map(p => p.project_number);

        const beforeFilter = data?.length || 0;
        data = data?.filter((code: any) => {
          const shouldShow = !code.project_number || allowedProjectNumbers.includes(code.project_number);

          if (!shouldShow) {
            console.log(`📍 ACCESS_CODES LOCATION FILTER: Hiding access code ${code.code} (project: ${code.project_number}) from projectleider ${currentUser.username} - LOCATION NOT ASSIGNED`);
          }

          return shouldShow;
        });
        console.log(`📍 ACCESS_CODES LOCATION FILTER: Filtered ${beforeFilter} access codes down to ${data?.length || 0} for projectleider ${currentUser.username} with locations:`, currentUser.assignedLocations);
      }

      setAccessCodes(data || []);
    } catch (error) {
      console.error('Error loading access codes:', error);

      // Check if it's a table not found error
      if (error.message.includes('relation "access_codes" does not exist')) {
        toast.error('De toegangscodes tabel bestaat nog niet in de database. Neem contact op met de beheerder.');
        setConnectionError(true);
      } else {
       toast.error(error.message || 'Er is een fout opgetreden bij het laden van de toegangscodes');
      }
    }
  };

  const loadVerdelers = async () => {
    try {
      let data = await dataService.getDistributors();

      // Role-based filtering for Tester users
      if (currentUser?.role === 'tester') {
        // Get all projects to check which ones are in testing phase
        const projects = await dataService.getProjects();
        const testingProjects = projects.filter((project: any) =>
          project.status?.toLowerCase() === 'testen'
        );
        const testingProjectIds = testingProjects.map(p => p.id);

        const beforeFilter = data?.length || 0;
        data = data?.filter((distributor: any) => {
          const isFromTestingProject = testingProjectIds.includes(distributor.project_id);

          if (!isFromTestingProject) {
            console.log(`🧪 ACCESS_CODES VERDELERS FILTER: Hiding distributor ${distributor.distributor_id} from tester ${currentUser.username} - NOT FROM TESTING PROJECT`);
          }

          return isFromTestingProject;
        });
        console.log(`🧪 ACCESS_CODES VERDELERS FILTER: Filtered ${beforeFilter} distributors down to ${data?.length || 0} for tester ${currentUser.username}`);
      }

      // Location-based filtering for Projectleider users
      if (currentUser?.role === 'projectleider' && currentUser?.assignedLocations?.length > 0) {
        const projects = await dataService.getProjects();
        const allowedProjectIds = projects
          .filter((project: any) => currentUser.assignedLocations.includes(project.location))
          .map(p => p.id);

        const beforeFilter = data?.length || 0;
        data = data?.filter((distributor: any) => {
          const shouldShow = allowedProjectIds.includes(distributor.project_id);

          if (!shouldShow) {
            console.log(`📍 ACCESS_CODES VERDELERS FILTER: Hiding distributor ${distributor.distributor_id} from projectleider ${currentUser.username} - LOCATION NOT ASSIGNED`);
          }

          return shouldShow;
        });
        console.log(`📍 ACCESS_CODES VERDELERS FILTER: Filtered ${beforeFilter} distributors down to ${data?.length || 0} for projectleider ${currentUser.username} with locations:`, currentUser.assignedLocations);
      }

      setVerdelers(data || []);
    } catch (error) {
      console.error('Error loading verdelers:', error);
     toast.error(error.message || 'Er is een fout opgetreden bij het laden van de verdelers');
    }
  };

  const generateRandomCode = () => {
    // Generate 5 random numbers (0-9)
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  };

  const handleGenerateCode = () => {
    setNewCode(prev => ({ ...prev, code: generateRandomCode() }));
  };

  const handleVerdelerChange = (verdelerId: string) => {
    const selectedVerdeler = verdelers.find(v => v.id === verdelerId);
    
    setNewCode(prev => ({
      ...prev,
      verdeler_id: selectedVerdeler?.distributor_id || '', // Use the distributor_id (text), not the UUID
      project_number: selectedVerdeler?.projects?.project_number || ''
    }));
  };

  const handleCreateCode = async () => {
    if (!hasPermission('access_codes', 'create')) {
      toast.error('Je hebt geen toestemming om toegangscodes aan te maken');
      return;
    }

    if (!newCode.code || !newCode.expiresAt) {
      toast.error('Vul alle verplichte velden in!');
      return;
    }

    if (!newCode.verdeler_id) {
      toast.error('Selecteer een verdeler voor deze toegangscode!');
      return;
    }

    // Validate that code is exactly 5 numbers
    if (!/^\d{5}$/.test(newCode.code)) {
      toast.error('Toegangscode moet precies 5 cijfers bevatten!');
      return;
    }

    try {
      const currentUserId = localStorage.getItem('currentUserId');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find((u: any) => u.id === currentUserId);

      const accessCodeData = {
        code: newCode.code.toUpperCase(), // Ensure uppercase
        createdBy: currentUser?.username || 'Unknown',
        expiresAt: newCode.expiresAt,
        isActive: newCode.isActive,
        maxUses: newCode.maxUses ? parseInt(newCode.maxUses) : null,
        verdeler_id: newCode.verdeler_id, // This is now the distributor_id (text like "VD8996")
        project_number: newCode.project_number
      };

      await dataService.createAccessCode(accessCodeData);
      await loadAccessCodes();
      
      setShowCodeForm(false);
      setNewCode({
        code: '',
        expiresAt: '',
        maxUses: '',
        isActive: true,
        verdeler_id: '',
        project_number: ''
      });
      
      toast.success('Toegangscode succesvol aangemaakt!');
    } catch (error) {
      console.error('Error creating access code:', error);
      toast.error('Er is een fout opgetreden bij het aanmaken van de toegangscode');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (!hasPermission('access_codes', 'update')) {
      toast.error('Je hebt geen toestemming om toegangscodes te wijzigen');
      return;
    }

    try {
      const code = accessCodes.find(c => c.id === id);
      if (!code) return;

      await dataService.updateAccessCode(id, {
        isActive: !isActive,
        expiresAt: code.expires_at,
        maxUses: code.max_uses
      });
      
      await loadAccessCodes();
      toast.success(`Toegangscode ${!isActive ? 'geactiveerd' : 'gedeactiveerd'}!`);
    } catch (error) {
      console.error('Error updating access code:', error);
      toast.error('Er is een fout opgetreden bij het bijwerken van de toegangscode');
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!hasPermission('access_codes', 'delete')) {
      toast.error('Je hebt geen toestemming om toegangscodes te verwijderen');
      return;
    }

    if (window.confirm('Weet je zeker dat je deze toegangscode wilt verwijderen?')) {
      try {
        await dataService.deleteAccessCode(id);
        await loadAccessCodes();
        toast.success('Toegangscode verwijderd!');
      } catch (error) {
        console.error('Error deleting access code:', error);
        toast.error('Er is een fout opgetreden bij het verwijderen van de toegangscode');
      }
    }
  };

  const handleReactivateCode = async (id: string) => {
    if (!hasPermission('access_codes', 'update')) {
      toast.error('Je hebt geen toestemming om toegangscodes te wijzigen');
      return;
    }

    if (window.confirm('Weet je zeker dat je deze toegangscode wilt heractiveren? De vervaldatum wordt verlengd met 30 dagen.')) {
      try {
        const code = accessCodes.find(c => c.id === id);
        if (!code) return;

        // Extend expiration by 30 days from now
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + 30);

        await dataService.updateAccessCode(id, {
          isActive: true,
          expiresAt: newExpiryDate.toISOString(),
          maxUses: code.max_uses
        });
        
        await loadAccessCodes();
        toast.success('Toegangscode hergeactiveerd voor 30 dagen!');
      } catch (error) {
        console.error('Error reactivating access code:', error);
        toast.error('Er is een fout opgetreden bij het heractiveren van de toegangscode');
      }
    }
  };
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code gekopieerd naar klembord!');
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const isUsageLimitReached = (usageCount: number, maxUses: number | null) => {
    return maxUses !== null && usageCount >= maxUses;
  };

  const filteredCodes = accessCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.created_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.verdeler_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.project_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDefaultExpiryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  const getVerdelerInfo = (verdelerId: string) => {
    const verdeler = verdelers.find(v => v.distributor_id === verdelerId); // Search by distributor_id now
    if (!verdeler) return verdelerId || 'Onbekende verdeler';
    return `${verdeler.distributor_id} - ${verdeler.kast_naam || 'Naamloos'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Toegangscodes laden...</span>
          </div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Database Configuratie Vereist</h2>
            <p className="text-gray-400 mb-6">
              De toegangscodes functionaliteit vereist dat de database tabel wordt bijgewerkt.
            </p>
            <div className="bg-[#2A303C] p-4 rounded-lg text-left">
              <h3 className="font-semibold mb-2">Instructies voor de beheerder:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                <li>Ga naar je Supabase dashboard</li>
                <li>Navigeer naar de SQL Editor</li>
                <li>Voer de volgende SQL uit:</li>
              </ol>
              <div className="mt-4 p-3 bg-[#1E2530] rounded font-mono text-sm overflow-x-auto">
                <pre>{`-- Add verdeler_id and project_number columns to access_codes
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS verdeler_id text;
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS project_number text;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_access_codes_verdeler_id ON access_codes(verdeler_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_project_number ON access_codes(project_number);`}</pre>
              </div>
            </div>
            <button
              onClick={checkConnectionAndLoadData}
              className="btn-primary mt-6"
            >
              Opnieuw proberen
            </button>
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
            <h1 className="text-2xl font-semibold text-white mb-2">Toegangscodes beheer</h1>
            <p className="text-gray-400">Beheer verdeler-specifieke toegangscodes voor QR-code toegang</p>
          </div>
          {hasPermission('access_codes', 'create') && (
            <button
              onClick={() => setShowCodeForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Code aanmaken</span>
            </button>
          )}
        </div>
      </div>

      {/* Code Form */}
      {showCodeForm && (
        <div className="card p-6 mb-8">
          <h2 className="text-lg text-gradient mb-6">Nieuwe toegangscode aanmaken</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Enhanced Verdeler Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Verdeler <span className="text-red-400">*</span>
                </label>
                <VerdelerSearchSelect
                  verdelers={verdelers}
                  selectedVerdelerId={verdelers.find(v => v.distributor_id === newCode.verdeler_id)?.id || ''}
                  onSelect={handleVerdelerChange}
                  placeholder="Zoek en selecteer een verdeler..."
                  required={true}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Zoek op verdeler ID, kastnaam, projectnummer of klant
                </p>
              </div>

              {/* Code Generation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Toegangscode <span className="text-red-400">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="input-field flex-1"
                      value={newCode.code}
                      onChange={(e) => {
                        // Only allow numbers and limit to 5 digits
                        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setNewCode({ ...newCode, code: value });
                      }}
                      placeholder="12345"
                      maxLength={5}
                      pattern="\d{5}"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Key size={16} />
                      <span>Genereer</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Precies 5 cijfers (0-9)
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Vervaldatum <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newCode.expiresAt}
                    onChange={(e) => setNewCode({ ...newCode, expiresAt: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
              </div>

              {/* Additional Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Maximum aantal keer gebruiken</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newCode.maxUses}
                    onChange={(e) => setNewCode({ ...newCode, maxUses: e.target.value })}
                    placeholder="Onbeperkt (laat leeg)"
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laat leeg voor onbeperkt gebruik
                  </p>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newCode.isActive}
                      onChange={(e) => setNewCode({ ...newCode, isActive: e.target.checked })}
                      className="form-checkbox"
                    />
                    <span className="text-gray-400">Direct activeren</span>
                  </label>
                </div>
              </div>

              {/* Project Info Display */}
              {newCode.project_number && (
                <div className="bg-[#2A303C] p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Project informatie</h4>
                  <p className="text-sm text-gray-300">
                    <strong>Project:</strong> {newCode.project_number}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Deze code werkt alleen voor de geselecteerde verdeler in dit project
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowCodeForm(false);
                  setNewCode({ code: '', expiresAt: '', maxUses: '', isActive: true, verdeler_id: '', project_number: '' });
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleCreateCode}
                className="btn-primary"
                disabled={!newCode.code || !newCode.expiresAt || !newCode.verdeler_id || !/^\d{5}$/.test(newCode.code)}
              >
                Code aanmaken
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Zoeken op code, maker, verdeler of project..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Codes Table */}
      <div className="card p-6">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header text-left">Code</th>
              <th className="table-header text-left">Verdeler</th>
              <th className="table-header text-left">Project</th>
              <th className="table-header text-left">Status</th>
              <th className="table-header text-left">Aangemaakt door</th>
              <th className="table-header text-left">Vervaldatum</th>
              <th className="table-header text-left">Gebruik</th>
              <th className="table-header text-left">Laatst gebruikt</th>
              <th className="table-header text-right">Acties</th>
            </tr>
          </thead>
          <tbody>
            {filteredCodes.map((code) => {
              const expired = isExpired(code.expires_at);
              const usageLimitReached = isUsageLimitReached(code.usage_count, code.max_uses);
              const isValid = code.is_active && !expired && !usageLimitReached;

              return (
                <tr key={code.id} className="table-row">
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-lg">{code.code}</span>
                      <button
                        onClick={() => handleCopyCode(code.code)}
                        className="text-gray-400 hover:text-white"
                        title="Kopieer code"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <Server size={14} className="text-green-400" />
                      <span className="text-sm">
                        {code.verdeler_id ? getVerdelerInfo(code.verdeler_id) : 'Alle verdelers'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="text-sm">{code.project_number || '-'}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      {isValid ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : (
                        <XCircle size={16} className="text-red-400" />
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        isValid
                          ? 'bg-green-500/20 text-green-400'
                          : expired
                          ? 'bg-red-500/20 text-red-400'
                          : usageLimitReached
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {isValid ? 'Actief' : expired ? 'Verlopen' : usageLimitReached ? 'Limiet bereikt' : 'Inactief'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">{code.created_by}</td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-gray-400" />
                      <span>{new Date(code.expires_at).toLocaleString('nl-NL')}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <Users size={16} className="text-gray-400" />
                      <span>
                        {code.usage_count}{code.max_uses ? `/${code.max_uses}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    {code.last_used_at ? new Date(code.last_used_at).toLocaleString('nl-NL') : '-'}
                  </td>
                  <td className="py-4 text-right space-x-2">
                    {hasPermission('access_codes', 'update') && (
                      <>
                        {(expired || usageLimitReached) && code.is_active ? (
                          <button
                            onClick={() => handleReactivateCode(code.id)}
                            className="btn-secondary inline-flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                          >
                            <Edit size={16} />
                            <span>Heractiveren</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(code.id, code.is_active)}
                            className={`btn-secondary inline-flex items-center space-x-2 ${
                              code.is_active 
                                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                            }`}
                            disabled={expired || usageLimitReached}
                          >
                            <Edit size={16} />
                            <span>{code.is_active ? 'Deactiveren' : 'Activeren'}</span>
                          </button>
                        )}
                      </>
                    )}
                    {hasPermission('access_codes', 'delete') && (
                      <button
                        onClick={() => handleDeleteCode(code.id)}
                        className="btn-secondary inline-flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      >
                        <Trash2 size={16} />
                        <span>Verwijderen</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredCodes.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">Geen toegangscodes gevonden</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessCodes;