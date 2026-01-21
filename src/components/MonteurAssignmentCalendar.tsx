import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, User, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  project_id: string;
}

interface MonteurAssignmentCalendarProps {
  onAssignmentNeeded?: () => void;
}

export default function MonteurAssignmentCalendar({ onAssignmentNeeded }: MonteurAssignmentCalendarProps) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [verdelers, setVerdelers] = useState<VerdelerAssignment[]>([]);
  const [selectedVerdeler, setSelectedVerdeler] = useState<VerdelerAssignment | null>(null);
  const [hoveredVerdeler, setHoveredVerdeler] = useState<VerdelerAssignment | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
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
          project_id,
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
        project_id: v.project_id,
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
    return verdelers.filter(v => {
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

  return (
    <>
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
            className="btn-secondary p-2"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={nextMonth}
            className="btn-secondary p-2"
          >
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
                      ? 'bg-purple-500/10 border-purple-500'
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

        {/* Legend */}
        <div className="mt-6 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-yellow-500/20"></div>
            <span className="text-gray-400">Geen monteur</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-500/20"></div>
            <span className="text-gray-400">Monteur toegewezen</span>
          </div>
        </div>

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

      {/* Hover Popup */}
      {hoveredVerdeler && (
        <div
          className="fixed z-50 bg-[#1E2530] border border-purple-500/30 rounded-lg shadow-2xl p-4 max-w-md pointer-events-none"
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
                <p className="text-sm text-purple-400">{hoveredVerdeler.kast_naam}</p>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <p className="text-xs text-gray-400">Verdeler ID</p>
              <p className="text-sm text-white">{hoveredVerdeler.distributor_id}</p>
              <p className="text-xs text-gray-400 mt-1">{hoveredVerdeler.client}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Locatie</p>
              <p className="text-sm text-white">{hoveredVerdeler.location}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Monteur</p>
              <p className={`text-sm font-medium ${
                !hoveredVerdeler.toegewezen_monteur || hoveredVerdeler.toegewezen_monteur === 'Vrij'
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }`}>
                {hoveredVerdeler.toegewezen_monteur || 'Niet toegewezen'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verdeler Details Modal */}
      {selectedVerdeler && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedVerdeler(null)}>
          <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#1e2836] border-b border-gray-700 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedVerdeler.project_number}</h2>
                <p className="text-purple-400">{selectedVerdeler.kast_naam}</p>
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
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Verdeler ID:</span>
                    <span className="text-white font-medium">{selectedVerdeler.distributor_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Kast Naam:</span>
                    <span className="text-white">{selectedVerdeler.kast_naam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      selectedVerdeler.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      selectedVerdeler.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {selectedVerdeler.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Toegewezen Monteur:</span>
                    {!selectedVerdeler.toegewezen_monteur || selectedVerdeler.toegewezen_monteur === 'Vrij' ? (
                      <span className="text-yellow-400 flex items-center space-x-1">
                        <AlertCircle size={14} />
                        <span>Niet toegewezen</span>
                      </span>
                    ) : (
                      <span className="text-green-400 flex items-center space-x-1">
                        <CheckCircle size={14} />
                        <span>{selectedVerdeler.toegewezen_monteur}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gewenste Leverdatum:</span>
                    <span className="text-white">
                      {new Date(selectedVerdeler.gewenste_lever_datum).toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="bg-[#2A303C] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Project Informatie</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Projectnummer:</span>
                    <span className="text-white font-medium">{selectedVerdeler.project_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Klant:</span>
                    <span className="text-white">{selectedVerdeler.client}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Locatie:</span>
                    <span className="text-white">{selectedVerdeler.location}</span>
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
