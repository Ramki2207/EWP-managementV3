import jsPDF from 'jspdf';

/**
 * Adds the professional header with EWP logo and "Keuringsrapport" title
 * to the current page of a PDF document
 */
export const addProfessionalHeader = (doc: jsPDF): number => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Add horizontal line at top
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);

  // Add "Keuringsrapport" title on the left
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Keuringsrapport', margin, 25);

  // Add "EWP PANEELBOUW" text on the right side
  // The logo area
  const logoBoxX = pageWidth - 100;
  const logoBoxY = 10;
  const logoBoxWidth = 80;
  const logoBoxHeight = 25;

  // Draw logo box border (optional, can be removed)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight);

  // Add EWP text in blue
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 123, 255); // Blue color similar to the logo
  doc.text('EWP', logoBoxX + 5, logoBoxY + 12);

  // Add vertical separator line
  doc.setDrawColor(0, 123, 255);
  doc.setLineWidth(1);
  doc.line(logoBoxX + 28, logoBoxY + 5, logoBoxX + 28, logoBoxY + 20);

  // Add "PANEELBOUW" text in blue
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 123, 255);
  doc.text('PANEELBOUW', logoBoxX + 32, logoBoxY + 15);

  // Reset text color to black for content
  doc.setTextColor(0, 0, 0);

  // Return the Y position where content should start
  return 45;
};

/**
 * Adds a professional footer to the current page
 */
export const addProfessionalFooter = (
  doc: jsPDF,
  version: string = '1.5e',
  documentNumber: string = 'WB2 FRM411'
) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const currentPage = doc.internal.pages.length - 1;

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Versie: ${version}`, margin, pageHeight - 10);
  doc.text(`Tekeningnummer: ${documentNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text(`Pagina ${currentPage}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
};

/**
 * Checks if a new page is needed and adds header/footer if page break occurs
 */
export const checkPageBreak = (
  doc: jsPDF,
  yPos: number,
  requiredSpace: number = 20,
  addHeader: boolean = true
): number => {
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  if (yPos + requiredSpace > pageHeight - margin) {
    doc.addPage();
    if (addHeader) {
      return addProfessionalHeader(doc);
    }
    return margin;
  }

  return yPos;
};

/**
 * Adds a section header with background
 */
export const addSectionHeader = (
  doc: jsPDF,
  title: string,
  yPos: number,
  color: { r: number; g: number; b: number } = { r: 240, g: 240, b: 240 }
) => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  doc.setFillColor(color.r, color.g, color.b);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, margin + 2, yPos);
  doc.setFont('helvetica', 'normal');

  return yPos + 10;
};