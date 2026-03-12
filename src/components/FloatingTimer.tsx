import React, { useState } from 'react';
import { Clock, Square, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import { useTimer } from '../contexts/TimerContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const FloatingTimer: React.FC = () => {
  const { timers, stopTimer } = useTimer();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [stoppingTimers, setStoppingTimers] = useState<Set<string>>(new Set());

  if (timers.length === 0) {
    return null;
  }

  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const handleStopTimer = async (timerId: string) => {
    if (stoppingTimers.has(timerId)) return;

    setStoppingTimers(prev => new Set(prev).add(timerId));

    try {
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) {
        toast.error('Gebruiker niet gevonden');
        return;
      }

      const result = await stopTimer(timerId);

      if (result.hours < 0.01) {
        toast.error('Timer moet minimaal 36 seconden lopen (0.01 uur)');
        setStoppingTimers(prev => {
          const newSet = new Set(prev);
          newSet.delete(timerId);
          return newSet;
        });
        return;
      }

      const workDate = new Date();
      const weekNumber = getWeekNumber(workDate);
      const year = workDate.getFullYear();
      const dayOfWeek = workDate.getDay();

      const dayMapping: { [key: number]: string } = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday'
      };

      const dayColumn = dayMapping[dayOfWeek];

      const { data: existingWeekstaat } = await supabase
        .from('weekstaten')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('week_number', weekNumber)
        .eq('year', year)
        .maybeSingle();

      let weekstaatId = existingWeekstaat?.id;

      if (!weekstaatId) {
        const { data: newWeekstaat, error: createError } = await supabase
          .from('weekstaten')
          .insert({
            user_id: currentUserId,
            week_number: weekNumber,
            year: year,
            status: 'draft'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        weekstaatId = newWeekstaat.id;
      }

      const activityCode = '108';
      const activityDescription = '108 - Testen';
      const workorderNumber = `${result.projectNumber}`;

      const { data: existingEntry } = await supabase
        .from('weekstaat_entries')
        .select('*')
        .eq('weekstaat_id', weekstaatId)
        .eq('activity_code', activityCode)
        .maybeSingle();

      if (existingEntry) {
        const currentHours = parseFloat(existingEntry[dayColumn] || 0);
        const { error: updateError } = await supabase
          .from('weekstaat_entries')
          .update({
            [dayColumn]: currentHours + result.hours,
            activity_code: activityCode,
            activity_description: activityDescription,
            workorder_number: workorderNumber
          })
          .eq('id', existingEntry.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('weekstaat_entries')
          .insert({
            weekstaat_id: weekstaatId,
            activity_code: activityCode,
            activity_description: activityDescription,
            workorder_number: workorderNumber,
            overtime_start_time: '',
            [dayColumn]: result.hours
          });

        if (insertError) throw insertError;
      }

      toast.success(`${result.hours.toFixed(2)} uur geregistreerd in weekstaat voor project ${result.projectNumber}!`);
    } catch (error) {
      console.error('Error saving timer:', error);
      toast.error('Fout bij opslaan naar weekstaat');
    } finally {
      setStoppingTimers(prev => {
        const newSet = new Set(prev);
        newSet.delete(timerId);
        return newSet;
      });
    }
  };

  const handleNavigateToProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const totalElapsedSeconds = timers.reduce((sum, timer) => sum + timer.elapsedSeconds, 0);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-md border-2 border-green-500/50 rounded-2xl shadow-2xl overflow-hidden min-w-[360px] max-w-[420px]">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <Clock size={20} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-semibold text-green-400">
                {timers.length} Timer{timers.length > 1 ? 's' : ''} Actief
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {formatElapsedTime(totalElapsedSeconds)}
              </div>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-green-500/30 pt-3 max-h-[60vh] overflow-y-auto">
            {timers.map((timer, index) => (
              <div
                key={timer.id}
                className="bg-black/30 rounded-lg p-3 border border-green-500/20 hover:border-green-500/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Timer {index + 1}</div>
                    <div className="text-xl font-mono font-bold text-white mb-1">
                      {formatElapsedTime(timer.elapsedSeconds)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleNavigateToProject(timer.projectId)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all"
                    title="Ga naar project"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>

                <div className="space-y-1 text-sm mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Project:</span>
                    <span className="text-white font-semibold">{timer.projectNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Verdeler:</span>
                    <span className="text-white font-semibold text-xs">{timer.distributorName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Uren:</span>
                    <span className="text-blue-400 font-semibold">
                      {(timer.elapsedSeconds / 3600).toFixed(2)} uur
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleStopTimer(timer.id)}
                  disabled={stoppingTimers.has(timer.id)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-semibold transition-all shadow-lg text-sm"
                >
                  <Square size={16} />
                  <span>{stoppingTimers.has(timer.id) ? 'Opslaan...' : 'Stop Timer'}</span>
                </button>
              </div>
            ))}

            <div className="text-xs text-gray-400 bg-black/20 rounded-lg p-2 mt-4">
              <span className="font-semibold text-green-400">Info:</span> Bij stoppen wordt de tijd automatisch geregistreerd in je weekstaat onder activiteit "108 - Testen"
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingTimer;
