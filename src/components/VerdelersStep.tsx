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
                        <span className="text-white">{selectedVerdeler.ikThInKA1s || '-