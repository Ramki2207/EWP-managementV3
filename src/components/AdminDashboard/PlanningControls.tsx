import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ViewMode } from './planningTypes';

interface PlanningControlsProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  monteurs: string[];
  selectedMonteur: string;
  onMonteurChange: (monteur: string) => void;
}

const PlanningControls: React.FC<PlanningControlsProps> = ({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  monteurs,
  selectedMonteur,
  onMonteurChange,
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = viewMode === 'week'
    ? endOfWeek(currentDate, { weekStartsOn: 1 })
    : viewMode === 'twoWeek'
      ? endOfWeek(addWeeks(currentDate, 1), { weekStartsOn: 1 })
      : endOfWeek(addWeeks(currentDate, 3), { weekStartsOn: 1 });

  const step = viewMode === 'month' ? 4 : viewMode === 'twoWeek' ? 2 : 1;

  const goToToday = () => onDateChange(new Date());

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDateChange(addWeeks(currentDate, -step))}
            className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
          >
            Vandaag
          </button>
          <button
            onClick={() => onDateChange(addWeeks(currentDate, step))}
            className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-white">
            {format(weekStart, 'd MMM', { locale: nl })} - {format(weekEnd, 'd MMM yyyy', { locale: nl })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedMonteur}
          onChange={e => onMonteurChange(e.target.value)}
          className="bg-[#161b24] border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        >
          <option value="all">Alle Monteurs</option>
          {monteurs.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-[#1a1f2b] rounded-lg p-0.5">
          {([
            { key: 'week' as ViewMode, label: 'Week' },
            { key: 'twoWeek' as ViewMode, label: '2 Wkn' },
            { key: 'month' as ViewMode, label: 'Maand' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onViewModeChange(key)}
              className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                viewMode === key
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanningControls;
