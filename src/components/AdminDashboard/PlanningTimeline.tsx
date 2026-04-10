import React, { useState } from 'react';
import { format, isToday, isWeekend } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ScheduledBlock, MonteurDayCapacity } from './planningTypes';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface PlanningTimelineProps {
  days: Date[];
  monteurs: string[];
  blocks: ScheduledBlock[];
  capacityMap: Record<string, MonteurDayCapacity>;
  leaveDates: Record<string, Set<string>>;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Productie': { bg: 'bg-blue-500/30', border: 'border-blue-500/50', text: 'text-blue-300' },
  'Testen': { bg: 'bg-orange-500/30', border: 'border-orange-500/50', text: 'text-orange-300' },
  'Werkvoorbereiding': { bg: 'bg-teal-500/30', border: 'border-teal-500/50', text: 'text-teal-300' },
  'Levering': { bg: 'bg-emerald-500/30', border: 'border-emerald-500/50', text: 'text-emerald-300' },
};

const DEFAULT_COLOR = { bg: 'bg-gray-500/30', border: 'border-gray-500/50', text: 'text-gray-300' };

const PlanningTimeline: React.FC<PlanningTimelineProps> = ({
  days,
  monteurs,
  blocks,
  capacityMap,
  leaveDates,
}) => {
  const navigate = useNavigate();
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  const dayStrings = days.map(d => format(d, 'yyyy-MM-dd'));

  const getBlocksForMonteur = (monteur: string) =>
    blocks.filter(b => b.monteur === monteur);

  const getCapacity = (monteur: string, dateStr: string): MonteurDayCapacity => {
    const key = `${monteur}:${dateStr}`;
    return capacityMap[key] || {
      monteur, date: dateStr, totalAvailable: 8, scheduledHours: 0,
      actualWorkedHours: 0, remainingCapacity: 8, isOnLeave: false, isWeekend: false,
    };
  };

  const getDayTotals = (dateStr: string) => {
    let totalCapacity = 0;
    let totalScheduled = 0;
    monteurs.forEach(m => {
      const cap = getCapacity(m, dateStr);
      totalCapacity += cap.totalAvailable;
      totalScheduled += cap.scheduledHours;
    });
    return { totalCapacity, totalScheduled, percent: totalCapacity > 0 ? (totalScheduled / totalCapacity) * 100 : 0 };
  };

  const getUtilColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getCellBg = (cap: MonteurDayCapacity, day: Date) => {
    if (isWeekend(day)) return 'bg-gray-800/30';
    if (cap.isOnLeave) return 'bg-gray-700/40';
    const util = cap.totalAvailable > 0 ? (cap.scheduledHours / cap.totalAvailable) * 100 : 0;
    if (util >= 90) return 'bg-red-500/5';
    if (util >= 70) return 'bg-amber-500/5';
    return '';
  };

  const renderMonteurBlocks = (monteur: string, monteurBlocks: ScheduledBlock[]) => {
    const rows: ScheduledBlock[][] = [];

    for (const block of monteurBlocks) {
      let placed = false;
      for (const row of rows) {
        const overlaps = row.some(existing =>
          block.startDate <= existing.endDate && block.endDate >= existing.startDate
        );
        if (!overlaps) {
          row.push(block);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([block]);
      }
    }

    return rows;
  };

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <div
        className="min-w-[900px]"
        style={{
          display: 'grid',
          gridTemplateColumns: `160px repeat(${days.length}, minmax(${days.length > 10 ? '60px' : '80px'}, 1fr))`,
        }}
      >
        <div className="sticky left-0 z-20 bg-[#1A1F2C] border-b border-r border-gray-700/40 px-3 py-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Monteur</span>
        </div>
        {days.map((day, i) => {
          const dateStr = dayStrings[i];
          const weekend = isWeekend(day);
          const today = isToday(day);
          return (
            <div
              key={dateStr}
              className={`border-b border-r border-gray-700/30 px-1 py-2 text-center ${
                weekend ? 'bg-gray-800/30' : today ? 'bg-blue-500/10' : ''
              }`}
            >
              <p className={`text-[10px] uppercase ${today ? 'text-blue-400 font-semibold' : 'text-gray-500'}`}>
                {format(day, 'EEE', { locale: nl })}
              </p>
              <p className={`text-xs font-medium ${today ? 'text-blue-400' : weekend ? 'text-gray-600' : 'text-gray-300'}`}>
                {format(day, 'd MMM', { locale: nl })}
              </p>
            </div>
          );
        })}

        {monteurs.map(monteur => {
          const monteurBlocks = getBlocksForMonteur(monteur);
          const blockRows = renderMonteurBlocks(monteur, monteurBlocks);
          const rowCount = Math.max(blockRows.length, 1);

          const totalScheduled = dayStrings.reduce((sum, ds) => sum + getCapacity(monteur, ds).scheduledHours, 0);
          const totalAvailable = dayStrings.reduce((sum, ds) => {
            const cap = getCapacity(monteur, ds);
            return sum + (cap.isWeekend ? 0 : cap.totalAvailable);
          }, 0);

          return (
            <React.Fragment key={monteur}>
              <div
                className="sticky left-0 z-10 bg-[#1A1F2C] border-b border-r border-gray-700/40 px-3 py-2 flex flex-col justify-center"
                style={{ gridRow: `span 1` }}
              >
                <p className="text-xs font-medium text-white truncate">{monteur}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getUtilColor(totalAvailable > 0 ? (totalScheduled / totalAvailable) * 100 : 0)}`}
                      style={{ width: `${totalAvailable > 0 ? Math.min((totalScheduled / totalAvailable) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">
                    {Math.round(totalScheduled)}/{totalAvailable}u
                  </span>
                </div>
              </div>

              {days.map((day, colIdx) => {
                const dateStr = dayStrings[colIdx];
                const cap = getCapacity(monteur, dateStr);
                const weekend = isWeekend(day);
                const today = isToday(day);

                const cellBlocks: { block: ScheduledBlock; rowIdx: number }[] = [];
                blockRows.forEach((row, rowIdx) => {
                  row.forEach(block => {
                    if (block.dailyHours[dateStr]) {
                      cellBlocks.push({ block, rowIdx });
                    }
                  });
                });

                return (
                  <div
                    key={`${monteur}:${dateStr}`}
                    className={`border-b border-r border-gray-700/20 relative ${getCellBg(cap, day)} ${today ? 'ring-1 ring-inset ring-blue-500/20' : ''}`}
                    style={{ minHeight: `${Math.max(rowCount * 38 + 20, 64)}px` }}
                  >
                    <div className="p-0.5 space-y-0.5">
                      {cellBlocks.map(({ block }) => {
                        const hours = block.dailyHours[dateStr];
                        const colors = STATUS_COLORS[block.verdeler.status] || DEFAULT_COLOR;
                        const isHovered = hoveredBlock === block.verdeler.id;
                        const isStart = dateStr === block.startDate;

                        return (
                          <div
                            key={block.verdeler.id}
                            onClick={() => navigate(`/project/${block.verdeler.project_id}`)}
                            onMouseEnter={() => setHoveredBlock(block.verdeler.id)}
                            onMouseLeave={() => setHoveredBlock(null)}
                            className={`
                              relative px-1 py-0.5 rounded cursor-pointer transition-all text-[10px] leading-tight
                              border ${colors.border} ${colors.bg} ${colors.text}
                              ${block.isOverdue ? 'border-red-500/70 ring-1 ring-red-500/30' : ''}
                              ${block.cannotFit ? 'border-dashed' : ''}
                              ${isHovered ? 'scale-[1.02] z-10 shadow-lg' : ''}
                            `}
                            title={`${block.verdeler.kast_naam} - ${block.verdeler.project_number}\n${block.verdeler.client}\n${hours}u van ${block.verdeler.expected_hours}u totaal\nMonteur: ${block.monteur}`}
                          >
                            <span className="font-medium">{block.verdeler.project_number} - {block.verdeler.kast_naam}</span>
                            <span className="block text-[9px] opacity-75">{hours}u</span>
                          </div>
                        );
                      })}
                    </div>

                    {!weekend && !cap.isOnLeave && (
                      <div className="absolute bottom-0 left-0 right-0 px-0.5 pb-0.5">
                        <div className="h-1 bg-gray-700/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getUtilColor(cap.totalAvailable > 0 ? (cap.scheduledHours / cap.totalAvailable) * 100 : 0)}`}
                            style={{ width: `${cap.totalAvailable > 0 ? Math.min((cap.scheduledHours / cap.totalAvailable) * 100, 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {cap.isOnLeave && !weekend && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] text-gray-500 font-medium">Verlof</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        <div className="sticky left-0 z-10 bg-[#1E2530] border-t-2 border-r border-gray-600/50 px-3 py-2 flex items-center">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Bezetting</span>
        </div>
        {days.map((day, i) => {
          const dateStr = dayStrings[i];
          const weekend = isWeekend(day);
          const { totalCapacity, totalScheduled, percent } = getDayTotals(dateStr);

          return (
            <div
              key={`total:${dateStr}`}
              className={`border-t-2 border-r border-gray-600/50 px-1 py-2 text-center ${
                weekend ? 'bg-gray-800/30' : 'bg-[#1E2530]'
              }`}
            >
              {!weekend && (
                <>
                  <p className={`text-xs font-semibold ${percent >= 90 ? 'text-red-400' : percent >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {Math.round(totalScheduled)}/{totalCapacity}u
                  </p>
                  <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${getUtilColor(percent)}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 mt-0.5">{Math.round(percent)}%</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {blocks.some(b => b.cannotFit) && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400">
            Sommige verdelers kunnen niet volledig ingepland worden - onvoldoende capaciteit voor de deadline.
            Gestippelde randen geven dit aan.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlanningTimeline;
