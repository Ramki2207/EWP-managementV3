import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; solid: string; ghostBg: string }> = {
  'Productie':         { bg: 'bg-blue-500/20',    border: 'border-blue-500/40',    text: 'text-blue-200',    solid: '#3b82f6', ghostBg: 'rgba(59,130,246,0.25)' },
  'Testen':            { bg: 'bg-orange-500/20',  border: 'border-orange-500/40',  text: 'text-orange-200',  solid: '#f97316', ghostBg: 'rgba(249,115,22,0.25)' },
  'Werkvoorbereiding': { bg: 'bg-teal-500/20',    border: 'border-teal-500/40',    text: 'text-teal-200',    solid: '#14b8a6', ghostBg: 'rgba(20,184,166,0.25)' },
  'Levering':          { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-200', solid: '#10b981', ghostBg: 'rgba(16,185,129,0.25)' },
};
const DEFAULT_COLOR = { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-200', solid: '#6b7280', ghostBg: 'rgba(107,114,128,0.25)' };

type DragMode = 'move' | 'resize-left' | 'resize-right';

interface ActiveDrag {
  block: ScheduledBlock;
  mode: DragMode;
  originDateIndex: number;
  blockStartIndex: number;
  blockEndIndex: number;
  currentStartIndex: number;
  currentEndIndex: number;
  currentMonteur: string;
  rafId: number | null;
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
  const [savingBlock, setSavingBlock] = useState<string | null>(null);

  // Drag state lives entirely in refs — never causes re-renders during drag
  const dragRef = useRef<ActiveDrag | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // React state only for the "drop preview" cells — updated via rAF, not every mousemove
  const [dropPreview, setDropPreview] = useState<{ start: string; end: string; monteur: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dayStrings = useMemo(() => days.map(d => format(d, 'yyyy-MM-dd')), [days]);

  const getAbsenceForMonteur = (monteur: string) => activeAbsences.find(a => a.username === monteur);

  const getCapacity = (monteur: string, dateStr: string): MonteurDayCapacity => {
    const key = `${monteur}:${dateStr}`;
    return capacityMap[key] || {
      monteur, date: dateStr, totalAvailable: 8, scheduledHours: 0,
      actualWorkedHours: 0, remainingCapacity: 8, isOnLeave: false, isWeekend: false,
    };
  };

  const getDayTotals = (dateStr: string) => {
    let totalCapacity = 0, totalScheduled = 0;
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

  // ── Ghost helpers ─────────────────────────────────────────────────────────

  const updateGhostPosition = useCallback((clientX: number, clientY: number) => {
    const ghost = ghostRef.current;
    if (!ghost) return;
    ghost.style.left = `${clientX + 14}px`;
    ghost.style.top = `${clientY - 20}px`;
  }, []);

  const updateGhostContent = useCallback((drag: ActiveDrag) => {
    const ghost = ghostRef.current;
    if (!ghost) return;
    const { block, mode, currentStartIndex, currentEndIndex, currentMonteur } = drag;
    if (mode === 'move') {
      ghost.querySelector('[data-ghost-monteur]')!.textContent = currentMonteur;
    } else {
      const start = dayStrings[currentStartIndex] || '';
      const end = dayStrings[currentEndIndex] || '';
      ghost.querySelector('[data-ghost-range]')!.textContent = `${start} → ${end}`;
    }
  }, [dayStrings]);

  // ── Cell detection ────────────────────────────────────────────────────────

  const getCellAtPoint = useCallback((clientX: number, clientY: number): { dateStr: string; monteur: string } | null => {
    // Temporarily hide ghost so elementFromPoint works correctly
    const ghost = ghostRef.current;
    if (ghost) ghost.style.pointerEvents = 'none';
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (ghost) ghost.style.pointerEvents = 'none';
    if (!el) return null;
    const cell = el.closest('[data-cell]') as HTMLElement | null;
    if (!cell) return null;
    return { dateStr: cell.dataset.date || '', monteur: cell.dataset.monteur || '' };
  }, []);

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const startDrag = useCallback((
    e: React.MouseEvent,
    block: ScheduledBlock,
    mode: DragMode,
    dateStr: string
  ) => {
    if (!onBlockMove && !onBlockResize) return;
    e.preventDefault();
    e.stopPropagation();

    const startIdx = dayStrings.indexOf(block.startDate);
    const endIdx = dayStrings.indexOf(block.endDate);
    const originIdx = dayStrings.indexOf(dateStr);

    dragRef.current = {
      block,
      mode,
      originDateIndex: originIdx !== -1 ? originIdx : startIdx,
      blockStartIndex: startIdx !== -1 ? startIdx : 0,
      blockEndIndex: endIdx !== -1 ? endIdx : dayStrings.length - 1,
      currentStartIndex: startIdx !== -1 ? startIdx : 0,
      currentEndIndex: endIdx !== -1 ? endIdx : dayStrings.length - 1,
      currentMonteur: block.monteur,
      rafId: null,
    };

    setIsDragging(true);
    setDropPreview(null);

    // Show ghost immediately
    const ghost = ghostRef.current;
    if (ghost) {
      ghost.style.display = 'block';
      ghost.style.left = `${e.clientX + 14}px`;
      ghost.style.top = `${e.clientY - 20}px`;

      // Set initial content
      const colors = STATUS_COLORS[block.verdeler.status] || DEFAULT_COLOR;
      const moveEl = ghost.querySelector('[data-ghost-move]') as HTMLElement;
      const resizeEl = ghost.querySelector('[data-ghost-resize]') as HTMLElement;

      if (mode === 'move') {
        if (moveEl) moveEl.style.display = 'block';
        if (resizeEl) resizeEl.style.display = 'none';
        ghost.style.background = colors.ghostBg;
        ghost.style.borderColor = colors.solid + 'aa';
        const nameEl = ghost.querySelector('[data-ghost-name]') as HTMLElement;
        const clientEl = ghost.querySelector('[data-ghost-client]') as HTMLElement;
        const infoEl = ghost.querySelector('[data-ghost-info]') as HTMLElement;
        const monteurEl = ghost.querySelector('[data-ghost-monteur]') as HTMLElement;
        if (nameEl) nameEl.textContent = `${block.verdeler.project_number} – ${block.verdeler.kast_naam}`;
        if (clientEl) clientEl.textContent = block.verdeler.client;
        if (infoEl) infoEl.textContent = `${block.verdeler.remaining_hours}u · ${block.verdeler.status}`;
        if (monteurEl) monteurEl.textContent = block.monteur;
      } else {
        if (moveEl) moveEl.style.display = 'none';
        if (resizeEl) resizeEl.style.display = 'block';
        const start = dayStrings[startIdx] || '';
        const end = dayStrings[endIdx] || '';
        const rangeEl = ghost.querySelector('[data-ghost-range]') as HTMLElement;
        if (rangeEl) rangeEl.textContent = `${start} → ${end}`;
        ghost.style.background = colors.ghostBg;
        ghost.style.borderColor = colors.solid + 'aa';
      }
    }
  }, [dayStrings, onBlockMove, onBlockResize]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    // Move ghost via direct DOM — zero React overhead
    updateGhostPosition(e.clientX, e.clientY);

    if (drag.rafId !== null) return;

    drag.rafId = requestAnimationFrame(() => {
      drag.rafId = null;
      const currentDrag = dragRef.current;
      if (!currentDrag) return;

      const cell = getCellAtPoint(e.clientX, e.clientY);
      if (!cell?.dateStr) return;

      const hoveredIdx = dayStrings.indexOf(cell.dateStr);
      if (hoveredIdx === -1) return;

      const { mode, blockStartIndex, blockEndIndex, originDateIndex } = currentDrag;
      let changed = false;

      if (mode === 'move') {
        const span = blockEndIndex - blockStartIndex;
        const delta = hoveredIdx - originDateIndex;
        const newStart = Math.max(0, blockStartIndex + delta);
        const newEnd = Math.min(dayStrings.length - 1, newStart + span);
        const newMonteur = cell.monteur || currentDrag.currentMonteur;
        if (newStart !== currentDrag.currentStartIndex || newEnd !== currentDrag.currentEndIndex || newMonteur !== currentDrag.currentMonteur) {
          currentDrag.currentStartIndex = newStart;
          currentDrag.currentEndIndex = newEnd;
          currentDrag.currentMonteur = newMonteur;
          changed = true;
        }
      } else if (mode === 'resize-right') {
        const clamped = Math.max(currentDrag.currentStartIndex, hoveredIdx);
        if (clamped !== currentDrag.currentEndIndex) {
          currentDrag.currentEndIndex = clamped;
          changed = true;
        }
      } else if (mode === 'resize-left') {
        const clamped = Math.min(currentDrag.currentEndIndex, hoveredIdx);
        if (clamped !== currentDrag.currentStartIndex) {
          currentDrag.currentStartIndex = clamped;
          changed = true;
        }
      }

      if (changed) {
        updateGhostContent(currentDrag);
        setDropPreview({
          start: dayStrings[currentDrag.currentStartIndex],
          end: dayStrings[currentDrag.currentEndIndex],
          monteur: currentDrag.currentMonteur,
        });
      }
    });
  }, [dayStrings, getCellAtPoint, updateGhostPosition, updateGhostContent]);

  const onMouseUp = useCallback(async (e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.rafId !== null) {
      cancelAnimationFrame(drag.rafId);
      drag.rafId = null;
    }

    dragRef.current = null;
    setIsDragging(false);
    setDropPreview(null);

    const ghost = ghostRef.current;
    if (ghost) ghost.style.display = 'none';

    const { block, mode, currentStartIndex, currentEndIndex, currentMonteur } = drag;
    const newStart = dayStrings[currentStartIndex];
    const newEnd = dayStrings[currentEndIndex];

    if (
      newStart === block.startDate &&
      newEnd === block.endDate &&
      currentMonteur === block.monteur
    ) return;

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
  }, [dayStrings, onBlockMove, onBlockResize]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

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

  // ── Block renderer ────────────────────────────────────────────────────────

  const renderBlock = (block: ScheduledBlock, monteur: string, dateStr: string) => {
    const hours = block.dailyHours[dateStr];
    if (!hours) return null;

    const colors = STATUS_COLORS[block.verdeler.status] || DEFAULT_COLOR;
    const isHovered = hoveredBlock === block.verdeler.id && !isDragging;
    const isSaving = savingBlock === block.verdeler.id;
    const isBeingDragged = isDragging && dragRef.current?.block.verdeler.id === block.verdeler.id;
    const isStart = dateStr === block.startDate;
    const isEnd = dateStr === block.endDate;
    const canDrag = !!(onBlockMove || onBlockResize);

    return (
      <div
        key={block.verdeler.id}
        className={[
          'relative group flex items-center px-1.5 py-0.5 rounded text-[10px] leading-tight select-none border',
          colors.border, colors.bg, colors.text,
          block.isOverdue ? 'ring-1 ring-red-500/40' : '',
          block.cannotFit ? 'border-dashed opacity-70' : '',
          block.isManual ? 'ring-1 ring-white/15' : '',
          isHovered ? 'brightness-125 shadow-lg z-10' : '',
          isBeingDragged ? 'opacity-20' : '',
          isSaving ? 'opacity-40 pointer-events-none' : '',
        ].join(' ')}
        style={{ cursor: canDrag ? 'grab' : 'pointer' }}
        onClick={() => { if (!isDragging) setSelectedBlock(block); }}
        onMouseEnter={() => { if (!isDragging) setHoveredBlock(block.verdeler.id); }}
        onMouseLeave={() => setHoveredBlock(null)}
        onMouseDown={canDrag ? (e) => startDrag(e, block, 'move', dateStr) : undefined}
      >
        {/* Left resize handle */}
        {canDrag && isStart && (
          <div
            className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-l"
            style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }}
            onMouseDown={(e) => { e.stopPropagation(); startDrag(e, block, 'resize-left', dateStr); }}
          >
            <div className="w-0.5 h-3 rounded-full opacity-70" style={{ background: colors.solid }} />
          </div>
        )}

        <div className="min-w-0 flex-1 overflow-hidden pl-1">
          <span className="font-semibold truncate block leading-tight">
            {block.verdeler.project_number}
            {block.verdeler.kast_naam ? ` – ${block.verdeler.kast_naam}` : ''}
          </span>
          <span className="block text-[9px] opacity-55 leading-tight">
            {hours}u{block.isManual ? ' ·' : ''}
          </span>
        </div>

        {/* Right resize handle */}
        {canDrag && isEnd && (
          <div
            className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-r"
            style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.1), transparent)' }}
            onMouseDown={(e) => { e.stopPropagation(); startDrag(e, block, 'resize-right', dateStr); }}
          >
            <div className="w-0.5 h-3 rounded-full opacity-70" style={{ background: colors.solid }} />
          </div>
        )}

        {/* Reset button */}
        {block.isManual && onBlockReset && !isDragging && (
          <button
            className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-gray-700 hover:bg-gray-600 border border-gray-600 z-30 shadow"
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
      {/* Ghost element — always in DOM, shown/hidden via display */}
      <div
        ref={ghostRef}
        style={{
          display: 'none',
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 9999,
          minWidth: 140,
          maxWidth: 200,
          borderRadius: 8,
          border: '1px solid',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          padding: '6px 10px',
          transform: 'rotate(1.5deg)',
          willChange: 'transform, left, top',
        }}
      >
        {/* Move ghost */}
        <div data-ghost-move style={{ display: 'none' }}>
          <div data-ghost-name style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} />
          <div data-ghost-client style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }} />
          <div data-ghost-info style={{ fontSize: 9, color: '#6b7280', marginTop: 1 }} />
          <div data-ghost-monteur style={{ fontSize: 9, fontWeight: 600, color: '#d1d5db', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
        </div>
        {/* Resize ghost */}
        <div data-ghost-resize style={{ display: 'none' }}>
          <div data-ghost-range style={{ fontSize: 11, fontWeight: 600, color: '#e5e7eb' }} />
        </div>
      </div>

      <div
        ref={gridRef}
        className="overflow-x-auto"
        style={{ userSelect: isDragging ? 'none' : undefined, cursor: isDragging ? 'grabbing' : undefined }}
      >
        <div
          className="min-w-[900px]"
          style={{
            display: 'grid',
            gridTemplateColumns: `160px repeat(${days.length}, minmax(${days.length > 10 ? '58px' : '76px'}, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="sticky left-0 z-20 bg-[#1A1F2C] border-b border-r border-gray-700/40 px-3 py-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Monteur</span>
          </div>
          {days.map((day, i) => {
            const dateStr = dayStrings[i];
            const weekend = isWeekend(day);
            const todayDay = isToday(day);
            const inRange = dropPreview && !weekend && dateStr >= dropPreview.start && dateStr <= dropPreview.end;

            return (
              <div
                key={dateStr}
                className={[
                  'border-b border-r border-gray-700/30 px-1 py-2 text-center',
                  weekend ? 'bg-gray-800/30' : todayDay ? 'bg-blue-500/10' : inRange ? 'bg-blue-400/8' : '',
                ].join(' ')}
              >
                <p className={`text-[10px] uppercase font-medium ${todayDay ? 'text-blue-400' : 'text-gray-500'}`}>
                  {format(day, 'EEE', { locale: nl })}
                </p>
                <p className={`text-xs font-semibold ${todayDay ? 'text-blue-400' : weekend ? 'text-gray-600' : inRange ? 'text-blue-300' : 'text-gray-300'}`}>
                  {format(day, 'd', { locale: nl })}
                </p>
                <p className={`text-[9px] ${weekend ? 'text-gray-700' : inRange ? 'text-blue-400/70' : 'text-gray-500'}`}>
                  {format(day, 'MMM', { locale: nl })}
                </p>
              </div>
            );
          })}

          {/* Monteur rows */}
          {monteurs.map(monteur => {
            const monteurBlocks = getBlocksForMonteur(monteur);
            const blockRows = renderMonteurBlocks(monteurBlocks);
            const rowCount = Math.max(blockRows.length, 1);
            const totalScheduled = dayStrings.reduce((s, ds) => s + getCapacity(monteur, ds).scheduledHours, 0);
            const totalAvailable = dayStrings.reduce((s, ds) => {
              const c = getCapacity(monteur, ds);
              return s + (c.isWeekend ? 0 : c.totalAvailable);
            }, 0);
            const absence = getAbsenceForMonteur(monteur);

            return (
              <React.Fragment key={monteur}>
                {/* Label cell */}
                <div className="sticky left-0 z-10 bg-[#1A1F2C] border-b border-r border-gray-700/40 px-3 py-2 flex flex-col justify-center">
                  <p className="text-xs font-medium text-white truncate">{monteur}</p>
                  {absence ? (
                    <>
                      <div className={`mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded ${
                        absence.absence_type === 'ziek'
                          ? 'bg-red-500/15 border border-red-500/25 text-red-400'
                          : 'bg-amber-500/15 border border-amber-500/25 text-amber-400'
                      }`}>
                        {absence.absence_type === 'ziek'
                          ? <ThermometerSun size={10} />
                          : <UserX size={10} />}
                        <span className="text-[10px] font-semibold">
                          {absence.absence_type === 'ziek' ? 'Ziek' : 'Afwezig'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleResolve(absence)}
                        disabled={resolvingAbsence === absence.id}
                        className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all text-[10px] font-medium text-emerald-400"
                      >
                        <CheckCircle2 size={9} />
                        {resolvingAbsence === absence.id ? '...' : 'Terug'}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1 bg-gray-700/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getUtilColor(totalAvailable > 0 ? (totalScheduled / totalAvailable) * 100 : 0)}`}
                          style={{ width: `${totalAvailable > 0 ? Math.min((totalScheduled / totalAvailable) * 100, 100) : 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-500 flex-shrink-0">{Math.round(totalScheduled)}u</span>
                    </div>
                  )}
                </div>

                {/* Day cells */}
                {days.map((day, colIdx) => {
                  const dateStr = dayStrings[colIdx];
                  const cap = getCapacity(monteur, dateStr);
                  const weekend = isWeekend(day);
                  const todayDay = isToday(day);
                  const isDropTarget = dropPreview &&
                    !weekend &&
                    dropPreview.monteur === monteur &&
                    dateStr >= dropPreview.start &&
                    dateStr <= dropPreview.end;

                  const cellBlocks: ScheduledBlock[] = [];
                  blockRows.forEach(row => {
                    row.forEach(b => {
                      if (b.dailyHours[dateStr] && !cellBlocks.find(x => x.verdeler.id === b.verdeler.id)) {
                        cellBlocks.push(b);
                      }
                    });
                  });

                  return (
                    <div
                      key={`${monteur}:${dateStr}`}
                      data-cell
                      data-date={dateStr}
                      data-monteur={monteur}
                      className={[
                        'border-b border-r border-gray-700/20 relative',
                        getCellBg(cap, day),
                        todayDay ? 'ring-1 ring-inset ring-blue-500/15' : '',
                      ].join(' ')}
                      style={{
                        minHeight: `${Math.max(rowCount * 38 + 12, 56)}px`,
                        ...(isDropTarget ? {
                          background: 'rgba(59,130,246,0.1)',
                          boxShadow: 'inset 0 0 0 1.5px rgba(59,130,246,0.4)',
                        } : {}),
                      }}
                    >
                      <div className="p-0.5 space-y-0.5">
                        {cellBlocks.map(b => renderBlock(b, monteur, dateStr))}
                      </div>

                      {!weekend && !cap.isOnLeave && (
                        <div className="absolute bottom-0 left-0 right-0 px-0.5 pb-0.5">
                          <div className="h-0.5 bg-gray-700/40 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getUtilColor(cap.totalAvailable > 0 ? (cap.scheduledHours / cap.totalAvailable) * 100 : 0)}`}
                              style={{ width: `${cap.totalAvailable > 0 ? Math.min((cap.scheduledHours / cap.totalAvailable) * 100, 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {cap.isOnLeave && !weekend && (
                        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
                          absence?.absence_type === 'ziek' ? 'bg-red-500/6' : 'bg-amber-500/6'
                        }`}>
                          <span className={`text-[9px] font-medium ${
                            absence?.absence_type === 'ziek' ? 'text-red-400/60' : 'text-amber-400/60'
                          }`}>
                            {absence?.absence_type === 'ziek' ? 'Ziek' : 'Verlof'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Totals row */}
          <div className="sticky left-0 z-10 bg-[#1C2130] border-t-2 border-r border-gray-600/40 px-3 py-2 flex items-center">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Bezetting</span>
          </div>
          {days.map((day, i) => {
            const dateStr = dayStrings[i];
            const weekend = isWeekend(day);
            const { totalCapacity, totalScheduled, percent } = getDayTotals(dateStr);
            return (
              <div
                key={`total:${dateStr}`}
                className={`border-t-2 border-r border-gray-600/40 px-1 py-2 text-center ${weekend ? 'bg-gray-800/30' : 'bg-[#1C2130]'}`}
              >
                {!weekend && (
                  <>
                    <p className={`text-[10px] font-bold ${percent >= 90 ? 'text-red-400' : percent >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {Math.round(percent)}%
                    </p>
                    <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden mt-0.5">
                      <div
                        className={`h-full rounded-full ${getUtilColor(percent)}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <p className="text-[8px] text-gray-600 mt-0.5">{Math.round(totalScheduled)}/{totalCapacity}u</p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {blocks.some(b => b.cannotFit) && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-400">
              Sommige verdelers kunnen niet volledig ingepland worden — onvoldoende capaciteit voor de deadline.
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
