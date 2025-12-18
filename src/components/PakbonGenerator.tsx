import React, { useState } from 'react';
import { Download, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { generatePakbonPDF } from './PakbonPDF';

interface PakbonGeneratorProps {
  project: any;
  onClose: () => void;
}

const PakbonGenerator: React.FC<PakbonGeneratorProps> = ({ project, onClose }) => {
  const [selectedVerdelers, setSelectedVerdelers] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);

  const verdelers = project?.distributors || [];

  const toggleVerdelerSelection = (verdelerId: string) => {
    const newSelection = new Set(selectedVerdelers);
    if (newSelection.has(verdelerId)) {
      newSelection.delete(verdelerId);
    } else {
      newSelection.add(verdelerId);
    }
    setSelectedVerdelers(newSelection);
  };

  const selectAll = () => {
    if (selectedVerdelers.size === verdelers.length) {
      setSelectedVerdelers(new Set());
    } else {
      setSelectedVerdelers(new Set(verdelers.map((v: any) => v.id)));
    }
  };

  const handleGeneratePakbonnen = async () => {
    if (selectedVerdelers.size === 0) {
      toast.error('Selecteer minimaal één verdeler');
      return;
    }

    setGenerating(true);

    try {
      const selectedVerdelersList = verdelers.filter((v: any) => selectedVerdelers.has(v.id));

      for (const verdeler of selectedVerdelersList) {
        try {
          const pdfBlob = await generatePakbonPDF(project, verdeler, null);

          const url = URL.createObjectURL(pdfBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Pakbon_${project.project_number}_${verdeler.kast_naam || verdeler.distributor_id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error generating pakbon for verdeler ${verdeler.distributor_id}:`, error);
          toast.error(`Fout bij genereren pakbon voor ${verdeler.kast_naam || verdeler.distributor_id}`);
        }
      }

      toast.success(`${selectedVerdelers.size} pakbon(nen) gegenereerd!`);
      onClose();
    } catch (error) {
      console.error('Error generating pakbonnen:', error);
      toast.error('Fout bij genereren van pakbonnen');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-semibold text-blue-400">📄 Pakbon Genereren</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={generating}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-gray-300 mb-4">
            Selecteer één of meerdere verdelers om pakbonnen te genereren.
          </p>

          {verdelers.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Geen verdelers beschikbaar voor dit project</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={selectAll}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  disabled={generating}
                >
                  {selectedVerdelers.size === verdelers.length ? 'Deselecteer alles' : 'Selecteer alles'}
                </button>
                <span className="text-sm text-gray-400">
                  {selectedVerdelers.size} van {verdelers.length} geselecteerd
                </span>
              </div>

              <div className="space-y-2 mb-6">
                {verdelers.map((verdeler: any) => (
                  <label
                    key={verdeler.id}
                    className={`flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedVerdelers.has(verdeler.id)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVerdelers.has(verdeler.id)}
                      onChange={() => toggleVerdelerSelection(verdeler.id)}
                      disabled={generating}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-white font-medium">
                        {verdeler.kast_naam || 'Naamloos'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {verdeler.distributor_id}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={generating}
          >
            Annuleren
          </button>
          <button
            onClick={handleGeneratePakbonnen}
            disabled={selectedVerdelers.size === 0 || generating}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} />
            <span>{generating ? 'Genereren...' : `Genereer ${selectedVerdelers.size > 0 ? `(${selectedVerdelers.size})` : ''}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PakbonGenerator;
