export interface PlanningVerdeler {
  id: string;
  distributor_id: string;
  kast_naam: string;
  project_number: string;
  project_id: string;
  client: string;
  toegewezen_monteur: string;
  gewenste_lever_datum: string | null;
  project_delivery_date: string | null;
  expected_hours: number;
  actual_hours: number;
  remaining_hours: number;
  status: string;
}

export interface ScheduledBlock {
  verdeler: PlanningVerdeler;
  monteur: string;
  startDate: string;
  endDate: string;
  dailyHours: Record<string, number>;
  isAutoScheduled: boolean;
  isOverdue: boolean;
  cannotFit: boolean;
}

export interface MonteurDayCapacity {
  monteur: string;
  date: string;
  totalAvailable: number;
  scheduledHours: number;
  actualWorkedHours: number;
  remainingCapacity: number;
  isOnLeave: boolean;
  isWeekend: boolean;
}

export interface DaySummary {
  date: string;
  totalCapacity: number;
  totalScheduled: number;
  utilizationPercent: number;
  monteurCount: number;
}

export type ViewMode = 'week' | 'twoWeek' | 'month';
