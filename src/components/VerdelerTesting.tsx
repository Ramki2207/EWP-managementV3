import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, CheckSquare, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateVerdelerTestingPDF } from './VerdelerTestingPDF';
import { dataService } from '../lib/supabase';

interface VerdelerTestingProps {
  verdeler: any;
  projectNumber: string;
  onComplete: (testData: any) => void;
  projectId?: string;
  distributorId?: string;
}

const VerdelerTesting: React.FC<VerdelerTestingProps> = ({
  verdeler,
  projectNumber,
  onComplete,
  projectId,
  distributorId
}) => {
  console.log('🔧 VerdelerTesting mounted with:', { projectId, distributorId, verdeler });

  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Initialize test data with your new questions structure
  const initialTestData = useMemo(() => ({
    workshopChecklist: {
      completed: false,
      date: new Date().toISOString().split('T')[0],
      testedBy: '',
      items: [
        // 1. Goederenstroom
        { id: 1, category: 'goederenstroom', field: '1.01', description: 'Ontvangstprocedure volgens ISO 9003', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 2. Railsystemen
        { id: 2, category: 'railsystemen', field: '2.01', description: 'Railsystemen aanwezig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 3, category: 'railsystemen', field: '2.02', description: 'Nominale waarde railsysteem', passed: null, notes: '', options: ['250 A (12×5 mm)', '315 A (20×5 mm)', '400 A (30×5 mm)', '500 A (20×10 mm)', '630 A (30×10 mm)'] },
        { id: 4, category: 'railsystemen', field: '2.03', description: 'Juiste CU-doorsnede toegepast', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 5, category: 'railsystemen', field: '2.04', description: 'Extra coderingen (L1, L2, L3, N, PE)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 6, category: 'railsystemen', field: '2.05', description: 'Kunststof afscherming railsysteem', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 3. Componenten
        { id: 7, category: 'componenten', field: '3.01', description: 'Componenten volgens schema geplaatst', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 8, category: 'componenten', field: '3.02', description: 'Componenten ingesteld (automaten, relais, klokken, meetinstrumenten)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 9, category: 'componenten', field: '3.03', description: 'Voldoende koeling tussen componenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 10, category: 'componenten', field: '3.04', description: 'Rijgklemmen aanwezig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 11, category: 'componenten', field: '3.05', description: 'Rijgklemmen vastgedraaid', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 12, category: 'componenten', field: '3.06', description: 'Juiste kleuren drukknoppen / signaallampen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 13, category: 'componenten', field: '3.07', description: 'Juiste spanning signaallampen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 14, category: 'componenten', field: '3.08', description: 'Juiste spoelspanning besturingscomponenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 15, category: 'componenten', field: '3.09', description: 'Mechanische controle schakelaars', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 16, category: 'componenten', field: '3.10', description: 'Componenten in kastdeur gemonteerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 17, category: 'componenten', field: '3.11', description: 'Componenten in kastdeur gecodeerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 4. Interne bedrading
        { id: 18, category: 'interne_bedrading', field: '4.01', description: '90°C bedrading toegepast', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 19, category: 'interne_bedrading', field: '4.02', description: 'Doorsnede juist gekozen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 20, category: 'interne_bedrading', field: '4.03', description: 'Juiste draadkleuren', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 21, category: 'interne_bedrading', field: '4.04', description: 'Bedrading vrij t.o.v. railsysteem', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 22, category: 'interne_bedrading', field: '4.05', description: 'Juiste railklemmen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 23, category: 'interne_bedrading', field: '4.06', description: 'Vastgedraaid met juiste momenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 24, category: 'interne_bedrading', field: '4.07', description: 'Overzichtelijk aangelegd (uitbreiding)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 25, category: 'interne_bedrading', field: '4.08', description: 'Bedrading gecodeerd (hoofdstroom, hulpstroom, kleuren, cijfers/letters, symbolen)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 26, category: 'interne_bedrading', field: '4.09', description: 'PEN-sticker aanwezig (bij TNC)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 27, category: 'interne_bedrading', field: '4.10', description: 'Bedrading gebundeld', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 28, category: 'interne_bedrading', field: '4.11', description: 'Bedrading gecontroleerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 5. Montageframe
        { id: 29, category: 'montageframe', field: '5.01', description: 'Controle diepte-instelling componenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 30, category: 'montageframe', field: '5.02', description: 'Frame geplaatst in verdeler', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 31, category: 'montageframe', field: '5.03', description: 'Frame bevestigd aan beschermingsleiding (sticker zichtbaar)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 32, category: 'montageframe', field: '5.04', description: 'Scheidingsschotten opgenomen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 33, category: 'montageframe', field: '5.05', description: 'Deur(en) bevestigd aan beschermingsleiding (sticker zichtbaar)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 34, category: 'montageframe', field: '5.06', description: 'Bij kunststof verdelers: frame/deur niet verbinden met aarde', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 6. Beproeving
        { id: 35, category: 'beproeving', field: '6.01', description: 'Routineproef: inspectie verdeler, functionele proef, aardlek-test, schakelingen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 36, category: 'beproeving', field: '6.02', description: 'Functietest beproevingsapparatuur', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 37, category: 'beproeving', field: '6.03', description: 'Toetsing beschermingsmaatregelen & PE-verbinding', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 38, category: 'beproeving', field: '6.04', description: 'Hoogspanningstest (1000V, 2000V, 2500V afhankelijk van spanning)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 39, category: 'beproeving', field: '6.05', description: 'Functietest apparatuur', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 40, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand meten (≥300 MΩ)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 41, category: 'beproeving', field: '6.07', description: 'Kruip- en luchtwegen volgens norm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 7. Eindafwerking
        { id: 42, category: 'eindafwerking', field: '7.01', description: 'Tekeninghouder opgenomen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 43, category: 'eindafwerking', field: '7.02', description: 'Tekeningen en handleidingen meegeleverd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 44, category: 'eindafwerking', field: '7.03', description: 'Wandbevestigingsbeugels aanwezig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 45, category: 'eindafwerking', field: '7.04', description: 'Deursleutels meegeleverd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 46, category: 'eindafwerking', field: '7.05', description: 'Rijgklemmen gecodeerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 47, category: 'eindafwerking', field: '7.06', description: 'Groepencodering op afdekplaten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 48, category: 'eindafwerking', field: '7.07', description: 'Creditcard en keuringssticker in kastdeur', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 49, category: 'eindafwerking', field: '7.08', description: 'Flensplaten gemonteerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 50, category: 'eindafwerking', field: '7.09', description: 'Warmteberekening uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 51, category: 'eindafwerking', field: '7.10', description: 'Algemene reiniging uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 8. Eindcontrole
        { id: 52, category: 'eindcontrole', field: '8.01', description: 'Keuringsrapport volledig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 53, category: 'eindcontrole', field: '8.02', description: 'Kopie rapport + sticker toegevoegd aan projectgegevens', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 9. Diversen
        { id: 54, category: 'diversen', field: '9.01', description: 'Vrije opmerkingenvelden', passed: null, notes: '', options: ['text'] }
      ]
    },
    inspectionReport: {
      completed: false,
      date: new Date().toISOString().split('T')[0],
      inspectedBy: '',
      approvedBy: '',
      result: null,
      notes: '',
      items: [
        { id: 1, description: 'Voldoet aan technische specificaties', passed: null, notes: '' },
        { id: 2, description: 'Voldoet aan veiligheidseisen', passed: null, notes: '' },
        { id: 3, description: 'Documentatie compleet', passed: null, notes: '' },
        { id: 4, description: 'Testresultaten goedgekeurd', passed: null, notes: '' },
      ]
    }
  }), []);

  const [testData, setTestData] = useState(initialTestData);

  // Memoize verdeler info to prevent unnecessary re-renders
  const verdelerInfo = useMemo(() => ({
    id: verdeler.id,
    displayId: verdeler.distributorId || verdeler.distributor_id,
    name: verdeler.kastNaam || verdeler.kast_naam || 'Naamloos'
  }), [verdeler.id, verdeler.distributorId, verdeler.distributor_id, verdeler.kastNaam, verdeler.kast_naam]);

  useEffect(() => {
    const loadTestData = async () => {
      try {
        // First try to load from database
        const dbTestData = await dataService.getTestData(verdelerInfo.id);
        const workshopTest = dbTestData?.find((test: any) => test.test_type === 'workshop_checklist');

        if (workshopTest && workshopTest.data) {
          console.log('✅ VERDELER TESTING: Loading from database');
          setTestData(workshopTest.data);

          // Check if workshopChecklist is completed to determine the step
          if (workshopTest.data.workshopChecklist?.completed) {
            setCurrentStep(1);
            toast.info('Werkplaats Checklist is voltooid - ga verder met Keuringsrapport');
          } else {
            const hasWorkshopData = workshopTest.data.workshopChecklist?.items?.some((item: any) =>
              item.passed !== null || item.notes !== ''
            );
            if (hasWorkshopData) {
              toast.info('Werkplaats Checklist opgeslagen data geladen - ga verder waar je gebleven was');
            }
          }
          return;
        }

        // Fallback to localStorage if no database data
        const storageKey = `verdeler_test_${verdelerInfo.id}`;
        const savedTestData = localStorage.getItem(storageKey);

        if (savedTestData) {
          try {
            const parsed = JSON.parse(savedTestData);
            const hasNewStructure = parsed.workshopChecklist?.items?.some((item: any) => item.field);

            if (!hasNewStructure) {
              console.log('Old test data structure detected, clearing cache for:', verdelerInfo.id);
              localStorage.removeItem(storageKey);
              toast.info('Test data structure updated - starting fresh');
              setTestData(initialTestData);
            } else {
              console.log('📦 VERDELER TESTING: Loading from localStorage');
              setTestData(parsed);

              // Check if workshopChecklist is completed to determine the step
              if (parsed.workshopChecklist?.completed) {
                setCurrentStep(1);
                toast.info('Werkplaats Checklist is voltooid - ga verder met Keuringsrapport');
              } else {
                // Check if there's any data filled in the workshopChecklist
                const hasWorkshopData = parsed.workshopChecklist?.items?.some((item: any) =>
                  item.passed !== null || item.notes !== ''
                );
                if (hasWorkshopData) {
                  toast.info('Werkplaats Checklist opgeslagen data geladen - ga verder waar je gebleven was');
                }
              }
            }
          } catch (error) {
            console.error('Error parsing saved test data:', error);
            localStorage.removeItem(storageKey);
            setTestData(initialTestData);
          }
        } else {
          console.log('🆕 VERDELER TESTING: No existing data, using initial');
          setTestData(initialTestData);
        }
      } catch (error) {
        console.error('Error loading test data from database:', error);
        // Fallback to localStorage on database error
        const storageKey = `verdeler_test_${verdelerInfo.id}`;
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          setTestData(JSON.parse(savedData));
        } else {
          setTestData(initialTestData);
        }
      }
    };

    loadTestData();
  }, [verdelerInfo.id, initialTestData]);

  const saveTestData = useCallback((): boolean => {
    try {
      localStorage.setItem(`verdeler_test_${verdelerInfo.id}`, JSON.stringify(testData));
      onComplete(testData);
      return true;
    } catch (error) {
      console.error('Error saving test data:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de testgegevens');
      return false;
    }
  }, [testData, verdelerInfo.id, onComplete]);

  const handleStepComplete = useCallback(async () => {
    const steps = ['workshopChecklist', 'inspectionReport'];
    const currentStepName = steps[currentStep];
    
    const updatedTestData = {
      ...testData,
      [currentStepName]: {
        ...testData[currentStepName],
        completed: true
      }
    };
    
    setTestData(updatedTestData);
    
    // Save immediately with updated data
    try {
      localStorage.setItem(`verdeler_test_${verdelerInfo.id}`, JSON.stringify(updatedTestData));
      onComplete(updatedTestData);
    } catch (error) {
      console.error('Error saving test data:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de testgegevens');
      return;
    }
    
    if (currentStep < 1) {
      setCurrentStep(currentStep + 1);
      toast.success('Werkplaats Checklist succesvol afgerond!');
    } else {
      // Generate PDF when inspection report is completed
      try {
        setGeneratingPDF(true);
        await generateVerdelerTestingPDF(
          updatedTestData, 
          verdeler, 
          projectNumber,
          projectId,
          distributorId
        );
        toast.success('Keuringsrapport voltooid en PDF automatisch opgeslagen!');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Keuringsrapport voltooid, maar PDF generatie mislukt');
      } finally {
        setGeneratingPDF(false);
      }
      
      toast.success('Keuringsrapport succesvol afgerond!');
      setShowModal(false);
    }
  }, [currentStep, testData, verdelerInfo.id, onComplete, verdeler, projectNumber, projectId, distributorId]);

  const handleRestartTest = () => {
    if (window.confirm('Weet je zeker dat je de test opnieuw wilt starten? Alle huidige gegevens gaan verloren.')) {
      // Clear cached data
      localStorage.removeItem(`verdeler_test_${verdelerInfo.id}`);
      
      // Reset to initial state
      setTestData(initialTestData);
      setCurrentStep(0);
      
      toast.success('Test herstart - je kunt opnieuw beginnen');
    }
  };

  // Create stable, memoized change handlers
  const handleBasicFieldChange = useCallback((step: string, field: string) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTestData(prev => ({
        ...prev,
        [step]: {
          ...prev[step],
          [field]: value
        }
      }));
    };
  }, []);

  const handleItemChange = useCallback((step: string, id: number, field: string, value: any) => {
    setTestData(prev => {
      const newData = { ...prev };
      const stepData = { ...newData[step] };
      const items = [...stepData.items];
      const itemIndex = items.findIndex((item: any) => item.id === id);
      
      if (itemIndex !== -1) {
        items[itemIndex] = { ...items[itemIndex], [field]: value };
      }
      
      stepData.items = items;
      newData[step] = stepData;
      return newData;
    });
  }, []);

  const isStepComplete = useCallback((step: string) => {
    if (step === 'workshopChecklist') {
      return testData.workshopChecklist.items.every((item: any) => {
        // For text fields (like Diversen), they are optional
        if (item.options && item.options.includes('text')) {
          return true; // Text fields are optional
        }
        // For other fields, check if passed is set
        return item.passed !== null && item.passed !== undefined && item.passed !== '';
      }) && 
             testData.workshopChecklist.testedBy.trim() !== '';
    } else if (step === 'inspectionReport') {
      return testData.inspectionReport.items.every((item: any) => item.passed !== null && item.passed !== undefined) && 
             testData.inspectionReport.inspectedBy.trim() !== '' &&
             testData.inspectionReport.approvedBy.trim() !== '' &&
             testData.inspectionReport.result !== null;
    }
    return false;
  }, [testData]);

  // Memoize change handlers for each step
  const workshopDateHandler = useMemo(() => handleBasicFieldChange('workshopChecklist', 'date'), [handleBasicFieldChange]);
  const workshopTesterHandler = useMemo(() => handleBasicFieldChange('workshopChecklist', 'testedBy'), [handleBasicFieldChange]);
  const inspectionDateHandler = useMemo(() => handleBasicFieldChange('inspectionReport', 'date'), [handleBasicFieldChange]);
  const inspectionInspectedByHandler = useMemo(() => handleBasicFieldChange('inspectionReport', 'inspectedBy'), [handleBasicFieldChange]);
  const inspectionApprovedByHandler = useMemo(() => handleBasicFieldChange('inspectionReport', 'approvedBy'), [handleBasicFieldChange]);
  const inspectionNotesHandler = useMemo(() => handleBasicFieldChange('inspectionReport', 'notes'), [handleBasicFieldChange]);

  const renderWorkshopChecklist = () => {
    const itemsByCategory: Record<string, any[]> = {};
    testData.workshopChecklist.items.forEach((item: any) => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });

    const categoryTitles = {
      goederenstroom: '1. Goederenstroom',
      railsystemen: '2. Railsystemen',
      componenten: '3. Componenten',
      interne_bedrading: '4. Interne bedrading',
      montageframe: '5. Montageframe',
      beproeving: '6. Beproeving',
      eindafwerking: '7. Eindafwerking',
      eindcontrole: '8. Eindcontrole',
      diversen: '9. Diversen'
    };

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-blue-400">Werkplaats Checklist</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Datum</label>
            <input
              type="date"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.workshopChecklist.date}
              onChange={workshopDateHandler}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Getest door</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.workshopChecklist.testedBy}
              onChange={workshopTesterHandler}
              placeholder="Naam monteur"
            />
          </div>
        </div>
        
        {Object.keys(itemsByCategory).map((category) => (
          <div key={category} className="bg-[#1E2530] p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-3 text-blue-400">{categoryTitles[category as keyof typeof categoryTitles]}</h3>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Veld</th>
                  <th className="text-left p-2">Controle</th>
                  <th className="text-center w-32 p-2">Status</th>
                  <th className="text-left p-2">Opmerkingen</th>
                </tr>
              </thead>
              <tbody>
                {itemsByCategory[category].map((item: any) => (
                  <tr key={item.id} className="border-t border-gray-700">
                    <td className="p-2 text-sm text-gray-400">{item.field}</td>
                    <td className="p-2">{item.description}</td>
                    <td className="p-2 text-center">
                      {item.options && item.options.includes('text') ? (
                        <span className="text-sm text-gray-400">Tekstveld</span>
                      ) : item.options && item.options.length <= 4 ? (
                        <div className="flex justify-center space-x-1">
                          {item.options.map((option: string) => (
                            <button
                              key={option}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                item.passed === option 
                                  ? option === 'akkoord' ? 'bg-green-600 text-white' :
                                    option === 'n.v.t.' ? 'bg-yellow-600 text-white' :
                                    option === 'fout' ? 'bg-red-600 text-white' :
                                    option === 'hersteld' ? 'bg-blue-600 text-white' :
                                    'bg-gray-600 text-white'
                                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              }`}
                              onClick={() => handleItemChange('workshopChecklist', item.id, 'passed', option)}
                              title={option}
                            >
                              {option === 'akkoord' ? '✓' :
                               option === 'n.v.t.' ? 'N.v.t.' :
                               option === 'fout' ? '✗' :
                               option === 'hersteld' ? '🔧' :
                               option}
                            </button>
                          ))}
                        </div>
                      ) : item.options && item.options.length > 4 ? (
                        <div className="flex items-center justify-center space-x-2">
                          <select
                            className="bg-[#2A303C] text-white border border-gray-700 rounded p-1 text-xs"
                            value={item.passed || ''}
                            onChange={(e) => handleItemChange('workshopChecklist', item.id, 'passed', e.target.value)}
                          >
                            <option value="">Selecteer...</option>
                            {item.options.map((option: string) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                          {item.field === '2.02' && (
                            <button
                              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                item.passed === 'n.v.t.'
                                  ? 'bg-yellow-600 text-white'
                                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              }`}
                              onClick={() => handleItemChange('workshopChecklist', item.id, 'passed', 'n.v.t.')}
                              title="Niet van toepassing"
                            >
                              n.v.t.
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-center space-x-2">
                          <button
                            className={`p-1 rounded ${item.passed === true ? 'bg-green-600' : 'bg-gray-700 hover:bg-green-600'}`}
                            onClick={() => handleItemChange('workshopChecklist', item.id, 'passed', true)}
                          >
                            <Check size={18} />
                          </button>
                          <button
                            className={`p-1 rounded ${item.passed === false ? 'bg-red-600' : 'bg-gray-700 hover:bg-red-600'}`}
                            onClick={() => handleItemChange('workshopChecklist', item.id, 'passed', false)}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        value={item.notes}
                        onChange={(e) => handleItemChange('workshopChecklist', item.id, 'notes', e.target.value)}
                        placeholder="Opmerkingen"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        
        <div className="flex justify-between mt-4">
          <button
            className="btn-secondary"
            onClick={async () => {
              const saved = await saveTestData();
              if (saved) {
                // Create notification for admin review
                try {
                  if (!projectId || !distributorId) {
                    console.error('Missing projectId or distributorId:', { projectId, distributorId });
                    toast.success('Test opgeslagen! Je kunt later verder gaan.');
                    setShowModal(false);
                    return;
                  }

                  const currentUser = localStorage.getItem('currentUserId');
                  const users = JSON.parse(localStorage.getItem('users') || '[]');
                  const user = users.find((u: any) => u.id === currentUser);

                  console.log('Creating test review notification with:', {
                    projectId,
                    distributorId,
                    testType: 'verdeler_testing_tot_630',
                    submittedBy: user?.name || 'Onbekend'
                  });

                  await dataService.createTestReviewNotification({
                    projectId: projectId,
                    distributorId: distributorId,
                    testType: 'verdeler_testing_tot_630',
                    submittedBy: user?.name || 'Onbekend'
                  });

                  toast.success('Test opgeslagen! Admin is op de hoogte gesteld voor controle.');
                } catch (error) {
                  console.error('Error creating notification:', error);
                  toast.success('Test opgeslagen! Je kunt later verder gaan.');
                }
                setShowModal(false);
              }
            }}
          >
            Opslaan en later verdergaan
          </button>
          <button
            className={`btn-primary ${isStepComplete('workshopChecklist') ? '' : 'opacity-50 cursor-not-allowed'}`}
            onClick={handleStepComplete}
            disabled={!isStepComplete('workshopChecklist')}
          >
            Voltooien en doorgaan naar Keuringsrapport
          </button>
        </div>
      </div>
    );
  };

  const renderInspectionReport = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-blue-400">Keuringsrapport</h2>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Datum</label>
            <input
              type="date"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.inspectionReport.date}
              onChange={inspectionDateHandler}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Geïnspecteerd door</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.inspectionReport.inspectedBy}
              onChange={inspectionInspectedByHandler}
              placeholder="Naam inspecteur"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Goedgekeurd door</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.inspectionReport.approvedBy}
              onChange={inspectionApprovedByHandler}
              placeholder="Naam goedkeurder"
            />
          </div>
        </div>
        
        <div className="bg-[#1E2530] p-4 rounded-lg mb-4">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2">Controle</th>
                <th className="text-center w-24 p-2">Status</th>
                <th className="text-left p-2">Opmerkingen</th>
              </tr>
            </thead>
            <tbody>
              {testData.inspectionReport.items.map((item: any) => (
                <tr key={item.id} className="border-t border-gray-700">
                  <td className="p-2">{item.description}</td>
                  <td className="p-2 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        className={`p-1 rounded ${item.passed === true ? 'bg-green-600' : 'bg-gray-700 hover:bg-green-600'}`}
                        onClick={() => handleItemChange('inspectionReport', item.id, 'passed', true)}
                      >
                        <Check size={18} />
                      </button>
                      <button
                        className={`p-1 rounded ${item.passed === false ? 'bg-red-600' : 'bg-gray-700 hover:bg-red-600'}`}
                        onClick={() => handleItemChange('inspectionReport', item.id, 'passed', false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      value={item.notes}
                      onChange={(e) => handleItemChange('inspectionReport', item.id, 'notes', e.target.value)}
                      placeholder="Opmerkingen"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="bg-[#1E2530] p-4 rounded-lg">
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Eindresultaat</label>
            <div className="flex space-x-4">
              <button
                className={`px-4 py-2 rounded ${testData.inspectionReport.result === 'approved' ? 'bg-green-600' : 'bg-gray-700 hover:bg-green-600'}`}
                onClick={() => setTestData(prev => ({
                  ...prev,
                  inspectionReport: { ...prev.inspectionReport, result: 'approved' }
                }))}
              >
                Goedgekeurd
              </button>
              <button
                className={`px-4 py-2 rounded ${testData.inspectionReport.result === 'conditionallyApproved' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-yellow-600'}`}
                onClick={() => setTestData(prev => ({
                  ...prev,
                  inspectionReport: { ...prev.inspectionReport, result: 'conditionallyApproved' }
                }))}
              >
                Voorwaardelijk goedgekeurd
              </button>
              <button
                className={`px-4 py-2 rounded ${testData.inspectionReport.result === 'rejected' ? 'bg-red-600' : 'bg-gray-700 hover:bg-red-600'}`}
                onClick={() => setTestData(prev => ({
                  ...prev,
                  inspectionReport: { ...prev.inspectionReport, result: 'rejected' }
                }))}
              >
                Afgekeurd
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Opmerkingen</label>
            <textarea
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition h-32"
              value={testData.inspectionReport.notes}
              onChange={inspectionNotesHandler}
              placeholder="Algemene opmerkingen en aanbevelingen"
            />
          </div>
        </div>
        
        <div className="flex justify-between mt-4">
          <button
            className="btn-secondary"
            onClick={() => setCurrentStep(0)}
          >
            Terug
          </button>
          <button
            className={`btn-primary ${isStepComplete('inspectionReport') ? '' : 'opacity-50 cursor-not-allowed'}`}
            onClick={handleStepComplete}
            disabled={!isStepComplete('inspectionReport')}
          >
            Voltooien en afronden
          </button>
        </div>
      </div>
    );
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-6">
        {['Werkplaats Checklist', 'Keuringsrapport'].map((step, index) => (
          <React.Fragment key={index}>
            <div 
              className={`flex flex-col items-center ${index <= currentStep ? 'text-blue-400' : 'text-gray-500'}`}
              onClick={() => {
                if (index < currentStep) {
                  setCurrentStep(index);
                }
              }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index < currentStep 
                  ? 'bg-blue-400 text-white' 
                  : index === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-400'
              } ${index < currentStep ? 'cursor-pointer' : ''}`}>
                {index < currentStep ? <Check size={16} /> : index + 1}
              </div>
              <span className="mt-1 text-sm">{step}</span>
            </div>
            {index < 1 && (
              <div className={`h-[2px] w-16 mx-2 ${index < currentStep ? 'bg-blue-400' : 'bg-gray-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderWorkshopChecklist();
      case 1:
        return renderInspectionReport();
      default:
        return null;
    }
  };

  const getTestStatusBadge = () => {
    if (testData.inspectionReport.completed) {
      const result = testData.inspectionReport.result;
      if (result === 'approved') {
        return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Goedgekeurd</span>;
      } else if (result === 'conditionallyApproved') {
        return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">Voorwaardelijk</span>;
      } else if (result === 'rejected') {
        return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">Afgekeurd</span>;
      }
    } else if (testData.workshopChecklist.completed) {
      return <span className="px-2 py-1 bg-blue-400 text-white text-xs rounded-full">Checklist Voltooid</span>;
    } else {
      // Check if there's any saved progress
      const hasWorkshopData = testData.workshopChecklist.items?.some((item: any) =>
        item.passed !== null || item.notes !== ''
      );
      if (hasWorkshopData) {
        return <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">In uitvoering</span>;
      }
    }
    return <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">Niet getest</span>;
  };

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  }, []);

  // Memoize the modal content to prevent unnecessary re-renders
  const ModalContent = useMemo(() => {
    if (!showModal) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        style={{ zIndex: 999999 }}
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-[#1E2530] rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              Verdeler Testen: {verdelerInfo.id} - {verdelerInfo.name}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          
          {renderStepIndicator()}
          {renderCurrentStep()}
          
          {/* Show restart option if test is completed */}
          {testData.inspectionReport.completed && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-green-400">Test voltooid</h3>
                  <p className="text-sm text-gray-400">PDF rapport is automatisch gegenereerd en opgeslagen</p>
                </div>
                <button
                  onClick={handleRestartTest}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <CheckSquare size={16} />
                  <span>Test opnieuw uitvoeren</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }, [showModal, verdelerInfo, currentStep, testData, handleBackdropClick, isStepComplete, handleStepComplete]);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary flex items-center space-x-2"
        title="Verdeler testen"
      >
        <CheckSquare size={16} />
        <span>Verdeler tot 630</span>
        <div className="ml-2">{getTestStatusBadge()}</div>
      </button>

      {showModal && createPortal(ModalContent, document.body)}
    </>
  );
};

export default VerdelerTesting;