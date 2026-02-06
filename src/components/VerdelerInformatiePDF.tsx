import React from 'react';
import { jsPDF } from 'jspdf';
import { FileText } from 'lucide-react';

interface VerdelerInformatiePDFProps {
  verdeler: any;
  projectNumber: string;
  logo: string;
}

const VerdelerInformatiePDF: React.FC<VerdelerInformatiePDFProps> = ({ verdeler, projectNumber, logo }) => {

  const generatePDF = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Load and add logo
    const img = new Image();
    img.src = logo;
    await new Promise<void>((resolve) => {
      img.onload = () => {
        const imgWidth = 50;
        const imgHeight = (img.height * imgWidth) / img.width;
        pdf.addImage(img, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
        resolve();
      };
    });

    // Add title
    pdf.setFontSize(20);
    pdf.setTextColor(65, 105, 225); // Blue color
    pdf.text('Verdeler Informatie', margin, yPosition);
    yPosition += 12;

    // Add project and verdeler info
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Project: ${projectNumber}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Verdeler ID: ${verdeler.distributorId}`, margin, yPosition);
    yPosition += 10;

    // Draw separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Basis Informatie Section
    pdf.setFontSize(14);
    pdf.setTextColor(65, 105, 225); // Blue color
    pdf.text('Basis Informatie', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    const basisFields = [
      { label: 'Verdeler ID', value: verdeler.distributorId },
      { label: 'Kastnaam', value: verdeler.kastNaam || '-' },
      { label: 'Status', value: verdeler.status || 'Productie' },
      { label: 'Stelsel', value: verdeler.systeem || '-' },
      { label: 'Voeding', value: verdeler.voeding ? `${verdeler.voeding}A` : '-' },
      { label: 'Stuurspanning', value: verdeler.stuurspanning || '-' },
      { label: 'kA Waarde', value: (verdeler.kaWaarde || verdeler.ka_waarde) ? `${verdeler.kaWaarde || verdeler.ka_waarde} kA` : '-' },
      { label: 'Voorbeveiliging', value: verdeler.voorbeveiliging ? 'Ja' : 'Nee' },
      { label: 'IP Waarde', value: verdeler.ipWaarde ? `IP${verdeler.ipWaarde}` : '-' },
      { label: 'Bouwjaar', value: verdeler.bouwjaar || '-' },
      { label: 'Fabrikant', value: verdeler.fabrikant || '-' },
      { label: 'Gewenste leverdatum', value: (() => {
        const date = verdeler.deliveryDate || verdeler.gewenste_lever_datum;
        if (!date) return '-';
        const dateStr = typeof date === 'string' ? date.split('T')[0] : date;
        return dateStr;
      })() }
    ];

    // Display fields in two columns
    const columnWidth = (pageWidth - 2 * margin) / 2;
    let column = 0;
    let rowStart = yPosition;

    for (let i = 0; i < basisFields.length; i++) {
      const field = basisFields[i];
      const xPos = margin + (column * columnWidth);

      // Check if we need to move to next page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
        rowStart = yPosition;
      }

      // Label
      pdf.setTextColor(100, 100, 100);
      pdf.text(field.label + ':', xPos, yPosition);

      // Value
      pdf.setTextColor(0, 0, 0);
      pdf.text(field.value, xPos, yPosition + 5);

      column++;
      if (column >= 2) {
        column = 0;
        yPosition += 12;
        rowStart = yPosition;
      }
    }

    // Move to next row if we're in the middle of a row
    if (column !== 0) {
      yPosition += 12;
    }

    yPosition += 5;

    // Draw separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Check if we need a new page for technical specs
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = margin;
    }

    // Technische Specificaties Section
    pdf.setFontSize(14);
    pdf.setTextColor(147, 51, 234); // Purple color
    pdf.text('Technische Specificaties', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    const techFields = [
      { label: 'Un in V', value: verdeler.unInV || '-' },
      { label: 'In in A', value: verdeler.inInA || '-' },
      { label: 'Ik Th in KA 1s', value: verdeler.ikThInKA1s || '-' },
      { label: 'Ik Dyn in KA', value: verdeler.ikDynInKA || '-' },
      { label: 'Freq. in Hz', value: verdeler.freqInHz || '-' },
      { label: 'Type nr. HS', value: verdeler.typeNrHs || '-' }
    ];

    column = 0;
    rowStart = yPosition;

    for (let i = 0; i < techFields.length; i++) {
      const field = techFields[i];
      const xPos = margin + (column * columnWidth);

      // Check if we need to move to next page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
        rowStart = yPosition;
      }

      // Label
      pdf.setTextColor(100, 100, 100);
      pdf.text(field.label + ':', xPos, yPosition);

      // Value
      pdf.setTextColor(0, 0, 0);
      pdf.text(field.value, xPos, yPosition + 5);

      column++;
      if (column >= 2) {
        column = 0;
        yPosition += 12;
        rowStart = yPosition;
      }
    }

    // Footer
    const footerY = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('EWP Paneelbouw', margin, footerY);
    pdf.text(`Gegenereerd: ${new Date().toLocaleDateString('nl-NL')}`, pageWidth - margin - 50, footerY);

    // Save PDF
    const filename = `Verdeler_Informatie_${verdeler.distributorId}_${projectNumber}.pdf`;
    pdf.save(filename);
  };

  return (
    <button
      onClick={generatePDF}
      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
    >
      <FileText size={16} />
      <span>Verdeler Informatie</span>
    </button>
  );
};

export default VerdelerInformatiePDF;
