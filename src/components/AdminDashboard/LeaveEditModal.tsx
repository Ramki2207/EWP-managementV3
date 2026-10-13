import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, Save, Trash2, CalendarOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { LeaveEntry, LeaveUpdate } from './planningTypes';

interface LeaveEditModalProps {
  monteur: string;
  date: string;
  entries: LeaveEntry[];
  leaveTypeLabels: Record<string, string>;
  onSave: (entry: LeaveEntry, update: LeaveUpdate) => Promise<void>;
  onDelete: (entry: LeaveEntry) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  'w-full bg-[#2A303C] border border-gray-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors';

const SOURCE_LABELS: Record<LeaveEntry['source'], string> = {
  leave_requests: 'Verlofaanvraag',
  vacation_requests: 'Vakantieaanvraag',
  employee_absences: 'Verlof registratie',
};

const LeaveEntryForm: React.FC<{
  entry: LeaveEntry;
  leaveTypeLabels: Record<string, string>;
  onSave: LeaveEditModalProps['onSave'];
  onDelete: LeaveEditModalProps['onDelete'];
  onDone: () => void;
}> = ({ entry, leaveTypeLabels, onSave, onDelete, onDone }) => {
  const [startDate, setStartDate] = useState(entry.start_date);
  const [endDate, setEndDate] = useState(entry.end_date || '');
  const [description, setDescription] = useState(entry.description || '');
  const [leaveType, setLeaveType] = useState(entry.leave_type || '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isAbsence = entry.source === 'employee_absences';
  const openEnded = isAbsence && !endDate;
  const invalid = !startDate || (!openEnded && endDate < startDate) || (!isAbsence && !endDate);
  const changed =
    startDate !== entry.start_date ||
    endDate !== (entry.end_date || '') ||
    description !== (entry.description || '') ||
    leaveType !== (entry.leave_type || '');

  const handleSave = async () => {
    if (invalid || !changed) return;
    setSaving(true);
    try {
      await onSave(entry, {
        start_date: startDate,
        end_date: endDate || null,
        description: description.trim(),
        leave_type: entry.source === 'leave_requests' ? leaveType : null,
      });
      toast.success('Verlof aangepast');
      onDone();
    } catch {
      toast.error('Kon verlof niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await onDelete(entry);
      toast.success(isAbsence ? 'Afwezigheid beëindigd' : 'Verlof verwijderd');
      onDone();
    } catch {
      toast.error('Kon verlof niet verwijderen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <Pencil size={12} />
          {entry.label}
        </h3>
        <span className="text-[10px] text-gray-500">{SOURCE_LABELS[entry.source]}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entry.source === 'leave_requests' && (
          <label className="block sm:col-span-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Soort verlof</span>
            <select value={leaveType} onChange={e => setLeaveType(e.target.value)} className={`${inputClass} mt-1`}>
              {leaveType && !leaveTypeLabels[leaveType] && <option value={leaveType}>{leaveType}</option>}
              {Object.entries(leaveTypeLabels)
                .filter(([key]) => key !== 'vakantie')
                .map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
            </select>
          </label>
        )}
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
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            Einddatum{isAbsence ? ' (leeg = onbepaald)' : ''}
          </span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={e => setEndDate(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            {isAbsence ? 'Notitie' : 'Omschrijving'}
          </span>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optioneel"
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>

      {invalid && (
        <p className="text-[11px] text-red-400 mt-2">Vul een geldige periode in: de einddatum moet op of na de startdatum liggen.</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-red-300">Weet je het zeker?</span>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              Ja, {isAbsence ? 'beëindigen' : 'verwijderen'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 border border-gray-600/60 hover:bg-gray-700/40 transition-colors"
            >
              Annuleren
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-300 border border-red-500/30 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 size={12} />
            {isAbsence ? 'Afwezigheid beëindigen' : 'Verlof verwijderen'}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || invalid || !changed}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save size={12} />
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </div>
  );
};

const LeaveEditModal: React.FC<LeaveEditModalProps> = ({ monteur, date, entries, leaveTypeLabels, onSave, onDelete, onClose }) =>
  createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#1A1F2C] border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-amber-500/15 rounded-lg">
              <CalendarOff size={18} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white truncate">Verlof aanpassen</h2>
              <p className="text-xs text-gray-400">
                {monteur} - {format(parseISO(date), 'EEEE d MMMM yyyy', { locale: nl })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {entries.length === 0 ? (
            <p className="text-sm text-gray-400">Er is geen verlof gevonden voor deze dag.</p>
          ) : (
            entries.map(entry => (
              <LeaveEntryForm
                key={`${entry.source}:${entry.id}`}
                entry={entry}
                leaveTypeLabels={leaveTypeLabels}
                onSave={onSave}
                onDelete={onDelete}
                onDone={onClose}
              />
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );

export default LeaveEditModal;
