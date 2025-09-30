import jsPDF from 'jspdf';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';

export const generateVerdelerTestSimpelPDF = async (
  testData: any,
  verdeler: any,
  projectNumber: string,
  projectId?: string,
  distributorId?: string
) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPos = 20;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number = 20) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Header with logo area (placeholder)
    doc.setFillColor(255, 255, 255);
    doc.rect(pageWidth - 60, 10, 50, 15, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('EWP MIDDEN', pageWidth - 35, 18, { align: 'center' });
    doc.text('NEDERLAND', pageWidth - 35, 23, { align: 'center' });

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Keuringsrapport', margin, yPos);
    yPos += 15;

    // Technical specifications section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const specs = [
      { label: 'Un', value: testData.verdelerTestSimpel.un || '400', unit: '[ Vac ]' },
      { label: 'In', value: testData.verdelerTestSimpel.inValue || '', unit: '[ A ]' },
      { label: 'Ik dyn', value: testData.verdelerTestSimpel.ikDyn || '', unit: '[ kA ]' },
      { label: 'Ik th', value: testData.verdelerTestSimpel.ikTh || '', unit: '[ kA ]' },
      { label: 'F', value: testData.verdelerTestSimpel.frequency || '50', unit: '[ Hz ]' },
    ];

    specs.forEach(spec => {
      doc.text(`${spec.label}`, margin, yPos);
      doc.text(`: ${spec.value}`, margin + 30, yPos);
      doc.text(spec.unit, margin + 80, yPos);
      yPos += 6;
    });

    // Un-hulp section
    yPos += 4;
    doc.text('Un-hulp:', margin, yPos);
    yPos += 6;

    const hulp230 = testData.verdelerTestSimpel.unHulp230 ? '[X]' : '[ ]';
    const hulp24 = testData.verdelerTestSimpel.unHulp24 ? '[X]' : '[ ]';

    doc.text(`${hulp230} 230 [ Vac ]`, margin + 10, yPos);
    doc.text('Un van hulpstroombanen', margin + 50, yPos);
    yPos += 6;
    doc.text(`${hulp24} 24 [ Vac ]`, margin + 10, yPos);
    doc.text('( indien van toepassing )', margin + 50, yPos);
    yPos += 8;

    if (testData.verdelerTestSimpel.afwijkend) {
      doc.text(`Afwijkend: ${testData.verdelerTestSimpel.afwijkend} [ V ]`, margin, yPos);
      yPos += 8;
    }

    // Keuringsprocedure
    doc.setFont('helvetica', 'bold');
    doc.text('Keuringsprocedure', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.text('Samenstelling: NEN-EN-IEC 61439 -1-2 (EN 61439 / IEC 439) / NEN 1010', margin, yPos);
    yPos += 12;

    // Category titles mapping
    const categoryTitles: Record<string, string> = {
      goederenstroom: '1  Goederenstroom',
      verdeelblok: '2  Verdeelblok 80, 100, 125 en 160 A',
      componenten: '3  Componenten',
      interne_bedrading: '4  Interne bedrading',
      montageframe: '5  Montageframe',
      beproeving: '6  Beproeving',
      eindafwerking: '7  Eindafwerking',
      eindcontrole: '8  Eindcontrole',
      diversen: '9  Diversen'
    };

    // Group items by category
    const itemsByCategory: Record<string, any[]> = {};
    testData.verdelerTestSimpel.items.forEach((item: any) => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });

    // Render each category
    Object.keys(itemsByCategory).forEach((category) => {
      checkPageBreak(40);

      // Category header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(categoryTitles[category], margin + 2, yPos);
      yPos += 10;

      // Column headers (only for non-text categories)
      const hasTextItems = itemsByCategory[category].some((item: any) =>
        item.options && item.options.includes('text')
      );

      if (!hasTextItems) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const headerY = yPos;
        yPos += 6;

        // Draw header line
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos - 1, pageWidth - margin, yPos - 1);
      }

      // Render items
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      itemsByCategory[category].forEach((item: any, index: number) => {
        checkPageBreak(15);

        const itemY = yPos;

        // Field number
        doc.text(item.field, margin, itemY);

        // Description (wrapped if too long)
        const maxDescWidth = 90;
        const descLines = doc.splitTextToSize(item.description, maxDescWidth);
        doc.text(descLines, margin + 15, itemY);

        // Status checkboxes
        if (item.options && item.options.includes('text')) {
          // Text field - show notes
          if (item.notes) {
            const notesLines = doc.splitTextToSize(item.notes, 60);
            doc.text(notesLines, margin + 110, itemY);
          }
        } else {
          // Checkbox options
          const statusX = margin + 110;
          const boxSize = 3;
          const spacing = 15;

          item.options.forEach((option: string, optIndex: number) => {
            const boxX = statusX + (optIndex * spacing);

            // Draw checkbox
            doc.rect(boxX, itemY - 3, boxSize, boxSize);

            // Fill if selected
            if (item.passed === option) {
              doc.setFillColor(0, 0, 0);
              doc.rect(boxX + 0.5, itemY - 2.5, boxSize - 1, boxSize - 1, 'F');
            }
          });

          // Notes column
          if (item.notes) {
            const notesText = doc.splitTextToSize(item.notes, 30);
            doc.text(notesText, pageWidth - margin - 35, itemY);
          }
        }

        // Calculate line height based on wrapped text
        const lineHeight = Math.max(descLines.length * 4, 8);
        yPos += lineHeight;

        // Draw separator line
        if (index < itemsByCategory[category].length - 1) {
          doc.setDrawColor(230, 230, 230);
          doc.line(margin, yPos - 1, pageWidth - margin, yPos - 1);
        }
      });

      yPos += 8;
    });

    // Legend for status codes (add on new page if needed)
    checkPageBreak(30);
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Legenda status:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('akkoord = Goedgekeurd', margin + 5, yPos);
    doc.text('n.v.t. = Niet van toepassing', margin + 5, yPos + 4);
    doc.text('fout = Fout geconstateerd', margin + 5, yPos + 8);
    doc.text('hersteld = Fout hersteld', margin + 5, yPos + 12);
    yPos += 20;

    // Signatures section
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Handtekening voor akkoord', margin, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const signatureDate = new Date(testData.verdelerTestSimpel.date).toLocaleDateString('nl-NL');

    // Monteur
    doc.text('Monteur', margin, yPos);
    doc.text(`: ${testData.verdelerTestSimpel.monteur || '...................................................'}`, margin + 40, yPos);
    yPos += 6;
    doc.text('Datum', margin, yPos);
    doc.text(`: ${signatureDate}`, margin + 40, yPos);
    yPos += 12;

    // Tester
    doc.text('Tester', margin, yPos);
    doc.text(`: ${testData.verdelerTestSimpel.testedBy || '...................................................'}`, margin + 40, yPos);
    yPos += 6;
    doc.text('Datum', margin, yPos);
    doc.text(`: ${signatureDate}`, margin + 40, yPos);
    yPos += 12;

    // Beproevingen
    doc.text('Beproevingen', margin, yPos);
    doc.text(`: ${testData.verdelerTestSimpel.beproevingen || 'Ja'}`, margin + 40, yPos);
    yPos += 6;
    doc.text('Datum', margin, yPos);
    doc.text(`: ${signatureDate}`, margin + 40, yPos);
    yPos += 12;

    // Eindcontroleur
    doc.text('Eindcontroleur', margin, yPos);
    doc.text(`: ${testData.verdelerTestSimpel.eindcontroleur || '...................................................'}`, margin + 40, yPos);
    yPos += 6;
    doc.text('Datum', margin, yPos);
    doc.text(`: ${signatureDate}`, margin + 40, yPos);

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Versie: 1.5e', margin, pageHeight - 10);
    doc.text('Tekeningnummer: WB2 FRM411', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Pagina ${doc.internal.pages.length - 1}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

    // Generate the PDF blob
    const pdfBlob = doc.output('blob');
    const fileName = `Keuringsrapport_Simpel_${verdeler.distributor_id || verdeler.distributorId}_${Date.now()}.pdf`;

    // Upload to Supabase if projectId and distributorId are provided
    if (projectId && distributorId) {
      try {
        const uploadedUrl = await dataService.uploadProjectDocument(
          projectId,
          pdfBlob,
          fileName,
          'Test certificaten',
          distributorId
        );
        console.log('PDF uploaded successfully:', uploadedUrl);
        toast.success('Keuringsrapport opgeslagen in Test certificaten map');
      } catch (uploadError) {
        console.error('Error uploading PDF:', uploadError);
        toast.error('PDF kon niet worden geüpload naar de server');
        // Fallback to download
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }
    } else {
      // Download locally if no project/distributor context
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Keuringsrapport gedownload');
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};