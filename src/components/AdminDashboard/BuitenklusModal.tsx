import React, { useEffect, useMemo, useState } from 'react';
import { X, Truck, Check, Trash2, AlertCircle, MapPin, User, Calendar, ClipboardList } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import { dataService } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Buitenklus, BuitenklusInput } from './planningTypes';

interface PlanningUser {
  id: string;
  username: string;
  role: string;
}

interface BuitenklusModalProps {
  buitenklus: Buitenklus | null;
  users: PlanningUser[];
  leaveDates: Record<string, Set<string>>;
  onSave: (input: BuitenklusInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const ROLE_GROUPS: { role: string; label: string }[] = [
  { role: 'montage', label: 'Monteurs' },
  { role: 'tester', label: 'Testers' },
  { role: 'logistiek', label: 'Logistiek' },
];

const TRANSPORT_OPTIONS = ['Bedrijfsbus', 'Eigen vervoer', 'Samen met collega', 'Openbaar vervoer'];

const inputClass =
  'w-full bg-[#161b24] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50';

const today = format(new Date(), 'yyyy-MM-dd');

const emptyForm = (): BuitenklusInput => ({
  client: '', project_number: '', location: '', contact_person: '', contact_phone: '',
  monteurs: [], start_date: today, end_date: today, start_time: '07:30', transport: 'Bedrijfsbus',
  description: '', materials: '', notes: '',
});

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <div>
    <label className="text-xs text-gray-400 mb-1 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div>
    <p className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      {icon}
      {title}
    </p>
    {children}
  </div>
);

const BuitenklusModal: React.FC<BuitenklusModalProps> = ({ buitenklus, users, leaveDates, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState<BuitenklusInput>(() => {
    if (!buitenklus) return emptyForm();
    const { id: _id, created_by: _createdBy, ...rest } = buitenklus;
    return rest;
  });
  const [clientNames, setClientNames] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    dataService.getClients()
      .then((clients: any[]) => setClientNames((clients || []).map(c => c.name).filter(Boolean).sort()))
      .catch(err => console.error('Error loading clients:', err));
  }, []);

  const set = <K extends keyof BuitenklusInput>(key: K, value: BuitenklusInput[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleMonteur = (name: string) =>
    set('monteurs', form.monteurs.includes(name) ? form.monteurs.filter(m => m !== name) : [...form.monteurs, name]);

  const leaveConflicts = useMemo(() => {
    if (!form.start_date || !form.end_date || form.end_date < form.start_date) return [];
    return form.monteurs.filter(name => {
      const dates = leaveDates[name];
      if (!dates) return false;
      for (let d = parseISO(form.start_date); format(d, 'yyyy-MM-dd') <= form.end_date; d = addDays(d, 1)) {
        if (dates.has(format(d, 'yyyy-MM-dd'))) return true;
      }
      return false;
    });
  }, [form.monteurs, form.start_date, form.end_date, leaveDates]);

  const datesValid = !!form.start_date && !!form.end_date && form.end_date >= form.start_date;
  const canSave = form.client.trim() && form.monteurs.length > 0 && datesValid;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({ ...form, client: form.client.trim() });
      toast.success(buitenklus ? 'Buitenklus bijgewerkt' : 'Buitenklus ingepland');
      onClose();
    } catch (err) {
      console.error('Error saving buitenklus:', err);
      toast.error('Kon de buitenklus niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setSaving(true);
    try {
      await onDelete();
      toast.success('Buitenklus verwijderd');
      onClose();
    } catch (err) {
      console.error('Error deleting buitenklus:', err);
      toast.error('Kon de buitenklus niet verwijderen');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A1F2C] border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/15 rounded-lg">
              <Truck size={18} className="text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{buitenklus ? 'Buitenklus bewerken' : 'Buitenklus inplannen'}</h2>
              <p className="text-sm text-gray-400 mt-0.5">Werk op locatie bij de klant, buiten de werkplaats</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <Section icon={<MapPin size={13} />} title="Klant & locatie">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Klant" required>
                <input list="buitenklus-clients" value={form.client} onChange={e => set('client', e.target.value)} placeholder="Zoek of typ een klant" className={inputClass} />
                <datalist id="buitenklus-clients">
                  {clientNames.map(name => <option key={name} value={name} />)}
                </datalist>
              </Field>
              <Field label="Projectnummer">
                <input value={form.project_number} onChange={e => set('project_number', e.target.value)} placeholder="Optioneel" className={inputClass} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Werklocatie / adres">
                  <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Straat, plaats" className={inputClass} />
                </Field>
              </div>
              <Field label="Contactpersoon op locatie">
                <input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Telefoonnummer contactpersoon">
                <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} className={inputClass} />
              </Field>
            </div>
          </Section>

          <Section icon={<Calendar size={13} />} title="Planning">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Begindatum" required>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value, end_date: prev.end_date < e.target.value ? e.target.value : prev.end_date }))}
                  className={inputClass}
                />
              </Field>
              <Field label="Einddatum" required>
                <input type="date" value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Aanvangstijd">
                <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Vervoer">
                <select value={form.transport} onChange={e => set('transport', e.target.value)} className={inputClass}>
                  <option value="">-</option>
                  {TRANSPORT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            {!datesValid && form.end_date && (
              <p className="text-xs text-red-400 mt-2">De einddatum moet op of na de begindatum liggen.</p>
            )}
          </Section>

          <Section icon={<User size={13} />} title="Monteurs">
            <div className="space-y-3">
              {ROLE_GROUPS.map(group => {
                const members = users.filter(u => u.role === group.role).sort((a, b) => a.username.localeCompare(b.username));
                if (members.length === 0) return null;
                return (
                  <div key={group.role}>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {members.map(u => {
                        const selected = form.monteurs.includes(u.username);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleMonteur(u.username)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              selected
                                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                                : 'bg-gray-800/30 border-gray-700/40 text-gray-400 hover:border-gray-600/60 hover:text-gray-200'
                            }`}
                          >
                            {selected && <Check size={12} />}
                            {u.username}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {form.monteurs.length === 0 && (
                <p className="text-xs text-gray-500">Kies minimaal één monteur.</p>
              )}
              {leaveConflicts.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-300">
                    {leaveConflicts.join(', ')} {leaveConflicts.length === 1 ? 'heeft' : 'hebben'} verlof of is afwezig in deze periode.
                  </p>
                </div>
              )}
            </div>
          </Section>

          <Section icon={<ClipboardList size={13} />} title="Werkzaamheden">
            <div className="space-y-3">
              <Field label="Omschrijving werkzaamheden">
                <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Wat moet er op locatie gebeuren?" className={`${inputClass} resize-none`} />
              </Field>
              <Field label="Benodigde materialen / gereedschap">
                <textarea rows={2} value={form.materials} onChange={e => set('materials', e.target.value)} className={`${inputClass} resize-none`} />
              </Field>
              <Field label="Opmerkingen">
                <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Bijv. toegangscode, parkeren, veiligheidsinstructies" className={`${inputClass} resize-none`} />
              </Field>
            </div>
          </Section>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-700/40">
          {onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-300">Zeker weten?</span>
                <button onClick={handleDelete} disabled={saving} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all">
                  Verwijderen
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/40 transition-all">
                  Nee
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-all">
                <Trash2 size={14} />
                Verwijderen
              </button>
            )
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-700/40 transition-all">
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              canSave && !saving ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Check size={16} />
            {saving ? 'Opslaan...' : buitenklus ? 'Opslaan' : 'Inplannen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuitenklusModal;
