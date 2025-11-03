import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeliveryStickerGeneratorProps {
  project: any;
  onClose: () => void;
}

const DeliveryStickerGenerator: React.FC<DeliveryStickerGeneratorProps> = ({ project, onClose }) => {
  const [selectedVerdeler, setSelectedVerdeler] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  const verdelers = project?.distributors || [];

  const generateSticker = async (verdeler: any) => {
    try {
      setGenerating(true);

      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1E40AF';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      const logo = new Image();
      logo.src = '/EWP-logo-zwart.png';

      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve();
        logo.onerror = () => reject(new Error('Failed to load logo'));
      });

      ctx.drawImage(logo, 50, 30, 200, 80);

      let yPosition = 150;
      const leftMargin = 50;
      const lineHeight = 60;

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('LEVERING', canvas.width / 2, yPosition);
      ctx.textAlign = 'center';
      yPosition += lineHeight;

      ctx.textAlign = 'left';

      const fields = [
        { label: 'Projectnummer:', value: project.project_number || '-' },
        { label: 'Kastnaam:', value: verdeler.kast_naam || '-' },
        { label: 'Ref. EWP:', value: project.referentie_ewp || '-' },
        { label: 'Ref. Klant:', value: project.referentie_klant || '-' },
        { label: 'Afleveradres:', value: project.aflever_adres || '-' }
      ];

      fields.forEach(field => {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#1E40AF';
        ctx.fillText(field.label, leftMargin, yPosition);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#000000';
        const labelWidth = ctx.measureText(field.label).width;

        const maxWidth = canvas.width - leftMargin - 100;
        const lines = wrapText(ctx, field.value, maxWidth);

        lines.forEach((line, index) => {
          const xPos = index === 0 ? leftMargin + labelWidth + 10 : leftMargin;
          const yPos = yPosition + (index * 30);
          ctx.fillText(line, xPos, yPos);
        });

        yPosition += lineHeight + (lines.length > 1 ? (lines.length - 1) * 30 : 0);
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Levering_Sticker_${project.project_number}_${verdeler.kast_naam || 'verdeler'}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Levering sticker gedownload!');
    } catch (error) {
      console.error('Error generating sticker:', error);
      toast.error('Fout bij het genereren van de sticker');
    } finally {
      setGenerating(false);
    }
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-400">🏷️ Levering Sticker</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-400 text-sm">
            Selecteer een verdeler om een levering sticker te downloaden.
          </p>
        </div>

        {verdelers.length === 0 ? (
          <div className="text-center py-12">
            <Download size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">Geen verdelers gevonden voor dit project</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verdelers.map((verdeler: any) => (
              <div
                key={verdeler.id}
                className="bg-[#2A303C] rounded-lg p-4 flex items-center justify-between hover:bg-[#323944] transition-colors"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {verdeler.kast_naam || 'Naamloze Verdeler'}
                  </h3>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Verdeler ID: {verdeler.distributor_id || '-'}</p>
                    <p>Systeem: {verdeler.systeem || '-'}</p>
                  </div>
                </div>
                <button
                  onClick={() => generateSticker(verdeler)}
                  className="btn-primary flex items-center space-x-2"
                  disabled={generating}
                >
                  <Download size={18} />
                  <span>{generating ? 'Genereren...' : 'Download Sticker'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryStickerGenerator;
