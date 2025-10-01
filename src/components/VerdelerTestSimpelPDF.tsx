import jsPDF from 'jspdf';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';
import { addProfessionalHeader, addProfessionalFooter, addSectionHeader } from '../lib/pdfUtils';

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

    let yPos = await addProfessionalHeader(doc);
    yPos += 10;

    const checkPageBreak = async (requiredSpace: number = 25) => {
      if (yPos + requiredSpace > pageHeight - 30) {
        addProfessionalFooter(doc);
        doc.addPage();
        yPos = await addProfessionalHeader(doc);
        yPos += 10;
      }
    };

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const specs = [
      { label: 'Un', value: testData.verdelerTestSimpel.un || '400', unit: '[ Vac ]' },
      { label: 'In', value: testData.verdelerTestSimpel.inValue || '', unit: '[ A ]' },
      { label: 'Ik dyn', value: testData.verdelerTestSimpel.ikDyn || '', unit: '[ kA ]' },
      { label: 'Ik th', value: testData.verdelerTestSimpel.ikTh || '', unit: '[ kA ]' },
      { label: 'F', value: testData.verdelerTestSimpel.frequency || '50', unit: '[ Hz ]' },
    ];

    for (const spec of specs) {
      doc.text(`${spec.label}`, margin, yPos);
      doc.text(`: ${spec.value}`, margin + 30, yPos);
      doc.text(spec.unit, margin + 80, yPos);
      yPos += 5;
    }

    yPos += 3;
    doc.text('Un-hulp:', margin, yPos);
    yPos += 5;

    const hulp230 = testData.verdelerTestSimpel.unHulp230 ? '[X]' : '[ ]';
    const hulp24 = testData.verdelerTestSimpel.unHulp24 ? '[X]' : '[ ]';

    doc.text(`        ${hulp230} 230 [ Vac ]`, margin, yPos);
    doc.text('Un van hulpstroombanen', margin + 50, yPos);
    yPos += 5;
    doc.text(`        ${hulp24} 24 [ Vac ]`, margin, yPos);
    doc.text('( indien van toepassing )', margin + 50, yPos);
    yPos += 7;

    if (testData.verdelerTestSimpel.afwijkend) {
      doc.text(`Afwijkend: ${testData.verdelerTestSimpel.afwijkend} [ V ]`, margin, yPos);
      yPos += 7;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Keuringsprocedure', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Samenstelling: NEN-EN-IEC 61439 -1-2 (EN 61439 / IEC 439) / NEN 1010', margin, yPos);
    yPos += 10;

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

    const itemsByCategory: Record<string, any[]> = {};
    testData.verdelerTestSimpel.items.forEach((item: any) => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });

    for (const category of Object.keys(itemsByCategory)) {
      await checkPageBreak(35);

      yPos = addSectionHeader(doc, categoryTitles[category], yPos);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      for (let index = 0; index < itemsByCategory[category].length; index++) {
        const item = itemsByCategory[category][index];
        await checkPageBreak(18);

        const currentY = yPos;
        const descWidth = 85;

        doc.text(item.field, margin + 2, currentY);

        const descLines = doc.splitTextToSize(item.description, descWidth);
        doc.text(descLines, margin + 15, currentY);

        if (item.options && item.options.includes('text')) {
          if (item.notes) {
            const notesLines = doc.splitTextToSize(item.notes, 45);
            doc.text(notesLines, margin + 105, currentY);
          }
        } else {
          const statusX = margin + 105;
          const boxSize = 3;
          const spacing = 12;

          for (let optIndex = 0; optIndex < item.options.length; optIndex++) {
            const option = item.options[optIndex];
            const boxX = statusX + (optIndex * spacing);
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.3);
            doc.rect(boxX, currentY - 2.5, boxSize, boxSize);

            if (item.passed === option) {
              doc.setFillColor(0, 0, 0);
              doc.rect(boxX + 0.4, currentY - 2.1, boxSize - 0.8, boxSize - 0.8, 'F');
            }
          }

          if (item.notes) {
            const notesText = doc.splitTextToSize(item.notes, 35);
            doc.text(notesText, margin + 145, currentY);
          }
        }

        const lineHeight = Math.max(descLines.length * 3.5, 6);
        yPos = currentY + lineHeight;

        if (index < itemsByCategory[category].length - 1) {
          doc.setDrawColor(240, 240, 240);
          doc.setLineWidth(0.1);
          doc.line(margin + 12, yPos, pageWidth - margin, yPos);
          yPos += 1;
        }
      }

      yPos += 5;
    }

    await checkPageBreak(25);
    yPos += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Legenda status:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('akkoord = Goedgekeurd', margin + 5, yPos);
    yPos += 3.5;
    doc.text('n.v.t. = Niet van toepassing', margin + 5, yPos);
    yPos += 3.5;
    doc.text('fout = Fout geconstateerd', margin + 5, yPos);
    yPos += 3.5;
    doc.text('hersteld = Fout hersteld', margin + 5, yPos);
    yPos += 10;

    await checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Handtekening voor akkoord', margin, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const signatureDate = new Date(testData.verdelerTestSimpel.date).toLocaleDateString('nl-NL');

    doc.text('Monteur', margin, yPos);
    doc.text(`: ${testData.verdelerTestSimpel.monteur || '...................................................'}`, margin + 40, yPos);
    yPos += 5;
    doc.text('Datum', margin, yPos);
    doc.text(`: ${signatureDate}`, margin + 40, yPos);
    yPos += 10;

    doc.text('Tester', margin, yPos);
    doc.text(`: ${testData.verdelerTestSimpel.testedBy || '...................................................'}`, margin + 40, yPos);
    yPos += 5;
    doc.text('Datum', margin, yPos);
    doc.text(`: ${signatureDate}`, margin + 40, yPos);
    yPos += 10;

    doc.text('Beproevingen', margin, yPos);
    doc.text(`: ${testData.verdelerTestSimpel.beproevingen || 'Ja'}`, margin + 40, yPos);
    yPos += 5;
    doc.text('Datum', margin, yPos);
    doc.text(`: ${signatureDate}`, margin + 40, yPos);
    yPos += 10;

    doc.text('Eindcontroleur', margin, yPos);
    doc.text(`: ${testData.verdelerTestSimpel.eindcontroleur || '...................................................'}`, margin + 40, yPos);
    yPos += 5;
    doc.text('Datum', margin, yPos);
    doc.text(`: ${signatureDate}`, margin + 40, yPos);

    addProfessionalFooter(doc);

    const pdfBase64 = doc.output('datauristring');
    const fileName = `Keuringsrapport_Simpel_${verdeler.distributor_id || verdeler.distributorId}_${new Date().toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`;

    if (projectId && distributorId) {
      try {
        await dataService.createDocument({
          projectId,
          distributorId,
          folder: 'Test certificaat',
          name: fileName,
          type: 'application/pdf',
          size: pdfBase64.length,
          content: pdfBase64
        });

        console.log('PDF automatically saved to Test certificaat folder');
        toast.success('Keuringsrapport automatisch opgeslagen in Test certificaat map!');
      } catch (uploadError) {
        console.error('Error uploading PDF:', uploadError);
        toast.error('PDF kon niet worden opgeslagen naar de server');
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }
    } else {
      const pdfBlob = doc.output('blob');
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
