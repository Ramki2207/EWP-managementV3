import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface MPrintLabelProps {
  verdeler: any;
  projectNumber: string;
}

const MPrintLabel: React.FC<MPrintLabelProps> = ({ verdeler, projectNumber }) => {
  const labelRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!labelRef.current) return;

    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 4,
        backgroundColor: '#D8D8D8',
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1200,
        height: 800
      });

      // Convert canvas to blob and download
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

        toast.success('Label gedownload!');
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
      >
        <Printer size={16} />
        <span>Print voor M-Print</span>
      </button>

      {/* Hidden label for rendering */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div
          ref={labelRef}
          style={{
            width: '1200px',
            height: '800px',
            backgroundColor: '#D8D8D8',
            padding: '60px',
            fontFamily: 'Arial, sans-serif',
            borderRadius: '40px',
            position: 'relative'
          }}
        >
          {/* Company Info - Top Left */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '60px',
            fontSize: '28px',
            lineHeight: '1.4',
            fontWeight: 'normal'
          }}>
            <div>Gildenstraat 28</div>
            <div>4143 HS Leerdam</div>
            <div>info@ewp-paneelbouw.nl</div>
            <div>www.ewp-paneelbouw.nl</div>
          </div>

          {/* Company Logo - Top Right */}
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '60px',
            fontSize: '72px',
            fontWeight: 'bold',
            letterSpacing: '-2px',
            fontFamily: 'Arial Black, Arial, sans-serif'
          }}>
            EWP PANEELBOUW B.V
          </div>

          {/* Main Content */}
          <div style={{
            position: 'absolute',
            top: '280px',
            left: '60px',
            right: '60px',
            display: 'flex',
            gap: '20px'
          }}>
            {/* Left Column - Labels */}
            <div style={{
              width: '480px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>PROJECTNUMMER:</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>TYPE:</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>SERIENUMMER:</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>VOEDINGSSPANNING:</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>STUURSPANNING:</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>FREQUENTIE:</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>IP-WAARDE:</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>BOUWJAAR:</div>
            </div>

            {/* Right Column - Values */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}>
              {/* Project Number */}
              <div style={{
                border: '2px solid #000',
                padding: '8px 20px',
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff'
              }}>
                {projectNumber}
              </div>

              {/* Type */}
              <div style={{
                border: '2px solid #000',
                padding: '8px 20px',
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff'
              }}>
                {verdeler.systeem || 'VK'}
              </div>

              {/* Serial Number */}
              <div style={{
                border: '2px solid #000',
                padding: '8px 20px',
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff'
              }}>
                {`${projectNumber}-${verdeler.distributorId || verdeler.distributor_id}`}
              </div>

              {/* Voedingsspanning */}
              <div style={{
                border: '2px solid #000',
                padding: '8px 20px',
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{verdeler.un_in_v || verdeler.unInV || '400'}</span>
                <span>V</span>
              </div>

              {/* Stuurspanning */}
              <div style={{
                border: '2px solid #000',
                padding: '8px 20px',
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <span>V</span>
              </div>

              {/* Frequentie */}
              <div style={{
                border: '2px solid #000',
                padding: '8px 20px',
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>50</span>
                <span>Hz</span>
              </div>

              {/* IP-Waarde - Split into two boxes */}
              <div style={{
                display: 'flex',
                gap: '20px'
              }}>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 20px',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  width: '280px'
                }}>
                  65
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 20px',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '28px' }}>I<sub>n</sub>:</span>
                  <span>{verdeler.in_in_a || verdeler.inInA || '250'}</span>
                  <span>A</span>
                </div>
              </div>

              {/* Bouwjaar - Split into three boxes */}
              <div style={{
                display: 'flex',
                gap: '20px'
              }}>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 20px',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  width: '280px'
                }}>
                  {verdeler.bouwjaar || new Date().getFullYear()}
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 20px',
                  fontSize: '24px',
                  fontWeight: 'normal',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>Icu:</span>
                  <span style={{ fontSize: '20px' }}>(IEC61439-1/3)</span>
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 20px',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
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
