import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, FileText, Send, Calendar } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';

interface DailyEntry {
  id?: string;
  entry_date: string;
  work_hours: number;
  travel_hours: number;
  kilometers: number;
  hourly_rate: number;
  amount: number;
}

interface Material {
  id?: string;
  quantity: number;
  item_number: string;
  description: string;
  unit_price: number;
  total_price: number;
}

interface Worksheet {
  id?: string;
  week_number: number;
  year: number;
  location: string;
  job_number: string;
  date: string;
  work_type: string;
  job_order_number: string;
  client_name: string;
  address: string;
  city: string;
  contact_phone: string;
  contact_fax: string;
  contact_person: string;
  job_description: string;
  status: string;
  client_notes: string;
  worker_signature: string;
  client_signature: string;
  monteur_name: string;
  work_completed: string;
  total_amount: number;
}

export default function MyWorksheet() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [worksheets, setWorksheets] = useState<any[]>([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState<Worksheet | null>(null);
  const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadWorksheets();
  }, []);

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    setUser(userData);
  };

  const loadWorksheets = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data, error } = await supabase
      .from('worksheets')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Fout bij het laden van werkbonnen');
      return;
    }

    setWorksheets(data || []);
  };

  const loadWorksheetDetails = async (worksheetId: string) => {
    const { data: worksheet } = await supabase
      .from('worksheets')
      .select('*')
      .eq('id', worksheetId)
      .maybeSingle();

    const { data: entries } = await supabase
      .from('worksheet_daily_entries')
      .select('*')
      .eq('worksheet_id', worksheetId)
      .order('entry_date');

    const { data: mats } = await supabase
      .from('worksheet_materials')
      .select('*')
      .eq('worksheet_id', worksheetId);

    setSelectedWorksheet(worksheet);
    setDailyEntries(entries || []);
    setMaterials(mats || []);
  };

  const createNewWorksheet = () => {
    const today = new Date();
    const weekNumber = getWeekNumber(today);
    const userLocation = user?.assigned_locations?.[0] || 'Leerdam';

    setSelectedWorksheet({
      week_number: weekNumber,
      year: today.getFullYear(),
      location: userLocation,
      job_number: '',
      date: today.toISOString().split('T')[0],
      work_type: 'Montage',
      job_order_number: '',
      client_name: '',
      address: '',
      city: '',
      contact_phone: '',
      contact_fax: '',
      contact_person: '',
      job_description: '',
      status: 'draft',
      client_notes: '',
      worker_signature: '',
      client_signature: '',
      monteur_name: user?.username || '',
      work_completed: '',
      total_amount: 0
    });
    setDailyEntries([]);
    setMaterials([]);
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const addDailyEntry = () => {
    const newEntry: DailyEntry = {
      entry_date: new Date().toISOString().split('T')[0],
      work_hours: 0,
      travel_hours: 0,
      kilometers: 0,
      hourly_rate: 0,
      amount: 0
    };
    setDailyEntries([...dailyEntries, newEntry]);
  };

  const updateDailyEntry = (index: number, field: keyof DailyEntry, value: any) => {
    const updated = [...dailyEntries];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'work_hours' || field === 'hourly_rate') {
      const hours = field === 'work_hours' ? parseFloat(value) || 0 : updated[index].work_hours;
      const rate = field === 'hourly_rate' ? parseFloat(value) || 0 : updated[index].hourly_rate;
      updated[index].amount = hours * rate;
    }

    setDailyEntries(updated);
  };

  const removeDailyEntry = (index: number) => {
    setDailyEntries(dailyEntries.filter((_, i) => i !== index));
  };

  const addMaterial = () => {
    const newMaterial: Material = {
      quantity: 0,
      item_number: '',
      description: '',
      unit_price: 0,
      total_price: 0
    };
    setMaterials([...materials, newMaterial]);
  };

  const updateMaterial = (index: number, field: keyof Material, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      const qty = field === 'quantity' ? parseInt(value) || 0 : updated[index].quantity;
      const price = field === 'unit_price' ? parseFloat(value) || 0 : updated[index].unit_price;
      updated[index].total_price = qty * price;
    }

    setMaterials(updated);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totalA = dailyEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const totalB = materials.reduce((sum, mat) => sum + (mat.total_price || 0), 0);
    return { totalA, totalB, total: totalA + totalB };
  };

  const saveWorksheet = async (submit = false) => {
    if (!selectedWorksheet) return;

    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const totals = calculateTotals();
      const worksheetData = {
        ...selectedWorksheet,
        user_id: authUser.id,
        total_amount: totals.total,
        status: submit ? 'submitted' : 'draft',
        submitted_at: submit ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      let worksheetId = selectedWorksheet.id;

      if (worksheetId) {
        const { error } = await supabase
          .from('worksheets')
          .update(worksheetData)
          .eq('id', worksheetId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('worksheets')
          .insert([worksheetData])
          .select()
          .single();

        if (error) throw error;
        worksheetId = data.id;
        setSelectedWorksheet({ ...selectedWorksheet, id: worksheetId });
      }

      await supabase
        .from('worksheet_daily_entries')
        .delete()
        .eq('worksheet_id', worksheetId);

      if (dailyEntries.length > 0) {
        const entriesData = dailyEntries.map(entry => ({
          worksheet_id: worksheetId,
          ...entry
        }));
        await supabase.from('worksheet_daily_entries').insert(entriesData);
      }

      await supabase
        .from('worksheet_materials')
        .delete()
        .eq('worksheet_id', worksheetId);

      if (materials.length > 0) {
        const materialsData = materials.map(mat => ({
          worksheet_id: worksheetId,
          ...mat
        }));
        await supabase.from('worksheet_materials').insert(materialsData);
      }

      toast.success(submit ? 'Weekstaat ingediend!' : 'Weekstaat opgeslagen!');
      loadWorksheets();
      if (submit) {
        setSelectedWorksheet(null);
        setDailyEntries([]);
        setMaterials([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  const submitWorksheet = () => {
    if (!selectedWorksheet?.job_number || !selectedWorksheet?.client_name) {
      toast.error('Vul alle verplichte velden in');
      return;
    }
    saveWorksheet(true);
  };

  if (!selectedWorksheet) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mijn Weekstaten</h1>
          <button onClick={createNewWorksheet} className="btn-primary flex items-center space-x-2">
            <Plus size={20} />
            <span>Nieuwe Weekstaat</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {worksheets.map(worksheet => (
            <div
              key={worksheet.id}
              onClick={() => {
                setSelectedWorksheet(worksheet);
                loadWorksheetDetails(worksheet.id);
              }}
              className="card p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText size={24} className="text-blue-400" />
                  <h3 className="font-semibold">{worksheet.job_number || 'Geen nummer'}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  worksheet.status === 'submitted' ? 'bg-blue-500/20 text-blue-400' :
                  worksheet.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  worksheet.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {worksheet.status === 'draft' ? 'Concept' :
                   worksheet.status === 'submitted' ? 'Ingediend' :
                   worksheet.status === 'approved' ? 'Goedgekeurd' :
                   'Afgekeurd'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-400">
                <p><strong>Klant:</strong> {worksheet.client_name || '-'}</p>
                <p><strong>Locatie:</strong> {worksheet.location}</p>
                <p><strong>Week:</strong> {worksheet.week_number} - {worksheet.year}</p>
                <p><strong>Datum:</strong> {new Date(worksheet.date).toLocaleDateString('nl-NL')}</p>
              </div>
            </div>
          ))}
        </div>

        {worksheets.length === 0 && (
          <div className="card p-12 text-center">
            <FileText size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen weekstaten</h2>
            <p className="text-gray-400 mb-6">Maak je eerste weekstaat aan om te beginnen</p>
            <button onClick={createNewWorksheet} className="btn-primary">
              Nieuwe Weekstaat
            </button>
          </div>
        )}
      </div>
    );
  }

  const totals = calculateTotals();
  const isDraft = selectedWorksheet.status === 'draft';

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => {
            setSelectedWorksheet(null);
            setDailyEntries([]);
            setMaterials([]);
          }} className="btn-secondary">
            Terug
          </button>
          <h1 className="text-3xl font-bold">
            {selectedWorksheet.id ? 'Weekstaat Bewerken' : 'Nieuwe Weekstaat'}
          </h1>
        </div>
        {isDraft && (
          <div className="flex space-x-2">
            <button onClick={() => saveWorksheet(false)} className="btn-secondary flex items-center space-x-2">
              <Save size={20} />
              <span>Opslaan</span>
            </button>
            <button onClick={submitWorksheet} className="btn-primary flex items-center space-x-2">
              <Send size={20} />
              <span>Indienen</span>
            </button>
          </div>
        )}
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Weekstaat Informatie</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Bonnummer *</label>
            <input
              type="text"
              value={selectedWorksheet.job_number}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, job_number: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Datum *</label>
            <input
              type="date"
              value={selectedWorksheet.date}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, date: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type *</label>
            <select
              value={selectedWorksheet.work_type}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, work_type: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            >
              <option value="Montage">Montage</option>
              <option value="Onderhoud">Onderhoud</option>
              <option value="Garantie">Garantie</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Opdrachtnummer</label>
            <input
              type="text"
              value={selectedWorksheet.job_order_number}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, job_order_number: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Opdrachtgever *</label>
            <input
              type="text"
              value={selectedWorksheet.client_name}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, client_name: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Locatie</label>
            <select
              value={selectedWorksheet.location}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, location: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            >
              <option value="Leerdam">Leerdam</option>
              <option value="Naaldwijk">Naaldwijk</option>
              <option value="Rotterdam">Rotterdam</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Adres</label>
            <input
              type="text"
              value={selectedWorksheet.address}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, address: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Woonplaats</label>
            <input
              type="text"
              value={selectedWorksheet.city}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, city: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Telefoon</label>
            <input
              type="text"
              value={selectedWorksheet.contact_phone}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, contact_phone: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Fax</label>
            <input
              type="text"
              value={selectedWorksheet.contact_fax}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, contact_fax: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Contactpersoon</label>
            <input
              type="text"
              value={selectedWorksheet.contact_person}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, contact_person: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm text-gray-400 mb-2">Omschrijving werkzaamheden</label>
            <textarea
              value={selectedWorksheet.job_description}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, job_description: e.target.value })}
              disabled={!isDraft}
              className="input-field"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Dagelijks Overzicht</h2>
          {isDraft && (
            <button onClick={addDailyEntry} className="btn-primary text-sm flex items-center space-x-1">
              <Plus size={16} />
              <span>Dag Toevoegen</span>
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">Datum</th>
                <th className="text-left p-2">Werktijd</th>
                <th className="text-left p-2">Reistijd</th>
                <th className="text-left p-2">Kilometers</th>
                <th className="text-left p-2">Per uur</th>
                <th className="text-left p-2">Bedrag</th>
                {isDraft && <th className="text-left p-2"></th>}
              </tr>
            </thead>
            <tbody>
              {dailyEntries.map((entry, index) => (
                <tr key={index} className="border-b border-gray-800">
                  <td className="p-2">
                    <input
                      type="date"
                      value={entry.entry_date}
                      onChange={(e) => updateDailyEntry(index, 'entry_date', e.target.value)}
                      disabled={!isDraft}
                      className="input-field text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.5"
                      value={entry.work_hours}
                      onChange={(e) => updateDailyEntry(index, 'work_hours', e.target.value)}
                      disabled={!isDraft}
                      className="input-field text-sm w-20"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.5"
                      value={entry.travel_hours}
                      onChange={(e) => updateDailyEntry(index, 'travel_hours', e.target.value)}
                      disabled={!isDraft}
                      className="input-field text-sm w-20"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={entry.kilometers}
                      onChange={(e) => updateDailyEntry(index, 'kilometers', e.target.value)}
                      disabled={!isDraft}
                      className="input-field text-sm w-20"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={entry.hourly_rate}
                      onChange={(e) => updateDailyEntry(index, 'hourly_rate', e.target.value)}
                      disabled={!isDraft}
                      className="input-field text-sm w-24"
                    />
                  </td>
                  <td className="p-2">
                    €{entry.amount.toFixed(2)}
                  </td>
                  {isDraft && (
                    <td className="p-2">
                      <button onClick={() => removeDailyEntry(index)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              <tr className="font-semibold">
                <td colSpan={5} className="p-2 text-right">Totaal A:</td>
                <td className="p-2">€{totals.totalA.toFixed(2)}</td>
                {isDraft && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Materialen</h2>
          {isDraft && (
            <button onClick={addMaterial} className="btn-primary text-sm flex items-center space-x-1">
              <Plus size={16} />
              <span>Materiaal Toevoegen</span>
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-2">Aantal</th>
                <th className="text-left p-2">Nummer</th>
                <th className="text-left p-2">Omschrijving</th>
                <th className="text-left p-2">Eenheidsprijs</th>
                <th className="text-left p-2">Bedrag</th>
                {isDraft && <th className="text-left p-2"></th>}
              </tr>
            </thead>
            <tbody>
              {materials.map((material, index) => (
                <tr key={index} className="border-b border-gray-800">
                  <td className="p-2">
                    <input
                      type="number"
                      value={material.quantity}
                      onChange={(e) => updateMaterial(index, 'quantity', e.target.value)}
                      disabled={!isDraft}
                      className="input-field text-sm w-20"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={material.item_number}
                      onChange={(e) => updateMaterial(index, 'item_number', e.target.value)}
                      disabled={!isDraft}
                      className="input-field text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={material.description}
                      onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                      disabled={!isDraft}
                      className="input-field text-sm"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      value={material.unit_price}
                      onChange={(e) => updateMaterial(index, 'unit_price', e.target.value)}
                      disabled={!isDraft}
                      className="input-field text-sm w-24"
                    />
                  </td>
                  <td className="p-2">
                    €{material.total_price.toFixed(2)}
                  </td>
                  {isDraft && (
                    <td className="p-2">
                      <button onClick={() => removeMaterial(index)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              <tr className="font-semibold">
                <td colSpan={4} className="p-2 text-right">Totaal B:</td>
                <td className="p-2">€{totals.totalB.toFixed(2)}</td>
                {isDraft && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Opmerkingen & Handtekeningen</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Opmerkingen Klant</label>
            <textarea
              value={selectedWorksheet.client_notes}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, client_notes: e.target.value })}
              disabled={!isDraft}
              className="input-field"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Werk gereed (ja/neen)</label>
            <input
              type="text"
              value={selectedWorksheet.work_completed}
              onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, work_completed: e.target.value })}
              disabled={!isDraft}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Naam Monteur</label>
              <input
                type="text"
                value={selectedWorksheet.monteur_name}
                onChange={(e) => setSelectedWorksheet({ ...selectedWorksheet, monteur_name: e.target.value })}
                disabled={!isDraft}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Totaal Bedrag A+B</label>
              <div className="input-field bg-gray-800">
                €{totals.total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}