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

  doc.setFillColor(245, 248, 250);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  const headerHeight = 60;
  doc.setFillColor(30, 37, 48);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  try {
    const logoData = await loadLogoImage();
    const logoAspectRatio = 3.5;
    const logoHeight = 18;
    const logoWidth = logoHeight * logoAspectRatio;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = (headerHeight - logoHeight) / 2;
    doc.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight, undefined, 'NONE');
  } catch (error) {
    console.warn('Could not add logo to PDF:', error);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('EWP PANEELBOUW', pageWidth / 2, headerHeight / 2 + 5, { align: 'center' });
  }

  let yPos = headerHeight + 35;

  doc.setTextColor(30, 37, 48);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('VERDELER AANZICHT', pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;
  doc.setDrawColor(0, 180, 216);
  doc.setLineWidth(1.5);
  const lineWidth = 60;
  doc.line((pageWidth - lineWidth) / 2, yPos, (pageWidth + lineWidth) / 2, yPos);

  yPos += 25;

  const boxMargin = 25;
  const boxWidth = pageWidth - (2 * boxMargin);
  const boxPadding = 15;

  const addInfoBox = (label: string, value: string | undefined, isPrimary: boolean = false) => {
    if (!value) return;

    const boxHeight = 18;

    if (isPrimary) {
      doc.setFillColor(0, 180, 216);
      doc.roundedRect(boxMargin, yPos, boxWidth, boxHeight, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(boxMargin, yPos, boxWidth, boxHeight, 3, 3, 'F');

      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(0.3);
      doc.roundedRect(boxMargin, yPos, boxWidth, boxHeight, 3, 3, 'S');

      doc.setTextColor(30, 37, 48);
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), boxMargin + boxPadding, yPos + 6);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const maxValueWidth = boxWidth - (2 * boxPadding);
    const lines = doc.splitTextToSize(value, maxValueWidth);
    doc.text(lines[0], boxMargin + boxPadding, yPos + 13);

    yPos += boxHeight + 5;
  };

  addInfoBox('PM Nummer', data.pmNumber, true);
  addInfoBox('Kastnaam', data.kastNaam, true);

  if (data.expectedDeliveryDate) {
    addInfoBox('Verwachte Leverdatum', data.expectedDeliveryDate);
  }

  if (data.clientName) {
    addInfoBox('Klant', data.clientName);
  }

  if (data.deliveryAddress) {
    addInfoBox('Afleveradres', data.deliveryAddress);
  }

  if (data.description) {
    const descHeight = 30;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(boxMargin, yPos, boxWidth, descHeight, 3, 3, 'F');
    doc.setDrawColor(220, 225, 230);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxMargin, yPos, boxWidth, descHeight, 3, 3, 'S');

    doc.setTextColor(30, 37, 48);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('OMSCHRIJVING', boxMargin + boxPadding, yPos + 6);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const maxDescWidth = boxWidth - (2 * boxPadding);
    const descLines = doc.splitTextToSize(data.description, maxDescWidth);
    doc.text(descLines.slice(0, 2), boxMargin + boxPadding, yPos + 13);

    yPos += descHeight + 5;
  }

  if (data.clientReference) {
    addInfoBox('Referentie Klant', data.clientReference);
  }

  const footerY = pageHeight - 25;
  doc.setDrawColor(200, 205, 210);
  doc.setLineWidth(0.3);
  doc.line(boxMargin, footerY, pageWidth - boxMargin, footerY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('EWP Paneelbouw', boxMargin, footerY + 8);
  doc.text(new Date().toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }), pageWidth - boxMargin, footerY + 8, { align: 'right' });

  return doc.output('blob');
};
