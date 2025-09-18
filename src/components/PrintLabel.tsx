import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import VerdelerLabel from './VerdelerLabel';
import html2canvas from 'html2canvas';

interface PrintLabelProps {
  verdeler: any;
  projectNumber: string;
  logo: string;
}

const PrintLabel: React.FC<PrintLabelProps> = ({ verdeler, projectNumber, logo }) => {
  const [showModal, setShowModal] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (!labelRef.current) return;

    try {
      const canvas = await html2canvas(labelRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true
      });

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      // Add the canvas as an image to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Label</title>
            <style>
              @page {
                size: 125mm 95mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
              img {
                width: 125mm;
                height: 95mm;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${canvas.toDataURL('image/png')}" />
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error generating label image:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  const ModalContent = () => (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 999999 }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white text-black p-8 rounded-lg shadow-lg w-[800px] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Label Voorbeeldweergave</h2>
          <p className="text-gray-600">Controleer de gegevens voordat je print</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div ref={labelRef} className="bg-white">
            <VerdelerLabel
              verdeler={verdeler}
              projectNumber={projectNumber}
              logo={logo}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Annuleren
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <Printer size={16} />
            <span>Print Label</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-secondary flex items-center space-x-2"
        title="Print label"
      >
        <Printer size={16} />
        <span>Print Label</span>
      </button>

      {showModal && createPortal(<ModalContent />, document.body)}
    </>
  );
};

export default PrintLabel;