import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, CheckSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface HighVoltageTestProps {
  verdeler: any;
  projectNumber: string;
  onComplete: (testData: any) => void;
}

const HighVoltageTest: React.FC<HighVoltageTestProps> = ({ verdeler, projectNumber, onComplete }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Initialize test data with stable structure using useMemo
  const initialTestData = useMemo(() => ({
    highVoltageTest: {
      completed: false,
      date: new Date().toISOString().split('T')[0],
      testedBy: '',
      testVoltage: '',
      testDuration: '',
      ambientTemperature: '',
      humidity: '',
      items: [
        { id: 1, description: 'Is het verdeelsysteem volledig spanningsloos gemaakt vóór de test?', passed: null, notes: '' },
        { id: 2, description: 'Zijn alle externe verbindingen en de aarding gecontroleerd en indien nodig losgekoppeld of goed geaard?', passed: null, notes: '' },
        { id: 3, description: 'Is de juiste testspanning volgens de geldende norm ingesteld?', passed: null, notes: '' },
        { id: 4, description: 'Wordt de testspanning aangelegd tussen de juiste punten (alle actieve delen en de aardklem/behuizing)?', passed: null, notes: '' },
        { id: 5, description: 'Is de testspanning gedurende de voorgeschreven tijdsduur aangehouden (minimaal 1 minuut)?', passed: null, notes: '' },
        { id: 6, description: 'Is de meetopstelling veilig voor het personeel (o.a. afzettingen en PBM\'s)?', passed: null, notes: '' },
        { id: 7, description: 'Is er tijdens de test geen ongewenste doorslag of te hoge lekstroom gemeten?', passed: null, notes: '' },
        { id: 8, description: 'Zijn alle relevante polen en combinaties van fasen en nul getest?', passed: null, notes: '' },
        { id: 9, description: 'Is de test uitgevoerd onder geschikte omgevingstemperatuur en luchtvochtigheid?', passed: null, notes: '' },
        { id: 10, description: 'Zijn gevoelige componenten (zoals overspanningsbeveiliging of elektronica) vooraf losgenomen of beschermd?', passed: null, notes: '' },
        { id: 11, description: 'Zijn de meetresultaten en de tijdsduur correct geregistreerd?', passed: null, notes: '' },
        { id: 12, description: 'Is de verdeler na de test weer correct aangesloten en bedrijfsklaar gemaakt?', passed: null, notes: '' },
        { id: 13, description: 'Zijn er na de test geen zichtbare beschadigingen aan de isolatie of componenten geconstateerd?', passed: null, notes: '' },
        { id: 14, description: 'Is de gebruikte testapparatuur gekalibreerd en goedgekeurd?', passed: null, notes: '' },
        { id: 15, description: 'Is het testresultaat besproken met de verantwoordelijke of opdrachtgever?', passed: null, notes: '' }
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
    const savedTestData = localStorage.getItem(`hv_test_${verdelerInfo.id}`);
    if (savedTestData) {
      try {
        const parsed = JSON.parse(savedTestData);
        setTestData(parsed);
      } catch (error) {
        console.error('Error parsing saved test data:', error);
        toast.error('Er is een fout opgetreden bij het laden van de testgegevens');
      }
    }
  }, [verdelerInfo.id]);

  const saveTestData = useCallback((): boolean => {
    try {
      localStorage.setItem(`hv_test_${verdelerInfo.id}`, JSON.stringify(testData));
      onComplete(testData);
      return true;
    } catch (error) {
      console.error('Error saving test data:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de testgegevens');
      return false;
    }
  }, [testData, verdelerInfo.id, onComplete]);

  const handleComplete = useCallback(() => {
    const updatedTestData = {
      ...testData,
      highVoltageTest: {
        ...testData.highVoltageTest,
        completed: true
      }
    };
    
    setTestData(updatedTestData);
    
    // Save immediately with updated data
    try {
      localStorage.setItem(`hv_test_${verdelerInfo.id}`, JSON.stringify(updatedTestData));
      onComplete(updatedTestData);
    } catch (error) {
      console.error('Error saving test data:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de testgegevens');
      return;
    }

    toast.success('Hoogspanning test succesvol afgerond!');
    setShowModal(false);
  }, [testData, verdelerInfo.id, onComplete]);

  // Create stable, memoized change handlers
  const handleBasicFieldChange = useCallback((field: string) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTestData(prev => ({
        ...prev,
        highVoltageTest: {
          ...prev.highVoltageTest,
          [field]: value
        }
      }));
    };
  }, []);

  const handleItemChange = useCallback((id: number, field: string, value: any) => {
    setTestData(prev => {
      const newData = { ...prev };
      const highVoltageTest = { ...newData.highVoltageTest };
      const items = [...highVoltageTest.items];
      const itemIndex = items.findIndex(item => item.id === id);
      
      if (itemIndex !== -1) {
        items[itemIndex] = { ...items[itemIndex], [field]: value };
      }
      
      highVoltageTest.items = items;
      newData.highVoltageTest = highVoltageTest;
      return newData;
    });
  }, []);

  const isTestComplete = useCallback(() => {
   return testData.highVoltageTest.items.every((item: any) => item.passed !== null && item.passed !== undefined) && 
           testData.highVoltageTest.testedBy.trim() !== '';
  }, [testData]);

  // Memoize change handlers for each field
  const dateHandler = useMemo(() => handleBasicFieldChange('date'), [handleBasicFieldChange]);
  const testerHandler = useMemo(() => handleBasicFieldChange('testedBy'), [handleBasicFieldChange]);
  const testVoltageHandler = useMemo(() => handleBasicFieldChange('testVoltage'), [handleBasicFieldChange]);
  const testDurationHandler = useMemo(() => handleBasicFieldChange('testDuration'), [handleBasicFieldChange]);
  const ambientTemperatureHandler = useMemo(() => handleBasicFieldChange('ambientTemperature'), [handleBasicFieldChange]);
  const humidityHandler = useMemo(() => handleBasicFieldChange('humidity'), [handleBasicFieldChange]);

  const renderHighVoltageTest = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-blue-400">Hoogspanning Test</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Datum</label>
            <input
              type="date"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.highVoltageTest.date}
              onChange={dateHandler}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Getest door</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.highVoltageTest.testedBy}
              onChange={testerHandler}
              placeholder="Naam tester"
            />
          </div>
        </div>
        
        <div className="bg-[#1E2530] p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">Test Parameters</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Testspanning (V)</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.highVoltageTest.testVoltage}
                onChange={testVoltageHandler}
                placeholder="Testspanning"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Test duur (minuten)</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.highVoltageTest.testDuration}
                onChange={testDurationHandler}
                placeholder="Test duur"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Omgevingstemperatuur (°C)</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.highVoltageTest.ambientTemperature}
                onChange={ambientTemperatureHandler}
                placeholder="Temperatuur"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Luchtvochtigheid (%)</label>
              <input
                type="text"
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                value={testData.highVoltageTest.humidity}
                onChange={humidityHandler}
                placeholder="Luchtvochtigheid"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-[#1E2530] p-4 rounded-lg">
          <h3 className="font-medium mb-3 text-blue-400">Veiligheids- en Testchecklist</h3>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2">Controle</th>
                <th className="text-center w-24 p-2">Status</th>
                <th className="text-left p-2">Opmerkingen</th>
              </tr>
            </thead>
            <tbody>
              {testData.highVoltageTest.items.map((item: any) => (
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
    if (testData.highVoltageTest.completed) {
      return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">HV Test Voltooid</span>;
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
              Hoogspanning Test: {verdelerInfo.id} - {verdelerInfo.name}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          
          {renderHighVoltageTest()}
        </div>
      </div>
    );
  }, [showModal, verdelerInfo, testData, handleBackdropClick, isTestComplete, handleComplete]);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary flex items-center space-x-2"
        title="Hoogspanning test"
      >
        <CheckSquare size={16} />
        <span>Hoogspanning test</span>
        {testData.highVoltageTest.completed && (
          <div className="ml-2">{getTestStatusBadge()}</div>
        )}
      </button>

      {showModal && createPortal(ModalContent, document.body)}
    </>
  );
};

export default HighVoltageTest;