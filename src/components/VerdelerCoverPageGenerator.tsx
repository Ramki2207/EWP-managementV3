import jsPDF from 'jspdf';
import ewpLogo from '../assets/ewp2-logo.png';

interface CoverPageData {
  pmNumber: string;
  kastNaam: string;
  expectedDeliveryDate?: string;
  clientName?: string;
  deliveryAddress?: string;
  description?: string;
  clientReference?: string;
}

let logoImageCache: string | null = null;

const loadLogoImage = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (logoImageCache) {
      resolve(logoImageCache);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          logoImageCache = canvas.toDataURL('image/png');
          resolve(logoImageCache);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = ewpLogo;
  });
};

export const generateVerdelerCoverPage = async (data: CoverPageData): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  try {
    const logoData = await loadLogoImage();
    const logoWidth = 70;
    const logoHeight = 20;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 30;
    doc.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.warn('Could not add logo to PDF:', error);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 123, 255);
    doc.text('EWP PANEELBOUW', pageWidth / 2, 40, { align: 'center' });
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Verdeler Aanzicht', pageWidth / 2, 70, { align: 'center' });

  let yPos = 100;
  const lineHeight = 10;
  const labelWidth = 70;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');

  const addField = (label: string, value: string | undefined) => {
    if (value) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, yPos);

      doc.setFont('helvetica', 'normal');
      const valueX = margin + labelWidth;
      const maxWidth = pageWidth - margin - valueX;
      const lines = doc.splitTextToSize(value, maxWidth);

      doc.text(lines, valueX, yPos);
      yPos += lineHeight * lines.length;
      yPos += 5;
    }
  };

  addField('PM Nummer', data.pmNumber);
  addField('Kastnaam', data.kastNaam);
  addField('Verwachte leverdatum', data.expectedDeliveryDate);
  addField('Klant', data.clientName);
  addField('Afleveradres', data.deliveryAddress);
  addField('Omschrijving', data.description);
  addField('Referentie klant', data.clientReference);

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('EWP Paneelbouw', pageWidth / 2, pageHeight - 20, { align: 'center' });
  doc.text(new Date().toLocaleDateString('nl-NL'), pageWidth / 2, pageHeight - 15, { align: 'center' });

  return doc.output('blob');
};
