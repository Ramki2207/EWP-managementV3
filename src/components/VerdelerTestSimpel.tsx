import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, CheckSquare, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateVerdelerTestSimpelPDF } from './VerdelerTestSimpelPDF';
import { dataService } from '../lib/supabase';

interface VerdelerTestSimpelProps {
  verdeler: any;
  projectNumber: string;
  onComplete: (testData: any) => void;
  projectId?: string;
  distributorId?: string;
}

const VerdelerTestSimpel: React.FC<VerdelerTestSimpelProps> = ({
  verdeler,
  projectNumber,
  onComplete,
  projectId,
  distributorId
}) => {
  const [showModal, setShowModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState(false);

  // Initialize test data with the structure from the PDF
  const initialTestData = useMemo(() => ({
    verdelerTestSimpel: {
      completed: false,
      date: new Date().toISOString().split('T')[0],
      testedBy: '',
      monteur: '',
      tester: '',
      beproevingen: '',
      eindcontroleur: '',
      // Technical specifications
      un: '400',
      inValue: '',
      ikDyn: '',
      ikTh: '',
      frequency: '50',
      unHulp230: false,
      unHulp24: false,
      afwijkend: '',
      items: [
        // 1. Goederenstroom
        { id: 1, category: 'goederenstroom', field: '1.01', description: 'Ontvangstprocedure volgens ISO 9003', passed: null, notes: '', options: ['akkoord', 'n.v.t.'] },

        // 2. Verdeelblok 80, 100, 125 en 160 A
        { id: 2, category: 'verdeelblok', field: '2.02', description: 'Toegepaste nom. waarde vedeelblok', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 3, category: 'verdeelblok', field: '2.02', description: '250 A 12 x 5 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 4, category: 'verdeelblok', field: '2.02', description: '315 A 20 x 5 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 5, category: 'verdeelblok', field: '2.02', description: '400 A 30 x 5 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 6, category: 'verdeelblok', field: '2.02', description: '500 A 20 x 10 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 7, category: 'verdeelblok', field: '2.02', description: '630 A 30 x 10 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },

        // 3. Componenten
        { id: 8, category: 'componenten', field: '3.01', description: 'Componenten volgens indelingsschets deugdelijk geplaatst', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 9, category: 'componenten', field: '3.02', description: 'Componenten ingesteld volgens: type', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 10, category: 'componenten', field: '3.02', description: 'tijdrelais', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 11, category: 'componenten', field: '3.02', description: 'programmaklokken', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 12, category: 'componenten', field: '3.02', description: 'meetinstrumenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 13, category: 'componenten', field: '3.03', description: 'Voldoende koeling tussen componenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 14, category: 'componenten', field: '3.04', description: 'Rijgklemmen aanwezig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 15, category: 'componenten', field: '3.05', description: 'Rijgklemmen + overige klemmen vastgedraaid', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 16, category: 'componenten', field: '3.06', description: 'Juiste kleuren drukknoppen en / of signaallampen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 17, category: 'componenten', field: '3.07', description: 'Juiste spanning bij signaallampen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 18, category: 'componenten', field: '3.08', description: 'Juiste spoelspanning besturingscomponenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 19, category: 'componenten', field: '3.09', description: 'Mechanische controle schakelaar(s) en componenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 20, category: 'componenten', field: '3.10', description: 'Componenten gemonteerd in kastdeur(en)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 21, category: 'componenten', field: '3.11', description: 'Componenten in kastdeur gecodeerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },

        // 4. Interne bedrading
        { id: 22, category: 'interne_bedrading', field: '4.01', description: '90°C bedrading toegepast', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 23, category: 'interne_bedrading', field: '4.02', description: 'Bedradingsdoorsnede juist gekozen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 24, category: 'interne_bedrading', field: '4.03', description: 'Juiste draadkleuren toegepast', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 25, category: 'interne_bedrading', field: '4.06', description: 'Componenten vastgedraaid met juiste aandraaimomenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 26, category: 'interne_bedrading', field: '4.07', description: 'Bedrading overzichtelijk aangelegd met het oog op eventuele uitbreidingen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 27, category: 'interne_bedrading', field: '4.10', description: 'Bedrading deugdelijk gebundeld', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 28, category: 'interne_bedrading', field: '4.11', description: 'Bedrading gecontroleerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },

        // 5. Montageframe
        { id: 29, category: 'montageframe', field: '5.01', description: 'Controle diepte-instelling i.v.m. componentenhoogte', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 30, category: 'montageframe', field: '5.02', description: 'Frame geplaatst in verdeler', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 31, category: 'montageframe', field: '5.03', description: 'Volledige frame bevestigd aan beschermingsleiding. Stickers zichtbaar aanbrengen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 32, category: 'montageframe', field: '5.04', description: 'Scheidingsschotten opgenomen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 33, category: 'montageframe', field: '5.05', description: 'Verdelerdeur(en) bevestigd aan beschermingsleiding. Stickers zichtbaar aanbrengen (uitsluitend geaarde verdelers)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 34, category: 'montageframe', field: '5.06', description: 'Bij toepassing van kunststof verdelers / volledige isolatie: Frame en verdelerdeur(en) niet met beschermingsleiding doorverbinden', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },

        // 6. Beproeving
        { id: 35, category: 'beproeving', field: '6.01', description: 'Routineproef: Inspecteer verdeler(s), incl. bedrading', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 36, category: 'beproeving', field: '6.01', description: 'Elektrische functionele proef uitgevoerd met nominale bedrijfsspanning', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 37, category: 'beproeving', field: '6.01', description: 'Alle eindgroepen functioneren', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 38, category: 'beproeving', field: '6.01', description: 'Aardlek-elementen getest (via foutstroom)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 39, category: 'beproeving', field: '6.01', description: 'Overige schakelingen gecontroleerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 40, category: 'beproeving', field: '6.02', description: 'Functietest beproevingsapparatuur uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 41, category: 'beproeving', field: '6.03', description: 'Routineproef: Toetsing beschermingsmaatregelen en doorgaande verbinding van de stroombaan van de beschermingsleiding', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 42, category: 'beproeving', field: '6.04', description: 'Routineproef: Meggertest HT instruments Fulltest3 - 1 sec. 1000 V bij 24 V (Ui ≤ 60 V)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 43, category: 'beproeving', field: '6.04', description: 'Routineproef: Meggertest - 1 sec. 1500 V bij 230 V (60 V < Ui ≤ 300 V)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 44, category: 'beproeving', field: '6.04', description: 'Spanningsproef uitgevoerd (item A): Alle schakeltoestellen bevinden zich in ingeschakelde toestand', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 45, category: 'beproeving', field: '6.04', description: 'Spanningsproef uitgevoerd (item B): Proefspanning is achtereenvolgens aan alle onderdelen van stroombron aangelegd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 46, category: 'beproeving', field: '6.04', description: 'Bijlage gecontroleerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 47, category: 'beproeving', field: '6.04', description: 'Componenten geschikt voor lagere isolatiespanning elektrisch losgekoppeld', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 48, category: 'beproeving', field: '6.04', description: 'Testprocedure uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 49, category: 'beproeving', field: '6.04', description: 'Geen doorslag óf overslag geconstateerd (proef is geslaagd)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 50, category: 'beproeving', field: '6.04', description: 'Losgekoppelde componenten elektrisch aangesloten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 51, category: 'beproeving', field: '6.04', description: '2e spanningsproef uitgevoerd ter plaatse bij opstelling (uitvoering door de klant)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 52, category: 'beproeving', field: '6.04', description: 'Geen doorslag óf overslag geconstateerd (proef is geslaagd)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 53, category: 'beproeving', field: '6.05', description: 'Functietest beproevingsapparatuur uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 54, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand: Fase t.o.v. omhulling/aarde ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 55, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand: Fase t.o.v. Fase (L1-L2, L1-L3, L2-L3) ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 56, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand: Hulpstroomkring t.o.v. omhulling/constructiedelen ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 57, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand: N t.o.v. PE ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 58, category: 'beproeving', field: '6.07', description: 'Kruip- en luchtwegen volgens bepaling 7.1.2', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },

        // 7. Eindafwerking
        { id: 59, category: 'eindafwerking', field: '7.01', description: 'Tekeninghouder opgenomen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 60, category: 'eindafwerking', field: '7.02', description: 'Tekeningen + producthandleidingen meegeleverd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 61, category: 'eindafwerking', field: '7.03', description: 'Wandbevestigingsbeugels ingesloten in verdeler', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 62, category: 'eindafwerking', field: '7.04', description: 'Deursleutels meegeleverd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 63, category: 'eindafwerking', field: '7.05', description: 'Rijgklemmen gecodeerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 64, category: 'eindafwerking', field: '7.06', description: 'Groepencodering op afdekplaten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 65, category: 'eindafwerking', field: '7.07', description: 'Creditcard en keuringssticker geplaatst aan de binnenzijde van de kastdeur', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 66, category: 'eindafwerking', field: '7.08', description: 'Flensplaten gemonteerd in verdeler', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 67, category: 'eindafwerking', field: '7.09', description: 'Warmteberekening uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 68, category: 'eindafwerking', field: '7.10', description: 'Algemene reiniging verdeler uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },

        // 8. Eindcontrole
        { id: 69, category: 'eindcontrole', field: '8.01', description: 'Keuringsrapport volledig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 70, category: 'eindcontrole', field: '8.02', description: 'Kopie keuringsrapport + Kopie sticker toegevoegd aan eigen projectgegevens', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },

        // 9. Diversen
        { id: 71, category: 'diversen', field: '9.01', description: 'Diversen - Vrije opmerkingen', passed: null, notes: '', options: ['text'] }
      ]
    }
  }), []);

  const [testData, setTestData] = useState(initialTestData);

  const verdelerInfo = useMemo(() => ({
    id: verdeler.id,
    displayId: verdeler.distributorId || verdeler.distributor_id,
    name: verdeler.kastNaam || verdeler.kast_naam || 'Naamloos'
  }), [verdeler.id, verdeler.distributorId, verdeler.distributor_id, verdeler.kastNaam, verdeler.kast_naam]);

  useEffect(() => {
    const savedTestData = localStorage.getItem(`verdeler_test_simpel_${verdelerInfo.id}`);
    if (savedTestData) {
      try {
        const parsed = JSON.parse(savedTestData);
        setTestData(parsed);
      } catch (error) {
        console.error('Error parsing saved test data:', error);
      }
    }
  }, [verdelerInfo.id]);

  const handleComplete = useCallback(async () => {
    // Show confirmation modal first
    setConfirmationModal(true);
  }, []);

  const confirmAndComplete = useCallback(async () => {
    const updatedTestData = {
      ...testData,
      verdelerTestSimpel: {
        ...testData.verdelerTestSimpel,
        completed: true
      }
    };

    setTestData(updatedTestData);

    try {
      localStorage.setItem(`verdeler_test_simpel_${verdelerInfo.id}`, JSON.stringify(updatedTestData));
      onComplete(updatedTestData);
    } catch (error) {
      console.error('Error saving test data:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de testgegevens');
      return;
    }

    try {
      setGeneratingPDF(true);
      setConfirmationModal(false);
      await generateVerdelerTestSimpelPDF(
        updatedTestData,
        verdeler,
        projectNumber,
        projectId,
        distributorId
      );
      toast.success('Verdeler Test Simpel voltooid en PDF automatisch opgeslagen!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Test voltooid, maar PDF generatie mislukt');
    } finally {
      setGeneratingPDF(false);
    }

    toast.success('Verdeler Test Simpel succesvol afgerond!');
    setShowModal(false);
  }, [testData, verdelerInfo.id, onComplete, verdeler, projectNumber, projectId, distributorId]);

  const handleBasicFieldChange = useCallback((field: string) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTestData(prev => ({
        ...prev,
        verdelerTestSimpel: {
          ...prev.verdelerTestSimpel,
          [field]: value
        }
      }));
    };
  }, []);

  const handleCheckboxChange = useCallback((field: string) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.checked;
      setTestData(prev => ({
        ...prev,
        verdelerTestSimpel: {
          ...prev.verdelerTestSimpel,
          [field]: value
        }
      }));
    };
  }, []);

  const handleItemChange = useCallback((id: number, field: string, value: any) => {
    setTestData(prev => {
      const newData = { ...prev };
      const verdelerTestSimpel = { ...newData.verdelerTestSimpel };
      const items = [...verdelerTestSimpel.items];
      const itemIndex = items.findIndex(item => item.id === id);

      if (itemIndex !== -1) {
        items[itemIndex] = { ...items[itemIndex], [field]: value };
      }

      verdelerTestSimpel.items = items;
      newData.verdelerTestSimpel = verdelerTestSimpel;
      return newData;
    });
  }, []);

  const handleCheckAllInCategory = useCallback((category: string) => {
    setTestData(prev => {
      const newData = { ...prev };
      const verdelerTestSimpel = { ...newData.verdelerTestSimpel };
      const items = [...verdelerTestSimpel.items];

      items.forEach((item, index) => {
        if (item.category === category) {
          // Skip text fields
          if (!item.options || !item.options.includes('text')) {
            items[index] = { ...item, passed: 'akkoord' };
          }
        }
      });

      verdelerTestSimpel.items = items;
      newData.verdelerTestSimpel = verdelerTestSimpel;
      return newData;
    });

    toast.success('Alle vragen in dit hoofdstuk aangekruist als akkoord');
  }, []);

  const isTestComplete = useCallback(() => {
    return testData.verdelerTestSimpel.items.every((item: any) => {
      if (item.options && item.options.includes('text')) {
        return true;
      }
      return item.passed !== null && item.passed !== undefined && item.passed !== '';
    }) &&
           testData.verdelerTestSimpel.testedBy.trim() !== '' &&
           testData.verdelerTestSimpel.monteur.trim() !== '' &&
           testData.verdelerTestSimpel.eindcontroleur.trim() !== '';
  }, [testData]);

  const dateHandler = useMemo(() => handleBasicFieldChange('date'), [handleBasicFieldChange]);
  const testerHandler = useMemo(() => handleBasicFieldChange('testedBy'), [handleBasicFieldChange]);
  const monteurHandler = useMemo(() => handleBasicFieldChange('monteur'), [handleBasicFieldChange]);
  const eindcontroleurHandler = useMemo(() => handleBasicFieldChange('eindcontroleur'), [handleBasicFieldChange]);
  const beproevingenHandler = useMemo(() => handleBasicFieldChange('beproevingen'), [handleBasicFieldChange]);
  const unHandler = useMemo(() => handleBasicFieldChange('un'), [handleBasicFieldChange]);
  const inValueHandler = useMemo(() => handleBasicFieldChange('inValue'), [handleBasicFieldChange]);
  const ikDynHandler = useMemo(() => handleBasicFieldChange('ikDyn'), [handleBasicFieldChange]);
  const ikThHandler = useMemo(() => handleBasicFieldChange('ikTh'), [handleBasicFieldChange]);
  const frequencyHandler = useMemo(() => handleBasicFieldChange('frequency'), [handleBasicFieldChange]);
  const afwijkendHandler = useMemo(() => handleBasicFieldChange('afwijkend'), [handleBasicFieldChange]);
  const unHulp230Handler = useMemo(() => handleCheckboxChange('unHulp230'), [handleCheckboxChange]);
  const unHulp24Handler = useMemo(() => handleCheckboxChange('unHulp24'), [handleCheckboxChange]);

  const renderVerdelerTestSimpel = () => {
    const itemsByCategory: Record<string, any[]> = {};
    testData.verdelerTestSimpel.items.forEach((item: any) => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });

    const categoryTitles = {
      goederenstroom: '1. Goederenstroom',
      verdeelblok: '2. Verdeelblok 80, 100, 125 en 160 A',
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
        <h2 className="text-xl font-semibold text-blue-400">Keuringsrapport - Verdeler Test Simpel</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Datum</label>
            <input
              type="date"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.verdelerTestSimpel.date}
              onChange={dateHandler}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tester</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.verdelerTestSimpel.testedBy}
              onChange={testerHandler}
              placeholder="Naam tester"
            />
          </div>
        </div>

        <div className="bg-[#1E2530] p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">Technische Specificaties</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Un [Vac]</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerTestSimpel.un}
                onChange={unHandler}
                placeholder="400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">In [A]</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerTestSimpel.inValue}
                onChange={inValueHandler}
                placeholder="Ampère"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ik dyn [kA]</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerTestSimpel.ikDyn}
                onChange={ikDynHandler}
                placeholder="kA"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ik th [kA]</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerTestSimpel.ikTh}
                onChange={ikThHandler}
                placeholder="kA"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">F [Hz]</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerTestSimpel.frequency}
                onChange={frequencyHandler}
                placeholder="50"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">Un van hulpstroombanen (indien van toepassing)</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={testData.verdelerTestSimpel.unHulp230}
                  onChange={unHulp230Handler}
                  className="form-checkbox"
                />
                <span className="text-gray-400">230 [Vac]</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={testData.verdelerTestSimpel.unHulp24}
                  onChange={unHulp24Handler}
                  className="form-checkbox"
                />
                <span className="text-gray-400">24 [Vac]</span>
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-1">Afwijkend [V]</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.verdelerTestSimpel.afwijkend}
              onChange={afwijkendHandler}
              placeholder="Afwijkende spanning"
            />
          </div>
        </div>

        <div className="bg-[#1E2530] p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">Handtekeningen</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monteur</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerTestSimpel.monteur}
                onChange={monteurHandler}
                placeholder="Naam monteur"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Eindcontroleur</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerTestSimpel.eindcontroleur}
                onChange={eindcontroleurHandler}
                placeholder="Naam eindcontroleur"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Beproevingen</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerTestSimpel.beproevingen}
                onChange={beproevingenHandler}
                placeholder="Ja/Nee"
              />
            </div>
          </div>
        </div>

        {Object.keys(itemsByCategory).map((category) => (
          <div key={category} className="bg-[#1E2530] p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-blue-400">{categoryTitles[category as keyof typeof categoryTitles]}</h3>
              <button
                onClick={() => handleCheckAllInCategory(category)}
                className="btn-secondary flex items-center space-x-2 text-sm px-3 py-1"
                title="Kruis alle vragen in dit hoofdstuk aan als akkoord"
              >
                <CheckCircle size={16} />
                <span>Alles akkoord</span>
              </button>
            </div>
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
                      ) : (
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
                              onClick={() => handleItemChange(item.id, 'passed', option)}
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
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        value={item.notes}
                        onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
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
              try {
                // Save to localStorage
                const storageKey = `verdeler_test_simpel_${verdelerInfo.id}`;
                localStorage.setItem(storageKey, JSON.stringify(testData));

                // Create notification for admin review
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
                  testType: 'verdeler_test_simpel',
                  submittedBy: user?.name || 'Onbekend'
                });

                await dataService.createTestReviewNotification({
                  projectId: projectId,
                  distributorId: distributorId,
                  testType: 'verdeler_test_simpel',
                  submittedBy: user?.name || 'Onbekend'
                });

                toast.success('Test opgeslagen! Admin is op de hoogte gesteld voor controle.');
                setShowModal(false);
              } catch (error) {
                console.error('Error saving test:', error);
                toast.error('Er is een fout opgetreden bij het opslaan');
              }
            }}
          >
            Opslaan en later verdergaan
          </button>
          <button
            className={`btn-primary ${isTestComplete() ? '' : 'opacity-50 cursor-not-allowed'}`}
            onClick={handleComplete}
            disabled={!isTestComplete() || generatingPDF}
          >
            {generatingPDF ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>PDF genereren...</span>
              </div>
            ) : (
              'Test voltooien'
            )}
          </button>
        </div>
      </div>
    );
  };

  const getTestStatusBadge = () => {
    if (testData.verdelerTestSimpel.completed) {
      return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Simpel Voltooid</span>;
    }
    return <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">Niet getest</span>;
  };

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  }, []);

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
              Verdeler Test Simpel: {verdelerInfo.id} - {verdelerInfo.name}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {renderVerdelerTestSimpel()}
        </div>
      </div>
    );
  }, [showModal, verdelerInfo, testData, handleBackdropClick, isTestComplete, handleComplete, generatingPDF]);

  const ConfirmationModalContent = useMemo(() => {
    if (!confirmationModal) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        style={{ zIndex: 9999999 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setConfirmationModal(false);
          }
        }}
      >
        <div
          className="bg-[#1E2530] rounded-xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold mb-4">Bevestiging</h2>
          <p className="text-gray-300 mb-6">
            Zijn de vragen zorgvuldig gelezen en beantwoord?
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setConfirmationModal(false)}
              className="btn-secondary"
            >
              Annuleren
            </button>
            <button
              onClick={confirmAndComplete}
              className="btn-primary"
            >
              Ja, voltooien
            </button>
          </div>
        </div>
      </div>
    );
  }, [confirmationModal, confirmAndComplete]);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary flex items-center space-x-2"
        title="Verdeler Test Simpel"
      >
        <CheckSquare size={16} />
        <span>Verdeler Test Simpel</span>
        {testData.verdelerTestSimpel.completed && (
          <div className="ml-2">{getTestStatusBadge()}</div>
        )}
      </button>

      {showModal && createPortal(ModalContent, document.body)}
      {confirmationModal && createPortal(ConfirmationModalContent, document.body)}
    </>
  );
};

export default VerdelerTestSimpel;