import React from 'react';
import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';
import ewpLogo from '../assets/ewp-logo.png';

interface Material {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
}

interface WorkEntry {
  id: string;
  distributor_id: string;
  worker_id: string;
  worker_name: string;
  date: string;
  hours: number;
  status: string;
  notes: string;
  materials: Material[];
}

interface InvoiceReportPDFProps {
  project: any;
  className?: string;
}

const InvoiceReportPDF: React.FC<InvoiceReportPDFProps> = ({ project, className = '' }) => {
  const generatePDF = async () => {
    try {
      toast.loading('Factuurrapport genereren...', { id: 'invoice-pdf' });

      // Load all work entries for this project
      const allWorkEntries: WorkEntry[] = [];

      if (project.distributors && project.distributors.length > 0) {
        for (const distributor of project.distributors) {
          try {
            const entries = await dataService.getWorkEntries(distributor.id);
            const users = await dataService.getUsers();

            const formattedEntries = entries.map((entry: any) => ({
              id: entry.id,
              distributor_id: entry.distributor_id,
              worker_id: entry.worker_id,
              worker_name: users.find((u: any) => u.id === entry.worker_id)?.username || 'Onbekend',
              date: entry.date,
              hours: parseFloat(entry.hours) || 0,
              status: entry.status || 'in_progress',
              notes: entry.notes || '',
              materials: entry.materials || []
            }));

            allWorkEntries.push(...formattedEntries);
          } catch (error) {
            console.error(`Error loading work entries for distributor ${distributor.id}:`, error);
          }
        }
      }

      if (allWorkEntries.length === 0) {
        toast.error('Geen gewerkte uren gevonden voor dit project', { id: 'invoice-pdf' });
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Add logo
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      try {
        const logoImg = await loadImage(ewpLogo);
        doc.addImage(logoImg, 'PNG', 15, yPos, 40, 15);
      } catch (error) {
        console.warn('Could not load logo:', error);
      }

      yPos += 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Factuurrapport - Gewerkte Uren & Materialen', pageWidth / 2, yPos, { align: 'center' });

      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gegenereerd op: ${new Date().toLocaleDateString('nl-NL')}`, pageWidth / 2, yPos, { align: 'center' });

      yPos += 15;

      // Project info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Project Informatie', 15, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Projectnummer: ${project.project_number}`, 15, yPos);
      yPos += 6;
      doc.text(`Klant: ${project.client}`, 15, yPos);
      yPos += 6;
      doc.text(`Locatie: ${project.location}`, 15, yPos);
      yPos += 6;
      if (project.description) {
        doc.text(`Beschrijving: ${project.description}`, 15, yPos);
        yPos += 6;
      }

      yPos += 10;

      // Summary Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Samenvatting', 15, yPos);
      yPos += 7;

      // Calculate totals
      const totalHours = allWorkEntries.reduce((sum, entry) => sum + entry.hours, 0);
      const allMaterials: Material[] = [];
      allWorkEntries.forEach(entry => {
        if (entry.materials && entry.materials.length > 0) {
          allMaterials.push(...entry.materials);
        }
      });

      // Group workers and their hours
      const workerHours: { [key: string]: number } = {};
      allWorkEntries.forEach(entry => {
        if (!workerHours[entry.worker_name]) {
          workerHours[entry.worker_name] = 0;
        }
        workerHours[entry.worker_name] += entry.hours;
      });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Totaal aantal gewerkte uren: ${totalHours.toFixed(2)} uur`, 15, yPos);
      yPos += 6;
      doc.text(`Aantal werknemers: ${Object.keys(workerHours).length}`, 15, yPos);
      yPos += 6;
      doc.text(`Aantal werkbonnen: ${allWorkEntries.length}`, 15, yPos);
      yPos += 6;
      doc.text(`Aantal materiaal items: ${allMaterials.length}`, 15, yPos);

      yPos += 10;

      // Worker breakdown
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Uren per Werknemer', 15, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      Object.entries(workerHours).forEach(([worker, hours]) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${worker}: ${hours.toFixed(2)} uur`, 20, yPos);
        yPos += 6;
      });

      yPos += 5;

      // Detailed work entries
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Gedetailleerde Werkbonnen', 15, yPos);
      yPos += 10;

      // Sort entries by date
      const sortedEntries = [...allWorkEntries].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      sortedEntries.forEach((entry, index) => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }

        // Entry header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Werkbon ${index + 1}`, 15, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.text(`Datum: ${new Date(entry.date).toLocaleDateString('nl-NL')}`, 20, yPos);
        yPos += 5;
        doc.text(`Werknemer: ${entry.worker_name}`, 20, yPos);
        yPos += 5;
        doc.text(`Uren: ${entry.hours.toFixed(2)}`, 20, yPos);
        yPos += 5;

        // Find distributor name
        const distributor = project.distributors?.find((d: any) => d.id === entry.distributor_id);
        if (distributor) {
          doc.text(`Verdeler: ${distributor.distributor_id}`, 20, yPos);
          yPos += 5;
        }

        if (entry.notes) {
          const notesLines = doc.splitTextToSize(`Notities: ${entry.notes}`, pageWidth - 40);
          doc.text(notesLines, 20, yPos);
          yPos += 5 * notesLines.length;
        }

        // Materials for this entry
        if (entry.materials && entry.materials.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Materialen:', 20, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');

          entry.materials.forEach((material: Material) => {
            if (yPos > pageHeight - 20) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`  - ${material.description}: ${material.quantity} ${material.unit}`, 25, yPos);
            yPos += 5;
          });
        }

        yPos += 5;
      });

      // Materials summary (if any)
      if (allMaterials.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        yPos += 5;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Materiaal Overzicht', 15, yPos);
        yPos += 10;

        // Group materials by description
        const materialSummary: { [key: string]: { quantity: number; unit: string } } = {};
        allMaterials.forEach((material: Material) => {
          if (!materialSummary[material.description]) {
            materialSummary[material.description] = {
              quantity: 0,
              unit: material.unit
            };
          }
          materialSummary[material.description].quantity += material.quantity;
        });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        Object.entries(materialSummary).forEach(([description, data]) => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${description}: ${data.quantity} ${data.unit}`, 20, yPos);
          yPos += 6;
        });
      }

      // Footer on last page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Pagina ${i} van ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          '© 2025 EWP Paneelbouw',
          pageWidth / 2,
          pageHeight - 6,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `Factuurrapport_${project.project_number}_${new Date().toLocaleDateString('nl-NL').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      toast.success('Factuurrapport succesvol gegenereerd!', { id: 'invoice-pdf' });
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      toast.error('Er is een fout opgetreden bij het genereren van het rapport', { id: 'invoice-pdf' });
    }
  };

  return (
    <button
      onClick={generatePDF}
      className={`btn-primary flex items-center space-x-2 ${className}`}
    >
      <Download size={20} />
      <span>Download Factuurrapport</span>
    </button>
  );
};

export default InvoiceReportPDF;
