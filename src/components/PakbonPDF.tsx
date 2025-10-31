import React from 'react';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

interface PakbonPDFProps {
  project: any;
  verdeler: any;
  pickupPerson: {
    name: string;
    signature: string;
  };
  onGenerated?: (pdfBlob: Blob) => void;
}

export const generatePakbonPDF = async (
  project: any,
  verdeler: any,
  pickupPerson: { name: string; signature: string }
): Promise<Blob> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;

  try {
    const logoImg = new Image();
    logoImg.src = '/EWP-logo-zwart.png';

    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
    });

    doc.addImage(logoImg, 'PNG', margin, yPosition, 50, 20);
    yPosition += 30;
  } catch (error) {
    console.error('Error loading logo:', error);
    yPosition += 10;
  }

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('PAKBON', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const currentDate = new Date().toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`Datum: ${currentDate}`, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 15;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Project Informatie', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
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
    doc.text(info.label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(info.value, margin + 45, yPosition);
    yPosition += 6;
  });

  yPosition += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Afleveradres', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const afleverAdres = project.aflever_adres || '-';
  const splitAdres = doc.splitTextToSize(afleverAdres, pageWidth - 2 * margin);
  doc.text(splitAdres, margin, yPosition);
  yPosition += splitAdres.length * 6 + 5;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Contactpersoon op Locatie', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const contactInfo = [
    { label: 'Naam:', value: `${project.contactpersoon_voornaam || ''} ${project.contactpersoon_achternaam || ''}`.trim() || '-' },
    { label: 'Telefoon:', value: project.contactpersoon_telefoon || '-' },
    { label: 'E-mail:', value: project.contactpersoon_email || '-' },
  ];

  contactInfo.forEach(info => {
    doc.setFont('helvetica', 'bold');
    doc.text(info.label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(info.value, margin + 25, yPosition);
    yPosition += 6;
  });

  yPosition += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Verdeler Details', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const verdelerInfo = [
    { label: 'Kast Naam:', value: verdeler.kast_naam || '-' },
    { label: 'Verdeler ID:', value: verdeler.distributor_id || '-' },
    { label: 'Systeem:', value: verdeler.systeem || '-' },
    { label: 'Voeding:', value: verdeler.voeding || '-' },
    { label: 'IP Waarde:', value: verdeler.ip_waarde || '-' },
  ];

  verdelerInfo.forEach(info => {
    doc.setFont('helvetica', 'bold');
    doc.text(info.label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(info.value, margin + 35, yPosition);
    yPosition += 6;
  });

  yPosition += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Ontvangstbevestiging', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Ik bevestig hierbij de ontvangst van bovengenoemde verdeler in goede staat.', margin, yPosition);
  yPosition += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('Naam ontvanger:', margin, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(pickupPerson.name, margin + 35, yPosition);
  yPosition += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('Handtekening:', margin, yPosition);
  yPosition += 5;

  if (pickupPerson.signature) {
    try {
      doc.addImage(pickupPerson.signature, 'PNG', margin, yPosition, 50, 20);
    } catch (error) {
      console.error('Error adding signature:', error);
    }
  }
  yPosition += 25;

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    'EWP Paneelbouw - Dit document is automatisch gegenereerd',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc.output('blob');
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
