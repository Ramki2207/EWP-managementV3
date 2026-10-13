import React, { useState } from 'react';
import { Pencil, RotateCcw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { ScheduledBlock } from './planningTypes';

interface PlanningEditFormProps {
  block: ScheduledBlock;
  monteurs: string[];
  onSave: (block: ScheduledBlock, start: string, end: string, monteur: string) => Promise<void>;
  onReset?: (block: ScheduledBlock) => Promise<void>;
  onDone: () => void;
}

const inputClass =
  'w-full bg-[#2A303C] border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-colors';

const PlanningEditForm: React.FC<PlanningEditFormProps> = ({ block, monteurs, onSave, onReset, onDone }) => {
  const [startDate, setStartDate] = useState(block.startDate);
  const [endDate, setEndDate] = useState(block.endDate);
  const [monteur, setMonteur] = useState(block.monteur);
  const [saving, setSaving] = useState(false);

  const monteurOptions = monteurs.includes(block.monteur) ? monteurs : [block.monteur, ...monteurs];
  const changed = startDate !== block.startDate || endDate !== block.endDate || monteur !== block.monteur;
  const invalid = !startDate || !endDate || endDate < startDate;

  const handleSave = async () => {
    if (invalid || !changed) return;
    setSaving(true);
    try {
      await onSave(block, startDate, endDate, monteur);
      toast.success('Planning opgeslagen');
      onDone();
    } catch {
      toast.error('Kon planning niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!onReset) return;
    setSaving(true);
    try {
      await onReset(block);
      toast.success('Terug naar automatische planning');
      onDone();
    } catch {
      toast.error('Kon planning niet herstellen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
      <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Pencil size={12} />
        Planning aanpassen
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Startdatum</span>
          <input
            type="date"
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value);
              if (endDate && e.target.value > endDate) setEndDate(e.target.value);
            }}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Einddatum</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={e => setEndDate(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">Monteur</span>
          <select value={monteur} onChange={e => setMonteur(e.target.value)} className={`${inputClass} mt-1`}>
            {monteurOptions.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>
      {invalid && (
        <p className="text-[11px] text-red-400 mt-2">De einddatum moet op of na de startdatum liggen.</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        {block.isManual && onReset ? (
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 border border-gray-600/60 hover:bg-gray-700/40 transition-colors disabled:opacity-50"
          >
            <RotateCcw size={12} />
            Terug naar automatisch
          </button>
        ) : (
          <span className="text-[10px] text-gray-500">Automatisch ingepland</span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || invalid || !changed}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save size={12} />
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </div>
  );
};

export default PlanningEditForm;
