import React, { useState } from 'react';
import { FileText, Printer, Download, Check, X, AlertTriangle } from 'lucide-react';
import TestReportPDF from './TestReportPDF';

interface TestReportViewerProps {
  testData: any;
  verdeler: any;
  projectNumber: string;
}

const TestReportViewer: React.FC<TestReportViewerProps> = ({ testData, verdeler, projectNumber }) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'fat' | 'hvt' | 'onsite' | 'report'>('checklist');
  
  if (!testData) {
    return (
      <div className="p-4 bg-[#1E2530] rounded-lg text-center">
        <p className="text-gray-400">Geen testgegevens beschikbaar voor deze verdeler</p>
      </div>
    );
  }
  
  const handlePrint = () => {
    window.print();
  };
  
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
          <p className="text-gray-400">Geen werkplaats checklist beschikbaar</p>
        </div>
      );
    }
    
    const { workshopChecklist } = testData;
    
    return (
      <div className="space-y-6 print:p-8">
        <div className="print:border-b print:border-gray-300 print:pb-4 print:mb-6">
          <h2 className="text-xl font-semibold text-blue-400 print:text-black">Werkplaats Checklist</h2>
          <div className="flex justify-between mt-2 print:text-black">
            <p>Verdeler: {verdeler.distributorId} - {verdeler.kastNaam || 'Naamloos'}</p>
            <p>Project: {projectNumber}</p>
          </div>
          <div className="flex justify-between mt-2 print:text-black">
            <p>Datum: {workshopChecklist.date ? new Date(workshopChecklist.date).toLocaleDateString('nl-NL') : '-'}</p>
            <p>Uitgevoerd door: {workshopChecklist.testedBy || '-'}</p>
          </div>
        </div>
        
        <table className="w-full print:text-black">
          <thead>
            <tr className="border-b border-gray-700 print:border-gray-300">
              <th className="text-left p-2">Controle</th>
              <th className="text-center w-24 p-2">Status</th>
              <th className="text-left p-2">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {workshopChecklist.items && workshopChecklist.items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-700 print:border-gray-300">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-center">
                  <div className="flex justify-center">
                    {getStatusIcon(item.passed)}
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
          <p className="text-gray-400">Geen factory acceptance test beschikbaar</p>
        </div>
      );
    }
    
    const { factoryTest } = testData;
    
    return (
      <div className="space-y-6 print:p-8">
        <div className="print:border-b print:border-gray-300 print:pb-4 print:mb-6">
          <h2 className="text-xl font-semibold text-blue-400 print:text-black">Factory Acceptance Test (FAT)</h2>
          <div className="flex justify-between mt-2 print:text-black">
            <p>Verdeler: {verdeler.distributorId} - {verdeler.kastNaam || 'Naamloos'}</p>
            <p>Project: {projectNumber}</p>
          </div>
          <div className="flex justify-between mt-2 print:text-black">
            <p>Datum: {factoryTest.date ? new Date(factoryTest.date).toLocaleDateString('nl-NL') : '-'}</p>
            <p>Uitgevoerd door: {factoryTest.testedBy || '-'}</p>
          </div>
        </div>
        
        <div className="bg-[#1E2530] p-4 rounded-lg mb-4 print:bg-white print:p-0 print:border print:border-gray-300 print:rounded-none">
          <h3 className="font-medium mb-3 print:text-black">Meetwaarden</h3>
          <div className="grid grid-cols-2 gap-4 print:text-black">
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Isolatieweerstand (MΩ)</p>
              <p>{factoryTest.measurements?.isolationResistance || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Doorgangstest (Ω)</p>
              <p>{factoryTest.measurements?.continuityTest || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Functionele test (V)</p>
              <p>{factoryTest.measurements?.functionalTest || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Spanningstest (V)</p>
              <p>{factoryTest.measurements?.voltageTest || '-'}</p>
            </div>
          </div>
        </div>
        
        <table className="w-full print:text-black">
          <thead>
            <tr className="border-b border-gray-700 print:border-gray-300">
              <th className="text-left p-2">Test</th>
              <th className="text-center w-24 p-2">Status</th>
              <th className="text-left p-2">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {factoryTest.items && factoryTest.items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-700 print:border-gray-300">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-center">
                  <div className="flex justify-center">
                    {getStatusIcon(item.passed)}
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
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">Geen hoogspanning test beschikbaar</p>
        </div>
      );
    }
    
    const { highVoltageTest } = testData;
    
    return (
      <div className="space-y-6 print:p-8">
        <div className="print:border-b print:border-gray-300 print:pb-4 print:mb-6">
          <h2 className="text-xl font-semibold text-blue-400 print:text-black">Hoogspanning Test</h2>
          <div className="flex justify-between mt-2 print:text-black">
            <p>Verdeler: {verdeler.distributorId} - {verdeler.kastNaam || 'Naamloos'}</p>
            <p>Project: {projectNumber}</p>
          </div>
          <div className="flex justify-between mt-2 print:text-black">
            <p>Datum: {highVoltageTest.date ? new Date(highVoltageTest.date).toLocaleDateString('nl-NL') : '-'}</p>
            <p>Uitgevoerd door: {highVoltageTest.testedBy || '-'}</p>
          </div>
        </div>
        
        <div className="bg-[#1E2530] p-4 rounded-lg mb-4 print:bg-white print:p-0 print:border print:border-gray-300 print:rounded-none">
          <h3 className="font-medium mb-3 print:text-black">Test Parameters</h3>
          <div className="grid grid-cols-2 gap-4 print:text-black">
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Testspanning (V)</p>
              <p>{highVoltageTest.testVoltage || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Test duur (minuten)</p>
              <p>{highVoltageTest.testDuration || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Omgevingstemperatuur (°C)</p>
              <p>{highVoltageTest.ambientTemperature || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Luchtvochtigheid (%)</p>
              <p>{highVoltageTest.humidity || '-'}</p>
            </div>
          </div>
        </div>
        
        <table className="w-full print:text-black">
          <thead>
            <tr className="border-b border-gray-700 print:border-gray-300">
              <th className="text-left p-2">Controle</th>
              <th className="text-center w-24 p-2">Status</th>
              <th className="text-left p-2">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {highVoltageTest.items && highVoltageTest.items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-700 print:border-gray-300">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-center">
                  <div className="flex justify-center">
                    {getStatusIcon(item.passed)}
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
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">Geen test op locatie beschikbaar</p>
        </div>
      );
    }
    
    const { onSiteTest } = testData;
    
    return (
      <div className="space-y-6 print:p-8">
        <div className="print:border-b print:border-gray-300 print:pb-4 print:mb-6">
          <h2 className="text-xl font-semibold text-blue-400 print:text-black">Test op Locatie</h2>
          <div className="flex justify-between mt-2 print:text-black">
            <p>Verdeler: {verdeler.distributorId} - {verdeler.kastNaam || 'Naamloos'}</p>
            <p>Project: {projectNumber}</p>
          </div>
          <div className="flex justify-between mt-2 print:text-black">
            <p>Datum: {onSiteTest.date ? new Date(onSiteTest.date).toLocaleDateString('nl-NL') : '-'}</p>
            <p>Uitgevoerd door: {onSiteTest.testedBy || '-'}</p>
          </div>
          <div className="mt-2 print:text-black">
            <p>Locatie: {onSiteTest.location || '-'}</p>
          </div>
        </div>
        
        <div className="bg-[#1E2530] p-4 rounded-lg mb-4 print:bg-white print:p-0 print:border print:border-gray-300 print:rounded-none">
          <h3 className="font-medium mb-3 print:text-black">Transport en Herinstallatie</h3>
          <div className="grid grid-cols-2 gap-4 print:text-black">
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Transportschade geconstateerd?</p>
              <p>{onSiteTest.transportDamage ? 'Ja' : 'Nee'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 print:text-gray-600">Hermontage vereist?</p>
              <p>{onSiteTest.reassemblyRequired ? 'Ja' : 'Nee'}</p>
            </div>
          </div>
        </div>
        
        <table className="w-full print:text-black">
          <thead>
            <tr className="border-b border-gray-700 print:border-gray-300">
              <th className="text-left p-2">Controle</th>
              <th className="text-center w-24 p-2">Status</th>
              <th className="text-left p-2">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {onSiteTest.items && onSiteTest.items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-700 print:border-gray-300">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-center">
                  <div className="flex justify-center">
                    {getStatusIcon(item.passed)}
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
          <p className="text-gray-400">Geen keuringsrapport beschikbaar</p>
        </div>
      );
    }
    
    const { inspectionReport } = testData;
    
    return (
      <div className="space-y-6 print:p-8">
        <div className="print:border-b print:border-gray-300 print:pb-4 print:mb-6">
          <h2 className="text-xl font-semibold text-blue-400 print:text-black">Keuringsrapport</h2>
          <div className="flex justify-between mt-2 print:text-black">
            <p>Verdeler: {verdeler.distributorId} - {verdeler.kastNaam || 'Naamloos'}</p>
            <p>Project: {projectNumber}</p>
          </div>
          <div className="flex justify-between mt-2 print:text-black">
            <p>Datum: {inspectionReport.date ? new Date(inspectionReport.date).toLocaleDateString('nl-NL') : '-'}</p>
            <p>Geïnspecteerd door: {inspectionReport.inspectedBy || '-'}</p>
          </div>
          <div className="mt-2 print:text-black">
            <p>Goedgekeurd door: {inspectionReport.approvedBy || '-'}</p>
          </div>
        </div>
        
        <table className="w-full print:text-black">
          <thead>
            <tr className="border-b border-gray-700 print:border-gray-300">
              <th className="text-left p-2">Controle</th>
              <th className="text-center w-24 p-2">Status</th>
              <th className="text-left p-2">Opmerkingen</th>
            </tr>
          </thead>
          <tbody>
            {inspectionReport.items && inspectionReport.items.map((item: any) => (
              <tr key={item.id} className="border-b border-gray-700 print:border-gray-300">
                <td className="p-2">{item.description}</td>
                <td className="p-2 text-center">
                  <div className="flex justify-center">
                    {getStatusIcon(item.passed)}
                  </div>
                </td>
                <td className="p-2">{item.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="bg-[#1E2530] p-4 rounded-lg print:bg-white print:p-0 print:border print:border-gray-300 print:rounded-none">
          <div className="mb-4 print:text-black">
            <h3 className="font-medium mb-2">Eindresultaat</h3>
            <div>{getResultBadge(inspectionReport.result)}</div>
          </div>
          
          <div className="print:text-black">
            <h3 className="font-medium mb-2">Opmerkingen</h3>
            <p className="whitespace-pre-wrap">{inspectionReport.notes || '-'}</p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-[#1E2530] rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-blue-400">Testrapport: {verdeler.distributorId}</h2>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="btn-secondary flex items-center space-x-2"
          >
            <Printer size={16} />
            <span>Afdrukken</span>
          </button>
        </div>
      </div>
      
      <div className="mb-6 print:hidden">
        <div className="flex border-b border-gray-700">
          <button
            className={`px-4 py-2 ${activeTab === 'checklist' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('checklist')}
          >
            Werkplaats Checklist
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'fat' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('fat')}
          >
            Factory Acceptance Test
          </button>
          {testData.highVoltageTest && (
            <button
              className={`px-4 py-2 ${activeTab === 'hvt' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('hvt')}
            >
              Hoogspanning Test
            </button>
          )}
          {testData.onSiteTest && (
            <button
              className={`px-4 py-2 ${activeTab === 'onsite' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400'}`}
              onClick={() => setActiveTab('onsite')}
            >
              Test op Locatie
            </button>
          )}
          <button
            className={`px-4 py-2 ${activeTab === 'report' ? 'border-b-2 border-blue-400 text-blue-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('report')}
          >
            Keuringsrapport
          </button>
        </div>
      </div>
      
      <div className="print:hidden">
        {activeTab === 'checklist' && renderWorkshopChecklist()}
        {activeTab === 'fat' && renderFactoryTest()}
        {activeTab === 'hvt' && renderHighVoltageTest()}
        {activeTab === 'onsite' && renderOnSiteTest()}
        {activeTab === 'report' && renderInspectionReport()}
      </div>
      
      <div className="hidden">
        <TestReportPDF 
          testData={testData}
          verdeler={verdeler}
          projectNumber={projectNumber}
        />
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

export default TestReportViewer;