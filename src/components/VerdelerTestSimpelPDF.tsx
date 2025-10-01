import jsPDF from 'jspdf';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';
import { addProfessionalHeader, addProfessionalFooter } from '../lib/pdfUtils';

export const generateVerdelerTestSimpelPDF = async (
  testData: any,
  verdeler: any,
  projectNumber: string,
  projectId?: string,
  distributorId?: string
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let yPosition = await addProfessionalHeader(pdf);
    yPosition += 10;

    const { verdelerTestSimpel } = testData;

    // Technical specifications header section
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    pdf.text(`Un`, 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.un || '400'}`, 50, yPosition);
    pdf.text('[ Vac ]', 100, yPosition);
    yPosition += 5;

    pdf.text(`In`, 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.inValue || ''}`, 50, yPosition);
    pdf.text('[ A ]', 100, yPosition);
    yPosition += 5;

    pdf.text(`Ik dyn`, 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.ikDyn || ''}`, 50, yPosition);
    pdf.text('[ kA ]', 100, yPosition);
    yPosition += 5;

    pdf.text(`Ik th`, 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.ikTh || ''}`, 50, yPosition);
    pdf.text('[ kA ]', 100, yPosition);
    yPosition += 5;

    pdf.text(`F`, 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.frequency || '50'}`, 50, yPosition);
    pdf.text('[ Hz ]', 100, yPosition);
    yPosition += 8;

    // Un-hulp section
    pdf.text('Un-hulp:', 20, yPosition);
    yPosition += 5;

    const unHulp230 = verdelerTestSimpel.unHulp230;
    const unHulp24 = verdelerTestSimpel.unHulp24;

    pdf.text(unHulp230 ? ' [X] 230 [ Vac ]' : ' [ ] 230 [ Vac ]', 25, yPosition);
    pdf.text('Un van hulpstroombanen', 60, yPosition);
    yPosition += 5;

    pdf.text(unHulp24 ? ' [X] 24 [ Vac ]' : ' [ ] 24 [ Vac ]', 25, yPosition);
    pdf.text('( indien van toepassing )', 60, yPosition);
    yPosition += 10;

    // Keuringsprocedure
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Keuringsprocedure', 20, yPosition);
    yPosition += 6;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Samenstelling: NEN-EN-IEC 61439 -1-2 (EN 61439 / IEC 439) / NEN 1010', 20, yPosition);
    yPosition += 12;

    // Add test items by category
    if (verdelerTestSimpel.items && verdelerTestSimpel.items.length > 0) {
      // Group items by category
      const itemsByCategory: Record<string, any[]> = {};
      verdelerTestSimpel.items.forEach((item: any) => {
        if (!itemsByCategory[item.category]) {
          itemsByCategory[item.category] = [];
        }
        itemsByCategory[item.category].push(item);
      });

      const categoryTitles: Record<string, string> = {
        goederenstroom: '1 Goederenstroom',
        verdeelblok: '2 Verdeelblok 80, 100, 125 en 160 A',
        componenten: '3 Componenten',
        interne_bedrading: '4 Interne bedrading',
        montageframe: '5 Montageframe',
        beproeving: '6 Beproeving',
        eindafwerking: '7 Eindafwerking',
        eindcontrole: '8 Eindcontrole',
        diversen: '9 Diversen'
      };

      // Add each category
      Object.keys(itemsByCategory).forEach((category) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
          addProfessionalFooter(pdf);
          pdf.addPage();
          yPosition = (async () => await addProfessionalHeader(pdf))() as any;
          yPosition = 20;
        }

        // Category header with gray background
        pdf.setFillColor(220, 220, 220);
        pdf.rect(20, yPosition - 5, pageWidth - 40, 7, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text(categoryTitles[category] || category, 22, yPosition);
        yPosition += 8;

        // Add items for this category
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');

        itemsByCategory[category].forEach((item: any) => {
          if (yPosition > pageHeight - 20) {
            addProfessionalFooter(pdf);
            pdf.addPage();
            yPosition = 20;
          }

          // Field number
          pdf.text(item.field || '', 20, yPosition);

          // Description (wrap text if too long)
          const descriptionLines = pdf.splitTextToSize(item.description, 85);
          pdf.text(descriptionLines, 35, yPosition);

          // Status - show checkboxes
          const statusX = 130;
          const boxSize = 3;
          const spacing = 12;

          if (item.options && item.options.length > 0) {
            item.options.forEach((option: string, index: number) => {
              const boxX = statusX + (index * spacing);
              pdf.setDrawColor(100, 100, 100);
              pdf.setLineWidth(0.3);
              pdf.rect(boxX, yPosition - 2.5, boxSize, boxSize);

              if (item.passed === option) {
                pdf.setFillColor(0, 0, 0);
                pdf.rect(boxX + 0.4, yPosition - 2.1, boxSize - 0.8, boxSize - 0.8, 'F');
              }
            });
          }

          // Notes
          if (item.notes) {
            const notesLines = pdf.splitTextToSize(item.notes, 30);
            pdf.text(notesLines, 168, yPosition);
          }

          const lineHeight = Math.max(descriptionLines.length * 3.5, 6);
          yPosition += lineHeight;
        });

        yPosition += 5;
      });
    }

    // Legend
    if (yPosition > pageHeight - 40) {
      addProfessionalFooter(pdf);
      pdf.addPage();
      yPosition = 20;
    }

    yPosition += 3;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('Legenda status:', 20, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.text('akkoord = Goedgekeurd', 25, yPosition);
    yPosition += 3.5;
    pdf.text('n.v.t. = Niet van toepassing', 25, yPosition);
    yPosition += 3.5;
    pdf.text('fout = Fout geconstateerd', 25, yPosition);
    yPosition += 3.5;
    pdf.text('hersteld = Fout hersteld', 25, yPosition);
    yPosition += 10;

    // Signatures section
    if (yPosition > pageHeight - 50) {
      addProfessionalFooter(pdf);
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Handtekening voor akkoord', 20, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    // Monteur
    pdf.text('Monteur', 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.monteur || ''}`, 60, yPosition);
    yPosition += 6;
    pdf.text('Datum', 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.monteurDatum || ''}`, 60, yPosition);
    yPosition += 10;

    // Tester
    pdf.text('Tester', 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.tester || ''}`, 60, yPosition);
    yPosition += 6;
    pdf.text('Datum', 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.testerDatum || ''}`, 60, yPosition);
    yPosition += 10;

    // Beproevingen
    pdf.text('Beproevingen', 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.beproevingen || ''}`, 60, yPosition);
    yPosition += 6;
    pdf.text('Datum', 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.beproevingenDatum || ''}`, 60, yPosition);
    yPosition += 10;

    // Eindcontroleur
    pdf.text('Eindcontroleur', 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.eindcontroleur || ''}`, 60, yPosition);
    yPosition += 6;
    pdf.text('Datum', 20, yPosition);
    pdf.text(`: ${verdelerTestSimpel.eindcontroleurDatum || ''}`, 60, yPosition);

    // Add footer to last page
    addProfessionalFooter(pdf);

    const pdfBlob = pdf.output('blob');
    const filename = `Keuringsrapport_Simpel_${verdeler.distributor_id || verdeler.distributorId}_${new Date().toLocaleDateString('nl-NL')}.pdf`;

    // Save to Supabase if projectId and distributorId are provided
    if (projectId && distributorId) {
      try {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });
        const filePath = `${projectId}/${distributorId}/${filename}`;

        const { error: uploadError } = await dataService.uploadFile('project-documents', filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Fout bij uploaden van PDF');
        } else {
          const { error: docError } = await dataService.createDocument({
            project_id: projectId,
            distributor_id: distributorId,
            document_type: 'keuringsrapport_simpel',
            file_path: filePath,
            file_name: filename,
            uploaded_by: 'system'
          });

          if (docError) {
            console.error('Document creation error:', docError);
          } else {
            toast.success('PDF succesvol opgeslagen');
          }
        }
      } catch (error) {
        console.error('Error saving PDF:', error);
        toast.error('Fout bij opslaan van PDF');
      }
    }

    return filename;
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Fout bij genereren van PDF');
    throw error;
  }
};
