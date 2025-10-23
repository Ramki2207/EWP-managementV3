import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Calendar as CalendarIcon, Check, X, Users, FileText, Umbrella, Sun, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

type TabType = 'agenda' | 'weekstaten' | 'verlof' | 'vakantie';

interface DayEvent {
  type: 'weekstaat' | 'verlof' | 'vakantie' | 'project';
  user: any;
  data: any;
  hours?: number;
}

export default function Personeelsbeheer() {
  const [activeTab, setActiveTab] = useState<TabType>('agenda');
  const [users, setUsers] = useState<any[]>([]);
  const [weekstaten, setWeekstaten] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [vacationRequests, setVacationRequests] = useState<any[]>([]);
  const [workEntries, setWorkEntries] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadUsers();
    if (activeTab === 'weekstaten') {
      loadWeekstaten();
    } else if (activeTab === 'verlof') {
      loadLeaveRequests();
    } else if (activeTab === 'vakantie') {
      loadVacationRequests();
    } else if (activeTab === 'agenda') {
      loadAllData();
    }
  }, [activeTab, selectedMonth]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('name');
    setUsers(data || []);
  };

  const loadWeekstaten = async () => {
    const { data, error } = await supabase
      .from('weekstaten')
      .select(`
        *,
        user:users(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading weekstaten:', error);
      toast.error('Fout bij laden weekstaten');
      return;
    }

    console.log('Loaded weekstaten:', data);
    setWeekstaten(data || []);
  };

  const loadLeaveRequests = async () => {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        user:users(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading leave requests:', error);
      toast.error('Fout bij laden verlofaanvragen');
      return;
    }

    console.log('Loaded leave requests:', data);
    setLeaveRequests(data || []);
  };

  const loadVacationRequests = async () => {
    const { data } = await supabase
      .from('vacation_requests')
      .select(`
        *,
        user:users(id, name, email)
      `)
      .order('created_at', { ascending: false});
    
    setVacationRequests(data || []);
  };

  const loadAllData = async () => {
    await Promise.all([
      loadWeekstaten(),
      loadLeaveRequests(),
      loadVacationRequests(),
      loadWorkEntries(),
      loadProjects()
    ]);
  };

  const loadWorkEntries = async () => {
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

    const { data } = await supabase
      .from('work_entries')
      .select(`
        *,
        user:users(id, name),
        distributor:distributors(id, distributor_id, kast_naam)
      `)
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0]);

    setWorkEntries(data || []);
  };

  const loadProjects = async () => {
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

    const { data } = await supabase
      .from('projects')
      .select('id, name, verwachte_leverdatum, client:clients(name)')
      .not('verwachte_leverdatum', 'is', null)
      .gte('verwachte_leverdatum', startOfMonth.toISOString().split('T')[0])
      .lte('verwachte_leverdatum', endOfMonth.toISOString().split('T')[0]);

    setProjects(data || []);
  };

  const approveWeekstaat = async (id: string) => {
    const { error } = await supabase
      .from('weekstaten')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId')
      })
      .eq('id', id);

    if (error) {
      toast.error('Fout bij goedkeuren');
      return;
    }

    toast.success('Weekstaat goedgekeurd');
    loadWeekstaten();
  };

  const declineWeekstaat = async (id: string) => {
    const { error } = await supabase
      .from('weekstaten')
      .update({
        status: 'declined',
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId')
      })
      .eq('id', id);

    if (error) {
      toast.error('Fout bij afkeuren');
      return;
    }

    toast.success('Weekstaat afgekeurd');
    loadWeekstaten();
  };

  const approveLeaveRequest = async (id: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId')
      })
      .eq('id', id);

    if (error) {
      toast.error('Fout bij goedkeuren');
      return;
    }

    toast.success('Verlofaanvraag goedgekeurd');
    loadLeaveRequests();
    setSelectedRequest(null);
  };

  const declineLeaveRequest = async (id: string, reason: string) => {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'declined',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId')
      })
      .eq('id', id);

    if (error) {
      toast.error('Fout bij afkeuren');
      return;
    }

    toast.success('Verlofaanvraag afgekeurd');
    loadLeaveRequests();
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const approveVacationRequest = async (id: string) => {
    const { error } = await supabase
      .from('vacation_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId')
      })
      .eq('id', id);

    if (error) {
      toast.error('Fout bij goedkeuren');
      return;
    }

    toast.success('Vakantieaanvraag goedgekeurd');
    loadVacationRequests();
    setSelectedRequest(null);
  };

  const declineVacationRequest = async (id: string, reason: string) => {
    const { error } = await supabase
      .from('vacation_requests')
      .update({
        status: 'declined',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId')
      })
      .eq('id', id);

    if (error) {
      toast.error('Fout bij afkeuren');
      return;
    }

    toast.success('Vakantieaanvraag afgekeurd');
    loadVacationRequests();
    setSelectedRequest(null);
    setRejectionReason('');
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

  const generateCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);
    
    const days = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDay = (date: Date): DayEvent[] => {
    const events: DayEvent[] = [];
    const dateStr = date.toISOString().split('T')[0];

    // Add leave requests
    leaveRequests.forEach(request => {
      if (request.status === 'approved' && 
          dateStr >= request.start_date && 
          dateStr <= request.end_date) {
        events.push({
          type: 'verlof',
          user: request.user,
          data: request
        });
      }
    });

    // Add vacation requests
    vacationRequests.forEach(request => {
      if (request.status === 'approved' && 
          dateStr >= request.start_date && 
          dateStr <= request.end_date) {
        events.push({
          type: 'vakantie',
          user: request.user,
          data: request
        });
      }
    });

    // Add work entries (verdeler assignments)
    workEntries.forEach(entry => {
      if (entry.date === dateStr) {
        events.push({
          type: 'project',
          user: entry.user,
          data: entry,
          hours: parseFloat(entry.hours || 0)
        });
      }
    });

    // Add project delivery dates
    projects.forEach(project => {
      if (project.verwachte_leverdatum === dateStr) {
        events.push({
          type: 'project',
          user: null,
          data: {
            ...project,
            isDeliveryDate: true
          }
        });
      }
    });

    return events;
  };

  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const pendingCount = {
    weekstaten: weekstaten.filter(w => w.status === 'submitted').length,
    verlof: leaveRequests.filter(r => r.status === 'pending').length,
    vakantie: vacationRequests.filter(r => r.status === 'pending').length
  };

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Personeelsbeheer</h1>
        <p className="text-gray-400">Overzicht van uren, verlof en vakantiedagen van alle medewerkers</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`px-6 py-3 font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'agenda'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span>Agenda</span>
        </button>
        <button
          onClick={() => setActiveTab('weekstaten')}
          className={`px-6 py-3 font-medium transition-colors flex items-center space-x-2 relative ${
            activeTab === 'weekstaten'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Weekstaten</span>
          {pendingCount.weekstaten > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingCount.weekstaten}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('verlof')}
          className={`px-6 py-3 font-medium transition-colors flex items-center space-x-2 relative ${
            activeTab === 'verlof'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Umbrella className="w-5 h-5" />
          <span>Verlof</span>
          {pendingCount.verlof > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingCount.verlof}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('vakantie')}
          className={`px-6 py-3 font-medium transition-colors flex items-center space-x-2 relative ${
            activeTab === 'vakantie'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sun className="w-5 h-5" />
          <span>Vakantiedagen</span>
          {pendingCount.vakantie > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {pendingCount.vakantie}
            </span>
          )}
        </button>
      </div>

      {/* AGENDA TAB */}
      {activeTab === 'agenda' && (
        <div className="space-y-6">
          {/* Month Navigation */}
          <div className="card p-4 flex items-center justify-between">
            <button onClick={previousMonth} className="btn-secondary p-2">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-white">
              {selectedMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="btn-secondary p-2">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="card p-6">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-400 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {generateCalendarDays().map((day, index) => {
                const isCurrentMonth = day.getMonth() === selectedMonth.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();
                const events = getEventsForDay(day);

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 rounded-lg border transition-colors ${
                      isCurrentMonth
                        ? isToday
                          ? 'bg-purple-500/10 border-purple-500'
                          : 'bg-[#2A303C] border-gray-700 hover:border-gray-600'
                        : 'bg-[#1a1f2a] border-gray-800 opacity-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-400 mb-1">
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {events.map((event, idx) => (
                        <div
                          key={idx}
                          className={`text-xs p-1 rounded ${
                            event.type === 'verlof'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : event.type === 'vakantie'
                              ? 'bg-blue-500/20 text-blue-300'
                              : event.data?.isDeliveryDate
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}
                          title={
                            event.data?.isDeliveryDate
                              ? `Leverdatum: ${event.data.name} (${event.data.client?.name})`
                              : `${event.user?.name || 'Unknown'}: ${
                                  event.type === 'project'
                                    ? `${event.data.distributor?.distributor_id || 'Project'} (${event.hours}u)`
                                    : event.type
                                }`
                          }
                        >
                          <div className="truncate">
                            {event.data?.isDeliveryDate
                              ? `📦 ${event.data.name}`
                              : event.user?.name?.split(' ')[0]
                            }
                            {event.type === 'project' && event.hours ? ` (${event.hours}u)` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-yellow-500/20"></div>
                <span className="text-gray-400">Verlof</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-blue-500/20"></div>
                <span className="text-gray-400">Vakantie</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-green-500/20"></div>
                <span className="text-gray-400">Werkopdracht</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-purple-500/20"></div>
                <span className="text-gray-400">Leverdatum</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WEEKSTATEN TAB */}
      {activeTab === 'weekstaten' && (
        <div className="space-y-6">
          {/* Pending Weekstaten */}
          {weekstaten.filter(w => w.status === 'submitted').length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span>Te Beoordelen ({pendingCount.weekstaten})</span>
              </h2>
              <div className="space-y-3">
                {weekstaten
                  .filter(w => w.status === 'submitted')
                  .map(weekstaat => (
                    <div key={weekstaat.id} className="p-4 rounded-lg bg-[#2A303C] flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Users className="w-5 h-5 text-purple-400" />
                          <span className="font-medium text-white">{weekstaat.user?.name}</span>
                          <span className="text-sm text-gray-400">
                            Week {weekstaat.week_number} - {weekstaat.year}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Ingediend: {new Date(weekstaat.submitted_at).toLocaleString('nl-NL')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => declineWeekstaat(weekstaat.id)}
                          className="btn-secondary text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Afkeuren</span>
                        </button>
                        <button
                          onClick={() => approveWeekstaat(weekstaat.id)}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Goedkeuren</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* All Weekstaten */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Alle Weekstaten</h2>
            <div className="space-y-3">
              {weekstaten.map(weekstaat => (
                <div key={weekstaat.id} className="p-4 rounded-lg bg-[#2A303C] flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(weekstaat.status)}`}>
                        {getStatusLabel(weekstaat.status)}
                      </span>
                      <span className="font-medium text-white">{weekstaat.user?.name}</span>
                      <span className="text-sm text-gray-400">
                        Week {weekstaat.week_number} - {weekstaat.year}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {weekstaat.submitted_at 
                        ? `Ingediend: ${new Date(weekstaat.submitted_at).toLocaleDateString('nl-NL')}`
                        : 'Nog niet ingediend'}
                    </p>
                  </div>
                </div>
              ))}
              {weekstaten.length === 0 && (
                <p className="text-center text-gray-400 py-8">Geen weekstaten gevonden</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VERLOF TAB */}
      {activeTab === 'verlof' && (
        <div className="space-y-6">
          {/* Pending Leave Requests */}
          {leaveRequests.filter(r => r.status === 'pending').length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span>Te Beoordelen ({pendingCount.verlof})</span>
              </h2>
              <div className="space-y-3">
                {leaveRequests
                  .filter(r => r.status === 'pending')
                  .map(request => (
                    <div key={request.id} className="p-4 rounded-lg bg-[#2A303C]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Users className="w-5 h-5 text-purple-400" />
                          <span className="font-medium text-white">{request.user?.name}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRequest({ ...request, type: 'leave', action: 'decline' })}
                            className="btn-secondary text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Afkeuren</span>
                          </button>
                          <button
                            onClick={() => approveLeaveRequest(request.id)}
                            className="btn-primary flex items-center space-x-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Goedkeuren</span>
                          </button>
                        </div>
                      </div>
                      <div className="ml-8 space-y-1">
                        <p className="text-sm text-gray-300">
                          {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                          <span className="ml-2 text-gray-400">
                            ({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})
                          </span>
                        </p>
                        {request.description && (
                          <p className="text-sm text-gray-400">{request.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* All Leave Requests */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Alle Verlofaanvragen</h2>
            <div className="space-y-3">
              {leaveRequests.map(request => (
                <div key={request.id} className="p-4 rounded-lg bg-[#2A303C]">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                    <span className="font-medium text-white">{request.user?.name}</span>
                  </div>
                  <p className="text-sm text-gray-400 ml-3">
                    {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                    ({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})
                  </p>
                  {request.description && (
                    <p className="text-sm text-gray-500 ml-3 mt-1">{request.description}</p>
                  )}
                  {request.status === 'declined' && request.rejection_reason && (
                    <p className="text-sm text-red-400 ml-3 mt-2">
                      Reden afwijzing: {request.rejection_reason}
                    </p>
                  )}
                </div>
              ))}
              {leaveRequests.length === 0 && (
                <p className="text-center text-gray-400 py-8">Geen verlofaanvragen gevonden</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VAKANTIE TAB */}
      {activeTab === 'vakantie' && (
        <div className="space-y-6">
          {/* Pending Vacation Requests */}
          {vacationRequests.filter(r => r.status === 'pending').length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span>Te Beoordelen ({pendingCount.vakantie})</span>
              </h2>
              <div className="space-y-3">
                {vacationRequests
                  .filter(r => r.status === 'pending')
                  .map(request => (
                    <div key={request.id} className="p-4 rounded-lg bg-[#2A303C]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Users className="w-5 h-5 text-purple-400" />
                          <span className="font-medium text-white">{request.user?.name}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRequest({ ...request, type: 'vacation', action: 'decline' })}
                            className="btn-secondary text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                          >
                            <X className="w-4 h-4" />
                            <span>Afkeuren</span>
                          </button>
                          <button
                            onClick={() => approveVacationRequest(request.id)}
                            className="btn-primary flex items-center space-x-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>Goedkeuren</span>
                          </button>
                        </div>
                      </div>
                      <div className="ml-8 space-y-1">
                        <p className="text-sm text-gray-300">
                          {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                          <span className="ml-2 text-gray-400">
                            ({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})
                          </span>
                        </p>
                        {request.description && (
                          <p className="text-sm text-gray-400">{request.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* All Vacation Requests */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Alle Vakantieaanvragen</h2>
            <div className="space-y-3">
              {vacationRequests.map(request => (
                <div key={request.id} className="p-4 rounded-lg bg-[#2A303C]">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                    <span className="font-medium text-white">{request.user?.name}</span>
                  </div>
                  <p className="text-sm text-gray-400 ml-3">
                    {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                    ({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})
                  </p>
                  {request.description && (
                    <p className="text-sm text-gray-500 ml-3 mt-1">{request.description}</p>
                  )}
                  {request.status === 'declined' && request.rejection_reason && (
                    <p className="text-sm text-red-400 ml-3 mt-2">
                      Reden afwijzing: {request.rejection_reason}
                    </p>
                  )}
                </div>
              ))}
              {vacationRequests.length === 0 && (
                <p className="text-center text-gray-400 py-8">Geen vakantieaanvragen gevonden</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedRequest && selectedRequest.action === 'decline' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Reden voor Afwijzing</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-field mb-4"
              rows={4}
              placeholder="Geef een reden voor de afwijzing..."
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast.error('Geef een reden op');
                    return;
                  }
                  if (selectedRequest.type === 'leave') {
                    declineLeaveRequest(selectedRequest.id, rejectionReason);
                  } else {
                    declineVacationRequest(selectedRequest.id, rejectionReason);
                  }
                }}
                className="btn-primary bg-red-600 hover:bg-red-700"
              >
                Afkeuren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
