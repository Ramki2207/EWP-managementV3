import React, { useState } from 'react';
import { X, Check, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { WEEKDAYS } from './planningTypes';

interface WerkdagenModalProps {
  monteur: string;
  workDays: number[];
  onSave: (workDays: number[]) => Promise<void>;
  onClose: () => void;
}

const WerkdagenModal: React.FC<WerkdagenModalProps> = ({ monteur, workDays, onSave, onClose }) => {
  const [selected, setSelected] = useState<number[]>(workDays);
  const [saving, setSaving] = useState(false);

  const toggle = (iso: number) =>
    setSelected(prev => (prev.includes(iso) ? prev.filter(d => d !== iso) : [...prev, iso].sort()));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      toast.success(`Werkdagen van ${monteur} opgeslagen`);
      onClose();
    } catch (err) {
      console.error('Error saving work days:', err);
      toast.error('Kon de werkdagen niet opslaan');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1F2C] border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/15 rounded-lg">
              <CalendarDays size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Werkdagen</h2>
              <p className="text-sm text-gray-400 mt-0.5">{monteur}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">Op welke dagen werkt deze medewerker? Op de andere dagen wordt er niets ingepland.</p>
          <div className="grid grid-cols-5 gap-2">
            {WEEKDAYS.map(day => {
              const active = selected.includes(day.iso);
              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => toggle(day.iso)}
                  title={day.long}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                    active
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                      : 'bg-gray-800/30 border-gray-700/40 text-gray-500 hover:border-gray-600/60'
                  }`}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">
            {selected.length === 0
              ? 'Geen werkdagen gekozen.'
              : `${selected.length} ${selected.length === 1 ? 'dag' : 'dagen'} per week: ${WEEKDAYS.filter(d => selected.includes(d.iso)).map(d => d.long.toLowerCase()).join(', ')}`}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700/40">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/40 transition-all">
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50"
          >
            <Check size={16} />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WerkdagenModal;
