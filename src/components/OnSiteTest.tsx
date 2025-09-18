import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, CheckSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface OnSiteTestProps {
  verdeler: any;
  projectNumber: string;
  onComplete: (testData: any) => void;
}

const OnSiteTest: React.FC<OnSiteTestProps> = ({ verdeler, projectNumber, onComplete }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Initialize test data with stable structure using useMemo
  const initialTestData = useMemo(() => ({
    onSiteTest: {
      completed: false,
      date: new Date().toISOString().split('T')[0],
      testedBy: '',
      location: '',
      transportDamage: false,
      reassemblyRequired: false,
      items: [
        { id: 1, description: 'Visuele inspectie op transportschade', passed: null, notes: '' },
        { id: 2, description: 'Controle bevestigingen en verbindingen na transport', passed: null, notes: '' },
        { id: 3, description: 'Herbevestiging van losgeraakte onderdelen', passed: null, notes: '' },
        { id: 4, description: 'Controle van alle elektrische verbindingen', passed: null, notes: '' },
        { id: 5, description: 'Controle van aardverbindingen', passed: null, notes: '' },
        { id: 6, description: 'Controle van kabelverbindingen en wartels', passed: null, notes: '' },
        { id: 7, description: 'Test van hoofdschakelaar functionaliteit', passed: null, notes: '' },
        { id: 8, description: 'Controle van beveiligingen en automaten', passed: null, notes: '' },
        { id: 9, description: 'Test van noodstop functionaliteit (indien aanwezig)', passed: null, notes: '' },
        { id: 10, description: 'Controle van signalering en indicatie', passed: null, notes: '' },
        { id: 11, description: 'Isolatiemeting tussen fasen', passed: null, notes: '' },
        { id: 12, description: 'Isolatiemeting fase naar aarde', passed: null, notes: '' },
        { id: 13, description: 'Doorgangsmeting aardverbindingen', passed: null, notes: '' },
        { id: 14, description: 'Functionele test van alle uitgaande groepen', passed: null, notes: '' },
        { id: 15, description: 'Controle van fasevolgorde (bij 3-fasen installaties)', passed: null, notes: '' },
        { id: 16, description: 'Test van RCD/aardlekschakelaars (indien aanwezig)', passed: null, notes: '' },
        { id: 17, description: 'Controle van kastverlichting en hulpvoeding', passed: null, notes: '' },
        { id: 18, description: 'Documentatie controle (schema\'s, certificaten)', passed: null, notes: '' },
        { id: 19, description: 'Oplevering aan eindgebruiker met instructies', passed: null, notes: '' },
        { id: 20, description: 'Ondertekening opleveringsprotocol', passed: null, notes: '' }
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
    const savedTestData = localStorage.getItem(`onsite_test_${verdeler.distributorId}`);
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
      localStorage.setItem(`onsite_test_${verdeler.distributorId}`, JSON.stringify(testData));
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
      onSiteTest: {
        ...testData.onSiteTest,
        completed: true
      }
    };
    
    setTestData(updatedTestData);
    
    // Save immediately with updated data
    try {
      localStorage.setItem(`onsite_test_${verdeler.distributorId}`, JSON.stringify(updatedTestData));
      onComplete(updatedTestData);
    } catch (error) {
      console.error('Error saving test data:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de testgegevens');
      return;
    }
    
    toast.success('Test op locatie succesvol afgerond!');
    setShowModal(false);
  }, [testData, verdeler.distributorId, onComplete]);

  // Create stable, memoized change handlers
  const handleBasicFieldChange = useCallback((field: string) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTestData(prev => ({
        ...prev,
        onSiteTest: {
          ...prev.onSiteTest,
          [field]: value
        }
      }));
    };
  }, []);

  const handleItemChange = useCallback((id: number, field: string, value: any) => {
    setTestData(prev => {
      const newData = { ...prev };
      const onSiteTest = { ...newData.onSiteTest };
      const items = [...onSiteTest.items];
      const itemIndex = items.findIndex(item => item.id === id);
      
      if (itemIndex !== -1) {
        items[itemIndex] = { ...items[itemIndex], [field]: value };
      }
      
      onSiteTest.items = items;
      newData.onSiteTest = onSiteTest;
      return newData;
    });
  }, []);

  const isTestComplete = useCallback(() => {
   return testData.onSiteTest.items.every((item: any) => item.passed !== null && item.passed !== undefined) && 
           testData.onSiteTest.testedBy.trim() !== '' &&
           testData.onSiteTest.location.trim() !== '';
  }, [testData]);

  // Memoize change handlers for each field
  const dateHandler = useMemo(() => handleBasicFieldChange('date'), [handleBasicFieldChange]);
  const testerHandler = useMemo(() => handleBasicFieldChange('testedBy'), [handleBasicFieldChange]);
  const locationHandler = useMemo(() => handleBasicFieldChange('location'), [handleBasicFieldChange]);

  const renderOnSiteTest = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-blue-400">Test op Locatie</h2>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Datum</label>
            <input
              type="date"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.onSiteTest.date}
              onChange={dateHandler}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Getest door</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.onSiteTest.testedBy}
              onChange={testerHandler}
              placeholder="Naam tester"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Locatie</label>
            <input
              type="text"
              className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              value={testData.onSiteTest.location}
              onChange={locationHandler}
              placeholder="Installatielocatie"
            />
          </div>
        </div>
        
        <div className="bg-[#1E2530] p-4 rounded-lg mb-4">
          <h3 className="font-medium mb-3">Transport en Herinstallatie</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Transportschade geconstateerd?</label>
              <div className="flex space-x-4">
                <button
                  className={`px-4 py-2 rounded ${testData.onSiteTest.transportDamage === true ? 'bg-red-600' : 'bg-gray-700 hover:bg-red-600'}`}
                  onClick={() => setTestData(prev => ({
                    ...prev,
                    onSiteTest: { ...prev.onSiteTest, transportDamage: true }
                  }))}
                >
                  Ja
                </button>
                <button
                  className={`px-4 py-2 rounded ${testData.onSiteTest.transportDamage === false ? 'bg-green-600' : 'bg-gray-700 hover:bg-green-600'}`}
                  onClick={() => setTestData(prev => ({
                    ...prev,
                    onSiteTest: { ...prev.onSiteTest, transportDamage: false }
                  }))}
                >
                  Nee
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Hermontage vereist?</label>
              <div className="flex space-x-4">
                <button
                  className={`px-4 py-2 rounded ${testData.onSiteTest.reassemblyRequired === true ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-yellow-600'}`}
                  onClick={() => setTestData(prev => ({
                    ...prev,
                    onSiteTest: { ...prev.onSiteTest, reassemblyRequired: true }
                  }))}
                >
                  Ja
                </button>
                <button
                  className={`px-4 py-2 rounded ${testData.onSiteTest.reassemblyRequired === false ? 'bg-green-600' : 'bg-gray-700 hover:bg-green-600'}`}
                  onClick={() => setTestData(prev => ({
                    ...prev,
                    onSiteTest: { ...prev.onSiteTest, reassemblyRequired: false }
                  }))}
                >
                  Nee
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-[#1E2530] p-4 rounded-lg">
          <h3 className="font-medium mb-3 text-blue-400">Installatie en Test Checklist</h3>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2">Controle</th>
                <th className="text-center w-24 p-2">Status</th>
                <th className="text-left p-2">Opmerkingen</th>
              </tr>
            </thead>
            <tbody>
              {testData.onSiteTest.items.map((item: any) => (
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
    if (testData.onSiteTest.completed) {
      return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Locatie Test Voltooid</span>;
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
              Test op Locatie: {verdelerInfo.id} - {verdelerInfo.name}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          
          {renderOnSiteTest()}
        </div>
      </div>
    );
  }, [showModal, verdelerInfo, testData, handleBackdropClick, isTestComplete, handleComplete]);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary flex items-center space-x-2"
        title="Test op locatie"
      >
        <CheckSquare size={16} />
        <span>Test op locatie</span>
        {testData.onSiteTest.completed && (
          <div className="ml-2">{getTestStatusBadge()}</div>
        )}
      </button>

      {showModal && createPortal(ModalContent, document.body)}
    </>
  );
};

export default OnSiteTest;