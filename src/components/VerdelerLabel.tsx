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
    <div className="w-[100mm] h-[50mm] bg-white p-3 relative flex flex-col" style={{ color: '#000000' }}>
      <div className="flex justify-between items-start gap-3">
        {/* Left side - Logo and company info */}
        <div className="flex flex-col flex-1">
          <img src="/EWP-logo-zwart.png" alt="EWP Logo" className="h-12 object-contain mb-2" style={{ width: 'auto' }} />
          <div className="text-[9pt] leading-normal text-black">
            <p className="text-black font-medium">EWP Paneelbouw</p>
            <p className="text-black">Gildenstraat 28</p>
            <p className="text-black">4143HS Leerdam</p>
            <p className="text-black">www.ewpmidden.nl</p>
            <p className="text-black">Patrick@ewpmidden.nl</p>
            <p className="text-black">06-27343669</p>
          </div>
        </div>

        {/* Right side - QR Code */}
        <div className="flex flex-col items-center justify-start">
          <div className="bg-white p-1 border-2 border-gray-400">
            <QRCodeSVG
              value={maintenanceUrl}
              size={90}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-[7pt] mt-1 text-center text-black font-medium">Scan voor onderhoud</p>
        </div>
      </div>

      {/* Details section */}
      <div className="mt-3 text-[9pt] grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex justify-between">
          <span className="font-bold text-black">Verdeler ID:</span>
          <span className="text-black">{verdeler.distributor_id || verdeler.distributorId}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Project:</span>
          <span className="text-black">{displayProjectNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Kastnaam:</span>
          <span className="text-black">{verdeler.kast_naam || verdeler.kastNaam || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Systeem:</span>
          <span className="text-black">{verdeler.systeem || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Voeding:</span>
          <span className="text-black">{verdeler.voeding || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Un in V:</span>
          <span className="text-black">{verdeler.un_in_v || verdeler.unInV || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">In in A:</span>
          <span className="text-black">{verdeler.in_in_a || verdeler.inInA || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Freq. in Hz:</span>
          <span className="text-black">{verdeler.freq_in_hz || verdeler.freqInHz || '-'}</span>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: 100mm 50mm;
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