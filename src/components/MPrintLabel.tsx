import React, { useRef, useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import ewpLogo from '../assets/log-zwart.png';

interface MPrintLabelProps {
  verdeler: any;
  projectNumber: string;
  logo: string;
}

const MPrintLabel: React.FC<MPrintLabelProps> = ({ verdeler, projectNumber, logo }) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');

  // Convert logo to base64 data URL on mount
  useEffect(() => {
    const convertLogoToDataUrl = async () => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = ewpLogo;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          setLogoDataUrl(dataUrl);
        }
      } catch (error) {
        console.error('Error converting logo to data URL:', error);
      }
    };

    convertLogoToDataUrl();
  }, []);

  // Create URL for maintenance report (same as VerdelerLabel)
  const maintenanceUrl = `${window.location.origin}/maintenance-report?verdeler_id=${encodeURIComponent(verdeler.distributor_id || verdeler.distributorId)}&project_number=${encodeURIComponent(projectNumber)}&kast_naam=${encodeURIComponent(verdeler.kast_naam || verdeler.kastNaam || '')}`;

  const handleDownload = async () => {
    if (!labelRef.current || !logoDataUrl) {
      toast.error('Logo is nog aan het laden, probeer opnieuw');
      return;
    }

    console.log('Verdeler data:', verdeler);
    console.log('Project number:', projectNumber);

    try {
      // Wait for everything to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(labelRef.current, {
        scale: 2.5,
        backgroundColor: '#E8E8E8',
        logging: true,
        useCORS: true,
        allowTaint: true,
        width: 1004,
        height: 638,
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
            width: '1004px',
            height: '638px',
            backgroundColor: '#E8E8E8',
            padding: '24px',
            fontFamily: 'Arial, sans-serif',
            borderRadius: '0px',
            position: 'relative',
            border: 'none',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '3px solid #000000'
          }}>
            {/* Logo */}
            <div style={{
              width: '550px',
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              backgroundColor: 'transparent',
              padding: '0'
            }}>
              {logoDataUrl && (
                <img
                  src={logoDataUrl}
                  alt="EWP Logo"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    objectPosition: 'left center'
                  }}
                />
              )}
            </div>

            {/* Company Info */}
            <div style={{
              textAlign: 'right',
              fontSize: '16px',
              lineHeight: '1.5',
              fontWeight: '500',
              color: '#000'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '6px', color: '#000' }}>EWP Paneelbouw Utrecht</div>
              <div style={{ color: '#000' }}>Gildenstraat 28, 4143 HS Leerdam</div>
              <div style={{ color: '#000' }}>info@ewp-paneelbouw.nl</div>
              <div style={{ color: '#000' }}>www.ewp-paneelbouw.nl</div>
            </div>
          </div>

          {/* Main Content - Two Column Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 180px',
            gap: '20px',
            marginTop: '15px'
          }}>
            {/* Left Column - Information Rows */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* Project Number Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  minWidth: '250px',
                  lineHeight: '1'
                }}>
                  PROJECTNUMMER:
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 15px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: '#000',
                  minHeight: '45px'
                }}>
                  {projectNumber.replace(/-/g, '')}
                </div>
              </div>

              {/* Type Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  minWidth: '250px',
                  lineHeight: '1'
                }}>
                  TYPE:
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 15px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: '#000',
                  minHeight: '45px'
                }}>
                  {verdeler.systeem || 'VK'}
                </div>
              </div>

              {/* Kastnaam Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  minWidth: '250px',
                  lineHeight: '1'
                }}>
                  KASTNAAM:
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 15px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: '#000',
                  minHeight: '45px'
                }}>
                  {verdeler.kast_naam || verdeler.kastNaam || '-'}
                </div>
              </div>

              {/* Voeding Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  minWidth: '250px',
                  lineHeight: '1'
                }}>
                  VOEDING:
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 15px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: '#000',
                  minHeight: '45px'
                }}>
                  {verdeler.voeding || '-'}
                </div>
              </div>

              {/* Un in V Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  minWidth: '250px',
                  lineHeight: '1'
                }}>
                  UN IN V:
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 15px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: '#000',
                  minHeight: '45px'
                }}>
                  {verdeler.un_in_v || verdeler.unInV || '-'}
                </div>
              </div>

              {/* In in A Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  minWidth: '250px',
                  lineHeight: '1'
                }}>
                  IN IN A:
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 15px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: '#000',
                  minHeight: '45px'
                }}>
                  {verdeler.in_in_a || verdeler.inInA || '-'}
                </div>
              </div>

              {/* Freq in Hz Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  minWidth: '250px',
                  lineHeight: '1'
                }}>
                  FREQ. IN HZ:
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 15px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: '#000',
                  minHeight: '45px'
                }}>
                  {verdeler.freq_in_hz || verdeler.freqInHz || '-'}
                </div>
              </div>

              {/* IP-Waarde Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  minWidth: '250px',
                  lineHeight: '1'
                }}>
                  IP-WAARDE:
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 15px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: '#000',
                  minHeight: '45px'
                }}>
                  65
                </div>
              </div>

              {/* Bouwjaar Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#000000',
                  minWidth: '250px',
                  lineHeight: '1'
                }}>
                  BOUWJAAR:
                </div>
                <div style={{
                  border: '2px solid #000',
                  padding: '8px 15px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  backgroundColor: '#fff',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: '#000',
                  minHeight: '45px'
                }}>
                  {verdeler.bouwjaar || new Date().getFullYear()}
                </div>
              </div>
            </div>

            {/* Right Column - QR Code */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '4px',
                border: '3px solid #000'
              }}>
                <QRCodeSVG
                  value={maintenanceUrl}
                  size={160}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MPrintLabel;