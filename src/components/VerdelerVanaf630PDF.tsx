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

    // Add the EWP header image
    try {
      const headerImg = new Image();
      headerImg.crossOrigin = 'anonymous';
      headerImg.onload = () => {
        try {
          // Add the header image at the top
          const imgWidth = pageWidth - 40; // Full width minus margins
          const imgHeight = 30; // Fixed height for header
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
    pdf.text('KEURINGSRAPPORT VERDELER VANAF 630A', 20, yPosition);
    yPosition += 15;

    // Project Information
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')}`, 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.text(`Project: ${projectNumber}`, 20, yPosition);
    pdf.text(`Verdeler: ${verdeler.distributorId || verdeler.distributor_id}`, 20, yPosition + 5);
    if (verdeler.kastNaam || verdeler.kast_naam) {
      pdf.text(`Kastnaam: ${verdeler.kastNaam || verdeler.kast_naam}`, 20, yPosition + 10);
    }
    pdf.text(`Rapport ID: KR630-${Date.now().toString().slice(-6)}`, 20, yPosition + 15);
    
    yPosition += 30;

    // Workshop Checklist Section
    if (testData.workshopChecklist) {
      const { workshopChecklist } = testData;
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Werkplaats Checklist - Verdeler vanaf 630A', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Datum: ${workshopChecklist.date ? new Date(workshopChecklist.date).toLocaleDateString('nl-NL') : '-'}`, 20, yPosition);
      pdf.text(`Uitgevoerd door: ${workshopChecklist.testedBy || '-'}`, 120, yPosition);
      yPosition += 15;

      // Add workshop checklist items
      if (workshopChecklist.items && workshopChecklist.items.length > 0) {
        // Group items by category
        const itemsByCategory: Record<string, any[]> = {};
        workshopChecklist.items.forEach((item: any) => {
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

        // Table header
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Veld', 20, yPosition);
        pdf.text('Beschrijving', 40, yPosition);
        pdf.text('Status', 140, yPosition);
        pdf.text('Opmerkingen', 160, yPosition);
        yPosition += 8;

        // Add each category
        Object.keys(itemsByCategory).forEach((category) => {
          // Category header
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(categoryTitles[category as keyof typeof categoryTitles] || category, 20, yPosition);
          yPosition += 8;

          // Add items for this category
          itemsByCategory[category].forEach((item: any) => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            
            // Field number
            pdf.text(item.field || '', 20, yPosition);
            
            // Description (wrap text if too long)
            const descriptionLines = pdf.splitTextToSize(item.description, 95);
            pdf.text(descriptionLines, 40, yPosition);
            
            // Status
            let statusText = '';
            if (item.passed === 'akkoord') {
              statusText = '✓ Akkoord';
            } else if (item.passed === 'n.v.t.') {
              statusText = 'N.v.t.';
            } else if (item.passed === 'fout') {
              statusText = '✗ Fout';
            } else if (item.passed === 'hersteld') {
              statusText = '🔧 Hersteld';
            } else if (typeof item.passed === 'string') {
              statusText = item.passed;
            } else {
              statusText = item.passed ? '✓' : item.passed === false ? '✗' : '-';
            }
            
            pdf.text(statusText, 140, yPosition);
            
            // Notes
            if (item.notes) {
              const notesLines = pdf.splitTextToSize(item.notes, 35);
              pdf.text(notesLines, 160, yPosition);
            }
            
            yPosition += Math.max(descriptionLines.length * 3, 6);
          });
          
          yPosition += 5;
        });
      }
    }

    // Inspection Report Section
    if (testData.inspectionReport) {
      const { inspectionReport } = testData;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Keuringsrapport', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Datum: ${inspectionReport.date ? new Date(inspectionReport.date).toLocaleDateString('nl-NL') : '-'}`, 20, yPosition);
      pdf.text(`Geïnspecteerd door: ${inspectionReport.inspectedBy || '-'}`, 120, yPosition);
      yPosition += 6;
      pdf.text(`Goedgekeurd door: ${inspectionReport.approvedBy || '-'}`, 20, yPosition);
      yPosition += 15;

      // Table header
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Controle', 20, yPosition);
      pdf.text('Status', 140, yPosition);
      pdf.text('Opmerkingen', 160, yPosition);
      yPosition += 8;

      // Inspection items
      inspectionReport.items.forEach((item: any) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        const descriptionLines = pdf.splitTextToSize(item.description, 115);
        pdf.text(descriptionLines, 20, yPosition);
        
        // Status
        const statusText = item.passed ? '✓ Akkoord' : item.passed === false ? '✗ Niet akkoord' : '-';
        pdf.text(statusText, 140, yPosition);
        
        if (item.notes) {
          const notesLines = pdf.splitTextToSize(item.notes, 35);
          pdf.text(notesLines, 160, yPosition);
        }
        
        yPosition += Math.max(descriptionLines.length * 4, 8);
      });

      // Final result
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      
      let resultText = 'ONBEKEND';
      if (inspectionReport.result === 'approved') {
        resultText = 'GOEDGEKEURD';
      } else if (inspectionReport.result === 'conditionallyApproved') {
        resultText = 'VOORWAARDELIJK GOEDGEKEURD';
      } else if (inspectionReport.result === 'rejected') {
        resultText = 'AFGEKEURD';
      }
      
      pdf.text(`EINDRESULTAAT: ${resultText}`, 20, yPosition);
      yPosition += 15;

      // Notes section
      if (inspectionReport.notes) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('OPMERKINGEN:', 20, yPosition);
        yPosition += 8;
        
        pdf.setFont('helvetica', 'normal');
        const notesLines = pdf.splitTextToSize(inspectionReport.notes, pageWidth - 40);
        pdf.text(notesLines, 20, yPosition);
        yPosition += notesLines.length * 5;
      }
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text('© 2025 EWP Paneelbouw B.V. - Verdeler vanaf 630A', 20, pageHeight - 10);
    pdf.text(`Gegenereerd op: ${new Date().toLocaleString('nl-NL')}`, pageWidth - 20, pageHeight - 10, { align: 'right' });

    // Generate PDF as base64
    const pdfBase64 = pdf.output('datauristring');
    
    // Save PDF to documents if project and distributor IDs are provided
    if (projectId && distributorId) {
      try {
        const filename = `Keuringsrapport_vanaf_630A_${verdeler.distributorId || verdeler.distributor_id}_${new Date().toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`;
        
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
        toast.success('Keuringsrapport vanaf 630A PDF automatisch opgeslagen in Test certificaat map!');
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