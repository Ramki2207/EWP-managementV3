import React from 'react';
import jsPDF from 'jspdf';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';

interface VerdelerVanaf630PDFProps {
  testData: any;
  verdeler: any;
  projectNumber: string;
}

export const generateVerdelerVanaf630PDF = async (
  testData: any, 
  verdeler: any, 
  projectNumber: string,
  projectId?: string,
  distributorId?: string
): Promise<string> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Add the EWP header
    try {
      const headerImg = new Image();
      headerImg.crossOrigin = 'anonymous';
      headerImg.onload = () => {
        try {
          const imgWidth = pageWidth - 40;
          const imgHeight = 30;
          pdf.addImage(headerImg, 'PNG', 20, yPosition, imgWidth, imgHeight);
        } catch (imgError) {
          console.warn('Could not add header image to PDF:', imgError);
        }
      };
      headerImg.onerror = () => console.warn('Header image failed to load');
      headerImg.src = '/src/assets/Scherm%C2%ADafbeelding%202025-09-17%20om%2016.25.21.png';
    } catch (headerError) {
      console.warn('Header image loading error:', headerError);
    }

    // Move content down to account for header
    yPosition = 60;

    // Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Keuringsrapport verdeler vanaf 630 A', 20, yPosition);
    yPosition += 15;

    // Project Information
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')}`, 20, yPosition);
    yPosition += 8;

    const { verdelerVanaf630Test } = testData;
    
    // Header information
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Datum: ${verdelerVanaf630Test.date ? new Date(verdelerVanaf630Test.date).toLocaleDateString('nl-NL') : ''}`, 20, yPosition);
    pdf.text(`Tekeningnr.: ${projectNumber}`, 120, yPosition);
    yPosition += 6;
    
    pdf.text(`Verdeler nummer: ${verdeler.distributorId || verdeler.distributor_id}`, 20, yPosition);
    pdf.text(`Bescherming: ${verdelerVanaf630Test.bescherming || ''}`, 120, yPosition);
    yPosition += 6;
    
    pdf.text(`Projectnummer: ${projectNumber}`, 20, yPosition);
    pdf.text(`Bouwjaar: ${verdelerVanaf630Test.bouwjaar || ''}`, 120, yPosition);
    yPosition += 6;
    
    pdf.text(`Dichtheidsklasse: ${verdelerVanaf630Test.dichtheidsklasse || ''}`, 20, yPosition);
    pdf.text(`Projectnaam: ${verdelerVanaf630Test.projectnaam || ''}`, 120, yPosition);
    yPosition += 15;

    // Technical specifications
    pdf.text(`Un: ${verdelerVanaf630Test.un || ''} [Vac]`, 20, yPosition);
    yPosition += 6;
    pdf.text(`In: ${verdelerVanaf630Test.inValue || ''} [A]`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Ik dyn: ${verdelerVanaf630Test.ikDyn || ''} [kA]`, 20, yPosition);
    yPosition += 6;
    pdf.text(`Ik th: ${verdelerVanaf630Test.ikTh || ''} [kA]`, 20, yPosition);
    yPosition += 6;
    pdf.text(`F: ${verdelerVanaf630Test.frequency || ''} [Hz]`, 20, yPosition);
    yPosition += 10;

    // Un-hulp section
    if (verdelerVanaf630Test.unHulp230 || verdelerVanaf630Test.unHulp24) {
      pdf.text('Un van hulpstroombanen:', 20, yPosition);
      yPosition += 6;
      if (verdelerVanaf630Test.unHulp230) {
        pdf.text('☑ 230 [Vac]', 25, yPosition);
        yPosition += 6;
      }
      if (verdelerVanaf630Test.unHulp24) {
        pdf.text('☑ 24 [Vac]', 25, yPosition);
        yPosition += 6;
      }
      yPosition += 5;
    }

    if (verdelerVanaf630Test.afwijkend) {
      pdf.text(`Afwijkend: ${verdelerVanaf630Test.afwijkend} [V]`, 20, yPosition);
      yPosition += 10;
    }

    // Keuringsprocedure
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Keuringsprocedure', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Samenstelling: NEN -EN-IEC 61439 -1/-3 (EN 61439 / IEC 439) / fabrikant handboek t/m 1600 A / NEN 1010', 20, yPosition);
    yPosition += 15;

    // Add test items by category
    if (verdelerVanaf630Test.items && verdelerVanaf630Test.items.length > 0) {
      // Group items by category
      const itemsByCategory: Record<string, any[]> = {};
      verdelerVanaf630Test.items.forEach((item: any) => {
        if (!itemsByCategory[item.category]) {
          itemsByCategory[item.category] = [];
        }
        itemsByCategory[item.category].push(item);
      });

      const categoryTitles = {
        goederenstroom: '1. Goederenstroom',
        railsystemen: '2. Railsystemen',
        componenten: '3. Componenten',
        interne_bedrading: '4. Interne bedrading',
        montageframe: '5. Montageframe',
        beproeving: '6. Beproeving',
        eindafwerking: '7. Eindafwerking',
        uitlevering: '8. Uitlevering',
        eindcontrole: '9. Eindcontrole',
        diversen: '10. Diversen'
      };

      // Add each category
      Object.keys(itemsByCategory).forEach((category) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }

        // Category header
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(categoryTitles[category as keyof typeof categoryTitles] || category, 20, yPosition);
        yPosition += 10;

        // Table headers for this category
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Veld', 20, yPosition);
        pdf.text('Beschrijving', 35, yPosition);
        pdf.text('Status', 140, yPosition);
        pdf.text('Opm.', 170, yPosition);
        yPosition += 6;

        // Add items for this category
        itemsByCategory[category].forEach((item: any) => {
          if (yPosition > pageHeight - 15) {
            pdf.addPage();
            yPosition = 20;
          }

          // Field number
          pdf.text(item.field || '', 20, yPosition);
          
          // Description (wrap text if too long)
          const descriptionLines = pdf.splitTextToSize(item.description, 100);
          pdf.text(descriptionLines, 35, yPosition);
          
          // Status
          let statusText = '';
          if (item.passed === 'akkoord') {
            statusText = '☑ Akkoord';
          } else if (item.passed === 'n.v.t.') {
            statusText = '☑ N.v.t.';
          } else if (item.passed === 'fout') {
            statusText = '☑ Fout';
          } else if (item.passed === 'hersteld') {
            statusText = '☑ Hersteld';
          } else if (typeof item.passed === 'string') {
            statusText = item.passed;
          } else {
            statusText = item.passed ? '☑' : item.passed === false ? '☐' : '☐';
          }
          
          pdf.text(statusText, 140, yPosition);
          
          // Notes
          if (item.notes) {
            const notesLines = pdf.splitTextToSize(item.notes, 25);
            pdf.text(notesLines, 170, yPosition);
          }
          
          yPosition += Math.max(descriptionLines.length * 3, 6);
        });
        
        yPosition += 8;
      });
    }

    // Signatures section
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Handtekening voor akkoord', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Monteur signature
    pdf.text(`Monteur: ${verdelerVanaf630Test.monteur || ''}`, 20, yPosition);
    pdf.text(`Tester: ${verdelerVanaf630Test.testedBy || ''}`, 120, yPosition);
    yPosition += 8;
    
    pdf.text(`Datum: ${verdelerVanaf630Test.date ? new Date(verdelerVanaf630Test.date).toLocaleDateString('nl-NL') : ''}`, 20, yPosition);
    pdf.text(`Datum: ${verdelerVanaf630Test.date ? new Date(verdelerVanaf630Test.date).toLocaleDateString('nl-NL') : ''}`, 120, yPosition);
    yPosition += 15;
    
    pdf.text(`Beproevingen: ${verdelerVanaf630Test.beproevingen || ''}`, 20, yPosition);
    pdf.text(`Eindcontroleur: ${verdelerVanaf630Test.eindcontroleur || ''}`, 120, yPosition);
    yPosition += 8;
    
    pdf.text(`Datum: ${verdelerVanaf630Test.date ? new Date(verdelerVanaf630Test.date).toLocaleDateString('nl-NL') : ''}`, 20, yPosition);
    pdf.text(`Datum: ${verdelerVanaf630Test.date ? new Date(verdelerVanaf630Test.date).toLocaleDateString('nl-NL') : ''}`, 120, yPosition);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('© 2025 EWP Paneelbouw B.V.', 20, pageHeight - 10);
    pdf.text(`Gegenereerd op: ${new Date().toLocaleString('nl-NL')}`, pageWidth - 20, pageHeight - 10, { align: 'right' });

    // Generate PDF as base64
    const pdfBase64 = pdf.output('datauristring');
    
    // Save PDF to documents if project and distributor IDs are provided
    if (projectId && distributorId) {
      try {
        const filename = `Keuringsrapport_vanaf_630_${verdeler.distributorId || verdeler.distributor_id}_${new Date().toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`;
        
        await dataService.createDocument({
          projectId,
          distributorId,
          folder: 'Test certificaat',
          name: filename,
          type: 'application/pdf',
          size: pdfBase64.length,
          content: pdfBase64
        });
        
        console.log('PDF automatically saved to Test certificaat folder');
        toast.success('Keuringsrapport vanaf 630 PDF automatisch opgeslagen in Test certificaat map!');
      } catch (error) {
        console.error('Error saving PDF to documents:', error);
        toast.error('PDF gegenereerd maar kon niet automatisch worden opgeslagen');
      }
    }
    
    return pdfBase64;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Er is een fout opgetreden bij het genereren van het PDF rapport');
  }
};

const VerdelerVanaf630PDF: React.FC<VerdelerVanaf630PDFProps> = ({ testData, verdeler, projectNumber }) => {
  return null; // This is just a utility component
};

export default VerdelerVanaf630PDF;