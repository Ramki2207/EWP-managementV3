import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, Upload, Key, Copy, Clock, Users, CheckSquare, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import VerdelerTesting from './VerdelerTesting';
import FATTest from './FATTest';
import HighVoltageTest from './HighVoltageTest';
import OnSiteTest from './OnSiteTest';
import PrintLabel from './PrintLabel';
import { dataService } from '../lib/supabase';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';
import ewpLogo from '../assets/ewp-logo.png';

interface VerdelersStepProps {
  projectData: any;
  onVerdelersChange: (verdelers: any[]) => void;
  onNext?: () => void;
  onBack?: () => void;
  hideNavigation?: boolean;
}

const VerdelersStep: React.FC<VerdelersStepProps> = ({ 
  projectData, 
  onVerdelersChange, 
  onNext, 
  onBack, 
  hideNavigation = false 
}) => {
  const { hasPermission, currentUser } = useEnhancedPermissions();
  const [verdelers, setVerdelers] = useState<any[]>(projectData.distributors || []);
  const [showVerdelerForm, setShowVerdelerForm] = useState(false);
  const [showVerdelerDetails, setShowVerdelerDetails] = useState(false);
  const [selectedVerdeler, setSelectedVerdeler] = useState<any>(null);
  const [editingVerdeler, setEditingVerdeler] = useState<any>(null);
  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newAccessCode, setNewAccessCode] = useState({
    code: '',
    expiresAt: '',
    maxUses: '',
    isActive: true
  });
  const [verdelerData, setVerdelerData] = useState({
    distributorId: '',
    kastNaam: '',
    toegewezenMonteur: 'Vrij',
    systeem: '',
    voeding: '',
    bouwjaar: '',
    status: 'Offerte',
    fabrikant: '',
    unInV: '',
    inInA: '',
    ikThInKA1s: '',
    ikDynInKA: '',
    freqInHz: '',
    typeNrHs: '',
    profilePhoto: null as File | null,
  });

  // Load verdelers from database when component mounts or project changes
  useEffect(() => {
    if (projectData?.id) {
      loadVerdelersFromDatabase();
    }
  }, [projectData?.id]);

  const loadVerdelersFromDatabase = async () => {
    if (!projectData?.id) return;
    
    try {
      console.log('🔄 Loading verdelers from database for project:', projectData.id);
      const distributors = await dataService.getDistributorsByProject(projectData.id);
      console.log('📥 Loaded distributors from database:', distributors.length);
      
      // Convert database format to component format
      const formattedVerdelers = distributors.map((dist: any) => ({
        id: dist.id,
        distributorId: dist.distributor_id,
        kastNaam: dist.kast_naam,
        toegewezenMonteur: dist.toegewezen_monteur || 'Vrij',
        systeem: dist.systeem,
        voeding: dist.voeding,
        bouwjaar: dist.bouwjaar,
        status: dist.status,
        fabrikant: dist.fabrikant,
        unInV: dist.un_in_v,
        inInA: dist.in_in_a,
        ikThInKA1s: dist.ik_th_in_ka1s,
        ikDynInKA: dist.ik_dyn_in_ka,
        freqInHz: dist.freq_in_hz,
        typeNrHs: dist.type_nr_hs,
        profilePhoto: dist.profile_photo,
        createdAt: dist.created_at
      }));
      
      console.log('✅ Formatted verdelers:', formattedVerdelers);
      setVerdelers(formattedVerdelers);
      onVerdelersChange(formattedVerdelers);
    } catch (error) {
      console.error('Error loading verdelers from database:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    if (projectData?.id) {
      loadAccessCodes();
    }
    
    // Set initial status based on project status
    if (projectData?.status?.toLowerCase() === 'offerte') {
      setVerdelerData(prev => ({ ...prev, status: 'Offerte' }));
    }
  }, [projectData]);

  const loadUsers = async () => {
    try {
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(localUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAccessCodes = async () => {
    try {
      const codes = await dataService.getAccessCodes();
      setAccessCodes(codes || []);
    } catch (error) {
      console.error('Error loading access codes:', error);
    }
  };

  const getMontageUsersByLocation = (projectLocation?: string) => {
    console.log('🔍 VERDELERS: Getting montage users for location:', projectLocation);
    console.log('🔍 VERDELERS: Total users loaded:', users.length);
    
    if (!users || users.length === 0) {
      console.log('❌ VERDELERS: No users loaded yet');
      return { primary: [], other: [] };
    }
    
    // Filter users with 'montage' role
    const montageUsers = users.filter(user => {
      const isMontage = user.role === 'montage';
      console.log(`🔍 VERDELERS: User ${user.username} - role: ${user.role}, isMontage: ${isMontage}`);
      return isMontage;
    });
    
    console.log('🔍 VERDELERS: Found montage users:', montageUsers.length);
    
    if (!projectLocation) {
      return { primary: montageUsers, other: [] };
    }
    
    // Separate users by location
    const primary = montageUsers.filter(user => {
      const hasLocationAccess = !user.assignedLocations || 
                               user.assignedLocations.length === 0 || 
                               user.assignedLocations.length === AVAILABLE_LOCATIONS.length ||
                               user.assignedLocations.includes(projectLocation);
      console.log(`🔍 VERDELERS: User ${user.username} location access for ${projectLocation}:`, hasLocationAccess);
      return hasLocationAccess;
    });
    
    const other = montageUsers.filter(user => {
      const hasOtherLocationAccess = user.assignedLocations && 
                                    user.assignedLocations.length > 0 && 
                                    user.assignedLocations.length < AVAILABLE_LOCATIONS.length &&
                                    !user.assignedLocations.includes(projectLocation);
      return hasOtherLocationAccess;
    });
    
    console.log('🔍 VERDELERS: Primary users:', primary.length, 'Other users:', other.length);
    
    return { primary, other };
  };

  const generateVerdelerID = () => {
    const existingIds = verdelers.map(v => v.distributorId);
    let newId;
    do {
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      newId = `VD${randomNum}`;
    } while (existingIds.includes(newId));
    
    return newId;
  };

  const handleAddVerdeler = () => {
    if (!hasPermission('verdelers', 'create')) {
      toast.error('Je hebt geen toestemming om verdelers aan te maken');
      return;
    }
    setVerdelerData({
      distributorId: generateVerdelerID(),
      kastNaam: '',
      toegewezenMonteur: 'Vrij',
      systeem: '',
      voeding: '',
      bouwjaar: '',
      status: 'Offerte',
      fabrikant: '',
      unInV: '',
      inInA: '',
      ikThInKA1s: '',
      ikDynInKA: '',
      freqInHz: '',
      typeNrHs: '',
      profilePhoto: null,
    });
    setEditingVerdeler(null);
    setShowVerdelerForm(true);
  };

  const handleEditVerdeler = (verdeler: any) => {
    if (!hasPermission('verdelers', 'update')) {
      toast.error('Je hebt geen toestemming om verdelers te bewerken');
      return;
    }
    setVerdelerData({
      distributorId: verdeler.distributorId,
      kastNaam: verdeler.kastNaam,
      toegewezenMonteur: verdeler.toegewezenMonteur || 'Vrij',
      systeem: verdeler.systeem,
      voeding: verdeler.voeding,
      bouwjaar: verdeler.bouwjaar,
      status: verdeler.status,
      fabrikant: verdeler.fabrikant,
      unInV: verdeler.unInV,
      inInA: verdeler.inInA,
      ikThInKA1s: verdeler.ikThInKA1s,
      ikDynInKA: verdeler.ikDynInKA,
      freqInHz: verdeler.freqInHz,
      typeNrHs: verdeler.typeNrHs,
      profilePhoto: verdeler.profilePhoto,
    });
    setEditingVerdeler(verdeler);
    setShowVerdelerForm(true);
  };

  const handleDeleteVerdeler = async (verdelerId: string) => {
    if (!hasPermission('verdelers', 'delete')) {
      toast.error('Je hebt geen toestemming om verdelers te verwijderen');
      return;
    }

    const verdelerToDelete = verdelers.find(v => v.id === verdelerId || v.distributorId === verdelerId);
    if (!verdelerToDelete) return;

    if (window.confirm(`Weet je zeker dat je verdeler ${verdelerToDelete.distributorId} wilt verwijderen?`)) {
      try {
        // If we have a database ID, delete from database
        if (verdelerToDelete.id && projectData.id) {
          await dataService.deleteDistributor(verdelerToDelete.id);
          console.log('✅ DELETE: Verdeler deleted from database');
          toast.success('Verdeler verwijderd!');
          
          // Reload from database
          await loadVerdelersFromDatabase();
        } else {
          // For project creation (no database ID yet), remove from local state
          const updatedVerdelers = verdelers.filter(v => v.distributorId !== verdelerToDelete.distributorId);
          setVerdelers(updatedVerdelers);
          onVerdelersChange(updatedVerdelers);
          toast.success('Verdeler verwijderd!');
        }
      } catch (error) {
        console.error('Error deleting verdeler:', error);
        toast.error('Er is een fout opgetreden bij het verwijderen van de verdeler');
      }
    }
  };

  const handleSaveVerdeler = async () => {
    if (!verdelerData.distributorId || !verdelerData.kastNaam) {
      toast.error('Vul alle verplichte velden in!');
      return;
    }

    const duplicateId = verdelers.some(v => 
      v.distributorId === verdelerData.distributorId && 
      (!editingVerdeler || v.id !== editingVerdeler.id)
    );
    
    if (duplicateId) {
      toast.error('Deze verdeler ID bestaat al. Kies een ander ID.');
      return;
    }

    try {
      let profilePhotoUrl = '';
      
      if (verdelerData.profilePhoto) {
        const reader = new FileReader();
        profilePhotoUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(verdelerData.profilePhoto!);
        });
      } else if (editingVerdeler?.profilePhoto) {
        profilePhotoUrl = editingVerdeler.profilePhoto;
      }

      console.log('🔍 SAVE: Saving verdeler with data:', verdelerData);
      console.log('🔍 SAVE: distributorId:', verdelerData.distributorId);
      console.log('🔍 SAVE: kastNaam:', verdelerData.kastNaam);

      if (editingVerdeler) {
        // Update existing verdeler in database
        console.log('🔄 SAVE: Updating existing verdeler in database...');
        
        const updateData = {
          distributorId: verdelerData.distributorId,
          projectId: projectData.id,
          kastNaam: verdelerData.kastNaam,
          systeem: verdelerData.systeem,
          voeding: verdelerData.voeding,
          bouwjaar: verdelerData.bouwjaar,
          status: verdelerData.status,
          fabrikant: verdelerData.fabrikant,
          unInV: verdelerData.unInV,
          inInA: verdelerData.inInA,
          ikThInKA1s: verdelerData.ikThInKA1s,
          ikDynInKA: verdelerData.ikDynInKA,
          freqInHz: verdelerData.freqInHz,
          typeNrHs: verdelerData.typeNrHs,
          profilePhoto: profilePhotoUrl
        };
        
        // Only include new columns if they have values
        if (verdelerData.toegewezenMonteur && verdelerData.toegewezenMonteur !== 'Vrij') {
          updateData.toegewezenMonteur = verdelerData.toegewezenMonteur;
        }
        
        await dataService.updateDistributor(editingVerdeler.id, updateData);
        console.log('✅ SAVE: Verdeler updated in database');
        toast.success('Verdeler bijgewerkt!');
      } else {
        // Create new verdeler in database if we have a project ID
        if (projectData.id) {
          console.log('🔄 SAVE: Creating new verdeler in database...');
          
          const newVerdelerData = {
            distributorId: verdelerData.distributorId,
            projectId: projectData.id,
            kastNaam: verdelerData.kastNaam,
            systeem: verdelerData.systeem,
            voeding: verdelerData.voeding,
            bouwjaar: verdelerData.bouwjaar,
            status: verdelerData.status,
            fabrikant: verdelerData.fabrikant,
            unInV: verdelerData.unInV,
            inInA: verdelerData.inInA,
            ikThInKA1s: verdelerData.ikThInKA1s,
            ikDynInKA: verdelerData.ikDynInKA,
            freqInHz: verdelerData.freqInHz,
            typeNrHs: verdelerData.typeNrHs,
            profilePhoto: profilePhotoUrl
          };
          
          // Only include new columns if they have values
          if (verdelerData.toegewezenMonteur && verdelerData.toegewezenMonteur !== 'Vrij') {
            newVerdelerData.toegewezenMonteur = verdelerData.toegewezenMonteur;
          }
          
          await dataService.createDistributor(newVerdelerData);
          console.log('✅ SAVE: New verdeler created in database');
          toast.success('Verdeler toegevoegd!');
        } else {
          // For project creation (no project ID yet), save to local state
          const verdelerToSave = {
            id: uuidv4(),
            distributorId: verdelerData.distributorId,
            kastNaam: verdelerData.kastNaam,
            toegewezenMonteur: verdelerData.toegewezenMonteur,
            systeem: verdelerData.systeem,
            voeding: verdelerData.voeding,
            bouwjaar: verdelerData.bouwjaar,
            status: verdelerData.status,
            fabrikant: verdelerData.fabrikant,
            unInV: verdelerData.unInV,
            inInA: verdelerData.inInA,
            ikThInKA1s: verdelerData.ikThInKA1s,
            ikDynInKA: verdelerData.ikDynInKA,
            freqInHz: verdelerData.freqInHz,
            typeNrHs: verdelerData.typeNrHs,
            profilePhoto: profilePhotoUrl,
            createdAt: new Date().toISOString(),
          };
          
          const updatedVerdelers = [...verdelers, verdelerToSave];
          setVerdelers(updatedVerdelers);
          onVerdelersChange(updatedVerdelers);
          console.log('✅ SAVE: Added to local state for project creation');
          toast.success('Verdeler toegevoegd!');
        }
      }

      // Reload verdelers from database to get fresh data
      if (projectData.id) {
        await loadVerdelersFromDatabase();
        await loadAccessCodes(); // Also reload access codes
      }
      
      handleCancelForm();
    } catch (error) {
      console.error('Error saving verdeler:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de verdeler');
    }
  };

  const handleCancelForm = () => {
    setShowVerdelerForm(false);
    setEditingVerdeler(null);
    setVerdelerData({
      distributorId: generateVerdelerID(),
      kastNaam: '',
      toegewezenMonteur: 'Vrij',
      systeem: '',
      voeding: '',
      bouwjaar: '',
      status: 'Offerte',
      fabrikant: '',
      unInV: '',
      inInA: '',
      ikThInKA1s: '',
      ikDynInKA: '',
      freqInHz: '',
      typeNrHs: '',
      profilePhoto: null,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setVerdelerData({
      ...verdelerData,
      [field]: value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVerdelerData({
        ...verdelerData,
        profilePhoto: e.target.files[0]
      });
    }
  };

  const handleVerdelerClick = (verdeler: any) => {
    setSelectedVerdeler(verdeler);
    setShowVerdelerDetails(true);
  };

  const handleTestComplete = (verdeler: any, testData: any) => {
    console.log('Test completed for verdeler:', verdeler.distributorId, testData);
    // Test data is automatically saved to localStorage by the test components
  };

  const generateRandomCode = () => {
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  };

  const getDefaultExpiryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  const handleGenerateAccessCode = (verdeler: any) => {
    if (!hasPermission('access_codes', 'create')) {
      toast.error('Je hebt geen toestemming om toegangscodes aan te maken');
      return;
    }
    setSelectedVerdeler(verdeler);
    setNewAccessCode({
      code: generateRandomCode(),
      expiresAt: getDefaultExpiryDate(),
      maxUses: '',
      isActive: true
    });
    setShowAccessCodeForm(true);
  };

  const handleCreateAccessCode = async () => {
    if (!newAccessCode.code || !newAccessCode.expiresAt || !selectedVerdeler) {
      toast.error('Vul alle verplichte velden in!');
      return;
    }

    if (!/^\d{5}$/.test(newAccessCode.code)) {
      toast.error('Toegangscode moet precies 5 cijfers bevatten!');
      return;
    }

    try {
      setGeneratingCode(true);
      const currentUserId = localStorage.getItem('currentUserId');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find((u: any) => u.id === currentUserId);

      const accessCodeData = {
        code: newAccessCode.code.toUpperCase(),
        createdBy: currentUser?.username || 'Unknown',
        expiresAt: newAccessCode.expiresAt,
        isActive: newAccessCode.isActive,
        maxUses: newAccessCode.maxUses ? parseInt(newAccessCode.maxUses) : null,
        verdeler_id: selectedVerdeler.distributorId,
        project_number: projectData.project_number || projectData.projectNumber
      };

      await dataService.createAccessCode(accessCodeData);
      await loadAccessCodes();
      
      setShowAccessCodeForm(false);
      setNewAccessCode({
        code: '',
        expiresAt: '',
        maxUses: '',
        isActive: true
      });
      
      toast.success('Toegangscode succesvol aangemaakt!');
    } catch (error) {
      console.error('Error creating access code:', error);
      toast.error('Er is een fout opgetreden bij het aanmaken van de toegangscode');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code gekopieerd naar klembord!');
  };

  const getVerdelerAccessCodes = (verdelerDistributorId: string) => {
    return accessCodes.filter(code => 
      code.verdeler_id === verdelerDistributorId && code.is_active
    );
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500/20 text-gray-400';
    
    switch (status.toLowerCase()) {
      case 'offerte':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'in productie':
        return 'bg-blue-500/20 text-blue-400';
      case 'testen':
        return 'bg-purple-500/20 text-purple-400';
      case 'gereed':
        return 'bg-green-500/20 text-green-400';
      case 'opgeleverd':
        return 'bg-green-600/20 text-green-300';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const canEditTechnicalSpecs = () => {
    const projectStatus = projectData?.status?.toLowerCase();
    return projectStatus === 'productie' || projectStatus === 'testen' || !projectStatus;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-white mb-2">Verdelers</h2>
        <p className="text-gray-400">Voeg verdelers toe aan dit project</p>
      </div>

      {/* Add Verdeler Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-green-400">Project Verdelers ({verdelers.length})</h3>
        <button
          onClick={handleAddVerdeler}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Verdeler toevoegen</span>
        </button>
      </div>

      {/* Verdelers Table */}
      {verdelers.length > 0 ? (
        <div className="bg-[#2A303C] rounded-xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="table-header text-left">Verdeler ID</th>
                  <th className="table-header text-left">Kastnaam</th>
                  <th className="table-header text-left">Toegewezen</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Systeem</th>
                  <th className="table-header text-left">Toegangscodes</th>
                  <th className="table-header text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {verdelers.map((verdeler) => {
                  const verdelerCodes = getVerdelerAccessCodes(verdeler.distributorId);
                  const activeCodes = verdelerCodes.filter(code => !isExpired(code.expires_at));
                  
                  return (
                    <tr key={verdeler.id || verdeler.distributorId} className="table-row">
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="font-medium text-green-400">{verdeler.distributorId}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-300">{verdeler.kastNaam || '-'}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          verdeler.toegewezenMonteur && verdeler.toegewezenMonteur !== 'Vrij'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {verdeler.toegewezenMonteur || 'Vrij'}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verdeler.status)}`}>
                          {verdeler.status || 'Onbekend'}
                        </span>
                      </td>
                      <td className="py-4 text-gray-300">{verdeler.systeem || '-'}</td>
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Key size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-400">{activeCodes.length}</span>
                          </div>
                          {activeCodes.length > 0 && (
                            <div className="flex space-x-1">
                              {activeCodes.slice(0, 2).map((code) => (
                                <div key={code.id} className="group relative">
                                  <span 
                                    className="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-1 rounded cursor-pointer hover:bg-blue-500/30"
                                    onClick={() => handleCopyCode(code.code)}
                                    title="Klik om te kopiëren"
                                  >
                                    {code.code}
                                  </span>
                                </div>
                              ))}
                              {activeCodes.length > 2 && (
                                <span className="text-xs text-gray-400">+{activeCodes.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleVerdelerClick(verdeler)}
                            className="p-2 bg-[#1E2530] hover:bg-blue-500/20 rounded-lg transition-colors group"
                            title="Info"
                          >
                            <Eye size={16} className="text-gray-400 group-hover:text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleEditVerdeler(verdeler)}
                            className="p-2 bg-[#1E2530] hover:bg-green-500/20 rounded-lg transition-colors group"
                            title="Bewerken"
                          >
                            <Edit size={16} className="text-gray-400 group-hover:text-green-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteVerdeler(verdeler.id || verdeler.distributorId)}
                            className="p-2 bg-[#1E2530] hover:bg-red-500/20 rounded-lg transition-colors group"
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
          </div>
        </div>
      ) : (
        <div className="bg-[#2A303C] rounded-xl p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <Plus size={32} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Geen verdelers toegevoegd</h3>
              <p className="text-gray-400 mb-4">
                Voeg verdelers toe om dit project te voltooien
              </p>
              <button
                onClick={handleAddVerdeler}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Eerste verdeler toevoegen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verdeler Form Modal */}
      {showVerdelerForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div 
            className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-blue-400">
                {editingVerdeler ? 'Verdeler bewerken' : 'Nieuwe verdeler toevoegen'}
              </h2>
              <button
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-4">Basis Informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Verdeler ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.distributorId}
                      onChange={(e) => handleInputChange('distributorId', e.target.value)}
                      placeholder="VD1234"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Kastnaam <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.kastNaam}
                      onChange={(e) => handleInputChange('kastNaam', e.target.value)}
                      placeholder="Hoofdverdeler Hal A"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Toegewezen monteur</label>
                    <select
                      className="input-field"
                      value={verdelerData.toegewezenMonteur}
                      onChange={(e) => handleInputChange('toegewezenMonteur', e.target.value)}
                    >
                      <option value="Vrij">Nader te bepalen</option>
                      {(() => {
                        const { primary, other } = getMontageUsersByLocation(projectData?.location);
                        
                        return (
                          <>
                            {primary.length > 0 && (
                              <>
                                <optgroup label={`Primair - ${projectData?.location || 'Onbekend'}`}>
                                  {primary.map(user => (
                                    <option key={user.id} value={user.username}>
                                      {user.username}
                                    </option>
                                  ))}
                                </optgroup>
                              </>
                            )}
                            {other.length > 0 && (
                              <optgroup label="Andere locaties">
                                {other.map(user => (
                                  <option key={user.id} value={user.username}>
                                    {user.username} ({user.assignedLocations?.join(', ') || 'Alle locaties'})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {primary.length === 0 && other.length === 0 && (
                              <option disabled>Geen montage medewerkers beschikbaar</option>
                            )}
                          </>
                        );
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Status</label>
                    <select
                      className="input-field"
                      value={verdelerData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                      <option value="Offerte">Offerte</option>
                      <option value="In productie">In productie</option>
                      <option value="Testen">Testen</option>
                      <option value="Gereed">Gereed</option>
                      <option value="Opgeleverd">Opgeleverd</option>
                    </select>
                    {projectData?.status?.toLowerCase() === 'offerte' && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Status is vergrendeld omdat project status "Offerte" is
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Photo */}
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-4">Profiel Foto</h3>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="profile-photo"
                  />
                  <label
                    htmlFor="profile-photo"
                    className="btn-secondary flex items-center space-x-2 cursor-pointer"
                  >
                    <Upload size={20} />
                    <span>Foto uploaden</span>
                  </label>
                  {verdelerData.profilePhoto && (
                    <span className="text-sm text-green-400">✓ Foto geselecteerd</span>
                  )}
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-orange-400 mb-4">Technische Specificaties</h3>
                {!canEditTechnicalSpecs() && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-black font-bold">!</span>
                      </div>
                      <p className="text-yellow-300 text-sm">
                        Technische specificaties kunnen alleen worden ingevuld wanneer project status "Productie" of hoger is
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Systeem</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.systeem}
                      onChange={(e) => handleInputChange('systeem', e.target.value)}
                      placeholder="400V TN-S"
                      disabled={!canEditTechnicalSpecs()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Voeding</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.voeding}
                      onChange={(e) => handleInputChange('voeding', e.target.value)}
                      placeholder="3x400V + N + PE"
                      disabled={!canEditTechnicalSpecs()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Bouwjaar</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.bouwjaar}
                      onChange={(e) => handleInputChange('bouwjaar', e.target.value)}
                      placeholder="2025"
                      disabled={!canEditTechnicalSpecs()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Fabrikant</label>
                    <select
                      className="input-field"
                      value={verdelerData.fabrikant}
                      onChange={(e) => handleInputChange('fabrikant', e.target.value)}
                      disabled={!canEditTechnicalSpecs()}
                    >
                      <option value="">Selecteer fabrikant</option>
                      <option value="Schneider Electric">Schneider Electric</option>
                      <option value="ABB">ABB</option>
                      <option value="Siemens">Siemens</option>
                      <option value="Eaton">Eaton</option>
                      <option value="Legrand">Legrand</option>
                      <option value="Hager">Hager</option>
                      <option value="Anders">Anders</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Un in V</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.unInV}
                      onChange={(e) => handleInputChange('unInV', e.target.value)}
                      placeholder="400"
                      disabled={!canEditTechnicalSpecs()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">In in A</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.inInA}
                      onChange={(e) => handleInputChange('inInA', e.target.value)}
                      placeholder="400"
                      disabled={!canEditTechnicalSpecs()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ik Th in KA 1s</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.ikThInKA1s}
                      onChange={(e) => handleInputChange('ikThInKA1s', e.target.value)}
                      placeholder="25"
                      disabled={!canEditTechnicalSpecs()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ik Dyn in KA</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.ikDynInKA}
                      onChange={(e) => handleInputChange('ikDynInKA', e.target.value)}
                      placeholder="65"
                      disabled={!canEditTechnicalSpecs()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Freq. in Hz</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.freqInHz}
                      onChange={(e) => handleInputChange('freqInHz', e.target.value)}
                      placeholder="50"
                      disabled={!canEditTechnicalSpecs()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Type nr. HS</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.typeNrHs}
                      onChange={(e) => handleInputChange('typeNrHs', e.target.value)}
                      placeholder="HS-400"
                      disabled={!canEditTechnicalSpecs()}
                    />
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
                onClick={handleSaveVerdeler}
                className="btn-primary flex items-center space-x-2"
              >
                <Save size={20} />
                <span>{editingVerdeler ? 'Bijwerken' : 'Opslaan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verdeler Details Modal */}
      {showVerdelerDetails && selectedVerdeler && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
          <div 
            className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-green-400">
                Verdeler Details: {selectedVerdeler.distributorId}
              </h2>
              <button
                onClick={() => setShowVerdelerDetails(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Verdeler ID</label>
                  <p className="input-field">{selectedVerdeler.distributorId}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Kastnaam</label>
                  <p className="input-field">{selectedVerdeler.kastNaam || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Toegewezen monteur</label>
                  <p className="input-field">{selectedVerdeler.toegewezenMonteur || 'Vrij'}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedVerdeler.status)}`}>
                    {selectedVerdeler.status || 'Onbekend'}
                  </span>
                </div>
              </div>

              {/* Technical Specs */}
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-4">Technische Specificaties</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Systeem</label>
                    <p className="input-field">{selectedVerdeler.systeem || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Voeding</label>
                    <p className="input-field">{selectedVerdeler.voeding || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Bouwjaar</label>
                    <p className="input-field">{selectedVerdeler.bouwjaar || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Un in V</label>
                    <p className="input-field">{selectedVerdeler.unInV || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">In in A</label>
                    <p className="input-field">{selectedVerdeler.inInA || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Ik Th in KA 1s</label>
                    <p className="input-field">{selectedVerdeler.ikThInKA1s || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Ik Dyn in KA</label>
                    <p className="input-field">{selectedVerdeler.ikDynInKA || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Freq. in Hz</label>
                    <p className="input-field">{selectedVerdeler.freqInHz || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Type nr. HS</label>
                    <p className="input-field">{selectedVerdeler.typeNrHs || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Fabrikant</label>
                    <p className="input-field">{selectedVerdeler.fabrikant || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Testing Actions */}
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-4">Testing & Kwaliteitscontrole</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <VerdelerTesting
                    verdeler={selectedVerdeler}
                    projectNumber={projectData.project_number || projectData.projectNumber}
                    onComplete={(testData) => handleTestComplete(selectedVerdeler, testData)}
                    projectId={projectData.id}
                    distributorId={selectedVerdeler.id}
                  />
                  <FATTest
                    verdeler={selectedVerdeler}
                    projectNumber={projectData.project_number || projectData.projectNumber}
                    onComplete={(testData) => handleTestComplete(selectedVerdeler, testData)}
                  />
                  <HighVoltageTest
                    verdeler={selectedVerdeler}
                    projectNumber={projectData.project_number || projectData.projectNumber}
                    onComplete={(testData) => handleTestComplete(selectedVerdeler, testData)}
                  />
                  <OnSiteTest
                    verdeler={selectedVerdeler}
                    projectNumber={projectData.project_number || projectData.projectNumber}
                    onComplete={(testData) => handleTestComplete(selectedVerdeler, testData)}
                  />
                </div>
              </div>

              {/* Access Codes */}
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Toegangscodes & QR Labels</h3>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-400">Actieve toegangscodes voor deze verdeler</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleGenerateAccessCode(selectedVerdeler)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Key size={16} />
                      <span>Toegangscode</span>
                    </button>
                    <PrintLabel
                      verdeler={selectedVerdeler}
                      projectNumber={projectData.project_number || projectData.projectNumber}
                      logo={ewpLogo}
                    />
                  </div>
                </div>
                
                {(() => {
                  const verdelerCodes = getVerdelerAccessCodes(selectedVerdeler.distributorId);
                  return verdelerCodes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {verdelerCodes.map((code) => (
                        <div key={code.id} className="bg-[#2A303C] p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
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
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              isExpired(code.expires_at)
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {isExpired(code.expires_at) ? 'Verlopen' : 'Actief'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock size={14} />
                              <span>{new Date(code.expires_at).toLocaleDateString('nl-NL')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users size={14} />
                              <span>{code.usage_count || 0}{code.max_uses ? `/${code.max_uses}` : ''}</span>
                            </div>
                          </div>
                        </div>
                      ));
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Geen actieve toegangscodes voor deze verdeler
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Access Code Form Modal */}
      {showAccessCodeForm && selectedVerdeler && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto">
          <div 
            className="bg-[#1E2530] rounded-2xl p-6 max-w-md w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-blue-400">Toegangscode genereren</h2>
              <button
                onClick={() => setShowAccessCodeForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#2A303C] p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-400 mb-2">Voor verdeler</h3>
                <p className="text-white">{selectedVerdeler.distributorId} - {selectedVerdeler.kastNaam || 'Naamloos'}</p>
                <p className="text-sm text-gray-400">Project: {projectData.project_number || projectData.projectNumber}</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Toegangscode <span className="text-red-400">*</span>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="input-field flex-1"
                    value={newAccessCode.code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setNewAccessCode({ ...newAccessCode, code: value });
                    }}
                    placeholder="12345"
                    maxLength={5}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setNewAccessCode({ ...newAccessCode, code: generateRandomCode() })}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Key size={16} />
                    <span>Nieuw</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(newAccessCode.code)}
                    className="btn-secondary p-2"
                    disabled={!newAccessCode.code}
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Precies 5 cijfers (0-9)</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Vervaldatum <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={newAccessCode.expiresAt}
                  onChange={(e) => setNewAccessCode({ ...newAccessCode, expiresAt: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Maximum aantal keer gebruiken</label>
                <input
                  type="number"
                  className="input-field"
                  value={newAccessCode.maxUses}
                  onChange={(e) => setNewAccessCode({ ...newAccessCode, maxUses: e.target.value })}
                  placeholder="Onbeperkt (laat leeg)"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Laat leeg voor onbeperkt gebruik</p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newAccessCode.isActive}
                    onChange={(e) => setNewAccessCode({ ...newAccessCode, isActive: e.target.checked })}
                    className="form-checkbox"
                  />
                  <span className="text-gray-400">Direct activeren</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowAccessCodeForm(false)}
                className="btn-secondary"
                disabled={generatingCode}
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateAccessCode}
                className={`btn-primary ${generatingCode ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={generatingCode || !newAccessCode.code || !newAccessCode.expiresAt || !/^\d{5}$/.test(newAccessCode.code)}
              >
                {generatingCode ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Aanmaken...</span>
                  </div>
                ) : (
                  'Code aanmaken'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {!hideNavigation && (
        <div className="flex justify-between pt-6 border-t border-gray-700">
          <button
            onClick={onBack}
            className="btn-secondary"
          >
            Terug
          </button>
          <button
            onClick={onNext}
            className="btn-primary"
          >
            Volgende stap
          </button>
        </div>
      )}
    </div>
  );
};

export default VerdelersStep;