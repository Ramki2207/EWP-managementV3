import { PlanningVerdeler, PlanningOverride, ScheduledBlock } from './planningTypes';

const HOURS_PER_DAY = 8;

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDeadline(v: PlanningVerdeler): string | null {
  return v.gewenste_lever_datum || v.project_delivery_date;
}

export function buildDailyHoursFromRange(
  startDate: string,
  endDate: string,
  totalHours: number,
  leaveDates: Set<string>
): Record<string, number> {
  const dailyHours: Record<string, number> = {};
  let remaining = totalHours;
  let cursor = new Date(startDate);
  const end = new Date(endDate);

  while (cursor <= end && remaining > 0) {
    if (!isWeekend(cursor)) {
      const dateStr = toDateStr(cursor);
      if (!leaveDates.has(dateStr)) {
        const allocate = Math.min(remaining, HOURS_PER_DAY);
        if (allocate > 0) {
          dailyHours[dateStr] = allocate;
          remaining -= allocate;
        }
      }
    }
    cursor = addDays(cursor, 1);
  }

  return dailyHours;
}

export function autoSchedule(
  verdelers: PlanningVerdeler[],
  leaveDates: Record<string, Set<string>>,
  rangeStart: string,
  rangeEnd: string,
  overrides: PlanningOverride[] = []
): ScheduledBlock[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a set of distributor IDs that have manual overrides
  const overriddenIds = new Set(overrides.map(o => o.distributor_id));

  // Convert overrides into ScheduledBlocks first
  const overrideBlocks: ScheduledBlock[] = [];
  for (const override of overrides) {
    const verdeler = verdelers.find(v => v.id === override.distributor_id);
    if (!verdeler) continue;
    const deadline = getDeadline(verdeler);
    const deadlineDate = deadline ? new Date(deadline) : null;
    deadlineDate?.setHours(0, 0, 0, 0);

    overrideBlocks.push({
      verdeler,
      monteur: override.monteur,
      startDate: override.start_date,
      endDate: override.end_date,
      dailyHours: override.daily_hours,
      isAutoScheduled: false,
      isManual: true,
      overrideId: override.id,
      isOverdue: deadlineDate ? today > deadlineDate : false,
      cannotFit: false,
    });
  }

  // Auto-schedule the rest (skip overridden ones)
  const schedulable = verdelers.filter(v =>
    v.toegewezen_monteur &&
    v.toegewezen_monteur !== 'Vrij' &&
    v.remaining_hours > 0 &&
    getDeadline(v) &&
    !overriddenIds.has(v.id)
  );

  schedulable.sort((a, b) => {
    const dA = getDeadline(a)!;
    const dB = getDeadline(b)!;
    return dA.localeCompare(dB);
  });

  const capacityUsed: Record<string, number> = {};

  // Pre-fill capacity from manual overrides so auto-schedule respects them
  for (const block of overrideBlocks) {
    for (const [date, hours] of Object.entries(block.dailyHours)) {
      const key = `${block.monteur}:${date}`;
      capacityUsed[key] = (capacityUsed[key] || 0) + hours;
    }
  }

  const getUsed = (monteur: string, date: string): number =>
    capacityUsed[`${monteur}:${date}`] || 0;

  const addUsed = (monteur: string, date: string, hours: number) => {
    const key = `${monteur}:${date}`;
    capacityUsed[key] = (capacityUsed[key] || 0) + hours;
  };

  const autoBlocks: ScheduledBlock[] = [];

  for (const verdeler of schedulable) {
    const deadline = new Date(getDeadline(verdeler)!);
    deadline.setHours(0, 0, 0, 0);
    const monteur = verdeler.toegewezen_monteur;
    let hoursNeeded = verdeler.remaining_hours;
    const dailyHours: Record<string, number> = {};
    const monteurLeave = leaveDates[monteur] || new Set();
    const isOverdueItem = today > deadline;
    let cannotFit = false;

    if (isOverdueItem) {
      // Overdue: schedule forward from today so work appears in the current week
      let cursor = new Date(today);
      const maxDate = addDays(today, 60);
      while (hoursNeeded > 0 && cursor <= maxDate) {
        if (!isWeekend(cursor)) {
          const dateStr = toDateStr(cursor);
          if (!monteurLeave.has(dateStr)) {
            const used = getUsed(monteur, dateStr);
            const available = HOURS_PER_DAY - used;
            if (available > 0) {
              const allocate = Math.min(hoursNeeded, available);
              dailyHours[dateStr] = allocate;
              addUsed(monteur, dateStr, allocate);
              hoursNeeded -= allocate;
            }
          }
        }
        cursor = addDays(cursor, 1);
      }
    } else {
      // Future deadline: schedule backward from deadline
      let cursor = addDays(deadline, -1);
      const minDate = addDays(today, -30);
      while (hoursNeeded > 0 && cursor >= minDate) {
        if (!isWeekend(cursor)) {
          const dateStr = toDateStr(cursor);
          if (!monteurLeave.has(dateStr)) {
            const used = getUsed(monteur, dateStr);
            const available = HOURS_PER_DAY - used;
            if (available > 0) {
              const allocate = Math.min(hoursNeeded, available);
              dailyHours[dateStr] = allocate;
              addUsed(monteur, dateStr, allocate);
              hoursNeeded -= allocate;
            }
          }
        }
        cursor = addDays(cursor, -1);
      }
    }

    if (hoursNeeded > 0) {
      cannotFit = true;
    }

    const dates = Object.keys(dailyHours).sort();
    if (dates.length === 0) continue;

    const blockStart = dates[0];
    const blockEnd = dates[dates.length - 1];

    const isInRange = blockEnd >= rangeStart && blockStart <= rangeEnd;
    if (!isInRange && !cannotFit) continue;

    autoBlocks.push({
      verdeler,
      monteur,
      startDate: blockStart,
      endDate: blockEnd,
      dailyHours,
      isAutoScheduled: true,
      isManual: false,
      isOverdue: isOverdueItem,
      cannotFit,
    });
  }

  return [...overrideBlocks, ...autoBlocks];
}

export function calculateCapacityUsed(
  blocks: ScheduledBlock[]
): Record<string, number> {
  const used: Record<string, number> = {};
  for (const block of blocks) {
    for (const [date, hours] of Object.entries(block.dailyHours)) {
      const key = `${block.monteur}:${date}`;
      used[key] = (used[key] || 0) + hours;
    }
  }
  return used;
}
