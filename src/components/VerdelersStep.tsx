import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Edit, Save, X, Upload, Key, Printer, CheckSquare, Server, Eye, Info, Download, Copy, Building, Zap, Calendar, Camera } from 'lucide-react';
import { dataService } from '../lib/supabase';
import VerdelerTesting from './VerdelerTesting';
import FATTest from './FATTest';
import HighVoltageTest from './HighVoltageTest';
import OnSiteTest from './OnSiteTest';
import PrintLabel from './PrintLabel';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';
import ewpLogo from '../assets/ewp-logo.png';

interface VerdelersStepProps {
  projectData: any;
  onVerdelersChange?: (verdelers: any[]) => void;
  onNext?: () => void;
  onBack?: () => void;
}

const VerdelersStep: React.FC<VerdelersStepProps> = ({ 
  projectData, 
  onVerdelersChange, 
  onNext, 
  onBack 
}) => {
  const { hasPermission } = useEnhancedPermissions();
  const [verdelers, setVerdelers] = useState<any[]>([]);
  const [showVerdelerForm, setShowVerdelerForm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [editingVerdeler, setEditingVerdeler] = useState<any>(null);
  const [showVerdelerInfo, setShowVerdelerInfo] = useState<any>(null);
  const [selectedVerdeler, setSelectedVerdeler] = useState<any>(null);
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [selectedVerdelerForAccessCode, setSelectedVerdelerForAccessCode] = useState<any>(null);
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [selectedVerdelerForCode, setSelectedVerdelerForCode] = useState<any>(null);
  const [newAccessCode, setNewAccessCode] = useState({
    code: '',
    expiresAt: '',
    maxUses: '',
    isActive: true
  });
  const [verdelerData, setVerdelerData] = useState({
    distributorId: '',
    kastNaam: '',
    systeem: '',
    voeding: '',
    bouwjaar: '',
    toegewezenMonteur: '',
    gewensteLeverDatum: '',
    unInV: '',
    inInA: '',
    ikThInKA1s: '',
    ikDynInKA: '',
    freqInHz: '50', // Default value
    typeNrHs: '',
    fabrikant: '',
    profilePhoto: null as File | null,
    status: 'Offerte' // Default status for new verdelers
  });

  useEffect(() => {
    if (projectData?.distributors) {
    loadUsers();
      setVerdelers(projectData.distributors);
      console.log('Distributor data structure:', projectData.distributors[0]);
      // Debug each distributor's field structure
      projectData.distributors.forEach((dist, index) => {
        console.log(`Distributor ${index}:`, {
          distributorId: dist.distributorId,
          distributor_id: dist.distributor_id,
          kastNaam: dist.kastNaam,
          kast_naam: dist.kast_naam,
          allFields: Object.keys(dist)
        });
      });
    } else if (projectData?.id) {
      loadVerdelers();
    }
    loadAccessCodes();
  }, [projectData]);

  const loadVerdelers = async () => {
    try {
      const data = await dataService.getDistributorsByProject(projectData.id);
      setVerdelers(data || []);
      if (onVerdelersChange) {
        onVerdelersChange(data || []);
      }
    } catch (error) {
      console.error('Error loading verdelers:', error);
      toast.error('Er is een fout opgetreden bij het laden van de verdelers');
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

  const loadUsers = async () => {
    try {
      // Load users from localStorage (primary source)
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(localUsers);
      
      // Try to sync with database in background
      try {
        const dbUsers = await dataService.getUsers();
        setUsers(dbUsers || localUsers);
      } catch (dbError) {
        console.log('Database sync failed, using localStorage only:', dbError);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const getMontageUsersByLocation = (projectLocation?: string) => {
    // Filter users with 'montage' role
    const montageUsers = users.filter(user => user.role === 'montage');
    
    if (!projectLocation) {
      return {
        primary: [],
        other: montageUsers
      };
    }
    
    // Separate users by location
    const primaryUsers = montageUsers.filter(user => 
      user.assignedLocations && user.assignedLocations.includes(projectLocation)
    );
    
    const otherUsers = montageUsers.filter(user => 
      !user.assignedLocations || 
      user.assignedLocations.length === 0 || 
      user.assignedLocations.length === AVAILABLE_LOCATIONS.length ||
      !user.assignedLocations.includes(projectLocation)
    );
    
    return {
      primary: primaryUsers,
      other: otherUsers
    };
  };

  const generateVerdelerID = () => {
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
    return `VD${randomNumber}`;
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

  const getVerdelerAccessCodes = (verdelerId: string) => {
    return accessCodes.filter(code => 
      code.verdeler_id === verdelerId && code.is_active
    );
  };

  const isAccessCodeExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const handleAddVerdeler = () => {
    setEditingVerdeler(null);
    setVerdelerData({
      distributorId: generateVerdelerID(),
      kastNaam: '',
      systeem: '',
      voeding: '',
      bouwjaar: '',
      keuringDatum: new Date().toISOString().split('T')[0],
      getestDoor: '',
      unInV: '',
      inInA: '',
      ikThInKA1s: '',
      ikDynInKA: '',
      freqInHz: '50',
      typeNrHs: '',
      fabrikant: '',
      profilePhoto: null,
      status: 'Offerte'
    });
    setShowVerdelerForm(true);
  };

  const handleEditVerdeler = (verdeler: any) => {
    setEditingVerdeler(verdeler);
    setVerdelerData({
      distributorId: verdeler.distributor_id,
      kastNaam: verdeler.kast_naam || '',
      systeem: verdeler.systeem || '',
      voeding: verdeler.voeding || '',
      bouwjaar: verdeler.bouwjaar || '',
      keuringDatum: verdeler.keuring_datum || new Date().toISOString().split('T')[0],
      getestDoor: verdeler.getest_door || '',
      unInV: verdeler.un_in_v || '',
      inInA: verdeler.in_in_a || '',
      ikThInKA1s: verdeler.ik_th_in_ka1s || '',
      ikDynInKA: verdeler.ik_dyn_in_ka || '',
      freqInHz: verdeler.freq_in_hz || '50',
      typeNrHs: verdeler.type_nr_hs || '',
      fabrikant: verdeler.fabrikant || '',
      profilePhoto: null,
      status: verdeler.status || 'Offerte'
    });
    setShowVerdelerForm(true);
  };

  const handleSaveVerdeler = async () => {
    if (!verdelerData.distributorId || !verdelerData.kastNaam) {
      toast.error('Vul alle verplichte velden in!');
      return;
    }

    console.log('Saving verdeler data:', verdelerData);
    
    try {
      const verdelerToSave = {
        distributorId: verdelerData.distributorId,
        projectId: projectData.id,
        kastNaam: verdelerData.kastNaam,
        systeem: verdelerData.systeem,
        voeding: verdelerData.voeding,
        bouwjaar: verdelerData.bouwjaar,
        keuringDatum: verdelerData.keuringDatum,
        getestDoor: verdelerData.getestDoor,
        unInV: verdelerData.unInV,
        inInA: verdelerData.inInA,
        ikThInKA1s: verdelerData.ikThInKA1s,
        ikDynInKA: verdelerData.ikDynInKA,
        freqInHz: verdelerData.freqInHz,
        typeNrHs: verdelerData.typeNrHs,
        fabrikant: verdelerData.fabrikant,
        profilePhoto: verdelerData.profilePhoto,
        status: verdelerData.status
      };

      if (editingVerdeler) {
        // Update existing verdeler
        await dataService.updateDistributor(editingVerdeler.id, verdelerToSave);
        const updatedVerdelers = verdelers.map(v => 
          v.id === editingVerdeler.id 
            ? { ...editingVerdeler, ...verdelerToSave }
            : v
        );
        setVerdelers(updatedVerdelers);
        if (onVerdelersChange) {
          onVerdelersChange(updatedVerdelers);
        }
        toast.success('Verdeler bijgewerkt!');
      } else {
        // Create new verdeler
        if (projectData.id) {
          // Save to database if project exists
          const savedVerdeler = await dataService.createDistributor(verdelerToSave);
          const updatedVerdelers = [...verdelers, savedVerdeler];
          setVerdelers(updatedVerdelers);
          if (onVerdelersChange) {
            onVerdelersChange(updatedVerdelers);
          }
        } else {
          // Add to temporary list during project creation
          const newVerdeler = {
            id: uuidv4(),
            ...verdelerToSave,
            createdAt: new Date().toISOString()
          };
          const updatedVerdelers = [...verdelers, newVerdeler];
          setVerdelers(updatedVerdelers);
          if (onVerdelersChange) {
            onVerdelersChange(updatedVerdelers);
          }
        }
        toast.success('Verdeler toegevoegd!');
      }

      setShowVerdelerForm(false);
      setEditingVerdeler(null);
    } catch (error) {
      console.error('Error saving verdeler:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de verdeler');
    }
  };

  const handleDeleteVerdeler = async (verdelerId: string) => {
    if (window.confirm('Weet je zeker dat je deze verdeler wilt verwijderen?')) {
      try {
        if (projectData.id) {
          // Delete from database if project exists
          await dataService.deleteDistributor(verdelerId);
        }
        
        const updatedVerdelers = verdelers.filter(v => v.id !== verdelerId);
        setVerdelers(updatedVerdelers);
        if (onVerdelersChange) {
          onVerdelersChange(updatedVerdelers);
        }
        toast.success('Verdeler verwijderd!');
      } catch (error) {
        console.error('Error deleting verdeler:', error);
        toast.error('Er is een fout opgetreden bij het verwijderen van de verdeler');
      }
    }
  };

  const handleTestComplete = (verdeler: any, testData: any) => {
    console.log('Test completed for verdeler:', verdeler.distributorId, 'with data:', testData);
    toast.success('Test succesvol voltooid!');
  };

  const handleGenerateAccessCode = (verdeler: any) => {
    if (!hasPermission('access_codes', 'create')) {
      toast.error('Je hebt geen toestemming om toegangscodes aan te maken');
      return;
    }
    setSelectedVerdelerForCode(verdeler);
    setNewAccessCode({
      code: generateRandomCode(),
      expiresAt: getDefaultExpiryDate(),
      maxUses: '',
      isActive: true
    });
    setShowAccessCodeForm(true);
  };

  const handleCreateAccessCode = async () => {
    if (!newAccessCode.code || !newAccessCode.expiresAt) {
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
        verdeler_id: selectedVerdelerForCode.distributor_id || selectedVerdelerForCode.distributorId,
        project_number: projectData.project_number || ''
      };

      await dataService.createAccessCode(accessCodeData);
      
      setShowAccessCodeForm(false);
      setSelectedVerdelerForCode(null);
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

  const handleCancelForm = () => {
    setShowVerdelerForm(false);
    setEditingVerdeler(null);
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerdelerData({ ...verdelerData, profilePhoto: file });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg text-gradient mb-2">Verdelers</h2>
            <p className="text-gray-400">Beheer de verdelers voor dit project</p>
          </div>
          <button
            onClick={handleAddVerdeler}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Verdeler toevoegen</span>
          </button>
        </div>


      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-700">
        {onBack && (
          <button
            onClick={onBack}
            className="btn-secondary"
          >
            Terug
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="btn-primary"
          >
            Volgende stap
          </button>
        )}
      </div>
        {/* Verdelers List */}
        {verdelers.length > 0 && (
          <div className="bg-[#2A303C] rounded-lg overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700 sticky top-0 bg-[#2A303C] z-10">
                    <th className="text-left p-4 text-gray-400 font-medium">Verdeler ID</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Kastnaam</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Systeem</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Toegangscodes</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {verdelers.map((verdeler, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-[#1E2530] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="font-medium text-green-400">{verdeler.distributor_id || verdeler.distributorId || '-'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-white max-w-xs">
                        <div className="truncate" title={verdeler.kast_naam || verdeler.kastNaam || '-'}>
                          {verdeler.kast_naam || verdeler.kastNaam || '-'}
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{verdeler.systeem || '-'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          verdeler.status === 'Opgeleverd' ? 'bg-green-500/20 text-green-400' :
                          verdeler.status === 'Gereed' ? 'bg-blue-500/20 text-blue-400' :
                          verdeler.status === 'Testen' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {verdeler.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const codes = getVerdelerAccessCodes(verdeler.distributor_id || verdeler.distributorId);
                          return codes.length > 0 ? (
                            <div className="space-y-1">
                              {codes.slice(0, 2).map((code) => (
                                <div key={code.id} className="flex items-center space-x-2">
                                  <span className={`font-mono text-sm px-2 py-1 rounded ${
                                    isAccessCodeExpired(code.expires_at) 
                                      ? 'bg-red-500/20 text-red-400' 
                                      : 'bg-green-500/20 text-green-400'
                                  }`}>
                                    {code.code}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyCode(code.code);
                                    }}
                                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                                    title="Kopieer code"
                                  >
                                    <Copy size={12} className="text-gray-400 hover:text-white" />
                                  </button>
                                </div>
                              ))}
                              {codes.length > 2 && (
                                <div className="text-xs text-gray-400">
                                  +{codes.length - 2} meer...
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Geen codes</span>
                          );
                        })()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedVerdeler(verdeler)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors group"
                            title="Openen"
                          >
                            <Eye size={16} className="text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleGenerateAccessCode(verdeler)}
                            className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors group"
                            title="Toegangscode genereren"
                          >
                            <Key size={16} className="text-green-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteVerdeler(index)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors group"
                            title="Verwijderen"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {verdelers.length === 0 && (
          <div className="bg-[#2A303C] rounded-lg p-12 text-center min-h-[300px] flex flex-col items-center justify-center">
            <Server size={64} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Nog geen verdelers toegevoegd</h3>
            <p className="text-gray-400 mb-6">
              Klik op "Verdeler toevoegen" om je eerste verdeler aan dit project toe te voegen
            </p>
            <button
              onClick={handleAddVerdeler}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Eerste verdeler toevoegen</span>
            </button>
          </div>
        )}

        {/* Verdeler Details Modal */}
        {selectedVerdeler && createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen py-4 px-4 flex items-center justify-center">
              <div className="bg-[#1E2530] rounded-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
                  <div>
                    <h2 className="text-xl font-semibold text-blue-400">
                      {selectedVerdeler.distributor_id || selectedVerdeler.distributorId || '-'} - {selectedVerdeler.kast_naam || selectedVerdeler.kastNaam || 'Naamloos'}
                    </h2>
                    <p className="text-sm text-gray-400">Verdeler details en acties</p>
                  </div>
                  <button
                    onClick={() => setSelectedVerdeler(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Verdeler Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-[#2A303C] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-400 mb-4">Basis Informatie</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Verdeler ID:</span>
                        <span className="text-white font-medium">{selectedVerdeler.distributor_id || selectedVerdeler.distributorId || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Kastnaam:</span>
                        <span className="text-white font-medium">{selectedVerdeler.kast_naam || selectedVerdeler.kastNaam || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Systeem:</span>
                        <span className="text-white">{selectedVerdeler.systeem || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Voeding:</span>
                        <span className="text-white">{selectedVerdeler.voeding || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          selectedVerdeler.status === 'Opgeleverd' ? 'bg-green-500/20 text-green-400' :
                          selectedVerdeler.status === 'Gereed' ? 'bg-blue-500/20 text-blue-400' :
                          selectedVerdeler.status === 'Testen' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {selectedVerdeler.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#2A303C] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-400 mb-4">Technische Specs</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Un in V:</span>
                        <span className="text-white">{selectedVerdeler.unInV || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">In in A:</span>
                        <span className="text-white">{selectedVerdeler.inInA || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Freq. in Hz:</span>
                        <span className="text-white">{selectedVerdeler.freqInHz || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ik Th in KA 1s:</span>
                        <span className="text-white">{selectedVerdeler.ik_th_in_ka1s || selectedVerdeler.ikThInKA1s || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ik Dyn in KA:</span>
                        <span className="text-white">{selectedVerdeler.ik_dyn_in_ka || selectedVerdeler.ikDynInKA || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type nr. HS:</span>
                        <span className="text-white">{selectedVerdeler.type_nr_hs || selectedVerdeler.typeNrHs || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fabrikant:</span>
                        <span className="text-white">{selectedVerdeler.fabrikant || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bouwjaar:</span>
                        <span className="text-white">{selectedVerdeler.bouwjaar || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Getest door:</span>
                        <span className="text-white">{selectedVerdeler.getest_door || selectedVerdeler.getestDoor || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Keuring datum:</span>
                        <span className="text-white">
                          {selectedVerdeler.keuring_datum || selectedVerdeler.keuringDatum 
                            ? new Date(selectedVerdeler.keuring_datum || selectedVerdeler.keuringDatum).toLocaleDateString('nl-NL')
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Bouwjaar:</label>
                     <p className="text-white font-medium">{showVerdelerInfo.bouwjaar || '-'}</p>
                   </div>
                            : '-'}
                        </span>
                      </div>
                    </div>
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Fabrikant:</label>
                     <p className="text-white font-medium">{showVerdelerInfo.fabrikant || '-'}</p>
                   </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-orange-400 mb-4">Acties</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <VerdelerTesting
                      verdeler={selectedVerdeler}
                      projectNumber={projectData.project_number || ''}
                      onComplete={(testData) => handleTestComplete(selectedVerdeler, testData)}
                      projectId={projectData.id}
                      distributorId={selectedVerdeler.id}
                    />
                    <FATTest
                      verdeler={selectedVerdeler}
                      projectNumber={projectData.project_number || ''}
                      onComplete={(testData) => handleTestComplete(selectedVerdeler, testData)}
                    />
                    <HighVoltageTest
                      verdeler={selectedVerdeler}
                      projectNumber={projectData.project_number || ''}
                      onComplete={(testData) => handleTestComplete(selectedVerdeler, testData)}
                    />
                    <OnSiteTest
                      verdeler={selectedVerdeler}
                      projectNumber={projectData.project_number || ''}
                      onComplete={(testData) => handleTestComplete(selectedVerdeler, testData)}
                    />
                    <button
                      onClick={() => handleGenerateAccessCode(selectedVerdeler)}
                      className="btn-secondary flex items-center space-x-2"
                      title="Genereer toegangscode voor deze verdeler"
                    >
                      <Key size={16} />
                      <span>Toegangscode</span>
                    </button>
                    <PrintLabel
                      verdeler={selectedVerdeler}
                      projectNumber={projectData.project_number || ''}
                      logo=""
                    />
                    <button
                      onClick={() => handleEditVerdeler(selectedVerdeler)}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Edit size={16} />
                      <span>Bewerken</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Verdeler Form Modal */}
        {showVerdelerForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen py-8 px-4 flex items-center justify-center">
              <div className="bg-[#1E2530] rounded-2xl shadow-2xl border border-white/10 w-full max-w-6xl max-h-[85vh] flex flex-col my-8">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
                  <h2 className="text-xl font-semibold">
                    {editingVerdeler ? 'Verdeler bewerken' : 'Nieuwe verdeler toevoegen'}
                  </h2>
                  <button
                    onClick={() => setShowVerdelerForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-8">
                    {/* Basis Informatie Section */}
                    <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Server size={20} className="text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-green-400">Basis Informatie</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Verdeler ID <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={verdelerData.distributorId}
                            onChange={(e) => setVerdelerData({ ...verdelerData, distributorId: e.target.value })}
                            placeholder="VD1234"
                            required
                          />
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={verdelerData.kastNaam}
                            onChange={(e) => setVerdelerData({ ...verdelerData, kastNaam: e.target.value })}
                            placeholder="Hoofdverdeler A"
                            required
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Freq. in Hz:</label>
                     <p className="text-white font-medium">{showVerdelerInfo.freqInHz || '-'}</p>
                   </div>
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Systeem</label>
                  </div>
                </div>

               {/* Aanvullende Informatie */}
               <div className="bg-[#2A303C] p-6 rounded-lg">
                 <h3 className="text-lg font-semibold text-purple-400 mb-4">Aanvullende Informatie</h3>
                 <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Toegewezen monteur:</label>
                     <p className="text-white font-medium">{showVerdelerInfo.toegewezenMonteur || 'Nader te bepalen'}</p>
                   </div>
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Gewenste lever datum:</label>
                     <p className="text-white font-medium">
                       {showVerdelerInfo.gewensteLeverDatum 
                         ? new Date(showVerdelerInfo.gewensteLeverDatum).toLocaleDateString('nl-NL')
                         : 'Niet ingesteld'}
                     </p>
                   </div>
                 </div>
               </div>
              </div>
            </div>
          </div>
        )}

      {showVerdelerForm && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-[#1E2530] rounded-2xl shadow-2xl border border-white/10 w-full max-w-6xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-700 flex-shrink-0">
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

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8">
                  {/* Basis Informatie Section */}
                  <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                        <Building size={20} className="text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-400">Basis Informatie</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          Verdeler ID <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          value={verdelerData.distributorId}
                          onChange={(e) => setVerdelerData({ ...verdelerData, distributorId: e.target.value })}
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
                          onChange={(e) => setVerdelerData({ ...verdelerData, kastNaam: e.target.value })}
                          placeholder="Hoofdverdeler A"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Systeem</label>
                        <input
                          type="text"
                          className="input-field"
                          value={verdelerData.systeem}
                          onChange={(e) => setVerdelerData({ ...verdelerData, systeem: e.target.value })}
                          placeholder="400V TN-S"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Voeding</label>
                        <input
                          type="text"
                          className="input-field"
                          value={verdelerData.voeding}
                          onChange={(e) => setVerdelerData({ ...verdelerData, voeding: e.target.value })}
                          placeholder="3x400V + N + PE"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Bouwjaar</label>
                        <input
                          type="text"
                          className="input-field"
                          value={verdelerData.bouwjaar}
                          onChange={(e) => setVerdelerData({ ...verdelerData, bouwjaar: e.target.value })}
                          placeholder="2025"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Status</label>
                        <select
                          className={`input-field ${
                            projectData?.status !== 'Productie' ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          value={verdelerData.status}
                          onChange={(e) => setVerdelerData({ ...verdelerData, status: e.target.value })}
                          disabled={projectData?.status !== 'Productie'}
                        >
                          <option value="Offerte">Offerte</option>
                          <option value="In productie">In productie</option>
                          <option value="Testen">Testen</option>
                          <option value="Gereed">Gereed</option>
                          <option value="Opgeleverd">Opgeleverd</option>
                        </select>
                        {projectData?.status !== 'Productie' && (
                          <p className="text-xs text-yellow-400 mt-1">
                            Status kan alleen worden gewijzigd wanneer project status is ingesteld op "Productie".
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Fabrikant</label>
                        <select
                          className="input-field"
                          value={verdelerData.fabrikant}
                          onChange={(e) => setVerdelerData({ ...verdelerData, fabrikant: e.target.value })}
                        >
                          <option value="">Selecteer fabrikant</option>
                          <option value="Schneider Electric">Schneider Electric</option>
                          <option value="ABB">ABB</option>
                          <option value="Siemens">Siemens</option>
                          <option value="Eaton">Eaton</option>
                          <option value="Legrand">Legrand</option>
                          <option value="Hager">Hager</option>
                          <option value="Rittal">Rittal</option>
                          <option value="Phoenix Contact">Phoenix Contact</option>
                          <option value="Weidmüller">Weidmüller</option>
                          <option value="Anders">Anders</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Technische Specs Section */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                        <Zap size={20} className="text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-purple-400">Technische Specs</h3>
                    </div>
                    
                    {projectData?.status !== 'Productie' && (
                      <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-black font-bold">!</span>
                          </div>
                          <div>
                            <p className="font-medium text-yellow-400">Technische specificaties vergrendeld</p>
                            <p className="text-sm text-yellow-300">
                              Deze velden kunnen alleen worden ingevuld wanneer de project status is ingesteld op "Productie".
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Un in V</label>
                        <input
                          type="text"
                          className={`input-field ${
                            projectData?.status !== 'Productie' ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          value={verdelerData.unInV}
                          onChange={(e) => setVerdelerData({ ...verdelerData, unInV: e.target.value })}
                          placeholder="400"
                          disabled={projectData?.status !== 'Productie'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">In in A</label>
                        <input
                          type="text"
                          className={`input-field ${
                            projectData?.status !== 'Productie' ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          value={verdelerData.inInA}
                          onChange={(e) => setVerdelerData({ ...verdelerData, inInA: e.target.value })}
                          placeholder="400"
                          disabled={projectData?.status !== 'Productie'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Ik Th in KA 1s</label>
                        <input
                          type="text"
                          className={`input-field ${
                            projectData?.status !== 'Productie' ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          value={verdelerData.ikThInKA1s}
                          onChange={(e) => setVerdelerData({ ...verdelerData, ikThInKA1s: e.target.value })}
                          placeholder="25"
                          disabled={projectData?.status !== 'Productie'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Ik Dyn in KA</label>
                        <input
                          type="text"
                          className={`input-field ${
                            projectData?.status !== 'Productie' ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          value={verdelerData.ikDynInKA}
                          onChange={(e) => setVerdelerData({ ...verdelerData, ikDynInKA: e.target.value })}
                          placeholder="65"
                          disabled={projectData?.status !== 'Productie'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Freq. in Hz</label>
                        <input
                          type="text"
                          className={`input-field ${
                            projectData?.status !== 'Productie' ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          value={verdelerData.freqInHz}
                          onChange={(e) => setVerdelerData({ ...verdelerData, freqInHz: e.target.value })}
                          placeholder="50"
                          disabled={projectData?.status !== 'Productie'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Type nr. HS</label>
                        <input
                          type="text"
                          className={`input-field ${
                            projectData?.status !== 'Productie' ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                          value={verdelerData.typeNrHs}
                          onChange={(e) => setVerdelerData({ ...verdelerData, typeNrHs: e.target.value })}
                          placeholder="NS400N"
                          disabled={projectData?.status !== 'Productie'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aanvullende Informatie Section */}
                  <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                        <Calendar size={20} className="text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-orange-400">Aanvullende Informatie</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Toegewezen monteur</label>
                        <select
                          className="input-field"
                          value={verdelerData.toegewezenMonteur}
                          onChange={(e) => setVerdelerData({ ...verdelerData, toegewezenMonteur: e.target.value })}
                        >
                          <option value="">Nader te bepalen</option>
                          {users.length > 0 && (() => {
                            const { primary, other } = getMontageUsersByLocation(projectData.location || '');
                            console.log('🔍 DROPDOWN RENDER: Primary users for dropdown:', primary.length);
                            console.log('🔍 DROPDOWN RENDER: Other users for dropdown:', other.length);
                            
                            return (
                              <>
                                {primary.length > 0 && (
                                  <optgroup label={`Primair - ${projectData.location || 'Onbekend'}`}>
                                    {primary.map(user => (
                                      <option key={user.id} value={user.username}>
                                        {user.username}
                                      </option>
                                    ))}
                                  </optgroup>
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
                                  <option disabled>Geen montage medewerkers gevonden</option>
                                )}
                              </>
                            );
                          })()}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Gewenste lever datum</label>
                        <input
                          type="date"
                          className="input-field"
                          value={verdelerData.gewensteLeverDatum}
                          onChange={(e) => setVerdelerData({ ...verdelerData, gewensteLeverDatum: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Profiel foto</label>
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePhotoChange}
                            className="hidden"
                            id="profile-photo-upload"
                          />
                          <label
                            htmlFor="profile-photo-upload"
                            className="btn-secondary flex items-center space-x-2 cursor-pointer w-full justify-center"
                          >
                            <Camera size={20} />
                            <span>Bestand kiezen</span>
                          </label>
                          <p className="text-xs text-gray-500">Ondersteunde formaten: JPG, PNG, GIF (max. 5MB)</p>
                        </div>
                      </div>

                      {verdelerData.profilePhoto && (
                        <div className="md:col-span-3 mt-4">
                          <img
                            src={typeof verdelerData.profilePhoto === 'string' ? verdelerData.profilePhoto : URL.createObjectURL(verdelerData.profilePhoto)}
                            alt="Profile preview"
                            className="w-32 h-32 object-cover rounded-lg border-2 border-orange-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-4 p-6 border-t border-gray-700 flex-shrink-0">
                <button
                  onClick={handleCancelForm}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveVerdeler}
                  className="btn-primary"
                  disabled={!verdelerData.distributorId || !verdelerData.kastNaam}
                >
                  {editingVerdeler ? 'Bijwerken' : 'Opslaan'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

        {/* Access Code Form Modal */}
        {showAccessCodeForm && createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] overflow-y-auto">
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="bg-[#1E2530] rounded-2xl shadow-2xl border border-white/10 w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-green-400">Toegangscode genereren</h2>
                    <button
                      onClick={() => setShowAccessCodeForm(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Verdeler
                      </label>
                      <div className="bg-[#2A303C] rounded-lg p-3">
                        <span className="text-white font-medium">
                          {selectedVerdelerForCode?.distributor_id || selectedVerdelerForCode?.distributorId} - {selectedVerdelerForCode?.kast_naam || selectedVerdelerForCode?.kastNaam}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Toegangscode <span className="text-red-400">*</span>
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          className="input-field flex-1"
                          value={newAccessCode.code}
                          onChange={(e) => setNewAccessCode({ ...newAccessCode, code: e.target.value })}
                          placeholder="12345"
                          maxLength={5}
                          pattern="[0-9]{5}"
                        />
                        <button
                          onClick={() => setNewAccessCode({ ...newAccessCode, code: generateRandomCode() })}
                          className="btn-secondary px-3"
                          title="Nieuwe code genereren"
                        >
                          🎲
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Precies 5 cijfers</p>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Vervaldatum <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="input-field"
                        value={newAccessCode.expiresAt}
                        onChange={(e) => setNewAccessCode({ ...newAccessCode, expiresAt: e.target.value })}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Maximum aantal keer gebruiken (optioneel)
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        value={newAccessCode.maxUses}
                        onChange={(e) => setNewAccessCode({ ...newAccessCode, maxUses: e.target.value })}
                        placeholder="Onbeperkt"
                        min="1"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={newAccessCode.isActive}
                        onChange={(e) => setNewAccessCode({ ...newAccessCode, isActive: e.target.checked })}
                        className="rounded border-gray-600 bg-[#2A303C] text-green-500 focus:ring-green-500"
                      />
                      <label htmlFor="isActive" className="text-sm text-gray-300">
                        Code is actief
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={() => setShowAccessCodeForm(false)}
                      className="btn-secondary"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={handleCreateAccessCode}
                      className="btn-primary"
                      disabled={generatingCode || !newAccessCode.code || !newAccessCode.expiresAt}
                    >
                      {generatingCode ? 'Genereren...' : 'Code aanmaken'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
};

export default VerdelersStep;