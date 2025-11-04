import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Calendar as CalendarIcon, Check, X, Users, FileText, Umbrella, Sun, ChevronLeft, ChevronRight, Clock, ExternalLink } from 'lucide-react';

type TabType = 'agenda' | 'weekstaten' | 'verlof' | 'vakantie';

interface DayEvent {
  type: 'weekstaat' | 'verlof' | 'vakantie' | 'project';
  user: any;
  data: any;
  hours?: number;
}

export default function Personeelsbeheer() {
  const navigate = useNavigate();
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
  const [hoveredProject, setHoveredProject] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [projectVerdelers, setProjectVerdelers] = useState<any[]>([]);
  const [draggedProject, setDraggedProject] = useState<any>(null);
  const [selectedWorkEntry, setSelectedWorkEntry] = useState<any>(null);
  const [workEntryDetails, setWorkEntryDetails] = useState<any>(null);

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
      .order('username');
    setUsers(data || []);
  };

  const loadWeekstaten = async () => {
    const { data, error } = await supabase
      .from('weekstaten')
      .select(`
        *,
        user:users!weekstaten_user_id_fkey(id, username, email)
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
        user:users!leave_requests_user_id_fkey(id, username, email)
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
    const { data, error } = await supabase
      .from('vacation_requests')
      .select(`
        *,
        user:users!vacation_requests_user_id_fkey(id, username, email)
      `)
      .order('created_at', { ascending: false});

    if (error) {
      console.error('Error loading vacation requests:', error);
      toast.error('Fout bij laden vakantieaanvragen');
      return;
    }

    console.log('Loaded vacation requests:', data);
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

    const { data, error } = await supabase
      .from('work_entries')
      .select(`
        *,
        user:users(id, username),
        distributor:distributors(id, distributor_id, kast_naam, project_id)
      `)
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0]);

    if (error) {
      console.error('Error loading work entries:', error);
    }

    setWorkEntries(data || []);
  };

  const loadProjects = async () => {
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('projects')
      .select('id, project_number, client, location, status, description, contact_person, expected_delivery_date')
      .not('expected_delivery_date', 'is', null)
      .gte('expected_delivery_date', startOfMonth.toISOString().split('T')[0])
      .lte('expected_delivery_date', endOfMonth.toISOString().split('T')[0]);

    if (error) {
      console.error('Error loading projects:', error);
    }

    console.log('Loaded projects:', data);
    setProjects(data || []);
  };

  const loadProjectVerdelers = async (projectId: string) => {
    console.log('🔍 Loading verdelers for project ID:', projectId);

    const { data, error } = await supabase
      .from('distributors')
      .select('id, distributor_id, kast_naam, toegewezen_monteur')
      .eq('project_id', projectId)
      .order('distributor_id');

    if (error) {
      console.error('❌ Error loading project verdelers:', error);
      toast.error('Fout bij laden verdelers');
      return;
    }

    console.log('✅ Loaded verdelers:', data?.length, data);
    setProjectVerdelers(data || []);
  };

  const handleProjectClick = async (project: any) => {
    console.log('📦 Project clicked:', project);
    setSelectedProject(project);
    await loadProjectVerdelers(project.id);
  };

  const loadWorkEntryDetails = async (workEntry: any) => {
    console.log('👷 Loading work entry details:', workEntry);
    console.log('📋 Distributor:', workEntry.distributor);
    console.log('🆔 Project ID from distributor:', workEntry.distributor?.project_id);

    // Load verdeler details first to get project_id
    const { data: verdelerData, error: verdelerError } = await supabase
      .from('distributors')
      .select('*')
      .eq('id', workEntry.distributor_id)
      .maybeSingle();

    if (verdelerError) {
      console.error('❌ Error loading verdeler:', verdelerError);
    }

    console.log('📦 Verdeler data with project_id:', verdelerData);

    // Load project details using the project_id from verdeler
    const projectId = workEntry.distributor?.project_id || verdelerData?.project_id;
    console.log('🔍 Using project ID:', projectId);

    let projectData = null;
    if (projectId) {
      const { data, error: projectError } = await supabase
        .from('projects')
        .select('id, project_number, client, location, contact_person, description')
        .eq('id', projectId)
        .maybeSingle();

      if (projectError) {
        console.error('❌ Error loading project:', projectError);
      } else {
        projectData = data;
        console.log('✅ Project data loaded:', projectData);
      }
    } else {
      console.warn('⚠️ No project_id found for this work entry');
    }

    setWorkEntryDetails({
      workEntry,
      project: projectData,
      verdeler: verdelerData
    });
  };

  const handleWorkEntryClick = async (workEntry: any) => {
    setSelectedWorkEntry(workEntry);
    await loadWorkEntryDetails(workEntry);
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

  // Helper function to format dates without timezone issues
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEventsForDay = (date: Date): DayEvent[] => {
    const events: DayEvent[] = [];
    const dateStr = formatDateLocal(date);

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
      if (project.expected_delivery_date === dateStr) {
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

  const handleDragStart = (e: React.DragEvent, project: any) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropDate: Date) => {
    e.preventDefault();

    if (!draggedProject) return;

    const newDeliveryDate = formatDateLocal(dropDate);

    try {
      const { error } = await supabase
        .from('projects')
        .update({ expected_delivery_date: newDeliveryDate })
        .eq('id', draggedProject.id);

      if (error) throw error;

      toast.success(`Project ${draggedProject.project_number} verplaatst naar ${dropDate.toLocaleDateString('nl-NL')}`);

      // Reload projects to reflect the change
      loadProjects();
      setDraggedProject(null);
    } catch (error) {
      console.error('Error updating project delivery date:', error);
      toast.error('Fout bij het bijwerken van de leverdatum');
    }
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
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                  >
                    <div className="text-sm font-medium text-gray-400 mb-1">
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {events.map((event, idx) => (
                        <div
                          key={idx}
                          draggable={event.data?.isDeliveryDate}
                          onDragStart={(e) => event.data?.isDeliveryDate && handleDragStart(e, event.data)}
                          className={`text-xs p-1 rounded transition-all ${
                            event.type === 'verlof'
                              ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                              : event.type === 'vakantie'
                              ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                              : event.data?.isDeliveryDate
                              ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 cursor-move'
                              : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                          } ${event.data?.isDeliveryDate ? '' : 'cursor-pointer'}`}
                          onClick={() => {
                            if (event.data?.isDeliveryDate) {
                              handleProjectClick(event.data);
                            } else if (event.type === 'project' && !event.data?.isDeliveryDate) {
                              handleWorkEntryClick(event.data);
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (event.data?.isDeliveryDate) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoverPosition({ x: rect.left, y: rect.bottom + 5 });
                              setHoveredProject(event.data);
                            }
                          }}
                          onMouseLeave={() => {
                            if (event.data?.isDeliveryDate) {
                              setHoveredProject(null);
                            }
                          }}
                        >
                          <div className="truncate">
                            {event.data?.isDeliveryDate
                              ? `📦 ${event.data.project_number}`
                              : event.user?.username?.split(' ')[0]
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

          {/* Project Hover Popup */}
          {hoveredProject && (
            <div
              className="fixed z-50 bg-[#1E2530] border border-purple-500/30 rounded-lg shadow-2xl p-4 max-w-md"
              style={{
                left: `${hoverPosition.x}px`,
                top: `${hoverPosition.y}px`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between border-b border-gray-700 pb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{hoveredProject.project_number}</h3>
                    <p className="text-sm text-purple-400">{hoveredProject.client}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    hoveredProject.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    hoveredProject.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                    hoveredProject.status === 'planning' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {hoveredProject.status === 'completed' ? 'Afgerond' :
                     hoveredProject.status === 'in_progress' ? 'In Uitvoering' :
                     hoveredProject.status === 'planning' ? 'Planning' : 'Pending'}
                  </span>
                </div>

                {hoveredProject.location && (
                  <div>
                    <p className="text-xs text-gray-400">Locatie</p>
                    <p className="text-sm text-white">{hoveredProject.location}</p>
                  </div>
                )}

                {hoveredProject.contact_person && (
                  <div>
                    <p className="text-xs text-gray-400">Contactpersoon</p>
                    <p className="text-sm text-white">{hoveredProject.contact_person}</p>
                  </div>
                )}

                {hoveredProject.description && (
                  <div>
                    <p className="text-xs text-gray-400">Beschrijving</p>
                    <p className="text-sm text-white line-clamp-3">{hoveredProject.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-400">Verwachte Leverdatum</p>
                  <p className="text-sm text-purple-400 font-medium">
                    {new Date(hoveredProject.expected_delivery_date).toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Project Details Side Panel */}
          {selectedProject && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedProject(null)}>
              <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-[#1e2836] border-b border-gray-700 p-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">{selectedProject.project_number}</h2>
                    <p className="text-purple-400">{selectedProject.client}</p>
                  </div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Project Info */}
                  <div className="space-y-3">
                    {selectedProject.location && (
                      <div>
                        <p className="text-sm text-gray-400">Locatie</p>
                        <p className="text-white">{selectedProject.location}</p>
                      </div>
                    )}

                    {selectedProject.expected_delivery_date && (
                      <div>
                        <p className="text-sm text-gray-400">Verwachte Leverdatum</p>
                        <p className="text-white">
                          {new Date(selectedProject.expected_delivery_date).toLocaleDateString('nl-NL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {/* View Project Details Button */}
                    <div className="pt-4 border-t border-gray-700">
                      <button
                        onClick={() => {
                          setSelectedProject(null);
                          navigate(`/project/${selectedProject.id}`);
                        }}
                        className="w-full btn-primary flex items-center justify-center space-x-2"
                      >
                        <ExternalLink size={18} />
                        <span>Bekijk Projectdetails</span>
                      </button>
                    </div>
                  </div>

                  {/* Verdelers List */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Verdelers & Monteurs</h3>
                    {projectVerdelers.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">Geen verdelers gevonden voor dit project</p>
                    ) : (
                      <div className="space-y-3">
                        {projectVerdelers.map((verdeler) => (
                          <div key={verdeler.id} className="bg-[#2A303C] rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">
                                  {verdeler.distributor_id} {verdeler.kast_naam && `- ${verdeler.kast_naam}`}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                  Monteur: {verdeler.toegewezen_monteur ? (
                                    <span className="text-green-400">{verdeler.toegewezen_monteur}</span>
                                  ) : (
                                    <span className="text-yellow-400">Niet toegewezen</span>
                                  )}
                                </p>
                              </div>
                              {!verdeler.toegewezen_monteur && (
                                <span className="text-xs text-gray-500 italic">
                                  Navigeer naar project om monteur toe te wijzen
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Entry Details Modal */}
          {selectedWorkEntry && workEntryDetails && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedWorkEntry(null)}>
              <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-[#1e2836] border-b border-gray-700 p-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Werkdetails</h2>
                    <p className="text-purple-400">{workEntryDetails.workEntry.user?.username}</p>
                  </div>
                  <button
                    onClick={() => setSelectedWorkEntry(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Work Entry Info */}
                  <div className="bg-[#2A303C] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Werk Informatie</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Datum:</span>
                        <span className="text-white">
                          {new Date(workEntryDetails.workEntry.date).toLocaleDateString('nl-NL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Uren:</span>
                        <span className="text-white font-medium">{workEntryDetails.workEntry.hours || '0'} uur</span>
                      </div>
                      {workEntryDetails.workEntry.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-gray-400 text-sm mb-1">Notities:</p>
                          <p className="text-white text-sm">{workEntryDetails.workEntry.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Info */}
                  {workEntryDetails.project && (
                    <div className="bg-[#2A303C] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">Project Informatie</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Projectnummer:</span>
                          <span className="text-white font-medium">{workEntryDetails.project.project_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Klant:</span>
                          <span className="text-white">{workEntryDetails.project.client}</span>
                        </div>
                        {workEntryDetails.project.location && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Locatie:</span>
                            <span className="text-white">{workEntryDetails.project.location}</span>
                          </div>
                        )}
                        {workEntryDetails.project.contact_person && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Contactpersoon:</span>
                            <span className="text-white">{workEntryDetails.project.contact_person}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Verdeler Info */}
                  {workEntryDetails.verdeler && (
                    <div className="bg-[#2A303C] rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">Verdeler Informatie</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Verdeler ID:</span>
                          <span className="text-white font-medium">{workEntryDetails.verdeler.distributor_id}</span>
                        </div>
                        {workEntryDetails.verdeler.kast_naam && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Kast Naam:</span>
                            <span className="text-white">{workEntryDetails.verdeler.kast_naam}</span>
                          </div>
                        )}
                        {workEntryDetails.verdeler.systeem && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Systeem:</span>
                            <span className="text-white">{workEntryDetails.verdeler.systeem}</span>
                          </div>
                        )}
                        {workEntryDetails.verdeler.voeding && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Voeding:</span>
                            <span className="text-white">{workEntryDetails.verdeler.voeding}</span>
                          </div>
                        )}
                        {workEntryDetails.verdeler.toegewezen_monteur && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Toegewezen Monteur:</span>
                            <span className="text-green-400">{workEntryDetails.verdeler.toegewezen_monteur}</span>
                          </div>
                        )}
                        {workEntryDetails.verdeler.status && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              workEntryDetails.verdeler.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              workEntryDetails.verdeler.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {workEntryDetails.verdeler.status === 'completed' ? 'Voltooid' :
                               workEntryDetails.verdeler.status === 'in_progress' ? 'Bezig' :
                               workEntryDetails.verdeler.status === 'testing' ? 'Testen' :
                               workEntryDetails.verdeler.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
                    <div
                      key={weekstaat.id}
                      className="p-4 rounded-lg bg-[#2A303C] hover:bg-[#353C4A] cursor-pointer transition-colors flex items-center justify-between group"
                      onClick={() => navigate('/worksheet-management')}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Users className="w-5 h-5 text-purple-400" />
                          <span className="font-medium text-white group-hover:text-blue-400 transition-colors">{weekstaat.user?.username}</span>
                          <span className="text-sm text-gray-400">
                            Week {weekstaat.week_number} - {weekstaat.year}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Ingediend: {new Date(weekstaat.submitted_at).toLocaleString('nl-NL')}
                        </p>
                        <p className="text-xs text-blue-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Klik om te beoordelen →
                        </p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
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
                          <span className="font-medium text-white">{request.user?.username}</span>
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
                          {request.is_partial_day ? (
                            <>
                              {new Date(request.start_date).toLocaleDateString('nl-NL')} van {request.start_time?.substring(0, 5)} tot {request.end_time?.substring(0, 5)}
                              <span className="ml-2 text-gray-400">
                                ({request.hours_count} uur)
                              </span>
                            </>
                          ) : (
                            <>
                              {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                              <span className="ml-2 text-gray-400">
                                ({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})
                              </span>
                            </>
                          )}
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
                    <span className="font-medium text-white">{request.user?.username}</span>
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
                          <span className="font-medium text-white">{request.user?.username}</span>
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
                          {request.is_partial_day ? (
                            <>
                              {new Date(request.start_date).toLocaleDateString('nl-NL')} van {request.start_time?.substring(0, 5)} tot {request.end_time?.substring(0, 5)}
                              <span className="ml-2 text-gray-400">
                                ({request.hours_count} uur)
                              </span>
                            </>
                          ) : (
                            <>
                              {new Date(request.start_date).toLocaleDateString('nl-NL')} - {new Date(request.end_date).toLocaleDateString('nl-NL')}
                              <span className="ml-2 text-gray-400">
                                ({request.days_count} {request.days_count === 1 ? 'dag' : 'dagen'})
                              </span>
                            </>
                          )}
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
                    <span className="font-medium text-white">{request.user?.username}</span>
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
