import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, Upload, Key, Printer, CheckSquare, Server, Eye, Info, Download } from 'lucide-react';
import VerdelerTesting from './VerdelerTesting';
import FATTest from './FATTest';
import HighVoltageTest from './HighVoltageTest';
import OnSiteTest from './OnSiteTest';
import PrintLabel from './PrintLabel';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
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
  const [verdelers, setVerdelers] = useState<any[]>([]);
  const [showVerdelerForm, setShowVerdelerForm] = useState(false);
  const [editingVerdeler, setEditingVerdeler] = useState<any>(null);
  const [showVerdelerInfo, setShowVerdelerInfo] = useState<any>(null);
  const [selectedVerdeler, setSelectedVerdeler] = useState<any>(null);
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [selectedVerdelerForAccessCode, setSelectedVerdelerForAccessCode] = useState<any>(null);
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
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
    keuringDatum: new Date().toISOString().split('T')[0],
    getestDoor: '',
    unInV: '',
    inInA: '',
    ikThInKA1s: '',
    ikDynInKA: '',
    freqInHz: '50',
    typeNrHs: '',
    fabrikant: '',
    profilePhoto: null as File | null,
    status: 'In productie'
  });

  useEffect(() => {
    if (projectData?.distributors) {
      setVerdelers(projectData.distributors);
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
      status: 'In productie'
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
      freqInHz: verdeler.freq_in_hz || '',
      typeNrHs: verdeler.type_nr_hs || '',
      fabrikant: verdeler.fabrikant || '',
      profilePhoto: null,
      status: verdeler.status || 'In productie'
    });
    setShowVerdelerForm(true);
  };

  const handleSaveVerdeler = async () => {
    if (!verdelerData.distributorId || !verdelerData.kastNaam) {
      toast.error('Vul alle verplichte velden in!');
      return;
    }

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
    setIsAccessCodeModalOpen(true);
    setSelectedVerdelerForAccessCode(verdeler);
    setNewAccessCode({
      code: generateRandomCode(),
      expiresAt: getDefaultExpiryDate(),
      maxUses: '',
      isActive: true
    });
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
      const currentUserId = localStorage.getItem('currentUserId');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find((u: any) => u.id === currentUserId);

      if (!currentUser) {
        toast.error('Geen gebruiker gevonden. Log opnieuw in.');
        return;
      }

      const accessCodeData = {
        code: newAccessCode.code.toUpperCase(),
        createdBy: currentUser?.username || 'Unknown',
        expiresAt: newAccessCode.expiresAt,
        isActive: newAccessCode.isActive,
        maxUses: newAccessCode.maxUses ? parseInt(newAccessCode.maxUses) : null,
        verdeler_id: selectedVerdelerForAccessCode.distributor_id || selectedVerdelerForAccessCode.distributorId,
        project_number: projectData.project_number || projectData.project?.project_number || 'Unknown'
      };

      await dataService.createAccessCode(accessCodeData);
      await loadAccessCodes(); // Refresh access codes
      
      setIsAccessCodeModalOpen(false);
      setSelectedVerdelerForAccessCode(null);
      setNewAccessCode({
        code: '',
        expiresAt: '',
        maxUses: '',
        isActive: true
      });
      
      toast.success(`Toegangscode ${newAccessCode.code} aangemaakt voor verdeler ${selectedVerdelerForAccessCode.distributor_id}!`);
    } catch (error) {
      console.error('Error creating access code:', error);
      toast.error('Er is een fout opgetreden bij het aanmaken van de toegangscode');
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

        {/* Verdelers List */}
        {verdelers.length > 0 && (
          <div className="bg-[#2A303C] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-4 text-gray-400 font-medium">Verdeler ID</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Kastnaam</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Systeem</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {verdelers.map((verdeler, index) => (
                    <tr key={index} className="border-b border-gray-700 hover:bg-[#1E2530] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="font-medium text-green-400">{verdeler.distributorId}</span>
                        </div>
                      </td>
                      <td className="p-4 text-white">{verdeler.kastNaam || '-'}</td>
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

        {/* Verdeler Details Modal */}
        {selectedVerdeler && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-screen py-8 px-4 flex items-start justify-center">
              <div className="bg-[#1E2530] rounded-xl p-4 w-full max-w-4xl shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                  <div>
                    <h2 className="text-lg font-semibold text-blue-400">
                      {selectedVerdeler.distributorId} - {selectedVerdeler.kastNaam || 'Naamloos'}
                    </h2>
                    <p className="text-xs text-gray-400">Verdeler details en acties</p>
                  </div>
                  <button
                    onClick={() => setSelectedVerdeler(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Verdeler Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#2A303C] rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-green-400 mb-3">Basis Informatie</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Verdeler ID:</span>
                        <span className="text-white font-medium">{selectedVerdeler.distributorId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Kastnaam:</span>
                        <span className="text-white font-medium">{selectedVerdeler.kastNaam || '-'}</span>
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
                        <span className={`px-2 py-1 rounded-full text-xs ${
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

                  <div className="bg-[#2A303C] rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-purple-400 mb-3">Technische Specs</h3>
                    <div className="space-y-2 text-sm">
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
                        <span className="text-gray-400">Fabrikant:</span>
                        <span className="text-white">{selectedVerdeler.fabrikant || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bouwjaar:</span>
                        <span className="text-white">{selectedVerdeler.bouwjaar || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-[#2A303C] rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-orange-400 mb-3">Acties</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <VerdelerTesting
                      verdeler={selectedVerdeler}
                      projectNumber={projectData?.projectNumber || ''}
                      onComplete={() => {}}
                    />
                    <FATTest
                      verdeler={selectedVerdeler}
                      projectNumber={projectData?.projectNumber || ''}
                      onComplete={() => {}}
                    />
                    <HighVoltageTest
                      verdeler={selectedVerdeler}
                      projectNumber={projectData?.projectNumber || ''}
                      onComplete={() => {}}
                    />
                    <OnSiteTest
                      verdeler={selectedVerdeler}
                      projectNumber={projectData?.projectNumber || ''}
                      onComplete={() => {}}
                    />
                    <PrintLabel
                      verdeler={selectedVerdeler}
                      projectNumber={projectData?.projectNumber || ''}
                      logo={ewpLogo}
                    />
                    <button
                      onClick={() => {
                        setEditingVerdeler(selectedVerdeler);
                        setVerdelerData(selectedVerdeler);
                        setSelectedVerdeler(null);
                        setShowVerdelerForm(true);
                      }}
                      className="btn-secondary flex items-center space-x-2 text-sm"
                    >
                      <Edit size={14} />
                      <span>Bewerken</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Old verdeler cards - remove this section */}
        {false && verdelers.length > 0 && (
          <div className="space-y-4">
            {verdelers.map((verdeler) => (
              <div key={verdeler.id} className="bg-[#2A303C] rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {verdeler.profile_photo ? (
                      <img
                        src={verdeler.profile_photo}
                        alt={verdeler.distributor_id}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Server size={24} className="text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-green-400">
                          {verdeler.distributor_id}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          verdeler.status === 'Opgeleverd' ? 'bg-green-500/20 text-green-400' :
                          verdeler.status === 'In productie' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {verdeler.status || 'In productie'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Kastnaam</p>
                          <p className="font-medium text-white">{verdeler.kast_naam || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Systeem</p>
                          <p className="font-medium text-white">{verdeler.systeem || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Fabrikant</p>
                          <p className="font-medium text-white">{verdeler.fabrikant || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Access Code Status */}
                </div>

                {/* Access Code Status - Moved outside and improved layout */}
                {(() => {
                  const codes = getVerdelerAccessCodes(verdeler.distributor_id);
                  const activeCodes = codes.filter(code => !isAccessCodeExpired(code.expires_at));
                  
                  if (activeCodes.length > 0) {
                    return (
                      <div className="mt-6 pt-4 border-t border-gray-700">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-sm text-green-400 font-medium">
                                {activeCodes.length} actieve toegangscode{activeCodes.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeCodes.slice(0, 3).map(code => (
                              <div key={code.id} className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                                <span className="text-sm font-mono text-green-400">{code.code}</span>
                                <span className="text-xs text-gray-400">
                                  verloopt {new Date(code.expires_at).toLocaleDateString('nl-NL')}
                                </span>
                              </div>
                            ))}
                            {activeCodes.length > 3 && (
                              <div className="flex items-center px-3 py-2 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                                <span className="text-xs text-gray-400">+{activeCodes.length - 3} meer</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            💡 Codes werken voor onderhoudsmelding via QR-code scan
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Action Buttons - Improved layout */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-3">
                    {/* First Row - Main Actions */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => setShowVerdelerInfo(verdeler)}
                        className="btn-secondary flex items-center space-x-2"
                        title="Bekijk alle informatie"
                      >
                        <Info size={16} />
                        <span>Info</span>
                      </button>
                      <button
                        onClick={() => handleEditVerdeler(verdeler)}
                        className="btn-secondary flex items-center space-x-2"
                        title="Bewerken"
                      >
                        <Edit size={16} />
                        <span>Bewerken</span>
                      </button>
                      <button
                        onClick={() => handleDeleteVerdeler(verdeler.id)}
                        className="btn-secondary flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                        title="Verwijderen"
                      >
                        <Trash2 size={16} />
                        <span>Verwijderen</span>
                      </button>
                    </div>
                    
                    {/* Second Row - Test Actions */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      <VerdelerTesting
                        verdeler={verdeler}
                        projectNumber={projectData.project_number}
                        onComplete={(testData) => handleTestComplete(verdeler, testData)}
                      />
                      <FATTest
                        verdeler={verdeler}
                        projectNumber={projectData.project_number}
                        onComplete={(testData) => handleTestComplete(verdeler, testData)}
                      />
                      <HighVoltageTest
                        verdeler={verdeler}
                        projectNumber={projectData.project_number}
                        onComplete={(testData) => handleTestComplete(verdeler, testData)}
                      />
                      <OnSiteTest
                        verdeler={verdeler}
                        projectNumber={projectData.project_number}
                        onComplete={(testData) => handleTestComplete(verdeler, testData)}
                      />
                    </div>
                    
                    {/* Third Row - Utility Actions */}
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => handleGenerateAccessCode(verdeler)}
                        className="btn-secondary flex items-center space-x-2"
                        title="Genereer toegangscode"
                      >
                        <Key size={16} />
                        <span>Toegangscode</span>
                      </button>
                      <PrintLabel
                        verdeler={verdeler}
                        projectNumber={projectData.project_number}
                        logo={ewpLogo}
                      />
                      {(() => {
                        // Check if verdeler testing is completed
                        const testData = localStorage.getItem(`verdeler_test_${verdeler.distributor_id}`);
                        if (testData) {
                          try {
                            const parsed = JSON.parse(testData);
                            if (parsed.inspectionReport?.completed) {
                              return (
                                <button
                                  onClick={async () => {
                                    try {
                                      const { generateVerdelerTestingPDF } = await import('./VerdelerTestingPDF');
                                      const pdfBase64 = await generateVerdelerTestingPDF(
                                        parsed, 
                                        verdeler, 
                                        projectData.project_number,
                                        projectData.id,
                                        verdeler.id
                                      );
                                      
                                      // Download the PDF
                                      const link = document.createElement('a');
                                      link.href = pdfBase64;
                                      link.download = `Keuringsrapport_${verdeler.distributor_id}_${new Date().toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      
                                      toast.success('Keuringsrapport gedownload!');
                                    } catch (error) {
                                      console.error('Error downloading PDF:', error);
                                      toast.error('Er is een fout opgetreden bij het downloaden van het rapport');
                                    }
                                  }}
                                  className="btn-secondary flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 text-green-400"
                                  title="Download keuringsrapport"
                                >
                                  <Download size={16} />
                                  <span>Keuringsrapport</span>
                                </button>
                              );
                            }
                          } catch (error) {
                            console.error('Error parsing test data:', error);
                          }
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {verdelers.length === 0 && (
          <div className="text-center py-12">
            <Server size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Nog geen verdelers toegevoegd</p>
            <p className="text-gray-500 text-sm mt-2">Klik op "Verdeler toevoegen" om te beginnen</p>
          </div>
        )}

        {/* Verdeler Form Modal */}
        {showVerdelerForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1E2530] rounded-xl p-4 w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-blue-400">
                  {editingVerdeler ? 'Verdeler bewerken' : 'Nieuwe verdeler toevoegen'}
                </h2>
                <button
                  onClick={() => {
                    setShowVerdelerForm(false);
                    setEditingVerdeler(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Compact Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Verdeler ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.distributorId}
                    onChange={(e) => setVerdelerData({ ...verdelerData, distributorId: e.target.value })}
                    required
                    placeholder="VD1234"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Kastnaam <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.kastNaam}
                    onChange={(e) => setVerdelerData({ ...verdelerData, kastNaam: e.target.value })}
                    required
                    placeholder="Hoofdverdeler A"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Systeem</label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.systeem}
                    onChange={(e) => setVerdelerData({ ...verdelerData, systeem: e.target.value })}
                    placeholder="400V TN-S"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Voeding</label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.voeding}
                    onChange={(e) => setVerdelerData({ ...verdelerData, voeding: e.target.value })}
                    placeholder="3x400V + N + PE"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Un in V</label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.unInV}
                    onChange={(e) => setVerdelerData({ ...verdelerData, unInV: e.target.value })}
                    placeholder="400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">In in A</label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.inInA}
                    onChange={(e) => setVerdelerData({ ...verdelerData, inInA: e.target.value })}
                    placeholder="400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Freq. in Hz</label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.freqInHz}
                    onChange={(e) => setVerdelerData({ ...verdelerData, freqInHz: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Bouwjaar</label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.bouwjaar}
                    onChange={(e) => setVerdelerData({ ...verdelerData, bouwjaar: e.target.value })}
                    placeholder="2025"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Ik Th in KA 1s</label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.ikThInKA1s}
                    onChange={(e) => setVerdelerData({ ...verdelerData, ikThInKA1s: e.target.value })}
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Ik Dyn in KA</label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.ikDynInKA}
                    onChange={(e) => setVerdelerData({ ...verdelerData, ikDynInKA: e.target.value })}
                    placeholder="65"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Type nr. HS</label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.typeNrHs}
                    onChange={(e) => setVerdelerData({ ...verdelerData, typeNrHs: e.target.value })}
                    placeholder="NS400N"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Keuring datum</label>
                  <input
                    type="date"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.keuringDatum}
                    onChange={(e) => setVerdelerData({ ...verdelerData, keuringDatum: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Getest door</label>
                  <input
                    type="text"
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.getestDoor}
                    onChange={(e) => setVerdelerData({ ...verdelerData, getestDoor: e.target.value })}
                    placeholder="Jan Technicus"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fabrikant</label>
                  <select
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Status</label>
                  <select
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={verdelerData.status}
                    onChange={(e) => setVerdelerData({ ...verdelerData, status: e.target.value })}
                  >
                    <option value="In productie">In productie</option>
                    <option value="Testen">Testen</option>
                    <option value="Gereed">Gereed</option>
                    <option value="Opgeleverd">Opgeleverd</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Profiel foto</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setVerdelerData({
                          ...verdelerData,
                          profilePhoto: e.target.files[0]
                        });
                      }
                    }}
                    className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowVerdelerForm(false);
                    setEditingVerdeler(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveVerdeler}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                >
                  <Save size={16} />
                  <span>{editingVerdeler ? 'Bijwerken' : 'Opslaan'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verdeler Info Modal */}
        {showVerdelerInfo && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[120vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-blue-400">
                  Verdeler Informatie: {showVerdelerInfo.distributor_id}
                </h2>
                <button
                  onClick={() => setShowVerdelerInfo(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Basis Informatie</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Verdeler ID:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.distributor_id}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Kastnaam:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.kast_naam || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Systeem:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.systeem || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Voeding:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.voeding || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Bouwjaar:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.bouwjaar || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Keuring datum:</span>
                      <span className="font-medium text-white">
                        {showVerdelerInfo.keuring_datum ? new Date(showVerdelerInfo.keuring_datum).toLocaleDateString('nl-NL') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Getest door:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.getest_door || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        showVerdelerInfo.status === 'Opgeleverd' ? 'bg-green-500/20 text-green-400' :
                        showVerdelerInfo.status === 'In productie' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {showVerdelerInfo.status || 'In productie'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">Technische Specificaties</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Un in V:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.un_in_v || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">In in A:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.in_in_a || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Ik Th in KA 1s:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.ik_th_in_ka1s || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Ik Dyn in KA:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.ik_dyn_in_ka || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Freq. in Hz:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.freq_in_hz || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-gray-400">Type nr. HS:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.type_nr_hs || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400">Fabrikant:</span>
                      <span className="font-medium text-white">{showVerdelerInfo.fabrikant || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Section */}
              {showVerdelerInfo.profile_photo && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-orange-400 mb-4">Verdeler Foto</h3>
                  <div className="flex justify-center">
                    <img
                      src={showVerdelerInfo.profile_photo}
                      alt={showVerdelerInfo.distributor_id}
                      className="max-w-md max-h-64 object-contain rounded-lg border border-gray-600"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons in Modal */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-gray-400 mb-4">Acties</h3>
                <div className="flex flex-wrap gap-3">
                  <VerdelerTesting
                    verdeler={showVerdelerInfo}
                    projectNumber={projectData.project_number}
                    onComplete={(testData) => handleTestComplete(showVerdelerInfo, testData)}
                    projectId={projectData.id}
                    distributorId={showVerdelerInfo.id}
                  />
                  <FATTest
                    verdeler={showVerdelerInfo}
                    projectNumber={projectData.project_number}
                    onComplete={(testData) => handleTestComplete(showVerdelerInfo, testData)}
                  />
                  <HighVoltageTest
                    verdeler={showVerdelerInfo}
                    projectNumber={projectData.project_number}
                    onComplete={(testData) => handleTestComplete(showVerdelerInfo, testData)}
                  />
                  <OnSiteTest
                    verdeler={showVerdelerInfo}
                    projectNumber={projectData.project_number}
                    onComplete={(testData) => handleTestComplete(showVerdelerInfo, testData)}
                  />
                  <button
                    onClick={() => handleGenerateAccessCode(showVerdelerInfo)}
                    className="btn-secondary flex items-center space-x-2"
                    title="Genereer toegangscode"
                  >
                    <Key size={16} />
                    <span>Toegangscode</span>
                  </button>
                  <PrintLabel
                    verdeler={showVerdelerInfo}
                    projectNumber={projectData.project_number}
                    logo={ewpLogo}
                  />
                  {(() => {
                    // Check if verdeler testing is completed
                    const testData = localStorage.getItem(`verdeler_test_${showVerdelerInfo.distributor_id}`);
                    if (testData) {
                      try {
                        const parsed = JSON.parse(testData);
                        if (parsed.inspectionReport?.completed) {
                          return (
                            <button
                              onClick={async () => {
                                try {
                                  const { generateVerdelerTestingPDF } = await import('./VerdelerTestingPDF');
                                  const pdfBase64 = await generateVerdelerTestingPDF(
                                    parsed, 
                                    showVerdelerInfo, 
                                    projectData.project_number,
                                    projectData.id,
                                    showVerdelerInfo.id
                                  );
                                  
                                  // Download the PDF
                                  const link = document.createElement('a');
                                  link.href = pdfBase64;
                                  link.download = `Keuringsrapport_${showVerdelerInfo.distributor_id}_${new Date().toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  
                                  toast.success('Keuringsrapport gedownload!');
                                } catch (error) {
                                  console.error('Error downloading PDF:', error);
                                  toast.error('Er is een fout opgetreden bij het downloaden van het rapport');
                                }
                              }}
                              className="btn-secondary flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 text-green-400"
                              title="Download keuringsrapport"
                            >
                              <Download size={16} />
                              <span>Keuringsrapport</span>
                            </button>
                          );
                        }
                      } catch (error) {
                        console.error('Error parsing test data:', error);
                      }
                    }
                    return null;
                  })()}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowVerdelerInfo(null)}
                  className="btn-primary"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Access Code Form Modal */}
        {isAccessCodeModalOpen && selectedVerdelerForAccessCode && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E2530] rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-blue-400">Toegangscode genereren</h2>
                <button
                  onClick={() => {
                    setIsAccessCodeModalOpen(false);
                    setSelectedVerdelerForAccessCode(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-[#2A303C] p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-400 mb-2">Voor verdeler</h3>
                  <p className="text-white">{selectedVerdelerForAccessCode.distributor_id} - {selectedVerdelerForAccessCode.kast_naam || 'Naamloos'}</p>
                  <p className="text-sm text-gray-400">Project: {projectData.project_number}</p>
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
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Precies 5 cijfers (0-9)</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Verloopt op <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newAccessCode.expiresAt}
                    onChange={(e) => setNewAccessCode({ ...newAccessCode, expiresAt: e.target.value })}
                    required
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
                    className="rounded border-gray-600 bg-[#2A303C] text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-400">
                    Code is actief
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setIsAccessCodeModalOpen(false);
                    setSelectedVerdelerForAccessCode(null);
                  }}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleCreateAccessCode}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Key size={16} />
                  <span>Aanmaken</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default VerdelersStep;