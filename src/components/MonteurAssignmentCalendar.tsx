import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, User, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

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
}

interface MonteurAssignmentCalendarProps {
  onAssignmentNeeded?: () => void;
}

export default function MonteurAssignmentCalendar({ onAssignmentNeeded }: MonteurAssignmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [verdelers, setVerdelers] = useState<VerdelerAssignment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerdelers();
  }, [currentDate]);

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
          projects!inner (
            project_number,
            client,
            location
          )
        `)
        .in('projects.location', ['Naaldwijk (PD)', 'Naaldwijk (PW)', 'Rotterdam'])
        .not('gewenste_lever_datum', 'is', null)
        .gte('gewenste_lever_datum', firstDay.toISOString())
        .lte('gewenste_lever_datum', lastDay.toISOString())
        .order('gewenste_lever_datum', { ascending: true });

      if (error) throw error;

      const formattedVerdelers = data?.map((v: any) => ({
        id: v.id,
        distributor_id: v.distributor_id,
        kast_naam: v.kast_naam,
        toegewezen_monteur: v.toegewezen_monteur,
        gewenste_lever_datum: v.gewenste_lever_datum,
        status: v.status,
        project_number: v.projects.project_number,
        client: v.projects.client,
        location: v.projects.location
      })) || [];

      setVerdelers(formattedVerdelers);
      console.log('📅 Calendar: Loaded', formattedVerdelers.length, 'verdelers for', currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }));
    } catch (error) {
      console.error('Error loading verdelers:', error);
      toast.error('Fout bij laden van verdelers');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek: startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1 };
  };

  const getVerdelersForDate = (date: Date) => {
    return verdelers.filter(v => {
      const leverDatum = new Date(v.gewenste_lever_datum);
      return leverDatum.getDate() === date.getDate() &&
             leverDatum.getMonth() === date.getMonth() &&
             leverDatum.getFullYear() === date.getFullYear();
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  const selectedDateVerdelers = selectedDate ? getVerdelersForDate(selectedDate) : [];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Calendar size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Monteur Toewijzing Agenda</h2>
            <p className="text-sm text-gray-400">Verdelers die monteur toewijzing nodig hebben</p>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-4 mb-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-400">Geen monteur</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-400">Monteur toegewezen</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {/* Day headers */}
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square"></div>
        ))}

        {/* Days of the month */}
        {days.map((day) => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayVerdelers = getVerdelersForDate(date);
          const hasVerdelers = dayVerdelers.length > 0;
          const unassignedCount = dayVerdelers.filter(v => !v.toegewezen_monteur || v.toegewezen_monteur === 'Vrij').length;
          const assignedCount = dayVerdelers.filter(v => v.toegewezen_monteur && v.toegewezen_monteur !== 'Vrij').length;
          const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();
          const isToday = new Date().getDate() === day &&
                         new Date().getMonth() === currentDate.getMonth() &&
                         new Date().getFullYear() === currentDate.getFullYear();

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(date)}
              className={`
                aspect-square rounded-lg p-2 text-sm transition-all relative
                ${isSelected ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}
                ${isToday ? 'font-bold border-2 border-blue-400' : ''}
                ${hasVerdelers ? 'hover:bg-gray-700 cursor-pointer' : 'text-gray-600'}
              `}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{day}</span>
                {hasVerdelers && (
                  <div className="flex items-center space-x-1 mt-1">
                    {unassignedCount > 0 && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-xs ml-0.5">{unassignedCount}</span>
                      </div>
                    )}
                    {assignedCount > 0 && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs ml-0.5">{assignedCount}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && selectedDateVerdelers.length > 0 && (
        <div className="mt-6 border-t border-gray-700 pt-4">
          <h4 className="text-lg font-semibold mb-3">
            {selectedDate.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h4>
          <div className="space-y-3">
            {selectedDateVerdelers.map((verdeler) => (
              <div
                key={verdeler.id}
                className={`p-3 rounded-lg border ${
                  !verdeler.toegewezen_monteur || verdeler.toegewezen_monteur === 'Vrij'
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-green-500/30 bg-green-500/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold">{verdeler.distributor_id}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-400">{verdeler.kast_naam}</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      <div>{verdeler.project_number} - {verdeler.client}</div>
                      <div className="text-xs">{verdeler.location}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!verdeler.toegewezen_monteur || verdeler.toegewezen_monteur === 'Vrij' ? (
                        <>
                          <AlertCircle size={16} className="text-yellow-500" />
                          <span className="text-sm text-yellow-500">Geen monteur toegewezen</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} className="text-green-500" />
                          <User size={16} className="text-green-500" />
                          <span className="text-sm text-green-500">{verdeler.toegewezen_monteur}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">
            {verdelers.filter(v => !v.toegewezen_monteur || v.toegewezen_monteur === 'Vrij').length}
          </div>
          <div className="text-sm text-gray-400">Zonder monteur</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">
            {verdelers.filter(v => v.toegewezen_monteur && v.toegewezen_monteur !== 'Vrij').length}
          </div>
          <div className="text-sm text-gray-400">Toegewezen</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">
            {verdelers.length}
          </div>
          <div className="text-sm text-gray-400">Totaal</div>
        </div>
      </div>
    </div>
  );
}
