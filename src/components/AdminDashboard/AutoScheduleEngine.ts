import { PlanningVerdeler, ScheduledBlock } from './planningTypes';

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

export function autoSchedule(
  verdelers: PlanningVerdeler[],
  leaveDates: Record<string, Set<string>>,
  rangeStart: string,
  rangeEnd: string
): ScheduledBlock[] {
  const schedulable = verdelers.filter(v =>
    v.toegewezen_monteur &&
    v.toegewezen_monteur !== 'Vrij' &&
    v.remaining_hours > 0 &&
    getDeadline(v)
  );

  schedulable.sort((a, b) => {
    const dA = getDeadline(a)!;
    const dB = getDeadline(b)!;
    return dA.localeCompare(dB);
  });

  const capacityUsed: Record<string, number> = {};

  const getUsed = (monteur: string, date: string): number =>
    capacityUsed[`${monteur}:${date}`] || 0;

  const addUsed = (monteur: string, date: string, hours: number) => {
    const key = `${monteur}:${date}`;
    capacityUsed[key] = (capacityUsed[key] || 0) + hours;
  };

  const blocks: ScheduledBlock[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

    blocks.push({
      verdeler,
      monteur,
      startDate: blockStart,
      endDate: blockEnd,
      dailyHours,
      isAutoScheduled: true,
      isOverdue: isOverdueItem,
      cannotFit,
    });
  }

  return blocks;
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
