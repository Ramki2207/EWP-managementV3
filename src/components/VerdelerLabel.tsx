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
    <div className="w-[152.4mm] h-[101.6mm] bg-white p-4 relative flex flex-row" style={{ color: '#000000' }}>
      {/* Left section - Logo and company info */}
      <div className="flex flex-col justify-between pr-4 border-r-2 border-gray-300" style={{ width: '38%' }}>
        <div>
          <img src="/EWP-logo-zwart.png" alt="EWP Logo" className="h-16 object-contain mb-3" style={{ width: 'auto' }} />
          <div className="text-[11pt] leading-tight text-black">
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
              size={100}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-[10pt] mt-1 text-center text-black font-bold">Scan voor onderhoud</p>
        </div>
      </div>

      {/* Right section - Details */}
      <div className="flex-1 pl-4 flex flex-col justify-center">
        <div className="flex flex-col gap-y-2" style={{ fontSize: '12pt' }}>
          <div className="flex items-center">
            <span className="font-bold text-black whitespace-nowrap mr-2">Verdeler ID:</span>
            <span className="text-black font-semibold">{verdeler.distributor_id || verdeler.distributorId}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-black whitespace-nowrap mr-2">Project:</span>
            <span className="text-black font-semibold">{displayProjectNumber}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-black whitespace-nowrap mr-2">Kastnaam:</span>
            <span className="text-black font-semibold">{verdeler.kast_naam || verdeler.kastNaam || '-'}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-black whitespace-nowrap mr-2">Stelsel:</span>
            <span className="text-black font-semibold">{verdeler.systeem || '-'}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-black whitespace-nowrap mr-2">Voeding:</span>
            <span className="text-black font-semibold">{verdeler.voeding || '-'}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-black whitespace-nowrap mr-2">Un in V:</span>
            <span className="text-black font-semibold">{verdeler.un_in_v || verdeler.unInV || '-'}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-black whitespace-nowrap mr-2">In in A:</span>
            <span className="text-black font-semibold">{verdeler.in_in_a || verdeler.inInA || '-'}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-black whitespace-nowrap mr-2">Freq. in Hz:</span>
            <span className="text-black font-semibold">{verdeler.freq_in_hz || verdeler.freqInHz || '-'}</span>
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