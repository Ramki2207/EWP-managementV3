import React from 'react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface PakbonPDFProps {
  project: any;
  verdeler: any;
  pickupPerson: {
    name: string;
    signature: string;
  } | null;
  onGenerated?: (pdfBlob: Blob) => void;
}

export const generatePakbonPDF = async (
  project: any,
  verdeler: any,
  pickupPerson: { name: string; signature: string } | null
): Promise<Blob> => {
  console.log('📄 PDF: Starting PDF generation');
  console.log('📄 PDF: Project data:', project);
  console.log('📄 PDF: Verdeler data:', verdeler);
  console.log('📄 PDF: Pickup person:', pickupPerson);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 15;

  try {
    console.log('📄 PDF: Loading logo...');
    const logoImg = new Image();
    logoImg.src = '/EWP logo test.png';

    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Failed to load logo image'));
    });

    const canvas = document.createElement('canvas');

    const targetWidth = 600;
    const targetHeight = Math.round((logoImg.height / logoImg.width) * targetWidth);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logoImg, 0, 0, targetWidth, targetHeight);
      const logoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const logoAspectRatio = targetWidth / targetHeight;
      const logoWidth = 60;
      const logoHeight = logoWidth / logoAspectRatio;

      doc.addImage(logoDataUrl, 'JPEG', margin, yPosition, logoWidth, logoHeight);
      yPosition = Math.max(yPosition + logoHeight + 5, yPosition + 20);
    }
  } catch (error) {
    console.error('Error loading logo:', error);
    yPosition += 5;
  }

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PAKBON', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const currentDate = new Date().toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Datum: ${currentDate}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 10;

  doc.setDrawColor(26, 26, 26);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Project Informatie', margin + 2, yPosition + 5);
  yPosition += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const projectInfo = [
    { label: 'Projectnummer:', value: project.project_number || '-' },
    { label: 'Klant:', value: project.client || '-' },
    { label: 'Locatie:', value: project.location || '-' },
    { label: 'Referentie EWP:', value: project.referentie_ewp || '-' },
    { label: 'Referentie Klant:', value: project.referentie_klant || '-' },
  ];

  projectInfo.forEach(info => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(info.label, margin + 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(info.value, margin + 42, yPosition);
    yPosition += 5;
  });

  yPosition += 3;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Afleveradres', margin + 2, yPosition + 5);
  yPosition += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const afleverAdres = project.aflever_adres || '-';
  const splitAdres = doc.splitTextToSize(afleverAdres, pageWidth - 2 * margin - 4);
  doc.text(splitAdres, margin + 2, yPosition);
  yPosition += splitAdres.length * 5 + 3;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPosition, (pageWidth - 2 * margin) / 2 - 2, 7, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Contactpersoon op Locatie', margin + 2, yPosition + 5);

  const verdelerStartX = pageWidth / 2 + 2;
  doc.setFillColor(245, 245, 245);
  doc.rect(verdelerStartX, yPosition, (pageWidth - 2 * margin) / 2 - 2, 7, 'F');
  doc.text('Verdeler', verdelerStartX + 2, yPosition + 5);
  yPosition += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const contactInfo = [
    { label: 'Naam:', value: `${project.contactpersoon_voornaam || ''} ${project.contactpersoon_achternaam || ''}`.trim() || '-' },
    { label: 'Telefoon:', value: project.contactpersoon_telefoon || '-' },
    { label: 'E-mail:', value: project.contactpersoon_email || '-' },
  ];

  const contactStartY = yPosition;

  contactInfo.forEach((info, index) => {
    const y = contactStartY + (index * 5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(info.label, margin + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const valueText = doc.splitTextToSize(info.value, (pageWidth - 2 * margin) / 2 - 25);
    doc.text(valueText, margin + 22, y);
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const kastNaam = verdeler.kast_naam || '-';
  const kastNaamLines = doc.splitTextToSize(kastNaam, (pageWidth - 2 * margin) / 2 - 8);
  doc.text(kastNaamLines, verdelerStartX + 2, contactStartY + 2);

  yPosition += contactInfo.length * 5 + 5;

  doc.setDrawColor(26, 26, 26);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Ontvangstbevestiging', margin + 2, yPosition + 5);
  yPosition += 10;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Ik bevestig hierbij de ontvangst van bovengenoemde verdeler in goede staat.', margin + 2, yPosition);
  yPosition += 8;

  if (pickupPerson) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Naam ontvanger:', margin + 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(pickupPerson.name, margin + 32, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Handtekening:', margin + 2, yPosition);
    yPosition += 3;

    if (pickupPerson.signature) {
      try {
        doc.addImage(pickupPerson.signature, 'PNG', margin + 2, yPosition, 50, 20);
      } catch (error) {
        console.error('Error adding signature:', error);
      }
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Naam ontvanger:', margin + 2, yPosition);
    yPosition += 1;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin + 32, yPosition, pageWidth - margin - 2, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Handtekening:', margin + 2, yPosition);
    yPosition += 3;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(margin + 2, yPosition, 70, 25);
  }

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'EWP Paneelbouw - Dit document is automatisch gegenereerd',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  console.log('📄 PDF: PDF generation complete');
  const blob = doc.output('blob');
  console.log('📄 PDF: Blob created, size:', blob.size);
  return blob;
};

const PakbonPDF: React.FC<PakbonPDFProps> = ({ project, verdeler, pickupPerson, onGenerated }) => {
  const handleGenerate = async () => {
    try {
      const blob = await generatePakbonPDF(project, verdeler, pickupPerson);

      if (onGenerated) {
        onGenerated(blob);
      }

      toast.success('Pakbon succesvol gegenereerd!');
    } catch (error) {
      console.error('Error generating pakbon:', error);
      toast.error('Er is een fout opgetreden bij het genereren van de pakbon');
    }
  };

  return null;
};

export default PakbonPDF;
