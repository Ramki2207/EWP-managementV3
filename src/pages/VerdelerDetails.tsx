import React, { useEffect, useState } from "react";
import { createRoot } from 'react-dom/client';
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, FileEdit as Edit, Save, X, Key, Copy, Clock, Upload, CheckSquare, FileText } from 'lucide-react';
import DocumentViewer from '../components/DocumentViewer';
import TestReportViewer from '../components/TestReportViewer';
import VerdelerDocumentManager from '../components/VerdelerDocumentManager';
import VerdelerPreTestingApproval from '../components/VerdelerPreTestingApproval';
import VerdelerChecklistWindow from '../components/VerdelerChecklistWindow';
import { openChecklistInNewWindow } from '../components/VerdelerChecklistPopup';
import VerdelerLeveringChecklist from '../components/VerdelerLeveringChecklist';
import { Toaster } from 'react-hot-toast';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';

const VerdelerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useEnhancedPermissions();

  const [distributor, setDistributor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'tests' | 'levering'>('details');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDistributor, setEditedDistributor] = useState<any>(null);
  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [newAccessCode, setNewAccessCode] = useState({
    code: '',
    expiresAt: '',
    maxUses: '',
    isActive: true
  });
  const [testData, setTestData] = useState<any>(null);
  const [showPreTestingApproval, setShowPreTestingApproval] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showTestingHoursModal, setShowTestingHoursModal] = useState(false);
  const [testingHours, setTestingHours] = useState('');
  const [testingHoursLogged, setTestingHoursLogged] = useState(false);
  const [showLeveringChecklist, setShowLeveringChecklist] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (id && currentUser) {
      loadDistributor();
      loadUsers();
    }
  }, [id, currentUser]);

  const loadCurrentUser = async () => {
    const userId = localStorage.getItem('currentUserId');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.id === userId);
    setCurrentUser(user);
  };

  useEffect(() => {
    if (distributor) {
      loadTestData();
      checkLeveringStatus();

      // Check for tab query parameter and switch to that tab
      const searchParams = new URLSearchParams(location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'levering' && distributor.status === 'Levering') {
        setActiveTab('levering');
      }
    }
  }, [distributor, currentUser, location.search]);

  const checkLeveringStatus = async () => {
    if (!distributor || distributor.status !== 'Levering') return;

    try {
      const { data: workEntries } = await dataService.supabase
        .from('work_entries')
        .select('*')
        .eq('distributor_id', distributor.id)
        .eq('worker_id', currentUser?.id)
        .ilike('notes', '%Test uren%');

      if (workEntries && workEntries.length > 0) {
        setTestingHoursLogged(true);
      }

      const { data: deliveryData } = await dataService.supabase
        .from('verdeler_deliveries')
        .select('*')
        .eq('distributor_id', distributor.id)
        .maybeSingle();

      if (deliveryData && deliveryData.completed_at) {
        setTestingHoursLogged(true);
      }
    } catch (error) {
      console.error('Error checking levering status:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // Load from localStorage first (primary source)
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(localUsers);
      
      // Try to sync with database in background
      try {
        const dbUsers = await dataService.getUsers();
        setUsers(dbUsers);
      } catch (dbError) {
        console.log('Database sync failed, using localStorage only:', dbError);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const getMontageUsersByLocation = (projectLocation?: string) => {
    console.log('🔍 VERDELER DETAILS: Getting montage users for location:', projectLocation);
    console.log('🔍 VERDELER DETAILS: Total users loaded:', users.length);
    
    if (!users || users.length === 0) {
      console.log('❌ VERDELER DETAILS: No users loaded yet');
      return { primary: [], other: [] };
    }
    
    // Filter users with 'montage' role
    const montageUsers = users.filter(user => {
      const isMontage = user.role === 'montage';
      console.log(`🔍 VERDELER DETAILS: User ${user.username} - role: ${user.role}, isMontage: ${isMontage}`);
      return isMontage;
    });
    
    console.log('🔍 VERDELER DETAILS: Found montage users:', montageUsers.length);
    
    if (!projectLocation) {
      return { primary: montageUsers, other: [] };
    }
    
    // Separate users by location
    const primary = montageUsers.filter(user => {
      const hasLocationAccess = !user.assignedLocations || 
                               user.assignedLocations.length === 0 || 
                               user.assignedLocations.length === AVAILABLE_LOCATIONS.length ||
                               user.assignedLocations.includes(projectLocation);
      console.log(`🔍 VERDELER DETAILS: User ${user.username} location access for ${projectLocation}:`, hasLocationAccess);
      return hasLocationAccess;
    });
    
    const other = montageUsers.filter(user => {
      const hasOtherLocationAccess = user.assignedLocations && 
                                    user.assignedLocations.length > 0 && 
                                    user.assignedLocations.length < AVAILABLE_LOCATIONS.length &&
                                    !user.assignedLocations.includes(projectLocation);
      return hasOtherLocationAccess;
    });
    
    console.log('🔍 VERDELER DETAILS: Primary users:', primary.length, 'Other users:', other.length);
    
    return { primary, other };
  };
  const loadDistributor = async () => {
    try {
      setLoading(true);
      const distributors = await dataService.getDistributors();
      const foundDistributor = distributors.find((d: any) => d.id === id);

      if (foundDistributor && currentUser?.role === 'logistiek' && foundDistributor.status !== 'Levering') {
        toast.error('Je hebt geen toegang tot deze verdeler');
        navigate('/verdelers');
        return;
      }

      setDistributor(foundDistributor || null);
      setEditedDistributor(foundDistributor || null);
    } catch (error) {
      console.error('Error loading distributor:', error);
      toast.error('Er is een fout opgetreden bij het laden van de verdeler');
    } finally {
      setLoading(false);
    }
  };

  const loadTestData = async () => {
    if (!distributor?.distributor_id) return;

    try {
      // Load test data from database
      const dbTestData = await dataService.getTestData(distributor.distributor_id);

      if (dbTestData && dbTestData.length > 0) {
        // Convert array of test records to object keyed by test_type
        const combinedTestData: any = {};

        dbTestData.forEach((record: any) => {
          if (record.test_type && record.data) {
            combinedTestData[record.test_type] = record.data;
          }
        });

        setTestData(combinedTestData);
        console.log('✅ VERDELER DETAILS: Loaded test data from database:', Object.keys(combinedTestData));
      } else {
        console.log('ℹ️ VERDELER DETAILS: No test data found in database');
        setTestData(null);
      }
    } catch (error) {
      console.error('Error loading test data:', error);
      setTestData(null);
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

  const getDefaultExpiryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  };

  const handleGenerateAccessCode = () => {
    if (!hasPermission('access_codes', 'create')) {
      toast.error('Je hebt geen toestemming om toegangscodes aan te maken');
      return;
    }
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

    // Validate that code is exactly 5 numbers
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
        verdeler_id: distributor.distributor_id, // Use the distributor_id (text like "VD8996")
        project_number: distributor.projects?.project_number || ''
      };

      await dataService.createAccessCode(accessCodeData);
      
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

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const syncTestingHoursToWeekstaat = async (workerId: string, date: string, hours: number, verdelerName: string, projectNumber: string) => {
    try {
      const workDate = new Date(date);
      const weekNumber = getWeekNumber(workDate);
      const year = workDate.getFullYear();
      const dayOfWeek = workDate.getDay();

      const dayMapping: { [key: number]: string } = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday'
      };

      const dayColumn = dayMapping[dayOfWeek];

      const { data: existingWeekstaat } = await dataService.supabase
        .from('weekstaten')
        .select('id')
        .eq('user_id', workerId)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .maybeSingle();

      let weekstaatId = existingWeekstaat?.id;

      if (!weekstaatId) {
        const { data: newWeekstaat, error: createError } = await dataService.supabase
          .from('weekstaten')
          .insert({
            user_id: workerId,
            week_number: weekNumber,
            year: year,
            status: 'draft'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        weekstaatId = newWeekstaat.id;
      }

      const activityCode = projectNumber;
      const activityDescription = `Test uren - ${verdelerName} - ${projectNumber}`;

      const { data: existingEntry } = await dataService.supabase
        .from('weekstaat_entries')
        .select('*')
        .eq('weekstaat_id', weekstaatId)
        .eq('activity_code', activityCode)
        .eq('activity_description', activityDescription)
        .maybeSingle();

      if (existingEntry) {
        const currentHours = parseFloat(existingEntry[dayColumn] || 0);
        const updateData = {
          [dayColumn]: currentHours + hours
        };

        const { error: updateError } = await dataService.supabase
          .from('weekstaat_entries')
          .update(updateData)
          .eq('id', existingEntry.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await dataService.supabase
          .from('weekstaat_entries')
          .insert({
            weekstaat_id: weekstaatId,
            activity_code: activityCode,
            activity_description: activityDescription,
            workorder_number: weekNumber.toString(),
            [dayColumn]: hours
          });

        if (insertError) throw insertError;
      }

      console.log('✅ Testing hours synced to weekstaat for', verdelerName);
    } catch (error) {
      console.error('Error syncing testing hours to weekstaat:', error);
      throw error;
    }
  };

  const handleTestingHoursSubmit = async () => {
    if (!testingHours || parseFloat(testingHours) <= 0) {
      toast.error('Voer geldige testuren in');
      return;
    }

    try {
      const hours = parseFloat(testingHours);
      const currentDate = new Date().toISOString().split('T')[0];
      const verdelerName = distributor.kast_naam || distributor.distributor_id || 'Onbekend';
      const projectNumber = distributor.projects?.project_number || 'Onbekend';

      await syncTestingHoursToWeekstaat(
        currentUser.id,
        currentDate,
        hours,
        verdelerName,
        projectNumber
      );

      await dataService.createWorkEntry({
        distributorId: distributor.id,
        workerId: currentUser.id,
        date: currentDate,
        hours: hours,
        status: 'completed',
        notes: `Test uren - ${verdelerName}`
      });

      setTestingHoursLogged(true);
      setShowTestingHoursModal(false);
      setTestingHours('');
      toast.success('Test uren succesvol geregistreerd! Je kunt nu de levering checklist invullen.');
    } catch (error) {
      console.error('Error logging testing hours:', error);
      toast.error('Er is een fout opgetreden bij het registreren van test uren');
    }
  };

  const handleEdit = () => {
    if (!hasPermission('verdelers', 'update')) {
      toast.error('Je hebt geen toestemming om verdelers te bewerken');
      return;
    }
    setIsEditing(true);
    setEditedDistributor({ ...distributor });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedDistributor({ ...distributor });
  };

  const handleSave = async () => {
    if (!editedDistributor) return;

    if (!hasPermission('verdelers', 'update')) {
      toast.error('Je hebt geen toestemming om verdelers bij te werken');
      return;
    }
    try {
      console.log('Saving distributor with data:', editedDistributor);

      // Check if status is being changed from "Testen" to "Levering"
      const statusChangedFromTestenToLevering = distributor?.status === 'Testen' && editedDistributor.status === 'Levering';

      // Map frontend fields to database fields - use the exact database field names
      const updateData = {
        distributorId: editedDistributor.distributor_id,
        projectId: editedDistributor.project_id,
        kastNaam: editedDistributor.kast_naam,
        systeem: editedDistributor.systeem,
        voeding: editedDistributor.voeding,
        bouwjaar: editedDistributor.bouwjaar,
        keuringDatum: editedDistributor.keuring_datum,
        getestDoor: editedDistributor.getest_door,
        unInV: editedDistributor.un_in_v,
        inInA: editedDistributor.in_in_a,
        ikThInKA1s: editedDistributor.ik_th_in_ka1s,
        ikDynInKA: editedDistributor.ik_dyn_in_ka,
        freqInHz: editedDistributor.freq_in_hz,
        typeNrHs: editedDistributor.type_nr_hs,
        fabrikant: editedDistributor.fabrikant,
        profilePhoto: editedDistributor.profile_photo,
        status: editedDistributor.status,
        // Only include new columns if they exist in database
        ...(editedDistributor.toegewezen_monteur !== undefined && {
          toegewezenMonteur: editedDistributor.toegewezen_monteur
        }),
        ...(editedDistributor.gewenste_lever_datum !== undefined && {
          gewensteLeverDatum: editedDistributor.gewenste_lever_datum
        })
      };

      console.log('Update data being sent:', updateData);

      await dataService.updateDistributor(editedDistributor.id, updateData);

      // Update the local state with the edited data
      setDistributor(editedDistributor);
      setIsEditing(false);

      if (statusChangedFromTestenToLevering) {
        toast.success('Verdeler status bijgewerkt naar Levering!');
        setShowTestingHoursModal(true);
      } else {
        toast.success('Verdeler gegevens opgeslagen!');
      }
    } catch (error) {
      console.error('Error saving distributor:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de verdeler');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    console.log('Input change:', field, value);
    setEditedDistributor({
      ...editedDistributor,
      [field]: value
    });
  };

  // Determine the back navigation based on where we came from
  const handleBackNavigation = () => {
    // Check if we came from a project (look for project in the URL path or state)
    const fromProject = location.pathname.includes('/project/') || location.state?.fromProject;

    if (fromProject && distributor?.project_id) {
      // Navigate back to the project details
      navigate(`/project/${distributor.project_id}`);
    } else {
      // Default to verdelers list
      navigate("/verdelers");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Verdeler laden...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!distributor) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <h1 className="text-2xl mb-4">Verdeler niet gevonden</h1>
          <button
            onClick={() => navigate("/verdelers")}
            className="btn-primary"
          >
            Terug naar verdelers
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-white">Laden...</div>
      </div>
    );
  }

  if (!distributor) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-white">Verdeler niet gevonden</div>
      </div>
    );
  }

  console.log('🔍 VERDELER DETAILS: Current status:', distributor.status);
  console.log('🔍 VERDELER DETAILS: Should show testing button:', distributor.status === 'Testen');

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackNavigation}
              className="btn-secondary p-2"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">Verdeler details</h1>
              <p className="text-gray-400">{distributor.distributor_id} - {distributor.kast_naam || 'Naamloos'}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {distributor.status === 'Testen' && (
              <button
                onClick={openChecklistInNewWindow}
                className="btn-primary flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                title="Open pre-testing checklist"
              >
                <CheckSquare size={20} />
                <span>Testing Checklist</span>
              </button>
            )}
            {distributor.status === 'Levering' && testingHoursLogged && (
              <button
                onClick={() => {
                  setActiveTab('levering');
                  setTimeout(() => setShowLeveringChecklist(true), 100);
                }}
                className="btn-primary flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                title="Open levering checklist"
              >
                <FileText size={20} />
                <span>Levering Checklist</span>
              </button>
            )}
            <button
              onClick={handleGenerateAccessCode}
              className="btn-secondary flex items-center space-x-2"
              title="Genereer toegangscode voor deze verdeler"
            >
              <Key size={20} />
              <span>Toegangscode</span>
            </button>
            {activeTab === 'details' && (
              <>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Edit size={20} />
                    <span>Bewerken</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <X size={20} />
                      <span>Annuleren</span>
                    </button>
                    <button
                      onClick={handleSave}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Save size={20} />
                      <span>Opslaan</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Access Code Form Modal */}
      {showAccessCodeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Toegangscode genereren</h2>
              <button
                onClick={() => setShowAccessCodeForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#2A303C] p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-400 mb-2">Voor verdeler</h3>
                <p className="text-white">{distributor.distributor_id} - {distributor.kast_naam || 'Naamloos'}</p>
                <p className="text-sm text-gray-400">Project: {distributor.projects?.project_number || 'Onbekend'}</p>
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

      {/* Navigation Tabs */}
      <div className="card p-4 mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'details'
                ? 'bg-[#4169e1] text-white'
                : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'documents'
                ? 'bg-[#4169e1] text-white'
                : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
            }`}
          >
            Documenten
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'tests'
                ? 'bg-[#4169e1] text-white'
                : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
            }`}
          >
            Testrapporten
          </button>
          {currentUser?.role === 'logistiek' && distributor?.status === 'Levering' && (
            <button
              onClick={() => {
                console.log('🚚 Switching to levering tab');
                setActiveTab('levering');
              }}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'levering'
                  ? 'bg-[#4169e1] text-white'
                  : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
              }`}
            >
              Levering Checklist
            </button>
          )}
          {/* Debug info */}
          {console.log('🚚 VerdelerDetails Tab Debug:', {
            currentUserRole: currentUser?.role,
            distributorStatus: distributor?.status,
            showTab: currentUser?.role === 'logistiek' && distributor?.status === 'Levering',
            activeTab
          })}
        </div>
      </div>

      {/* Content */}
      <div className="card p-6">
        {activeTab === 'details' && (
          <div>
            <div className="space-y-8">
              {/* Basis Informatie */}
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-4">Basis Informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Verdeler ID</label>
                    <div className="input-field bg-[#2A303C]/50 cursor-not-allowed">
                      {distributor.distributor_id}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Verdeler ID kan niet worden gewijzigd</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Kastnaam</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.kast_naam || ''}
                        onChange={(e) => handleInputChange('kast_naam', e.target.value)}
                        placeholder="Voer kastnaam in"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.kast_naam || "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Projectnummer</label>
                    <div className="input-field bg-[#2A303C]/50 cursor-not-allowed">
                      {distributor.projects?.project_number || "-"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Gekoppeld aan project</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Status</label>
                    {isEditing ? (
                      <select
                        className="input-field"
                        value={editedDistributor?.status || ''}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="">Selecteer status</option>
                        <option value="Productie">Productie</option>
                        <option value="Testen">Testen</option>
                        <option value="Gereed">Gereed</option>
                        <option value="Levering">Levering</option>
                        <option value="Gereed voor oplevering">Gereed voor oplevering</option>
                        <option value="Opgeleverd">Opgeleverd</option>
                        <option value="Vervallen">Vervallen</option>
                      </select>
                    ) : (
                      <div className="input-field">
                        {distributor.status || "-"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Technische Specificaties */}
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-4">Technische Specificaties</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Stelsel</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.systeem || ''}
                        onChange={(e) => handleInputChange('systeem', e.target.value)}
                        placeholder="Bijv. 400V TN-S"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.systeem || "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Binnenkomende voeding</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.voeding || ''}
                        onChange={(e) => handleInputChange('voeding', e.target.value)}
                        placeholder="Bijv. 3x400V + N + PE"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.voeding || "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Bouwjaar</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.bouwjaar || ''}
                        onChange={(e) => handleInputChange('bouwjaar', e.target.value)}
                        placeholder="Bijv. 2025"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.bouwjaar || "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Un in V</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.un_in_v || ''}
                        onChange={(e) => handleInputChange('un_in_v', e.target.value)}
                        placeholder="Bijv. 400"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.un_in_v || "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">In in A</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.in_in_a || ''}
                        onChange={(e) => handleInputChange('in_in_a', e.target.value)}
                        placeholder="Bijv. 400"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.in_in_a || "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ik Th in KA 1s</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.ik_th_in_ka1s || ''}
                        onChange={(e) => handleInputChange('ik_th_in_ka1s', e.target.value)}
                        placeholder="Bijv. 25"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.ik_th_in_ka1s || "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ik Dyn in KA</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.ik_dyn_in_ka || ''}
                        onChange={(e) => handleInputChange('ik_dyn_in_ka', e.target.value)}
                        placeholder="Bijv. 65"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.ik_dyn_in_ka || "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Freq. in Hz</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.freq_in_hz || ''}
                        onChange={(e) => handleInputChange('freq_in_hz', e.target.value)}
                        placeholder="Bijv. 50"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.freq_in_hz || "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Type nr. HS</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.type_nr_hs || ''}
                        onChange={(e) => handleInputChange('type_nr_hs', e.target.value)}
                        placeholder="Bijv. HS-400"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.type_nr_hs || "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Fabrikant</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.fabrikant || ''}
                        onChange={(e) => handleInputChange('fabrikant', e.target.value)}
                        placeholder="Bijv. Schneider Electric"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.fabrikant || "-"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Planning en Toewijzing */}
              <div>
                <h3 className="text-lg font-semibold text-orange-400 mb-4">Planning en Toewijzing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Keuring datum</label>
                    {isEditing ? (
                      <input
                        type="date"
                        className="input-field"
                        value={editedDistributor?.keuring_datum ? editedDistributor.keuring_datum.split('T')[0] : ''}
                        onChange={(e) => handleInputChange('keuring_datum', e.target.value)}
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.keuring_datum 
                          ? new Date(distributor.keuring_datum).toLocaleDateString('nl-NL')
                          : "Niet ingesteld"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Getest door</label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="input-field"
                        value={editedDistributor?.getest_door || ''}
                        onChange={(e) => handleInputChange('getest_door', e.target.value)}
                        placeholder="Naam van tester"
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.getest_door || "Niet ingesteld"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Toegewezen monteur</label>
                    {isEditing ? (
                      <select
                        className="input-field"
                        value={editedDistributor?.toegewezen_monteur || ''}
                        onChange={(e) => handleInputChange('toegewezen_monteur', e.target.value)}
                      >
                        <option value="">Nader te bepalen</option>
                        {(() => {
                          const { primary, other } = getMontageUsersByLocation(distributor.projects?.location);
                          
                          return (
                            <>
                              {primary.length > 0 && (
                                <>
                                  <optgroup label={`Primair - ${distributor.projects?.location || 'Onbekend'}`}>
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
                    ) : (
                      <div className="input-field">
                        {distributor.toegewezen_monteur || "Nader te bepalen"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Gewenste lever datum</label>
                    {isEditing ? (
                      <input
                        type="date"
                        className="input-field"
                        value={editedDistributor?.gewenste_lever_datum ? editedDistributor.gewenste_lever_datum.split('T')[0] : ''}
                        onChange={(e) => handleInputChange('gewenste_lever_datum', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    ) : (
                      <div className="input-field">
                        {distributor.gewenste_lever_datum
                          ? distributor.gewenste_lever_datum.split('T')[0]
                          : "Niet ingesteld"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-lg text-gradient mb-6">Documenten</h2>
            {/* Document Management for this specific verdeler */}
            <VerdelerDocumentManager distributor={distributor} />
          </div>
        )}

        {activeTab === 'tests' && (
          <div>
            <h2 className="text-lg text-gradient mb-6">Testrapporten</h2>
            {testData ? (
              <TestReportViewer 
                testData={testData} 
                verdeler={distributor}
                projectNumber={distributor.projects?.project_number || ''}
              />
            ) : (
              <div className="bg-[#2A303C] p-6 rounded-lg text-center">
                <p className="text-gray-400">Geen testgegevens beschikbaar voor deze verdeler</p>
                <p className="text-sm text-gray-500 mt-2">
                  Voer eerst tests uit via de verdeler testen functionaliteit
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'levering' && (
          <div>
            <h2 className="text-lg text-gradient mb-6">Levering</h2>
            {distributor?.status === 'Levering' ? (
              <div className="space-y-6">
                {!testingHoursLogged ? (
                  <div className="bg-[#2A303C] p-6 rounded-lg border-l-4 border-yellow-500">
                    <h3 className="text-lg font-semibold text-yellow-500 mb-2">Test uren registreren</h3>
                    <p className="text-gray-400 mb-4">
                      Log eerst je test uren voordat je de levering checklist invult.
                    </p>
                    <button
                      onClick={() => setShowTestingHoursModal(true)}
                      className="btn-primary"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Test uren invoeren
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#2A303C] p-6 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center text-green-500 mb-2">
                      <CheckSquare className="w-5 h-5 mr-2" />
                      <h3 className="text-lg font-semibold">Test uren geregistreerd</h3>
                    </div>
                    <p className="text-gray-400">
                      Je test uren zijn succesvol geregistreerd. Klik op de "Levering Checklist" knop bovenaan de pagina om de checklist in te vullen.
                    </p>
                  </div>
                )}

                {showLeveringChecklist && (
                  <div className="bg-[#2A303C] p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white">Levering Checklist</h3>
                      <button
                        onClick={() => setShowLeveringChecklist(false)}
                        className="btn-secondary p-2"
                        title="Sluiten"
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <VerdelerLeveringChecklist
                      verdeler={distributor}
                      onComplete={() => {
                        setShowLeveringChecklist(false);
                        loadDistributor();
                        toast.success('Levering checklist opgeslagen!');
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#2A303C] p-6 rounded-lg text-center">
                <p className="text-gray-400">
                  Deze tab is alleen beschikbaar wanneer de verdeler status "Levering" heeft.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Huidige status: {distributor?.status}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pre-Testing Approval Modal */}
      {showPreTestingApproval && distributor && currentUser && (
        <VerdelerPreTestingApproval
          distributor={distributor}
          currentUser={currentUser}
          onClose={() => {
            setShowPreTestingApproval(false);
            loadDistributor();
            loadTestData();
          }}
          onApprove={async () => {
            await loadDistributor();
            await loadTestData();
          }}
          onDecline={async () => {
            await dataService.updateDistributor(distributor.id, { status: 'Productie' });
            await loadDistributor();
            await loadTestData();
          }}
        />
      )}

      {/* Testing Hours Modal */}
      {showTestingHoursModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Test uren registreren</h3>
            <p className="text-gray-400 mb-6">
              Voer het aantal uren in dat je hebt besteed aan het testen van {distributor?.kast_naam || 'deze verdeler'}.
            </p>

            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                Aantal uren *
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={testingHours}
                onChange={(e) => setTestingHours(e.target.value)}
                className="input-field w-full"
                placeholder="Bijv. 2.5"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Deze uren worden automatisch toegevoegd aan je weekstaat en de productie tab
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTestingHoursModal(false);
                  setTestingHours('');
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={handleTestingHoursSubmit}
                className="btn-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                Uren opslaan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VerdelerDetails;