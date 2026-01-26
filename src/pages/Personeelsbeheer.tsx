import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Calendar as CalendarIcon, Check, X, Users, FileText, Umbrella, Sun, ChevronLeft, ChevronRight, Clock, Eye, XCircle, CheckCircle } from 'lucide-react';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';
import { useLocationFilter } from '../contexts/LocationFilterContext';

type TabType = 'agenda' | 'weekstaten' | 'verlof' | 'vakantie';

interface DayEvent {
  type: 'weekstaat' | 'verlof' | 'vakantie' | 'project';
  user: any;
  data: any;
  hours?: number;
}

export default function Personeelsbeheer() {
  const navigate = useNavigate();
  const { currentUser } = useEnhancedPermissions();
  const { getFilteredLocations } = useLocationFilter();
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
  const [selectedWeekstaat, setSelectedWeekstaat] = useState<any>(null);
  const [weekstaatEntries, setWeekstaatEntries] = useState<any[]>([]);
  const [allWeekstaatEntries, setAllWeekstaatEntries] = useState<any[]>([]);
  const [weekstaatFilters, setWeekstaatFilters] = useState({
    employee: '',
    status: '',
    week: '',
    year: ''
  });

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

    let filteredUsers = data || [];

    // Location filter for specific users (applies first)
    if (currentUser?.username === 'Lysander Koenraadt' ||
        currentUser?.username === 'Patrick Herman' ||
        currentUser?.username === 'Stefano de Weger') {
      const lysanderFilteredLocations = getFilteredLocations();
      const beforeFilter = filteredUsers.length;

      filteredUsers = filteredUsers.filter((user: any) => {
        const userLocations = user.assigned_locations || user.assignedLocations || [];

        // User must have at least one location that matches current filter
        const hasMatchingLocation = userLocations.some((loc: string) =>
          lysanderFilteredLocations.includes(loc)
        );

        // Special users (admin, patrick, stefano) are always visible
        const specialUserRoles = ['admin'];
        const specialUsernames = ['patrick', 'stefano', 'Patrick', 'Stefano'];
        const isSpecialUser = specialUserRoles.includes(user.role) || specialUsernames.includes(user.username);

        if (!hasMatchingLocation && !isSpecialUser && userLocations.length > 0) {
          console.log(`📍 LOCATION FILTER: Hiding user ${user.username} (locations: ${userLocations.join(', ')})`);
        }

        return hasMatchingLocation || isSpecialUser || userLocations.length === 0;
      });
      console.log(`📍 LOCATION FILTER: Filtered ${beforeFilter} users down to ${filteredUsers.length} for ${currentUser.username}`);
    }

    // Filter by location based on user's assigned locations (admins see all)
    // Special users (admin, patrick, stefano, lysander) are always visible
    if (currentUser && currentUser.role !== 'admin' && currentUser.assignedLocations && currentUser.assignedLocations.length > 0) {
      const hasAllLocations =
        currentUser.assignedLocations.length >= AVAILABLE_LOCATIONS.length ||
        AVAILABLE_LOCATIONS.every(loc => currentUser.assignedLocations.includes(loc));

      if (!hasAllLocations) {
        const beforeFilter = filteredUsers.length;
        const specialUserRoles = ['admin'];
        const specialUsernames = ['patrick', 'stefano', 'lysander', 'Patrick', 'Stefano', 'Lysander'];

        filteredUsers = filteredUsers.filter((user: any) => {
          // Always show special users
          if (specialUserRoles.includes(user.role) || specialUsernames.includes(user.username)) {
            return true;
          }

          // Check if user has matching locations
          const userLocations = user.assigned_locations || user.assignedLocations || [];
          const hasMatchingLocation = userLocations.some((loc: string) => currentUser.assignedLocations.includes(loc));

          if (!hasMatchingLocation && userLocations.length > 0) {
            console.log(`🌍 PERSONEELSBEHEER FILTER: Hiding user ${user.username} (locations: ${userLocations.join(', ')}) from user ${currentUser.username}`);
          }

          return hasMatchingLocation || userLocations.length === 0;
        });
        console.log(`🌍 PERSONEELSBEHEER FILTER: Filtered ${beforeFilter} users down to ${filteredUsers.length} for user ${currentUser.username}`);
      }
    }

    setUsers(filteredUsers);
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

    const { data: allEntries } = await supabase
      .from('weekstaat_entries')
      .select('*');

    setAllWeekstaatEntries(allEntries || []);
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
    // Navigate to the project details page instead of showing modal
    navigate(`/project/${project.id}`);
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

  const loadWeekstaatDetails = async (weekstaat: any) => {
    const { data: entries } = await supabase
      .from('weekstaat_entries')
      .select('*')
      .eq('weekstaat_id', weekstaat.id)
      .order('created_at');

    setWeekstaatEntries(entries || []);
    setSelectedWeekstaat(weekstaat);
  };

  const approveWeekstaat = async () => {
    if (!selectedWeekstaat) return;

    const { error } = await supabase
      .from('weekstaten')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId'),
        rejection_reason: null
      })
      .eq('id', selectedWeekstaat.id);

    if (error) {
      toast.error('Fout bij goedkeuren');
      return;
    }

    toast.success('Weekstaat goedgekeurd');
    setSelectedWeekstaat(null);
    setWeekstaatEntries([]);
    loadWeekstaten();
  };

  const declineWeekstaat = async () => {
    if (!selectedWeekstaat || !rejectionReason.trim()) {
      toast.error('Vul een reden voor afkeuring in');
      return;
    }

    const { error } = await supabase
      .from('weekstaten')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: localStorage.getItem('currentUserId'),
        rejection_reason: rejectionReason
      })
      .eq('id', selectedWeekstaat.id);

    if (error) {
      toast.error('Fout bij afkeuren');
      return;
    }

    toast.success('Weekstaat afgekeurd');
    setSelectedWeekstaat(null);
    setWeekstaatEntries([]);
    setRejectionReason('');
    setSelectedRequest(null);
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
                      onClick={() => loadWeekstaatDetails(weekstaat)}
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
                      <Eye className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* All Weekstaten */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Alle Weekstaten</h2>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Medewerker</label>
                <select
                  value={weekstaatFilters.employee}
                  onChange={(e) => setWeekstaatFilters({ ...weekstaatFilters, employee: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="">Alle medewerkers</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.username}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <select
                  value={weekstaatFilters.status}
                  onChange={(e) => setWeekstaatFilters({ ...weekstaatFilters, status: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="">Alle statussen</option>
                  <option value="draft">Concept</option>
                  <option value="submitted">Ingediend</option>
                  <option value="approved">Goedgekeurd</option>
                  <option value="declined">Afgekeurd</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Week</label>
                <input
                  type="number"
                  min="1"
                  max="53"
                  placeholder="1-53"
                  value={weekstaatFilters.week}
                  onChange={(e) => setWeekstaatFilters({ ...weekstaatFilters, week: e.target.value })}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Jaar</label>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  placeholder="2025"
                  value={weekstaatFilters.year}
                  onChange={(e) => setWeekstaatFilters({ ...weekstaatFilters, year: e.target.value })}
                  className="input-field w-full"
                />
              </div>
            </div>

            {weekstaatFilters.employee || weekstaatFilters.status || weekstaatFilters.week || weekstaatFilters.year ? (
              <div className="mb-4">
                <button
                  onClick={() => setWeekstaatFilters({ employee: '', status: '', week: '', year: '' })}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Wis alle filters
                </button>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-gray-400 font-medium">Medewerker</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Week</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Jaar</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Ingediend</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Beoordeeld</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Status</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Uren</th>
                  </tr>
                </thead>
                <tbody>
                  {weekstaten
                    .filter(weekstaat => {
                      if (weekstaatFilters.employee && weekstaat.user_id !== weekstaatFilters.employee) return false;
                      if (weekstaatFilters.status && weekstaat.status !== weekstaatFilters.status) return false;
                      if (weekstaatFilters.week && weekstaat.week_number !== parseInt(weekstaatFilters.week)) return false;
                      if (weekstaatFilters.year && weekstaat.year !== parseInt(weekstaatFilters.year)) return false;
                      return true;
                    })
                    .map(weekstaat => {
                    const totalHours = allWeekstaatEntries
                      .filter(e => e.weekstaat_id === weekstaat.id)
                      .reduce((sum, e) =>
                        sum + (e.monday || 0) + (e.tuesday || 0) + (e.wednesday || 0) +
                        (e.thursday || 0) + (e.friday || 0) + (e.saturday || 0) + (e.sunday || 0), 0
                      );

                    return (
                      <tr
                        key={weekstaat.id}
                        className="border-b border-gray-700/50 hover:bg-[#2A303C] cursor-pointer transition-colors"
                        onClick={() => loadWeekstaatDetails(weekstaat)}
                      >
                        <td className="p-3 text-white font-medium">{weekstaat.user?.username || 'Onbekend'}</td>
                        <td className="p-3 text-gray-300">{weekstaat.week_number}</td>
                        <td className="p-3 text-gray-300">{weekstaat.year}</td>
                        <td className="p-3 text-gray-300">
                          {weekstaat.submitted_at
                            ? new Date(weekstaat.submitted_at).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : '-'
                          }
                        </td>
                        <td className="p-3 text-gray-300">
                          {weekstaat.reviewed_at
                            ? new Date(weekstaat.reviewed_at).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
                            : '-'
                          }
                        </td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(weekstaat.status)}`}>
                            {getStatusLabel(weekstaat.status)}
                          </span>
                        </td>
                        <td className="p-3 text-white font-medium">
                          {totalHours > 0 ? `${totalHours.toFixed(1)}u` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {weekstaten.filter(weekstaat => {
                if (weekstaatFilters.employee && weekstaat.user_id !== weekstaatFilters.employee) return false;
                if (weekstaatFilters.status && weekstaat.status !== weekstaatFilters.status) return false;
                if (weekstaatFilters.week && weekstaat.week_number !== parseInt(weekstaatFilters.week)) return false;
                if (weekstaatFilters.year && weekstaat.year !== parseInt(weekstaatFilters.year)) return false;
                return true;
              }).length === 0 && (
                <p className="text-center text-gray-400 py-8">
                  {weekstaten.length === 0 ? 'Geen weekstaten gevonden' : 'Geen weekstaten gevonden met de huidige filters'}
                </p>
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

      {/* Weekstaat Review Modal */}
      {selectedWeekstaat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-7xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">Weekstaat Beoordeling</h3>
                <p className="text-gray-400 mt-1">
                  Week {selectedWeekstaat.week_number}, {selectedWeekstaat.year}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedWeekstaat(null);
                  setWeekstaatEntries([]);
                  setRejectionReason('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Weekstaat Details (2/3) */}
              <div className="lg:col-span-2">
                <div className="bg-[#2A303C] rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Activiteiten</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-2 text-gray-400">Code</th>
                          <th className="text-left p-2 text-gray-400">Activiteit</th>
                          <th className="text-left p-2 text-gray-400">WB nr</th>
                          <th className="text-center p-2 text-gray-400">Ma</th>
                          <th className="text-center p-2 text-gray-400">Di</th>
                          <th className="text-center p-2 text-gray-400">Wo</th>
                          <th className="text-center p-2 text-gray-400">Do</th>
                          <th className="text-center p-2 text-gray-400">Vr</th>
                          <th className="text-center p-2 text-gray-400">Za</th>
                          <th className="text-center p-2 text-gray-400">Zo</th>
                          <th className="text-center p-2 text-gray-400">Totaal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weekstaatEntries.map((entry, index) => {
                          const rowTotal = (entry.monday || 0) + (entry.tuesday || 0) + (entry.wednesday || 0) +
                                           (entry.thursday || 0) + (entry.friday || 0) + (entry.saturday || 0) + (entry.sunday || 0);
                          return (
                            <tr key={index} className="border-b border-gray-800">
                              <td className="p-2 text-white">{entry.activity_code}</td>
                              <td className="p-2 text-white">{entry.activity_description}</td>
                              <td className="p-2 text-white">{entry.workorder_number || '-'}</td>
                              <td className="p-2 text-center text-white">{entry.monday || '-'}</td>
                              <td className="p-2 text-center text-white">{entry.tuesday || '-'}</td>
                              <td className="p-2 text-center text-white">{entry.wednesday || '-'}</td>
                              <td className="p-2 text-center text-white">{entry.thursday || '-'}</td>
                              <td className="p-2 text-center text-white">{entry.friday || '-'}</td>
                              <td className="p-2 text-center text-white">{entry.saturday || '-'}</td>
                              <td className="p-2 text-center text-white">{entry.sunday || '-'}</td>
                              <td className="p-2 text-center text-purple-400 font-semibold">{rowTotal.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-purple-500/10 font-bold">
                          <td colSpan={3} className="p-2 text-right text-white">Totaal:</td>
                          <td className="p-2 text-center text-white">
                            {weekstaatEntries.reduce((sum, e) => sum + (e.monday || 0), 0).toFixed(1)}
                          </td>
                          <td className="p-2 text-center text-white">
                            {weekstaatEntries.reduce((sum, e) => sum + (e.tuesday || 0), 0).toFixed(1)}
                          </td>
                          <td className="p-2 text-center text-white">
                            {weekstaatEntries.reduce((sum, e) => sum + (e.wednesday || 0), 0).toFixed(1)}
                          </td>
                          <td className="p-2 text-center text-white">
                            {weekstaatEntries.reduce((sum, e) => sum + (e.thursday || 0), 0).toFixed(1)}
                          </td>
                          <td className="p-2 text-center text-white">
                            {weekstaatEntries.reduce((sum, e) => sum + (e.friday || 0), 0).toFixed(1)}
                          </td>
                          <td className="p-2 text-center text-white">
                            {weekstaatEntries.reduce((sum, e) => sum + (e.saturday || 0), 0).toFixed(1)}
                          </td>
                          <td className="p-2 text-center text-white">
                            {weekstaatEntries.reduce((sum, e) => sum + (e.sunday || 0), 0).toFixed(1)}
                          </td>
                          <td className="p-2 text-center text-purple-400 font-bold text-lg">
                            {weekstaatEntries.reduce((sum, e) =>
                              sum + (e.monday || 0) + (e.tuesday || 0) + (e.wednesday || 0) +
                              (e.thursday || 0) + (e.friday || 0) + (e.saturday || 0) + (e.sunday || 0), 0
                            ).toFixed(1)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right: Employee Profile (1/3) */}
              <div className="lg:col-span-1">
                <div className="bg-[#2A303C] rounded-lg p-4 sticky top-4">
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white">{selectedWeekstaat.user?.username || 'Onbekend'}</h4>
                    <p className="text-sm text-gray-400">{selectedWeekstaat.user?.email || '-'}</p>
                  </div>

                  <div className="space-y-3 border-t border-gray-700 pt-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs ${getStatusColor(selectedWeekstaat.status)}`}>
                        {getStatusLabel(selectedWeekstaat.status)}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-1">Ingediend</p>
                      <p className="text-sm text-white">
                        {selectedWeekstaat.submitted_at
                          ? new Date(selectedWeekstaat.submitted_at).toLocaleString('nl-NL', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </p>
                    </div>

                    {selectedWeekstaat.reviewed_at && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Beoordeeld</p>
                        <p className="text-sm text-white">
                          {new Date(selectedWeekstaat.reviewed_at).toLocaleString('nl-NL', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-400 mb-1">Totaal Uren</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {weekstaatEntries.reduce((sum, e) =>
                          sum + (e.monday || 0) + (e.tuesday || 0) + (e.wednesday || 0) +
                          (e.thursday || 0) + (e.friday || 0) + (e.saturday || 0) + (e.sunday || 0), 0
                        ).toFixed(1)}u
                      </p>
                    </div>

                    {selectedWeekstaat.status === 'declined' && selectedWeekstaat.rejection_reason && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Reden Afkeuring</p>
                        <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded">
                          {selectedWeekstaat.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectedRequest && selectedRequest.action === 'decline' ? (
              <div className="mb-6">
                <label className="block text-gray-400 mb-2 font-medium">Reden voor afkeuring:</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input-field w-full"
                  rows={4}
                  placeholder="Geef een duidelijke reden waarom deze weekstaat wordt afgekeurd..."
                  autoFocus
                />
              </div>
            ) : null}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedWeekstaat(null);
                  setWeekstaatEntries([]);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                className="btn-secondary"
              >
                Annuleren
              </button>
              {selectedRequest && selectedRequest.action === 'decline' ? (
                <button
                  onClick={declineWeekstaat}
                  className="btn-primary bg-red-500/20 border-red-500/30 hover:bg-red-500/30 flex items-center space-x-2"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Afkeuren</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedRequest({ action: 'decline' })}
                    className="btn-secondary bg-red-500/20 border-red-500/30 hover:bg-red-500/30 flex items-center space-x-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Afkeuren</span>
                  </button>
                  <button
                    onClick={approveWeekstaat}
                    className="btn-primary bg-green-500/20 border-green-500/30 hover:bg-green-500/30 flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Goedkeuren</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedRequest && selectedRequest.action === 'decline' && !selectedWeekstaat && (
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
