import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';
import { X, FileText, Loader } from 'lucide-react';
import ewp2Logo from '../assets/ewp2-logo.png';

interface ProjectDocumentationPDFProps {
  project: any;
  onClose: () => void;
}

const ProjectDocumentationPDF: React.FC<ProjectDocumentationPDFProps> = ({ project, onClose }) => {
  const [generating, setGenerating] = useState(false);

  const loadImageAsDataUrl = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  };

  const addDocumentToPDF = async (doc: jsPDF, document: any, pageWidth: number, pageHeight: number, pdfPages: Uint8Array[]) => {
    try {
      const margin = 15;

      console.log('📄 addDocumentToPDF called for:', document.name, 'storage_path:', document.storage_path);

      if (!document.storage_path) {
        console.log('❌ Document has no storage path:', document.name);
        return;
      }

      const fileExtension = document.name.split('.').pop()?.toLowerCase();
      console.log('📄 File extension:', fileExtension);

      if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension || '')) {
        console.log('📄 Loading image URL for:', document.storage_path);
        const imageUrl = dataService.getStorageUrl(document.storage_path);
        console.log('📄 Image URL:', imageUrl ? 'Retrieved' : 'Failed');
        if (imageUrl) {
          doc.addPage();

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          const title = document.verdelerName ? `${document.verdelerName} - ${document.name}` : document.name;
          doc.text(title, margin, margin);

          console.log('📄 Converting image to data URL...');
          const imgData = await loadImageAsDataUrl(imageUrl);
          console.log('📄 Image data URL created, length:', imgData.length);
          const img = new Image();
          img.src = imgData;

          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              console.log('📄 Image loaded successfully, dimensions:', img.width, 'x', img.height);
              const imgWidth = img.width;
              const imgHeight = img.height;
              const maxWidth = pageWidth - 2 * margin;
              const maxHeight = pageHeight - 2 * margin - 10;

              let width = imgWidth;
              let height = imgHeight;

              if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
              }

              if (height > maxHeight) {
                width = (maxHeight / height) * width;
                height = maxHeight;
              }

              console.log('📄 Adding image to PDF at dimensions:', width, 'x', height);
              doc.addImage(imgData, 'PNG', margin, margin + 10, width, height);
              console.log('✅ Image added to PDF successfully');
              resolve();
            };
            img.onerror = (e) => {
              console.error('❌ Image failed to load:', e);
              reject(e);
            };
          });
        } else {
          console.log('❌ No image URL retrieved');
        }
      } else if (fileExtension === 'pdf') {
        console.log('📄 PDF document detected, loading for embedding...');

        try {
          const pdfUrl = dataService.getStorageUrl(document.storage_path);
          if (pdfUrl) {
            console.log('📄 Fetching PDF from:', pdfUrl);
            const response = await fetch(pdfUrl);
            const pdfBytes = await response.arrayBuffer();
            console.log('📄 PDF loaded, size:', pdfBytes.byteLength, 'bytes');

            // Add separator page before the PDF
            doc.addPage();
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 204);
            const title = document.verdelerName ? `${document.verdelerName}` : 'Document';
            doc.text(title, margin, margin);

            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(document.name, margin, margin + 8);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('Het volgende PDF document wordt hierna ingevoegd:', margin, margin + 16);

            // Store the PDF bytes for merging later
            pdfPages.push(new Uint8Array(pdfBytes));
            console.log('✅ PDF added to merge queue');
          } else {
            console.log('❌ Failed to get PDF URL');
          }
        } catch (error) {
          console.error('❌ Error loading PDF:', error);

          // Fallback to placeholder page if loading fails
          doc.addPage();
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(200, 0, 0);
          doc.text('Fout bij laden van PDF', margin, margin);

          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(document.name, margin, margin + 8);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, margin, margin + 16);
        }
      } else {
        doc.addPage();
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const title = document.verdelerName ? `${document.verdelerName} - ${document.name}` : `Document: ${document.name}`;
        doc.text(title, margin, margin);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Bestandstype: ${fileExtension?.toUpperCase() || 'Onbekend'}`, margin, margin + 10);
      }
    } catch (error) {
      console.error('Error adding document to PDF:', error);
    }
  };

  const generatePDF = async () => {
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Array to collect PDF documents for merging
      const pdfPages: Uint8Array[] = [];

      const logoImg = new Image();
      logoImg.src = ewp2Logo;

      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => reject(new Error('Failed to load logo'));
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
        const logoDataUrl = canvas.toDataURL('image/png');

        const logoAspectRatio = targetWidth / targetHeight;
        const logoWidth = 60;
        const logoHeight = logoWidth / logoAspectRatio;

        doc.addImage(logoDataUrl, 'PNG', margin, yPosition, logoWidth, logoHeight);
        yPosition = Math.max(yPosition + logoHeight + 10, yPosition + 20);
      }

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Project Documentatie', margin, yPosition);
      yPosition += 15;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 50, 50);

      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const creator = users.find((u: any) => u.id === project.created_by);

      const totalHours = project.distributors?.reduce((sum: number, d: any) => {
        const hours = parseFloat(d.expected_hours || d.expectedHours || 0);
        return sum + hours;
      }, 0) || 0;

      const uniqueFabrikanten = [...new Set(
        project.distributors
          ?.map((d: any) => d.fabrikant)
          .filter((f: string) => f && f.trim())
      )];
      const fabrikantValue = uniqueFabrikanten.length > 0 ? uniqueFabrikanten.join(', ') : '-';

      const fields = [
        { label: 'Aangemaakt door:', value: creator?.username || '-' },
        { label: 'Klant:', value: project.client || '-' },
        { label: 'Projectnummer:', value: project.project_number || '-' },
        { label: 'Referentie klant:', value: project.referentie_klant || '-' },
        { label: 'Fabrikant:', value: fabrikantValue },
        { label: 'Verwachte leverdatum:', value: project.expected_delivery_date
          ? new Date(project.expected_delivery_date).toLocaleDateString('nl-NL')
          : '-' },
        { label: 'Voorcalculatorische uren:', value: totalHours > 0 ? `${totalHours} uur` : '-' }
      ];

      for (const field of fields) {
        doc.setFont('helvetica', 'bold');
        doc.text(field.label, margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(field.value, margin + 60, yPosition);
        yPosition += 7;
      }

      const distributorFolders = ['Verdeler aanzicht', 'Installatie schema'];
      const projectFolders = ['Bestelling', 'Calculatie'];

      for (const folderName of distributorFolders) {
        const allDocs: any[] = [];

        console.log(`📄 Loading documents from distributor folder: ${folderName}`);
        console.log(`📄 Project has ${project.distributors?.length || 0} distributors`);

        if (project.distributors && project.distributors.length > 0) {
          for (const distributor of project.distributors) {
            toast.loading(`Laden van ${folderName} voor ${distributor.kast_naam || distributor.distributor_id}...`);

            try {
              console.log(`📄 Loading ${folderName} for distributor ${distributor.id} (${distributor.kast_naam})`);
              const docs = await dataService.getDocuments(project.id, distributor.id, folderName);
              console.log(`📄 Found ${docs?.length || 0} documents in ${folderName} for ${distributor.kast_naam}`);

              if (docs && docs.length > 0) {
                docs.forEach((doc: any) => {
                  doc.verdelerName = distributor.kast_naam || distributor.distributor_id;
                });
                allDocs.push(...docs);
              }

              try {
                const actueleFolder = `${folderName}/Actueel`;
                const actueleDocs = await dataService.getDocuments(project.id, distributor.id, actueleFolder);
                console.log(`📄 Found ${actueleDocs?.length || 0} documents in ${actueleFolder}`);
                if (actueleDocs && actueleDocs.length > 0) {
                  actueleDocs.forEach((doc: any) => {
                    doc.verdelerName = distributor.kast_naam || distributor.distributor_id;
                  });
                  allDocs.push(...actueleDocs);
                }
              } catch (error) {
                console.log(`📄 No Actueel subfolder for ${folderName}`);
              }
            } catch (error) {
              console.error(`Error loading ${folderName} for distributor ${distributor.id}:`, error);
            }
          }
        }

        console.log(`📄 Total documents collected for ${folderName}: ${allDocs.length}`);

        if (allDocs.length > 0) {
          doc.addPage();
          yPosition = margin;

          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 102, 204);
          doc.text(folderName, margin, yPosition);
          yPosition += 10;

          doc.setDrawColor(0, 102, 204);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 10;

          console.log(`📄 Adding ${allDocs.length} documents to PDF for ${folderName}`);
          for (const document of allDocs) {
            console.log(`📄 Processing document:`, document);
            await addDocumentToPDF(doc, document, pageWidth, pageHeight, pdfPages);
          }
        }

        toast.dismiss();
      }

      for (const folderName of projectFolders) {
        toast.loading(`Laden van documenten uit ${folderName}...`);

        try {
          console.log(`📄 Loading documents from project folder: ${folderName}`);
          const documents = await dataService.getDocuments(project.id, null, folderName);
          console.log(`📄 Found ${documents?.length || 0} documents in ${folderName}`);

          if (documents && documents.length > 0) {
            doc.addPage();
            yPosition = margin;

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 102, 204);
            doc.text(folderName, margin, yPosition);
            yPosition += 10;

            doc.setDrawColor(0, 102, 204);
            doc.setLineWidth(0.5);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;

            console.log(`📄 Adding ${documents.length} documents to PDF for ${folderName}`);
            for (const document of documents) {
              console.log(`📄 Processing document:`, document);
              await addDocumentToPDF(doc, document, pageWidth, pageHeight, pdfPages);
            }
          }
        } catch (error) {
          console.error(`Error loading documents from ${folderName}:`, error);
        }

        toast.dismiss();
      }

      const fileName = `Documentatie_${project.project_number}_${new Date().toISOString().split('T')[0]}.pdf`;

      // If we have PDFs to merge, use pdf-lib to combine them
      if (pdfPages.length > 0) {
        console.log(`🔄 Merging ${pdfPages.length} PDF documents...`);
        toast.loading('Samenvoegen van PDF documenten...');

        try {
          // Get the main PDF bytes from jsPDF
          const mainPdfBytes = doc.output('arraybuffer');

          // Create a new PDF document for merging
          const mergedPdf = await PDFDocument.create();

          // Load and copy all pages from the main PDF
          console.log('📄 Loading main PDF...');
          const mainPdf = await PDFDocument.load(mainPdfBytes);
          const mainPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
          mainPages.forEach(page => mergedPdf.addPage(page));
          console.log(`✅ Added ${mainPages.length} pages from main PDF`);

          // Load and copy all pages from each collected PDF
          for (let i = 0; i < pdfPages.length; i++) {
            console.log(`📄 Loading PDF ${i + 1}/${pdfPages.length}...`);
            try {
              const pdfDoc = await PDFDocument.load(pdfPages[i]);
              const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
              pages.forEach(page => mergedPdf.addPage(page));
              console.log(`✅ Added ${pages.length} pages from PDF ${i + 1}`);
            } catch (error) {
              console.error(`❌ Error loading PDF ${i + 1}:`, error);
            }
          }

          // Save the merged PDF
          console.log('💾 Saving merged PDF...');
          const mergedPdfBytes = await mergedPdf.save();
          const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.click();
          URL.revokeObjectURL(url);

          console.log('✅ Merged PDF saved successfully');
          toast.dismiss();
          toast.success('Documentatie PDF met ingesloten documenten gegenereerd!');
        } catch (error) {
          console.error('❌ Error merging PDFs:', error);
          toast.dismiss();
          toast.error('Er is een fout opgetreden bij het samenvoegen van PDFs. Eenvoudige versie wordt opgeslagen.');
          // Fallback to simple save
          doc.save(fileName);
        }
      } else {
        // No PDFs to merge, just save the jsPDF document
        doc.save(fileName);
        toast.success('Documentatie PDF gegenereerd!');
      }

      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Er is een fout opgetreden bij het genereren van de PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E2530] rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Project Documentatie</h2>
              <p className="text-sm text-gray-400">Genereer complete project documentatie PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-[#2A303C] rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-300 mb-3">
              Deze PDF bevat:
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Project informatie (klant, projectnummer, uren, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Documenten uit Verdeler aanzicht</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Documenten uit Installatie schema</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Documenten uit Bestelling</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>Documenten uit Calculatie</span>
              </li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={generating}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              onClick={generatePDF}
              disabled={generating}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {generating ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>Genereren...</span>
                </>
              ) : (
                <>
                  <FileText size={20} />
                  <span>Genereer PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDocumentationPDF;
