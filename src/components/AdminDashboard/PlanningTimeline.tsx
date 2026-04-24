import React, { useState, useRef, useCallback, useEffect } from 'react';
import { format, isToday, isWeekend } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ScheduledBlock, MonteurDayCapacity } from './planningTypes';
import { AlertTriangle, ThermometerSun, UserX, CheckCircle2, GripHorizontal, RotateCcw } from 'lucide-react';
import { ActiveAbsence } from './ProductiePlanning';
import PlanningDetailModal from './PlanningDetailModal';
import toast from 'react-hot-toast';

interface PlanningTimelineProps {
  days: Date[];
  monteurs: string[];
  blocks: ScheduledBlock[];
  capacityMap: Record<string, MonteurDayCapacity>;
  leaveDates: Record<string, Set<string>>;
  activeAbsences?: ActiveAbsence[];
  onResolveAbsence?: (absenceId: string) => Promise<void>;
  onBlockMove?: (block: ScheduledBlock, newStartDate: string, newEndDate: string, newMonteur: string) => Promise<void>;
  onBlockResize?: (block: ScheduledBlock, newStartDate: string, newEndDate: string) => Promise<void>;
  onBlockReset?: (block: ScheduledBlock) => Promise<void>;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dragBg: string }> = {
  'Productie':         { bg: 'bg-blue-500/30',    border: 'border-blue-500/50',    text: 'text-blue-300',    dragBg: 'bg-blue-500/60' },
  'Testen':            { bg: 'bg-orange-500/30',  border: 'border-orange-500/50',  text: 'text-orange-300',  dragBg: 'bg-orange-500/60' },
  'Werkvoorbereiding': { bg: 'bg-teal-500/30',    border: 'border-teal-500/50',    text: 'text-teal-300',    dragBg: 'bg-teal-500/60' },
  'Levering':          { bg: 'bg-emerald-500/30', border: 'border-emerald-500/50', text: 'text-emerald-300', dragBg: 'bg-emerald-500/60' },
};

const DEFAULT_COLOR = { bg: 'bg-gray-500/30', border: 'border-gray-500/50', text: 'text-gray-300', dragBg: 'bg-gray-500/60' };

type DragMode = 'move' | 'resize-left' | 'resize-right';

interface DragState {
  block: ScheduledBlock;
  mode: DragMode;
  originDateStr: string;
  currentStartDate: string;
  currentEndDate: string;
  currentMonteur: string;
}

const PlanningTimeline: React.FC<PlanningTimelineProps> = ({
  days,
  monteurs,
  blocks,
  capacityMap,
  leaveDates,
  activeAbsences = [],
  onResolveAbsence,
  onBlockMove,
  onBlockResize,
  onBlockReset,
}) => {
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ScheduledBlock | null>(null);
  const [resolvingAbsence, setResolvingAbsence] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [savingBlock, setSavingBlock] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const dayStrings = days.map(d => format(d, 'yyyy-MM-dd'));

  const getAbsenceForMonteur = (monteur: string): ActiveAbsence | undefined =>
    activeAbsences.find(a => a.username === monteur);

  const handleResolve = async (absence: ActiveAbsence) => {
    if (!onResolveAbsence || resolvingAbsence) return;
    setResolvingAbsence(absence.id);
    try {
      await onResolveAbsence(absence.id);
      toast.success(`${absence.username} is weer aan het werk`);
    } catch {
      toast.error('Kon de status niet bijwerken');
    } finally {
      setResolvingAbsence(null);
    }
  };

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

  const renderMonteurBlocks = (monteurBlocks: ScheduledBlock[]) => {
    const rows: ScheduledBlock[][] = [];
    for (const block of monteurBlocks) {
      let placed = false;
      for (const row of rows) {
        const overlaps = row.some(existing =>
          block.startDate <= existing.endDate && block.endDate >= existing.startDate
        );
        if (!overlaps) { row.push(block); placed = true; break; }
      }
      if (!placed) rows.push([block]);
    }
    return rows;
  };

  // --- Drag logic ---

  const onDragStart = useCallback((e: React.MouseEvent, block: ScheduledBlock, mode: DragMode, dateStr: string) => {
    if (!onBlockMove && !onBlockResize) return;
    e.preventDefault();
    e.stopPropagation();
    setDragState({
      block,
      mode,
      originDateStr: dateStr,
      currentStartDate: block.startDate,
      currentEndDate: block.endDate,
      currentMonteur: block.monteur,
    });
  }, [onBlockMove, onBlockResize]);

  const getCellFromPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const cell = (el as HTMLElement).closest('[data-cell]') as HTMLElement | null;
    if (!cell) return null;
    return { dateStr: cell.dataset.date || '', monteur: cell.dataset.monteur || '' };
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell?.dateStr) return;

    const { mode, block } = dragState;

    if (mode === 'move') {
      const originIdx = dayStrings.indexOf(dragState.originDateStr);
      const curIdx = dayStrings.indexOf(cell.dateStr);
      if (originIdx === -1 || curIdx === -1) return;
      const delta = curIdx - originIdx;

      const blockStartIdx = dayStrings.indexOf(block.startDate);
      const blockEndIdx = dayStrings.indexOf(block.endDate);
      if (blockStartIdx === -1 || blockEndIdx === -1) return;

      const newStartIdx = Math.max(0, blockStartIdx + delta);
      const newEndIdx = Math.min(dayStrings.length - 1, blockEndIdx + delta);
      const newStart = dayStrings[newStartIdx];
      const newEnd = dayStrings[newEndIdx];
      const newMonteur = cell.monteur || dragState.currentMonteur;

      if (newStart !== dragState.currentStartDate || newEnd !== dragState.currentEndDate || newMonteur !== dragState.currentMonteur) {
        setDragState(prev => prev ? { ...prev, currentStartDate: newStart, currentEndDate: newEnd, currentMonteur: newMonteur } : null);
      }
    } else if (mode === 'resize-right') {
      const startIdx = dayStrings.indexOf(dragState.currentStartDate);
      const newEndIdx = dayStrings.indexOf(cell.dateStr);
      if (startIdx === -1 || newEndIdx === -1) return;
      const clampedEnd = dayStrings[Math.max(startIdx, newEndIdx)];
      if (clampedEnd !== dragState.currentEndDate) {
        setDragState(prev => prev ? { ...prev, currentEndDate: clampedEnd } : null);
      }
    } else if (mode === 'resize-left') {
      const endIdx = dayStrings.indexOf(dragState.currentEndDate);
      const newStartIdx = dayStrings.indexOf(cell.dateStr);
      if (endIdx === -1 || newStartIdx === -1) return;
      const clampedStart = dayStrings[Math.min(endIdx, newStartIdx)];
      if (clampedStart !== dragState.currentStartDate) {
        setDragState(prev => prev ? { ...prev, currentStartDate: clampedStart } : null);
      }
    }
  }, [dragState, dayStrings, getCellFromPoint]);

  const onMouseUp = useCallback(async () => {
    if (!dragState) return;
    const { block, mode, currentStartDate, currentEndDate, currentMonteur } = dragState;

    const unchanged =
      currentStartDate === block.startDate &&
      currentEndDate === block.endDate &&
      currentMonteur === block.monteur;

    setDragState(null);
    if (unchanged) return;

    setSavingBlock(block.verdeler.id);
    try {
      if (mode === 'move' && onBlockMove) {
        await onBlockMove(block, currentStartDate, currentEndDate, currentMonteur);
        toast.success('Planning opgeslagen');
      } else if ((mode === 'resize-left' || mode === 'resize-right') && onBlockResize) {
        await onBlockResize(block, currentStartDate, currentEndDate);
        toast.success('Planning opgeslagen');
      }
    } catch {
      toast.error('Kon planning niet opslaan');
    } finally {
      setSavingBlock(null);
    }
  }, [dragState, onBlockMove, onBlockResize]);

  useEffect(() => {
    if (!dragState) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragState, onMouseMove, onMouseUp]);

  const getEffective = (block: ScheduledBlock) => {
    if (dragState?.block.verdeler.id === block.verdeler.id) {
      return {
        startDate: dragState.currentStartDate,
        endDate: dragState.currentEndDate,
        monteur: dragState.currentMonteur,
        isDragging: true,
      };
    }
    return { startDate: block.startDate, endDate: block.endDate, monteur: block.monteur, isDragging: false };
  };

  const renderBlock = (block: ScheduledBlock, monteur: string, dateStr: string) => {
    const effective = getEffective(block);
    const isDragging = effective.isDragging;

    // Only render in the cell if it belongs here effectively
    const showInThisCell = effective.monteur === monteur &&
      dateStr >= effective.startDate && dateStr <= effective.endDate;
    if (!showInThisCell) return null;

    // For auto-blocks, only show cells where hours are assigned (unless dragging)
    if (!isDragging && !block.isManual && !block.dailyHours[dateStr]) return null;

    const hours = block.dailyHours[dateStr] || 0;
    const colors = STATUS_COLORS[block.verdeler.status] || DEFAULT_COLOR;
    const isHovered = hoveredBlock === block.verdeler.id && !dragState;
    const isSaving = savingBlock === block.verdeler.id;
    const isStart = dateStr === effective.startDate;
    const isEnd = dateStr === effective.endDate;
    const canDrag = !!(onBlockMove || onBlockResize);

    return (
      <div
        key={`${block.verdeler.id}:${dateStr}`}
        className={`
          relative group flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] leading-tight
          border ${colors.border}
          ${isDragging ? `${colors.dragBg} opacity-90 shadow-xl z-50` : colors.bg}
          ${colors.text}
          ${block.isOverdue ? 'border-red-500/70 ring-1 ring-red-500/30' : ''}
          ${block.cannotFit ? 'border-dashed' : ''}
          ${block.isManual ? 'ring-1 ring-white/10' : ''}
          ${isHovered ? 'scale-[1.02] z-10 shadow-lg brightness-110' : ''}
          ${isSaving ? 'opacity-50' : ''}
          transition-all duration-75
        `}
        style={{ cursor: isDragging ? 'grabbing' : canDrag ? 'grab' : 'pointer' }}
        onClick={() => !dragState && !isDragging && setSelectedBlock(block)}
        onMouseEnter={() => !dragState && setHoveredBlock(block.verdeler.id)}
        onMouseLeave={() => setHoveredBlock(null)}
        onMouseDown={canDrag ? (e) => onDragStart(e, block, 'move', dateStr) : undefined}
        title={`${block.verdeler.kast_naam} — ${block.verdeler.project_number}\n${block.verdeler.client}\n${block.verdeler.remaining_hours}u resterend\nMonteur: ${block.monteur}${block.isManual ? '\n● Handmatig ingepland' : ''}`}
      >
        {/* Left resize handle */}
        {canDrag && isStart && (
          <div
            className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize z-10 flex items-center justify-center hover:bg-white/10 rounded-l opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => { e.stopPropagation(); onDragStart(e, block, 'resize-left', dateStr); }}
          >
            <div className="w-px h-3 bg-current opacity-60 rounded-full" />
          </div>
        )}

        <GripHorizontal size={8} className="opacity-25 flex-shrink-0 mt-px" />
        <div className="min-w-0 flex-1 overflow-hidden">
          <span className="font-medium truncate block leading-tight">
            {block.verdeler.project_number} – {block.verdeler.kast_naam}
          </span>
          {hours > 0 && (
            <span className="block text-[9px] opacity-70 leading-tight">
              {hours}u
              {block.isManual && <span className="ml-1">●</span>}
            </span>
          )}
        </div>

        {/* Right resize handle */}
        {canDrag && isEnd && (
          <div
            className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize z-10 flex items-center justify-center hover:bg-white/10 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => { e.stopPropagation(); onDragStart(e, block, 'resize-right', dateStr); }}
          >
            <div className="w-px h-3 bg-current opacity-60 rounded-full" />
          </div>
        )}

        {/* Reset to auto button — only for manually placed blocks */}
        {block.isManual && onBlockReset && !isDragging && (
          <button
            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-500 z-20 shadow"
            onClick={(e) => { e.stopPropagation(); onBlockReset(block); }}
            title="Terug naar automatische planning"
          >
            <RotateCcw size={8} className="text-gray-300" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className={`overflow-x-auto custom-scrollbar ${dragState ? 'cursor-grabbing' : ''}`}
      style={{ userSelect: dragState ? 'none' : undefined }}
    >
      <div
        ref={gridRef}
        className="min-w-[900px]"
        style={{
          display: 'grid',
          gridTemplateColumns: `160px repeat(${days.length}, minmax(${days.length > 10 ? '60px' : '80px'}, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="sticky left-0 z-20 bg-[#1A1F2C] border-b border-r border-gray-700/40 px-3 py-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Monteur</span>
        </div>
        {days.map((day, i) => {
          const dateStr = dayStrings[i];
          const weekend = isWeekend(day);
          const todayDay = isToday(day);
          const isDragHighlight = dragState &&
            !weekend &&
            dateStr >= dragState.currentStartDate &&
            dateStr <= dragState.currentEndDate;

          return (
            <div
              key={dateStr}
              className={`border-b border-r border-gray-700/30 px-1 py-2 text-center transition-colors ${
                weekend ? 'bg-gray-800/30' : todayDay ? 'bg-blue-500/10' : isDragHighlight ? 'bg-blue-500/8' : ''
              }`}
            >
              <p className={`text-[10px] uppercase ${todayDay ? 'text-blue-400 font-semibold' : 'text-gray-500'}`}>
                {format(day, 'EEE', { locale: nl })}
              </p>
              <p className={`text-xs font-medium ${todayDay ? 'text-blue-400' : weekend ? 'text-gray-600' : 'text-gray-300'}`}>
                {format(day, 'd MMM', { locale: nl })}
              </p>
            </div>
          );
        })}

        {/* Monteur rows */}
        {monteurs.map(monteur => {
          const monteurBlocks = getBlocksForMonteur(monteur);

          // Include drag ghost blocks when monteur is the drag target
          const allVisibleBlocks = [...monteurBlocks];
          if (dragState && dragState.currentMonteur === monteur && dragState.block.monteur !== monteur) {
            if (!allVisibleBlocks.find(b => b.verdeler.id === dragState.block.verdeler.id)) {
              allVisibleBlocks.push(dragState.block);
            }
          }

          const blockRows = renderMonteurBlocks(allVisibleBlocks);
          const rowCount = Math.max(blockRows.length, 1);

          const totalScheduled = dayStrings.reduce((sum, ds) => sum + getCapacity(monteur, ds).scheduledHours, 0);
          const totalAvailable = dayStrings.reduce((sum, ds) => {
            const cap = getCapacity(monteur, ds);
            return sum + (cap.isWeekend ? 0 : cap.totalAvailable);
          }, 0);

          return (
            <React.Fragment key={monteur}>
              {/* Monteur label */}
              <div className="sticky left-0 z-10 bg-[#1A1F2C] border-b border-r border-gray-700/40 px-3 py-2 flex flex-col justify-center">
                {(() => {
                  const absence = getAbsenceForMonteur(monteur);
                  if (absence) {
                    const isZiek = absence.absence_type === 'ziek';
                    return (
                      <>
                        <p className="text-xs font-medium text-white truncate">{monteur}</p>
                        <div className={`mt-1 flex items-center gap-1.5 px-2 py-1 rounded-md ${
                          isZiek ? 'bg-red-500/15 border border-red-500/30' : 'bg-amber-500/15 border border-amber-500/30'
                        }`}>
                          {isZiek
                            ? <ThermometerSun size={12} className="text-red-400 flex-shrink-0" />
                            : <UserX size={12} className="text-amber-400 flex-shrink-0" />}
                          <span className={`text-[10px] font-semibold ${isZiek ? 'text-red-400' : 'text-amber-400'}`}>
                            {isZiek ? 'Ziek' : 'Afwezig'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleResolve(absence)}
                          disabled={resolvingAbsence === absence.id}
                          className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-[10px] font-medium text-emerald-400"
                        >
                          <CheckCircle2 size={10} />
                          {resolvingAbsence === absence.id ? 'Bezig...' : 'Weer aan het werk'}
                        </button>
                      </>
                    );
                  }
                  return (
                    <>
                      <p className="text-xs font-medium text-white truncate">{monteur}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getUtilColor(totalAvailable > 0 ? (totalScheduled / totalAvailable) * 100 : 0)}`}
                            style={{ width: `${totalAvailable > 0 ? Math.min((totalScheduled / totalAvailable) * 100, 100) : 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{Math.round(totalScheduled)}/{totalAvailable}u</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Day cells */}
              {days.map((day, colIdx) => {
                const dateStr = dayStrings[colIdx];
                const cap = getCapacity(monteur, dateStr);
                const weekend = isWeekend(day);
                const todayDay = isToday(day);
                const isDragTarget = dragState &&
                  dragState.currentMonteur === monteur &&
                  dateStr >= dragState.currentStartDate &&
                  dateStr <= dragState.currentEndDate;

                // Collect all blocks to render in this cell
                const cellBlocks: ScheduledBlock[] = [];
                allVisibleBlocks.forEach(block => {
                  const effective = getEffective(block);
                  if (effective.monteur === monteur && dateStr >= effective.startDate && dateStr <= effective.endDate) {
                    if (!cellBlocks.find(b => b.verdeler.id === block.verdeler.id)) {
                      cellBlocks.push(block);
                    }
                  }
                });

                return (
                  <div
                    key={`${monteur}:${dateStr}`}
                    data-cell
                    data-date={dateStr}
                    data-monteur={monteur}
                    className={`border-b border-r border-gray-700/20 relative transition-colors ${getCellBg(cap, day)} ${todayDay ? 'ring-1 ring-inset ring-blue-500/20' : ''} ${isDragTarget && !weekend ? 'bg-blue-500/8 ring-1 ring-inset ring-blue-500/20' : ''}`}
                    style={{ minHeight: `${Math.max(rowCount * 40 + 16, 64)}px` }}
                  >
                    <div className="p-0.5 space-y-0.5">
                      {cellBlocks.map(block => renderBlock(block, monteur, dateStr))}
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

                    {cap.isOnLeave && !weekend && (() => {
                      const absence = getAbsenceForMonteur(monteur);
                      if (absence) {
                        const isZiek = absence.absence_type === 'ziek';
                        return (
                          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isZiek ? 'bg-red-500/8' : 'bg-amber-500/8'}`}>
                            <span className={`text-[9px] font-semibold ${isZiek ? 'text-red-400/70' : 'text-amber-400/70'}`}>
                              {isZiek ? 'Ziek' : 'Afwezig'}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[9px] text-gray-500 font-medium">Verlof</span>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Totals row */}
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
              className={`border-t-2 border-r border-gray-600/50 px-1 py-2 text-center ${weekend ? 'bg-gray-800/30' : 'bg-[#1E2530]'}`}
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
            Sommige verdelers kunnen niet volledig ingepland worden — onvoldoende capaciteit voor de deadline.
            Gestippelde randen geven dit aan.
          </p>
        </div>
      )}

      {selectedBlock && (
        <PlanningDetailModal
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
};

export default PlanningTimeline;
