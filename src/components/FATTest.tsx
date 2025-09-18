import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, CheckSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FATTestProps {
  verdeler: any;
  projectNumber: string;
  onComplete: (testData: any) => void;
}

const FATTest: React.FC<FATTestProps> = ({ verdeler, projectNumber, onComplete }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Initialize test data with stable structure using useMemo
  const initialTestData = useMemo(() => ({
    factoryTest: {
      completed: false,
      date: new Date().toISOString().split('T')[0],
      testedBy: '',
      measurements: {
        isolationResistance: '',
        continuityTest: '',
        functionalTest: '',
        voltageTest: ''
      },
      items: [
        // Algemeen
        { id: 1, category: 'algemeen', description: 'Afmetingen', passed: null, notes: '' },
        { id: 2, category: 'algemeen', description: 'Lakwerk', passed: null, notes: '' },
        { id: 3, category: 'algemeen', description: 'Scharnieren en deursluitingen', passed: null, notes: '' },
        { id: 4, category: 'algemeen', description: 'Tekening- groepenverklaringhouder', passed: null, notes: '' },
        { id: 5, category: 'algemeen', description: 'Beschermingsgraad IP', passed: null, notes: '' },
        { id: 6, category: 'algemeen', description: 'Naamplaat fabrikant', passed: null, notes: '' },
        { id: 7, category: 'algemeen', description: 'Aantal en plaats kabeldoorvoeringen', passed: null, notes: '' },
        { id: 8, category: 'algemeen', description: 'Aantal en plaats doorvoertulen', passed: null, notes: '' },
        { id: 9, category: 'algemeen', description: 'Kast en draadgoten schoongemaakt', passed: null, notes: '' },
        { id: 10, category: 'algemeen', description: 'Deurkoppelingen schakelaars', passed: null, notes: '' },
        { id: 11, category: 'algemeen', description: 'Bedieningsgreep smeltveiligheden', passed: null, notes: '' },
        { id: 12, category: 'algemeen', description: 'Montageframes wand/vloer', passed: null, notes: '' },
        { id: 13, category: 'algemeen', description: 'Certicificaten, CE verklaring installatie onderdelen', passed: null, notes: '' },
        { id: 14, category: 'algemeen', description: 'Verklaring integraal bouwen', passed: null, notes: '' },
        
        // Railsysteem
        { id: 15, category: 'railsysteem', description: 'Raildoorsnede', passed: null, notes: '' },
        { id: 16, category: 'railsysteem', description: 'Kruip- en luchtwegen', passed: null, notes: '' },
        { id: 17, category: 'railsysteem', description: 'Verbindingsbouten kwaliteit 8.8', passed: null, notes: '' },
        { id: 18, category: 'railsysteem', description: 'Bouten aangetrokken en gelakt', passed: null, notes: '' },
        { id: 19, category: 'railsysteem', description: 'Tapbouten in rail van de juiste lengte', passed: null, notes: '' },
        
        // Montage
        { id: 20, category: 'montage', description: 'Voeding direct op hoofdschakelaar', passed: null, notes: '' },
        { id: 21, category: 'montage', description: 'Licht- en krachtinstallatie gescheiden', passed: null, notes: '' },
        { id: 22, category: 'montage', description: 'Niet beveiligde geleiders separaat aangebracht', passed: null, notes: '' },
        { id: 23, category: 'montage', description: 'Reserveruimte volgens tekening aanwezig', passed: null, notes: '' },
        { id: 24, category: 'montage', description: 'Reserveruimte in draadgoten', passed: null, notes: '' },
        { id: 25, category: 'montage', description: 'Voldoende ruimte voor inkomende kabels', passed: null, notes: '' },
        { id: 26, category: 'montage', description: 'Kabelopvangrail aanwezig', passed: null, notes: '' },
        { id: 27, category: 'montage', description: 'Afgaande groepen op klemmen uitgevoerd', passed: null, notes: '' },
        { id: 28, category: 'montage', description: 'Aansluitklemmen geschikt voor inkomende kabels', passed: null, notes: '' },
        { id: 29, category: 'montage', description: 'Scheidingsschotten tussen de aansluitklemmen', passed: null, notes: '' },
        { id: 30, category: 'montage', description: 'Apparatuur van juiste fabricaat en type', passed: null, notes: '' },
        { id: 31, category: 'montage', description: 'Bevestiging van de apparatuur', passed: null, notes: '' },
        { id: 32, category: 'montage', description: 'Draadbundels flexibel en voorzien van trekontlasting', passed: null, notes: '' },
        { id: 33, category: 'montage', description: 'Ventilatieroosters t.b.v. koeling', passed: null, notes: '' },
        { id: 34, category: 'montage', description: 'Intrinsiekveilige bedrading in aparte goot', passed: null, notes: '' },
        { id: 35, category: 'montage', description: 'Draaddoorsnede', passed: null, notes: '' },
        { id: 36, category: 'montage', description: 'Draadkleuren', passed: null, notes: '' },
        { id: 37, category: 'montage', description: 'Alle apparatuur goed bereikbaar', passed: null, notes: '' },
        
        // Afscherming
        { id: 38, category: 'afscherming', description: 'Niet beveiligde geleiders', passed: null, notes: '' },
        { id: 39, category: 'afscherming', description: 'Vreemde spanningen', passed: null, notes: '' },
        { id: 40, category: 'afscherming', description: 'Aansluitklemmen voedingskabel', passed: null, notes: '' },
        { id: 41, category: 'afscherming', description: 'Hoofdschakelaar', passed: null, notes: '' },
        { id: 42, category: 'afscherming', description: 'Apparatuur binnenzijde deuren', passed: null, notes: '' },
        { id: 43, category: 'afscherming', description: 'Overige spanningvoerende delen >50V ~ of 110V =', passed: null, notes: '' },
        
        // Aarding
        { id: 44, category: 'aarding', description: 'Deuren', passed: null, notes: '' },
        { id: 45, category: 'aarding', description: 'Montageplaten', passed: null, notes: '' },
        { id: 46, category: 'aarding', description: 'Meet- en regelapparatuur', passed: null, notes: '' },
        { id: 47, category: 'aarding', description: 'Stroomtransformatoren / transformatoren', passed: null, notes: '' },
        { id: 48, category: 'aarding', description: 'Aardrail goed bereikbaar', passed: null, notes: '' },
        { id: 49, category: 'aarding', description: 'Aardbout- en aardraildoorsnede', passed: null, notes: '' },
        { id: 50, category: 'aarding', description: 'Voldoende aansluitbouten op aardrail', passed: null, notes: '' },
        { id: 51, category: 'aarding', description: 'Schone aarde', passed: null, notes: '' },
        
        // Coderingen
        { id: 52, category: 'coderingen', description: 'Railsysteem', passed: null, notes: '' },
        { id: 53, category: 'coderingen', description: 'Bedrading', passed: null, notes: '' },
        { id: 54, category: 'coderingen', description: 'Aansluitklemmen', passed: null, notes: '' },
        { id: 55, category: 'coderingen', description: 'Apparatuur in kast- resopal', passed: null, notes: '' },
        { id: 56, category: 'coderingen', description: 'Apparatuur in front- resopal', passed: null, notes: '' },
        { id: 57, category: 'coderingen', description: 'Gravering schakelaars', passed: null, notes: '' },
        { id: 58, category: 'coderingen', description: 'Kleur signaallamplensjes', passed: null, notes: '' },
        { id: 59, category: 'coderingen', description: 'Codering kastnaam', passed: null, notes: '' },
        
        // Waarden/Instellingen apparatuur
        { id: 60, category: 'instellingen', description: 'Hoofdautomaat trafo thermisch', passed: null, notes: '' },
        { id: 61, category: 'instellingen', description: 'Hoofdautomaat trafo maximaal', passed: null, notes: '' },
        { id: 62, category: 'instellingen', description: 'Hoofdschakelaars/schakelaars In = 2500 A', passed: null, notes: '' },
        { id: 63, category: 'instellingen', description: 'Maximaalautomaten', passed: null, notes: '' },
        { id: 64, category: 'instellingen', description: 'Thermische relais', passed: null, notes: '' },
        { id: 65, category: 'instellingen', description: 'Installatieautomaten', passed: null, notes: '' },
        { id: 66, category: 'instellingen', description: 'Smeltveiligheden wel / niet leveren', passed: null, notes: '' },
        { id: 67, category: 'instellingen', description: 'Tijdrelais', passed: null, notes: '' },
        { id: 68, category: 'instellingen', description: 'Transformatoren', passed: null, notes: '' },
        { id: 69, category: 'instellingen', description: 'Meetinstrumenten- stoomtransformatoren', passed: null, notes: '' },
        { id: 70, category: 'instellingen', description: 'Spoelspanningen', passed: null, notes: '' },
        
        // Bedradingscontrole/Functionele test
        { id: 71, category: 'functioneel', description: 'Fasevolgorde', passed: null, notes: '' },
        { id: 72, category: 'functioneel', description: 'Bedrading schakelapparatuur', passed: null, notes: '' },
        { id: 73, category: 'functioneel', description: 'Bedrading elektronische apparatuur', passed: null, notes: '' },
        { id: 74, category: 'functioneel', description: 'Bedrading meet- en regelapparatuur', passed: null, notes: '' },
        { id: 75, category: 'functioneel', description: 'Functionele elektrische test voedende (trafo) zijde', passed: null, notes: '' },
        { id: 76, category: 'functioneel', description: 'Functionele elektrische test (preferente) zijde', passed: null, notes: '' },
        { id: 77, category: 'functioneel', description: 'Kastverlichting/ventilatie/verwarming', passed: null, notes: '' },
        { id: 78, category: 'functioneel', description: 'Servicewandkontaktdoos', passed: null, notes: '' },
        { id: 79, category: 'functioneel', description: 'Blindschema\'s kleuren symbolen', passed: null, notes: '' },
        { id: 80, category: 'functioneel', description: 'Aanwijzing meetinstrumenten', passed: null, notes: '' },
        { id: 81, category: 'functioneel', description: 'Functionele pneumatische test', passed: null, notes: '' },
        { id: 82, category: 'functioneel', description: 'Sleutels van schakelaars onverwisselbaar', passed: null, notes: '' },
        { id: 83, category: 'functioneel', description: 'Schakelaar niet preferent aangesloten op juiste klemmen', passed: null, notes: '' },
        { id: 84, category: 'functioneel', description: 'Schakelaar preferent aangesloten op juiste klemmen', passed: null, notes: '' },
        { id: 85, category: 'functioneel', description: 'Controle werking storingscontacten', passed: null, notes: '' },
        { id: 86, category: 'functioneel', description: 'Controle sturingen in status net', passed: null, notes: '' },
        { id: 87, category: 'functioneel', description: 'Controle sturingen in status nood', passed: null, notes: '' },
        { id: 88, category: 'functioneel', description: 'Controle voeding sprinklerinstallatie in net situatie', passed: null, notes: '' },
        
        // Diversen
        { id: 89, category: 'diversen', description: 'Wordt de kast in de afgesproken delen aangevoerd', passed: null, notes: '' },
        { id: 90, category: 'diversen', description: 'Zijn voldoende hijsogen aangebracht', passed: null, notes: '' },
        { id: 91, category: 'diversen', description: 'Deursleutels aanwezig', passed: null, notes: '' },
        { id: 92, category: 'diversen', description: 'Reserve onderdelen kompleet', passed: null, notes: '' },
        { id: 93, category: 'diversen', description: 'Busje reservelak', passed: null, notes: '' },
        { id: 94, category: 'diversen', description: 'Certificaat van kast of systeem', passed: null, notes: '' },
        { id: 95, category: 'diversen', description: 'Bedienings- en onderhoudsvoorschrift apparatuur', passed: null, notes: '' },
        { id: 96, category: 'diversen', description: 'Revisiegegevens verwerkt op tekening', passed: null, notes: '' }
      ]
    }
  }), []);

  const [testData, setTestData] = useState(initialTestData);

  // Memoize verdeler info to prevent unnecessary re-renders
  const verdelerInfo = useMemo(() => ({
    id: verdeler.distributorId,
    name: verdeler.kastNaam || 'Naamloos'
  }), [verdeler.distributorId, verdeler.kastNaam]);

  useEffect(() => {
    const savedTestData = localStorage.getItem(`fat_test_${verdeler.distributorId}`);
    if (savedTestData) {
      try {
        const parsed = JSON.parse(savedTestData);
        setTestData(parsed);
      } catch (error) {
        console.error('Error parsing saved test data:', error);
        toast.error('Er is een fout opgetreden bij het laden van de testgegevens');
      }
    }
  }, [verdeler.distributorId]);

  const saveTestData = useCallback((): boolean => {
    try {
      localStorage.setItem(`fat_test_${verdeler.distributorId}`, JSON.stringify(testData));
      onComplete(testData);
      return true;
    } catch (error) {
      console.error('Error saving test data:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de testgegevens');
      return false;
    }
  }, [testData, verdeler.distributorId, onComplete]);

  const handleComplete = useCallback(() => {
    const updatedTestData = {
      ...testData,
      factoryTest: {
        ...testData.factoryTest,
        completed: true
      }
    };
    
    setTestData(updatedTestData);
    
    // Save immediately with updated data
    try {
      localStorage.setItem(`fat_test_${verdeler.distributorId}`, JSON.stringify(updatedTestData));
      onComplete(updatedTestData);
    } catch (error) {
      console.error('Error saving test data:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de testgegevens');
      return;
    }
    
    toast.success('Factory Acceptance Test succesvol afgerond!');
    setShowModal(false);
  }, [testData, verdeler.distributorId, onComplete]);

  // Create stable, memoized change handlers
  const handleBasicFieldChange = useCallback((field: string) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTestData(prev => ({
        ...prev,
        factoryTest: {
          ...prev.factoryTest,
          [field]: value
        }
      }));
    };
  }, []);

  const handleItemChange = useCallback((id: number, field: string, value: any) => {
    setTestData(prev => {
      const newData = { ...prev };
      const factoryTest = { ...newData.factoryTest };
      const items = [...factoryTest.items];
      const itemIndex = items.findIndex(item => item.id === id);
      
      if (itemIndex !== -1) {
        items[itemIndex] = { ...items[itemIndex], [field]: value };
      }
      
      factoryTest.items = items;
      newData.factoryTest = factoryTest;
      return newData;
    });
  }, []);

  const handleMeasurementChange = useCallback((field: string) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTestData(prev => ({
        ...prev,
        factoryTest: {
          ...prev.factoryTest,
          measurements: {
            ...prev.factoryTest.measurements,
            [field]: value
          }
        }
      }));
    };
  }, []);

  const isTestComplete = useCallback(() => {
   return testData.factoryTest.items.every((item: any) => item.passed !== null && item.passed !== undefined) && 
           testData.factoryTest.testedBy.trim() !== '';
  }, [testData]);

  // Memoize change handlers for each field
  const dateHandler = useMemo(() => handleBasicFieldChange('date'), [handleBasicFieldChange]);
  const testerHandler = useMemo(() => handleBasicFieldChange('testedBy'), [handleBasicFieldChange]);
  const isolationResistanceHandler = useMemo(() => handleMeasurementChange('isolationResistance'), [handleMeasurementChange]);
  const continuityTestHandler = useMemo(() => handleMeasurementChange('continuityTest'), [handleMeasurementChange]);
  const functionalTestHandler = useMemo(() => handleMeasurementChange('functionalTest'), [handleMeasurementChange]);
  const voltageTestHandler = useMemo(() => handleMeasurementChange('voltageTest'), [handleMeasurementChange]);

  const renderFactoryTest = () => {
    const itemsByCategory: Record<string, any[]> = {};
    testData.factoryTest.items.forEach((item: any) => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-blue-400">Factory Acceptance Test (FAT)</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Datum</label>
            <input
              type="date"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.factoryTest.date}
              onChange={dateHandler}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Getest door</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.factoryTest.testedBy}
              onChange={testerHandler}
              placeholder="Naam tester"
            />
          </div>
        </div>
        
        <div className="bg-[#1E2530] p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">Meetwaarden</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Isolatieweerstand (MΩ)</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.factoryTest.measurements.isolationResistance}
                onChange={isolationResistanceHandler}
                placeholder="Meetwaarde"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Doorgangstest (Ω)</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.factoryTest.measurements.continuityTest}
                onChange={continuityTestHandler}
                placeholder="Meetwaarde"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Functionele test (V)</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.factoryTest.measurements.functionalTest}
                onChange={functionalTestHandler}
                placeholder="Meetwaarde"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Spanningstest (V)</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.factoryTest.measurements.voltageTest}
                onChange={voltageTestHandler}
                placeholder="Meetwaarde"
              />
            </div>
          </div>
        </div>
        
        {Object.keys(itemsByCategory).map((category) => (
          <div key={category} className="bg-[#1E2530] p-4 rounded-lg mb-4">
            <h3 className="font-medium mb-3 text-blue-400 capitalize">{category}</h3>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2">Test</th>
                  <th className="text-center w-24 p-2">Status</th>
                  <th className="text-left p-2">Opmerkingen</th>
                </tr>
              </thead>
              <tbody>
                {itemsByCategory[category].map((item: any) => (
                  <tr key={item.id} className="border-t border-gray-700">
                    <td className="p-2">{item.description}</td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          className={`p-1 rounded ${item.passed === true ? 'bg-green-600' : 'bg-gray-700 hover:bg-green-600'}`}
                          onClick={() => handleItemChange(item.id, 'passed', true)}
                        >
                          <Check size={18} />
                        </button>
                       <button
                         className={`p-1 rounded text-xs font-medium ${item.passed === 'nvt' ? 'bg-yellow-600 text-white' : 'bg-gray-700 hover:bg-yellow-600 text-gray-300'}`}
                         onClick={() => handleItemChange(item.id, 'passed', 'nvt')}
                         title="Niet van toepassing"
                       >
                         N.v.t.
                       </button>
                        <button
                          className={`p-1 rounded ${item.passed === false ? 'bg-red-600' : 'bg-gray-700 hover:bg-red-600'}`}
                          onClick={() => handleItemChange(item.id, 'passed', false)}
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
        
        <div className="flex justify-end mt-4">
          <button
            className={`btn-primary ${isTestComplete() ? '' : 'opacity-50 cursor-not-allowed'}`}
            onClick={handleComplete}
            disabled={!isTestComplete()}
          >
            Test voltooien
          </button>
        </div>
      </div>
    );
  };

  const getTestStatusBadge = () => {
    if (testData.factoryTest.completed) {
      return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">FAT Voltooid</span>;
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
          className="bg-[#1E2530] rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              FAT Test: {verdelerInfo.id} - {verdelerInfo.name}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          
          {renderFactoryTest()}
        </div>
      </div>
    );
  }, [showModal, verdelerInfo, testData, handleBackdropClick, isTestComplete, handleComplete]);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary flex items-center space-x-2"
        title="FAT Test"
      >
        <CheckSquare size={16} />
        <span>FAT Test</span>
        {testData.factoryTest.completed && (
          <div className="ml-2">{getTestStatusBadge()}</div>
        )}
      </button>

      {showModal && createPortal(ModalContent, document.body)}
    </>
  );
};

export default FATTest;