import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Filter, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Weekstaat {
  id: string;
  user_id: string;
  week_number: number;
  year: number;
  status: string;
  created_at: string;
  submitted_at: string;
}

export default function WorksheetManagement() {
  const [weekstaten, setWeekstaten] = useState<Weekstaat[]>([]);
  const [filteredWeekstaten, setFilteredWeekstaten] = useState<Weekstaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWeekstaat, setSelectedWeekstaat] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    loadWeekstaten();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [weekstaten, statusFilter]);

  const loadWeekstaten = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weekstaten')
        .select('*')
        .order('year', { ascending: false })
        .order('week_number', { ascending: false });

      if (error) throw error;
      setWeekstaten(data || []);
    } catch (error: any) {
      toast.error('Fout bij het laden van weekstaten');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...weekstaten];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter);
    }

    setFilteredWeekstaten(filtered);
  };

  const loadWeekstaatDetails = async (weekstaat: Weekstaat) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', weekstaat.user_id)
        .maybeSingle();

      const { data: weekstaatEntries } = await supabase
        .from('weekstaat_entries')
        .select('*')
        .eq('weekstaat_id', weekstaat.id)
        .order('created_at');

      setSelectedWeekstaat(weekstaat);
      setEntries(weekstaatEntries || []);
      setUserName(userData?.username || 'Onbekend');
    } catch (error: any) {
      toast.error('Fout bij het laden van details');
    }
  };

  const updateWeekstaatStatus = async (weekstaatId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('weekstaten')
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', weekstaatId);

      if (error) throw error;

      toast.success(status === 'approved' ? 'Weekstaat goedgekeurd!' : 'Weekstaat afgekeurd!');
      loadWeekstaten();
      setSelectedWeekstaat(null);
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
      dayTotals.monday += parseFloat(entry.monday) || 0;
      dayTotals.tuesday += parseFloat(entry.tuesday) || 0;
      dayTotals.wednesday += parseFloat(entry.wednesday) || 0;
      dayTotals.thursday += parseFloat(entry.thursday) || 0;
      dayTotals.friday += parseFloat(entry.friday) || 0;
      dayTotals.saturday += parseFloat(entry.saturday) || 0;
      dayTotals.sunday += parseFloat(entry.sunday) || 0;
    });

    const total = Object.values(dayTotals).reduce((sum, val) => sum + val, 0);
    return { ...dayTotals, total };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Weekstaten laden...</span>
          </div>
        </div>
      </div>
    );
  }

  if (selectedWeekstaat) {
    const totals = calculateTotals();

    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setSelectedWeekstaat(null);
                setEntries([]);
              }}
              className="btn-secondary"
            >
              Terug
            </button>
            <div>
              <h1 className="text-3xl font-bold">Weekstaat Details</h1>
              <p className="text-gray-400 text-sm mt-1">
                {userName} - Week {selectedWeekstaat.week_number}, {selectedWeekstaat.year}
              </p>
            </div>
          </div>
          {selectedWeekstaat.status === 'submitted' && (
            <div className="flex space-x-2">
              <button
                onClick={() => updateWeekstaatStatus(selectedWeekstaat.id, 'rejected')}
                className="btn-secondary flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30"
              >
                <XCircle size={20} />
                <span>Afkeuren</span>
              </button>
              <button
                onClick={() => updateWeekstaatStatus(selectedWeekstaat.id, 'approved')}
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
            <h2 className="text-xl font-semibold">Weekstaat Informatie</h2>
            {getStatusBadge(selectedWeekstaat.status)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-400">Werknemer</p>
              <p className="font-semibold">{userName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Week</p>
              <p className="font-semibold">Week {selectedWeekstaat.week_number} - {selectedWeekstaat.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Ingediend</p>
              <p className="font-semibold">
                {selectedWeekstaat.submitted_at
                  ? new Date(selectedWeekstaat.submitted_at).toLocaleDateString('nl-NL')
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Activiteiten</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2">Code</th>
                  <th className="text-left p-2">Omschrijving</th>
                  <th className="text-left p-2">WB nr</th>
                  <th className="text-left p-2 w-16">Ma</th>
                  <th className="text-left p-2 w-16">Di</th>
                  <th className="text-left p-2 w-16">Wo</th>
                  <th className="text-left p-2 w-16">Do</th>
                  <th className="text-left p-2 w-16">Vr</th>
                  <th className="text-left p-2 w-16">Za</th>
                  <th className="text-left p-2 w-16">Zo</th>
                  <th className="text-left p-2">Overwerk</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="p-2 font-semibold">{entry.activity_code}</td>
                    <td className="p-2">{entry.activity_description}</td>
                    <td className="p-2">{entry.workorder_number || '-'}</td>
                    <td className="p-2">{entry.monday || '-'}</td>
                    <td className="p-2">{entry.tuesday || '-'}</td>
                    <td className="p-2">{entry.wednesday || '-'}</td>
                    <td className="p-2">{entry.thursday || '-'}</td>
                    <td className="p-2">{entry.friday || '-'}</td>
                    <td className="p-2">{entry.saturday || '-'}</td>
                    <td className="p-2">{entry.sunday || '-'}</td>
                    <td className="p-2 text-xs">{entry.overtime_start_time || '-'}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-800/50 text-lg">
                  <td colSpan={3} className="p-2 text-right">Totaal uren:</td>
                  <td className="p-2">{totals.monday.toFixed(2)}</td>
                  <td className="p-2">{totals.tuesday.toFixed(2)}</td>
                  <td className="p-2">{totals.wednesday.toFixed(2)}</td>
                  <td className="p-2">{totals.thursday.toFixed(2)}</td>
                  <td className="p-2">{totals.friday.toFixed(2)}</td>
                  <td className="p-2">{totals.saturday.toFixed(2)}</td>
                  <td className="p-2">{totals.sunday.toFixed(2)}</td>
                  <td className="p-2 text-blue-400">{totals.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Weekstaat Beheer</h1>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-center space-x-4">
          <Filter size={20} className="text-gray-400" />
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

      <div className="grid grid-cols-1 gap-4">
        {filteredWeekstaten.map(weekstaat => (
          <div key={weekstaat.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Week</p>
                  <p className="font-semibold">Week {weekstaat.week_number} - {weekstaat.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Ingediend</p>
                  <p className="font-semibold">
                    {weekstaat.submitted_at
                      ? new Date(weekstaat.submitted_at).toLocaleDateString('nl-NL')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  {getStatusBadge(weekstaat.status)}
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => loadWeekstaatDetails(weekstaat)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Eye size={16} />
                    <span>Bekijken</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredWeekstaten.length === 0 && (
        <div className="card p-12 text-center">
          <FileText size={64} className="mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Geen weekstaten gevonden</h2>
          <p className="text-gray-400">Pas de filters aan om resultaten te zien</p>
        </div>
      )}
    </div>
  );
}