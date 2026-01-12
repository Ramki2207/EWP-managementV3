import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, FileText, Send, Calendar, Briefcase, Umbrella, Sun } from 'lucide-react';

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
];

const LEAVE_TYPES = [
  { code: 'sick', label: 'Ziek', description: 'Ziekmelding' },
  { code: 'doctor', label: 'Tandarts/Huisarts/Fysio', description: 'Medische afspraak' },
  { code: 'specialist', label: 'Specialist/Ziekenhuis', description: 'Ziekenhuisbezoek' },
  { code: 'special_leave', label: 'Bijzonder verlof', description: 'Bijzonder verlof' },
  { code: 'public_holiday', label: 'Feestdag', description: 'Feestdag' },
  { code: 'adv', label: 'ADV', description: 'ADV dag' },
  { code: 'time_for_time', label: 'Tijd voor tijd', description: 'Compensatieverlof' },
];

type TabType = 'weekstaat' | 'verlof' | 'vakantie';

interface WeekstaatEntry {
  id?: string;
  activity_code: string;
  activity_description: string;
  workorder_number: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export default function UrenstaatVerlof() {
  const [activeTab, setActiveTab] = useState<TabType>('weekstaat');
  const [user, setUser] = useState<any>(null);

  // Weekstaat state
  const [weekstaten, setWeekstaten] = useState<any[]>([]);
  const [selectedWeekstaat, setSelectedWeekstaat] = useState<any>(null);
  const [entries, setEntries] = useState<WeekstaatEntry[]>([]);

  // Verlof state
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    is_partial_day: false,
    start_time: '',
    end_time: '',
    description: ''
  });

  // Vakantie state
  const [vacationRequests, setVacationRequests] = useState<any[]>([]);
  const [vacationBalance, setVacationBalance] = useState<any>(null);
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [vacationForm, setVacationForm] = useState({
    start_date: '',
    end_date: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      if (activeTab === 'weekstaat') {
        loadWeekstaten();
      } else if (activeTab === 'verlof') {
        loadLeaveRequests();
      } else if (activeTab === 'vakantie') {
        loadVacationRequests();
        loadVacationBalance();
      }
    }
  }, [activeTab, user]);

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

  // ============ WEEKSTAAT FUNCTIONS ============

  const getISOWeekAndYear = (date: Date): { week: number; year: number } => {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNumber + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

    // Determine the year for the week (ISO week year)
    const targetYear = target.getFullYear();
    return { week, year: targetYear };
  };

  const generateWeeksList = () => {
    const weeks = [];
    const today = new Date();

    // Generate 8 weeks before, current week, and 8 weeks after
    for (let i = -8; i <= 8; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + (i * 7));
      const { week, year } = getISOWeekAndYear(date);

      // Check if we already have this week in our list (avoid duplicates)
      if (!weeks.find(w => w.week_number === week && w.year === year)) {
        weeks.push({
          id: `generated-${year}-${week}`,
          week_number: week,
          year: year,
          status: 'draft',
          created_at: new Date().toISOString(),
          user_id: user?.id,
          isGenerated: true
        });
      }
    }

    // Sort by year descending, then week descending
    weeks.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week_number - a.week_number;
    });

    return weeks;
  };

  const loadWeekstaten = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('weekstaten')
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false });

    if (error) {
      toast.error('Fout bij het laden van weekstaten');
      return;
    }

    // Generate a list of all weeks (past 8 weeks + current + next 8 weeks)
    const generatedWeeks = generateWeeksList();

    // Merge with existing weekstaten from database
    const existingWeekstaten = data || [];
    const mergedWeekstaten = generatedWeeks.map(generatedWeek => {
      const existing = existingWeekstaten.find(
        w => w.week_number === generatedWeek.week_number && w.year === generatedWeek.year
      );
      return existing || generatedWeek;
    });

    setWeekstaten(mergedWeekstaten);
  };

  const loadWeekstaatDetails = async (weekstaat: any) => {
    // If it's a generated week (doesn't exist in DB yet), create it first
    if (weekstaat.isGenerated) {
      const { data, error } = await supabase
        .from('weekstaten')
        .insert([{
          user_id: user.id,
          week_number: weekstaat.week_number,
          year: weekstaat.year,
          status: 'draft'
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Already exists, fetch it
          const { data: existing } = await supabase
            .from('weekstaten')
            .select('*')
            .eq('user_id', user.id)
            .eq('week_number', weekstaat.week_number)
            .eq('year', weekstaat.year)
            .maybeSingle();

          if (existing) {
            setSelectedWeekstaat(existing);
            const { data: entriesData } = await supabase
              .from('weekstaat_entries')
              .select('*')
              .eq('weekstaat_id', existing.id);
            setEntries(entriesData || []);
            await loadWeekstaten(); // Refresh the list
          }
        } else {
          toast.error('Fout bij aanmaken weekstaat');
        }
        return;
      }

      setSelectedWeekstaat(data);
      setEntries([]);
      await loadWeekstaten(); // Refresh the list
      return;
    }

    // Load existing weekstaat
    const { data: weekstaatData } = await supabase
      .from('weekstaten')
      .select('*')
      .eq('id', weekstaat.id)
      .maybeSingle();

    setSelectedWeekstaat(weekstaatData);

    const { data: entriesData } = await supabase
      .from('weekstaat_entries')
      .select('*')
      .eq('weekstaat_id', weekstaat.id);

    setEntries(entriesData || []);
  };

  const createNewWeekstaat = async () => {
    console.log('Creating new weekstaat...', { user });
    if (!user) {
      toast.error('Gebruiker niet geladen');
      return;
    }
    const currentDate = new Date();
    const weekNumber = getISOWeek(currentDate);
    const year = currentDate.getFullYear();

    const { data, error } = await supabase
      .from('weekstaten')
      .insert([{
        user_id: user.id,
        week_number: weekNumber,
        year: year,
        status: 'draft'
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast.error('Er bestaat al een weekstaat voor deze week');
        const { data: existing } = await supabase
          .from('weekstaten')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_number', weekNumber)
          .eq('year', year)
          .maybeSingle();

        if (existing) {
          await loadWeekstaatDetails(existing);
        }
      } else {
        toast.error('Fout bij aanmaken weekstaat');
      }
      return;
    }

    toast.success('Weekstaat aangemaakt');
    await loadWeekstaten();
    await loadWeekstaatDetails(data);
  };

  const saveWeekstaat = async () => {
    if (!selectedWeekstaat) return;

    setLoading(true);
    try {
      // Delete existing entries
      await supabase
        .from('weekstaat_entries')
        .delete()
        .eq('weekstaat_id', selectedWeekstaat.id);

      // Insert new entries
      if (entries.length > 0) {
        const { error } = await supabase
          .from('weekstaat_entries')
          .insert(entries.map(entry => ({
            weekstaat_id: selectedWeekstaat.id,
            activity_code: entry.activity_code,
            activity_description: entry.activity_description,
            workorder_number: entry.workorder_number,
            monday: entry.monday,
            tuesday: entry.tuesday,
            wednesday: entry.wednesday,
            thursday: entry.thursday,
            friday: entry.friday,
            saturday: entry.saturday,
            sunday: entry.sunday
          })));

        if (error) throw error;
      }

      toast.success('Weekstaat opgeslagen');
    } catch (error) {
      console.error('Error saving weekstaat:', error);
      toast.error('Fout bij opslaan weekstaat');
    } finally {
      setLoading(false);
    }
  };

  const submitWeekstaat = async () => {
    if (!selectedWeekstaat) return;

    const { error } = await supabase
      .from('weekstaten')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', selectedWeekstaat.id);

    if (error) {
      toast.error('Fout bij indienen weekstaat');
      return;
    }

    toast.success('Weekstaat ingediend voor goedkeuring');
    setSelectedWeekstaat(null);
    loadWeekstaten();
  };

  const addEntry = () => {
    setEntries([...entries, {
      activity_code: '100',
      activity_description: 'Montage verdelers',
      workorder_number: '',
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    }]);
  };

  const updateEntry = (index: number, field: string, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const deleteEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  // ============ VERLOF FUNCTIONS ============

  const loadLeaveRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Fout bij laden verlofaanvragen');
      return;
    }

    setLeaveRequests(data || []);
  };

  const submitLeaveRequest = async () => {
    console.log('Submitting leave request...', { user, leaveForm });
    if (!user) {
      toast.error('Gebruiker niet geladen');
      return;
    }
    if (!leaveForm.start_date) {
      toast.error('Vul een startdatum in');
      return;
    }

    if (leaveForm.is_partial_day) {
      if (!leaveForm.start_time || !leaveForm.end_time) {
        toast.error('Vul start- en eindtijd in voor gedeeltelijke afwezigheid');
        return;
      }
      if (!leaveForm.end_date) {
        leaveForm.end_date = leaveForm.start_date;
      }
    } else {
      if (!leaveForm.end_date) {
        toast.error('Vul een einddatum in');
        return;
      }
    }

    let daysCount = 0;
    let hoursCount = null;

    if (leaveForm.is_partial_day) {
      const startTime = leaveForm.start_time.split(':');
      const endTime = leaveForm.end_time.split(':');
      const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
      const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
      hoursCount = (endMinutes - startMinutes) / 60;

      if (hoursCount <= 0) {
        toast.error('Eindtijd moet na de starttijd zijn');
        return;
      }
    } else {
      daysCount = calculateDays(leaveForm.start_date, leaveForm.end_date);
    }

    const { error } = await supabase
      .from('leave_requests')
      .insert([{
        user_id: user.id,
        leave_type: leaveForm.leave_type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        is_partial_day: leaveForm.is_partial_day,
        start_time: leaveForm.is_partial_day ? leaveForm.start_time : null,
        end_time: leaveForm.is_partial_day ? leaveForm.end_time : null,
        days_count: daysCount,
        hours_count: hoursCount,
        description: leaveForm.description,
        status: 'pending',
        submitted_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error submitting leave request:', error);
      toast.error('Fout bij indienen verlofaanvraag');
      return;
    }

    toast.success('Verlofaanvraag ingediend');
    setShowLeaveForm(false);
    setLeaveForm({ leave_type: 'sick', start_date: '', end_date: '', is_partial_day: false, start_time: '', end_time: '', description: '' });
    loadLeaveRequests();
  };

  const deleteLeaveRequest = async (id: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fout bij verwijderen');
      return;
    }

    toast.success('Verlofaanvraag verwijderd');
    loadLeaveRequests();
  };

  // ============ VAKANTIE FUNCTIONS ============

  const loadVacationRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('vacation_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false});

    if (error) {
      toast.error('Fout bij laden vakantieaanvragen');
      return;
    }

    setVacationRequests(data || []);
  };

  const loadVacationBalance = async () => {
    if (!user) return;

    const currentYear = new Date().getFullYear();

    let { data, error } = await supabase
      .from('user_vacation_balance')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', currentYear)
      .maybeSingle();

    if (error) {
      console.error('Error loading vacation balance:', error);
      return;
    }

    if (!data) {
      const { data: newBalance, error: createError } = await supabase
        .from('user_vacation_balance')
        .insert([{
          user_id: user.id,
          year: currentYear,
          total_days: 25.0,
          used_days: 0,
          pending_days: 0
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating vacation balance:', createError);
        return;
      }

      data = newBalance;
    }

    setVacationBalance(data);
  };

  const submitVacationRequest = async () => {
    console.log('Submitting vacation request...', { user, vacationForm });
    if (!user) {
      toast.error('Gebruiker niet geladen');
      return;
    }
    if (!vacationForm.start_date || !vacationForm.end_date) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    const daysCount = calculateDays(vacationForm.start_date, vacationForm.end_date);

    // Check if enough days available
    if (vacationBalance && (vacationBalance.available_days < daysCount)) {
      toast.error(`Onvoldoende vakantiedagen beschikbaar (${vacationBalance.available_days} beschikbaar)`);
      return;
    }

    const { error } = await supabase
      .from('vacation_requests')
      .insert([{
        user_id: user.id,
        start_date: vacationForm.start_date,
        end_date: vacationForm.end_date,
        days_count: daysCount,
        description: vacationForm.description,
        status: 'pending',
        submitted_at: new Date().toISOString()
      }]);

    if (error) {
      toast.error('Fout bij indienen vakantieaanvraag');
      return;
    }

    toast.success('Vakantieaanvraag ingediend');
    setShowVacationForm(false);
    setVacationForm({ start_date: '', end_date: '', description: '' });
    loadVacationRequests();
    loadVacationBalance();
  };

  const deleteVacationRequest = async (id: string) => {
    const { error } = await supabase
      .from('vacation_requests')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fout bij verwijderen');
      return;
    }

    toast.success('Vakantieaanvraag verwijderd');
    loadVacationRequests();
    loadVacationBalance();
  };

  // ============ UTILITY FUNCTIONS ============

  const getISOWeek = (date: Date) => {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNumber + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'submitted': return 'bg-blue-500/20 text-blue-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'declined': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Concept';
      case 'pending': return 'In afwachting';
      case 'submitted': return 'Ingediend';
      case 'approved': return 'Goedgekeurd';
      case 'declined': return 'Afgekeurd';
      default: return status;
    }
  };

  const calculateTotals = () => {
    const totals = {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
      total: 0
    };

    entries.forEach(entry => {
      totals.monday += parseFloat(entry.monday.toString()) || 0;
      totals.tuesday += parseFloat(entry.tuesday.toString()) || 0;
      totals.wednesday += parseFloat(entry.wednesday.toString()) || 0;
      totals.thursday += parseFloat(entry.thursday.toString()) || 0;
      totals.friday += parseFloat(entry.friday.toString()) || 0;
      totals.saturday += parseFloat(entry.saturday.toString()) || 0;
      totals.sunday += parseFloat(entry.sunday.toString()) || 0;
    });

    totals.total = totals.monday + totals.tuesday + totals.wednesday + totals.thursday +
                   totals.friday + totals.saturday + totals.sunday;

    return totals;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Urenstaat & Verlof</h1>
        <p className="text-gray-400">Beheer uw urenregistratie, verlof en vakantiedagen</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('weekstaat')}
          className={`px-6 py-3 font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'weekstaat'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span>Weekstaat</span>
        </button>
        <button
          onClick={() => setActiveTab('verlof')}
          className={`px-6 py-3 font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'verlof'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Umbrella className="w-5 h-5" />
          <span>Verlof</span>
        </button>
        <button
          onClick={() => setActiveTab('vakantie')}
          className={`px-6 py-3 font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'vakantie'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sun className="w-5 h-5" />
          <span>Vakantiedagen</span>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'weekstaat' && (
        <div className="space-y-6">
          {/* Weekstaat List */}
          {!selectedWeekstaat && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Mijn Weekstaten</h2>
                <button onClick={createNewWeekstaat} className="btn-primary flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Nieuwe Weekstaat</span>
                </button>
              </div>

              <div className="space-y-3">
                {weekstaten.map(weekstaat => (
                  <div
                    key={weekstaat.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#2A303C] hover:bg-[#323944] transition-colors cursor-pointer"
                    onClick={() => loadWeekstaatDetails(weekstaat)}
                  >
                    <div className="flex items-center space-x-4">
                      <Calendar className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-medium text-white">
                          Week {weekstaat.week_number} - {weekstaat.year}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(weekstaat.created_at).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(weekstaat.status)}`}>
                      {getStatusLabel(weekstaat.status)}
                    </span>
                  </div>
                ))}
                {weekstaten.length === 0 && (
                  <p className="text-center text-gray-400 py-8">
                    Nog geen weekstaten aangemaakt. Klik op "Nieuwe Weekstaat" om te beginnen.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Weekstaat Editor - continues in next message due to length */}
          {selectedWeekstaat && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Week {selectedWeekstaat.week_number} - {selectedWeekstaat.year}
                    </h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${getStatusColor(selectedWeekstaat.status)}`}>
                      {getStatusLabel(selectedWeekstaat.status)}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedWeekstaat(null);
                      setEntries([]);
                    }}
                    className="btn-secondary"
                  >
                    Terug
                  </button>
                </div>

                {selectedWeekstaat.status === 'rejected' && selectedWeekstaat.rejection_reason && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <h3 className="text-red-400 font-semibold mb-2">Afgekeurd - Aanpassingen vereist</h3>
                    <p className="text-red-300 text-sm mb-1"><strong>Reden:</strong></p>
                    <p className="text-red-200">{selectedWeekstaat.rejection_reason}</p>
                    <p className="text-gray-400 text-sm mt-2">Pas de weekstaat aan en dien deze opnieuw in.</p>
                  </div>
                )}

                {(selectedWeekstaat.status === 'draft' || selectedWeekstaat.status === 'rejected') && (
                  <div className="mb-4 flex items-center justify-between">
                    <button onClick={addEntry} className="btn-secondary flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Regel toevoegen</span>
                    </button>
                    <div className="flex space-x-3">
                      <button
                        onClick={saveWeekstaat}
                        disabled={loading}
                        className="btn-secondary flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Opslaan</span>
                      </button>
                      <button
                        onClick={submitWeekstaat}
                        disabled={entries.length === 0}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>{selectedWeekstaat.status === 'rejected' ? 'Opnieuw indienen' : 'Indienen'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left p-2 text-gray-400 text-sm">Code</th>
                            <th className="text-left p-2 text-gray-400 text-sm">Activiteit</th>
                            <th className="text-left p-2 text-gray-400 text-sm">Werknr</th>
                            <th className="text-center p-2 text-gray-400 text-sm">Ma</th>
                            <th className="text-center p-2 text-gray-400 text-sm">Di</th>
                            <th className="text-center p-2 text-gray-400 text-sm">Wo</th>
                            <th className="text-center p-2 text-gray-400 text-sm">Do</th>
                            <th className="text-center p-2 text-gray-400 text-sm">Vr</th>
                            <th className="text-center p-2 text-gray-400 text-sm">Za</th>
                            <th className="text-center p-2 text-gray-400 text-sm">Zo</th>
                            <th className="text-center p-2 text-gray-400 text-sm"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry, index) => (
                            <tr key={index} className="border-b border-gray-800">
                              <td className="p-2">
                                {selectedWeekstaat.status === 'draft' || selectedWeekstaat.status === 'rejected' ? (
                                  <select
                                    value={entry.activity_code}
                                    onChange={(e) => {
                                      const code = ACTIVITY_CODES.find(c => c.code === e.target.value);
                                      updateEntry(index, 'activity_code', e.target.value);
                                      updateEntry(index, 'activity_description', code?.description || '');
                                    }}
                                    className="input-field text-sm"
                                  >
                                    {ACTIVITY_CODES.map(code => (
                                      <option key={code.code} value={code.code}>
                                        {code.code}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-white">{entry.activity_code}</span>
                                )}
                              </td>
                              <td className="p-2">
                                {selectedWeekstaat.status === 'draft' || selectedWeekstaat.status === 'rejected' ? (
                                  <input
                                    type="text"
                                    value={entry.activity_description}
                                    onChange={(e) => updateEntry(index, 'activity_description', e.target.value)}
                                    className="input-field text-sm"
                                  />
                                ) : (
                                  <span className="text-white">{entry.activity_description}</span>
                                )}
                              </td>
                              <td className="p-2">
                                {selectedWeekstaat.status === 'draft' || selectedWeekstaat.status === 'rejected' ? (
                                  <input
                                    type="text"
                                    value={entry.workorder_number}
                                    onChange={(e) => updateEntry(index, 'workorder_number', e.target.value)}
                                    className="input-field text-sm"
                                    placeholder="Werknr"
                                  />
                                ) : (
                                  <span className="text-white">{entry.workorder_number || '-'}</span>
                                )}
                              </td>
                              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                <td key={day} className="p-2">
                                  {selectedWeekstaat.status === 'draft' || selectedWeekstaat.status === 'rejected' ? (
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max="24"
                                      value={entry[day as keyof WeekstaatEntry] || 0}
                                      onChange={(e) => updateEntry(index, day, parseFloat(e.target.value) || 0)}
                                      className="input-field text-sm text-center w-16"
                                    />
                                  ) : (
                                    <span className="text-white text-center block">{entry[day as keyof WeekstaatEntry] || '-'}</span>
                                  )}
                                </td>
                              ))}
                              {(selectedWeekstaat.status === 'draft' || selectedWeekstaat.status === 'rejected') && (
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => deleteEntry(index)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                          {/* Totals Row */}
                          {entries.length > 0 && (
                            <tr className="bg-purple-500/10 font-semibold">
                              <td colSpan={3} className="p-2 text-right text-white">Totaal:</td>
                              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                const totals = calculateTotals();
                                return (
                                  <td key={day} className="p-2 text-center text-white">
                                    {totals[day as keyof typeof totals].toFixed(1)}
                                  </td>
                                );
                              })}
                              <td className="p-2 text-center text-purple-400">
                                {calculateTotals().total.toFixed(1)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VERLOF TAB - Due to length, continuing in a logical break point */}

      {activeTab === 'verlof' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Verlofaanvragen</h2>
              <button onClick={() => setShowLeaveForm(true)} className="btn-primary flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Nieuwe Aanvraag</span>
              </button>
            </div>

            <div className="space-y-3">
              {leaveRequests.map(request => (
                <div key={request.id} className="p-4 rounded-lg bg-[#2A303C] flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                      <span className="font-medium text-white">
                        {LEAVE_TYPES.find(t => t.code === request.leave_type)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {request.is_partial_day ? (
                        <>
                          {new Date(request.start_date).toLocaleDateString('nl-NL')} van {request.start_time?.substring(0, 5)} tot {request.end_time?.substring(0, 5)}
                          {request.hours_count && ` (${request.hours_count} uur)`}
                        </>
                      ) : (
                        <>
                          {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                          ({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})
                        </>
                      )}
                    </p>
                    {request.description && (
                      <p className="text-sm text-gray-500 mt-1">{request.description}</p>
                    )}
                    {request.status === 'declined' && request.rejection_reason && (
                      <p className="text-sm text-red-400 mt-2">Reden afwijzing: {request.rejection_reason}</p>
                    )}
                  </div>
                  {request.status === 'pending' && (
                    <button
                      onClick={() => deleteLeaveRequest(request.id)}
                      className="text-red-400 hover:text-red-300 ml-4"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {leaveRequests.length === 0 && (
                <p className="text-center text-gray-400 py-8">
                  Nog geen verlofaanvragen ingediend.
                </p>
              )}
            </div>
          </div>

          {/* Leave Form Modal */}
          {showLeaveForm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
              <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-2xl w-full p-6">
                <h3 className="text-xl font-bold text-white mb-4">Nieuwe Verlofaanvraag</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Type Verlof</label>
                    <select
                      value={leaveForm.leave_type}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                      className="input-field"
                    >
                      {LEAVE_TYPES.map(type => (
                        <option key={type.code} value={type.code}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-[#2A303C] rounded-lg">
                    <input
                      type="checkbox"
                      id="partial-day"
                      checked={leaveForm.is_partial_day}
                      onChange={(e) => setLeaveForm({ ...leaveForm, is_partial_day: e.target.checked })}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="partial-day" className="text-sm text-gray-300 cursor-pointer">
                      Gedeeltelijke dag (bijv. tandarts, doktersafspraak)
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        {leaveForm.is_partial_day ? 'Datum' : 'Startdatum'}
                      </label>
                      <input
                        type="date"
                        value={leaveForm.start_date}
                        onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    {!leaveForm.is_partial_day && (
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Einddatum</label>
                        <input
                          type="date"
                          value={leaveForm.end_date}
                          onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                          className="input-field"
                        />
                      </div>
                    )}
                  </div>

                  {leaveForm.is_partial_day && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Van (tijd)</label>
                        <input
                          type="time"
                          value={leaveForm.start_time}
                          onChange={(e) => setLeaveForm({ ...leaveForm, start_time: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Tot (tijd)</label>
                        <input
                          type="time"
                          value={leaveForm.end_time}
                          onChange={(e) => setLeaveForm({ ...leaveForm, end_time: e.target.value })}
                          className="input-field"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Toelichting (optioneel)</label>
                    <textarea
                      value={leaveForm.description}
                      onChange={(e) => setLeaveForm({ ...leaveForm, description: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Extra informatie..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowLeaveForm(false);
                      setLeaveForm({ leave_type: 'sick', start_date: '', end_date: '', is_partial_day: false, start_time: '', end_time: '', description: '' });
                    }}
                    className="btn-secondary"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={submitLeaveRequest}
                    className="btn-primary"
                  >
                    Indienen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VAKANTIE TAB */}
      {activeTab === 'vakantie' && (
        <div className="space-y-6">
          {/* Vacation Balance Card */}
          {vacationBalance && (
            <div className="card p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <h2 className="text-xl font-semibold text-white mb-4">Vakantiedagen Saldo {vacationBalance.year}</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-400">{vacationBalance.total_days}</p>
                  <p className="text-sm text-gray-400 mt-1">Totaal</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">{vacationBalance.available_days}</p>
                  <p className="text-sm text-gray-400 mt-1">Beschikbaar</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">{vacationBalance.pending_days}</p>
                  <p className="text-sm text-gray-400 mt-1">In afwachting</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-400">{vacationBalance.used_days}</p>
                  <p className="text-sm text-gray-400 mt-1">Gebruikt</p>
                </div>
              </div>
            </div>
          )}

          {!vacationBalance && (
            <div className="card p-6 text-center text-gray-400">
              <p>Geen vakantiedagen saldo beschikbaar. Neem contact op met de administratie.</p>
            </div>
          )}

          {/* Vacation Requests */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Vakantieaanvragen</h2>
              <button
                onClick={() => setShowVacationForm(true)}
                className="btn-primary flex items-center space-x-2"
                disabled={!vacationBalance || vacationBalance.available_days <= 0}
              >
                <Plus className="w-5 h-5" />
                <span>Nieuwe Aanvraag</span>
              </button>
            </div>

            <div className="space-y-3">
              {vacationRequests.map(request => (
                <div key={request.id} className="p-4 rounded-lg bg-[#2A303C] flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 font-medium">
                      {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                      ({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})
                    </p>
                    {request.description && (
                      <p className="text-sm text-gray-500 mt-1">{request.description}</p>
                    )}
                    {request.status === 'declined' && request.rejection_reason && (
                      <p className="text-sm text-red-400 mt-2">Reden afwijzing: {request.rejection_reason}</p>
                    )}
                  </div>
                  {request.status === 'pending' && (
                    <button
                      onClick={() => deleteVacationRequest(request.id)}
                      className="text-red-400 hover:text-red-300 ml-4"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              {vacationRequests.length === 0 && (
                <p className="text-center text-gray-400 py-8">
                  Nog geen vakantieaanvragen ingediend.
                </p>
              )}
            </div>
          </div>

          {/* Vacation Form Modal */}
          {showVacationForm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
              <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-2xl w-full p-6">
                <h3 className="text-xl font-bold text-white mb-4">Nieuwe Vakantieaanvraag</h3>

                {vacationBalance && (
                  <div className="mb-4 p-3 bg-purple-500/10 rounded-lg">
                    <p className="text-sm text-gray-300">
                      Beschikbare vakantiedagen: <span className="font-bold text-purple-400">{vacationBalance.available_days}</span>
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Startdatum</label>
                      <input
                        type="date"
                        value={vacationForm.start_date}
                        onChange={(e) => setVacationForm({ ...vacationForm, start_date: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Einddatum</label>
                      <input
                        type="date"
                        value={vacationForm.end_date}
                        onChange={(e) => setVacationForm({ ...vacationForm, end_date: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  {vacationForm.start_date && vacationForm.end_date && (
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <p className="text-sm text-gray-300">
                        Aantal dagen: <span className="font-bold text-blue-400">
                          {calculateDays(vacationForm.start_date, vacationForm.end_date)}
                        </span>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Toelichting (optioneel)</label>
                    <textarea
                      value={vacationForm.description}
                      onChange={(e) => setVacationForm({ ...vacationForm, description: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Extra informatie..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowVacationForm(false);
                      setVacationForm({ start_date: '', end_date: '', description: '' });
                    }}
                    className="btn-secondary"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={submitVacationRequest}
                    className="btn-primary"
                  >
                    Indienen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
