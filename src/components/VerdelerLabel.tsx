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
    <div className="w-[152.4mm] h-[101.6mm] bg-white p-6 relative flex flex-col" style={{ color: '#000000' }}>
      <div className="flex justify-between items-start gap-6 mb-6">
        {/* Left side - Logo and company info */}
        <div className="flex flex-col flex-1">
          <img src="/EWP-logo-zwart.png" alt="EWP Logo" className="h-24 object-contain mb-4" style={{ width: 'auto' }} />
          <div className="text-[14pt] leading-relaxed text-black">
            <p className="text-black font-bold">EWP Paneelbouw</p>
            <p className="text-black">Gildenstraat 28</p>
            <p className="text-black">4143HS Leerdam</p>
            <p className="text-black">www.ewpmidden.nl</p>
            <p className="text-black">Patrick@ewpmidden.nl</p>
            <p className="text-black">06-27343669</p>
          </div>
        </div>

        {/* Right side - QR Code */}
        <div className="flex flex-col items-center justify-start">
          <div className="bg-white p-2 border-2 border-gray-500">
            <QRCodeSVG
              value={maintenanceUrl}
              size={140}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-[12pt] mt-2 text-center text-black font-bold">Scan voor onderhoud</p>
        </div>
      </div>

      {/* Details section */}
      <div className="text-[14pt] grid grid-cols-2 gap-x-6 gap-y-3">
        <div className="flex justify-between">
          <span className="font-bold text-black">Verdeler ID:</span>
          <span className="text-black font-semibold">{verdeler.distributor_id || verdeler.distributorId}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Project:</span>
          <span className="text-black font-semibold">{displayProjectNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Kastnaam:</span>
          <span className="text-black font-semibold">{verdeler.kast_naam || verdeler.kastNaam || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Systeem:</span>
          <span className="text-black font-semibold">{verdeler.systeem || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Voeding:</span>
          <span className="text-black font-semibold">{verdeler.voeding || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Un in V:</span>
          <span className="text-black font-semibold">{verdeler.un_in_v || verdeler.unInV || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">In in A:</span>
          <span className="text-black font-semibold">{verdeler.in_in_a || verdeler.inInA || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-black">Freq. in Hz:</span>
          <span className="text-black font-semibold">{verdeler.freq_in_hz || verdeler.freqInHz || '-'}</span>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: 152.4mm 101.6mm;
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