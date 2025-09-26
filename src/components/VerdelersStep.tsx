import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Eye, CheckSquare, Printer, Key, Copy, Clock, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import VerdelerTesting from './VerdelerTesting';
import FATTest from './FATTest';
import HighVoltageTest from './HighVoltageTest';
import OnSiteTest from './OnSiteTest';
import PrintLabel from './PrintLabel';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '../lib/supabase';
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
  const [verdelers, setVerdelers] = useState<any[]>(projectData.distributors || []);
  const [showVerdelerForm, setShowVerdelerForm] = useState(false);
  const [editingVerdeler, setEditingVerdeler] = useState<any>(null);
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
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
    freqInHz: '',
    typeNrHs: '',
    fabrikant: '',
    profilePhoto: null as File | null,
    status: 'In productie',
  });

  useEffect(() => {
    // Generate unique distributor ID when form opens
    if (showVerdelerForm && !editingVerdeler) {
      generateDistributorId();
    }
  }, [showVerdelerForm, editingVerdeler]);

  useEffect(() => {
    // Load access codes when project data is available
    if (projectData?.id) {
      loadAccessCodes();
    }
  }, [projectData]);

  const loadAccessCodes = async () => {
    if (!projectData?.id) return;
    
    try {
      const codes = await dataService.getAccessCodes();
      // Filter codes for this project
      const projectCodes = codes.filter((code: any) => 
        code.project_number === projectData.project_number
      );
      setAccessCodes(projectCodes);
    } catch (error) {
      console.error('Error loading access codes:', error);
      // Don't show error toast as this is not critical
    }
  };

  const generateDistributorId = () => {
    // Generate a unique 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `VD${randomNum}`;
    
    // Check if this ID already exists in current verdelers
    const exists = verdelers.some(v => v.distributorId === newId);
    if (exists) {
      // If it exists, try again
      generateDistributorId();
    } else {
      setVerdelerData(prev => ({ ...prev, distributorId: newId }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setVerdelerData({ ...verdelerData, [field]: value });
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVerdelerData({ ...verdelerData, profilePhoto: e.target.files[0] });
    }
  };

  const handleSaveVerdeler = async () => {
    if (!verdelerData.distributorId || !verdelerData.kastNaam) {
      toast.error('Vul alle verplichte velden in!');
      return;
    }

    // Check for duplicate distributor ID (excluding current editing verdeler)
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
      
      // Handle profile photo
      if (verdelerData.profilePhoto) {
        const reader = new FileReader();
        profilePhotoUrl = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(verdelerData.profilePhoto!);
        });
      } else if (editingVerdeler?.profilePhoto) {
        profilePhotoUrl = editingVerdeler.profilePhoto;
      }

      const verdelerToSave = {
        ...verdelerData,
        profilePhoto: profilePhotoUrl,
        id: editingVerdeler?.id || uuidv4(),
        createdAt: editingVerdeler?.createdAt || new Date().toISOString(),
      };

      let updatedVerdelers;
      if (editingVerdeler) {
        // Update existing verdeler
        updatedVerdelers = verdelers.map(v => 
          v.id === editingVerdeler.id ? verdelerToSave : v
        );
        toast.success('Verdeler bijgewerkt!');
      } else {
        // Add new verdeler
        updatedVerdelers = [...verdelers, verdelerToSave];
        toast.success('Verdeler toegevoegd!');
      }

      setVerdelers(updatedVerdelers);
      onVerdelersChange(updatedVerdelers);
      
      // Reset form
      setShowVerdelerForm(false);
      setEditingVerdeler(null);
      setVerdelerData({
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
        freqInHz: '',
        typeNrHs: '',
        fabrikant: '',
        profilePhoto: null,
        status: 'In productie',
      });
    } catch (error) {
      console.error('Error saving verdeler:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de verdeler');
    }
  };

  const handleEditVerdeler = (verdeler: any) => {
    setEditingVerdeler(verdeler);
    setVerdelerData({
      distributorId: verdeler.distributorId,
      kastNaam: verdeler.kastNaam,
      systeem: verdeler.systeem,
      voeding: verdeler.voeding,
      bouwjaar: verdeler.bouwjaar,
      keuringDatum: verdeler.keuringDatum,
      getestDoor: verdeler.getestDoor,
      unInV: verdeler.unInV,
      inInA: verdeler.inInA,
      ikThInKA1s: verdeler.ikThInKA1s,
      ikDynInKA: verdeler.ikDynInKA,
      freqInHz: verdeler.freqInHz,
      typeNrHs: verdeler.typeNrHs,
      fabrikant: verdeler.fabrikant,
      profilePhoto: null, // Will be handled separately
      status: verdeler.status,
    });
    setShowVerdelerForm(true);
  };

  const handleDeleteVerdeler = (verdelerId: string) => {
    if (window.confirm('Weet je zeker dat je deze verdeler wilt verwijderen?')) {
      const updatedVerdelers = verdelers.filter(v => v.id !== verdelerId);
      setVerdelers(updatedVerdelers);
      onVerdelersChange(updatedVerdelers);
      toast.success('Verdeler verwijderd!');
    }
  };

  const handleCancelForm = () => {
    setShowVerdelerForm(false);
    setEditingVerdeler(null);
    setVerdelerData({
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
      freqInHz: '',
      typeNrHs: '',
      fabrikant: '',
      profilePhoto: null,
      status: 'In productie',
    });
  };

  const handleTestComplete = (verdeler: any, testData: any) => {
    console.log('Test completed for verdeler:', verdeler.distributorId, 'with data:', testData);
    // Test data is automatically saved to localStorage by the test components
  };

  const getTestStatus = (verdeler: any) => {
    const verdelerTestData = localStorage.getItem(`verdeler_test_${verdeler.distributorId}`);
    const fatTestData = localStorage.getItem(`fat_test_${verdeler.distributorId}`);
    const hvTestData = localStorage.getItem(`hv_test_${verdeler.distributorId}`);
    const onsiteTestData = localStorage.getItem(`onsite_test_${verdeler.distributorId}`);
    
    let status = 'Niet getest';
    let color = 'bg-gray-500/20 text-gray-400';
    
    try {
      if (verdelerTestData) {
        const testData = JSON.parse(verdelerTestData);
        if (testData.inspectionReport?.completed) {
          if (testData.inspectionReport.result === 'approved') {
            status = 'Goedgekeurd';
            color = 'bg-green-500/20 text-green-400';
          } else if (testData.inspectionReport.result === 'conditionallyApproved') {
            status = 'Voorwaardelijk';
            color = 'bg-yellow-500/20 text-yellow-400';
          } else if (testData.inspectionReport.result === 'rejected') {
            status = 'Afgekeurd';
            color = 'bg-red-500/20 text-red-400';
          }
        } else if (testData.workshopChecklist?.completed) {
          status = 'Checklist Voltooid';
          color = 'bg-blue-500/20 text-blue-400';
        }
      }
      
      if (fatTestData) {
        const fatData = JSON.parse(fatTestData);
        if (fatData.factoryTest?.completed) {
          status = 'FAT Voltooid';
          color = 'bg-yellow-500/20 text-yellow-400';
        }
      }
      
      if (hvTestData) {
        const hvData = JSON.parse(hvTestData);
        if (hvData.highVoltageTest?.completed) {
          status = 'HV Test Voltooid';
          color = 'bg-orange-500/20 text-orange-400';
        }
      }
    } catch (error) {
      console.error('Error parsing test data:', error);
    }
    
    return { status, color };
  };

  const getVerdelerAccessCodes = (verdelerId: string) => {
    return accessCodes.filter(code => code.verdeler_id === verdelerId);
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const isUsageLimitReached = (usageCount: number, maxUses: number | null) => {
    return maxUses !== null && usageCount >= maxUses;
  };

  const isCodeValid = (code: any) => {
    return code.is_active && !isExpired(code.expires_at) && !isUsageLimitReached(code.usage_count, code.max_uses);
  };

  const handleNext = () => {
    if (verdelers.length === 0) {
      toast.error('Voeg tenminste één verdeler toe voordat je verder gaat!');
      return;
    }
    if (onNext) onNext();
  };

  return (
    <div className="space-y-6">
      {!hideNavigation && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">Verdelers</h2>
          <p className="text-gray-400">Voeg verdelers toe aan dit project</p>
        </div>
      )}

      {/* Add Verdeler Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-400">
          Project Verdelers ({verdelers.length})
        </h3>
        <button
          onClick={() => setShowVerdelerForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Verdeler toevoegen</span>
        </button>
      </div>

      {/* Verdelers List */}
      {verdelers.length > 0 ? (
        <div className="space-y-4">
          {verdelers.map((verdeler) => {
            const testStatus = getTestStatus(verdeler);
            const verdelerCodes = getVerdelerAccessCodes(verdeler.distributorId);
            const activeCodes = verdelerCodes.filter(isCodeValid);
            
            return (
              <div key={verdeler.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Profile Photo */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#2A303C] flex items-center justify-center flex-shrink-0">
                      {verdeler.profilePhoto ? (
                        <img
                          src={verdeler.profilePhoto}
                          alt={verdeler.kastNaam}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs text-center">
                          Geen<br />foto
                        </div>
                      )}
                    </div>

                    {/* Verdeler Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-green-400">
                          {verdeler.distributorId}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-sm ${testStatus.color}`}>
                          {testStatus.status}
                        </span>
                        {activeCodes.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Key size={14} className="text-blue-400" />
                            <span className="text-xs text-blue-400">
                              {activeCodes.length} actieve code{activeCodes.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-white font-medium mb-2">
                        {verdeler.kastNaam || 'Naamloos'}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Systeem:</span>
                          <p className="text-white">{verdeler.systeem || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Voeding:</span>
                          <p className="text-white">{verdeler.voeding || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Spanning:</span>
                          <p className="text-white">{verdeler.unInV ? `${verdeler.unInV}V` : '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Stroom:</span>
                          <p className="text-white">{verdeler.inInA ? `${verdeler.inInA}A` : '-'}</p>
                        </div>
                      </div>

                      {/* Access Codes Display */}
                      {verdelerCodes.length > 0 && (
                        <div className="mt-4 p-3 bg-[#2A303C]/50 rounded-lg">
                          <h5 className="text-sm font-medium text-blue-400 mb-2">Toegangscodes</h5>
                          <div className="space-y-2">
                            {verdelerCodes.slice(0, 3).map((code) => (
                              <div key={code.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono">{code.code}</span>
                                  <div className="flex items-center space-x-1">
                                    {isCodeValid(code) ? (
                                      <CheckCircle size={12} className="text-green-400" />
                                    ) : (
                                      <XCircle size={12} className="text-red-400" />
                                    )}
                                    <span className={isCodeValid(code) ? 'text-green-400' : 'text-red-400'}>
                                      {isCodeValid(code) ? 'Actief' : 'Inactief'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock size={12} className="text-gray-400" />
                                  <span className="text-gray-400">
                                    {new Date(code.expires_at).toLocaleDateString('nl-NL')}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {verdelerCodes.length > 3 && (
                              <p className="text-xs text-gray-400">
                                +{verdelerCodes.length - 3} meer...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleEditVerdeler(verdeler)}
                      className="btn-secondary flex items-center space-x-2 text-sm"
                      title="Bewerken"
                    >
                      <Eye size={16} />
                      <span>Info</span>
                    </button>
                    
                    <button
                      onClick={() => handleEditVerdeler(verdeler)}
                      className="btn-secondary flex items-center space-x-2 text-sm"
                      title="Bewerken"
                    >
                      <Eye size={16} />
                      <span>Bewerken</span>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteVerdeler(verdeler.id)}
                      className="btn-secondary flex items-center space-x-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      title="Verwijderen"
                    >
                      <Trash2 size={16} />
                      <span>Verwijderen</span>
                    </button>

                    {/* Testing Buttons */}
                    <div className="pt-2 border-t border-gray-700 space-y-2">
                      <VerdelerTesting
                        verdeler={verdeler}
                        projectNumber={projectData.project_number || projectData.projectNumber}
                        onComplete={(testData) => handleTestComplete(verdeler, testData)}
                        projectId={projectData.id}
                        distributorId={verdeler.id}
                      />
                      
                      <FATTest
                        verdeler={verdeler}
                        projectNumber={projectData.project_number || projectData.projectNumber}
                        onComplete={(testData) => handleTestComplete(verdeler, testData)}
                      />
                      
                      <HighVoltageTest
                        verdeler={verdeler}
                        projectNumber={projectData.project_number || projectData.projectNumber}
                        onComplete={(testData) => handleTestComplete(verdeler, testData)}
                      />
                      
                      <OnSiteTest
                        verdeler={verdeler}
                        projectNumber={projectData.project_number || projectData.projectNumber}
                        onComplete={(testData) => handleTestComplete(verdeler, testData)}
                      />
                      
                      <PrintLabel
                        verdeler={verdeler}
                        projectNumber={projectData.project_number || projectData.projectNumber}
                        logo={ewpLogo}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-8 text-center">
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
                onClick={() => setShowVerdelerForm(true)}
                className="btn-primary"
              >
                Eerste verdeler toevoegen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verdeler Form Modal */}
      {showVerdelerForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Basis Informatie</h3>
                  
                  <div className="space-y-4">
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
                      <p className="text-xs text-gray-500 mt-1">
                        Unieke identificatie voor deze verdeler
                      </p>
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
                      <label className="block text-sm text-gray-400 mb-2">Status</label>
                      <select
                        className="input-field"
                        value={verdelerData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="In productie">In productie</option>
                        <option value="Testen">Testen</option>
                        <option value="Gereed">Gereed</option>
                        <option value="Opgeleverd">Opgeleverd</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Profiel foto</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="input-field"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optioneel: Upload een foto van de verdeler
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">Technische Specificaties</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Systeem</label>
                      <input
                        type="text"
                        className="input-field"
                        value={verdelerData.systeem}
                        onChange={(e) => handleInputChange('systeem', e.target.value)}
                        placeholder="400V TN-S"
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
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Keuring datum</label>
                      <input
                        type="date"
                        className="input-field"
                        value={verdelerData.keuringDatum}
                        onChange={(e) => handleInputChange('keuringDatum', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Getest door</label>
                      <input
                        type="text"
                        className="input-field"
                        value={verdelerData.getestDoor}
                        onChange={(e) => handleInputChange('getestDoor', e.target.value)}
                        placeholder="Naam tester"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Un in V</label>
                      <input
                        type="text"
                        className="input-field"
                        value={verdelerData.unInV}
                        onChange={(e) => handleInputChange('unInV', e.target.value)}
                        placeholder="400"
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
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Fabrikant</label>
                      <input
                        type="text"
                        className="input-field"
                        value={verdelerData.fabrikant}
                        onChange={(e) => handleInputChange('fabrikant', e.target.value)}
                        placeholder="Schneider Electric"
                      />
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
                onClick={handleSaveVerdeler}
                className="btn-primary"
              >
                {editingVerdeler ? 'Verdeler bijwerken' : 'Verdeler toevoegen'}
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
            onClick={handleNext}
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