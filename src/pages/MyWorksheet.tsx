import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, FileText, Send, Calendar, XCircle } from 'lucide-react';

const WEEK_29_YEAR = 2025;
const WEEK_29_NUMBER = 29;

const notationToMinutes = (val: any): number => {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  if (num === 0) return 0;
  const hours = Math.floor(num);
  const minutePart = Math.round((num - hours) * 100);
  return hours * 60 + minutePart;
};

const minutesToNotation = (totalMinutes: number): number => {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return hours + (mins / 100);
};

const isWeek29OrLater = (weekNumber: number, year: number): boolean => {
  if (year > WEEK_29_YEAR) return true;
  if (year === WEEK_29_YEAR && weekNumber >= WEEK_29_NUMBER) return true;
  return false;
};

const TimeInput = ({ value, onChange, disabled }: { value: number; onChange: (val: string) => void; disabled: boolean }) => {
  const numVal = typeof value === 'number' ? value : parseFloat(value as any) || 0;
  const hours = Math.floor(numVal);
  const minutePart = Math.round((numVal - hours) * 100);
  const minutes = minutePart === 15 || minutePart === 30 || minutePart === 45 ? minutePart : 0;

  const handleHoursChange = (newHours: number) => {
    const combined = newHours + (minutes / 100);
    onChange(combined.toFixed(2));
  };

  const handleMinutesChange = (newMinutes: number) => {
    const combined = hours + (newMinutes / 100);
    onChange(combined.toFixed(2));
  };

  return (
    <div className="flex items-center space-x-0.5">
      <input
        type="number"
        min="0"
        max="24"
        step="1"
        value={hours}
        onChange={(e) => handleHoursChange(parseInt(e.target.value) || 0)}
        disabled={disabled}
        className="input-field text-xs p-1 w-10 text-center"
      />
      <span className="text-gray-400 text-xs">:</span>
      <select
        value={minutes}
        onChange={(e) => handleMinutesChange(parseInt(e.target.value))}
        disabled={disabled}
        className="input-field text-xs p-1 w-12"
      >
        <option value={0}>00</option>
        <option value={15}>15</option>
        <option value={30}>30</option>
        <option value={45}>45</option>
      </select>
    </div>
  );
};

const ACTIVITY_CODES = [
  { code: '01', description: 'Arbeid Intern < 630A', section: 'Gewerkte uren montage' },
  { code: '02', description: 'Arbeid int. > 630A < 1000A', section: 'Gewerkte uren montage' },
  { code: '04', description: 'Arbeid int. > 1000A', section: 'Gewerkte uren montage' },
  { code: '05', description: 'Leerling Stagiair', section: 'Gewerkte uren montage' },
  { code: '06', description: 'Arbeid ZZP / inleners', section: 'Gewerkte uren montage' },
  { code: '07', description: 'Arbeid Extern laag', section: 'Montage buiten' },
  { code: '08', description: 'Arbeid Extern Hoog', section: 'Montage buiten' },
  { code: '09', description: 'Intern Transport', section: 'Gewerkte uren montage' },
  { code: '10', description: 'Uurtarief intercompany', section: 'Gewerkte uren montage' },
  { code: '11', description: 'Algemene werkzaamheden', section: 'Gewerkte uren montage' },
  { code: '12', description: 'Opruim werkzaamheden', section: 'Gewerkte uren montage' },
  { code: '13', description: 'Kantoor', section: 'Administratie' },
  { code: '14', description: 'Intern transport Projecten', section: 'Administratie' },
  { code: '15', description: 'Arbeid Werk Leren BBL', section: 'Gewerkte uren montage' },
  { code: '21', description: 'Verlof (onbetaald)', section: 'Verlof' },
  { code: '22', description: 'Verlof (betaald)', section: 'Verlof' },
  { code: '25', description: 'Nationale Feestdagen', section: 'Verlof' },
  { code: '30', description: 'Dokter/tandarts/ziekenhuis', section: 'Verlof' },
  { code: '35', description: 'Ziek', section: 'Verlof' },
  { code: '50', description: 'Arbeid extern laag / ZZP inlener', section: 'Gewerkte uren montage' },
  { code: '60', description: 'Test werkzaamheden', section: 'Gewerkte uren montage' },
  { code: '70', description: 'Tekenwerkzaamheden', section: 'Gewerkte uren montage' },
];

interface WeekstaatEntry {
  id?: string;
  tempId?: string;
  activity_code: string;
  activity_description: string;
  project_number: string;
  workorder_number: string;
  overtime_start_time: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

interface Weekstaat {
  id?: string;
  week_number: number;
  year: number;
  status: string;
}

export default function MyWorksheet() {
  const [loading, setLoading] = useState(false);
  const [weekstaten, setWeekstaten] = useState<any[]>([]);
  const [selectedWeekstaat, setSelectedWeekstaat] = useState<Weekstaat | null>(null);
  const [entries, setEntries] = useState<WeekstaatEntry[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadWeekstaten();
  }, []);

  const loadUser = async () => {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) return;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUserId)
      .maybeSingle();

    setUser(userData);
  };

  const loadWeekstaten = async () => {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('weekstaten')
      .select('*')
      .eq('user_id', currentUserId)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false });

    if (error) {
      toast.error('Fout bij het laden van weekstaten');
      return;
    }

    setWeekstaten(data || []);
  };

  const loadWeekstaatDetails = async (weekstaatId: string) => {
    const { data: weekstaat } = await supabase
      .from('weekstaten')
      .select('*')
      .eq('id', weekstaatId)
      .maybeSingle();

    const { data: weekstaatEntries } = await supabase
      .from('weekstaat_entries')
      .select('*')
      .eq('weekstaat_id', weekstaatId)
      .order('created_at');

    setSelectedWeekstaat(weekstaat);

    // Ensure all entries have activity descriptions
    const enrichedEntries = (weekstaatEntries || []).map(entry => {
      const activityCode = ACTIVITY_CODES.find(ac => ac.code === entry.activity_code);
      return {
        ...entry,
        activity_description: activityCode?.description || entry.activity_description || ''
      };
    });

    setEntries(enrichedEntries);
  };

  const createNewWeekstaat = () => {
    const today = new Date();
    const weekNumber = getWeekNumber(today);

    setSelectedWeekstaat({
      week_number: weekNumber,
      year: today.getFullYear(),
      status: 'draft'
    });
    setEntries([]);
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getWeekDates = (weekNumber: number, year: number) => {
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - (dayOfWeek - 1) + (weekNumber - 1) * 7);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const addEntry = () => {
    const newEntry: WeekstaatEntry = {
      tempId: `temp_${Date.now()}_${Math.random()}`,
      activity_code: '01',
      activity_description: 'Arbeid Intern < 630A',
      project_number: '',
      workorder_number: '',
      overtime_start_time: '',
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    };
    setEntries([...entries, newEntry]);
  };

  const updateEntry = (index: number, field: keyof WeekstaatEntry, value: any) => {
    setEntries(prevEntries => {
      const updated = [...prevEntries];

      if (field === 'activity_code') {
        const activityCode = ACTIVITY_CODES.find(ac => ac.code === value);
        alert(`Found activity code: ${activityCode?.code} - ${activityCode?.description}`);
        if (activityCode) {
          updated[index] = {
            ...updated[index],
            activity_code: activityCode.code,
            activity_description: activityCode.description
          };
          alert(`Updated entry ${index} to: ${updated[index].activity_code}`);
        }
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }

      return updated;
    });
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    const dayMinutes = { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };

    entries.forEach(entry => {
      days.forEach(day => {
        dayMinutes[day] += notationToMinutes(entry[day]);
      });
    });

    const dayTotals: Record<string, number> = {};
    let totalMinutes = 0;
    days.forEach(day => {
      dayTotals[day] = minutesToNotation(dayMinutes[day]);
      totalMinutes += dayMinutes[day];
    });
    dayTotals.total = minutesToNotation(totalMinutes);

    return dayTotals;
  };

  const saveWeekstaat = async (submit = false) => {
    console.log('saveWeekstaat called with submit:', submit);
    if (!selectedWeekstaat) {
      console.log('No selected weekstaat');
      return;
    }

    setLoading(true);
    try {
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) throw new Error('Not authenticated');

      console.log('User authenticated:', currentUserId);

      const weekstaatData = {
        user_id: currentUserId,
        week_number: selectedWeekstaat.week_number,
        year: selectedWeekstaat.year,
        status: submit ? 'submitted' : 'draft',
        submitted_at: submit ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      console.log('Weekstaat data:', weekstaatData);

      let weekstaatId = selectedWeekstaat.id;

      // Use upsert to handle both insert and update cases
      console.log('Upserting weekstaat');
      const { data, error } = await supabase
        .from('weekstaten')
        .upsert(weekstaatId ? { ...weekstaatData, id: weekstaatId } : weekstaatData, {
          onConflict: 'user_id,week_number,year'
        })
        .select()
        .single();

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }

      weekstaatId = data.id;
      console.log('Weekstaat upserted with id:', weekstaatId);
      setSelectedWeekstaat({ ...selectedWeekstaat, id: weekstaatId });

      console.log('Deleting old entries for weekstaat:', weekstaatId);
      await supabase
        .from('weekstaat_entries')
        .delete()
        .eq('weekstaat_id', weekstaatId);

      if (entries.length > 0) {
        console.log('Inserting entries:', entries.length);
        const entriesData = entries.map(entry => ({
          weekstaat_id: weekstaatId,
          activity_code: entry.activity_code,
          activity_description: entry.activity_description,
          project_number: entry.project_number || null,
          workorder_number: entry.workorder_number || null,
          overtime_start_time: entry.overtime_start_time || null,
          monday: entry.monday || 0,
          tuesday: entry.tuesday || 0,
          wednesday: entry.wednesday || 0,
          thursday: entry.thursday || 0,
          friday: entry.friday || 0,
          saturday: entry.saturday || 0,
          sunday: entry.sunday || 0
        }));
        console.log('Entries data to insert:', entriesData);
        const { error: entriesError } = await supabase.from('weekstaat_entries').insert(entriesData);
        if (entriesError) {
          console.error('Entries insert error:', entriesError);
          throw entriesError;
        }
        console.log('Entries inserted successfully');
      }

      toast.success(submit ? 'Weekstaat ingediend!' : 'Weekstaat opgeslagen!');
      await loadWeekstaten();
      if (submit) {
        setSelectedWeekstaat(null);
        setEntries([]);
      }
    } catch (error: any) {
      console.error('Save weekstaat error:', error);
      toast.error(error.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const submitWeekstaat = async () => {
    console.log('Submit button clicked');
    console.log('Entries:', entries);

    if (entries.length === 0) {
      toast.error('Voeg minimaal één activiteit toe');
      return;
    }

    try {
      await saveWeekstaat(true);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  if (!selectedWeekstaat) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mijn Weekstaten</h1>
          <button onClick={createNewWeekstaat} className="btn-primary flex items-center space-x-2">
            <Plus size={20} />
            <span>Nieuwe Weekstaat</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {weekstaten.map(weekstaat => (
            <div
              key={weekstaat.id}
              onClick={() => {
                console.log('CLICKED WEEKSTAAT:', weekstaat);
                console.log('Status:', weekstaat.status);
                alert(`CLICKED! Status: ${weekstaat.status}`);
                setSelectedWeekstaat(weekstaat);
                loadWeekstaatDetails(weekstaat.id);
              }}
              className="card p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar size={24} className="text-blue-400" />
                  <h3 className="font-semibold">Week {weekstaat.week_number} - {weekstaat.year}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  weekstaat.status === 'submitted' ? 'bg-blue-500/20 text-blue-400' :
                  weekstaat.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  weekstaat.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {weekstaat.status === 'draft' ? 'Concept' :
                   weekstaat.status === 'submitted' ? 'Ingediend' :
                   weekstaat.status === 'approved' ? 'Goedgekeurd' :
                   'Afgekeurd'}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                <p>Aangemaakt: {new Date(weekstaat.created_at).toLocaleDateString('nl-NL')}</p>
                {weekstaat.submitted_at && (
                  <p>Ingediend: {new Date(weekstaat.submitted_at).toLocaleDateString('nl-NL')}</p>
                )}
                {weekstaat.status === 'rejected' && weekstaat.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 font-medium text-xs mb-1">Reden afkeuring:</p>
                    <p className="text-red-300 text-xs">{weekstaat.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {weekstaten.length === 0 && (
          <div className="card p-12 text-center">
            <FileText size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen weekstaten</h2>
            <p className="text-gray-400 mb-6">Maak je eerste weekstaat aan om te beginnen</p>
            <button onClick={createNewWeekstaat} className="btn-primary">
              Nieuwe Weekstaat
            </button>
          </div>
        )}
      </div>
    );
  }

  const totals = calculateTotals();
  const isDraft = selectedWeekstaat.status === 'draft';
  const isRejected = selectedWeekstaat.status === 'rejected';
  const canEdit = isDraft || isRejected;
  const useNewTimeInput = isWeek29OrLater(selectedWeekstaat.week_number, selectedWeekstaat.year);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => {
            setSelectedWeekstaat(null);
            setEntries([]);
          }} className="btn-secondary">
            Terug
          </button>
          <div>
            <h1 className="text-3xl font-bold">
              Week {selectedWeekstaat.week_number} - {selectedWeekstaat.year}
            </h1>
            <p className="text-gray-400 text-sm mt-1">{user?.username}</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex space-x-2">
            <button
              onClick={() => saveWeekstaat(false)}
              disabled={loading}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              <span>{loading ? 'Bezig...' : 'Opslaan'}</span>
            </button>
            <button
              onClick={submitWeekstaat}
              disabled={loading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              <span>{loading ? 'Bezig...' : isRejected ? 'Opnieuw indienen' : 'Indienen'}</span>
            </button>
          </div>
        )}
      </div>

      {isRejected && selectedWeekstaat.rejection_reason && (
        <div className="card p-4 mb-4 bg-red-500/10 border-2 border-red-500/30">
          <h3 className="text-red-400 font-semibold mb-2 flex items-center">
            <XCircle className="mr-2" size={20} />
            Afgekeurd - Aanpassingen vereist
          </h3>
          <p className="text-red-300 text-sm mb-2"><strong>Reden:</strong></p>
          <p className="text-red-200">{selectedWeekstaat.rejection_reason}</p>
          <p className="text-gray-400 text-sm mt-3">Pas de weekstaat aan en dien deze opnieuw in.</p>
        </div>
      )}

      <div className="card p-6 mb-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Activiteiten</h2>
            <p className="text-sm text-gray-400 mt-1">
              Vul per activiteit de uren in voor elke dag van de week
            </p>
          </div>
          {canEdit && (
            <button onClick={addEntry} className="btn-primary text-sm flex items-center space-x-1">
              <Plus size={16} />
              <span>Activiteit Toevoegen</span>
            </button>
          )}
        </div>

        {!useNewTimeInput && (
          <div className="text-xs text-gray-400 mb-4 flex space-x-4">
            <span>Achter de komma staan werkelijke minuten (bijv. 4,50 = 4 uur en 50 minuten)</span>
          </div>
        )}
        {useNewTimeInput && (
          <div className="text-xs text-gray-400 mb-4 flex space-x-4">
            <span>Kies uren en minuten (15, 30 of 45 min)</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2 min-w-[250px]">Activiteit</th>
                <th className="text-left p-2 min-w-[100px]">Project nr.</th>
                <th className="text-left p-2 min-w-[120px]">WB nr</th>
                {(() => {
                  const dayNames = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
                  const dates = getWeekDates(selectedWeekstaat.week_number, selectedWeekstaat.year);
                  return dayNames.map((day, i) => (
                    <th key={day} className="text-left p-2 w-20">
                      <div>{day}</div>
                      <div className="text-[10px] text-gray-400 font-normal">
                        {dates[i].getDate()}/{dates[i].getMonth() + 1}/{dates[i].getFullYear()}
                      </div>
                    </th>
                  ));
                })()}
                <th className="text-left p-2 min-w-[80px]">Overwerk</th>
                {canEdit && <th className="text-left p-2 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id || entry.tempId || index} className="border-b border-gray-800">
                  <td className="p-2">
                    <select
                      value={entry.activity_code}
                      onClick={() => alert(`Clicked select. canEdit=${canEdit}, disabled=${!canEdit}`)}
                      onChange={(e) => {
                        alert(`Selected: ${e.target.value} for entry ${index}`);
                        updateEntry(index, 'activity_code', e.target.value);
                      }}
                      disabled={!canEdit}
                      className="input-field text-xs p-1 w-full min-w-[220px]"
                    >
                      {ACTIVITY_CODES.map(code => (
                        <option key={code.code} value={code.code}>
                          {code.code} - {code.description}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={entry.project_number}
                      onChange={(e) => updateEntry(index, 'project_number', e.target.value)}
                      disabled={!canEdit}
                      placeholder="Project nr."
                      className="input-field text-xs p-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={entry.workorder_number}
                      onChange={(e) => updateEntry(index, 'workorder_number', e.target.value)}
                      disabled={!canEdit}
                      placeholder="WB nr"
                      className="input-field text-xs p-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    {useNewTimeInput ? (
                      <TimeInput value={entry.monday} onChange={(val) => updateEntry(index, 'monday', val)} disabled={!canEdit} />
                    ) : (
                      <input type="number" step="0.01" value={entry.monday} onChange={(e) => updateEntry(index, 'monday', e.target.value)} disabled={!canEdit} className="input-field text-xs p-1.5 w-20" />
                    )}
                  </td>
                  <td className="p-2">
                    {useNewTimeInput ? (
                      <TimeInput value={entry.tuesday} onChange={(val) => updateEntry(index, 'tuesday', val)} disabled={!canEdit} />
                    ) : (
                      <input type="number" step="0.01" value={entry.tuesday} onChange={(e) => updateEntry(index, 'tuesday', e.target.value)} disabled={!canEdit} className="input-field text-xs p-1.5 w-20" />
                    )}
                  </td>
                  <td className="p-2">
                    {useNewTimeInput ? (
                      <TimeInput value={entry.wednesday} onChange={(val) => updateEntry(index, 'wednesday', val)} disabled={!canEdit} />
                    ) : (
                      <input type="number" step="0.01" value={entry.wednesday} onChange={(e) => updateEntry(index, 'wednesday', e.target.value)} disabled={!canEdit} className="input-field text-xs p-1.5 w-20" />
                    )}
                  </td>
                  <td className="p-2">
                    {useNewTimeInput ? (
                      <TimeInput value={entry.thursday} onChange={(val) => updateEntry(index, 'thursday', val)} disabled={!canEdit} />
                    ) : (
                      <input type="number" step="0.01" value={entry.thursday} onChange={(e) => updateEntry(index, 'thursday', e.target.value)} disabled={!canEdit} className="input-field text-xs p-1.5 w-20" />
                    )}
                  </td>
                  <td className="p-2">
                    {useNewTimeInput ? (
                      <TimeInput value={entry.friday} onChange={(val) => updateEntry(index, 'friday', val)} disabled={!canEdit} />
                    ) : (
                      <input type="number" step="0.01" value={entry.friday} onChange={(e) => updateEntry(index, 'friday', e.target.value)} disabled={!canEdit} className="input-field text-xs p-1.5 w-20" />
                    )}
                  </td>
                  <td className="p-2">
                    {useNewTimeInput ? (
                      <TimeInput value={entry.saturday} onChange={(val) => updateEntry(index, 'saturday', val)} disabled={!canEdit} />
                    ) : (
                      <input type="number" step="0.01" value={entry.saturday} onChange={(e) => updateEntry(index, 'saturday', e.target.value)} disabled={!canEdit} className="input-field text-xs p-1.5 w-20" />
                    )}
                  </td>
                  <td className="p-2">
                    {useNewTimeInput ? (
                      <TimeInput value={entry.sunday} onChange={(val) => updateEntry(index, 'sunday', val)} disabled={!canEdit} />
                    ) : (
                      <input type="number" step="0.01" value={entry.sunday} onChange={(e) => updateEntry(index, 'sunday', e.target.value)} disabled={!canEdit} className="input-field text-xs p-1.5 w-20" />
                    )}
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={entry.overtime_start_time}
                      onChange={(e) => updateEntry(index, 'overtime_start_time', e.target.value)}
                      disabled={!canEdit}
                      placeholder="van-tot"
                      className="input-field text-xs p-1 w-20"
                    />
                  </td>
                  {canEdit && (
                    <td className="p-2">
                      <button onClick={() => removeEntry(index)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              <tr className="font-bold bg-gray-800/50">
                <td colSpan={3} className="p-2 text-right">Totaal uren:</td>
                <td className="p-2">{totals.monday.toFixed(2)}</td>
                <td className="p-2">{totals.tuesday.toFixed(2)}</td>
                <td className="p-2">{totals.wednesday.toFixed(2)}</td>
                <td className="p-2">{totals.thursday.toFixed(2)}</td>
                <td className="p-2">{totals.friday.toFixed(2)}</td>
                <td className="p-2">{totals.saturday.toFixed(2)}</td>
                <td className="p-2">{totals.sunday.toFixed(2)}</td>
                <td className="p-2 text-blue-400">{totals.total.toFixed(2)}</td>
                {isDraft && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="card p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Geen activiteiten toegevoegd</p>
          {isDraft && (
            <button onClick={addEntry} className="btn-primary mt-4">
              Eerste Activiteit Toevoegen
            </button>
          )}
        </div>
      )}
    </div>
  );
}