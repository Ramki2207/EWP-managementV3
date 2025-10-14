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
  const [showSerialDialog, setShowSerialDialog] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');

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

  const handlePrintClick = () => {
    setShowSerialDialog(true);
  };

  const handleDownload = async (continueWithoutSerial: boolean = false) => {
    if (!labelRef.current || !logoDataUrl) {
      toast.error('Logo is nog aan het laden, probeer opnieuw');
      return;
    }

    // Close the dialog
    setShowSerialDialog(false);

    console.log('Verdeler data:', verdeler);
    console.log('Project number:', projectNumber);
    console.log('Serial number:', serialNumber);

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

        // Reset serial number after download
        setSerialNumber('');
      }, 'image/png');
    } catch (error) {
      console.error('Error generating label:', error);
      toast.error('Fout bij genereren van label');
    }
  };

  return (
    <>
      <button
        onClick={handlePrintClick}
        className="btn-secondary w-full flex items-center space-x-2"
        title="Download label als PNG voor M-Print"
      >
        <Download size={16} />
        <span>Print voor M-Print</span>
      </button>

      {/* Serial Number Dialog */}
      {showSerialDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Vul het serienummer in</h3>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Serienummer (optioneel)"
              className="input-field w-full mb-6"
              autoFocus
            />
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleDownload(false)}
                className="btn-primary w-full"
              >
                Download met serienummer
              </button>
              <button
                onClick={() => handleDownload(true)}
                className="btn-secondary w-full"
              >
                Doorgaan zonder serienummer
              </button>
              <button
                onClick={() => setShowSerialDialog(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden label for rendering */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div
          ref={labelRef}
          style={{
            width: '1004px',
            height: '638px',
            backgroundColor: '#E8E8E8',
            padding: '16px',
            fontFamily: 'Arial, sans-serif',
            borderRadius: '0px',
            position: 'relative',
            border: 'none',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Section - Compact */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '2px solid #000000'
          }}>
            {/* Logo */}
            <div style={{
              width: '600px',
              height: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start'
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
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>

            {/* Company Info - Larger */}
            <div style={{
              textAlign: 'right',
              fontSize: '18px',
              lineHeight: '1.5',
              color: '#000000'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '22px', marginBottom: '4px', color: '#000000' }}>EWP Paneelbouw Utrecht</div>
              <div style={{ color: '#000000' }}>Gildenstraat 28, 4143 HS Leerdam</div>
              <div style={{ color: '#000000' }}>Tel: 085-0477750</div>
              <div style={{ color: '#000000' }}>info@ewp-paneelbouw.nl</div>
              <div style={{ color: '#000000' }}>www.ewp-paneelbouw.nl</div>
            </div>
          </div>

          {/* Main Content - Optimized Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '360px 320px 280px',
            gap: '25px',
            marginTop: '50px'
          }}>
            {/* First Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Project Number */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '25px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', width: '220px', flexShrink: 0 }}>PROJECTNUMMER:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>{projectNumber.replace(/-/g, '')}</span>
              </div>

              {/* Stelsel */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '25px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', width: '220px', flexShrink: 0 }}>STELSEL:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>{verdeler.systeem || 'VK'}</span>
              </div>

              {/* Kastnaam */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '25px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', width: '220px', flexShrink: 0 }}>KASTNAAM:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>{verdeler.kast_naam || verdeler.kastNaam || '-'}</span>
              </div>

              {/* Voeding */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '25px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', width: '220px', flexShrink: 0 }}>VOEDING:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>{verdeler.voeding ? `${verdeler.voeding}A` : '-'}</span>
              </div>

              {/* Stuurspanning */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '25px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', width: '220px', flexShrink: 0 }}>STUURSPANNING:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>{verdeler.stuurspanning || '-'}</span>
              </div>

              {/* Serienummer - Only show if entered */}
              {serialNumber && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '25px',
                  fontSize: '25px',
                  color: '#000000',
                  lineHeight: '1.2'
                }}>
                  <span style={{ fontWeight: 'bold', color: '#000000', width: '220px', flexShrink: 0 }}>SERIENUMMER:</span>
                  <span style={{
                    fontWeight: 'normal',
                    color: '#000000',
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #000000',
                    padding: '9px 15px',
                    minWidth: '130px',
                    textAlign: 'center',
                    fontSize: '24px'
                  }}>{serialNumber}</span>
                </div>
              )}
            </div>

            {/* Second Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Un in V */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2',
                paddingLeft: '15px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', minWidth: '170px', flexShrink: 0 }}>UN IN V:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>{verdeler.un_in_v || verdeler.unInV || '-'}</span>
              </div>

              {/* In in A */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2',
                paddingLeft: '15px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', minWidth: '170px', flexShrink: 0 }}>IN IN A:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>{verdeler.in_in_a || verdeler.inInA || '-'}</span>
              </div>

              {/* Freq in Hz */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2',
                paddingLeft: '15px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', minWidth: '170px', flexShrink: 0 }}>FREQ. IN HZ:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>{verdeler.freq_in_hz || verdeler.freqInHz || '-'}</span>
              </div>

              {/* IP-Waarde */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2',
                paddingLeft: '15px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', minWidth: '170px', flexShrink: 0 }}>IP-WAARDE:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>65</span>
              </div>

              {/* kA Waarde */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2',
                paddingLeft: '15px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', minWidth: '170px', flexShrink: 0 }}>KA WAARDE:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>{(verdeler.ka_waarde || verdeler.kaWaarde) ? `${verdeler.ka_waarde || verdeler.kaWaarde} kA` : '-'}</span>
              </div>

              {/* Bouwjaar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '25px',
                color: '#000000',
                lineHeight: '1.2',
                paddingLeft: '15px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#000000', minWidth: '170px', flexShrink: 0 }}>BOUWJAAR:</span>
                <span style={{
                  fontWeight: 'normal',
                  color: '#000000',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000000',
                  padding: '9px 15px',
                  minWidth: '130px',
                  textAlign: 'center',
                  fontSize: '24px'
                }}>{verdeler.bouwjaar || new Date().getFullYear()}</span>
              </div>
            </div>

            {/* Third Column - QR Code */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                backgroundColor: '#fff',
                padding: '10px',
                borderRadius: '4px',
                border: '2px solid #000'
              }}>
                <QRCodeSVG
                  value={maintenanceUrl}
                  size={210}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* IEC Standard Text - Moved under QR */}
              <div style={{
                fontSize: '21px',
                fontWeight: 'bold',
                color: '#000000',
                textAlign: 'center',
                marginTop: '6px'
              }}>
                (IEC61439-1/3)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MPrintLabel;