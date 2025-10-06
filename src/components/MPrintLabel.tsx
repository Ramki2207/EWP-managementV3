import React, { useRef } from 'react';
import { Download } from 'lucide-react';
import VerdelerLabel from './VerdelerLabel';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface MPrintLabelProps {
  verdeler: any;
  projectNumber: string;
  logo: string;
}

const MPrintLabel: React.FC<MPrintLabelProps> = ({ verdeler, projectNumber, logo }) => {
  const labelRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!labelRef.current) return;

    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 4,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: labelRef.current.offsetWidth,
        height: labelRef.current.offsetHeight
      });

      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `M-Print-${verdeler.distributorId || verdeler.distributor_id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success('Label gedownload als PNG!');
      }, 'image/png');
    } catch (error) {
      console.error('Error generating label:', error);
      toast.error('Fout bij genereren van label');
    }
  };

  return (
    <>
      <button
        onClick={handleDownload}
        className="btn-secondary w-full flex items-center space-x-2"
        title="Download label als PNG voor M-Print"
      >
        <Download size={16} />
        <span>Print voor M-Print</span>
      </button>

      {/* Hidden label for rendering */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={labelRef} style={{ backgroundColor: '#ffffff' }}>
          <VerdelerLabel
            verdeler={verdeler}
            projectNumber={projectNumber}
            logo={logo}
          />
        </div>
      </div>
    </>
  );
};

export default MPrintLabel;
