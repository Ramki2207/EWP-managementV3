import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Filter, FileText, CheckCircle, XCircle, Eye, Download } from 'lucide-react';

interface Worksheet {
  id: string;
  user_id: string;
  week_number: number;
  year: number;
  location: string;
  job_number: string;
  date: string;
  work_type: string;
  client_name: string;
  status: string;
  total_amount: number;
  created_at: string;
  submitted_at: string;
  monteur_name: string;
}

export default function WorksheetManagement() {
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [filteredWorksheets, setFilteredWorksheets] = useState<Worksheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWorksheet, setSelectedWorksheet] = useState<any>(null);
  const [dailyEntries, setDailyEntries] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  useEffect(() => {
    loadWorksheets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [worksheets, locationFilter, statusFilter]);

  const loadWorksheets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('worksheets')
        .select('*')
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorksheets(data || []);
    } catch (error: any) {
      toast.error('Fout bij het laden van werkbonnen');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...worksheets];

    if (locationFilter !== 'all') {
      filtered = filtered.filter(w => w.location === locationFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter);
    }

    setFilteredWorksheets(filtered);
  };

  const loadWorksheetDetails = async (worksheet: Worksheet) => {
    try {
      const { data: entries } = await supabase
        .from('worksheet_daily_entries')
        .select('*')
        .eq('worksheet_id', worksheet.id)
        .order('entry_date');

      const { data: mats } = await supabase
        .from('worksheet_materials')
        .select('*')
        .eq('worksheet_id', worksheet.id);

      setSelectedWorksheet(worksheet);
      setDailyEntries(entries || []);
      setMaterials(mats || []);
    } catch (error: any) {
      toast.error('Fout bij het laden van details');
    }
  };

  const updateWorksheetStatus = async (worksheetId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('worksheets')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', worksheetId);

      if (error) throw error;

      toast.success(status === 'approved' ? 'Werkbon goedgekeurd!' : 'Werkbon afgekeurd!');
      loadWorksheets();
      setSelectedWorksheet(null);
    } catch (error: any) {
      toast.error('Fout bij het bijwerken van status');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-500/20 text-gray-400',
      submitted: 'bg-blue-500/20 text-blue-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    };

    const labels = {
      draft: 'Concept',
      submitted: 'Ingediend',
      approved: 'Goedgekeurd',
      rejected: 'Afgekeurd'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const calculateTotals = () => {
    const totalA = dailyEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
    const totalB = materials.reduce((sum, mat) => sum + (parseFloat(mat.total_price) || 0), 0);
    return { totalA, totalB, total: totalA + totalB };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Werkbonnen laden...</span>
          </div>
        </div>
      </div>
    );
  }

  if (selectedWorksheet) {
    const totals = calculateTotals();

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedWorksheet(null);
                setDailyEntries([]);
                setMaterials([]);
              }}
              className="btn-secondary"
            >
              Terug
            </button>
            <h1 className="text-3xl font-bold">Werkbon Details</h1>
          </div>
          {selectedWorksheet.status === 'submitted' && (
            <div className="flex space-x-2">
              <button
                onClick={() => updateWorksheetStatus(selectedWorksheet.id, 'rejected')}
                className="btn-secondary flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30"
              >
                <XCircle size={20} />
                <span>Afkeuren</span>
              </button>
              <button
                onClick={() => updateWorksheetStatus(selectedWorksheet.id, 'approved')}
                className="btn-primary flex items-center space-x-2"
              >
                <CheckCircle size={20} />
                <span>Goedkeuren</span>
              </button>
            </div>
          )}
        </div>

        <div className="card p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Werkbon Informatie</h2>
            {getStatusBadge(selectedWorksheet.status)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Bonnummer</p>
              <p className="font-semibold">{selectedWorksheet.job_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Monteur</p>
              <p className="font-semibold">{selectedWorksheet.monteur_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Datum</p>
              <p className="font-semibold">{new Date(selectedWorksheet.date).toLocaleDateString('nl-NL')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Type</p>
              <p className="font-semibold">{selectedWorksheet.work_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Locatie</p>
              <p className="font-semibold">{selectedWorksheet.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Week</p>
              <p className="font-semibold">Week {selectedWorksheet.week_number} - {selectedWorksheet.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Opdrachtnummer</p>
              <p className="font-semibold">{selectedWorksheet.job_order_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Opdrachtgever</p>
              <p className="font-semibold">{selectedWorksheet.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Adres</p>
              <p className="font-semibold">{selectedWorksheet.address || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Woonplaats</p>
              <p className="font-semibold">{selectedWorksheet.city || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Telefoon</p>
              <p className="font-semibold">{selectedWorksheet.contact_phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Contactpersoon</p>
              <p className="font-semibold">{selectedWorksheet.contact_person || '-'}</p>
            </div>
            {selectedWorksheet.job_description && (
              <div className="md:col-span-3">
                <p className="text-sm text-gray-400">Omschrijving werkzaamheden</p>
                <p className="font-semibold">{selectedWorksheet.job_description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Dagelijks Overzicht</h2>
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
                </tr>
              </thead>
              <tbody>
                {dailyEntries.map((entry, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="p-2">{new Date(entry.entry_date).toLocaleDateString('nl-NL')}</td>
                    <td className="p-2">{entry.work_hours} uur</td>
                    <td className="p-2">{entry.travel_hours} uur</td>
                    <td className="p-2">{entry.kilometers} km</td>
                    <td className="p-2">€{parseFloat(entry.hourly_rate).toFixed(2)}</td>
                    <td className="p-2 font-semibold">€{parseFloat(entry.amount).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold text-lg">
                  <td colSpan={5} className="p-2 text-right">Totaal A:</td>
                  <td className="p-2 text-blue-400">€{totals.totalA.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Materialen</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2">Aantal</th>
                  <th className="text-left p-2">Nummer</th>
                  <th className="text-left p-2">Omschrijving</th>
                  <th className="text-left p-2">Eenheidsprijs</th>
                  <th className="text-left p-2">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="p-2">{material.quantity}</td>
                    <td className="p-2">{material.item_number}</td>
                    <td className="p-2">{material.description}</td>
                    <td className="p-2">€{parseFloat(material.unit_price).toFixed(2)}</td>
                    <td className="p-2 font-semibold">€{parseFloat(material.total_price).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold text-lg">
                  <td colSpan={4} className="p-2 text-right">Totaal B:</td>
                  <td className="p-2 text-blue-400">€{totals.totalB.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Opmerkingen & Totalen</h2>
          <div className="space-y-4">
            {selectedWorksheet.client_notes && (
              <div>
                <p className="text-sm text-gray-400">Opmerkingen Klant</p>
                <p className="font-semibold">{selectedWorksheet.client_notes}</p>
              </div>
            )}
            {selectedWorksheet.work_completed && (
              <div>
                <p className="text-sm text-gray-400">Werk gereed</p>
                <p className="font-semibold">{selectedWorksheet.work_completed}</p>
              </div>
            )}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>Totaal Bedrag (A+B):</span>
                <span className="text-green-400">€{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Werkbonnen Beheer</h1>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center space-x-4">
          <Filter size={20} className="text-gray-400" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Locatie</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">Alle Locaties</option>
                <option value="Leerdam">Leerdam</option>
                <option value="Naaldwijk">Naaldwijk</option>
                <option value="Rotterdam">Rotterdam</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">Alle Statussen</option>
                <option value="draft">Concept</option>
                <option value="submitted">Ingediend</option>
                <option value="approved">Goedgekeurd</option>
                <option value="rejected">Afgekeurd</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredWorksheets.map(worksheet => (
          <div key={worksheet.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Bonnummer</p>
                  <p className="font-semibold">{worksheet.job_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Monteur</p>
                  <p className="font-semibold">{worksheet.monteur_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Klant</p>
                  <p className="font-semibold">{worksheet.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Locatie</p>
                  <p className="font-semibold">{worksheet.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Totaal</p>
                  <p className="font-semibold text-green-400">€{parseFloat(worksheet.total_amount as any).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {getStatusBadge(worksheet.status)}
                <button
                  onClick={() => loadWorksheetDetails(worksheet)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Eye size={16} />
                  <span>Bekijken</span>
                </button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Type:</span> {worksheet.work_type}
              </div>
              <div>
                <span className="text-gray-400">Week:</span> Week {worksheet.week_number} - {worksheet.year}
              </div>
              <div>
                <span className="text-gray-400">Ingediend:</span>{' '}
                {worksheet.submitted_at ? new Date(worksheet.submitted_at).toLocaleDateString('nl-NL') : '-'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredWorksheets.length === 0 && (
        <div className="card p-12 text-center">
          <FileText size={64} className="mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Geen werkbonnen gevonden</h2>
          <p className="text-gray-400">Pas de filters aan om resultaten te zien</p>
        </div>
      )}
    </div>
  );
}