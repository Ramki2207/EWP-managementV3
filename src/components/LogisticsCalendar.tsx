import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Truck, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VerdelerDelivery {
  id: string;
  distributor_id: string;
  kast_naam: string;
  status: string;
  gewenste_lever_datum: string | null;
  project_id: string;
  project_number: string;
  client: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Productie': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Testen': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Levering': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Opgeleverd': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Vervallen': 'bg-red-500/20 text-red-300 border-red-500/30',
};

const STATUS_DOT: Record<string, string> = {
  'Productie': 'bg-amber-400',
  'Testen': 'bg-blue-400',
  'Levering': 'bg-green-400',
  'Opgeleverd': 'bg-gray-400',
  'Vervallen': 'bg-red-400',
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const LogisticsCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [verdelers, setVerdelers] = useState<VerdelerDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVerdelers = async () => {
      const { data, error } = await supabase
        .from('distributors')
        .select('id, distributor_id, kast_naam, status, gewenste_lever_datum, project_id, projects ( project_number, client )')
        .not('gewenste_lever_datum', 'is', null);

      if (error) {
        console.error('Error loading verdelers:', error);
        setLoading(false);
        return;
      }

      const mapped: VerdelerDelivery[] = (data || []).map((d: any) => ({
        id: d.id,
        distributor_id: d.distributor_id,
        kast_naam: d.kast_naam || '',
        status: d.status || '',
        gewenste_lever_datum: d.gewenste_lever_datum,
        project_id: d.project_id || '',
        project_number: d.projects?.project_number || '',
        client: d.projects?.client || '',
      }));

      setVerdelers(mapped);
      setLoading(false);
    };

    loadVerdelers();
  }, []);

  const verdelersWithDates = useMemo(() => {
    return verdelers
      .filter(v => v.gewenste_lever_datum)
      .map(v => ({
        ...v,
        parsedDate: new Date(v.gewenste_lever_datum!),
      }))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  }, [verdelers]);

  const verdelersForDay = (day: Date) => {
    return verdelersWithDates.filter(v =>
      v.parsedDate.toDateString() === day.toDateString()
    );
  };

  const verdelersForMonth = useMemo(() => {
    return verdelersWithDates.filter(v =>
      v.parsedDate.getMonth() === currentDate.getMonth() &&
      v.parsedDate.getFullYear() === currentDate.getFullYear()
    );
  }, [verdelersWithDates, currentDate]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const startDate = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return d;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const navigateToProject = (projectId: string) => {
    if (projectId) {
      navigate(`/project/${projectId}`);
    }
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const todayVerdelers = verdelersForDay(today);
  const upcomingVerdelers = verdelersWithDates
    .filter(v => v.parsedDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .slice(0, 5);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  const getStatusDot = (status: string) => STATUS_DOT[status] || 'bg-gray-400';

  const getDisplayName = (v: VerdelerDelivery) => {
    const parts = [v.kast_naam, v.project_number].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : v.distributor_id;
  };

  if (loading) {
    return (
      <div className="mb-8 card p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Truck size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Verdeler Leveragenda</h2>
            <p className="text-sm text-gray-400">Overzicht van verwachte leverdatums per verdeler</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              viewMode === 'calendar' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Kalender
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              viewMode === 'list' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Lijst
          </button>
        </div>
      </div>

      {todayVerdelers.length > 0 && (
        <div className="card p-4 mb-4 border-l-4 border-l-green-500">
          <div className="flex items-center space-x-2 mb-2">
            <Package size={16} className="text-green-400" />
            <h3 className="font-semibold text-green-400">
              Vandaag te leveren ({todayVerdelers.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {todayVerdelers.map(v => (
              <div
                key={v.id}
                onClick={() => navigateToProject(v.project_id)}
                className="flex items-center justify-between p-2 rounded-lg bg-[#2A303C] hover:bg-[#353B48] cursor-pointer transition-colors border border-gray-700"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(v.status)}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{v.kast_naam || v.distributor_id}</div>
                    <div className="text-xs text-gray-400 truncate">{v.project_number}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${getStatusColor(v.status)}`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'calendar' ? (
        <>
          <div className="card p-4 flex items-center justify-between mb-4">
            <button onClick={previousMonth} className="btn-secondary p-2">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-white">
                {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={goToToday}
                className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              >
                Vandaag
              </button>
            </div>
            <button onClick={nextMonth} className="btn-secondary p-2">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="card p-6">
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-center font-semibold text-gray-400 text-sm py-2">Week</div>
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-400 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {Array.from({ length: 6 }, (_, weekIndex) => {
                const weekDays = calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7);
                const weekNumber = getWeekNumber(weekDays[0]);

                return (
                  <div key={weekIndex} className="grid grid-cols-8 gap-2">
                    <div className="flex items-center justify-center bg-[#2A303C] border border-gray-700 rounded-lg">
                      <span className="text-sm font-semibold text-blue-400">{weekNumber}</span>
                    </div>

                    {weekDays.map((day, dayIndex) => {
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const isToday = day.toDateString() === new Date().toDateString();
                      const dayVerdelers = verdelersForDay(day);

                      return (
                        <div
                          key={dayIndex}
                          className={`min-h-[110px] p-2 rounded-lg border transition-colors ${
                            isCurrentMonth
                              ? isToday
                                ? 'bg-green-500/10 border-green-500'
                                : 'bg-[#2A303C] border-gray-700 hover:border-gray-600'
                              : 'bg-[#1a1f2a] border-gray-800 opacity-50'
                          }`}
                        >
                          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-green-400' : 'text-gray-400'}`}>
                            {day.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayVerdelers.map((v) => (
                              <div
                                key={v.id}
                                onClick={() => navigateToProject(v.project_id)}
                                className="text-xs p-1.5 rounded bg-green-500/15 hover:bg-green-500/25 cursor-pointer transition-all border border-green-500/20"
                              >
                                <div className="flex items-center space-x-1">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDot(v.status)}`} />
                                  <div className="truncate font-medium text-white">
                                    {v.kast_naam || v.distributor_id}
                                  </div>
                                </div>
                                <div className="truncate text-gray-400 text-[10px] mt-0.5">
                                  {v.project_number}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center flex-wrap gap-4 text-sm">
              {Object.entries(STATUS_DOT).map(([status, color]) => (
                <div key={status} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-gray-400">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card p-6">
          <div className="card p-4 flex items-center justify-between mb-4">
            <button onClick={previousMonth} className="btn-secondary p-2">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-white">
                {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={goToToday}
                className="text-xs px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
              >
                Vandaag
              </button>
            </div>
            <button onClick={nextMonth} className="btn-secondary p-2">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {verdelersForMonth.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              Geen verdelers met een verwachte leverdatum in {currentDate.toLocaleDateString('nl-NL', { month: 'long' })}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Leverdatum</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Kastnaam</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Projectnummer</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Klant</th>
                    <th className="text-left p-3 text-sm font-semibold text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {verdelersForMonth.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => navigateToProject(v.project_id)}
                      className="border-b border-gray-800 hover:bg-[#2A303C] cursor-pointer transition-colors"
                    >
                      <td className="p-3 text-sm text-white whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusDot(v.status)}`} />
                          <span>{formatDate(v.parsedDate)}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-white font-medium">{v.kast_naam || '-'}</td>
                      <td className="p-3 text-sm text-gray-300">{v.project_number}</td>
                      <td className="p-3 text-sm text-gray-300">{v.client || '-'}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(v.status)}`}>
                          {v.status || 'Onbekend'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {upcomingVerdelers.length > 0 && viewMode === 'calendar' && (
        <div className="card p-4 mt-4">
          <h3 className="font-semibold text-gray-300 mb-3 flex items-center space-x-2">
            <Truck size={16} className="text-green-400" />
            <span>Aankomende leveringen</span>
          </h3>
          <div className="space-y-2">
            {upcomingVerdelers.map(v => (
              <div
                key={v.id}
                onClick={() => navigateToProject(v.project_id)}
                className="flex items-center justify-between p-2 rounded-lg bg-[#2A303C] hover:bg-[#353B48] cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusDot(v.status)}`} />
                  <div>
                    <span className="text-sm font-medium text-white">{v.kast_naam || v.distributor_id}</span>
                    <span className="text-xs text-gray-400 ml-2">{v.project_number}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-300">{formatDate(v.parsedDate)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(v.status)}`}>
                    {v.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsCalendar;
