import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

interface ProjectHoursPopupProps {
  projectNumber: string;
  onSubmit: (hours: { teken: number; offerte: number; administratie: number }) => void;
  onCancel: () => void;
}

export default function ProjectHoursPopup({ projectNumber, onSubmit, onCancel }: ProjectHoursPopupProps) {
  const [tekenUren, setTekenUren] = useState<number>(0);
  const [offerteUren, setOfferteUren] = useState<number>(0);
  const [administratieUren, setAdministratieUren] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      teken: tekenUren,
      offerte: offerteUren,
      administratie: administratieUren
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-green-500/20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Clock className="text-green-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Uren toevoegen aan weekstaat</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-700/50 rounded-lg border border-green-500/20">
          <p className="text-sm text-gray-400 mb-1">Project</p>
          <p className="text-lg font-semibold text-green-400">{projectNumber}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Teken uren</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="input-field"
              value={tekenUren}
              onChange={(e) => setTekenUren(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Offerte uren</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="input-field"
              value={offerteUren}
              onChange={(e) => setOfferteUren(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Administratie uren</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="input-field"
              value={administratieUren}
              onChange={(e) => setAdministratieUren(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Overslaan
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Opslaan
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Deze uren worden automatisch toegevoegd aan je weekstaat voor de huidige week
        </p>
      </div>
    </div>
  );
}
