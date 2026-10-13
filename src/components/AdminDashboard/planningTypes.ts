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

export interface PlanningOverride {
  id: string;
  distributor_id: string;
  monteur: string;
  start_date: string;
  end_date: string;
  daily_hours: Record<string, number>;
  created_by: string;
  created_at: string;
  updated_at: string;
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
  overrideId?: string;
  isManual?: boolean;
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

export const PLANNING_EDITORS = ['Patrick Herman', 'Stefano de Weger', 'Lysander Koenraadt', 'Chris Louwrier', 'Sylvia Guth'];

export type LeaveSource = 'leave_requests' | 'vacation_requests' | 'employee_absences';

export interface LeaveEntry {
  id: string;
  source: LeaveSource;
  username: string;
  label: string;
  leave_type: string | null;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_open_ended?: boolean;
}

export interface LeaveUpdate {
  start_date: string;
  end_date: string | null;
  description: string;
  leave_type: string | null;
}
