import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { startOfWeek, addDays, addWeeks, format } from 'date-fns';
import { CalendarRange, RefreshCw, AlertTriangle, Users, ClipboardList } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PlanningVerdeler, MonteurDayCapacity, ViewMode } from './planningTypes';
import { autoSchedule, calculateCapacityUsed } from './AutoScheduleEngine';
import { useLocationFilter } from '../../contexts/LocationFilterContext';
import PlanningControls from './PlanningControls';
import PlanningTimeline from './PlanningTimeline';
import VerlofRegistratieModal from './VerlofRegistratieModal';

export interface ActiveAbsence {
  id: string;
  user_id: string;
  username: string;
  absence_type: 'ziek' | 'afwezig';
  start_date: string;
  is_open_ended: boolean;
  end_date: string | null;
}

interface ProductiePlanningProps {
  userId: string;
  username: string;
}

const LOCATION_FILTERED_USERS = ['Patrick Herman', 'Stefano de Weger', 'Lysander Koenraadt'];

const ProductiePlanning: React.FC<ProductiePlanningProps> = ({ userId, username }) => {
  const { isLocationVisible } = useLocationFilter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('twoWeek');
  const [selectedMonteur, setSelectedMonteur] = useState('all');
  const [loading, setLoading] = useState(true);
  const [verdelers, setVerdelers] = useState<PlanningVerdeler[]>([]);
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [leaveDates, setLeaveDates] = useState<Record<string, Set<string>>>({});
  const [workHoursMap, setWorkHoursMap] = useState<Record<string, number>>({});
  const [showVerlofModal, setShowVerlofModal] = useState(false);
  const [activeAbsences, setActiveAbsences] = useState<ActiveAbsence[]>([]);

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);

  const days = useMemo(() => {
    const count = viewMode === 'week' ? 5 : viewMode === 'twoWeek' ? 10 : 20;
    const allDays: Date[] = [];
    let d = new Date(weekStart);
    let added = 0;
    while (added < count) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) {
        allDays.push(new Date(d));
        added++;
      }
      d = addDays(d, 1);
    }
    return allDays;
  }, [weekStart, viewMode]);

  const rangeStart = useMemo(() => format(days[0], 'yyyy-MM-dd'), [days]);
  const rangeEnd = useMemo(() => format(days[days.length - 1], 'yyyy-MM-dd'), [days]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [distResult, usersResult, leaveResult, vacationResult, workResult, absenceResult] = await Promise.all([
        supabase
          .from('distributors')
          .select(`
            id, distributor_id, kast_naam, toegewezen_monteur,
            gewenste_lever_datum, expected_hours, status, project_id,
            projects!inner (id, project_number, client, expected_delivery_date, location)
          `)
          .in('status', ['Werkvoorbereiding', 'Productie', 'Testen', 'Levering']),

        supabase
          .from('users')
          .select('id, username, role, is_active, assigned_locations')
          .eq('is_active', true),

        supabase
          .from('leave_requests')
          .select('user_id, start_date, end_date, leave_type')
          .eq('status', 'approved'),

        supabase
          .from('vacation_requests')
          .select('user_id, start_date, end_date')
          .eq('status', 'approved'),

        supabase
          .from('work_entries')
          .select('distributor_id, hours')
          .not('hours', 'is', null),

        supabase
          .from('employee_absences')
          .select('id, user_id, absence_type, start_date, end_date, is_open_ended')
          .eq('is_active', true),
      ]);

      const allUsers = usersResult.data || [];
      setUsers(allUsers);

      const usernameById: Record<string, string> = {};
      const idByUsername: Record<string, string> = {};
      allUsers.forEach(u => {
        usernameById[u.id] = u.username;
        idByUsername[u.username] = u.id;
      });

      const hoursPerDistributor: Record<string, number> = {};
      (workResult.data || []).forEach((entry: any) => {
        const key = entry.distributor_id;
        hoursPerDistributor[key] = (hoursPerDistributor[key] || 0) + (entry.hours || 0);
      });
      setWorkHoursMap(hoursPerDistributor);

      const usesLocationFilter = LOCATION_FILTERED_USERS.includes(username);

      const planningVerdelers: PlanningVerdeler[] = (distResult.data || [])
        .filter((d: any) => {
          if (!d.toegewezen_monteur || d.toegewezen_monteur === 'Vrij') return false;
          if (usesLocationFilter) {
            const project = d.projects as any;
            if (!isLocationVisible(project?.location)) return false;
          }
          return true;
        })
        .map((d: any) => {
          const project = d.projects as any;
          const actualHours = hoursPerDistributor[d.id] || 0;
          const expectedHours = d.expected_hours || 0;
          return {
            id: d.id,
            distributor_id: d.distributor_id,
            kast_naam: d.kast_naam || d.distributor_id || 'Naamloos',
            project_number: project?.project_number || '',
            project_id: d.project_id,
            client: project?.client || '',
            toegewezen_monteur: d.toegewezen_monteur,
            gewenste_lever_datum: d.gewenste_lever_datum?.split('T')[0] || null,
            project_delivery_date: project?.expected_delivery_date || null,
            expected_hours: expectedHours,
            actual_hours: actualHours,
            remaining_hours: Math.max(0, expectedHours - actualHours),
            status: d.status,
          };
        });

      setVerdelers(planningVerdelers);

      const leave: Record<string, Set<string>> = {};
      const addLeaveRange = (userId: string, start: string, end: string) => {
        const username = usernameById[userId];
        if (!username) return;
        if (!leave[username]) leave[username] = new Set();
        let cur = new Date(start);
        const endDate = new Date(end);
        while (cur <= endDate) {
          leave[username].add(format(cur, 'yyyy-MM-dd'));
          cur = addDays(cur, 1);
        }
      };

      (leaveResult.data || []).forEach((l: any) => addLeaveRange(l.user_id, l.start_date, l.end_date));
      (vacationResult.data || []).forEach((v: any) => addLeaveRange(v.user_id, v.start_date, v.end_date));

      const absences = (absenceResult.data || []) as any[];
      const today = format(new Date(), 'yyyy-MM-dd');
      const farFuture = format(addDays(new Date(), 365), 'yyyy-MM-dd');

      const absWithNames: ActiveAbsence[] = [];
      absences.forEach((a: any) => {
        const uname = usernameById[a.user_id];
        if (!uname) return;
        const end = a.is_open_ended ? farFuture : a.end_date;
        if (end) addLeaveRange(a.user_id, a.start_date, end);
        absWithNames.push({
          id: a.id,
          user_id: a.user_id,
          username: uname,
          absence_type: a.absence_type,
          start_date: a.start_date,
          is_open_ended: a.is_open_ended,
          end_date: a.end_date,
        });
      });
      setActiveAbsences(absWithNames);

      setLeaveDates(leave);
    } catch (err) {
      console.error('Error loading planning data:', err);
    } finally {
      setLoading(false);
    }
  }, [username, isLocationVisible]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monteurList = useMemo(() => {
    const set = new Set<string>();
    verdelers.forEach(v => {
      if (v.toegewezen_monteur && v.toegewezen_monteur !== 'Vrij') {
        set.add(v.toegewezen_monteur);
      }
    });
    return Array.from(set).sort();
  }, [verdelers]);

  const filteredMonteurs = useMemo(() => {
    if (selectedMonteur === 'all') return monteurList;
    return monteurList.filter(m => m === selectedMonteur);
  }, [monteurList, selectedMonteur]);

  const scheduledBlocks = useMemo(() => {
    return autoSchedule(verdelers, leaveDates, rangeStart, rangeEnd);
  }, [verdelers, leaveDates, rangeStart, rangeEnd]);

  const filteredBlocks = useMemo(() => {
    if (selectedMonteur === 'all') return scheduledBlocks;
    return scheduledBlocks.filter(b => b.monteur === selectedMonteur);
  }, [scheduledBlocks, selectedMonteur]);

  const capacityMap = useMemo(() => {
    const map: Record<string, MonteurDayCapacity> = {};
    const used = calculateCapacityUsed(scheduledBlocks);
    const dayStrings = days.map(d => format(d, 'yyyy-MM-dd'));

    filteredMonteurs.forEach(monteur => {
      const monteurLeave = leaveDates[monteur] || new Set();

      dayStrings.forEach(dateStr => {
        const key = `${monteur}:${dateStr}`;
        const day = new Date(dateStr);
        const weekend = day.getDay() === 0 || day.getDay() === 6;
        const onLeave = monteurLeave.has(dateStr);
        const totalAvailable = weekend ? 0 : onLeave ? 0 : 8;
        const scheduledHours = used[key] || 0;

        map[key] = {
          monteur,
          date: dateStr,
          totalAvailable,
          scheduledHours,
          actualWorkedHours: 0,
          remainingCapacity: Math.max(0, totalAvailable - scheduledHours),
          isOnLeave: onLeave,
          isWeekend: weekend,
        };
      });
    });

    return map;
  }, [filteredMonteurs, days, scheduledBlocks, leaveDates]);

  const stats = useMemo(() => {
    const unscheduled = verdelers.filter(v =>
      v.remaining_hours > 0 && (!v.gewenste_lever_datum && !v.project_delivery_date)
    );
    const overdue = scheduledBlocks.filter(b => b.isOverdue);
    const cannotFit = scheduledBlocks.filter(b => b.cannotFit);

    const dayStrings = days.map(d => format(d, 'yyyy-MM-dd'));
    let totalCap = 0;
    let totalSched = 0;
    dayStrings.forEach(ds => {
      filteredMonteurs.forEach(m => {
        const cap = capacityMap[`${m}:${ds}`];
        if (cap && !cap.isWeekend) {
          totalCap += cap.totalAvailable;
          totalSched += cap.scheduledHours;
        }
      });
    });

    return {
      unscheduledCount: unscheduled.length,
      overdueCount: overdue.length,
      cannotFitCount: cannotFit.length,
      totalCapacity: totalCap,
      totalScheduled: totalSched,
      availableHours: totalCap - totalSched,
      utilizationPercent: totalCap > 0 ? Math.round((totalSched / totalCap) * 100) : 0,
    };
  }, [verdelers, scheduledBlocks, days, filteredMonteurs, capacityMap]);

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <CalendarRange size={20} className="text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">Productieplanning</h2>
          <p className="text-sm text-gray-400">
            Automatische inplanning op basis van uren, deadlines en bezetting
          </p>
        </div>
        <button
          onClick={() => setShowVerlofModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all text-xs font-medium"
        >
          <ClipboardList size={14} />
          Verlof registratie
        </button>
        <button
          onClick={loadData}
          className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-all"
          title="Vernieuwen"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-blue-400" />
            <span className="text-[10px] text-blue-400/70 uppercase tracking-wider">Bezetting</span>
          </div>
          <p className={`text-xl font-bold ${stats.utilizationPercent >= 90 ? 'text-red-400' : stats.utilizationPercent >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {stats.utilizationPercent}%
          </p>
          <p className="text-[10px] text-gray-500">{Math.round(stats.totalScheduled)}/{stats.totalCapacity} uur</p>
        </div>

        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CalendarRange size={14} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Beschikbaar</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{Math.round(stats.availableHours)}u</p>
          <p className="text-[10px] text-gray-500">Vrije capaciteit</p>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-[10px] text-amber-400/70 uppercase tracking-wider">Geen deadline</span>
          </div>
          <p className="text-xl font-bold text-amber-400">{stats.unscheduledCount}</p>
          <p className="text-[10px] text-gray-500">Niet inplanbaar</p>
        </div>

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-[10px] text-red-400/70 uppercase tracking-wider">Overschreden</span>
          </div>
          <p className="text-xl font-bold text-red-400">{stats.overdueCount}</p>
          <p className="text-[10px] text-gray-500">Deadline verlopen</p>
        </div>
      </div>

      <PlanningControls
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        monteurs={monteurList}
        selectedMonteur={selectedMonteur}
        onMonteurChange={setSelectedMonteur}
      />

      <div className="mt-4 border border-gray-700/40 rounded-xl overflow-hidden bg-[#161b24]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin text-blue-400" />
          </div>
        ) : filteredMonteurs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users size={32} className="mb-3 text-gray-600" />
            <p className="text-sm">Geen monteurs met ingeplande verdelers gevonden</p>
          </div>
        ) : (
          <PlanningTimeline
            days={days}
            monteurs={filteredMonteurs}
            blocks={filteredBlocks}
            capacityMap={capacityMap}
            leaveDates={leaveDates}
            activeAbsences={activeAbsences}
            onResolveAbsence={async (absenceId: string) => {
              const { error } = await supabase
                .from('employee_absences')
                .update({ is_active: false, resolved_by: userId, resolved_at: new Date().toISOString() })
                .eq('id', absenceId);
              if (!error) {
                loadData();
              }
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-gray-700/30">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Legenda:</span>
        {[
          { label: 'Productie', color: 'bg-blue-500/30 border-blue-500/50' },
          { label: 'Testen', color: 'bg-orange-500/30 border-orange-500/50' },
          { label: 'Werkvoorbereiding', color: 'bg-teal-500/30 border-teal-500/50' },
          { label: 'Levering', color: 'bg-emerald-500/30 border-emerald-500/50' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded border ${item.color}`} />
            <span className="text-[10px] text-gray-400">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-red-500/70 bg-red-500/20 ring-1 ring-red-500/30" />
          <span className="text-[10px] text-gray-400">Deadline verlopen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-dashed border-gray-500/50 bg-gray-500/20" />
          <span className="text-[10px] text-gray-400">Past niet in planning</span>
        </div>
      </div>
      {showVerlofModal && (
        <VerlofRegistratieModal
          onClose={() => setShowVerlofModal(false)}
          onSaved={loadData}
          users={users}
          currentUsername={username}
          currentUserId={userId}
        />
      )}
    </div>
  );
};

export default ProductiePlanning;
