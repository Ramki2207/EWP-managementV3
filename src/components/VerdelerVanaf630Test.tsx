import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, CheckSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateVerdelerVanaf630PDF } from './VerdelerVanaf630PDF';
import { dataService } from '../lib/supabase';

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
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Initialize test data with the structure from the PDF
  const initialTestData = useMemo(() => ({
    verdelerVanaf630Test: {
      completed: false,
      date: new Date().toISOString().split('T')[0],
      testedBy: '',
      monteur: '',
      eindcontroleur: '',
      beproevingen: '',
      // Technical specifications
      un: '',
      inValue: '',
      ikDyn: '',
      ikTh: '',
      frequency: '',
      unHulp230: false,
      unHulp24: false,
      afwijkend: '',
      dichtheidsklasse: '',
      bescherming: '',
      bouwjaar: '',
      projectnaam: '',
      items: [
        // 1. Goederenstroom
        { id: 1, category: 'goederenstroom', field: '1.01', description: 'Ontvangstprocedure volgens ISO 9003', passed: null, notes: '', options: ['akkoord', 'n.v.t.'] },
        
        // 2. Railsystemen
        { id: 2, category: 'railsystemen', field: '2.01', description: 'Railsystemen aanwezig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 3, category: 'railsystemen', field: '2.02a', description: 'Hoofdrailsysteem 2 x 40 x 10 mm 3 Fase + (PE)N', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 4, category: 'railsystemen', field: '2.02b', description: 'Subrailsysteem 80 x 10 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 5, category: 'railsystemen', field: '2.02b', description: 'Subrailsysteem 40 x 10 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 6, category: 'railsystemen', field: '2.02c', description: 'PE 40 x 10 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 7, category: 'railsystemen', field: '2.03', description: 'Juiste CU-doorsnede toegepast', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 8, category: 'railsystemen', field: '2.04', description: 'Extra coderingen aangebracht op raildrager en/of railsystemen (L1, L2, L3, [PE]N, PE)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 9, category: 'railsystemen', field: '2.05', description: 'Kunststof afschermingen opgenomen op railsysteem i.v.m. nabij liggende bekabeling', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 10, category: 'railsystemen', field: '2.06', description: 'L-profiel(en) 45 x 45 x 8 mm toegepast op railsets en/of voedingsveld', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 3. Componenten
        { id: 11, category: 'componenten', field: '3.01', description: 'Componenten volgens indelingsschets deugdelijk geplaatst', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 12, category: 'componenten', field: '3.02', description: 'Componenten ingesteld', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 13, category: 'componenten', field: '3.02', description: 'air circuit breaker', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 14, category: 'componenten', field: '3.02', description: 'vermogensautomaten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 15, category: 'componenten', field: '3.02', description: 'overige componenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 16, category: 'componenten', field: '3.03', description: 'Voldoende koeling tussen componenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 17, category: 'componenten', field: '3.04', description: 'Rijgklemmen aanwezig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 18, category: 'componenten', field: '3.05', description: 'Rijgklemmen + overige klemmen vastgedraaid', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 19, category: 'componenten', field: '3.06', description: 'Juiste kleuren drukknoppen en / of signaallampen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 20, category: 'componenten', field: '3.07', description: 'Juiste spanning bij signaallampen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 21, category: 'componenten', field: '3.08', description: 'Juiste spoelspanning besturingscomponenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 22, category: 'componenten', field: '3.09', description: 'Mechanische controle schakelaar(s) en componenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 23, category: 'componenten', field: '3.10', description: 'Componenten gemonteerd in kastdeur(en)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 24, category: 'componenten', field: '3.11', description: 'Componenten in kastdeur gecodeerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 4. Interne bedrading
        { id: 25, category: 'interne_bedrading', field: '4.01', description: '90°C bedrading toegepast', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 26, category: 'interne_bedrading', field: '4.02', description: 'Bedradingsdoorsnede juist gekozen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 27, category: 'interne_bedrading', field: '4.03', description: 'Juiste draadkleuren toegepast', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 28, category: 'interne_bedrading', field: '4.04', description: 'Bedrading vrij opgesteld t.o.v. railsysteem', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 29, category: 'interne_bedrading', field: '4.05', description: 'Juiste railklemmen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 30, category: 'interne_bedrading', field: '4.06', description: 'Componenten vastgedraaid met juiste aandraaimomenten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 31, category: 'interne_bedrading', field: '4.07', description: 'Bedrading overzichtelijk aangelegd met het oog op eventuele uitbreidingen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 32, category: 'interne_bedrading', field: '4.08', description: 'Bedrading gecodeerd op hoofd- en hulpstroombanen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 33, category: 'interne_bedrading', field: '4.08', description: 'Bedrading gecodeerd op kleuren', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 34, category: 'interne_bedrading', field: '4.08', description: 'Bedrading gecodeerd op cijfers/letters', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 35, category: 'interne_bedrading', field: '4.08', description: 'Bedrading gecodeerd op symbolen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 36, category: 'interne_bedrading', field: '4.09', description: 'Bij TNC-stelsel PEN-sticker op PEN-geleider', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 37, category: 'interne_bedrading', field: '4.10', description: 'Bedrading deugdelijk gebundeld', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 38, category: 'interne_bedrading', field: '4.11', description: 'Bedrading gecontroleerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 5. Montageframe
        { id: 39, category: 'montageframe', field: '5.01', description: 'Controle diepte-instelling - Draagsteunen in voorste positie geplaatst', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 40, category: 'montageframe', field: '5.02', description: 'Frame opgebouwd in verdeler', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 41, category: 'montageframe', field: '5.03', description: 'Volledige frame bevestigd aan beschermingsleiding. Stickers zichtbaar aanbrengen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 42, category: 'montageframe', field: '5.04', description: 'Scheidingsschotten opgenomen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 43, category: 'montageframe', field: '5.05', description: 'Verdelerdeur(en) bevestigd aan beschermingsleiding. Stickers zichtbaar aanbrengen (uitsluitend geaarde verdelers)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 6. Beproeving
        { id: 44, category: 'beproeving', field: '6.01', description: 'Routineproef: Inspecteer verdeler(s), incl. bedrading', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 45, category: 'beproeving', field: '6.01', description: 'Elektrische functionele proef uitgevoerd met nominale bedrijfsspanning', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 46, category: 'beproeving', field: '6.01', description: 'Alle eindgroepen functioneren', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 47, category: 'beproeving', field: '6.01', description: 'Aardlek-elementen getest (via foutstroom)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 48, category: 'beproeving', field: '6.01', description: 'Overige schakelingen gecontroleerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 49, category: 'beproeving', field: '6.02', description: 'Functietest beproevingsapparatuur uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 50, category: 'beproeving', field: '6.03', description: 'Routineproef: Toetsing beschermingsmaatregelen en doorgaande verbinding van de stroombaan van de beschermingsleiding. PE; standaard 40 x 10 mm', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 51, category: 'beproeving', field: '6.04', description: 'Routineproef: hoogspanningstest 1 sec. 1000 V bij 24 V (Ui ≤ 60 V)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 52, category: 'beproeving', field: '6.04', description: 'Routineproef: hoogspanningstest 1 sec. 2000 V bij 230 V (60 V < Ui ≤ 300 V)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 53, category: 'beproeving', field: '6.04', description: 'Routineproef: hoogspanningstest 1 sec. 2500 V bij 400 V (300 V < Ui ≤ 660 V)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 54, category: 'beproeving', field: '6.04', description: 'Spanningsproef uitgevoerd (item A): Alle schakeltoestellen bevinden zich in ingeschakelde toestand', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 55, category: 'beproeving', field: '6.04', description: 'Spanningsproef uitgevoerd (item B): Proefspanning is achtereenvolgens aan alle onderdelen van stroombron aangelegd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 56, category: 'beproeving', field: '6.04', description: 'Juiste proefspanningen gecontroleerd (Let op isolatiespanning van componenten!)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 57, category: 'beproeving', field: '6.04', description: 'Componenten geschikt voor lagere isolatiespanning elektrisch losgekoppeld', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 58, category: 'beproeving', field: '6.04', description: 'Testprocedure uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 59, category: 'beproeving', field: '6.04', description: 'Geen doorslag óf overslag geconstateerd (proef is geslaagd)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 60, category: 'beproeving', field: '6.04', description: 'Losgekoppelde componenten elektrisch aangesloten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 61, category: 'beproeving', field: '6.04', description: '2e spanningsproef uitgevoerd ter plaatste bij opstelling', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 62, category: 'beproeving', field: '6.04', description: 'Geen doorslag óf overslag geconstateerd (proef is geslaagd)', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 63, category: 'beproeving', field: '6.05', description: 'Functietest beproevingsapparatuur uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 64, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand - Fase t.o.v. omhulling/aarde: ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 65, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand - Fase t.o.v. Fase (L1-L2, L1-L3, L2-L3): ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 66, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand - Hulpstroomkring t.o.v. omhulling/constructiedelen: ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 67, category: 'beproeving', field: '6.06', description: 'Isolatieweerstand - N t.o.v. PE: ≥300 MΩ', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 68, category: 'beproeving', field: '6.07', description: 'Kruip- en luchtwegen volgens bepaling fabrikant 1600A handboek', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 7. Eindafwerking
        { id: 69, category: 'eindafwerking', field: '7.01', description: 'Tekeninghouder opgenomen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 70, category: 'eindafwerking', field: '7.02', description: 'Tekeningen + producthandleidingen meegeleverd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 71, category: 'eindafwerking', field: '7.03', description: 'Deursleutels meegeleverd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 72, category: 'eindafwerking', field: '7.04', description: 'Rijgklemmen gecodeerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 73, category: 'eindafwerking', field: '7.05', description: 'Groepencodering op afdekplaten', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 74, category: 'eindafwerking', field: '7.06', description: 'Sticker ingevuld volgens HSA-normen', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 75, category: 'eindafwerking', field: '7.07', description: 'Creditcard en keuringsticker geplaatst aan de binnenzijde van de kastdeur', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 76, category: 'eindafwerking', field: '7.08', description: 'Flensplaten gemonteerd in verdeler', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 77, category: 'eindafwerking', field: '7.09', description: 'Alle juiste aandraaimomenten op railsystemen / railverbindingen / componenten gecontroleerd en afgelakt', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 78, category: 'eindafwerking', field: '7.10', description: 'Warmteberekening uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 79, category: 'eindafwerking', field: '7.11', description: 'Algemene reiniging verdeler uitgevoerd', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 8. Uitlevering
        { id: 80, category: 'uitlevering', field: '8.01', description: 'Documenten gereed voor uitleveringsprocedure volgens ISO 9003', passed: null, notes: '', options: ['akkoord', 'n.v.t.'] },
        
        // 9. Eindcontrole
        { id: 81, category: 'eindcontrole', field: '9.01', description: 'Verdelercombinatie samengesteld conform Fabrikant 1600A handboek', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 82, category: 'eindcontrole', field: '9.02', description: 'Keuringsrapport volledig', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        { id: 83, category: 'eindcontrole', field: '9.03', description: 'Kopie keuringsrapport + kopie sticker toegevoegd aan eigen projectgegevens', passed: null, notes: '', options: ['akkoord', 'n.v.t.', 'fout', 'hersteld'] },
        
        // 10. Diversen (free text field)
        { id: 84, category: 'diversen', field: '10.01', description: 'Diversen - Vrije opmerkingen', passed: null, notes: '', options: ['text'] }
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
    // Load saved test data from database first, then fall back to localStorage
    const loadSavedTestData = async () => {
      if (projectId && distributorId) {
        try {
          const notification = await dataService.getSpecificTestReviewNotification(
            projectId,
            distributorId,
            'verdeler_vanaf_630',
            'pending_review'
          );

          if (notification && notification.test_data) {
            console.log('✅ Loaded test data from database:', notification.test_data);
            setTestData(notification.test_data);
            return;
          }
        } catch (error) {
          console.error('Error loading test data from database:', error);
        }
      }

      // Fall back to localStorage if no database data
      const savedTestData = localStorage.getItem(`verdeler_vanaf_630_test_${verdelerInfo.id}`);
      if (savedTestData) {
        try {
          const parsed = JSON.parse(savedTestData);
          setTestData(parsed);
        } catch (error) {
          console.error('Error parsing saved test data:', error);
          toast.error('Er is een fout opgetreden bij het laden van de testgegevens');
        }
      }
    };

    loadSavedTestData();
  }, [verdelerInfo.id, projectId, distributorId]);

  // Reload data when modal opens
  useEffect(() => {
    if (showModal && projectId && distributorId) {
      console.log('🔄 VERDELER VANAF 630: Modal opened, reloading data...');
      const reloadData = async () => {
        try {
          const notification = await dataService.getSpecificTestReviewNotification(
            projectId,
            distributorId,
            'verdeler_vanaf_630',
            'pending_review'
          );

          if (notification && notification.test_data) {
            console.log('✅ VERDELER VANAF 630: Reloaded test data from modal open');
            setTestData(notification.test_data);
          }
        } catch (error) {
          console.error('Error reloading test data on modal open:', error);
        }
      };
      reloadData();
    }
  }, [showModal, projectId, distributorId]);

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

  const handleComplete = useCallback(async () => {
    const updatedTestData = {
      ...testData,
      verdelerVanaf630Test: {
        ...testData.verdelerVanaf630Test,
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
    
    // Show immediate feedback
    toast.success('Verdeler vanaf 630 test succesvol afgerond!');
    setShowModal(false);

    // Generate PDF and update notification in the background
    setGeneratingPDF(true);

    Promise.all([
      // Generate and save PDF
      generateVerdelerVanaf630PDF(
        updatedTestData,
        verdeler,
        projectNumber,
        projectId,
        distributorId
      ).catch(error => {
        console.error('Error generating PDF:', error);
        toast.error('PDF generatie mislukt. Probeer het opnieuw.');
      }),

      // Update notification status
      (async () => {
        if (projectId && distributorId) {
          try {
            const currentUser = localStorage.getItem('currentUserId');
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find((u: any) => u.id === currentUser);

            // Use optimized specific query instead of fetching all notifications
            const notification = await dataService.getSpecificTestReviewNotification(
              projectId,
              distributorId,
              'verdeler_vanaf_630',
              'pending_review'
            );

            if (notification) {
              await dataService.updateTestReviewNotification(notification.id, {
                status: 'approved',
                reviewedBy: user?.name || 'Admin'
              });
              console.log('✅ Test notification updated to approved');
            }
          } catch (error) {
            console.error('Error updating test notification:', error);
          }
        }
      })()
    ]).finally(() => {
      setGeneratingPDF(false);
    });
  }, [testData, verdelerInfo.id, onComplete, verdeler, projectNumber, projectId, distributorId]);

  // Create stable, memoized change handlers
  const handleBasicFieldChange = useCallback((field: string) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTestData(prev => ({
        ...prev,
        verdelerVanaf630Test: {
          ...prev.verdelerVanaf630Test,
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
        verdelerVanaf630Test: {
          ...prev.verdelerVanaf630Test,
          [field]: value
        }
      }));
    };
  }, []);

  const handleItemChange = useCallback((id: number, field: string, value: any) => {
    setTestData(prev => {
      const newData = { ...prev };
      const verdelerVanaf630Test = { ...newData.verdelerVanaf630Test };
      const items = [...verdelerVanaf630Test.items];
      const itemIndex = items.findIndex(item => item.id === id);
      
      if (itemIndex !== -1) {
        items[itemIndex] = { ...items[itemIndex], [field]: value };
      }
      
      verdelerVanaf630Test.items = items;
      newData.verdelerVanaf630Test = verdelerVanaf630Test;
      return newData;
    });
  }, []);

  const isTestComplete = useCallback(() => {
    return testData.verdelerVanaf630Test.items.every((item: any) => {
      // For text fields (like Diversen), they are optional
      if (item.options && item.options.includes('text')) {
        return true; // Text fields are optional
      }
      // For other fields, check if passed is set
      return item.passed !== null && item.passed !== undefined && item.passed !== '';
    }) && 
           testData.verdelerVanaf630Test.testedBy.trim() !== '' &&
           testData.verdelerVanaf630Test.monteur.trim() !== '' &&
           testData.verdelerVanaf630Test.eindcontroleur.trim() !== '';
  }, [testData]);

  // Memoize change handlers for each field
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
  const dichtheidsklasseHandler = useMemo(() => handleBasicFieldChange('dichtheidsklasse'), [handleBasicFieldChange]);
  const beschermingHandler = useMemo(() => handleBasicFieldChange('bescherming'), [handleBasicFieldChange]);
  const bouwjaarHandler = useMemo(() => handleBasicFieldChange('bouwjaar'), [handleBasicFieldChange]);
  const projectnaamHandler = useMemo(() => handleBasicFieldChange('projectnaam'), [handleBasicFieldChange]);
  const unHulp230Handler = useMemo(() => handleCheckboxChange('unHulp230'), [handleCheckboxChange]);
  const unHulp24Handler = useMemo(() => handleCheckboxChange('unHulp24'), [handleCheckboxChange]);

  const renderVerdelerVanaf630Test = () => {
    const itemsByCategory: Record<string, any[]> = {};
    testData.verdelerVanaf630Test.items.forEach((item: any) => {
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
        <h2 className="text-xl font-semibold text-blue-400">Keuringsrapport verdeler vanaf 630 A</h2>
        
        {/* Header Information */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Datum</label>
            <input
              type="date"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.verdelerVanaf630Test.date}
              onChange={dateHandler}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tester</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.verdelerVanaf630Test.testedBy}
              onChange={testerHandler}
              placeholder="Naam tester"
            />
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="bg-[#1E2530] p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">Technische Specificaties</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Un [Vac]</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.un}
                onChange={unHandler}
                placeholder="400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">In [A]</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.inValue}
                onChange={inValueHandler}
                placeholder="1260"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ik dyn [kA]</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.ikDyn}
                onChange={ikDynHandler}
                placeholder="65"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ik th [kA]</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.ikTh}
                onChange={ikThHandler}
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">F [Hz]</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.frequency}
                onChange={frequencyHandler}
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Dichtheidsklasse</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.dichtheidsklasse}
                onChange={dichtheidsklasseHandler}
                placeholder="IP55"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bescherming</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.bescherming}
                onChange={beschermingHandler}
                placeholder="Klasse 1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bouwjaar</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.bouwjaar}
                onChange={bouwjaarHandler}
                placeholder="2025"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Projectnaam</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.projectnaam}
                onChange={projectnaamHandler}
                placeholder="Project naam"
              />
            </div>
          </div>
          
          {/* Un-hulp checkboxes */}
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-2">Un van hulpstroombanen (indien van toepassing)</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={testData.verdelerVanaf630Test.unHulp230}
                  onChange={unHulp230Handler}
                  className="form-checkbox"
                />
                <span className="text-gray-400">230 [Vac]</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={testData.verdelerVanaf630Test.unHulp24}
                  onChange={unHulp24Handler}
                  className="form-checkbox"
                />
                <span className="text-gray-400">24 [Vac]</span>
              </label>
            </div>
          </div>
          
          {/* Afwijkend field */}
          <div className="mt-4">
            <label className="block text-sm text-gray-400 mb-1">Afwijkend [V]</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.verdelerVanaf630Test.afwijkend}
              onChange={afwijkendHandler}
              placeholder="Afwijkende spanning"
            />
          </div>
        </div>

        {/* Signature Fields */}
        <div className="bg-[#1E2530] p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">Handtekeningen</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monteur</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.monteur}
                onChange={monteurHandler}
                placeholder="Naam monteur"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Eindcontroleur</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.eindcontroleur}
                onChange={eindcontroleurHandler}
                placeholder="Naam eindcontroleur"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Beproevingen</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.verdelerVanaf630Test.beproevingen}
                onChange={beproevingenHandler}
                placeholder="Ja/Nee"
              />
            </div>
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
                const storageKey = `verdeler_test_vanaf_630_${verdelerInfo.id}`;
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
                  testType: 'verdeler_vanaf_630',
                  submittedBy: user?.name || 'Onbekend'
                });

                // Check if notification already exists
                const existing = await dataService.getSpecificTestReviewNotification(
                  projectId,
                  distributorId,
                  'verdeler_vanaf_630',
                  'pending_review'
                );

                if (existing) {
                  // Update existing notification with new test data
                  await dataService.updateTestReviewNotification(existing.id, {
                    testData: testData
                  });
                  console.log('✅ Updated existing notification with test data');
                } else {
                  // Create new notification with test data
                  await dataService.createTestReviewNotification({
                    projectId: projectId,
                    distributorId: distributorId,
                    testType: 'verdeler_vanaf_630',
                    submittedBy: user?.name || 'Onbekend',
                    testData: testData
                  });
                  console.log('✅ Created new notification with test data');
                }

                toast.success('Test opgeslagen! Admin kan de test nu bekijken en controleren.');
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
    if (testData.verdelerVanaf630Test.completed) {
      return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Vanaf 630 Voltooid</span>;
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
              Verdeler vanaf 630: {verdelerInfo.id} - {verdelerInfo.name}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          
          {renderVerdelerVanaf630Test()}
        </div>
      </div>
    );
  }, [showModal, verdelerInfo, testData, handleBackdropClick, isTestComplete, handleComplete, generatingPDF]);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary flex items-center space-x-2"
        title="Verdeler vanaf 630 test"
      >
        <CheckSquare size={16} />
        <span>Verdeler vanaf 630</span>
        {testData.verdelerVanaf630Test.completed && (
          <div className="ml-2">{getTestStatusBadge()}</div>
        )}
      </button>

      {showModal && createPortal(ModalContent, document.body)}
    </>
  );
};

export default VerdelerVanaf630Test;