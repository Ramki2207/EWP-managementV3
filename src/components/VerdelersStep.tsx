import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileEdit as Edit, Save, X, Upload, Server, Eye, CheckSquare, Printer, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import VerdelerTesting from './VerdelerTesting';
import FATTest from './FATTest';
import HighVoltageTest from './HighVoltageTest';
import OnSiteTest from './OnSiteTest';
import PrintLabel from './PrintLabel';
import { dataService } from '../lib/supabase';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
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
  const { hasPermission } = useEnhancedPermissions();
  const [verdelers, setVerdelers] = useState<any[]>([]);
  const [showVerdelerForm, setShowVerdelerForm] = useState(false);
  const [editingVerdeler, setEditingVerdeler] = useState<any>(null);
  const [showVerdelerDetails, setShowVerdelerDetails] = useState<any>(null);
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
    status: 'In productie'
  });

  useEffect(() => {
    if (projectData?.distributors) {
      setVerdelers(projectData.distributors);
    } else if (projectData?.id) {
      // Load distributors for existing project
      loadDistributors();
    }
  }, [projectData]);

  const loadDistributors = async () => {
    if (!projectData?.id) return;
    
    try {
      const data = await dataService.getDistributorsByProject(projectData.id);
      setVerdelers(data || []);
      onVerdelersChange(data || []);
    } catch (error) {
      console.error('Error loading distributors:', error);
      toast.error('Er is een fout opgetreden bij het laden van de verdelers');
    }
  };

  const generateDistributorId = () => {
    const existingIds = verdelers.map(v => v.distributorId || v.distributor_id);
    let newId;
    let counter = 1;
    
    do {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      newId = `VD${randomNum}`;
      counter++;
    } while (existingIds.includes(newId) && counter < 100);
    
    return newId;
  };

  const handleAddVerdeler = () => {
    if (!hasPermission('verdelers', 'create')) {
      toast.error('Je hebt geen toestemming om verdelers aan te maken');
      return;
    }
    
    setVerdelerData({
      distributorId: generateDistributorId(),
      kastNaam: '',
      systeem: '',
      voeding: '',
      bouwjaar: new Date().getFullYear().toString(),
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
      status: 'In productie'
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
      distributorId: verdeler.distributorId || verdeler.distributor_id,
      kastNaam: verdeler.kastNaam || verdeler.kast_naam || '',
      systeem: verdeler.systeem || '',
      voeding: verdeler.voeding || '',
      bouwjaar: verdeler.bouwjaar || '',
      keuringDatum: verdeler.keuringDatum || verdeler.keuring_datum || new Date().toISOString().split('T')[0],
      getestDoor: verdeler.getestDoor || verdeler.getest_door || '',
      unInV: verdeler.unInV || verdeler.un_in_v || '',
      inInA: verdeler.inInA || verdeler.in_in_a || '',
      ikThInKA1s: verdeler.ikThInKA1s || verdeler.ik_th_in_ka1s || '',
      ikDynInKA: verdeler.ikDynInKA || verdeler.ik_dyn_in_ka || '',
      freqInHz: verdeler.freqInHz || verdeler.freq_in_hz || '',
      typeNrHs: verdeler.typeNrHs || verdeler.type_nr_hs || '',
      fabrikant: verdeler.fabrikant || '',
      profilePhoto: null,
      status: verdeler.status || 'In productie'
    });
    setEditingVerdeler(verdeler);
    setShowVerdelerForm(true);
  };

  const handleSaveVerdeler = async () => {
    if (!verdelerData.distributorId || !verdelerData.kastNaam) {
      toast.error('Vul tenminste de verdeler ID en kastnaam in!');
      return;
    }

    try {
      let profilePhotoUrl = '';
      
      // Handle profile photo upload
      if (verdelerData.profilePhoto) {
        const reader = new FileReader();
        reader.onloadend = () => {
          profilePhotoUrl = reader.result as string;
          saveVerdelerData(profilePhotoUrl);
        };
        reader.readAsDataURL(verdelerData.profilePhoto);
      } else {
        saveVerdelerData(profilePhotoUrl);
      }
    } catch (error) {
      console.error('Error saving verdeler:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de verdeler');
    }
  };

  const saveVerdelerData = async (profilePhotoUrl: string) => {
    const verdelerToSave = {
      id: editingVerdeler?.id || uuidv4(),
      distributorId: verdelerData.distributorId,
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
      profilePhoto: profilePhotoUrl || editingVerdeler?.profilePhoto || editingVerdeler?.profile_photo || '',
      status: verdelerData.status,
      projectId: projectData?.id,
      projectnummer: projectData?.project_number || projectData?.projectNumber,
      createdAt: editingVerdeler?.createdAt || editingVerdeler?.created_at || new Date().toISOString()
    };

    if (projectData?.id) {
      // For existing projects, save to database
      try {
        if (editingVerdeler) {
          await dataService.updateDistributor(editingVerdeler.id, verdelerToSave);
          toast.success('Verdeler bijgewerkt!');
        } else {
          await dataService.createDistributor(verdelerToSave);
          toast.success('Verdeler toegevoegd!');
        }
        await loadDistributors();
      } catch (error) {
        console.error('Error saving to database:', error);
        toast.error('Er is een fout opgetreden bij het opslaan naar de database');
        return;
      }
    } else {
      // For new projects, update local state
      let updatedVerdelers;
      if (editingVerdeler) {
        updatedVerdelers = verdelers.map(v => 
          (v.id === editingVerdeler.id || v.distributorId === editingVerdeler.distributorId) 
            ? verdelerToSave 
            : v
        );
        toast.success('Verdeler bijgewerkt!');
      } else {
        updatedVerdelers = [...verdelers, verdelerToSave];
        toast.success('Verdeler toegevoegd!');
      }
      
      setVerdelers(updatedVerdelers);
      onVerdelersChange(updatedVerdelers);
    }

    setShowVerdelerForm(false);
    setEditingVerdeler(null);
  };

  const handleDeleteVerdeler = async (verdeler: any) => {
    if (!hasPermission('verdelers', 'delete')) {
      toast.error('Je hebt geen toestemming om verdelers te verwijderen');
      return;
    }
    
    if (window.confirm(`Weet je zeker dat je verdeler ${verdeler.distributorId || verdeler.distributor_id} wilt verwijderen?`)) {
      try {
        if (projectData?.id && verdeler.id) {
          // For existing projects, delete from database
          await dataService.deleteDistributor(verdeler.id);
          await loadDistributors();
        } else {
          // For new projects, remove from local state
          const updatedVerdelers = verdelers.filter(v => 
            v.id !== verdeler.id && v.distributorId !== verdeler.distributorId
          );
          setVerdelers(updatedVerdelers);
          onVerdelersChange(updatedVerdelers);
        }
        toast.success('Verdeler verwijderd!');
      } catch (error) {
        console.error('Error deleting verdeler:', error);
        toast.error('Er is een fout opgetreden bij het verwijderen van de verdeler');
      }
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
      status: 'In productie'
    });
  };

  const handleTestComplete = (verdelerIndex: number, testData: any) => {
    // Handle test completion - this could save test data to localStorage or database
    console.log('Test completed for verdeler:', verdelerIndex, testData);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in productie':
        return 'bg-blue-500/20 text-blue-400';
      case 'testen':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'gereed':
        return 'bg-green-500/20 text-green-400';
      case 'opgeleverd':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleVerdelerClick = (verdeler: any) => {
    setShowVerdelerDetails(verdeler);
  };

  return (
    <div className="space-y-6">
      {!hideNavigation && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">Verdelers</h2>
          <p className="text-gray-400">Beheer de verdelers voor dit project</p>
        </div>
      )}

      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-blue-400">
            {hideNavigation ? 'Verdelers' : 'Project Verdelers'}
          </h3>
          <p className="text-gray-400 text-sm">
            {hideNavigation ? 'Beheer de verdelers voor dit project' : 'Voeg verdelers toe aan dit project'}
          </p>
        </div>
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
        <div className="card p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="table-header text-left">Verdeler ID</th>
                  <th className="table-header text-left">Kastnaam</th>
                  <th className="table-header text-left">Systeem</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Toegangscodes</th>
                  <th className="table-header text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {verdelers.filter(Boolean).map((verdeler) => (
                  <tr 
                    key={verdeler.id || verdeler.distributorId} 
                    className="table-row cursor-pointer"
                    onClick={() => handleVerdelerClick(verdeler)}
                  >
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="font-medium text-green-400">
                          {verdeler.distributorId || verdeler.distributor_id}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">
                      {verdeler.kastNaam || verdeler.kast_naam || '-'}
                    </td>
                    <td className="py-4 text-gray-300">
                      {verdeler.systeem || '-'}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(verdeler.status)}`}>
                        {verdeler.status || 'In productie'}
                      </span>
                    </td>
                    <td className="py-4 text-gray-300">
                      <span className="text-sm">Geen codes</span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerdelerClick(verdeler);
                          }}
                          className="p-2 bg-[#2A303C] hover:bg-blue-500/20 rounded-lg transition-colors group"
                          title="Info"
                        >
                          <Eye size={16} className="text-gray-400 group-hover:text-blue-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditVerdeler(verdeler);
                          }}
                          className="p-2 bg-[#2A303C] hover:bg-green-500/20 rounded-lg transition-colors group"
                          title="Bewerken"
                        >
                          <Edit size={16} className="text-gray-400 group-hover:text-green-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteVerdeler(verdeler);
                          }}
                          className="p-2 bg-[#2A303C] hover:bg-red-500/20 rounded-lg transition-colors group"
                          title="Verwijderen"
                        >
                          <Trash2 size={16} className="text-gray-400 group-hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Server size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">Nog geen verdelers toegevoegd</p>
          <p className="text-gray-500 text-sm mt-2">Klik op "Verdeler toevoegen" om te beginnen</p>
        </div>
      )}

      {/* Verdeler Details Modal */}
      {showVerdelerDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-blue-400">
                {showVerdelerDetails.distributorId || showVerdelerDetails.distributor_id} - {showVerdelerDetails.kastNaam || showVerdelerDetails.kast_naam}
              </h2>
              <button
                onClick={() => setShowVerdelerDetails(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="text-sm text-gray-400 mb-6">Verdeler details en acties</div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                <div className="bg-[#2A303C] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Basis Informatie</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Verdeler ID:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.distributorId || showVerdelerDetails.distributor_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Kastnaam:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.kastNaam || showVerdelerDetails.kast_naam || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Systeem:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.systeem || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Voeding:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.voeding || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(showVerdelerDetails.status)}`}>
                        {showVerdelerDetails.status || 'In productie'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Technical Specs */}
              <div className="space-y-6">
                <div className="bg-[#2A303C] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">Technische Specs</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Un in V:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.unInV || showVerdelerDetails.un_in_v || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">In in A:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.inInA || showVerdelerDetails.in_in_a || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Freq. in Hz:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.freqInHz || showVerdelerDetails.freq_in_hz || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ik Th in KA 1s:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.ikThInKA1s || showVerdelerDetails.ik_th_in_ka1s || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ik Dyn in KA:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.ikDynInKA || showVerdelerDetails.ik_dyn_in_ka || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type nr. HS:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.typeNrHs || showVerdelerDetails.type_nr_hs || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fabrikant:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.fabrikant || 'Phoenix Contact'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bouwjaar:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.bouwjaar || '2025'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Getest door:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.getestDoor || showVerdelerDetails.getest_door || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Keuring datum:</span>
                      <span className="text-white font-medium">
                        {showVerdelerDetails.keuringDatum || showVerdelerDetails.keuring_datum 
                          ? new Date(showVerdelerDetails.keuringDatum || showVerdelerDetails.keuring_datum).toLocaleDateString('nl-NL')
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">Acties</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {projectData?.id && (
                  <>
                    <VerdelerTesting
                      verdeler={showVerdelerDetails}
                      projectNumber={projectData.project_number}
                      onComplete={(testData) => handleTestComplete(0, testData)}
                      projectId={projectData.id}
                      distributorId={showVerdelerDetails.id}
                    />
                    <FATTest
                      verdeler={showVerdelerDetails}
                      projectNumber={projectData.project_number}
                      onComplete={(testData) => handleTestComplete(0, testData)}
                    />
                    <HighVoltageTest
                      verdeler={showVerdelerDetails}
                      projectNumber={projectData.project_number}
                      onComplete={(testData) => handleTestComplete(0, testData)}
                    />
                    <OnSiteTest
                      verdeler={showVerdelerDetails}
                      projectNumber={projectData.project_number}
                      onComplete={(testData) => handleTestComplete(0, testData)}
                    />
                    <button
                      className="btn-secondary flex items-center space-x-2"
                      title="Toegangscode"
                    >
                      <Key size={16} />
                      <span>Toegangscode</span>
                    </button>
                    <PrintLabel
                      verdeler={showVerdelerDetails}
                      projectNumber={projectData.project_number}
                      logo={ewpLogo}
                    />
                  </>
                )}
                <button
                  onClick={() => {
                    setShowVerdelerDetails(null);
                    handleEditVerdeler(showVerdelerDetails);
                  }}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit size={16} />
                  <span>Bewerken</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verdeler Form Modal */}
      {showVerdelerForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-4">Basis Informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="input-field"
                      value={verdelerData.status}
                      onChange={(e) => setVerdelerData({ ...verdelerData, status: e.target.value })}
                    >
                      <option value="In productie">In productie</option>
                      <option value="Testen">Testen</option>
                      <option value="Gereed">Gereed</option>
                      <option value="Opgeleverd">Opgeleverd</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-4">Technische Specificaties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Keuring datum</label>
                    <input
                      type="date"
                      className="input-field"
                      value={verdelerData.keuringDatum}
                      onChange={(e) => setVerdelerData({ ...verdelerData, keuringDatum: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Getest door</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.getestDoor}
                      onChange={(e) => setVerdelerData({ ...verdelerData, getestDoor: e.target.value })}
                      placeholder="Naam tester"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Un in V</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.unInV}
                      onChange={(e) => setVerdelerData({ ...verdelerData, unInV: e.target.value })}
                      placeholder="400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">In in A</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.inInA}
                      onChange={(e) => setVerdelerData({ ...verdelerData, inInA: e.target.value })}
                      placeholder="400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ik Th in KA 1s</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.ikThInKA1s}
                      onChange={(e) => setVerdelerData({ ...verdelerData, ikThInKA1s: e.target.value })}
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ik Dyn in KA</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.ikDynInKA}
                      onChange={(e) => setVerdelerData({ ...verdelerData, ikDynInKA: e.target.value })}
                      placeholder="65"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Freq. in Hz</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.freqInHz}
                      onChange={(e) => setVerdelerData({ ...verdelerData, freqInHz: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Type nr. HS</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.typeNrHs}
                      onChange={(e) => setVerdelerData({ ...verdelerData, typeNrHs: e.target.value })}
                      placeholder="NS400N"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Fabrikant</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.fabrikant}
                      onChange={(e) => setVerdelerData({ ...verdelerData, fabrikant: e.target.value })}
                      placeholder="Schneider Electric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Profielfoto</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setVerdelerData({ ...verdelerData, profilePhoto: e.target.files[0] });
                        }
                      }}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            {projectData?.id && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-orange-400 mb-4">Acties</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <VerdelerTesting
                    verdeler={showVerdelerDetails}
                    projectNumber={projectData.project_number}
                    onComplete={(testData) => handleTestComplete(0, testData)}
                    projectId={projectData.id}
                    distributorId={showVerdelerDetails.id}
                  />
                  <FATTest
                    verdeler={showVerdelerDetails}
                    projectNumber={projectData.project_number}
                    onComplete={(testData) => handleTestComplete(0, testData)}
                  />
                  <HighVoltageTest
                    verdeler={showVerdelerDetails}
                    projectNumber={projectData.project_number}
                    onComplete={(testData) => handleTestComplete(0, testData)}
                  />
                  <OnSiteTest
                    verdeler={showVerdelerDetails}
                    projectNumber={projectData.project_number}
                    onComplete={(testData) => handleTestComplete(0, testData)}
                  />
                  <button
                    className="btn-secondary flex items-center space-x-2"
                    title="Toegangscode"
                  >
                    <Key size={16} />
                    <span>Toegangscode</span>
                  </button>
                  <PrintLabel
                    verdeler={showVerdelerDetails}
                    projectNumber={projectData.project_number}
                    logo={ewpLogo}
                  />
                  <button
                    onClick={() => {
                      setShowVerdelerDetails(null);
                      handleEditVerdeler(showVerdelerDetails);
                    }}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Edit size={16} />
                    <span>Bewerken</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Verdeler Form Modal */}
      {showVerdelerForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-4">Basis Informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="input-field"
                      value={verdelerData.status}
                      onChange={(e) => setVerdelerData({ ...verdelerData, status: e.target.value })}
                    >
                      <option value="In productie">In productie</option>
                      <option value="Testen">Testen</option>
                      <option value="Gereed">Gereed</option>
                      <option value="Opgeleverd">Opgeleverd</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-4">Technische Specificaties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Keuring datum</label>
                    <input
                      type="date"
                      className="input-field"
                      value={verdelerData.keuringDatum}
                      onChange={(e) => setVerdelerData({ ...verdelerData, keuringDatum: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Getest door</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.getestDoor}
                      onChange={(e) => setVerdelerData({ ...verdelerData, getestDoor: e.target.value })}
                      placeholder="Naam tester"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Un in V</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.unInV}
                      onChange={(e) => setVerdelerData({ ...verdelerData, unInV: e.target.value })}
                      placeholder="400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">In in A</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.inInA}
                      onChange={(e) => setVerdelerData({ ...verdelerData, inInA: e.target.value })}
                      placeholder="400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ik Th in KA 1s</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.ikThInKA1s}
                      onChange={(e) => setVerdelerData({ ...verdelerData, ikThInKA1s: e.target.value })}
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ik Dyn in KA</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.ikDynInKA}
                      onChange={(e) => setVerdelerData({ ...verdelerData, ikDynInKA: e.target.value })}
                      placeholder="65"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Freq. in Hz</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.freqInHz}
                      onChange={(e) => setVerdelerData({ ...verdelerData, freqInHz: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Type nr. HS</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.typeNrHs}
                      onChange={(e) => setVerdelerData({ ...verdelerData, typeNrHs: e.target.value })}
                      placeholder="NS400N"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Fabrikant</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.fabrikant}
                      onChange={(e) => setVerdelerData({ ...verdelerData, fabrikant: e.target.value })}
                      placeholder="Schneider Electric"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Profielfoto</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setVerdelerData({ ...verdelerData, profilePhoto: e.target.files[0] });
                        }
                      }}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
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
                  <span>Opslaan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {!hideNavigation && (
        <div className="flex justify-between pt-6 border-t border-gray-700">
          {onBack && (
            <button
              onClick={onBack}
              className="btn-secondary"
            >
              Vorige stap
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
      )}
    </div>
  );
};

export default VerdelersStep;