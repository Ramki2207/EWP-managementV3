import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ewpLogo from '../assets/ewp-logo.png';

interface VerdelerLabelProps {
  verdeler: any;
  projectNumber: string;
  logo: string;
}

const VerdelerLabel: React.FC<VerdelerLabelProps> = ({ verdeler, projectNumber }) => {
  // Create URL for maintenance report
  const maintenanceUrl = `${window.location.origin}/maintenance-report?verdeler_id=${encodeURIComponent(verdeler.distributorId || verdeler.distributor_id)}&project_number=${encodeURIComponent(projectNumber)}&kast_naam=${encodeURIComponent(verdeler.kastNaam || verdeler.kast_naam || '')}`;

  return (
    <div className="w-[125mm] h-[95mm] bg-black p-4 relative" style={{ color: '#FFFFFF' }}>
      <div className="flex justify-between items-start">
        {/* Left side - Logo and company info */}
        <div className="flex flex-col" style={{ maxWidth: '60%' }}>
          <img src={ewpLogo} alt="EWP Logo" className="h-11 object-contain mb-2" />
          <div className="text-[8pt] leading-tight" style={{ color: '#000000' }}>
            <p>EWP Paneelbouw</p>
            <p>Gildenstraat 28</p>
            <p>4143HS Leerdam</p>
            <p>www.ewpmidden.nl</p>
            <p>Patrick@ewpmidden.nl</p>
            <p>06-27343669</p>
          </div>
        </div>

        {/* Right side - QR Code */}
        <div className="flex flex-col items-center" style={{ maxWidth: '35%' }}>
          <div className="bg-white p-1 border border-gray-200">
            <QRCodeSVG 
              value={maintenanceUrl}
              size={130}
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-[7pt] mt-1 text-center" style={{ color: '#FFFFFF' }}>Scan voor onderhoud</p>
        </div>
      </div>

      {/* Details section */}
      <div className="mt-4 text-[10pt] grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>Verdeler ID:</span>
          <span style={{ color: '#FFFFFF' }}>{verdeler.distributorId}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>Project:</span>
          <span style={{ color: '#FFFFFF' }}>{projectNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>Kastnaam:</span>
          <span style={{ color: '#FFFFFF' }}>{verdeler.kastNaam || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>Systeem:</span>
          <span style={{ color: '#FFFFFF' }}>{verdeler.systeem || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>Voeding:</span>
          <span style={{ color: '#FFFFFF' }}>{verdeler.voeding || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>Un in V:</span>
          <span style={{ color: '#FFFFFF' }}>{verdeler.unInV || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>In in A:</span>
          <span style={{ color: '#FFFFFF' }}>{verdeler.inInA || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold" style={{ color: '#FFFFFF' }}>Freq. in Hz:</span>
          <span style={{ color: '#FFFFFF' }}>{verdeler.freqInHz || '-'}</span>
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
            background-color: black !important;
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