import React, { useRef } from 'react';
import { Download } from 'lucide-react';
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
        backgroundColor: '#E8E8E8',
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
        <div
          ref={labelRef}
          style={{
            width: '1200px',
            height: '800px',
            backgroundColor: '#E8E8E8',
            padding: '40px',
            fontFamily: 'Arial, sans-serif',
            borderRadius: '30px',
            position: 'relative',
            border: '8px solid #000000'
          }}
        >
          {/* Header Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '30px',
            paddingBottom: '20px',
            borderBottom: '4px solid #000000'
          }}>
            {/* Logo */}
            <div style={{ width: '250px' }}>
              <img
                src={logo}
                alt="EWP Logo"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Company Info */}
            <div style={{
              textAlign: 'right',
              fontSize: '18px',
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '22px', marginBottom: '8px' }}>EWP Paneelbouw Utrecht</div>
              <div>Gildenstraat 28, 4143 HS Leerdam</div>
              <div>info@ewp-paneelbouw.nl</div>
              <div>www.ewp-paneelbouw.nl</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '400px 1fr',
            gap: '30px',
            marginTop: '20px'
          }}>
            {/* Left Column - Labels */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              paddingTop: '8px'
            }}>
              {[
                'PROJECTNUMMER:',
                'TYPE:',
                'SERIENUMMER:',
                'VOEDINGSSPANNING:',
                'STUURSPANNING:',
                'FREQUENTIE:',
                'IP-WAARDE:',
                'BOUWJAAR:'
              ].map((label, index) => (
                <div key={index} style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#000000'
                }}>
                  {label}
                </div>
              ))}
            </div>

            {/* Right Column - Values */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Project Number */}
              <div style={{
                border: '3px solid #000',
                padding: '12px 20px',
                fontSize: '28px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}>
                {projectNumber}
              </div>

              {/* Type */}
              <div style={{
                border: '3px solid #000',
                padding: '12px 20px',
                fontSize: '28px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}>
                {verdeler.systeem || 'VK'}
              </div>

              {/* Serial Number */}
              <div style={{
                border: '3px solid #000',
                padding: '12px 20px',
                fontSize: '28px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px'
              }}>
                {`${projectNumber}-${verdeler.distributorId || verdeler.distributor_id}`}
              </div>

              {/* Voedingsspanning */}
              <div style={{
                border: '3px solid #000',
                padding: '12px 20px',
                fontSize: '28px',
                fontWeight: 'bold',
                backgroundColor: '#fff',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '8px'
              }}>
                <span>{verdeler.un_in_v || verdeler.unInV || '400'}</span>
                <span>V</span>
              </div>

              {/* Stuurspanning */}
              <div style={{
                border: '3px solid #000',
                padding: '12px 20px',
                fontSize: '28px',
                fontWeight: 'bold',
                backgroundColor: '#fff',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                borderRadius: '8px'
              }}>
                <span>V</span>
              </div>

              {/* Frequentie */}
              <div style={{
                border: '3px solid #000',
                padding: '12px 20px',
                fontSize: '28px',
                fontWeight: 'bold',
                backgroundColor: '#fff',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: '8px'
              }}>
                <span>{verdeler.freq_in_hz || verdeler.freqInHz || '50'}</span>
                <span>Hz</span>
              </div>

              {/* IP-Waarde - Split into two boxes */}
              <div style={{
                display: 'flex',
                gap: '16px',
                height: '60px'
              }}>
                <div style={{
                  border: '3px solid #000',
                  padding: '12px 20px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  width: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}>
                  65
                </div>
                <div style={{
                  border: '3px solid #000',
                  padding: '12px 20px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: '8px'
                }}>
                  <span>In:</span>
                  <span>{verdeler.in_in_a || verdeler.inInA || '250'}</span>
                  <span>A</span>
                </div>
              </div>

              {/* Bouwjaar - Split into three boxes */}
              <div style={{
                display: 'flex',
                gap: '16px',
                height: '60px'
              }}>
                <div style={{
                  border: '3px solid #000',
                  padding: '12px 20px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  width: '180px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}>
                  {verdeler.bouwjaar || new Date().getFullYear()}
                </div>
                <div style={{
                  border: '3px solid #000',
                  padding: '12px 16px',
                  fontSize: '20px',
                  fontWeight: 'normal',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '8px'
                }}>
                  <span>Icu:</span>
                  <span style={{ fontSize: '18px' }}>(IEC61439-1/3)</span>
                </div>
                <div style={{
                  border: '3px solid #000',
                  padding: '12px 20px',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '8px',
                  minWidth: '120px',
                  justifyContent: 'center'
                }}>
                  <span>6</span>
                  <span>kA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MPrintLabel;
