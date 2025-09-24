import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Edit, Save, X, Upload, Key, Printer, CheckSquare, Server, Eye, Info, Download, Copy } from 'lucide-react';
import VerdelerTesting from './VerdelerTesting';
import FATTest from './FATTest';
import HighVoltageTest from './HighVoltageTest';
import OnSiteTest from './OnSiteTest';
import PrintLabel from './PrintLabel';
import { dataService } from '../lib/supabase';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
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
  const { hasPermission } = useEnhancedPermissions();
  const [verdelers, setVerdelers] = useState<any[]>([]);
  const [showVerdelerForm, setShowVerdelerForm] = useState(false);
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
          <div className="bg-[#2A303C] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
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
                      <td className="p-4 text-white">{verdeler.kast_naam || verdeler.kastNaam || '-'}</td>
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
                            : '-'}
                        </span>
                      </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1E2530] rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
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

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Verdeler ID</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.distributor_id || verdelerData.distributorId || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, distributor_id: e.target.value, distributorId: e.target.value })}
                    placeholder="VD1234"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Kastnaam</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.kast_naam || verdelerData.kastNaam || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, kast_naam: e.target.value, kastNaam: e.target.value })}
                    placeholder="Hoofdverdeler A"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Systeem</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.systeem || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, systeem: e.target.value })}
                    placeholder="400V TN-S"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Voeding</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.voeding || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, voeding: e.target.value })}
                    placeholder="3x400V + N + PE"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bouwjaar</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.bouwjaar || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, bouwjaar: e.target.value })}
                    placeholder="2025"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Keuring datum</label>
                  <input
                    type="date"
                    className="input-field"
                    value={verdelerData.keuringDatum || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, keuringDatum: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Getest door</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.getestDoor || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, getestDoor: e.target.value })}
                    placeholder="Naam tester"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Un in V</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.unInV || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, unInV: e.target.value })}
                    placeholder="400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">In in A</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.inInA || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, inInA: e.target.value })}
                    placeholder="400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ik Th in KA 1s</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.ikThInKA1s || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, ikThInKA1s: e.target.value })}
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ik Dyn in KA</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.ikDynInKA || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, ikDynInKA: e.target.value })}
                    placeholder="65"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Freq. in Hz</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.freqInHz || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, freqInHz: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type nr. HS</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.typeNrHs || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, typeNrHs: e.target.value })}
                    placeholder="NS400N"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fabrikant</label>
                  <input
                    type="text"
                    className="input-field"
                    value={verdelerData.fabrikant || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, fabrikant: e.target.value })}
                    placeholder="Schneider Electric"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    className="input-field"
                    value={verdelerData.status || ''}
                    onChange={(e) => setVerdelerData({ ...verdelerData, status: e.target.value })}
                  >
                    <option value="In productie">In productie</option>
                    <option value="Testen">Testen</option>
                    <option value="Gereed">Gereed</option>
                    <option value="Opgeleverd">Opgeleverd</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Profiel foto</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input-field"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setVerdelerData({ ...verdelerData, profilePhoto: e.target.files[0] });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowVerdelerForm(false)}
                  className="btn-secondary"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveVerdeler}
                  className="btn-primary"
                >
                  {editingVerdeler ? 'Bijwerken' : 'Opslaan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Access Code Form Modal */}
        {showAccessCodeForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1E2530] rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Toegangscode aanmaken</h2>
                <button
                  onClick={() => setShowAccessCodeForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Verdeler</label>
                  <input
                    type="text"
                    className="input-field"
                    value={`${selectedVerdelerForCode?.distributor_id || selectedVerdelerForCode?.distributorId} - ${selectedVerdelerForCode?.kast_naam || selectedVerdelerForCode?.kastNaam}`}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Toegangscode (5 cijfers)</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="input-field flex-1"
                      value={newAccessCode.code}
                      onChange={(e) => setNewAccessCode({ ...newAccessCode, code: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                      placeholder="12345"
                      maxLength={5}
                    />
                    <button
                      onClick={() => setNewAccessCode({ ...newAccessCode, code: generateRandomCode() })}
                      className="btn-secondary px-3"
                      title="Genereer nieuwe code"
                    >
                      🎲
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Vervaldatum</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newAccessCode.expiresAt}
                    onChange={(e) => setNewAccessCode({ ...newAccessCode, expiresAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max aantal keer gebruiken (optioneel)</label>
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
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-400">Actief</label>
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
                  disabled={generatingCode}
                  className="btn-primary"
                >
                  {generatingCode ? 'Aanmaken...' : 'Aanmaken'}
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