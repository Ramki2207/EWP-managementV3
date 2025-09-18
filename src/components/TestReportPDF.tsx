import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

interface TestReportPDFProps {
  testData: any;
  verdeler: any;
  projectNumber: string;
}

const TestReportPDF: React.FC<TestReportPDFProps> = ({ testData, verdeler, projectNumber }) => {
  if (!testData) {
    return (
      <div className="p-4 bg-white text-black">
        <p className="text-center">Geen testgegevens beschikbaar voor deze verdeler</p>
      </div>
    );
  }

  const getStatusIcon = (passed: boolean | null) => {
    if (passed === true) return <Check className="text-green-500" />;
    if (passed === false) return <X className="text-red-500" />;
    if (passed === 'nvt') return <span className="text-yellow-500 text-xs font-bold">N.v.t.</span>;
    return <AlertTriangle className="text-yellow-500" />;
  };

  const getResultBadge = (result: string | null) => {
    if (result === 'approved') {
      return <span className="px-3 py-1 bg-green-600 text-white rounded-full">Goedgekeurd</span>;
    } else if (result === 'conditionallyApproved') {
      return <span className="px-3 py-1 bg-yellow-600 text-white rounded-full">Voorwaardelijk goedgekeurd</span>;
    } else if (result === 'rejected') {
      return <span className="px-3 py-1 bg-red-600 text-white rounded-full">Afgekeurd</span>;
    }
    return <span className="px-3 py-1 bg-gray-600 text-white rounded-full">Onbekend</span>;
  };

  const renderWorkshopChecklist = () => {
    if (!testData.workshopChecklist) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Geen werkplaats checklist beschikbaar</p>
        </div>
      );
    }
    
    const { workshopChecklist } = testData;
    
    return (
      <div className="space-y-6 p-8 bg-white text-black">
        <div className="border-b border-gray-300 pb-4 mb-6">
          <h2 className="text-xl font-semibold">Werkplaats Checklist</h2>
          <div className="flex justify-between mt-2">
            <p>Verdeler: {verdeler.distributorId} - {verdeler.kastNaam || 'Naamloos'}</p>
            <p>Project: {projectNumber}</p>
          </div>
          <div className="flex justify-between mt-2">
            <p>Datum: {workshopChecklist.date ? new Date(workshopChecklist.date).toLocaleDateString('nl-NL') : '-'}</p>
            <p>Uitgevoerd door: {workshopChecklist.testedBy || '-'}</p>
          </div>
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left p-2">Controle</th>
              <th className="text-center w-24 p-2">Status</th>
              <th className="text-left p-2">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {workshopChecklist.items && workshopChecklist.items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-center">
                  <div className="flex justify-center">
                    {item.passed === true ? '✓' : item.passed === false ? '✗' : item.passed === 'nvt' ? 'N.v.t.' : '?'}
                  </div>
                </td>
                <td className="p-2">{item.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderFactoryTest = () => {
    if (!testData.factoryTest) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Geen factory acceptance test beschikbaar</p>
        </div>
      );
    }
    
    const { factoryTest } = testData;
    
    return (
      <div className="space-y-6 p-8 bg-white text-black">
        <div className="border-b border-gray-300 pb-4 mb-6">
          <h2 className="text-xl font-semibold">Factory Acceptance Test (FAT)</h2>
          <div className="flex justify-between mt-2">
            <p>Verdeler: {verdeler.distributorId} - {verdeler.kastNaam || 'Naamloos'}</p>
            <p>Project: {projectNumber}</p>
          </div>
          <div className="flex justify-between mt-2">
            <p>Datum: {factoryTest.date ? new Date(factoryTest.date).toLocaleDateString('nl-NL') : '-'}</p>
            <p>Uitgevoerd door: {factoryTest.testedBy || '-'}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 border border-gray-300 mb-4">
          <h3 className="font-medium mb-3">Meetwaarden</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Isolatieweerstand (MΩ)</p>
              <p>{factoryTest.measurements?.isolationResistance || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Doorgangstest (Ω)</p>
              <p>{factoryTest.measurements?.continuityTest || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Functionele test (V)</p>
              <p>{factoryTest.measurements?.functionalTest || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Spanningstest (V)</p>
              <p>{factoryTest.measurements?.voltageTest || '-'}</p>
            </div>
          </div>
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left p-2">Test</th>
              <th className="text-center w-24 p-2">Status</th>
              <th className="text-left p-2">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {factoryTest.items && factoryTest.items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-center">
                  <div className="flex justify-center">
                    {item.passed === true ? '✓' : item.passed === false ? '✗' : item.passed === 'nvt' ? 'N.v.t.' : '?'}
                  </div>
                </td>
                <td className="p-2">{item.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderHighVoltageTest = () => {
    if (!testData.highVoltageTest) {
      return null;
    }
    
    const { highVoltageTest } = testData;
    
    return (
      <div className="space-y-6 p-8 bg-white text-black">
        <div className="border-b border-gray-300 pb-4 mb-6">
          <h2 className="text-xl font-semibold">Hoogspanning Test</h2>
          <div className="flex justify-between mt-2">
            <p>Verdeler: {verdeler.distributorId} - {verdeler.kastNaam || 'Naamloos'}</p>
            <p>Project: {projectNumber}</p>
          </div>
          <div className="flex justify-between mt-2">
            <p>Datum: {highVoltageTest.date ? new Date(highVoltageTest.date).toLocaleDateString('nl-NL') : '-'}</p>
            <p>Uitgevoerd door: {highVoltageTest.testedBy || '-'}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 border border-gray-300 mb-4">
          <h3 className="font-medium mb-3">Test Parameters</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Testspanning (V)</p>
              <p>{highVoltageTest.testVoltage || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Test duur (minuten)</p>
              <p>{highVoltageTest.testDuration || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Omgevingstemperatuur (°C)</p>
              <p>{highVoltageTest.ambientTemperature || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Luchtvochtigheid (%)</p>
              <p>{highVoltageTest.humidity || '-'}</p>
            </div>
          </div>
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left p-2">Controle</th>
              <th className="text-center w-24 p-2">Status</th>
              <th className="text-left p-2">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {highVoltageTest.items && highVoltageTest.items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-center">
                  <div className="flex justify-center">
                    {item.passed === true ? '✓' : item.passed === false ? '✗' : item.passed === 'nvt' ? 'N.v.t.' : '?'}
                  </div>
                </td>
                <td className="p-2">{item.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderOnSiteTest = () => {
    if (!testData.onSiteTest) {
      return null;
    }
    
    const { onSiteTest } = testData;
    
    return (
      <div className="space-y-6 p-8 bg-white text-black">
        <div className="border-b border-gray-300 pb-4 mb-6">
          <h2 className="text-xl font-semibold">Test op Locatie</h2>
          <div className="flex justify-between mt-2">
            <p>Verdeler: {verdeler.distributorId} - {verdeler.kastNaam || 'Naamloos'}</p>
            <p>Project: {projectNumber}</p>
          </div>
          <div className="flex justify-between mt-2">
            <p>Datum: {onSiteTest.date ? new Date(onSiteTest.date).toLocaleDateString('nl-NL') : '-'}</p>
            <p>Uitgevoerd door: {onSiteTest.testedBy || '-'}</p>
          </div>
          <div className="mt-2">
            <p>Locatie: {onSiteTest.location || '-'}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 border border-gray-300 mb-4">
          <h3 className="font-medium mb-3">Transport en Herinstallatie</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Transportschade geconstateerd?</p>
              <p>{onSiteTest.transportDamage ? 'Ja' : 'Nee'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hermontage vereist?</p>
              <p>{onSiteTest.reassemblyRequired ? 'Ja' : 'Nee'}</p>
            </div>
          </div>
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left p-2">Controle</th>
              <th className="text-center w-24 p-2">Status</th>
              <th className="text-left p-2">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {onSiteTest.items && onSiteTest.items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-center">
                  <div className="flex justify-center">
                    {item.passed === true ? '✓' : item.passed === false ? '✗' : item.passed === 'nvt' ? 'N.v.t.' : '?'}
                  </div>
                </td>
                <td className="p-2">{item.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderInspectionReport = () => {
    if (!testData.inspectionReport) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600">Geen keuringsrapport beschikbaar</p>
        </div>
      );
    }
    
    const { inspectionReport } = testData;
    
    return (
      <div className="space-y-6 p-8 bg-white text-black">
        <div className="border-b border-gray-300 pb-4 mb-6">
          <h2 className="text-xl font-semibold">Keuringsrapport</h2>
          <div className="flex justify-between mt-2">
            <p>Verdeler: {verdeler.distributorId} - {verdeler.kastNaam || 'Naamloos'}</p>
            <p>Project: {projectNumber}</p>
          </div>
          <div className="flex justify-between mt-2">
            <p>Datum: {inspectionReport.date ? new Date(inspectionReport.date).toLocaleDateString('nl-NL') : '-'}</p>
            <p>Geïnspecteerd door: {inspectionReport.inspectedBy || '-'}</p>
          </div>
          <div className="mt-2">
            <p>Goedgekeurd door: {inspectionReport.approvedBy || '-'}</p>
          </div>
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left p-2">Controle</th>
              <th className="text-center w-24 p-2">Status</th>
              <th className="text-left p-2">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {inspectionReport.items && inspectionReport.items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-300">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-center">
                  <div className="flex justify-center">
                    {item.passed === true ? '✓' : item.passed === false ? '✗' : item.passed === 'nvt' ? 'N.v.t.' : '?'}
                  </div>
                </td>
                <td className="p-2">{item.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="bg-white p-4 border border-gray-300">
          <div className="mb-4">
            <h3 className="font-medium mb-2">Eindresultaat</h3>
            <div>
              {inspectionReport.result === 'approved' ? 'Goedgekeurd' : 
               inspectionReport.result === 'conditionallyApproved' ? 'Voorwaardelijk goedgekeurd' : 
               inspectionReport.result === 'rejected' ? 'Afgekeurd' : 'Onbekend'}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Opmerkingen</h3>
            <p className="whitespace-pre-wrap">{inspectionReport.notes || '-'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white text-black">
      <div className="print:block">
        {renderWorkshopChecklist()}
        <div className="page-break"></div>
        {renderFactoryTest()}
        <div className="page-break"></div>
        {renderInspectionReport()}
        {testData.highVoltageTest && (
          <>
            <div className="page-break"></div>
            {renderHighVoltageTest()}
          </>
        )}
        {testData.onSiteTest && (
          <>
            <div className="page-break"></div>
            {renderOnSiteTest()}
          </>
        )}
      </div>
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
};

export default TestReportPDF;