import React, { useState, useEffect } from 'react';
import { X, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';

interface VerdelerLeveringSelectorProps {
  project: any;
  onConfirm: () => void;
  onCancel: () => void;
}

const VerdelerLeveringSelector: React.FC<VerdelerLeveringSelectorProps> = ({
  project,
  onConfirm,
  onCancel
}) => {
  const [verdelers, setVerdelers] = useState<any[]>([]);
  const [selectedVerdelers, setSelectedVerdelers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerdelers();
  }, [project.id]);

  const loadVerdelers = async () => {
    try {
      setLoading(true);
      const verdelersData = await dataService.getDistributorsByProject(project.id);

      // Filter verdelers that are NOT already in "Levering" status
      const availableVerdelers = (verdelersData || []).filter(
        (v: any) => v.status !== 'Levering'
      );

      setVerdelers(availableVerdelers);
    } catch (error) {
      console.error('Error loading verdelers:', error);
      toast.error('Fout bij laden van verdelers');
    } finally {
      setLoading(false);
    }
  };

  const toggleVerdeler = (verdelerId: string) => {
    setSelectedVerdelers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(verdelerId)) {
        newSet.delete(verdelerId);
      } else {
        newSet.add(verdelerId);
      }
      return newSet;
    });
  };

  const handleConfirm = async () => {
    if (selectedVerdelers.size === 0) {
      toast.error('Selecteer minimaal 1 verdeler');
      return;
    }

    try {
      // Update only the selected verdelers to "Levering" status
      for (const verdelerId of selectedVerdelers) {
        await dataService.updateDistributor(verdelerId, {
          status: 'Levering'
        });
      }

      toast.success(`${selectedVerdelers.size} verdeler(s) klaargezet voor levering`);
      onConfirm();
    } catch (error) {
      console.error('Error updating verdelers:', error);
      toast.error('Fout bij opslaan');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1E2530] rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Verdelers laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (verdelers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1E2530] rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="text-yellow-400 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-semibold mb-2">Geen verdelers beschikbaar</h3>
            <p className="text-gray-400 mb-6">
              Alle verdelers zijn al klaargezet voor levering
            </p>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E2530] rounded-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Truck className="text-blue-400" size={24} />
              <div>
                <h2 className="text-xl font-semibold">Verdelers Klaarzetten voor Levering</h2>
                <p className="text-sm text-gray-400">Project: {project.project_number}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-400 mb-4">
            Selecteer welke verdelers klaar zijn voor levering. De logistiek afdeling zal de checklists invullen.
          </p>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {verdelers.map((verdeler) => (
              <div
                key={verdeler.id}
                onClick={() => toggleVerdeler(verdeler.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedVerdelers.has(verdeler.id)
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-[#2A303C] border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-lg">{verdeler.distributor_id}</div>
                    {verdeler.kast_naam && (
                      <div className="text-sm text-gray-400">{verdeler.kast_naam}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Status: {verdeler.status}
                    </div>
                  </div>
                  {selectedVerdelers.has(verdeler.id) && (
                    <CheckCircle className="text-blue-400" size={24} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {selectedVerdelers.size} van {verdelers.length} geselecteerd
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedVerdelers.size === 0}
              className={`px-6 py-2 rounded-lg transition-colors ${
                selectedVerdelers.size > 0
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              Bevestigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerdelerLeveringSelector;
