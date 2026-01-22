import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, FileText, Send, Calendar, XCircle } from 'lucide-react';

const ACTIVITY_CODES = [
  { code: '100', description: 'Montage verdelers' },
  { code: '102', description: 'Montage hoofdverdelers' },
  { code: '103', description: 'Montage buiten' },
  { code: '104', description: 'Regieklus' },
  { code: '105', description: 'Montage Halyester' },
  { code: '181', description: 'Werkvoorbereiding/magazijn' },
  { code: '302', description: 'Administratie' },
  { code: '402', description: 'Scholing' },
  { code: '403', description: 'Afdelingsoverleg' },
  { code: '404', description: 'Opruimwerkzaamheden' },
  { code: '405', description: 'Corvee' },
  { code: '500', description: 'Ziek' },
  { code: '501', description: 'Tandarts/huisarts/fysio' },
  { code: '502', description: 'Specialist/ziekenhuis' },
  { code: '503', description: 'Verlof' },
  { code: '504', description: 'Bijzonder verlof' },
  { code: '505', description: 'Feestdag' },
  { code: '506', description: 'ADV' },
  { code: '508', description: 'Tijd voor tijd' },
  { code: '509', description: 'Overwerk (uitbetalen)' }
];

interface WeekstaatEntry {
  id?: string;
  tempId?: string;
  activity_code: string;
  activity_description: string;
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

  const addEntry = () => {
    const newEntry: WeekstaatEntry = {
      tempId: `temp_${Date.now()}_${Math.random()}`,
      activity_code: '100',
      activity_description: 'Montage verdelers',
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
    const dayTotals = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    };

    entries.forEach(entry => {
      dayTotals.monday += parseFloat(entry.monday as any) || 0;
      dayTotals.tuesday += parseFloat(entry.tuesday as any) || 0;
      dayTotals.wednesday += parseFloat(entry.wednesday as any) || 0;
      dayTotals.thursday += parseFloat(entry.thursday as any) || 0;
      dayTotals.friday += parseFloat(entry.friday as any) || 0;
      dayTotals.saturday += parseFloat(entry.saturday as any) || 0;
      dayTotals.sunday += parseFloat(entry.sunday as any) || 0;
    });

    const total = Object.values(dayTotals).reduce((sum, val) => sum + val, 0);

    return { ...dayTotals, total };
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

  // Debug: show status and canEdit on page load
  useEffect(() => {
    if (selectedWeekstaat) {
      console.log('Selected weekstaat status:', selectedWeekstaat.status);
      console.log('canEdit:', canEdit);
      console.log('entries count:', entries.length);
      // Show prominent alert
      alert(`STATUS: ${selectedWeekstaat.status}\nCAN EDIT: ${canEdit}\nDRAFT: ${isDraft}\nREJECTED: ${isRejected}`);
    }
  }, [selectedWeekstaat, canEdit, entries.length]);

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

        <div className="text-xs text-gray-400 mb-4 flex space-x-4">
          <span>0,25 = 15 min (kwartier)</span>
          <span>0,50 = 30 min (half uur)</span>
          <span>0,75 = 45 min (3 kwartier)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2 min-w-[250px]">Activiteit</th>
                <th className="text-left p-2 min-w-[120px]">WB nr</th>
                <th className="text-left p-2 w-16">Ma</th>
                <th className="text-left p-2 w-16">Di</th>
                <th className="text-left p-2 w-16">Wo</th>
                <th className="text-left p-2 w-16">Do</th>
                <th className="text-left p-2 w-16">Vr</th>
                <th className="text-left p-2 w-16">Za</th>
                <th className="text-left p-2 w-16">Zo</th>
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
                      value={entry.workorder_number}
                      onChange={(e) => updateEntry(index, 'workorder_number', e.target.value)}
                      disabled={!canEdit}
                      placeholder="WB nr"
                      className="input-field text-xs p-1 w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.25"
                      value={entry.monday}
                      onChange={(e) => updateEntry(index, 'monday', e.target.value)}
                      disabled={!canEdit}
                      className="input-field text-xs p-1 w-16"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.25"
                      value={entry.tuesday}
                      onChange={(e) => updateEntry(index, 'tuesday', e.target.value)}
                      disabled={!canEdit}
                      className="input-field text-xs p-1 w-16"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.25"
                      value={entry.wednesday}
                      onChange={(e) => updateEntry(index, 'wednesday', e.target.value)}
                      disabled={!canEdit}
                      className="input-field text-xs p-1 w-16"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.25"
                      value={entry.thursday}
                      onChange={(e) => updateEntry(index, 'thursday', e.target.value)}
                      disabled={!canEdit}
                      className="input-field text-xs p-1 w-16"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.25"
                      value={entry.friday}
                      onChange={(e) => updateEntry(index, 'friday', e.target.value)}
                      disabled={!canEdit}
                      className="input-field text-xs p-1 w-16"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.25"
                      value={entry.saturday}
                      onChange={(e) => updateEntry(index, 'saturday', e.target.value)}
                      disabled={!canEdit}
                      className="input-field text-xs p-1 w-16"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.25"
                      value={entry.sunday}
                      onChange={(e) => updateEntry(index, 'sunday', e.target.value)}
                      disabled={!canEdit}
                      className="input-field text-xs p-1 w-16"
                    />
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
                <td colSpan={2} className="p-2 text-right">Totaal uren:</td>
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