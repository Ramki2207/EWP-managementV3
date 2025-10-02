import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface VerdelerLabelProps {
  verdeler: any;
  projectNumber: string;
  logo: string;
}

const VerdelerLabel: React.FC<VerdelerLabelProps> = ({ verdeler, projectNumber }) => {
  // Create URL for maintenance report
  const maintenanceUrl = `${window.location.origin}/maintenance-report?verdeler_id=${encodeURIComponent(verdeler.distributor_id || verdeler.distributorId)}&project_number=${encodeURIComponent(projectNumber)}&kast_naam=${encodeURIComponent(verdeler.kast_naam || verdeler.kastNaam || '')}`;

  // Remove hyphen from project number for display
  const displayProjectNumber = projectNumber.replace(/-/g, '');

  return (
    <div className="w-[152.4mm] h-[101.6mm] bg-white p-2 relative flex flex-row" style={{ color: '#000000' }}>
      {/* Left section - Logo and company info */}
      <div className="flex flex-col justify-between pr-2 border-r-2 border-gray-300" style={{ width: '33%' }}>
        <div>
          <img src="/EWP-logo-zwart.png" alt="EWP Logo" className="h-12 object-contain mb-1.5" style={{ width: 'auto' }} />
          <div className="text-[9pt] leading-tight text-black">
            <p className="text-black font-bold">EWP Paneelbouw</p>
            <p className="text-black">Gildenstraat 28</p>
            <p className="text-black">4143HS Leerdam</p>
            <p className="text-black">www.ewpmidden.nl</p>
            <p className="text-black">Patrick@ewpmidden.nl</p>
            <p className="text-black">06-27343669</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center">
          <div className="bg-white p-1 border-2 border-gray-500">
            <QRCodeSVG
              value={maintenanceUrl}
              size={85}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-[8pt] mt-0.5 text-center text-black font-bold">Scan voor onderhoud</p>
        </div>
      </div>

      {/* Right section - Details */}
      <div className="flex-1 pl-2 pr-1 flex flex-col justify-center">
        <div className="text-[10pt] grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex justify-between">
            <span className="font-bold text-black whitespace-nowrap">Verdeler ID:</span>
            <span className="text-black font-semibold ml-1.5">{verdeler.distributor_id || verdeler.distributorId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-black whitespace-nowrap">Project:</span>
            <span className="text-black font-semibold ml-1.5">{displayProjectNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-black whitespace-nowrap">Kastnaam:</span>
            <span className="text-black font-semibold ml-1.5 truncate">{verdeler.kast_naam || verdeler.kastNaam || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-black whitespace-nowrap">Systeem:</span>
            <span className="text-black font-semibold ml-1.5 truncate">{verdeler.systeem || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-black whitespace-nowrap">Voeding:</span>
            <span className="text-black font-semibold ml-1.5 truncate">{verdeler.voeding || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-black whitespace-nowrap">Un in V:</span>
            <span className="text-black font-semibold ml-1.5">{verdeler.un_in_v || verdeler.unInV || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-black whitespace-nowrap">In in A:</span>
            <span className="text-black font-semibold ml-1.5">{verdeler.in_in_a || verdeler.inInA || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-black whitespace-nowrap">Freq. in Hz:</span>
            <span className="text-black font-semibold ml-1.5">{verdeler.freq_in_hz || verdeler.freqInHz || '-'}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: 152.4mm 101.6mm landscape;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            color: #000000 !important;
          }
          .bg-white {
            background-color: white !important;
          }
          div {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VerdelerLabel;