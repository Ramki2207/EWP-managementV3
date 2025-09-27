import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, CheckSquare, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateVerdelerVanaf630PDF } from './VerdelerVanaf630PDF';

interface VerdelerVanaf630TestProps {
  verdeler: any;
  projectNumber: string;
  onComplete: (testData: any) => void;
  projectId?: string;
  distributorId?: string;
}

const VerdelerVanaf630Test: React.FC<VerdelerVanaf630TestProps> = ({ 
  verdeler, 
  projectNumber, 
  onComplete,
  projectId,
  distributorId 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Initialize test data with the new questions structure from PDF
  const initialTestData = useMemo(() => ({
    workshopChecklist: {
      completed: false,
      date: new Date().toISOString().split('T')[0],
      testedBy: '',
      items: [
        // 1. Goederenstroom
        { id: 1, category: 'goederenstroom', field: '1.01', description: 'Ontvangstprocedure volgens ISO 9003', passed: null, notes: '', options: ['akkoord', 'n.v.t.'] },
        
        // 2. Railsystemen
        { id: 2, category: 'railsystemen', field: '2.01', description: 'Railsystemen aanwezig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 3, category: 'railsystemen', field: '2.02a', description: 'Hoofdrailsysteem 2 x 40 x 10 mm 3 Fase + (PE)N', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 4, category: 'railsystemen', field: '2.02b', description: 'Subrailsysteem 80 x 10 mm / Subrailsysteem 40 x 10 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 5, category: 'railsystemen', field: '2.02c', description: 'PE 40 x 10 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 6, category: 'railsystemen', field: '2.03', description: 'Juiste CU-doorsnede toegepast', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 7, category: 'railsystemen', field: '2.04', description: 'Extra coderingen aangebracht op raildrager en/of railsystemen (L1, L2, L3, [PE]N, PE)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 8, category: 'railsystemen', field: '2.05', description: 'Kunststof afschermingen opgenomen op railsysteem i.v.m. nabij liggende bekabeling', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 9, category: 'railsystemen', field: '2.06', description: 'L-profiel(en) 45 x 45 x 8 mm toegepast op railsets en/of voedingsveld', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 3. Componenten
        { id: 10, category: 'componenten', field: '3.01', description: 'Componenten volgens indelingsschets deugdelijk geplaatst', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 11, category: 'componenten', field: '3.02', description: 'Componenten ingesteld - air circuit breaker', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 12, category: 'componenten', field: '3.02', description: 'Componenten ingesteld - vermogensautomaten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 13, category: 'componenten', field: '3.02', description: 'Componenten ingesteld - overige componenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 14, category: 'componenten', field: '3.03', description: 'Voldoende koeling tussen componenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 15, category: 'componenten', field: '3.04', description: 'Rijgklemmen aanwezig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 16, category: 'componenten', field: '3.05', description: 'Rijgklemmen + overige klemmen vastgedraaid', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 17, category: 'componenten', field: '3.06', description: 'Juiste kleuren drukknoppen en / of signaallampen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 18, category: 'componenten', field: '3.07', description: 'Juiste spanning bij signaallampen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 19, category: 'componenten', field: '3.08', description: 'Juiste spoelspanning besturingscomponenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 20, category: 'componenten', field: '3.09', description: 'Mechanische controle schakelaar(s) en componenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 21, category: 'componenten', field: '3.10', description: 'Componenten gemonteerd in kastdeur(en)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 22, category: 'componenten', field: '3.11', description: 'Componenten in kastdeur gecodeerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 4. Interne bedrading
        { id: 23, category: 'interne_bedrading', field: '4.01', description: '90°C bedrading toegepast', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 24, category: 'interne_bedrading', field: '4.02', description: 'Bedradingsdoorsnede juist gekozen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 25, category: 'interne_bedrading', field: '4.03', description: 'Juiste draadkleuren toegepast', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 26, category: 'interne_bedrading', field: '4.04', description: 'Bedrading vrij opgesteld t.o.v. railsysteem', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 27, category: 'interne_bedrading', field: '4.05', description: 'Juiste railklemmen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 28, category: 'interne_bedrading', field: '4.06', description: 'Componenten vastgedraaid met juiste aandraaimomenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 29, category: 'interne_bedrading', field: '4.07', description: 'Bedrading overzichtelijk aangelegd met het oog op eventuele uitbreidingen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 30, category: 'interne_bedrading', field: '4.08', description: 'Bedrading gecodeerd op hoofd- en hulpstroombanen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 31, category: 'interne_bedrading', field: '4.08', description: 'Bedrading gecodeerd - kleuren', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 32, category: 'interne_bedrading', field: '4.08', description: 'Bedrading gecodeerd - cijfers/letters', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 33, category: 'interne_bedrading', field: '4.08', description: 'Bedrading gecodeerd - symbolen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 34, category: 'interne_bedrading', field: '4.09', description: 'Bij TNC-stelsel PEN-sticker op PEN-geleider', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 35, category: 'interne_bedrading', field: '4.10', description: 'Bedrading deugdelijk gebundeld', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 36, category: 'interne_bedrading', field: '4.11', description: 'Bedrading gecontroleerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 5. Montageframe
        { id: 37, category: 'montageframe', field: '5.01', description: 'Controle diepte-instelling - Draagsteunen in voorste positie geplaatst', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 38, category: 'montageframe', field: '5.02', description: 'Frame opgebouwd in verdeler', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 39, category: 'montageframe', field: '5.03', description: 'Volledige frame bevestigd aan beschermingsleiding. Stickers zichtbaar aanbrengen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 40, category: 'montageframe', field: '5.04', description: 'Scheidingsschotten opgenomen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 41, category: 'montageframe', field: '5.05', description: 'Verdelerdeur(en) bevestigd aan beschermingsleiding. Stickers zichtbaar aanbrengen (uitsluitend geaarde verdelers)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 6. Beproeving
        { id: 42, category: 'beproeving', field: '6.01', description: 'Routineproef: Inspecteer verdeler(s), incl. bedrading', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 43, category: 'beproeving', field: '6.01', description: 'Elektrische functionele proef uitgevoerd met nominale bedrijfsspanning', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 44, category: 'beproeving', field: '6.01', description: 'Alle eindgroepen functioneren', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 45, category: 'beproeving', field: '6.01', description: 'Aardlek-elementen getest (via foutstroom)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 46, category: 'beproeving', field: '6.01', description: 'Overige schakelingen gecontroleerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 47, category: 'beproeving', field: '6.02', description: 'Functietest beproevingsapparatuur uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 48, category: 'beproeving', field: '6.03', description: 'Routineproef: Toetsing beschermingsmaatregelen en doorgaande verbinding van de stroombaan van de beschermingsleiding. PE; standaard 40 x 10 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 49, category: 'beproeving', field: '6.04', description: 'Routineproef: hoogspanningstest - 1 sec. 1000 V bij 24 V (Ui ≤ 60 V)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 50, category: 'beproeving', field: '6.04', description: 'Routineproef: hoogspanningstest - 1 sec. 2000 V bij 230 V (60 V < Ui ≤ 300 V)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 51, category: 'beproeving', field: '6.04', description: 'Routineproef: hoogspanningstest - 1 sec. 2500 V bij 400 V (300 V < Ui ≤ 660 V)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 52, category: 'beproeving', field: '6.04', description: 'Frequentie tussen 45 en 62 Hz', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 53, category: 'beproeving', field: '6.04', description: 'Spanningsproef uitgevoerd - Alle schakeltoestellen bevinden zich in ingeschakelde toestand', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 54, category: 'beproeving', field: '6.04', description: 'Spanningsproef uitgevoerd - Proefspanning is achtereenvolgens aan alle onderdelen van stroombron aangelegd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 55, category: 'beproeving', field: '6.04', description: 'Let op isolatiespanning van componenten! Juiste proefspanningen gecontroleerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 56, category: 'beproeving', field: '6.04', description: 'Componenten geschikt voor lagere isolatiespanning elektrisch losgekoppeld', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 57, category: 'beproeving', field: '6.04', description: 'Testprocedure uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 58, category: 'beproeving', field: '6.04', description: 'Geen doorslag óf overslag geconstateerd (proef is geslaagd)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 59, category: 'beproeving', field: '6.04', description: 'Losgekoppelde componenten elektrisch aangesloten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 60, category: 'beproeving', field: '6.04', description: '2e spanningsproef uitgevoerd ter plaatste bij opstelling', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 61, category: 'beproeving', field: '6.04', description: 'Geen doorslag óf overslag geconstateerd (proef is geslaagd)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 62, category: 'beproeving', field: '6.05', description: 'Functietest beproevingsapparatuur uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 63, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand - Fase t.o.v. omhulling/aarde: ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 64, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand - Fase t.o.v. Fase (L1-L2, L1-L3, L2-L3): ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 65, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand - Hulpstroomkring t.o.v. omhulling/constructiedelen: ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 66, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand - N t.o.v. PE: ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 67, category: 'beproeving', field: '6.07', description: 'Kruip- en luchtwegen volgens bepaling fabrikant 1600A handboek', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 7. Eindafwerking
        { id: 68, category: 'eindafwerking', field: '7.01', description: 'Tekeninghouder opgenomen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 69, category: 'eindafwerking', field: '7.02', description: 'Tekeningen + producthandleidingen meegeleverd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 70, category: 'eindafwerking', field: '7.03', description: 'Deursleutels meegeleverd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 71, category: 'eindafwerking', field: '7.04', description: 'Rijgklemmen gecodeerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 72, category: 'eindafwerking', field: '7.05', description: 'Groepencodering op afdekplaten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 73, category: 'eindafwerking', field: '7.06', description: 'Sticker ingevuld volgens HSA-normen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 74, category: 'eindafwerking', field: '7.07', description: 'Creditcard en keuringsticker geplaatst aan de binnenzijde van de kastdeur', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 75, category: 'eindafwerking', field: '7.08', description: 'Flensplaten gemonteerd in verdeler', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 76, category: 'eindafwerking', field: '7.09', description: 'Alle juiste aandraaimomenten op railsystemen / railverbindingen / componenten gecontroleerd en afgelakt', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 77, category: 'eindafwerking', field: '7.10', description: 'Warmteberekening uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 78, category: 'eindafwerking', field: '7.11', description: 'Algemene reiniging verdeler uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 8. Uitlevering
        { id: 79, category: 'uitlevering', field: '8.01', description: 'Documenten gereed voor uitleveringsprocedure volgens ISO 9003', passed: null, notes: '', options: ['akkoord', 'n.v.t.'] },
        
        // 9. Eindcontrole
        { id: 80, category: 'eindcontrole', field: '9.01', description: 'Verdelercombinatie samengesteld conform Fabrikant 1600A handboek', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 81, category: 'eindcontrole', field: '9.02', description: 'Keuringsrapport volledig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 82, category: 'eindcontrole', field: '9.03', description: 'Kopie keuringsrapport + kopie sticker toegevoegd aan eigen projectgegevens', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 10. Diversen
        { id: 83, category: 'diversen', field: '10.01', description: 'Vrije opmerkingenvelden', passed: null, notes: '', options: ['text'] }
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
    id: verdeler.distributorId || verdeler.distributor_id,
    name: verdeler.kastNaam || verdeler.kast_naam || 'Naamloos'
  }), [verdeler.distributorId, verdeler.distributor_id, verdeler.kastNaam, verdeler.kast_naam]);

  useEffect(() => {
    // Load existing test data
    const storageKey = `verdeler_vanaf_630_test_${verdelerInfo.id}`;
    
    const savedTestData = localStorage.getItem(storageKey);
    if (savedTestData) {
      try {
        const parsed = JSON.parse(savedTestData);
        setTestData(parsed);
      } catch (error) {
        console.error('Error parsing saved test data:', error);
        localStorage.removeItem(storageKey);
        setTestData(initialTestData);
      }
    } else {
      setTestData(initialTestData);
    }
  }, [verdelerInfo.id, initialTestData]);

  const saveTestData = useCallback((): boolean => {
    try {
      localStorage.setItem(`verdeler_vanaf_630_test_${verdelerInfo.id}`, JSON.stringify(testData));
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
      localStorage.setItem(`verdeler_vanaf_630_test_${verdelerInfo.id}`, JSON.stringify(updatedTestData));
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
        await generateVerdelerVanaf630PDF(
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
      localStorage.removeItem(`verdeler_vanaf_630_test_${verdelerInfo.id}`);
      
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
      uitlevering: '8. Uitlevering',
      eindcontrole: '9. Eindcontrole',
      diversen: '10. Diversen'
    };

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-blue-400">Werkplaats Checklist - Verdeler vanaf 630A</h2>
        
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
        
        <div className="flex justify-end mt-4">
          <button
            className={`btn-primary ${isStepComplete('workshopChecklist') ? '' : 'opacity-50 cursor-not-allowed'}`}
            onClick={handleStepComplete}
            disabled={!isStepComplete('workshopChecklist')}
          >
            Voltooien en doorgaan
          </button>
        </div>
      </div>
    );
  };

  const renderInspectionReport = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-blue-400">Keuringsrapport - Verdeler vanaf 630A</h2>
        
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
              Verdeler vanaf 630A Test: {verdelerInfo.id} - {verdelerInfo.name}
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
        title="Verdeler vanaf 630A test"
      >
        <CheckSquare size={16} />
        <span>Verdeler vanaf 630</span>
        {testData.workshopChecklist.completed && (
          <div className="ml-2">{getTestStatusBadge()}</div>
        )}
      </button>

      {showModal && createPortal(ModalContent, document.body)}
    </>
  );
};

export default VerdelerVanaf630Test;