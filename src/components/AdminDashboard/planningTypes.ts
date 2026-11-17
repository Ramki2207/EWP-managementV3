export interface PlanningVerdeler {
  id: string;
  distributor_id: string;
  kast_naam: string;
  project_number: string;
  project_id: string;
  client: string;
  created_by_name: string | null;
  toegewezen_monteur: string;
  assigned_monteur: string | null;
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

export const PLANNING_EDITORS = ['Patrick Herman', 'Stefano de Weger', 'Lysander Koenraadt', 'Chris Louwrier', 'Sylvia Guth', 'Kevin van Veen'];

export type PlanningRole = 'bouwen' | 'bouwen_testen' | 'testen' | 'levering';

export const PLANNING_ROLE_ORDER: PlanningRole[] = ['bouwen', 'bouwen_testen', 'testen', 'levering'];

export const PLANNING_ROLE_INFO: Record<PlanningRole, { label: string; badge: string; dot: string }> = {
  bouwen:        { label: 'Monteurs - Bouwen',  badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300',          dot: 'bg-blue-400' },
  bouwen_testen: { label: 'Monteurs - Bouwen & Testen', badge: 'bg-sky-500/15 border-sky-500/30 text-sky-300',     dot: 'bg-sky-400' },
  testen:        { label: 'Testers',            badge: 'bg-orange-500/15 border-orange-500/30 text-orange-300',    dot: 'bg-orange-400' },
  levering:      { label: 'Levering',           badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', dot: 'bg-emerald-400' },
};

// Explicit roles; anyone not listed falls back to their user role (tester -> testen, logistiek -> levering, else bouwen)
export const PLANNING_ROLE_OVERRIDES: Record<string, PlanningRole> = {
  'Arjan Struik': 'testen',
  'Ibrahim Abdalla': 'testen',
  'Alec Werkhoven': 'levering',
};

// Projects at these locations, or monteurs based there, hand Testen work to the tester and Levering work to the delivery person
export const UTRECHT_REGION_LOCATIONS = ['Leerdam', 'Leerdam (PM)', 'Utrecht'];
export const UTRECHT_TESTER = 'Ibrahim Abdalla';
export const UTRECHT_LEVERING = 'Alec Werkhoven';
export const UTRECHT_TEAM = ['Arjan Struik', UTRECHT_TESTER, UTRECHT_LEVERING];

export const DEFAULT_TEST_HOURS = 4;
export const LEVERING_HOURS = 2;

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

export interface Buitenklus {
  id: string;
  client: string;
  project_number: string;
  location: string;
  contact_person: string;
  contact_phone: string;
  monteurs: string[];
  start_date: string;
  end_date: string;
  start_time: string;
  transport: string;
  description: string;
  materials: string;
  notes: string;
  created_by: string;
}

export type BuitenklusInput = Omit<Buitenklus, 'id' | 'created_by'>;

// Non-production days shown in the planning grid; they block capacity like leave does
export interface DayMarker {
  kind: 'vrij' | 'buitenklus';
  label: string;
  buitenklusId?: string;
}

export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];

export const WEEKDAYS: { iso: number; short: string; long: string }[] = [
  { iso: 1, short: 'Ma', long: 'Maandag' },
  { iso: 2, short: 'Di', long: 'Dinsdag' },
  { iso: 3, short: 'Wo', long: 'Woensdag' },
  { iso: 4, short: 'Do', long: 'Donderdag' },
  { iso: 5, short: 'Vr', long: 'Vrijdag' },
];

export interface LeaveUpdate {
  start_date: string;
  end_date: string | null;
  description: string;
  leave_type: string | null;
}
