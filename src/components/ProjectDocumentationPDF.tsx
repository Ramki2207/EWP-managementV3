import React, { useState } from 'react';
import jsPDF from 'jspdf';
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

  const addDocumentToPDF = async (doc: jsPDF, document: any, pageWidth: number, pageHeight: number) => {
    try {
      const margin = 15;

      if (!document.storage_path) {
        console.log('Document has no storage path:', document.name);
        return;
      }

      const fileExtension = document.name.split('.').pop()?.toLowerCase();

      if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension || '')) {
        const imageUrl = await dataService.getFileUrl(document.storage_path);
        if (imageUrl) {
          doc.addPage();

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          const title = document.verdelerName ? `${document.verdelerName} - ${document.name}` : document.name;
          doc.text(title, margin, margin);

          const imgData = await loadImageAsDataUrl(imageUrl);
          const img = new Image();
          img.src = imgData;

          await new Promise<void>((resolve) => {
            img.onload = () => {
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

              doc.addImage(imgData, 'PNG', margin, margin + 10, width, height);
              resolve();
            };
          });
        }
      } else if (fileExtension === 'pdf') {
        doc.addPage();
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const title = document.verdelerName ? `${document.verdelerName} - PDF Document: ${document.name}` : `PDF Document: ${document.name}`;
        doc.text(title, margin, margin);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('(PDF documents worden niet getoond in deze preview)', margin, margin + 10);
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

          for (const document of allDocs) {
            await addDocumentToPDF(doc, document, pageWidth, pageHeight);
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

            for (const document of documents) {
              await addDocumentToPDF(doc, document, pageWidth, pageHeight);
            }
          }
        } catch (error) {
          console.error(`Error loading documents from ${folderName}:`, error);
        }

        toast.dismiss();
      }

      const fileName = `Documentatie_${project.project_number}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success('Documentatie PDF gegenereerd!');
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
