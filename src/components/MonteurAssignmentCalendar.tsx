import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, User, AlertCircle, CheckCircle, X, Table as TableIcon, Download, Filter, Search, EyeOff, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface VerdelerAssignment {
  id: string;
  distributor_id: string;
  kast_naam: string;
  toegewezen_monteur: string | null;
  gewenste_lever_datum: string;
  status: string;
  project_number: string;
  client: string;
  location: string;
  project_id: string;
  project_naam: string | null;
  project_leader: string | null;
  project_leader_name: string | null;
  installateur_type: string | null;
  expected_hours: number | null;
  delivery_week: number | null;
  is_closed: boolean;
  is_ready: boolean;
  is_tested: boolean;
  is_delivered: boolean;
  week_status: string | null;
  hidden_from_monteur_agenda: boolean;
}

interface MonteurAssignmentCalendarProps {
  onAssignmentNeeded?: () => void;
  tableOnly?: boolean;
}

type ViewMode = 'calendar' | 'table';

export default function MonteurAssignmentCalendar({ onAssignmentNeeded, tableOnly = false }: MonteurAssignmentCalendarProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>(tableOnly ? 'table' : 'calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [verdelers, setVerdelers] = useState<VerdelerAssignment[]>([]);
  const [filteredVerdelers, setFilteredVerdelers] = useState<VerdelerAssignment[]>([]);
  const [selectedVerdeler, setSelectedVerdeler] = useState<VerdelerAssignment | null>(null);
  const [hoveredVerdeler, setHoveredVerdeler] = useState<VerdelerAssignment | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProjectLeader, setFilterProjectLeader] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showHidden, setShowHidden] = useState(false);

  // Get unique values for filters
  const projectLeaders = Array.from(new Set(verdelers.map(v => v.project_leader_name).filter(Boolean)));

  useEffect(() => {
    loadVerdelers();
  }, [currentDate]);

  useEffect(() => {
    applyFilters();
  }, [verdelers, searchTerm, filterProjectLeader, filterStatus, showHidden]);

  const loadVerdelers = async () => {
    try {
      setLoading(true);

      // Get first and last day of current month
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('distributors')
        .select(`
          id,
          distributor_id,
          kast_naam,
          toegewezen_monteur,
          gewenste_lever_datum,
          status,
          project_id,
          expected_hours,
          delivery_week,
          is_closed,
          is_ready,
          is_tested,
          is_delivered,
          week_status,
          hidden_from_monteur_agenda,
          projects!inner (
            project_number,
            client,
            location,
            project_naam,
            installateur_type,
            project_leader,
            created_by
          )
        `)
        .in('projects.location', ['Naaldwijk (PD)', 'Naaldwijk (PW)', 'Rotterdam'])
        .not('gewenste_lever_datum', 'is', null)
        .gte('gewenste_lever_datum', firstDay.toISOString())
        .lte('gewenste_lever_datum', lastDay.toISOString())
        .order('gewenste_lever_datum', { ascending: true });

      if (error) throw error;

      // Get user names for project leaders
      const projectLeaderIds = data?.map((v: any) => v.projects.project_leader || v.projects.created_by).filter(Boolean) || [];
      const uniqueLeaderIds = Array.from(new Set(projectLeaderIds));

      let leaderNames: Record<string, string> = {};
      if (uniqueLeaderIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, username')
          .in('id', uniqueLeaderIds);

        if (users) {
          leaderNames = users.reduce((acc: any, user: any) => {
            acc[user.id] = user.username;
            return acc;
          }, {});
        }
      }

      const formattedVerdelers = data?.map((v: any) => {
        const leaderId = v.projects.project_leader || v.projects.created_by;
        return {
          id: v.id,
          distributor_id: v.distributor_id,
          kast_naam: v.kast_naam,
          toegewezen_monteur: v.toegewezen_monteur,
          gewenste_lever_datum: v.gewenste_lever_datum,
          status: v.status,
          project_id: v.project_id,
          project_number: v.projects.project_number,
          client: v.projects.client,
          location: v.projects.location,
          project_naam: v.projects.project_naam,
          project_leader: leaderId,
          project_leader_name: leaderId ? leaderNames[leaderId] : null,
          installateur_type: v.projects.installateur_type,
          expected_hours: v.expected_hours,
          delivery_week: v.delivery_week,
          is_closed: v.is_closed,
          is_ready: v.is_ready,
          is_tested: v.is_tested,
          is_delivered: v.is_delivered,
          week_status: v.week_status,
          hidden_from_monteur_agenda: v.hidden_from_monteur_agenda || false
        };
      }) || [];

      setVerdelers(formattedVerdelers);
      console.log('📅 Calendar: Loaded', formattedVerdelers.length, 'verdelers for', currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }));
    } catch (error) {
      console.error('Error loading verdelers:', error);
      toast.error('Fout bij laden van verdelers');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...verdelers];

    // Hide hidden items unless showHidden is true
    if (!showHidden) {
      filtered = filtered.filter(v => !v.hidden_from_monteur_agenda);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.project_number?.toLowerCase().includes(search) ||
        v.distributor_id?.toLowerCase().includes(search) ||
        v.kast_naam?.toLowerCase().includes(search) ||
        v.client?.toLowerCase().includes(search) ||
        v.project_naam?.toLowerCase().includes(search) ||
        v.toegewezen_monteur?.toLowerCase().includes(search)
      );
    }

    // Project leader filter
    if (filterProjectLeader !== 'all') {
      filtered = filtered.filter(v => v.project_leader_name === filterProjectLeader);
    }

    // Status filter - filter by verdeler/project status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => v.status === filterStatus);
    }

    setFilteredVerdelers(filtered);
  };

  const toggleVerdelerVisibility = async (verdeler: VerdelerAssignment, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click

    try {
      const newHiddenState = !verdeler.hidden_from_monteur_agenda;

      const { error } = await supabase
        .from('distributors')
        .update({ hidden_from_monteur_agenda: newHiddenState })
        .eq('id', verdeler.id);

      if (error) throw error;

      // Update local state
      setVerdelers(prev => prev.map(v =>
        v.id === verdeler.id
          ? { ...v, hidden_from_monteur_agenda: newHiddenState }
          : v
      ));

      toast.success(newHiddenState ? 'Verdeler verborgen uit agenda' : 'Verdeler zichtbaar in agenda');
    } catch (error) {
      console.error('Error toggling verdeler visibility:', error);
      toast.error('Fout bij wijzigen zichtbaarheid');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredVerdelers.map(v => ({
      'Projectleider': v.project_leader_name || '',
      'Projectnummer': v.project_number,
      'Naam project': v.project_naam || v.client,
      'Verdeler': v.distributor_id,
      'Kast Naam': v.kast_naam,
      'Aantal uren': v.expected_hours || 0,
      'Wanneer leveren': v.gewenste_lever_datum ? new Date(v.gewenste_lever_datum).toLocaleDateString('nl-NL') : '',
      'Levering week': v.delivery_week || '',
      'Welke monteur': v.toegewezen_monteur || 'Niet toegewezen',
      'Status': v.status,
      'Week status': v.week_status || '',
      'Locatie': v.location
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monteur Planning');

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Projectleider
      { wch: 15 }, // Projectnummer
      { wch: 30 }, // Naam project
      { wch: 15 }, // Verdeler
      { wch: 20 }, // Kast Naam
      { wch: 12 }, // Aantal uren
      { wch: 15 }, // Wanneer leveren
      { wch: 12 }, // Levering week
      { wch: 30 }, // Welke monteur
      { wch: 20 }, // Status
      { wch: 12 }, // Week status
      { wch: 20 }  // Locatie
    ];

    const fileName = `Monteur_Planning_${currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Excel bestand geëxporteerd!');
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);

    const days = [];
    let currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getVerdelersForDate = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return filteredVerdelers.filter(v => {
      const leverDateStr = v.gewenste_lever_datum.split('T')[0];
      return leverDateStr === dateStr;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getStatusBadgeColor = (verdeler: VerdelerAssignment): string => {
    if (verdeler.is_delivered) return 'bg-blue-500/20 text-blue-300';
    if (verdeler.is_tested) return 'bg-green-500/20 text-green-300';
    if (verdeler.is_ready) return 'bg-cyan-500/20 text-cyan-300';
    if (verdeler.is_closed) return 'bg-gray-500/20 text-gray-300';
    return 'bg-yellow-500/20 text-yellow-300';
  };

  const renderCalendarView = () => (
    <>
      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={previousMonth} className="btn-secondary p-2">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="btn-secondary p-2">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-400 text-sm py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {generateCalendarDays().map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const dayVerdelers = getVerdelersForDate(day);

          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 rounded-lg border transition-colors ${
                isCurrentMonth
                  ? isToday
                    ? 'bg-blue-500/10 border-blue-500'
                    : 'bg-[#2A303C] border-gray-700 hover:border-gray-600'
                  : 'bg-[#1a1f2a] border-gray-800 opacity-50'
              }`}
            >
              <div className="text-sm font-medium text-gray-400 mb-1">
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayVerdelers.map((verdeler, idx) => (
                  <div
                    key={idx}
                    className={`text-xs p-1 rounded transition-all cursor-pointer ${
                      !verdeler.toegewezen_monteur || verdeler.toegewezen_monteur === 'Vrij'
                        ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                    }`}
                    onClick={() => setSelectedVerdeler(verdeler)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoverPosition({ x: rect.left, y: rect.bottom + 5 });
                      setHoveredVerdeler(verdeler);
                    }}
                    onMouseLeave={() => setHoveredVerdeler(null)}
                  >
                    <div className="truncate">
                      {verdeler.project_number} - {verdeler.kast_naam}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#1a1f2a] sticky top-0">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Projectleid</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Projectnumm</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Naam project</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Verdeler</th>
            <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Aantal ure</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Wanneer leveren</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Welke monteur</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Week</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Acties</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {filteredVerdelers.map((verdeler, idx) => {
            const weekNum = verdeler.gewenste_lever_datum
              ? getWeekNumber(new Date(verdeler.gewenste_lever_datum))
              : null;

            return (
              <tr
                key={idx}
                className={`hover:bg-[#2A303C] transition-colors cursor-pointer ${
                  verdeler.hidden_from_monteur_agenda ? 'opacity-50' : ''
                }`}
                onClick={() => setSelectedVerdeler(verdeler)}
              >
                <td className="px-3 py-3 whitespace-nowrap text-white">
                  {verdeler.project_leader_name || '-'}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-white font-medium">
                  {verdeler.project_number}
                </td>
                <td className="px-3 py-3 text-gray-300">
                  {verdeler.project_naam || verdeler.client}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-gray-300">
                  {verdeler.distributor_id}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-right text-gray-300">
                  {verdeler.expected_hours || 0}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-gray-300">
                  {verdeler.gewenste_lever_datum
                    ? new Date(verdeler.gewenste_lever_datum).toLocaleDateString('nl-NL')
                    : '-'}
                </td>
                <td className="px-3 py-3 text-gray-300">
                  <span className={`px-2 py-1 rounded text-xs ${
                    !verdeler.toegewezen_monteur || verdeler.toegewezen_monteur === 'Vrij'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-green-500/20 text-green-300'
                  }`}>
                    {verdeler.toegewezen_monteur || 'Niet toegewezen'}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-gray-300">
                  <span className="text-sm">{verdeler.status}</span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${
                    verdeler.week_status === 'yellow' ? 'bg-yellow-500 text-black' :
                    verdeler.week_status === 'green' ? 'bg-green-500 text-black' :
                    verdeler.week_status === 'cyan' ? 'bg-cyan-500 text-black' :
                    verdeler.week_status === 'blue' ? 'bg-blue-500 text-white' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    Week {weekNum || verdeler.delivery_week || '-'}
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    onClick={(e) => toggleVerdelerVisibility(verdeler, e)}
                    className={`p-1 rounded transition-colors ${
                      verdeler.hidden_from_monteur_agenda
                        ? 'text-gray-400 hover:text-green-400'
                        : 'text-gray-400 hover:text-red-400'
                    }`}
                    title={verdeler.hidden_from_monteur_agenda ? 'Tonen in agenda' : 'Verbergen uit agenda'}
                  >
                    {verdeler.hidden_from_monteur_agenda ? (
                      <Eye size={16} />
                    ) : (
                      <EyeOff size={16} />
                    )}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {filteredVerdelers.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Geen verdelers gevonden voor de geselecteerde filters
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Monteur Toewijzing Agenda</h2>
              <p className="text-sm text-gray-400">Geavanceerde planning en toewijzing</p>
            </div>
          </div>

          {/* View Toggle and Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHidden(!showHidden)}
              className={`btn-secondary p-2 ${showHidden ? 'bg-blue-500/20' : ''}`}
              title={showHidden ? 'Verberg verborgen items' : 'Toon verborgen items'}
            >
              {showHidden ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary p-2 ${showFilters ? 'bg-blue-500/20' : ''}`}
              title="Filters tonen/verbergen"
            >
              <Filter size={20} />
            </button>
            <button
              onClick={exportToExcel}
              className="btn-secondary p-2"
              title="Exporteer naar Excel"
            >
              <Download size={20} />
            </button>
            {!tableOnly && (
              <div className="flex bg-[#1a1f2a] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Calendar size={18} className="inline mr-2" />
                  Kalender
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded transition-colors ${
                    viewMode === 'table'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <TableIcon size={18} className="inline mr-2" />
                  Tabel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-[#1a1f2a] rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Zoeken</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Project, verdeler, klant..."
                    className="input-field pl-10 w-full"
                  />
                </div>
              </div>

              {/* Project Leader Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Projectleider</label>
                <select
                  value={filterProjectLeader}
                  onChange={(e) => setFilterProjectLeader(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">Alle projectleiders</option>
                  {projectLeaders.map(leader => (
                    <option key={leader} value={leader}>{leader}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">Alle statussen</option>
                  <option value="Intake">Intake</option>
                  <option value="Offerte">Offerte</option>
                  <option value="Order">Order</option>
                  <option value="Werkvoorbereiding">Werkvoorbereiding</option>
                  <option value="Productie">Productie</option>
                  <option value="Testen">Testen</option>
                  <option value="Levering">Levering</option>
                  <option value="Gereed voor facturatie">Gereed voor facturatie</option>
                  <option value="Opgeleverd">Opgeleverd</option>
                  <option value="Verloren">Verloren</option>
                </select>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || filterProjectLeader !== 'all' || filterStatus !== 'all') && (
              <div className="mt-4 flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Actieve filters:</span>
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    Zoeken: {searchTerm}
                  </span>
                )}
                {filterProjectLeader !== 'all' && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    Projectleider: {filterProjectLeader}
                  </span>
                )}
                {filterStatus !== 'all' && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    Status: {filterStatus}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterProjectLeader('all');
                    setFilterStatus('all');
                  }}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Wis filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Content */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Laden...
          </div>
        ) : (
          <>
            {viewMode === 'calendar' ? renderCalendarView() : renderTableView()}
          </>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between text-sm border-t border-gray-700 pt-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-yellow-500/20"></div>
              <span className="text-gray-400">Geen monteur</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-green-500/20"></div>
              <span className="text-gray-400">Monteur toegewezen</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-cyan-500/20"></div>
              <span className="text-gray-400">Klaar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded bg-blue-500/20"></div>
              <span className="text-gray-400">Afgeleverd</span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-500">
                {filteredVerdelers.filter(v => !v.toegewezen_monteur || v.toegewezen_monteur === 'Vrij').length}
              </div>
              <div className="text-xs text-gray-400">Zonder monteur</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">
                {filteredVerdelers.filter(v => v.toegewezen_monteur && v.toegewezen_monteur !== 'Vrij').length}
              </div>
              <div className="text-xs text-gray-400">Toegewezen</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">
                {filteredVerdelers.length}
              </div>
              <div className="text-xs text-gray-400">Totaal {showHidden ? '(incl. verborgen)' : ''}</div>
            </div>
            {!showHidden && verdelers.filter(v => v.hidden_from_monteur_agenda).length > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-gray-500">
                  {verdelers.filter(v => v.hidden_from_monteur_agenda).length}
                </div>
                <div className="text-xs text-gray-400">Verborgen</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover Popup */}
      {hoveredVerdeler && (
        <div
          className="fixed z-50 bg-[#1E2530] border border-blue-500/30 rounded-lg shadow-2xl p-4 max-w-md pointer-events-none"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{hoveredVerdeler.project_number}</h3>
                <p className="text-sm text-blue-400">{hoveredVerdeler.kast_naam}</p>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Verdeler ID:</span>
                <span className="text-white">{hoveredVerdeler.distributor_id}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Klant:</span>
                <span className="text-white">{hoveredVerdeler.client}</span>
              </div>
              {hoveredVerdeler.project_leader_name && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Projectleider:</span>
                  <span className="text-white">{hoveredVerdeler.project_leader_name}</span>
                </div>
              )}
              {hoveredVerdeler.expected_hours && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Verwachte uren:</span>
                  <span className="text-white">{hoveredVerdeler.expected_hours}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Monteur:</span>
                <span className={`font-medium ${
                  !hoveredVerdeler.toegewezen_monteur || hoveredVerdeler.toegewezen_monteur === 'Vrij'
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }`}>
                  {hoveredVerdeler.toegewezen_monteur || 'Niet toegewezen'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verdeler Details Modal */}
      {selectedVerdeler && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedVerdeler(null)}>
          <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#1e2836] border-b border-gray-700 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedVerdeler.project_number}</h2>
                <p className="text-blue-400">{selectedVerdeler.kast_naam}</p>
              </div>
              <button
                onClick={() => setSelectedVerdeler(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Verdeler Info */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Verdeler Informatie</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Verdeler ID</p>
                    <p className="text-sm text-white font-medium">{selectedVerdeler.distributor_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Kast Naam</p>
                    <p className="text-sm text-white">{selectedVerdeler.kast_naam}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusBadgeColor(selectedVerdeler)}`}>
                      {selectedVerdeler.is_delivered ? 'Afgeleverd' :
                       selectedVerdeler.is_tested ? 'Getest' :
                       selectedVerdeler.is_ready ? 'Klaar' :
                       selectedVerdeler.is_closed ? 'Gesloten' :
                       'In behandeling'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Verwachte uren</p>
                    <p className="text-sm text-white">{selectedVerdeler.expected_hours || 0} uur</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Toegewezen Monteur</p>
                    {!selectedVerdeler.toegewezen_monteur || selectedVerdeler.toegewezen_monteur === 'Vrij' ? (
                      <span className="text-yellow-400 flex items-center space-x-1 text-sm">
                        <AlertCircle size={14} />
                        <span>Niet toegewezen</span>
                      </span>
                    ) : (
                      <span className="text-green-400 flex items-center space-x-1 text-sm">
                        <CheckCircle size={14} />
                        <span>{selectedVerdeler.toegewezen_monteur}</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Gewenste Leverdatum</p>
                    <p className="text-sm text-white">
                      {new Date(selectedVerdeler.gewenste_lever_datum).toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Project Informatie</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Projectnummer</p>
                    <p className="text-sm text-white font-medium">{selectedVerdeler.project_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Projectleider</p>
                    <p className="text-sm text-white">{selectedVerdeler.project_leader_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Klant</p>
                    <p className="text-sm text-white">{selectedVerdeler.client}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Locatie</p>
                    <p className="text-sm text-white">{selectedVerdeler.location}</p>
                  </div>
                  {selectedVerdeler.project_naam && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">Project Naam</p>
                      <p className="text-sm text-white">{selectedVerdeler.project_naam}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Indicators */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Status Overzicht</h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      selectedVerdeler.is_closed ? 'bg-gray-500' : 'bg-gray-800'
                    }`}>
                      {selectedVerdeler.is_closed && <CheckCircle size={24} className="text-white" />}
                    </div>
                    <p className="text-xs text-gray-400">Gesloten</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      selectedVerdeler.is_ready ? 'bg-cyan-500' : 'bg-gray-800'
                    }`}>
                      {selectedVerdeler.is_ready && <CheckCircle size={24} className="text-white" />}
                    </div>
                    <p className="text-xs text-gray-400">Klaar</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      selectedVerdeler.is_tested ? 'bg-green-500' : 'bg-gray-800'
                    }`}>
                      {selectedVerdeler.is_tested && <CheckCircle size={24} className="text-white" />}
                    </div>
                    <p className="text-xs text-gray-400">Getest</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      selectedVerdeler.is_delivered ? 'bg-blue-500' : 'bg-gray-800'
                    }`}>
                      {selectedVerdeler.is_delivered && <CheckCircle size={24} className="text-white" />}
                    </div>
                    <p className="text-xs text-gray-400">Afgeleverd</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedVerdeler(null);
                    navigate(`/project/${selectedVerdeler.project_id}`);
                  }}
                  className="flex-1 btn-primary"
                >
                  Ga naar Project
                </button>
                <button
                  onClick={() => {
                    setSelectedVerdeler(null);
                    navigate(`/verdelers/${selectedVerdeler.id}`);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Ga naar Verdeler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
