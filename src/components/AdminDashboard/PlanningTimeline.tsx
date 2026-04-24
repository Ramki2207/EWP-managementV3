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

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; solid: string; ghostBg: string; barBg: string }> = {
  'Productie':         { bg: 'bg-blue-500/20',    border: 'border-blue-500/40',    text: 'text-blue-100',    solid: '#3b82f6', ghostBg: 'rgba(59,130,246,0.25)',   barBg: 'rgba(59,130,246,0.22)' },
  'Testen':            { bg: 'bg-orange-500/20',  border: 'border-orange-500/40',  text: 'text-orange-100',  solid: '#f97316', ghostBg: 'rgba(249,115,22,0.25)',   barBg: 'rgba(249,115,22,0.22)' },
  'Werkvoorbereiding': { bg: 'bg-teal-500/20',    border: 'border-teal-500/40',    text: 'text-teal-100',    solid: '#14b8a6', ghostBg: 'rgba(20,184,166,0.25)',   barBg: 'rgba(20,184,166,0.22)' },
  'Levering':          { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-100', solid: '#10b981', ghostBg: 'rgba(16,185,129,0.25)',   barBg: 'rgba(16,185,129,0.22)' },
};
const DEFAULT_COLOR = { bg: 'bg-gray-500/20', border: 'border-gray-500/40', text: 'text-gray-200', solid: '#6b7280', ghostBg: 'rgba(107,114,128,0.25)', barBg: 'rgba(107,114,128,0.22)' };

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

// How many stacking rows a monteur needs (blocks that overlap in date need different rows)
function computeRowCount(blocks: ScheduledBlock[]): number {
  const rows: Array<{ start: string; end: string }> = [];
  for (const b of blocks) {
    let placed = false;
    for (const row of rows) {
      if (b.startDate > row.end || b.endDate < row.start) {
        row.start = b.startDate < row.start ? b.startDate : row.start;
        row.end = b.endDate > row.end ? b.endDate : row.end;
        placed = true;
        break;
      }
    }
    if (!placed) rows.push({ start: b.startDate, end: b.endDate });
  }
  return Math.max(rows.length, 1);
}

// Assign a vertical lane (row index) to each block so non-overlapping blocks share lanes
function assignLanes(blocks: ScheduledBlock[]): Map<string, number> {
  const lanes = new Map<string, number>();
  const laneEndDates: string[] = [];
  const sorted = [...blocks].sort((a, b) => a.startDate.localeCompare(b.startDate));
  for (const b of sorted) {
    let lane = laneEndDates.findIndex(endDate => b.startDate > endDate);
    if (lane === -1) { lane = laneEndDates.length; laneEndDates.push(b.endDate); }
    else { laneEndDates[lane] = b.endDate; }
    lanes.set(b.verdeler.id, lane);
  }
  return lanes;
}

const BLOCK_HEIGHT = 34; // px per lane
const BLOCK_GAP = 4;     // px between stacked lanes
const ROW_PADDING = 8;   // top + bottom padding inside the row

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
  const [dropPreview, setDropPreview] = useState<{ start: string; end: string; monteur: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<ActiveDrag | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const dayStrings = useMemo(() => days.map(d => format(d, 'yyyy-MM-dd')), [days]);

  // Pre-compute lane assignments per monteur
  const laneMap = useMemo(() => {
    const result = new Map<string, Map<string, number>>();
    for (const monteur of monteurs) {
      const mb = blocks.filter(b => b.monteur === monteur);
      result.set(monteur, assignLanes(mb));
    }
    return result;
  }, [monteurs, blocks]);

  const rowHeightForMonteur = (monteur: string): number => {
    const mb = blocks.filter(b => b.monteur === monteur);
    const laneCount = computeRowCount(mb);
    return laneCount * (BLOCK_HEIGHT + BLOCK_GAP) - BLOCK_GAP + ROW_PADDING * 2;
  };

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

  const getUtilColor = (pct: number) => pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  const getUtilColorSolid = (pct: number) => pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';

  const getCellBg = (cap: MonteurDayCapacity, day: Date) => {
    if (isWeekend(day)) return 'bg-gray-800/30';
    if (cap.isOnLeave) return 'bg-gray-700/30';
    return '';
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
    if (drag.mode === 'move') {
      const el = ghost.querySelector('[data-ghost-monteur]') as HTMLElement;
      if (el) el.textContent = drag.currentMonteur;
    } else {
      const el = ghost.querySelector('[data-ghost-range]') as HTMLElement;
      if (el) el.textContent = `${dayStrings[drag.currentStartIndex] || ''} → ${dayStrings[drag.currentEndIndex] || ''}`;
    }
  }, [dayStrings]);

  // ── Cell detection ────────────────────────────────────────────────────────

  const getCellAtPoint = useCallback((clientX: number, clientY: number): { dateStr: string; monteur: string } | null => {
    const ghost = ghostRef.current;
    if (ghost) ghost.style.display = 'none';
    const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
    if (ghost) ghost.style.display = 'block';
    if (!el) return null;
    const cell = el.closest('[data-cell]') as HTMLElement | null;
    if (!cell) return null;
    return { dateStr: cell.dataset.date || '', monteur: cell.dataset.monteur || '' };
  }, []);

  // ── Drag ──────────────────────────────────────────────────────────────────

  const startDrag = useCallback((e: React.MouseEvent, block: ScheduledBlock, mode: DragMode, dateStr: string) => {
    if (!onBlockMove && !onBlockResize) return;
    e.preventDefault();
    e.stopPropagation();

    const startIdx = dayStrings.indexOf(block.startDate);
    const endIdx = dayStrings.indexOf(block.endDate);
    const originIdx = dayStrings.indexOf(dateStr);

    dragRef.current = {
      block, mode,
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

    const ghost = ghostRef.current;
    if (ghost) {
      const colors = STATUS_COLORS[block.verdeler.status] || DEFAULT_COLOR;
      ghost.style.display = 'block';
      ghost.style.left = `${e.clientX + 14}px`;
      ghost.style.top = `${e.clientY - 20}px`;
      ghost.style.background = colors.ghostBg;
      ghost.style.borderColor = colors.solid + 'aa';

      const moveEl = ghost.querySelector('[data-ghost-move]') as HTMLElement;
      const resizeEl = ghost.querySelector('[data-ghost-resize]') as HTMLElement;
      if (mode === 'move') {
        if (moveEl) moveEl.style.display = 'block';
        if (resizeEl) resizeEl.style.display = 'none';
        const n = ghost.querySelector('[data-ghost-name]') as HTMLElement;
        const c = ghost.querySelector('[data-ghost-client]') as HTMLElement;
        const info = ghost.querySelector('[data-ghost-info]') as HTMLElement;
        const m = ghost.querySelector('[data-ghost-monteur]') as HTMLElement;
        if (n) n.textContent = `${block.verdeler.project_number} – ${block.verdeler.kast_naam}`;
        if (c) c.textContent = block.verdeler.client;
        if (info) info.textContent = `${block.verdeler.remaining_hours}u · ${block.verdeler.status}`;
        if (m) m.textContent = block.monteur;
      } else {
        if (moveEl) moveEl.style.display = 'none';
        if (resizeEl) resizeEl.style.display = 'block';
        const r = ghost.querySelector('[data-ghost-range]') as HTMLElement;
        if (r) r.textContent = `${block.startDate} → ${block.endDate}`;
      }
    }
  }, [dayStrings, onBlockMove, onBlockResize]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    updateGhostPosition(e.clientX, e.clientY);
    if (drag.rafId !== null) return;
    drag.rafId = requestAnimationFrame(() => {
      drag.rafId = null;
      const d = dragRef.current;
      if (!d) return;
      const cell = getCellAtPoint(e.clientX, e.clientY);
      if (!cell?.dateStr) return;
      const hoveredIdx = dayStrings.indexOf(cell.dateStr);
      if (hoveredIdx === -1) return;
      let changed = false;
      if (d.mode === 'move') {
        const span = d.blockEndIndex - d.blockStartIndex;
        const delta = hoveredIdx - d.originDateIndex;
        const newStart = Math.max(0, d.blockStartIndex + delta);
        const newEnd = Math.min(dayStrings.length - 1, newStart + span);
        const newMonteur = cell.monteur || d.currentMonteur;
        if (newStart !== d.currentStartIndex || newEnd !== d.currentEndIndex || newMonteur !== d.currentMonteur) {
          d.currentStartIndex = newStart; d.currentEndIndex = newEnd; d.currentMonteur = newMonteur; changed = true;
        }
      } else if (d.mode === 'resize-right') {
        const clamped = Math.max(d.currentStartIndex, hoveredIdx);
        if (clamped !== d.currentEndIndex) { d.currentEndIndex = clamped; changed = true; }
      } else {
        const clamped = Math.min(d.currentEndIndex, hoveredIdx);
        if (clamped !== d.currentStartIndex) { d.currentStartIndex = clamped; changed = true; }
      }
      if (changed) {
        updateGhostContent(d);
        setDropPreview({ start: dayStrings[d.currentStartIndex], end: dayStrings[d.currentEndIndex], monteur: d.currentMonteur });
      }
    });
  }, [dayStrings, getCellAtPoint, updateGhostPosition, updateGhostContent]);

  const onMouseUp = useCallback(async () => {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.rafId !== null) { cancelAnimationFrame(drag.rafId); drag.rafId = null; }
    dragRef.current = null;
    setIsDragging(false);
    setDropPreview(null);
    if (ghostRef.current) ghostRef.current.style.display = 'none';

    const { block, mode, currentStartIndex, currentEndIndex, currentMonteur } = drag;
    const newStart = dayStrings[currentStartIndex];
    const newEnd = dayStrings[currentEndIndex];
    if (newStart === block.startDate && newEnd === block.endDate && currentMonteur === block.monteur) return;

    setSavingBlock(block.verdeler.id);
    try {
      if (mode === 'move' && onBlockMove) { await onBlockMove(block, newStart, newEnd, currentMonteur); toast.success('Planning opgeslagen'); }
      else if ((mode === 'resize-left' || mode === 'resize-right') && onBlockResize) { await onBlockResize(block, newStart, newEnd); toast.success('Planning opgeslagen'); }
    } catch { toast.error('Kon planning niet opslaan'); }
    finally { setSavingBlock(null); }
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
    try { await onResolveAbsence(absence.id); toast.success(`${absence.username} is weer aan het werk`); }
    catch { toast.error('Kon de status niet bijwerken'); }
    finally { setResolvingAbsence(null); }
  };

  // ── Spanning block bar renderer ───────────────────────────────────────────
  // Renders one continuous bar per block spanning multiple columns.
  // The overlay is positioned absolutely over the day-cell area.

  const renderSpanningBlocks = (monteur: string, rowHeight: number) => {
    const mb = blocks.filter(b => b.monteur === monteur);
    const lanes = laneMap.get(monteur) || new Map<string, number>();
    const canDrag = !!(onBlockMove || onBlockResize);

    return mb.map(block => {
      const startColIdx = dayStrings.indexOf(block.startDate);
      const endColIdx = dayStrings.indexOf(block.endDate);

      // Block may start/end outside the visible window — clip to visible range
      const visStart = Math.max(startColIdx, 0);
      const visEnd = Math.min(endColIdx, dayStrings.length - 1);
      if (visStart > visEnd || visStart === -1 || visEnd === -1) {
        // Check if block spans beyond visible range on both sides
        const hasAnyDay = dayStrings.some(ds => block.dailyHours[ds]);
        if (!hasAnyDay) return null;
      }

      // Use the range from dailyHours if startDate/endDate are outside visible window
      const firstVisibleDay = dayStrings.find(ds => block.dailyHours[ds]);
      const lastVisibleDay = [...dayStrings].reverse().find(ds => block.dailyHours[ds]);
      if (!firstVisibleDay || !lastVisibleDay) return null;

      const colStart = dayStrings.indexOf(firstVisibleDay);
      const colEnd = dayStrings.indexOf(lastVisibleDay);
      const colSpan = colEnd - colStart + 1;

      const lane = lanes.get(block.verdeler.id) ?? 0;
      const colors = STATUS_COLORS[block.verdeler.status] || DEFAULT_COLOR;

      const isHovered = hoveredBlock === block.verdeler.id && !isDragging;
      const isSaving = savingBlock === block.verdeler.id;
      const isBeingDragged = isDragging && dragRef.current?.block.verdeler.id === block.verdeler.id;
      const isManualBlock = !!block.isManual;
      const canClipStart = startColIdx < 0; // starts before visible window
      const canClipEnd = endColIdx >= dayStrings.length; // ends after visible window

      const top = ROW_PADDING + lane * (BLOCK_HEIGHT + BLOCK_GAP);

      // Width: colSpan columns. Left: colStart * 100/days.length %
      // We use % since each day column is equal width
      const leftPct = (colStart / days.length) * 100;
      const widthPct = (colSpan / days.length) * 100;

      const totalHours = Object.values(block.dailyHours).reduce((s, h) => s + h, 0);

      return (
        <div
          key={block.verdeler.id}
          className={[
            'absolute flex items-stretch select-none overflow-hidden',
            isHovered ? 'z-20' : 'z-10',
            isBeingDragged ? 'opacity-20' : '',
            isSaving ? 'opacity-40 pointer-events-none' : '',
          ].join(' ')}
          style={{
            top,
            left: `calc(${leftPct}% + 2px)`,
            width: `calc(${widthPct}% - 4px)`,
            height: BLOCK_HEIGHT,
            borderRadius: canClipStart ? '0 6px 6px 0' : canClipEnd ? '6px 0 0 6px' : 6,
            background: isHovered
              ? `linear-gradient(135deg, ${colors.solid}40, ${colors.solid}28)`
              : colors.barBg,
            border: `1px solid ${colors.solid}${isHovered ? 'cc' : '60'}`,
            boxShadow: isHovered ? `0 2px 12px ${colors.solid}30` : block.isManual ? `inset 0 0 0 1px ${colors.solid}30` : 'none',
            transition: 'opacity 0.15s, box-shadow 0.1s',
            cursor: canDrag ? 'grab' : 'pointer',
          }}
          onClick={() => { if (!isDragging) setSelectedBlock(block); }}
          onMouseEnter={() => { if (!isDragging) setHoveredBlock(block.verdeler.id); }}
          onMouseLeave={() => setHoveredBlock(null)}
          onMouseDown={canDrag ? (e) => startDrag(e, block, 'move', firstVisibleDay) : undefined}
        >
          {/* Left resize handle */}
          {canDrag && !canClipStart && (
            <div
              className="flex-shrink-0 w-2.5 h-full flex items-center justify-center cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity rounded-l-[5px]"
              style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.12), transparent)' }}
              onMouseDown={(e) => { e.stopPropagation(); startDrag(e, block, 'resize-left', firstVisibleDay); }}
            >
              <div className="w-0.5 h-4 rounded-full" style={{ background: colors.solid, opacity: 0.8 }} />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-center px-2 overflow-hidden">
            <span
              className="font-semibold truncate leading-tight"
              style={{ fontSize: 11, color: colors.solid === '#3b82f6' ? '#bfdbfe' : colors.solid === '#f97316' ? '#fed7aa' : colors.solid === '#14b8a6' ? '#99f6e4' : colors.solid === '#10b981' ? '#a7f3d0' : '#e5e7eb' }}
            >
              {block.verdeler.project_number}
              {block.verdeler.kast_naam ? ` – ${block.verdeler.kast_naam}` : ''}
              {isManualBlock ? ' ·' : ''}
            </span>
            <span className="truncate leading-tight" style={{ fontSize: 9, color: `${colors.solid}99` }}>
              {block.verdeler.client} · {totalHours}u
            </span>
          </div>

          {/* Right resize handle */}
          {canDrag && !canClipEnd && (
            <div
              className="flex-shrink-0 w-2.5 h-full flex items-center justify-center cursor-ew-resize opacity-0 hover:opacity-100 transition-opacity rounded-r-[5px]"
              style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.12), transparent)' }}
              onMouseDown={(e) => { e.stopPropagation(); startDrag(e, block, 'resize-right', lastVisibleDay); }}
            >
              <div className="w-0.5 h-4 rounded-full" style={{ background: colors.solid, opacity: 0.8 }} />
            </div>
          )}

          {/* Reset button */}
          {isManualBlock && onBlockReset && !isDragging && (
            <button
              className="absolute top-0.5 right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-gray-800/80 hover:bg-gray-700 border border-gray-600 z-30 shadow opacity-0 group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onBlockReset(block); }}
              title="Terug naar automatische planning"
              style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.1s' }}
            >
              <RotateCcw size={8} className="text-gray-300" />
            </button>
          )}

          {/* Overdraft indicator */}
          {block.isOverdue && (
            <div className="absolute inset-0 rounded-[5px] pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1.5px rgba(239,68,68,0.6)' }} />
          )}
        </div>
      );
    });
  };

  // ── Drop preview spanning bar ─────────────────────────────────────────────

  const renderDropPreview = (monteur: string, rowHeight: number) => {
    if (!dropPreview || dropPreview.monteur !== monteur) return null;
    const drag = dragRef.current;
    if (!drag) return null;

    const colStart = dayStrings.indexOf(dropPreview.start);
    const colEnd = dayStrings.indexOf(dropPreview.end);
    if (colStart === -1 || colEnd === -1) return null;

    const colSpan = colEnd - colStart + 1;
    const leftPct = (colStart / days.length) * 100;
    const widthPct = (colSpan / days.length) * 100;
    const lane = laneMap.get(monteur)?.get(drag.block.verdeler.id) ?? 0;
    const top = ROW_PADDING + lane * (BLOCK_HEIGHT + BLOCK_GAP);
    const colors = STATUS_COLORS[drag.block.verdeler.status] || DEFAULT_COLOR;

    return (
      <div
        key="drop-preview"
        className="absolute pointer-events-none z-30"
        style={{
          top,
          left: `calc(${leftPct}% + 2px)`,
          width: `calc(${widthPct}% - 4px)`,
          height: BLOCK_HEIGHT,
          borderRadius: 6,
          border: `2px dashed ${colors.solid}cc`,
          background: `${colors.solid}15`,
          boxShadow: `0 0 0 3px ${colors.solid}12`,
        }}
      />
    );
  };

  return (
    <>
      {/* Floating drag ghost */}
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
          willChange: 'left, top',
        }}
      >
        <div data-ghost-move style={{ display: 'none' }}>
          <div data-ghost-name style={{ fontSize: 11, fontWeight: 700, color: '#e5e7eb', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} />
          <div data-ghost-client style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }} />
          <div data-ghost-info style={{ fontSize: 9, color: '#6b7280', marginTop: 1 }} />
          <div data-ghost-monteur style={{ fontSize: 9, fontWeight: 600, color: '#d1d5db', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
        </div>
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
          {/* Header */}
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
                  weekend ? 'bg-gray-800/30' : todayDay ? 'bg-blue-500/10' : inRange ? 'bg-blue-400/5' : '',
                ].join(' ')}
              >
                <p className={`text-[10px] uppercase font-medium ${todayDay ? 'text-blue-400' : 'text-gray-500'}`}>
                  {format(day, 'EEE', { locale: nl })}
                </p>
                <p className={`text-xs font-semibold ${todayDay ? 'text-blue-400' : weekend ? 'text-gray-600' : inRange ? 'text-blue-300' : 'text-gray-300'}`}>
                  {format(day, 'd', { locale: nl })}
                </p>
                <p className={`text-[9px] ${weekend ? 'text-gray-700' : inRange ? 'text-blue-400/60' : 'text-gray-500'}`}>
                  {format(day, 'MMM', { locale: nl })}
                </p>
              </div>
            );
          })}

          {/* Monteur rows */}
          {monteurs.map(monteur => {
            const rowHeight = rowHeightForMonteur(monteur);
            const absence = getAbsenceForMonteur(monteur);
            const totalScheduled = dayStrings.reduce((s, ds) => s + getCapacity(monteur, ds).scheduledHours, 0);
            const totalAvailable = dayStrings.reduce((s, ds) => {
              const c = getCapacity(monteur, ds);
              return s + (c.isWeekend ? 0 : c.totalAvailable);
            }, 0);

            return (
              <React.Fragment key={monteur}>
                {/* Label */}
                <div
                  className="sticky left-0 z-10 bg-[#1A1F2C] border-b border-r border-gray-700/40 px-3 flex flex-col justify-center"
                  style={{ minHeight: rowHeight }}
                >
                  <p className="text-xs font-medium text-white truncate">{monteur}</p>
                  {absence ? (
                    <>
                      <div className={`mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        absence.absence_type === 'ziek'
                          ? 'bg-red-500/15 border border-red-500/25 text-red-400'
                          : 'bg-amber-500/15 border border-amber-500/25 text-amber-400'
                      }`}>
                        {absence.absence_type === 'ziek' ? <ThermometerSun size={10} /> : <UserX size={10} />}
                        {absence.absence_type === 'ziek' ? 'Ziek' : 'Afwezig'}
                      </div>
                      <button
                        onClick={() => handleResolve(absence)}
                        disabled={resolvingAbsence === absence.id}
                        className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-[10px] font-medium text-emerald-400 transition-colors"
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

                {/* Day cells — background layer, no blocks rendered here */}
                {/* We use a single wide "row" div that spans all day columns for the block overlay */}
                {days.map((day, colIdx) => {
                  const dateStr = dayStrings[colIdx];
                  const cap = getCapacity(monteur, dateStr);
                  const weekend = isWeekend(day);
                  const todayDay = isToday(day);
                  const isDropTarget = dropPreview && !weekend && dropPreview.monteur === monteur && dateStr >= dropPreview.start && dateStr <= dropPreview.end;

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
                        minHeight: rowHeight,
                        ...(isDropTarget ? { background: 'rgba(59,130,246,0.07)', boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.25)' } : {}),
                      }}
                    >
                      {/* Capacity bar at bottom */}
                      {!weekend && !cap.isOnLeave && (
                        <div className="absolute bottom-0 left-0 right-0 px-0.5 pb-0.5">
                          <div className="h-0.5 bg-gray-700/40 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${cap.totalAvailable > 0 ? Math.min((cap.scheduledHours / cap.totalAvailable) * 100, 100) : 0}%`,
                                background: getUtilColorSolid(cap.totalAvailable > 0 ? (cap.scheduledHours / cap.totalAvailable) * 100 : 0),
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Leave overlay */}
                      {cap.isOnLeave && !weekend && (
                        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
                          absence?.absence_type === 'ziek' ? 'bg-red-500/6' : 'bg-amber-500/5'
                        }`}>
                          <span className={`text-[9px] font-medium ${
                            absence?.absence_type === 'ziek' ? 'text-red-400/50' : 'text-amber-400/50'
                          }`}>
                            {absence?.absence_type === 'ziek' ? 'Ziek' : 'Verlof'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Block overlay — absolutely positioned over all day columns */}
                {/* This is a full-width div placed as the (days.length+1)th child would be, */}
                {/* but we use negative margin trick: place it spanning the day columns via CSS */}
                {/* Actually: we need a separate grid row for the overlay. Easiest: use the first */}
                {/* day cell as anchor and position relative to the grid using a portal-like approach. */}
                {/* Cleanest solution: render overlay as a child of a hidden grid cell that spans all columns */}
                <div
                  style={{
                    gridColumn: `2 / span ${days.length}`,
                    position: 'relative',
                    height: 0,
                    // Pull this div up to overlap the row above
                    marginTop: -rowHeight,
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, height: rowHeight, pointerEvents: 'auto' }}>
                    {renderSpanningBlocks(monteur, rowHeight)}
                    {renderDropPreview(monteur, rowHeight)}
                  </div>
                </div>
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
        <PlanningDetailModal block={selectedBlock} onClose={() => setSelectedBlock(null)} />
      )}
    </>
  );
};

export default PlanningTimeline;


export default PlanningTimeline