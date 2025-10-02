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
    <div className="w-[125mm] h-[95mm] bg-white p-4 relative" style={{ color: '#000000' }}>
      <div className="flex justify-between items-start">
        {/* Left side - Logo and company info */}
        <div className="flex flex-col" style={{ maxWidth: '60%' }}>
          <img src="/EWP-logo-zwart.png" alt="EWP Logo" className="h-11 object-contain mb-2" />
          <div className="text-[8pt] leading-tight text-black">
            <p className="text-black">EWP Paneelbouw</p>
            <p className="text-black">Gildenstraat 28</p>
            <p className="text-black">4143HS Leerdam</p>
            <p className="text-black">www.ewpmidden.nl</p>
            <p className="text-black">Patrick@ewpmidden.nl</p>
            <p className="text-black">06-27343669</p>
          </div>
        </div>

        {/* Right side - QR Code */}
        <div className="flex flex-col items-center" style={{ maxWidth: '35%' }}>
          <div className="bg-white p-1 border border-gray-300">
            <QRCodeSVG
              value={maintenanceUrl}
              size={130}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-[7pt] mt-1 text-center" style={{ color: '#000000' }}>Scan voor onderhoud</p>
        </div>
      </div>

      {/* Details section */}
      <div className="mt-4 text-[10pt] grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#000000' }}>Verdeler ID:</span>
          <span style={{ color: '#000000' }}>{verdeler.distributor_id || verdeler.distributorId}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#000000' }}>Project:</span>
          <span style={{ color: '#000000' }}>{displayProjectNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#000000' }}>Kastnaam:</span>
          <span style={{ color: '#000000' }}>{verdeler.kast_naam || verdeler.kastNaam || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#000000' }}>Systeem:</span>
          <span style={{ color: '#000000' }}>{verdeler.systeem || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#000000' }}>Voeding:</span>
          <span style={{ color: '#000000' }}>{verdeler.voeding || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#000000' }}>Un in V:</span>
          <span style={{ color: '#000000' }}>{verdeler.un_in_v || verdeler.unInV || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#000000' }}>In in A:</span>
          <span style={{ color: '#000000' }}>{verdeler.in_in_a || verdeler.inInA || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#000000' }}>Freq. in Hz:</span>
          <span style={{ color: '#000000' }}>{verdeler.freq_in_hz || verdeler.freqInHz || '-'}</span>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: 125mm 95mm;
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