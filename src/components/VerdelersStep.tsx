import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Plus, Trash2, Upload, Eye, CheckSquare, Printer, Key, Copy, Clock, Users, CheckCircle, XCircle, AlertTriangle, X, FileEdit as Edit, Save, FileSpreadsheet, Truck, FileText } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import VerdelerTesting from './VerdelerTesting';
import VerdelerVanaf630Test from './VerdelerVanaf630Test';
import VerdelerTestSimpel from './VerdelerTestSimpel';
import FATTest from './FATTest';
import HighVoltageTest from './HighVoltageTest';
import OnSiteTest from './OnSiteTest';
import PrintLabel from './PrintLabel';
import MPrintLabel from './MPrintLabel';
import VerdelerPreTestingApproval from './VerdelerPreTestingApproval';
import VerdelerChecklistWindow from './VerdelerChecklistWindow';
import VerdelerLeveringChecklist from './VerdelerLeveringChecklist';
import { generatePakbonPDF } from './PakbonPDF';
import { v4 as uuidv4 } from 'uuid';
import { dataService } from '../lib/supabase';
import ewpLogo from '../assets/ewp-logo.png';
import { exportMultipleVerdelersToExcel } from '../lib/excelExport';

interface VerdelersStepProps {
  projectData: any;
  onVerdelersChange: (verdelers: any[]) => void;
  onNext?: () => void;
  onBack?: () => void;
  hideNavigation?: boolean;
  autoOpenVerdelerId?: string;
  onVerdelerDetailsClose?: () => void;
}

const VerdelersStep: React.FC<VerdelersStepProps> = ({
  projectData,
  onVerdelersChange,
  onNext,
  onBack,
  hideNavigation = false,
  autoOpenVerdelerId,
  onVerdelerDetailsClose
}) => {
  const [verdelers, setVerdelers] = useState<any[]>(projectData.distributors || []);
  const [showVerdelerForm, setShowVerdelerForm] = useState(false);
  const [showVerdelerDetails, setShowVerdelerDetails] = useState(false);
  const [selectedVerdeler, setSelectedVerdeler] = useState<any>(null);
  const loadedProjectIdRef = useRef<string | null>(null);
  const [editingVerdeler, setEditingVerdeler] = useState<any>(null);
  const [autoOpenTestForVerdeler, setAutoOpenTestForVerdeler] = useState<string | null>(null);
  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [accessCodes, setAccessCodes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [testDataCache, setTestDataCache] = useState<Record<string, any>>({});
  const [showPreTestingApproval, setShowPreTestingApproval] = useState(false);
  const [verdelerForTesting, setVerdelerForTesting] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingNotifications, setPendingNotifications] = useState<Record<string, any>>({});
  const [showLeveringChecklist, setShowLeveringChecklist] = useState(false);
  const [verdelerForLevering, setVerdelerForLevering] = useState<any>(null);
  const [deliveryCompletionStatus, setDeliveryCompletionStatus] = useState<Record<string, boolean>>({});
  const [generatingPakbon, setGeneratingPakbon] = useState(false);
  const [showTestingHoursModal, setShowTestingHoursModal] = useState(false);
  const [testingHours, setTestingHours] = useState('');
  const [verdelerForTestingHours, setVerdelerForTestingHours] = useState<any>(null);
  const [previousVerdelerStatus, setPreviousVerdelerStatus] = useState<string>('');
  const [testingHoursLogged, setTestingHoursLogged] = useState<Record<string, boolean>>({});
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
    systeemCustom: '',
    voeding: '',
    voedingCustom: '',
    stuurspanning: '',
    stuurspanningCustom: '',
    kaWaarde: '',
    ipWaarde: '44',
    bouwjaar: new Date().getFullYear().toString(),
    status: 'Offerte',
    fabrikant: '',
    unInV: '',
    inInA: '',
    ikThInKA1s: '',
    ikDynInKA: '',
    freqInHz: '50 Hz',
    typeNrHs: '',
    profilePhoto: null as File | null,
    expectedHours: '',
    deliveryDate: '',
  });

  // Load current user
  useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.id === userId);
    console.log('👤 Current user loaded:', { userId, role: user?.role, name: user?.name });
    setCurrentUser(user);
  }, []);

  // Load verdelers from database when component mounts or project ID actually changes
  useEffect(() => {
    if (projectData?.id && projectData.id !== loadedProjectIdRef.current) {
      loadedProjectIdRef.current = projectData.id;
      loadVerdelersFromDatabase();
    }
  }, [projectData?.id]);

  // Load test data for all verdelers
  useEffect(() => {
    const loadAllTestData = async () => {
      const cache: Record<string, any> = {};

      for (const verdeler of verdelers) {
        try {
          const testData = await dataService.getTestData(verdeler.id);
          if (testData && testData.length > 0) {
            cache[verdeler.id] = testData;
          }
        } catch (error) {
          console.error('Error loading test data for verdeler:', verdeler.id, error);
        }
      }

      setTestDataCache(cache);
    };

    if (verdelers.length > 0) {
      loadAllTestData();
    }
  }, [verdelers]);

  // Load testing hours status when currentUser or verdelers change
  useEffect(() => {
    if (currentUser?.id && verdelers.length > 0) {
      loadTestingHoursStatus(verdelers);
    }
  }, [currentUser, verdelers]);

  const loadVerdelersFromDatabase = async () => {
    if (!projectData?.id) return;

    try {
      console.log('🔄 Loading verdelers from database for project:', projectData.id);
      const distributors = await dataService.getDistributorsByProject(projectData.id);
      console.log('📥 Loaded distributors from database:', distributors.length);

      // Convert database format to component format
      // Keep BOTH camelCase (for UI) and snake_case (for other components like ProjectDocumentManager)
      const formattedVerdelers = distributors.map((dist: any) => ({
        id: dist.id,
        project_id: projectData.id, // Add project_id for delivery tracking
        distributorId: dist.distributor_id,
        distributor_id: dist.distributor_id, // Keep snake_case for compatibility
        kastNaam: dist.kast_naam,
        kast_naam: dist.kast_naam, // Keep snake_case for compatibility
        toegewezenMonteur: dist.toegewezen_monteur || 'Vrij',
        systeem: dist.systeem,
        voeding: dist.voeding,
        stuurspanning: dist.stuurspanning,
        kaWaarde: dist.ka_waarde,
        ka_waarde: dist.ka_waarde, // Keep snake_case for compatibility
        ipWaarde: dist.ip_waarde || '44',
        ip_waarde: dist.ip_waarde || '44', // Keep snake_case for compatibility
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
        createdAt: dist.created_at,
        expectedHours: dist.expected_hours,
        expected_hours: dist.expected_hours, // Keep snake_case for compatibility
        deliveryDate: dist.gewenste_lever_datum,
        gewenste_lever_datum: dist.gewenste_lever_datum // Keep snake_case for compatibility
      }));

      console.log('✅ Formatted verdelers:', formattedVerdelers);
      setVerdelers(formattedVerdelers);
      // Don't call onVerdelersChange here - we're just loading existing data, not changing it
      // This prevents infinite refresh loops

      // Load pending notifications in the background (don't await)
      loadPendingNotifications(formattedVerdelers);

      // Load delivery completion status in the background (don't await)
      loadDeliveryCompletionStatus(formattedVerdelers);

      // Load testing hours logged status in the background (don't await)
      loadTestingHoursStatus(formattedVerdelers);
    } catch (error) {
      console.error('Error loading verdelers from database:', error);
    }
  };

  const loadPendingNotifications = async (verdelersList: any[]) => {
    try {
      console.log('🔔 Loading pending notifications for verdelers...');
      console.log('🔔 Project ID:', projectData.id);
      const { data, error } = await dataService.supabase
        .from('verdeler_testing_notifications')
        .select('*')
        .eq('status', 'pending')
        .eq('project_id', projectData.id);

      if (error) {
        console.error('🔔 Error loading pending notifications:', error);
        return;
      }

      console.log('🔔 Raw notification data:', data);

      // Create a map of distributor_id -> notification
      const notificationMap: Record<string, any> = {};
      data?.forEach((notification: any) => {
        console.log('🔔 Adding notification for distributor:', notification.distributor_id);
        notificationMap[notification.distributor_id] = notification;
      });

      console.log('🔔 Loaded pending notifications:', Object.keys(notificationMap).length);
      console.log('🔔 Notification map keys:', Object.keys(notificationMap));
      console.log('🔔 Verdelers IDs:', verdelersList.map(v => v.id));
      setPendingNotifications(notificationMap);
    } catch (error) {
      console.error('🔔 Exception loading pending notifications:', error);
    }
  };

  const loadDeliveryCompletionStatus = async (verdelersList: any[]) => {
    if (!projectData?.id) return;

    try {
      console.log('🚚 Loading delivery completion status...');
      const completionMap: Record<string, boolean> = {};

      for (const verdeler of verdelersList) {
        const deliveryData = await dataService.getVerdelerDelivery(projectData.id, verdeler.id);
        if (deliveryData && deliveryData.delivery_status === 'ready_for_delivery') {
          completionMap[verdeler.id] = true;
        }
      }

      console.log('🚚 Delivery completion status:', completionMap);
      setDeliveryCompletionStatus(completionMap);
    } catch (error) {
      console.error('🚚 Error loading delivery completion status:', error);
    }
  };

  const loadTestingHoursStatus = async (verdelersList: any[]) => {
    if (!currentUser?.id) return;

    try {
      console.log('⏱️ Loading testing hours status...');
      const hoursLoggedMap: Record<string, boolean> = {};

      for (const verdeler of verdelersList) {
        // Check if there are work entries for this verdeler by the current user
        const { data, error } = await dataService.supabase
          .from('work_entries')
          .select('id')
          .eq('distributor_id', verdeler.id)
          .eq('worker_id', currentUser.id)
          .limit(1);

        if (!error && data && data.length > 0) {
          hoursLoggedMap[verdeler.id] = true;
        }
      }

      console.log('⏱️ Testing hours logged status:', hoursLoggedMap);
      setTestingHoursLogged(hoursLoggedMap);
    } catch (error) {
      console.error('⏱️ Error loading testing hours status:', error);
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

  useEffect(() => {
    // Generate unique distributor ID when form opens for new verdeler
    if (showVerdelerForm && !editingVerdeler) {
      generateDistributorId();

      // Auto-fill delivery date from project if available
      if (projectData?.expectedDeliveryDate) {
        setVerdelerData(prev => ({
          ...prev,
          deliveryDate: projectData.expectedDeliveryDate
        }));
      }
    }
  }, [showVerdelerForm, editingVerdeler, projectData?.expectedDeliveryDate]);

  // Update selectedVerdeler when verdelers list changes (to refresh details view after save)
  useEffect(() => {
    if (showVerdelerDetails && selectedVerdeler) {
      const updatedVerdeler = verdelers.find(v => v.id === selectedVerdeler.id);
      if (updatedVerdeler) {
        setSelectedVerdeler(updatedVerdeler);
      }
    }
  }, [verdelers]);

  // Auto-open verdeler test when coming from notification
  useEffect(() => {
    if (autoOpenVerdelerId) {
      // Try to find in current verdelers state first (includes initial projectData.distributors)
      const verdelerToOpen = verdelers.find(v => v.id === autoOpenVerdelerId);
      if (verdelerToOpen) {
        console.log('🎯 Auto-opening verdeler:', verdelerToOpen);
        setSelectedVerdeler(verdelerToOpen);
        setShowVerdelerDetails(true);
        setAutoOpenTestForVerdeler(autoOpenVerdelerId);
      }
    }
  }, [autoOpenVerdelerId]);

  const loadUsers = async () => {
    try {
      const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(localUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAccessCodes = async () => {
    if (!projectData?.id) return;
    
    try {
      const codes = await dataService.getAccessCodes();
      const projectCodes = codes.filter((code: any) => 
        code.project_number === projectData.project_number
      );
      setAccessCodes(projectCodes);
    } catch (error) {
      console.error('Error loading access codes:', error);
    }
  };

  // Helper function to add units to technical spec values
  const formatTechnicalValue = (value: string, unit: string) => {
    if (!value) return '';
    const cleanValue = value.trim().replace(new RegExp(`\\s*${unit}$`, 'i'), '');
    return cleanValue ? `${cleanValue} ${unit}` : '';
  };

  const generateDistributorId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `VD${randomNum}`;

    const exists = verdelers.some(v => v.distributorId === newId);
    if (exists) {
      generateDistributorId();
    } else {
      setVerdelerData(prev => ({ ...prev, distributorId: newId }));
    }
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

  const handleVerdelerClick = (verdeler: any) => {
    setSelectedVerdeler(verdeler);
    setShowVerdelerDetails(true);
  };

  const handleCloseDetails = () => {
    setShowVerdelerDetails(false);
    setSelectedVerdeler(null);
    onVerdelerDetailsClose?.();
  };

  const handleEditVerdeler = (verdeler: any) => {
    console.log('🔧 EDIT: Starting edit for verdeler:', verdeler);
    setEditingVerdeler(verdeler);
    setPreviousVerdelerStatus(verdeler.status || '');

    // Check if systeem/voeding are custom values
    const systeemOptions = ['TN-S', 'TN-C', 'TN-C-S', 'TT'];
    const voedingOptions = ['40', '63', '80', '100', '125', '160', '250', '400', '630', '750', '800', '1000', '1250', '1400', '1600', '2000', '2500', '3200', '4000', '5000', '6300'];

    const isCustomSysteem = verdeler.systeem && !systeemOptions.includes(verdeler.systeem);
    const isCustomVoeding = verdeler.voeding && !voedingOptions.includes(verdeler.voeding);

    // Handle date formatting - convert timestamp to date string for input field
    let deliveryDateValue = '';
    const rawDeliveryDate = verdeler.deliveryDate || verdeler.gewenste_lever_datum;
    if (rawDeliveryDate) {
      try {
        const date = new Date(rawDeliveryDate);
        deliveryDateValue = date.toISOString().split('T')[0];
      } catch (e) {
        console.error('Error parsing delivery date:', e);
      }
    }

    // Check if stuurspanning is a custom value
    const stuurspanningOptions = ['N.V.T.', '230V AC', '24V AC', '12V AC', '8V AC', '30V DC', '24V DC', '12V DC'];
    const isCustomStuurspanning = verdeler.stuurspanning && !stuurspanningOptions.includes(verdeler.stuurspanning);

    setVerdelerData({
      distributorId: verdeler.distributorId || verdeler.distributor_id,
      kastNaam: verdeler.kastNaam || verdeler.kast_naam,
      toegewezenMonteur: verdeler.toegewezenMonteur || verdeler.toegewezen_monteur || 'Vrij',
      systeem: isCustomSysteem ? 'custom' : (verdeler.systeem || ''),
      systeemCustom: isCustomSysteem ? verdeler.systeem : '',
      voeding: isCustomVoeding ? 'custom' : (verdeler.voeding || ''),
      voedingCustom: isCustomVoeding ? verdeler.voeding : '',
      stuurspanning: isCustomStuurspanning ? 'Zelf invullen' : (verdeler.stuurspanning || ''),
      stuurspanningCustom: isCustomStuurspanning ? verdeler.stuurspanning : '',
      kaWaarde: verdeler.kaWaarde || verdeler.ka_waarde || '',
      ipWaarde: verdeler.ipWaarde || verdeler.ip_waarde || '44',
      bouwjaar: verdeler.bouwjaar || new Date().getFullYear().toString(),
      status: verdeler.status,
      fabrikant: verdeler.fabrikant,
      unInV: verdeler.unInV || verdeler.un_in_v,
      inInA: verdeler.inInA || verdeler.in_in_a,
      ikThInKA1s: verdeler.ikThInKA1s || verdeler.ik_th_in_ka_1s,
      ikDynInKA: verdeler.ikDynInKA || verdeler.ik_dyn_in_ka,
      freqInHz: verdeler.freqInHz || verdeler.freq_in_hz || '50 Hz',
      typeNrHs: verdeler.typeNrHs || verdeler.type_nr_hs,
      profilePhoto: null,
      expectedHours: verdeler.expectedHours || verdeler.expected_hours || '',
      deliveryDate: deliveryDateValue,
    });
    setShowVerdelerDetails(false);
    setShowVerdelerForm(true);
    console.log('🔧 EDIT: Form data set with values:', {
      toegewezenMonteur: verdeler.toegewezenMonteur || verdeler.toegewezen_monteur,
      deliveryDate: deliveryDateValue
    });
  };

  const handleGenerateAccessCode = (verdeler: any) => {
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

      console.log('🔑 ACCESS CODE: Creating with data:', accessCodeData);
      await dataService.createAccessCode(accessCodeData);
      await loadAccessCodes();
      
      setShowAccessCodeForm(false);
      setSelectedVerdeler(null);
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

    if (!verdelerForTestingHours || !currentUser) {
      toast.error('Verdeler of gebruiker niet gevonden');
      return;
    }

    try {
      const hours = parseFloat(testingHours);
      const currentDate = new Date().toISOString().split('T')[0];
      const verdelerName = verdelerForTestingHours.kast_naam || verdelerForTestingHours.distributor_id || 'Onbekend';
      const projectNumber = projectData.project_number || 'Onbekend';

      await syncTestingHoursToWeekstaat(
        currentUser.id,
        currentDate,
        hours,
        verdelerName,
        projectNumber
      );

      await dataService.createWorkEntry({
        distributorId: verdelerForTestingHours.id,
        workerId: currentUser.id,
        date: currentDate,
        hours: hours,
        status: 'completed',
        notes: `Test uren - ${verdelerName}`
      });

      // Mark testing hours as logged for this verdeler
      setTestingHoursLogged(prev => {
        const updated = {
          ...prev,
          [verdelerForTestingHours.id]: true
        };
        console.log('⏱️ Updated testingHoursLogged state:', updated);
        return updated;
      });

      setShowTestingHoursModal(false);
      setTestingHours('');
      setVerdelerForTestingHours(null);

      // Force a re-render by updating the verdelers array
      setVerdelers([...verdelers]);

      toast.success('Test uren succesvol geregistreerd! Klik op de "Levering Checklist" knop om door te gaan.');
    } catch (error) {
      console.error('Error logging testing hours:', error);
      toast.error('Er is een fout opgetreden bij het registreren van test uren');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setVerdelerData({ ...verdelerData, [field]: value });

    // If status is changed to "Testen", automatically trigger save and open pre-test checklist
    if (field === 'status' && value === 'Testen' && editingVerdeler) {
      // Set a flag to open checklist after save
      setTimeout(async () => {
        console.log('🔔 Status changed to Testen - will open pre-test checklist after save');
      }, 100);
    }
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

    const duplicateId = verdelers.some(v => 
      v.distributorId === verdelerData.distributorId && 
      (!editingVerdeler || v.id !== editingVerdeler.id)
    );
    
    if (duplicateId) {
      toast.error('Deze verdeler ID bestaat al. Kies een ander ID.');
      return;
    }

    try {
      console.log('🚀 SAVE: Saving verdeler with data:', verdelerData);
      console.log('🚀 SAVE: Monteur being saved:', verdelerData.toegewezenMonteur);

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

      // Get actual values for systeem, voeding, and stuurspanning
      const finalSysteem = verdelerData.systeem === 'custom' ? verdelerData.systeemCustom : verdelerData.systeem;
      const finalVoeding = verdelerData.voeding === 'custom' ? verdelerData.voedingCustom : verdelerData.voeding;
      const finalStuurspanning = verdelerData.stuurspanning === 'Zelf invullen' ? verdelerData.stuurspanningCustom : verdelerData.stuurspanning;

      console.log('🔍 SAVE: Saving verdeler with data:', verdelerData);
      console.log('🔍 SAVE: distributorId:', verdelerData.distributorId);
      console.log('🔍 SAVE: kastNaam:', verdelerData.kastNaam);

      if (editingVerdeler) {
        // Update existing verdeler
        if (projectData.id) {
          // Update in database if project exists
          console.log('🔄 SAVE: Updating existing verdeler in database...');

          const updateData = {
            distributorId: verdelerData.distributorId,
            projectId: projectData.id,
            kastNaam: verdelerData.kastNaam,
            systeem: finalSysteem,
            voeding: finalVoeding,
            stuurspanning: finalStuurspanning,
            kaWaarde: verdelerData.kaWaarde,
            ipWaarde: verdelerData.ipWaarde || '44',
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
            toegewezenMonteur: verdelerData.toegewezenMonteur,
            expectedHours: verdelerData.expectedHours ? parseFloat(verdelerData.expectedHours) : null,
            gewensteLeverDatum: verdelerData.deliveryDate || null
          };

          await dataService.updateDistributor(editingVerdeler.id, updateData);
          console.log('✅ SAVE: Verdeler updated in database');
          toast.success('Verdeler bijgewerkt!');
        } else {
          // Update in local state during project creation
          console.log('🔄 SAVE: Updating verdeler in local state...');

          const updatedVerdeler = {
            ...editingVerdeler,
            distributorId: verdelerData.distributorId,
            distributor_id: verdelerData.distributorId,
            kastNaam: verdelerData.kastNaam,
            kast_naam: verdelerData.kastNaam,
            toegewezenMonteur: verdelerData.toegewezenMonteur,
            systeem: finalSysteem,
            voeding: finalVoeding,
            stuurspanning: finalStuurspanning,
            kaWaarde: verdelerData.kaWaarde,
            ka_waarde: verdelerData.kaWaarde,
            ipWaarde: verdelerData.ipWaarde || '44',
            ip_waarde: verdelerData.ipWaarde || '44',
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
            expectedHours: verdelerData.expectedHours ? parseFloat(verdelerData.expectedHours) : null,
            expected_hours: verdelerData.expectedHours ? parseFloat(verdelerData.expectedHours) : null,
            deliveryDate: verdelerData.deliveryDate || null,
            gewenste_lever_datum: verdelerData.deliveryDate || null,
          };

          const updatedVerdelers = verdelers.map(v =>
            v.id === editingVerdeler.id ? updatedVerdeler : v
          );
          setVerdelers(updatedVerdelers);
          onVerdelersChange(updatedVerdelers);
          console.log('✅ SAVE: Updated in local state for project creation');
          toast.success('Verdeler bijgewerkt!');
        }
      } else {
        // Create new verdeler in database if we have a project ID
        if (projectData.id) {
          console.log('🔄 SAVE: Creating new verdeler in database...');
          
          const newVerdelerData = {
            distributorId: verdelerData.distributorId,
            projectId: projectData.id,
            kastNaam: verdelerData.kastNaam,
            toegewezenMonteur: verdelerData.toegewezenMonteur,
            systeem: finalSysteem,
            voeding: finalVoeding,
            stuurspanning: finalStuurspanning,
            kaWaarde: verdelerData.kaWaarde,
            ipWaarde: verdelerData.ipWaarde || '44',
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
            expectedHours: verdelerData.expectedHours ? parseFloat(verdelerData.expectedHours) : null,
            gewensteLeverDatum: verdelerData.deliveryDate || null
          };
          
          await dataService.createDistributor(newVerdelerData);
          console.log('✅ SAVE: New verdeler created in database');
          toast.success('Verdeler toegevoegd!');
        } else {
          // For project creation (no project ID yet), save to local state
          // Keep BOTH camelCase and snake_case for compatibility
          const verdelerToSave = {
            id: uuidv4(),
            distributorId: verdelerData.distributorId,
            distributor_id: verdelerData.distributorId, // Keep snake_case
            kastNaam: verdelerData.kastNaam,
            kast_naam: verdelerData.kastNaam, // Keep snake_case
            toegewezenMonteur: verdelerData.toegewezenMonteur,
            systeem: finalSysteem,
            voeding: finalVoeding,
            stuurspanning: finalStuurspanning,
            kaWaarde: verdelerData.kaWaarde,
            ka_waarde: verdelerData.kaWaarde, // Keep snake_case
            ipWaarde: verdelerData.ipWaarde || '44',
            ip_waarde: verdelerData.ipWaarde || '44', // Keep snake_case
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
            expectedHours: verdelerData.expectedHours ? parseFloat(verdelerData.expectedHours) : null,
            expected_hours: verdelerData.expectedHours ? parseFloat(verdelerData.expectedHours) : null, // Keep snake_case
            deliveryDate: verdelerData.deliveryDate || null,
            gewenste_lever_datum: verdelerData.deliveryDate || null, // Keep snake_case
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

      // If status was changed to "Testen", open the pre-test checklist
      // BUT only for multi-verdeler projects (verdelers.length > 1)
      if (verdelerData.status === 'Testen' && editingVerdeler && verdelers.length > 1) {
        console.log('🔔 Multi-verdeler project: Opening pre-test checklist for verdeler:', editingVerdeler.distributor_id);
        const updatedVerdeler = verdelers.find(v => v.id === editingVerdeler.id);
        if (updatedVerdeler) {
          setTimeout(() => {
            setVerdelerForTesting(updatedVerdeler);
            setShowPreTestingApproval(true);
          }, 100);
        }
      } else if (verdelerData.status === 'Testen' && editingVerdeler && verdelers.length === 1) {
        console.log('ℹ️ Single-verdeler project: Use project-level testing instead');
        toast.info('Voor projecten met 1 verdeler, verander de project status naar "Testen"');
      }

      // If status was changed from "Testen" to "Levering", open testing hours modal first
      if (verdelerData.status === 'Levering' && editingVerdeler && previousVerdelerStatus === 'Testen') {
        console.log('🚚 Status changed from Testen to Levering: Opening testing hours modal for verdeler:', editingVerdeler.distributor_id || editingVerdeler.distributorId);
        const updatedVerdeler = verdelers.find(v => v.id === editingVerdeler.id);
        if (updatedVerdeler) {
          setTimeout(() => {
            setVerdelerForTestingHours(updatedVerdeler);
            setShowTestingHoursModal(true);
          }, 100);
        }
      } else if (verdelerData.status === 'Levering' && editingVerdeler) {
        console.log('🚚 Status changed to Levering: Opening delivery checklist for verdeler:', editingVerdeler.distributor_id || editingVerdeler.distributorId);
        const updatedVerdeler = verdelers.find(v => v.id === editingVerdeler.id);
        if (updatedVerdeler) {
          setTimeout(() => {
            setVerdelerForLevering(updatedVerdeler);
            setShowLeveringChecklist(true);
          }, 100);
        }
      }

      handleCancelForm();
    } catch (error) {
      console.error('Error saving verdeler:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de verdeler');
    }
  };

  const handleDeleteVerdeler = async (verdelerId: string) => {
    if (window.confirm('Weet je zeker dat je deze verdeler wilt verwijderen?')) {
      try {
        await dataService.deleteDistributor(verdelerId);
        const updatedVerdelers = verdelers.filter(v => v.id !== verdelerId);
        setVerdelers(updatedVerdelers);
        onVerdelersChange(updatedVerdelers);
        toast.success('Verdeler verwijderd!');
      } catch (error) {
        console.error('Error deleting verdeler:', error);
        toast.error('Er is een fout opgetreden bij het verwijderen van de verdeler');
      }
    }
  };

  const handleGeneratePakbon = async (verdeler: any) => {
    try {
      setGeneratingPakbon(true);
      console.log('🔍 PAKBON: Generating empty pakbon for verdeler:', verdeler.id);

      // Generate pakbon without signature (empty pakbon for driver)
      const blob = await generatePakbonPDF(projectData, verdeler, null);

      const verdelerName = verdeler.kastNaam || verdeler.kast_naam || verdeler.distributorId || verdeler.distributor_id || 'verdeler';
      const sanitizedVerdelerName = verdelerName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Pakbon_${projectData.project_number || projectData.projectNumber}_${sanitizedVerdelerName}_${new Date().getTime()}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Pakbon gedownload!');
    } catch (error) {
      console.error('Error generating pakbon:', error);
      toast.error('Er is een fout opgetreden bij het genereren van de pakbon');
    } finally {
      setGeneratingPakbon(false);
    }
  };

  const handleCancelForm = () => {
    setShowVerdelerForm(false);
    setEditingVerdeler(null);
    setPreviousVerdelerStatus('');
    setVerdelerData({
      distributorId: '',
      kastNaam: '',
      toegewezenMonteur: 'Vrij',
      systeem: '',
      systeemCustom: '',
      voeding: '',
      voedingCustom: '',
      stuurspanning: '',
      stuurspanningCustom: '',
      kaWaarde: '',
      ipWaarde: '44',
      bouwjaar: new Date().getFullYear().toString(),
      status: projectData?.status?.toLowerCase() === 'offerte' ? 'Offerte' : 'Productie',
      fabrikant: '',
      unInV: '',
      inInA: '',
      ikThInKA1s: '',
      ikDynInKA: '',
      freqInHz: '50 Hz',
      typeNrHs: '',
      profilePhoto: null,
      expectedHours: '',
      deliveryDate: '',
    });
  };

  const handleTestComplete = async (verdeler: any, testData: any) => {
    console.log('Test completed for verdeler:', verdeler.distributorId || verdeler.id, 'with data:', testData);

    // Determine the test type from the testData structure
    let testType = 'unknown';
    if (testData.workshopChecklist) testType = 'workshop_checklist';
    else if (testData.verdelerVanaf630Test) testType = 'verdeler_vanaf_630';
    else if (testData.verdelerTestSimpel) testType = 'verdeler_test_simpel';
    else if (testData.factoryTest) testType = 'factory_test';
    else if (testData.highVoltageTest) testType = 'high_voltage_test';
    else if (testData.onSiteTest) testType = 'on_site_test';

    try {
      // Get the distributor ID (could be passed as object or string)
      const distributorId = typeof verdeler === 'string' ? verdeler : (verdeler.id || verdeler.distributor_id);

      console.log('💾 Saving test data to database:', {
        distributorId,
        testType,
        dataKeys: Object.keys(testData)
      });

      // Save to database
      await dataService.createTestData({
        distributorId: distributorId,
        testType: testType,
        data: testData
      });

      console.log('✅ Test data saved to database successfully');
      toast.success('Test opgeslagen in database');

      // Reload test data for this verdeler to update the cache
      const updatedTestData = await dataService.getTestData(distributorId);
      setTestDataCache(prev => ({
        ...prev,
        [distributorId]: updatedTestData
      }));
    } catch (error) {
      console.error('❌ Error saving test data to database:', error);
      toast.error('Fout bij opslaan van test data');
    }
  };

  const isPreTestApproved = (verdeler: any) => {
    // For single verdeler projects, use project-level testing (no pre-test approval needed)
    if (verdelers.length === 1) {
      return projectData.status?.toLowerCase() === 'testen';
    }

    // For multi-verdeler projects, check if pre-test checklist has been approved
    const cachedTests = testDataCache[verdeler.id];
    if (!cachedTests || cachedTests.length === 0) return false;

    const preTestApproval = cachedTests.find((t: any) => t.test_type === 'verdeler_pre_testing_approval');
    if (!preTestApproval?.data) return false;

    const approvalData = preTestApproval.data.approvalData;
    // Check if reviewed and approved
    return approvalData?.status === 'reviewed' && approvalData?.overallApproval === true;
  };

  const hasChecklistSubmitted = (verdeler: any) => {
    // Check if the montage user has submitted a pre-testing checklist
    const cachedTests = testDataCache[verdeler.id];
    if (!cachedTests || cachedTests.length === 0) return false;

    const preTestApproval = cachedTests.find((t: any) => t.test_type === 'verdeler_pre_testing_approval');
    if (!preTestApproval?.data) return false;

    const approvalData = preTestApproval.data.approvalData;
    // Return true if status is 'submitted' or 'reviewed' (checklist exists and was submitted)
    return approvalData?.status === 'submitted' || approvalData?.status === 'reviewed';
  };

  const getTestStatus = (verdeler: any) => {
    let status = 'Niet getest';
    let color = 'bg-gray-500/20 text-gray-400';

    // Load from database cache first
    const cachedTests = testDataCache[verdeler.id];

    if (cachedTests && cachedTests.length > 0) {
      // Check for workshop_checklist test
      const workshopTest = cachedTests.find((t: any) => t.test_type === 'workshop_checklist');
      if (workshopTest?.data) {
        if (workshopTest.data.inspectionReport?.completed) {
          if (workshopTest.data.inspectionReport.result === 'approved') {
            status = 'Goedgekeurd';
            color = 'bg-green-500/20 text-green-400';
          } else if (workshopTest.data.inspectionReport.result === 'conditionallyApproved') {
            status = 'Voorwaardelijk';
            color = 'bg-yellow-500/20 text-yellow-400';
          } else if (workshopTest.data.inspectionReport.result === 'rejected') {
            status = 'Afgekeurd';
            color = 'bg-red-500/20 text-red-400';
          }
        } else if (workshopTest.data.workshopChecklist?.completed) {
          status = 'Checklist Voltooid';
          color = 'bg-blue-500/20 text-blue-400';
        }
      }

      // Check for factory_test
      const fatTest = cachedTests.find((t: any) => t.test_type === 'factory_test');
      if (fatTest?.data?.factoryTest?.completed) {
        status = 'FAT Voltooid';
        color = 'bg-yellow-500/20 text-yellow-400';
      }

      // Check for high_voltage_test
      const hvTest = cachedTests.find((t: any) => t.test_type === 'high_voltage_test');
      if (hvTest?.data?.highVoltageTest?.completed) {
        status = 'HV Test Voltooid';
        color = 'bg-orange-500/20 text-orange-400';
      }
    } else {
      // Fallback to localStorage if no database data
      try {
        const verdelerTestData = localStorage.getItem(`verdeler_test_${verdeler.id}`);
        const fatTestData = localStorage.getItem(`fat_test_${verdeler.id}`);
        const hvTestData = localStorage.getItem(`hv_test_${verdeler.id}`);

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
    }

    return { status, color };
  };

  const getVerdelerAccessCodes = (verdelerId: string) => {
    return accessCodes.filter(code => code.verdeler_id === verdelerId);
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const isCodeValid = (code: any) => {
    return code.is_active && !isExpired(code.expires_at);
  };

  const handleNext = () => {
    if (verdelers.length === 0) {
      toast.error('Voeg tenminste één verdeler toe voordat je verder gaat!');
      return;
    }
    if (onNext) onNext();
  };

  const isProjectOfferte = projectData?.status?.toLowerCase() === 'offerte';
  const canEditTechnicalSpecs = !isProjectOfferte;

  const getMontageUsers = () => {
    return users.filter(user => user.role === 'montage');
  };

  const handleOpenChecklist = (verdeler: any) => {
    console.log('📋 Opening checklist for verdeler:', verdeler.distributorId);
    setVerdelerForTesting(verdeler);
    setShowPreTestingApproval(true);
  };

  const handleApprovalComplete = async () => {
    // Reload notifications after approval/decline
    await loadPendingNotifications(verdelers);
    setShowPreTestingApproval(false);
    setVerdelerForTesting(null);
  };

  const handleOpenLeveringChecklist = (verdeler: any) => {
    console.log('🚚 Opening levering checklist for verdeler:', verdeler.distributorId);
    setVerdelerForLevering(verdeler);
    setShowLeveringChecklist(true);
  };

  const handleLeveringChecklistComplete = async () => {
    setShowLeveringChecklist(false);
    setVerdelerForLevering(null);
    // Reload verdelers to get updated status
    await loadVerdelersFromDatabase();

    // Check if all verdelers now have "Levering" status
    setTimeout(async () => {
      const currentVerdelers = await dataService.getDistributorsByProject(projectData.id);
      const allLevering = currentVerdelers.length > 0 && currentVerdelers.every((v: any) => v.status === 'Levering');

      if (allLevering) {
        console.log('✅ All verdelers have Levering status - updating project status to Levering');
        try {
          await dataService.updateProject(projectData.id, { status: 'Levering' });
          toast.success('Alle verdelers hebben status Levering - project status is automatisch aangepast naar Levering');

          // Trigger a reload of the parent component if possible
          if (onVerdelersChange) {
            onVerdelersChange(currentVerdelers);
          }
        } catch (error) {
          console.error('Error updating project status:', error);
          toast.error('Fout bij het updaten van project status');
        }
      }
    }, 500);
  };

  return (
    <div className="space-y-6">
      {!hideNavigation && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">Verdelers</h2>
          <p className="text-gray-400">Voeg verdelers toe aan dit project</p>
        </div>
      )}

      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">Project Verdelers</h1>
            <p className="text-gray-400">Beheer alle verdelers voor dit project</p>
          </div>
          <div className="flex items-center space-x-3">
            {verdelers.length > 0 && (
              <button
                onClick={() => {
                  const formattedVerdelers = verdelers.map(v => ({
                    distributor_id: v.distributorId,
                    kast_naam: v.kastNaam,
                    systeem: v.systeem,
                    voeding: v.voeding,
                    bouwjaar: v.bouwjaar,
                    fabrikant: v.fabrikant,
                    un_in_v: v.unInV,
                    in_in_a: v.inInA,
                    ik_th_in_ka1s: v.ikThInKA1s,
                    ik_dyn_in_ka: v.ikDynInKA,
                    freq_in_hz: v.freqInHz,
                    type_nr_hs: v.typeNrHs
                  }));
                  exportMultipleVerdelersToExcel(formattedVerdelers, projectData.projectNumber || projectData.project_number);
                  toast.success(`${verdelers.length} verdelers geëxporteerd voor M-Print Pro`);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center space-x-2"
                title="Exporteer alle verdelers voor M-Print Pro"
              >
                <FileSpreadsheet size={20} />
                <span>Exporteer Alle Labels</span>
              </button>
            )}
            <button
              onClick={() => setShowVerdelerForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Verdeler toevoegen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verdelers Table */}
      {verdelers.length > 0 ? (
        <div className="card p-6">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pr-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="table-header text-left">Verdeler ID</th>
                  <th className="table-header text-left">Kastnaam</th>
                  <th className="table-header text-left">Monteur</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Test Status</th>
                  <th className="table-header text-left">Toegangscodes</th>
                  <th className="table-header text-left">Stelsel</th>
                  <th className="table-header text-left">Spanning</th>
                  <th className="table-header text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {verdelers.map((verdeler) => {
                  const testStatus = getTestStatus(verdeler);
                  
                  return (
                    <tr 
                      key={verdeler.id} 
                      className="table-row cursor-pointer"
                      onClick={() => handleVerdelerClick(verdeler)}
                    >
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="font-medium text-green-400">{verdeler.distributorId}</span>
                        </div>
                      </td>
                      <td className="py-4 text-gray-300">{verdeler.kastNaam || "Naamloos"}</td>
                      <td className="py-4 text-gray-300">{verdeler.toegewezenMonteur || "Vrij"}</td>
                      <td className="py-4">
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
                          {verdeler.status || 'Productie'}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${testStatus.color}`}>
                          {testStatus.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {(() => {
                          const verdelerCodes = getVerdelerAccessCodes(verdeler.distributorId);
                          if (verdelerCodes.length === 0) {
                            return <span className="text-gray-400 text-sm">Geen codes</span>;
                          }
                          
                          const activeCodes = verdelerCodes.filter(code => isCodeValid(code));
                          const expiredCodes = verdelerCodes.filter(code => !isCodeValid(code));
                          
                          return (
                            <div className="space-y-1">
                              {activeCodes.map(code => (
                                <div key={code.id} className="flex items-center space-x-2">
                                  <CheckCircle size={12} className="text-green-400" />
                                  <span className="text-green-400 font-mono text-sm">{code.code}</span>
                                </div>
                              ))}
                              {expiredCodes.map(code => (
                                <div key={code.id} className="flex items-center space-x-2">
                                  <XCircle size={12} className="text-red-400" />
                                  <span className="text-red-400 font-mono text-sm line-through">{code.code}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-4 text-gray-300">{verdeler.systeem || "-"}</td>
                      <td className="py-4">
                        <span className="text-gray-300">
                          {verdeler.unInV
                            ? verdeler.unInV.toString().endsWith('V')
                              ? verdeler.unInV
                              : `${verdeler.unInV} V`
                            : "-"
                          }
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Show "Checklist goedkeuring" button only if checklist has been submitted */}
                          {hasChecklistSubmitted(verdeler) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenChecklist(verdeler);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
                              title="Checklist goedkeuring"
                            >
                              <CheckSquare size={16} className="text-white" />
                              <span className="text-white text-sm font-medium">Checklist goedkeuring</span>
                            </button>
                          )}
                          {/* Show "Levering Checklist" button when verdeler status is "Levering" and testing hours are logged */}
                          {verdeler.status === 'Levering' && testingHoursLogged[verdeler.id] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenLeveringChecklist(verdeler);
                              }}
                              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-2 ${
                                deliveryCompletionStatus[verdeler.id]
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                              title={deliveryCompletionStatus[verdeler.id] ? 'Checklist Voltooid' : 'Levering Checklist'}
                            >
                              {deliveryCompletionStatus[verdeler.id] ? (
                                <CheckCircle size={16} className="text-white" />
                              ) : (
                                <Truck size={16} className="text-white" />
                              )}
                              <span className="text-white text-sm font-medium">
                                {deliveryCompletionStatus[verdeler.id] ? 'Checklist Voltooid' : 'Levering Checklist'}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerdelerClick(verdeler);
                            }}
                            className="p-2 bg-[#2A303C] hover:bg-blue-500/20 rounded-lg transition-colors group"
                            title="Details"
                          >
                            <Eye size={16} className="text-gray-400 group-hover:text-blue-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVerdeler(verdeler.id);
                            }}
                            className="p-2 bg-[#2A303C] hover:bg-red-500/20 rounded-lg transition-colors group"
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

      {/* Verdeler Details Modal */}
      {showVerdelerDetails && selectedVerdeler && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#2A303C] flex items-center justify-center flex-shrink-0">
                  {selectedVerdeler.profilePhoto ? (
                    <img
                      src={selectedVerdeler.profilePhoto}
                      alt={selectedVerdeler.kastNaam}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs text-center">
                      Geen<br />foto
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-green-400">
                    {selectedVerdeler.distributorId}
                  </h2>
                  <p className="text-gray-400">{selectedVerdeler.kastNaam || 'Naamloos'}</p>
                </div>
              </div>
              <button
                onClick={handleCloseDetails}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Verdeler Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basis Informatie */}
                <div className="bg-[#2A303C] p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">Basis Informatie</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Verdeler ID:</span>
                      <p className="text-white font-medium">{selectedVerdeler.distributorId}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Kastnaam:</span>
                      <p className="text-white font-medium">{selectedVerdeler.kastNaam || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Toegewezen monteur:</span>
                      <p className="text-white">{selectedVerdeler.toegewezenMonteur || 'Vrij'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <p className="text-white">{selectedVerdeler.status || 'Productie'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Stelsel:</span>
                      <p className="text-white">{selectedVerdeler.systeem || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Voeding:</span>
                      <p className="text-white">{selectedVerdeler.voeding ? `${selectedVerdeler.voeding}A` : '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Stuurspanning:</span>
                      <p className="text-white">{selectedVerdeler.stuurspanning || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">kA Waarde:</span>
                      <p className="text-white">{(selectedVerdeler.kaWaarde || selectedVerdeler.ka_waarde) ? `${selectedVerdeler.kaWaarde || selectedVerdeler.ka_waarde} kA` : '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Bouwjaar:</span>
                      <p className="text-white">{selectedVerdeler.bouwjaar || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Fabrikant:</span>
                      <p className="text-white">{selectedVerdeler.fabrikant || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Voorcalculatorische uren:</span>
                      <p className="text-white">{selectedVerdeler.expectedHours || selectedVerdeler.expected_hours || '-'} uur</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Gewenste leverdatum:</span>
                      <p className="text-white">
                        {(() => {
                          const date = selectedVerdeler.deliveryDate || selectedVerdeler.gewenste_lever_datum;
                          if (!date) return '-';
                          const dateStr = typeof date === 'string' ? date.split('T')[0] : date;
                          return dateStr;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Technische Specificaties */}
                <div className="bg-[#2A303C] p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">Technische Specificaties</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Un in V:</span>
                      <p className="text-white">{selectedVerdeler.unInV || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">In in A:</span>
                      <p className="text-white">{selectedVerdeler.inInA || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Ik Th in KA 1s:</span>
                      <p className="text-white">{selectedVerdeler.ikThInKA1s || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Ik Dyn in KA:</span>
                      <p className="text-white">{selectedVerdeler.ikDynInKA || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Freq. in Hz:</span>
                      <p className="text-white">{selectedVerdeler.freqInHz || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Type nr. HS:</span>
                      <p className="text-white">{selectedVerdeler.typeNrHs || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Access Codes Display */}
                {(() => {
                  const verdelerCodes = getVerdelerAccessCodes(selectedVerdeler.distributorId);
                  
                  return verdelerCodes.length > 0 ? (
                    <div className="bg-[#2A303C] p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-orange-400 mb-4">Actieve Toegangscodes</h3>
                      <div className="space-y-3">
                        {verdelerCodes.map((code) => (
                          <div key={code.id} className="flex items-center justify-between p-3 bg-[#1E2530] rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-lg">{code.code}</span>
                              <div className="flex items-center space-x-1">
                                {isCodeValid(code) ? (
                                  <CheckCircle size={16} className="text-green-400" />
                                ) : (
                                  <XCircle size={16} className="text-red-400" />
                                )}
                                <span className={isCodeValid(code) ? 'text-green-400' : 'text-red-400'}>
                                  {isCodeValid(code) ? 'Actief' : 'Verlopen'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <Clock size={14} />
                              <span>{new Date(code.expires_at).toLocaleDateString('nl-NL')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Action Buttons Sidebar */}
              <div className="space-y-4">
                <div className="bg-[#2A303C] p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-400 mb-4">Acties</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleEditVerdeler(selectedVerdeler)}
                      className="btn-secondary w-full flex items-center space-x-2"
                    >
                      <Edit size={16} />
                      <span>Bewerken</span>
                    </button>
                    
                    <button
                      onClick={() => handleGenerateAccessCode(selectedVerdeler)}
                      className="btn-secondary w-full flex items-center space-x-2"
                    >
                      <Key size={16} />
                      <span>Toegangscode</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowVerdelerDetails(false);
                        handleDeleteVerdeler(selectedVerdeler.id);
                      }}
                      className="btn-secondary w-full flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                      <Trash2 size={16} />
                      <span>Verwijderen</span>
                    </button>
                  </div>
                </div>

                {/* Testing Actions */}
                <div className="bg-[#2A303C] p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Testing</h3>
                  {!isPreTestApproved(selectedVerdeler) ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="text-yellow-400 font-medium">Testing Niet Beschikbaar</p>
                          {verdelers.length === 1 ? (
                            <>
                              <p className="text-gray-400 text-sm mt-1">
                                Dit project heeft 1 verdeler. Gebruik project-level testing.
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                Verander de <span className="font-semibold text-blue-400">project status</span> naar "Testen" om test functies te activeren.
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                Huidige project status: <span className="font-semibold text-blue-400">{projectData.status || 'Onbekend'}</span>
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-gray-400 text-sm mt-1">
                                Dit project heeft {verdelers.length} verdelers. Gebruik verdeler-level testing.
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                Testing is alleen beschikbaar nadat de pre-test checklist is goedgekeurd door een tester.
                              </p>
                              <p className="text-gray-400 text-sm mt-1">
                                Huidige verdeler status: <span className="font-semibold text-blue-400">{selectedVerdeler.status || 'Onbekend'}</span>
                              </p>
                              {selectedVerdeler.status === 'Testen' && (
                                <p className="text-gray-400 text-sm mt-2">
                                  De pre-test checklist moet eerst ingevuld en goedgekeurd worden.
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <VerdelerTesting
                        verdeler={selectedVerdeler}
                        projectNumber={projectData.project_number || projectData.projectNumber}
                        onComplete={(testData) => handleTestComplete(selectedVerdeler, testData)}
                        projectId={projectData.id}
                        distributorId={selectedVerdeler.id}
                        autoOpen={autoOpenTestForVerdeler === selectedVerdeler.id}
                      />

                      <VerdelerVanaf630Test
                        verdeler={selectedVerdeler}
                        projectNumber={projectData.project_number || ''}
                        onComplete={(testData) => handleTestComplete(selectedVerdeler.id, testData)}
                        projectId={projectData.id}
                        distributorId={selectedVerdeler.id}
                      />

                      <VerdelerTestSimpel
                        verdeler={selectedVerdeler}
                        projectNumber={projectData.project_number || ''}
                        onComplete={(testData) => handleTestComplete(selectedVerdeler.id, testData)}
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
                  )}
                </div>

                {/* Additional Actions */}
                <div className="bg-[#2A303C] p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">Extra</h3>
                  <div className="space-y-3">
                    <PrintLabel
                      verdeler={selectedVerdeler}
                      projectNumber={projectData.project_number || projectData.projectNumber}
                      logo={ewpLogo}
                    />
                    <MPrintLabel
                      verdeler={selectedVerdeler}
                      projectNumber={projectData.project_number || projectData.projectNumber}
                      logo={ewpLogo}
                    />
                    {selectedVerdeler?.status === 'Levering' && (
                      <button
                        onClick={() => handleGeneratePakbon(selectedVerdeler)}
                        disabled={generatingPakbon}
                        className={`w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${
                          generatingPakbon ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {generatingPakbon ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            <span>Genereren...</span>
                          </>
                        ) : (
                          <>
                            <FileText size={16} />
                            <span>Pakbon</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verdeler Form Modal (Add/Edit) */}
      {showVerdelerForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-800 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[60vh] overflow-y-auto">
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
              {/* Basis Informatie */}
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
                      placeholder="Kastnaam"
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
                      <option value="Vrij">Vrij</option>
                      {getMontageUsers().map(user => (
                        <option key={user.id} value={user.username}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Voorcalculatorische uren
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="input-field"
                      value={verdelerData.expectedHours}
                      onChange={(e) => handleInputChange('expectedHours', e.target.value)}
                      placeholder="8.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Verwachte werkuren voor deze verdeler
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Gewenste leverdatum
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      value={verdelerData.deliveryDate}
                      onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Specifieke leverdatum voor deze verdeler (optioneel)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Stelsel</label>
                    <select
                      className="input-field"
                      value={verdelerData.systeem}
                      onChange={(e) => {
                        const value = e.target.value;
                        setVerdelerData(prev => ({
                          ...prev,
                          systeem: value,
                          systeemCustom: value !== 'custom' ? '' : prev.systeemCustom
                        }));
                      }}
                    >
                      <option value="">Selecteer stelsel</option>
                      <option value="TN-S">TN-S</option>
                      <option value="TN-C">TN-C</option>
                      <option value="TN-C-S">TN-C-S</option>
                      <option value="TT">TT</option>
                      <option value="custom">Zelf invullen</option>
                    </select>
                    {verdelerData.systeem === 'custom' && (
                      <input
                        type="text"
                        className="input-field mt-2"
                        value={verdelerData.systeemCustom}
                        onChange={(e) => handleInputChange('systeemCustom', e.target.value)}
                        placeholder="Vul stelsel in"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Binnenkomende voeding</label>
                    <select
                      className="input-field"
                      value={verdelerData.voeding}
                      onChange={(e) => {
                        const value = e.target.value;
                        setVerdelerData(prev => ({
                          ...prev,
                          voeding: value,
                          voedingCustom: value !== 'custom' ? '' : prev.voedingCustom
                        }));
                      }}
                    >
                      <option value="">Selecteer voeding</option>
                      <option value="40">40</option>
                      <option value="63">63</option>
                      <option value="80">80</option>
                      <option value="100">100</option>
                      <option value="125">125</option>
                      <option value="160">160</option>
                      <option value="250">250</option>
                      <option value="400">400</option>
                      <option value="630">630</option>
                      <option value="750">750</option>
                      <option value="800">800</option>
                      <option value="1000">1000</option>
                      <option value="1250">1250</option>
                      <option value="1400">1400</option>
                      <option value="1600">1600</option>
                      <option value="2000">2000</option>
                      <option value="2500">2500</option>
                      <option value="3200">3200</option>
                      <option value="4000">4000</option>
                      <option value="5000">5000</option>
                      <option value="6300">6300</option>
                      <option value="custom">Zelf invullen</option>
                    </select>
                    {verdelerData.voeding === 'custom' && (
                      <input
                        type="text"
                        className="input-field mt-2"
                        value={verdelerData.voedingCustom}
                        onChange={(e) => handleInputChange('voedingCustom', e.target.value)}
                        placeholder="Vul voeding in"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Stuurspanning</label>
                    {verdelerData.stuurspanning !== 'Zelf invullen' ? (
                      <select
                        className="input-field"
                        value={verdelerData.stuurspanning}
                        onChange={(e) => {
                          handleInputChange('stuurspanning', e.target.value);
                          if (e.target.value !== 'Zelf invullen') {
                            handleInputChange('stuurspanningCustom', '');
                          }
                        }}
                      >
                        <option value="">Selecteer stuurspanning</option>
                        <option value="N.V.T.">N.V.T.</option>
                        <option value="230V AC">230V AC</option>
                        <option value="24V AC">24V AC</option>
                        <option value="12V AC">12V AC</option>
                        <option value="8V AC">8V AC</option>
                        <option value="30V DC">30V DC</option>
                        <option value="24V DC">24V DC</option>
                        <option value="12V DC">12V DC</option>
                        <option value="Zelf invullen">Zelf invullen</option>
                      </select>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="input-field"
                          value={verdelerData.stuurspanningCustom}
                          onChange={(e) => handleInputChange('stuurspanningCustom', e.target.value)}
                          placeholder="bijv. 48V DC"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('stuurspanning', '');
                            handleInputChange('stuurspanningCustom', '');
                          }}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          ← Terug naar dropdown
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">kA Waarde</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.kaWaarde}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Remove 'kA' if it exists to prevent duplication
                        value = value.replace(/\s*kA\s*$/i, '');
                        handleInputChange('kaWaarde', value);
                      }}
                      placeholder="Bijv. 25"
                    />
                    <p className="text-xs text-gray-500 mt-1">Waarde wordt automatisch aangevuld met 'kA'</p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">IP-Waarde</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.ipWaarde}
                      onChange={(e) => handleInputChange('ipWaarde', e.target.value)}
                      placeholder="Bijv. 65"
                    />
                    <p className="text-xs text-gray-500 mt-1">Standaard waarde is 65</p>
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
                    <label className="block text-sm text-gray-400 mb-2">Status</label>
                    <select
                      className="input-field"
                      value={verdelerData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      disabled={isProjectOfferte}
                    >
                      <option value="Offerte">Offerte</option>
                      {!isProjectOfferte && (
                        <>
                          <option value="Productie">Productie</option>
                          <option value="Testen">Testen</option>
                          <option value="Gereed">Gereed</option>
                          <option value="Levering">Levering</option>
                          <option value="Opgeleverd">Opgeleverd</option>
                        </>
                      )}
                    </select>
                    {isProjectOfferte && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Status is vergrendeld omdat project status "Offerte" is
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Fabrikant</label>
                    <select
                      className="input-field"
                      value={verdelerData.fabrikant}
                      onChange={(e) => handleInputChange('fabrikant', e.target.value)}
                    >
                      <option value="">Selecteer fabrikant</option>
                      <option value="Schneider Electric">Schneider Electric</option>
                      <option value="ABB">ABB</option>
                      <option value="Siemens">Siemens</option>
                      <option value="Eaton">Eaton</option>
                      <option value="Legrand">Legrand</option>
                      <option value="Hager">Hager</option>
                      <option value="Hensel">Hensel</option>
                      <option value="Halyster">Halyster</option>
                      <option value="Rittal">Rittal</option>
                      <option value="Phoenix Contact">Phoenix Contact</option>
                      <option value="Weidmüller">Weidmüller</option>
                      <option value="Anders">Anders</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Technische Specificaties */}
              <div>
                <h3 className="text-lg font-semibold text-purple-400 mb-4">Technische Specificaties</h3>
                {!canEditTechnicalSpecs && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={16} className="text-yellow-400" />
                      <span className="text-yellow-400 text-sm">
                        Technische specificaties kunnen alleen worden ingevuld wanneer project status "Productie" of hoger is
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Un in V</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.unInV}
                      onChange={(e) => handleInputChange('unInV', e.target.value)}
                      onBlur={(e) => {
                        const formatted = formatTechnicalValue(e.target.value, 'V');
                        handleInputChange('unInV', formatted);
                      }}
                      placeholder="400 V"
                      disabled={!canEditTechnicalSpecs}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">In in A</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.inInA}
                      onChange={(e) => handleInputChange('inInA', e.target.value)}
                      onBlur={(e) => {
                        const formatted = formatTechnicalValue(e.target.value, 'A');
                        handleInputChange('inInA', formatted);
                      }}
                      placeholder="400 A"
                      disabled={!canEditTechnicalSpecs}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ik Th in KA 1s</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.ikThInKA1s}
                      onChange={(e) => handleInputChange('ikThInKA1s', e.target.value)}
                      onBlur={(e) => {
                        const formatted = formatTechnicalValue(e.target.value, 'KA');
                        handleInputChange('ikThInKA1s', formatted);
                      }}
                      placeholder="25 KA"
                      disabled={!canEditTechnicalSpecs}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Ik Dyn in KA</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.ikDynInKA}
                      onChange={(e) => handleInputChange('ikDynInKA', e.target.value)}
                      onBlur={(e) => {
                        const formatted = formatTechnicalValue(e.target.value, 'KA');
                        handleInputChange('ikDynInKA', formatted);
                      }}
                      placeholder="65 KA"
                      disabled={!canEditTechnicalSpecs}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Freq. in Hz</label>
                    <input
                      type="text"
                      className="input-field"
                      value={verdelerData.freqInHz}
                      onChange={(e) => handleInputChange('freqInHz', e.target.value)}
                      onBlur={(e) => {
                        const formatted = formatTechnicalValue(e.target.value, 'Hz');
                        handleInputChange('freqInHz', formatted);
                      }}
                      placeholder="50 Hz"
                      disabled={!canEditTechnicalSpecs}
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
                      disabled={!canEditTechnicalSpecs}
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
                className="btn-primary"
              >
                {editingVerdeler ? 'Verdeler bijwerken' : 'Verdeler toevoegen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Code Form Modal */}
      {showAccessCodeForm && selectedVerdeler && (
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
                    onClick={() => {
                      navigator.clipboard.writeText(newAccessCode.code);
                      toast.success('Code gekopieerd!');
                    }}
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
            onClick={handleNext}
            className="btn-primary"
          >
            Volgende stap
          </button>
        </div>
      )}

      {/* Pre-Testing Approval Modal */}
      {showPreTestingApproval && verdelerForTesting && currentUser && (
        <VerdelerPreTestingApproval
          distributor={verdelerForTesting}
          currentUser={currentUser}
          onClose={async () => {
            setShowPreTestingApproval(false);
            setVerdelerForTesting(null);
            await loadVerdelersFromDatabase();
          }}
          onApprove={async () => {
            await loadVerdelersFromDatabase();
            await loadPendingNotifications(verdelers);
          }}
          onDecline={async () => {
            // Update verdeler status back to "Productie"
            if (verdelerForTesting) {
              await dataService.updateDistributor(verdelerForTesting.id, { status: 'Productie' });
              await loadVerdelersFromDatabase();
              await loadPendingNotifications(verdelers);
            }
          }}
        />
      )}

      {/* Testing Hours Modal */}
      {showTestingHoursModal && verdelerForTestingHours && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Test uren registreren</h3>
            <p className="text-gray-400 mb-6">
              Voer het aantal uren in dat je hebt besteed aan het testen van {verdelerForTestingHours.kast_naam || verdelerForTestingHours.distributor_id || 'deze verdeler'}.
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
                  setVerdelerForTestingHours(null);
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

      {/* Levering Checklist Modal */}
      {showLeveringChecklist && verdelerForLevering && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gradient">Levering Checklist</h2>
                <button
                  onClick={() => {
                    setShowLeveringChecklist(false);
                    setVerdelerForLevering(null);
                  }}
                  className="p-2 hover:bg-[#2A303C] rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <VerdelerLeveringChecklist
                verdeler={verdelerForLevering}
                onComplete={handleLeveringChecklistComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerdelersStep;