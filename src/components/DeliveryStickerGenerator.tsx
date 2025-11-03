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
      canvas.width = 1000;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const borderWidth = 4;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, borderWidth);
      ctx.fillRect(0, 0, borderWidth, canvas.height);
      ctx.fillRect(canvas.width - borderWidth, 0, borderWidth, canvas.height);
      ctx.fillRect(0, canvas.height - borderWidth, canvas.width, borderWidth);

      const logo = new Image();
      logo.src = '/EWP-logo-zwart.png';

      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve();
        logo.onerror = () => reject(new Error('Failed to load logo'));
      });

      const maxLogoWidth = 600;
      const maxLogoHeight = 200;
      const logoAspectRatio = logo.width / logo.height;

      let logoWidth = maxLogoWidth;
      let logoHeight = maxLogoWidth / logoAspectRatio;

      if (logoHeight > maxLogoHeight) {
        logoHeight = maxLogoHeight;
        logoWidth = maxLogoHeight * logoAspectRatio;
      }

      const logoX = (canvas.width - logoWidth) / 2;
      const logoY = 50;
      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);

      const headerY = logoY + logoHeight + 40;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(60, headerY, canvas.width - 120, 4);

      let yPosition = headerY + 70;
      const leftMargin = 60;
      const lineHeight = 110;

      const fields = [
        { label: 'KLANTNAAM', value: project.client || '-' },
        { label: 'PROJECTNUMMER', value: project.project_number || '-' },
        { label: 'KASTNAAM', value: verdeler.kast_naam || '-' },
        { label: 'REFERENTIE EWP', value: project.referentie_ewp || '-' },
        { label: 'REFERENTIE KLANT', value: project.referentie_klant || '-' },
        { label: 'AFLEVERADRES', value: project.aflever_adres || '-' }
      ];

      fields.forEach((field, index) => {
        ctx.font = '600 24px Arial, sans-serif';
        ctx.fillStyle = '#555555';
        ctx.textAlign = 'left';
        ctx.fillText(field.label, leftMargin, yPosition);

        const maxWidth = canvas.width - leftMargin - 60;
        const lines = wrapText(ctx, field.value, maxWidth, '700 40px Arial, sans-serif');

        ctx.font = '700 40px Arial, sans-serif';
        ctx.fillStyle = '#1a1a1a';

        lines.forEach((line, lineIndex) => {
          const yPos = yPosition + 45 + (lineIndex * 48);
          ctx.fillText(line, leftMargin, yPos);
        });

        yPosition += lineHeight + (lines.length > 1 ? (lines.length - 1) * 48 : 0);
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

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font?: string): string[] => {
    if (font) {
      ctx.font = font;
    }

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
