import React, { useState, useRef, useCallback, useEffect } from 'react';
import { format, isToday, isWeekend } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ScheduledBlock, MonteurDayCapacity } from './planningTypes';
import { AlertTriangle, ThermometerSun, UserX, CheckCircle2, RotateCcw } from 'lucide-react';
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

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; solid: string }> = {
  'Productie':         { bg: 'bg-blue-500/25',    border: 'border-blue-500/50',    text: 'text-blue-200',    solid: '#3b82f6' },
  'Testen':            { bg: 'bg-orange-500/25',  border: 'border-orange-500/50',  text: 'text-orange-200',  solid: '#f97316' },
  'Werkvoorbereiding': { bg: 'bg-teal-500/25',    border: 'border-teal-500/50',    text: 'text-teal-200',    solid: '#14b8a6' },
  'Levering':          { bg: 'bg-emerald-500/25', border: 'border-emerald-500/50', text: 'text-emerald-200', solid: '#10b981' },
};
const DEFAULT_COLOR = { bg: 'bg-gray-500/25', border: 'border-gray-500/50', text: 'text-gray-200', solid: '#6b7280' };

type DragMode = 'move' | 'resize-left' | 'resize-right';

interface DragState {
  block: ScheduledBlock;
  mode: DragMode;
  originDateIndex: number;
  blockStartIndex: number;
  blockEndIndex: number;
  currentStartIndex: number;
  currentEndIndex: number;
  currentMonteur: string;
  // For floating ghost
  ghostX: number;
  ghostY: number;
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
  const mouseDownRef = useRef<{ blockId: string; ts: number } | null>(null);

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

  const getBlocksForMonteur = (monteur: string) => blocks.filter(b => b.monteur === monteur);

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
        const overlaps = row.some(e => block.startDate <= e.endDate && block.endDate >= e.startDate);
        if (!overlaps) { row.push(block); placed = true; break; }
      }
      if (!placed) rows.push([block]);
    }
    return rows;
  };

  // ── Drag helpers ─────────────────────────────────────────────────────────────

  const getCellAtPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (!el) return null;
    const cell = el.closest('[data-cell]') as HTMLElement | null;
    if (!cell) return null;
    return { dateStr: cell.dataset.date || '', monteur: cell.dataset.monteur || '' };
  }, []);

  const onHandleMouseDown = useCallback((
    e: React.MouseEvent,
    block: ScheduledBlock,
    mode: DragMode,
    dateStr: string
  ) => {
    if (!onBlockMove && !onBlockResize) return;
    e.preventDefault();
    e.stopPropagation();

    mouseDownRef.current = { blockId: block.verdeler.id, ts: Date.now() };

    const startIdx = dayStrings.indexOf(block.startDate);
    const endIdx = dayStrings.indexOf(block.endDate);
    const originIdx = dayStrings.indexOf(dateStr);

    setDragState({
      block,
      mode,
      originDateIndex: originIdx !== -1 ? originIdx : startIdx,
      blockStartIndex: startIdx !== -1 ? startIdx : 0,
      blockEndIndex: endIdx !== -1 ? endIdx : dayStrings.length - 1,
      currentStartIndex: startIdx !== -1 ? startIdx : 0,
      currentEndIndex: endIdx !== -1 ? endIdx : dayStrings.length - 1,
      currentMonteur: block.monteur,
      ghostX: e.clientX,
      ghostY: e.clientY,
    });
  }, [dayStrings, onBlockMove, onBlockResize]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;

    // Update ghost position always
    setDragState(prev => prev ? { ...prev, ghostX: e.clientX, ghostY: e.clientY } : null);

    const cell = getCellAtPoint(e.clientX, e.clientY);
    if (!cell?.dateStr) return;

    const hoveredIdx = dayStrings.indexOf(cell.dateStr);
    if (hoveredIdx === -1) return;

    const { mode, blockStartIndex, blockEndIndex, originDateIndex, currentStartIndex, currentEndIndex, currentMonteur } = dragState;

    if (mode === 'move') {
      const span = blockEndIndex - blockStartIndex;
      const delta = hoveredIdx - originDateIndex;
      const newStart = Math.max(0, blockStartIndex + delta);
      const newEnd = Math.min(dayStrings.length - 1, newStart + span);
      const newMonteur = cell.monteur || currentMonteur;
      if (newStart !== currentStartIndex || newEnd !== currentEndIndex || newMonteur !== currentMonteur) {
        setDragState(prev => prev ? { ...prev, currentStartIndex: newStart, currentEndIndex: newEnd, currentMonteur: newMonteur } : null);
      }
    } else if (mode === 'resize-right') {
      const clamped = Math.max(currentStartIndex, hoveredIdx);
      if (clamped !== currentEndIndex) {
        setDragState(prev => prev ? { ...prev, currentEndIndex: clamped } : null);
      }
    } else if (mode === 'resize-left') {
      const clamped = Math.min(currentEndIndex, hoveredIdx);
      if (clamped !== currentStartIndex) {
        setDragState(prev => prev ? { ...prev, currentStartIndex: clamped } : null);
      }
    }
  }, [dragState, dayStrings, getCellAtPoint]);

  const onMouseUp = useCallback(async () => {
    if (!dragState) return;
    const { block, mode, currentStartIndex, currentEndIndex, currentMonteur, blockStartIndex, blockEndIndex } = dragState;
    const newStart = dayStrings[currentStartIndex];
    const newEnd = dayStrings[currentEndIndex];

    const unchanged =
      newStart === block.startDate &&
      newEnd === block.endDate &&
      currentMonteur === block.monteur;

    setDragState(null);
    mouseDownRef.current = null;
    if (unchanged) return;

    setSavingBlock(block.verdeler.id);
    try {
      if (mode === 'move' && onBlockMove) {
        await onBlockMove(block, newStart, newEnd, currentMonteur);
        toast.success('Planning opgeslagen');
      } else if ((mode === 'resize-left' || mode === 'resize-right') && onBlockResize) {
        await onBlockResize(block, newStart, newEnd);
        toast.success('Planning opgeslagen');
      }
    } catch {
      toast.error('Kon planning niet opslaan');
    } finally {
      setSavingBlock(null);
    }
  }, [dragState, dayStrings, onBlockMove, onBlockResize]);

  useEffect(() => {
    if (!dragState) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragState, onMouseMove, onMouseUp]);

  // ── Ghost overlay (floating, follows cursor) ──────────────────────────────
  const renderGhost = () => {
    if (!dragState) return null;
    const { block, mode, ghostX, ghostY } = dragState;
    const colors = STATUS_COLORS[block.verdeler.status] || DEFAULT_COLOR;

    if (mode === 'move') {
      return (
        <div
          style={{
            position: 'fixed',
            left: ghostX + 12,
            top: ghostY - 18,
            pointerEvents: 'none',
            zIndex: 9999,
            minWidth: 140,
            maxWidth: 220,
            transform: 'rotate(1.5deg)',
          }}
          className={`px-2 py-1.5 rounded-lg border shadow-2xl ${colors.border} ${colors.bg} ${colors.text} backdrop-blur-sm`}
        >
          <div className="text-[10px] font-bold leading-tight truncate">
            {block.verdeler.project_number} – {block.verdeler.kast_naam}
          </div>
          <div className="text-[9px] opacity-70 mt-0.5">{block.verdeler.client}</div>
          <div className="text-[9px] opacity-60">{block.verdeler.remaining_hours}u · {block.verdeler.status}</div>
          <div className={`mt-1 text-[8px] font-semibold uppercase tracking-wider opacity-80`}>
            {dragState.currentMonteur}
          </div>
        </div>
      );
    }

    // resize ghost: just a small tooltip
    const startStr = dayStrings[dragState.currentStartIndex] || '';
    const endStr = dayStrings[dragState.currentEndIndex] || '';
    return (
      <div
        style={{
          position: 'fixed',
          left: ghostX + 12,
          top: ghostY - 14,
          pointerEvents: 'none',
          zIndex: 9999,
        }}
        className={`px-2 py-1 rounded-lg border shadow-xl text-[10px] font-medium ${colors.border} ${colors.bg} ${colors.text}`}
      >
        {startStr} → {endStr}
      </div>
    );
  };

  // ── Highlight range for in-grid preview ──────────────────────────────────
  const dragPreviewRange = dragState
    ? { start: dayStrings[dragState.currentStartIndex], end: dayStrings[dragState.currentEndIndex], monteur: dragState.currentMonteur }
    : null;

  // ── Block renderer ────────────────────────────────────────────────────────
  const renderBlock = (block: ScheduledBlock, monteur: string, dateStr: string) => {
    const hours = block.dailyHours[dateStr];
    if (!hours) return null;

    const colors = STATUS_COLORS[block.verdeler.status] || DEFAULT_COLOR;
    const isHovered = hoveredBlock === block.verdeler.id && !dragState;
    const isSaving = savingBlock === block.verdeler.id;
    const isDragging = dragState?.block.verdeler.id === block.verdeler.id;
    const isStart = dateStr === block.startDate;
    const isEnd = dateStr === block.endDate;
    const canDrag = !!(onBlockMove || onBlockResize);

    return (
      <div
        key={block.verdeler.id}
        className={`
          relative group flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] leading-tight select-none
          border ${colors.border} ${colors.bg} ${colors.text}
          ${block.isOverdue ? 'border-red-500/70 ring-1 ring-red-500/30' : ''}
          ${block.cannotFit ? 'border-dashed' : ''}
          ${block.isManual ? 'ring-1 ring-white/10' : ''}
          ${isHovered ? 'brightness-125 shadow-lg z-10' : ''}
          ${isDragging ? 'opacity-30' : ''}
          ${isSaving ? 'opacity-40' : ''}
          transition-all duration-75
        `}
        style={{ cursor: canDrag ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
        onClick={() => { if (!dragState) setSelectedBlock(block); }}
        onMouseEnter={() => { if (!dragState) setHoveredBlock(block.verdeler.id); }}
        onMouseLeave={() => setHoveredBlock(null)}
        onMouseDown={canDrag ? (e) => onHandleMouseDown(e, block, 'move', dateStr) : undefined}
        title={`${block.verdeler.kast_naam} — ${block.verdeler.project_number}\n${block.verdeler.client}\n${block.verdeler.remaining_hours}u resterend\nMonteur: ${block.monteur}${block.isManual ? '\n● Handmatig' : ''}`}
      >
        {/* Left resize handle */}
        {canDrag && isStart && (
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/15 rounded-l"
            onMouseDown={(e) => { e.stopPropagation(); onHandleMouseDown(e, block, 'resize-left', dateStr); }}
          >
            <div className="w-px h-4 rounded-full" style={{ background: colors.solid }} />
          </div>
        )}

        <div className="min-w-0 flex-1 overflow-hidden pl-1.5">
          <span className="font-semibold truncate block leading-tight">
            {block.verdeler.project_number} – {block.verdeler.kast_naam}
          </span>
          <span className="block text-[9px] opacity-60 leading-tight">
            {hours}u{block.isManual ? ' ●' : ''}
          </span>
        </div>

        {/* Right resize handle */}
        {canDrag && isEnd && (
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/15 rounded-r"
            onMouseDown={(e) => { e.stopPropagation(); onHandleMouseDown(e, block, 'resize-right', dateStr); }}
          >
            <div className="w-px h-4 rounded-full" style={{ background: colors.solid }} />
          </div>
        )}

        {/* Reset button */}
        {block.isManual && onBlockReset && !dragState && (
          <button
            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-500 z-30 shadow"
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
    <>
      {/* Floating drag ghost */}
      {renderGhost()}

      <div
        className="overflow-x-auto custom-scrollbar"
        style={{ userSelect: dragState ? 'none' : undefined, cursor: dragState?.mode === 'move' ? 'grabbing' : undefined }}
      >
        <div
          className="min-w-[900px]"
          style={{
            display: 'grid',
            gridTemplateColumns: `160px repeat(${days.length}, minmax(${days.length > 10 ? '60px' : '80px'}, 1fr))`,
          }}
        >
          {/* Header */}
          <div className="sticky left-0 z-20 bg-[#1A1F2C] border-b border-r border-gray-700/40 px-3 py-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Monteur</span>
          </div>
          {days.map((day, i) => {
            const dateStr = dayStrings[i];
            const weekend = isWeekend(day);
            const todayDay = isToday(day);
            const inDragRange = dragPreviewRange &&
              !weekend &&
              dateStr >= dragPreviewRange.start &&
              dateStr <= dragPreviewRange.end;

            return (
              <div
                key={dateStr}
                className={`border-b border-r border-gray-700/30 px-1 py-2 text-center transition-colors duration-75 ${
                  weekend ? 'bg-gray-800/30' :
                  todayDay ? 'bg-blue-500/10' :
                  inDragRange ? 'bg-blue-400/10' : ''
                }`}
              >
                <p className={`text-[10px] uppercase ${todayDay ? 'text-blue-400 font-semibold' : 'text-gray-500'}`}>
                  {format(day, 'EEE', { locale: nl })}
                </p>
                <p className={`text-xs font-medium ${todayDay ? 'text-blue-400' : weekend ? 'text-gray-600' : inDragRange ? 'text-blue-300' : 'text-gray-300'}`}>
                  {format(day, 'd MMM', { locale: nl })}
                </p>
              </div>
            );
          })}

          {/* Monteur rows */}
          {monteurs.map(monteur => {
            const monteurBlocks = getBlocksForMonteur(monteur);
            const blockRows = renderMonteurBlocks(monteurBlocks);
            const rowCount = Math.max(blockRows.length, 1);

            const totalScheduled = dayStrings.reduce((sum, ds) => sum + getCapacity(monteur, ds).scheduledHours, 0);
            const totalAvailable = dayStrings.reduce((sum, ds) => {
              const cap = getCapacity(monteur, ds);
              return sum + (cap.isWeekend ? 0 : cap.totalAvailable);
            }, 0);

            return (
              <React.Fragment key={monteur}>
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

                {days.map((day, colIdx) => {
                  const dateStr = dayStrings[colIdx];
                  const cap = getCapacity(monteur, dateStr);
                  const weekend = isWeekend(day);
                  const todayDay = isToday(day);

                  // Highlight drop target cells
                  const isDropTarget = dragPreviewRange &&
                    !weekend &&
                    dragPreviewRange.monteur === monteur &&
                    dateStr >= dragPreviewRange.start &&
                    dateStr <= dragPreviewRange.end;

                  const cellBlocks: ScheduledBlock[] = [];
                  blockRows.forEach(row => {
                    row.forEach(block => {
                      if (block.dailyHours[dateStr]) {
                        if (!cellBlocks.find(b => b.verdeler.id === block.verdeler.id)) {
                          cellBlocks.push(block);
                        }
                      }
                    });
                  });

                  return (
                    <div
                      key={`${monteur}:${dateStr}`}
                      data-cell
                      data-date={dateStr}
                      data-monteur={monteur}
                      className={`border-b border-r border-gray-700/20 relative transition-colors duration-75 ${getCellBg(cap, day)} ${todayDay ? 'ring-1 ring-inset ring-blue-500/20' : ''}`}
                      style={{
                        minHeight: `${Math.max(rowCount * 40 + 16, 64)}px`,
                        ...(isDropTarget ? { background: 'rgba(59,130,246,0.1)', boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.3)' } : {}),
                      }}
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
      </div>

      {selectedBlock && (
        <PlanningDetailModal
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </>
  );
};

export default PlanningTimeline;


export default PlanningTimeline