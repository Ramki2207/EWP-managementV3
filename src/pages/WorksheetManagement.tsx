import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Filter, FileText, CheckCircle, XCircle, Eye, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface Weekstaat {
  id: string;
  user_id: string;
  week_number: number;
  year: number;
  status: string;
  created_at: string;
  submitted_at: string;
  rejection_reason?: string;
}

interface WeekstaatEntry {
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

export default function WorksheetManagement() {
  const [currentWeek, setCurrentWeek] = useState({ week: 0, year: 0 });
  const [weekstaten, setWeekstaten] = useState<Weekstaat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekstaat, setSelectedWeekstaat] = useState<Weekstaat | null>(null);
  const [entries, setEntries] = useState<WeekstaatEntry[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const today = new Date();
    const week = getWeekNumber(today);
    const year = today.getFullYear();
    setCurrentWeek({ week, year });
    loadWeekstaten(week, year);
  }, []);

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const loadWeekstaten = async (week: number, year: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weekstaten')
        .select('*')
        .eq('week_number', week)
        .eq('year', year)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setWeekstaten(data || []);
    } catch (error: any) {
      toast.error('Fout bij het laden van weekstaten');
    } finally {
      setLoading(false);
    }
  };

  const changeWeek = (direction: 'prev' | 'next') => {
    let newWeek = currentWeek.week + (direction === 'next' ? 1 : -1);
    let newYear = currentWeek.year;

    if (newWeek > 52) {
      newWeek = 1;
      newYear++;
    } else if (newWeek < 1) {
      newWeek = 52;
      newYear--;
    }

    setCurrentWeek({ week: newWeek, year: newYear });
    loadWeekstaten(newWeek, newYear);
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

  const approveWeekstaat = async () => {
    if (!selectedWeekstaat) return;

    try {
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) throw new Error('Niet ingelogd');

      const { error } = await supabase
        .from('weekstaten')
        .update({
          status: 'approved',
          reviewed_by: currentUserId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null
        })
        .eq('id', selectedWeekstaat.id);

      if (error) throw error;

      toast.success('Weekstaat goedgekeurd!');
      setSelectedWeekstaat(null);
      loadWeekstaten(currentWeek.week, currentWeek.year);
    } catch (error: any) {
      toast.error('Fout bij goedkeuren: ' + error.message);
    }
  };

  const rejectWeekstaat = async () => {
    if (!selectedWeekstaat || !rejectionReason.trim()) {
      toast.error('Vul een reden voor afkeuring in');
      return;
    }

    try {
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) throw new Error('Niet ingelogd');

      const { error } = await supabase
        .from('weekstaten')
        .update({
          status: 'rejected',
          reviewed_by: currentUserId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', selectedWeekstaat.id);

      if (error) throw error;

      toast.success('Weekstaat afgekeurd');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedWeekstaat(null);
      loadWeekstaten(currentWeek.week, currentWeek.year);
    } catch (error: any) {
      toast.error('Fout bij afkeuren: ' + error.message);
    }
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
              <h1 className="text-3xl font-bold">Weekstaat Controle</h1>
              <p className="text-gray-400 text-sm mt-1">
                {userName} - Week {selectedWeekstaat.week_number}, {selectedWeekstaat.year}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowRejectModal(true)}
              className="btn-secondary bg-red-500/20 border-red-500/30 hover:bg-red-500/30 flex items-center space-x-2"
            >
              <XCircle size={20} />
              <span>Afkeuren</span>
            </button>
            <button
              onClick={approveWeekstaat}
              className="btn-primary bg-green-500/20 border-green-500/30 hover:bg-green-500/30 flex items-center space-x-2"
            >
              <CheckCircle size={20} />
              <span>Goedkeuren</span>
            </button>
          </div>
        </div>

        <div className="card p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Activiteiten</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 min-w-[200px]">Activiteit</th>
                  <th className="text-left p-2 min-w-[120px]">WB nr</th>
                  <th className="text-left p-2 w-16">Ma</th>
                  <th className="text-left p-2 w-16">Di</th>
                  <th className="text-left p-2 w-16">Wo</th>
                  <th className="text-left p-2 w-16">Do</th>
                  <th className="text-left p-2 w-16">Vr</th>
                  <th className="text-left p-2 w-16">Za</th>
                  <th className="text-left p-2 w-16">Zo</th>
                  <th className="text-left p-2 min-w-[80px]">Overwerk</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="p-2">
                      <div className="text-xs">
                        <div className="font-medium">{entry.activity_code}</div>
                        <div className="text-gray-400">{entry.activity_description}</div>
                      </div>
                    </td>
                    <td className="p-2">{entry.workorder_number || '-'}</td>
                    <td className="p-2">{entry.monday || '-'}</td>
                    <td className="p-2">{entry.tuesday || '-'}</td>
                    <td className="p-2">{entry.wednesday || '-'}</td>
                    <td className="p-2">{entry.thursday || '-'}</td>
                    <td className="p-2">{entry.friday || '-'}</td>
                    <td className="p-2">{entry.saturday || '-'}</td>
                    <td className="p-2">{entry.sunday || '-'}</td>
                    <td className="p-2">{entry.overtime_start_time || '-'}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-800/50">
                  <td colSpan={2} className="p-2 text-right">Totaal uren:</td>
                  <td className="p-2">{totals.monday}</td>
                  <td className="p-2">{totals.tuesday}</td>
                  <td className="p-2">{totals.wednesday}</td>
                  <td className="p-2">{totals.thursday}</td>
                  <td className="p-2">{totals.friday}</td>
                  <td className="p-2">{totals.saturday}</td>
                  <td className="p-2">{totals.sunday}</td>
                  <td className="p-2">{totals.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Weekstaat Afkeuren</h3>
                <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-400 mb-4">
                Geef aan waarom deze weekstaat wordt afgekeurd. Dit bericht wordt naar de gebruiker gestuurd.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="bijv. WB nummers ontbreken, onjuiste uren, etc."
                className="input-field w-full h-32 mb-4"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowRejectModal(false)} className="btn-secondary">
                  Annuleren
                </button>
                <button onClick={rejectWeekstaat} className="btn-primary bg-red-500/20 border-red-500/30 hover:bg-red-500/30">
                  Afkeuren
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Weekstaat Beheer</h1>
          <p className="text-gray-400 text-sm mt-1">
            Controleer en keur weekstaten goed of af
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => changeWeek('prev')} className="btn-secondary">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center space-x-2 text-xl font-semibold">
            <Calendar size={24} className="text-blue-400" />
            <span>Week {currentWeek.week} - {currentWeek.year}</span>
          </div>
          <button onClick={() => changeWeek('next')} className="btn-secondary">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="card p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Laden...</p>
          </div>
        ) : weekstaten.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen inzendingen</h2>
            <p className="text-gray-400">Er zijn geen weekstaten ingediend voor week {currentWeek.week}</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Ingediende weekstaten ({weekstaten.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weekstaten.map((weekstaat) => (
                <WeekstaatCard
                  key={weekstaat.id}
                  weekstaat={weekstaat}
                  onClick={() => loadWeekstaatDetails(weekstaat)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WeekstaatCard({ weekstaat, onClick }: { weekstaat: Weekstaat; onClick: () => void }) {
  const [userName, setUserName] = useState('Laden...');

  useEffect(() => {
    loadUserName();
  }, [weekstaat.user_id]);

  const loadUserName = async () => {
    const { data } = await supabase
      .from('users')
      .select('username')
      .eq('id', weekstaat.user_id)
      .maybeSingle();

    setUserName(data?.username || 'Onbekend');
  };

  return (
    <div
      onClick={onClick}
      className="card p-4 cursor-pointer hover:shadow-lg transition-all hover:border-blue-500/50"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{userName}</h3>
        <Eye size={20} className="text-blue-400" />
      </div>
      <div className="text-sm text-gray-400 space-y-1">
        <p>Ingediend: {new Date(weekstaat.submitted_at).toLocaleString('nl-NL')}</p>
      </div>
    </div>
  );
}
