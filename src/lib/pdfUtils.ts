import jsPDF from 'jspdf';

// Cache for the logo image
let logoImageCache: string | null = null;
let logoLoadingPromise: Promise<string> | null = null;

/**
 * Load and cache the EWP logo as base64
 */
const loadLogoImage = (): Promise<string> => {
  // If already cached, return immediately
  if (logoImageCache) {
    return Promise.resolve(logoImageCache);
  }

  // If already loading, return the existing promise
  if (logoLoadingPromise) {
    return logoLoadingPromise;
  }

  // Start loading
  logoLoadingPromise = new Promise((resolve, reject) => {
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
          logoLoadingPromise = null;
          resolve(logoImageCache);
        } else {
          logoLoadingPromise = null;
          reject(new Error('Could not get canvas context'));
        }
      } catch (error) {
        logoLoadingPromise = null;
        reject(error);
      }
    };

    img.onerror = () => {
      logoLoadingPromise = null;
      reject(new Error('Failed to load logo'));
    };

    img.src = '/EWP-Logo_blauw.png';
  });

  return logoLoadingPromise;
};

/**
 * Preload the logo image to cache it early
 * Call this on app initialization for better performance
 */
export const preloadLogoImage = () => {
  loadLogoImage().catch(err => console.warn('Logo preload failed:', err));
};

/**
 * Adds the professional header with EWP logo and "Keuringsrapport" title
 * to the current page of a PDF document
 */
export const addProfessionalHeader = async (doc: jsPDF): Promise<number> => {
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

  // Add EWP logo on the right side
  try {
    const logoData = await loadLogoImage();
    // Logo dimensions maintaining 3.5:1 aspect ratio (EWP PANEELBOUW logo is wide)
    const logoWidth = 52.5;
    const logoHeight = 15;
    const logoX = pageWidth - logoWidth - margin;
    const logoY = 12;

    // Add the logo image with proper aspect ratio
    doc.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.warn('Could not add logo to PDF:', error);
    // Fallback to text if logo fails to load
    const logoBoxX = pageWidth - 100;
    const logoBoxY = 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 123, 255);
    doc.text('EWP PANEELBOUW', logoBoxX + 10, logoBoxY + 15);
  }

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
export const checkPageBreak = async (
  doc: jsPDF,
  yPos: number,
  requiredSpace: number = 20,
  addHeader: boolean = true
): Promise<number> => {
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  if (yPos + requiredSpace > pageHeight - margin) {
    doc.addPage();
    if (addHeader) {
      return await addProfessionalHeader(doc);
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