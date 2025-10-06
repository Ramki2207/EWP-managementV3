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

  // Create an inline SVG logo with bold styling
  const ewpLogoSVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 80'%3E%3Crect width='300' height='80' fill='white'/%3E%3Ctext x='10' y='55' font-family='Arial, sans-serif' font-size='48' font-weight='bold' fill='%23000000'%3EEWP%3C/text%3E%3C/svg%3E`;

  const handleDownload = async () => {
    if (!labelRef.current) return;

    console.log('Verdeler data:', verdeler);
    console.log('Project number:', projectNumber);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(labelRef.current, {
        scale: 2.5,
        backgroundColor: '#E8E8E8',
        logging: true,
        useCORS: true,
        allowTaint: true,
        width: 1200,
        height: 1000,
        imageTimeout: 15000,
        removeContainer: true
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
            height: '1000px',
            backgroundColor: '#E8E8E8',
            padding: '40px',
            fontFamily: 'Arial, sans-serif',
            borderRadius: '30px',
            position: 'relative',
            border: '8px solid #000000',
            boxSizing: 'border-box'
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
            <div style={{
              width: '250px',
              height: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              padding: '10px',
              borderRadius: '8px',
              border: '2px solid #000'
            }}>
              <span style={{
                fontSize: '52px',
                fontWeight: 'bold',
                color: '#000',
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '2px'
              }}>
                EWP
              </span>
            </div>

            {/* Company Info */}
            <div style={{
              textAlign: 'right',
              fontSize: '18px',
              lineHeight: '1.6',
              fontWeight: '500',
              color: '#000'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '22px', marginBottom: '8px', color: '#000' }}>EWP Paneelbouw Utrecht</div>
              <div style={{ color: '#000' }}>Gildenstraat 28, 4143 HS Leerdam</div>
              <div style={{ color: '#000' }}>info@ewp-paneelbouw.nl</div>
              <div style={{ color: '#000' }}>www.ewp-paneelbouw.nl</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '380px 1fr',
            gap: '25px',
            marginTop: '20px'
          }}>
            {/* Left Column - Labels */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              paddingTop: '6px'
            }}>
              {[
                'PROJECTNUMMER:',
                'TYPE:',
                'SERIENUMMER:',
                'KASTNAAM:',
                'VOEDING:',
                'UN IN V:',
                'IN IN A:',
                'FREQ. IN HZ:',
                'IP-WAARDE:',
                'BOUWJAAR:'
              ].map((label, index) => (
                <div key={index} style={{
                  fontSize: '26px',
                  fontWeight: 'bold',
                  height: '56px',
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
              gap: '14px'
            }}>
              {/* Project Number */}
              <div style={{
                border: '3px solid #000',
                padding: '10px 20px',
                fontSize: '26px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#000'
              }}>
                {projectNumber}
              </div>

              {/* Type */}
              <div style={{
                border: '3px solid #000',
                padding: '10px 20px',
                fontSize: '26px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#000'
              }}>
                {verdeler.systeem || 'VK'}
              </div>

              {/* Serial Number */}
              <div style={{
                border: '3px solid #000',
                padding: '10px 20px',
                fontSize: '26px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#000'
              }}>
                {`${projectNumber}-${verdeler.distributorId || verdeler.distributor_id}`}
              </div>

              {/* Kastnaam */}
              <div style={{
                border: '3px solid #000',
                padding: '10px 20px',
                fontSize: '26px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#000'
              }}>
                {verdeler.kast_naam || verdeler.kastNaam || '-'}
              </div>

              {/* Voeding */}
              <div style={{
                border: '3px solid #000',
                padding: '10px 20px',
                fontSize: '26px',
                fontWeight: 'bold',
                textAlign: 'center',
                backgroundColor: '#fff',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#000'
              }}>
                {verdeler.voeding || '-'}
              </div>

              {/* Un in V */}
              <div style={{
                border: '3px solid #000',
                padding: '10px 20px',
                fontSize: '26px',
                fontWeight: 'bold',
                backgroundColor: '#fff',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#000'
              }}>
                {verdeler.un_in_v || verdeler.unInV || '-'}
              </div>

              {/* In in A */}
              <div style={{
                border: '3px solid #000',
                padding: '10px 20px',
                fontSize: '26px',
                fontWeight: 'bold',
                backgroundColor: '#fff',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#000'
              }}>
                {verdeler.in_in_a || verdeler.inInA || '-'}
              </div>

              {/* Freq in Hz */}
              <div style={{
                border: '3px solid #000',
                padding: '10px 20px',
                fontSize: '26px',
                fontWeight: 'bold',
                backgroundColor: '#fff',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#000'
              }}>
                {verdeler.freq_in_hz || verdeler.freqInHz || '-'}
              </div>

              {/* IP-Waarde */}
              <div style={{
                display: 'flex',
                gap: '14px',
                height: '56px'
              }}>
                <div style={{
                  border: '3px solid #000',
                  padding: '10px 20px',
                  fontSize: '26px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  width: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  color: '#000'
                }}>
                  65
                </div>
                <div style={{
                  border: '3px solid #000',
                  padding: '10px 20px',
                  fontSize: '26px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  color: '#000'
                }}>
                  -
                </div>
              </div>

              {/* Bouwjaar */}
              <div style={{
                display: 'flex',
                gap: '14px',
                height: '56px'
              }}>
                <div style={{
                  border: '3px solid #000',
                  padding: '10px 20px',
                  fontSize: '26px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  backgroundColor: '#fff',
                  width: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  color: '#000'
                }}>
                  {verdeler.bouwjaar || new Date().getFullYear()}
                </div>
                <div style={{
                  border: '3px solid #000',
                  padding: '10px 14px',
                  fontSize: '18px',
                  fontWeight: 'normal',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '8px',
                  color: '#000'
                }}>
                  <span>Icu:</span>
                  <span style={{ fontSize: '16px' }}>(IEC61439-1/3)</span>
                </div>
                <div style={{
                  border: '3px solid #000',
                  padding: '10px 20px',
                  fontSize: '26px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderRadius: '8px',
                  minWidth: '110px',
                  justifyContent: 'center',
                  color: '#000'
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

export default MPrintLabel