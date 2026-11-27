import * as XLSX from 'xlsx';

interface VerdelerData {
  distributor_id?: string;
  distributorId?: string;
  kast_naam?: string;
  kastNaam?: string;
  systeem?: string;
  voeding?: string;
  bouwjaar?: string;
  fabrikant?: string;
  un_in_v?: string;
  unInV?: string;
  in_in_a?: string;
  inInA?: string;
  ik_th_in_ka1s?: string;
  ikThInKa1s?: string;
  ik_dyn_in_ka?: string;
  ikDynInKa?: string;
  freq_in_hz?: string;
  freqInHz?: string;
  type_nr_hs?: string;
  typeNrHs?: string;
}

export const generateMPrintExcel = (
  verdelers: VerdelerData[],
  projectNumber: string,
  filename?: string
) => {
  // Company information
  const companyInfo = {
    company: 'EWP Paneelbouw',
    address: 'Gildenstraat 28',
    postalCode: '4143HS Leerdam',
    website: 'www.ewpmidden.nl',
    email: 'Patrick@ewpmidden.nl',
    phone: '06-27343669'
  };

  // Remove hyphen from project number for display
  const displayProjectNumber = projectNumber.replace(/-/g, '');

  // Prepare data rows
  const data = verdelers.map(verdeler => {
    const verdelerIdValue = verdeler.distributor_id || verdeler.distributorId || '';
    const kastNaamValue = verdeler.kast_naam || verdeler.kastNaam || '';

    // Generate maintenance URL for QR code
    const maintenanceUrl = `${window.location.origin}/maintenance-report?verdeler_id=${encodeURIComponent(verdelerIdValue)}&project_number=${encodeURIComponent(projectNumber)}&kast_naam=${encodeURIComponent(kastNaamValue)}`;

    return {
      'Verdeler ID': verdelerIdValue,
      'Project Nummer': displayProjectNumber,
      'Kastnaam': kastNaamValue,
      'Systeem': verdeler.systeem || '',
      'Voeding': verdeler.voeding || '',
      'Bouwjaar': verdeler.bouwjaar || '',
      'Fabrikant': verdeler.fabrikant || '',
      'Un in V': verdeler.un_in_v || verdeler.unInV || '',
      'In in A': verdeler.in_in_a || verdeler.inInA || '',
      'Ik Th in kA1s': verdeler.ik_th_in_ka1s || verdeler.ikThInKa1s || '',
      'Ik Dyn in kA': verdeler.ik_dyn_in_ka || verdeler.ikDynInKa || '',
      'Freq in Hz': verdeler.freq_in_hz || verdeler.freqInHz || '',
      'Type Nr Hs': verdeler.type_nr_hs || verdeler.typeNrHs || '',
      'QR Code URL': maintenanceUrl,
      'Bedrijfsnaam': companyInfo.company,
      'Adres': companyInfo.address,
      'Postcode/Plaats': companyInfo.postalCode,
      'Website': companyInfo.website,
      'Email': companyInfo.email,
      'Telefoon': companyInfo.phone
    };
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths for better readability
  const colWidths = [
    { wch: 15 }, // Verdeler ID
    { wch: 15 }, // Project Nummer
    { wch: 20 }, // Kastnaam
    { wch: 10 }, // Systeem
    { wch: 10 }, // Voeding
    { wch: 10 }, // Bouwjaar
    { wch: 15 }, // Fabrikant
    { wch: 10 }, // Un in V
    { wch: 10 }, // In in A
    { wch: 15 }, // Ik Th in kA1s
    { wch: 15 }, // Ik Dyn in kA
    { wch: 12 }, // Freq in Hz
    { wch: 15 }, // Type Nr Hs
    { wch: 60 }, // QR Code URL
    { wch: 20 }, // Bedrijfsnaam
    { wch: 20 }, // Adres
    { wch: 20 }, // Postcode/Plaats
    { wch: 20 }, // Website
    { wch: 25 }, // Email
    { wch: 15 }  // Telefoon
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Labels');

  // Generate filename
  const defaultFilename = verdelers.length === 1
    ? `${verdelers[0].distributor_id || verdelers[0].distributorId}_Label.xlsx`
    : `${displayProjectNumber}_Labels.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename || defaultFilename);
};

export const exportSingleVerdelerToExcel = (
  verdeler: VerdelerData,
  projectNumber: string
) => {
  generateMPrintExcel([verdeler], projectNumber);
};

export const exportMultipleVerdelersToExcel = (
  verdelers: VerdelerData[],
  projectNumber: string
) => {
  generateMPrintExcel(verdelers, projectNumber);
};

interface WeekstaatEntry {
  activity_code: string;
  activity_description: string;
  workorder_number: string;
  project_number?: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

interface WeekstaatWithEntries {
  id: string;
  week_number: number;
  year: number;
  username: string;
  entries: WeekstaatEntry[];
}

// ksoort 5510 = direct project hours, 5550 = indirect/absence hours.
interface SyntessCode { omschrijving: string; ksoort: string; tariefCode: string; tariefsoort: string }

const SYNTESS_CODE_MAP: Record<string, SyntessCode> = {
  '01': { omschrijving: 'Arbeid Intern < 630A (bouwtijd)', ksoort: '5510', tariefCode: 'F001', tariefsoort: 'STD' },
  '02': { omschrijving: 'Arbeid int. > 630A < 1000A', ksoort: '5510', tariefCode: 'F002', tariefsoort: 'STD' },
  '04': { omschrijving: 'Arbeid int. > 1000A', ksoort: '5510', tariefCode: 'F002', tariefsoort: 'STD' },
  '05': { omschrijving: 'Leerling Stagiair', ksoort: '5510', tariefCode: 'F004', tariefsoort: 'STD' },
  '06': { omschrijving: 'Arbeid ZZP / inleners', ksoort: '5510', tariefCode: 'F003', tariefsoort: 'NUL' },
  '07': { omschrijving: 'Arbeid Extern laag', ksoort: '5510', tariefCode: 'F008', tariefsoort: 'STD' },
  '08': { omschrijving: 'Arbeid Extern Hoog', ksoort: '5510', tariefCode: 'F006', tariefsoort: 'STD' },
  '09': { omschrijving: 'Intern Transport', ksoort: '5550', tariefCode: 'F005', tariefsoort: 'STD' },
  '10': { omschrijving: 'Uurtarief intercompany', ksoort: '5510', tariefCode: 'F009', tariefsoort: 'STD' },
  '11': { omschrijving: 'Algemene werkzaamheden', ksoort: '5550', tariefCode: 'F001', tariefsoort: 'STD' },
  '12': { omschrijving: 'Opruim werkzaamheden', ksoort: '5550', tariefCode: 'F003', tariefsoort: 'STD' },
  '13': { omschrijving: 'Kantoor', ksoort: '5550', tariefCode: 'F001', tariefsoort: 'STD' },
  '14': { omschrijving: 'Intern transport Projecten', ksoort: '5550', tariefCode: 'F005', tariefsoort: 'STD' },
  '15': { omschrijving: 'Arbeid Werk Leren BBL', ksoort: '5510', tariefCode: 'F010', tariefsoort: 'STD' },
  '21': { omschrijving: 'Verlof (onbetaald)', ksoort: '5550', tariefCode: 'F003', tariefsoort: 'STD' },
  '22': { omschrijving: 'Verlof (betaald)', ksoort: '5550', tariefCode: 'F003', tariefsoort: 'STD' },
  '25': { omschrijving: 'Nationale Feestdagen', ksoort: '5550', tariefCode: 'F003', tariefsoort: 'STD' },
  '30': { omschrijving: 'Dokter/tandarts/ziekenhuis', ksoort: '5550', tariefCode: 'F003', tariefsoort: 'STD' },
  '35': { omschrijving: 'Ziek', ksoort: '5550', tariefCode: 'F003', tariefsoort: 'STD' },
  '50': { omschrijving: 'Arbeid extern laag / ZZP inlener', ksoort: '5510', tariefCode: 'F003', tariefsoort: 'NUL' },
  '60': { omschrijving: 'Test werkzaamheden', ksoort: '5510', tariefCode: 'F001', tariefsoort: 'STD' },
  '70': { omschrijving: 'Tekenwerkzaamheden', ksoort: '5510', tariefCode: 'F001', tariefsoort: 'STD' },
};

// Timer bookings use codes outside the weekstaat list: production on a kast (code = project number) and testing (108).
const resolveSyntessTaak = (activityCode: string): string => {
  if (SYNTESS_CODE_MAP[activityCode]) return activityCode;
  if (activityCode === '108') return '60';
  return '01';
};

const WEEK_29_YEAR = 2025;
const WEEK_29_NUMBER = 29;

const notationToDecimalHours = (val: any, weekNumber: number, year: number): number => {
  if (val === '' || val === null || val === undefined || val === 0) return 0;
  const num = typeof val === 'number' ? val : parseFloat(val.toString());
  if (isNaN(num)) return 0;
  
  const hours = Math.floor(num);
  const minutePart = Math.round((num - hours) * 100);
  
  if (year > WEEK_29_YEAR || (year === WEEK_29_YEAR && weekNumber >= WEEK_29_NUMBER)) {
    let decimalMinutes = 0;
    if (minutePart === 15) decimalMinutes = 0.25;
    else if (minutePart === 30) decimalMinutes = 0.50;
    else if (minutePart === 45) decimalMinutes = 0.75;
    return hours + decimalMinutes;
  }
  
  // Weeks 22-28: the decimal part represents actual minutes (e.g. 4.50 = 4h 50min)
  return hours + (minutePart / 60);
};

const getDateOfWeek = (week: number, year: number, dayOffset: number): Date => {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  ISOweekStart.setDate(ISOweekStart.getDate() + dayOffset);
  return ISOweekStart;
};

const SYNTESS_HEADERS = [
  'Type', 'Datum', 'Dag', 'Taak', 'Taak omschrijving', 'Tarief', 'Begintijd', 'Eindtijd',
  'Aantal', 'Omschrijving', 'Tariefsoort', 'Bedrag', 'KSoort', 'Project', 'Bestekparagraaf',
  'Werkbon', 'Werkbonparagraaf', 'Opbrengst', 'Taak tarief code', 'KPlaats',
];

const SYNTESS_COLUMN_WIDTHS = [
  6, 12, 5, 6, 34, 8, 10, 10, 8, 34, 11, 8, 8, 12, 16, 10, 18, 10, 16, 8,
].map(wch => ({ wch }));

const PROJECT_NUMBER_PATTERN = /^\d?[A-Z]{1,2}\d{5,6}$/;

const findProjectNumber = (...candidates: (string | undefined)[]): string => {
  for (const candidate of candidates) {
    const normalized = (candidate || '').replace(/\s+/g, '').toUpperCase();
    if (PROJECT_NUMBER_PATTERN.test(normalized)) return normalized;
  }
  return '';
};

// Production bookings store "<projectnummer> - <kastnaam>" in workorder_number with the project number as activity_code.
const splitProjectAndKast = (entry: WeekstaatEntry): { project: string; kastnaam: string } => {
  const workorder = (entry.workorder_number || '').trim();
  const prefix = `${entry.activity_code} - `;
  if (entry.activity_code && workorder.startsWith(prefix)) {
    return { project: findProjectNumber(entry.activity_code), kastnaam: workorder.slice(prefix.length).trim() };
  }
  return { project: findProjectNumber(entry.project_number, entry.workorder_number), kastnaam: '' };
};

const buildSyntessRows = (weekstaten: WeekstaatWithEntries[]) => {
  const rows: { sortKey: number; values: (string | number)[] }[] = [];

  weekstaten.forEach(weekstaat => {
    weekstaat.entries.forEach(entry => {
      const days = [
        { hours: entry.monday, offset: 0 },
        { hours: entry.tuesday, offset: 1 },
        { hours: entry.wednesday, offset: 2 },
        { hours: entry.thursday, offset: 3 },
        { hours: entry.friday, offset: 4 },
        { hours: entry.saturday, offset: 5 },
        { hours: entry.sunday, offset: 6 },
      ];

      days.forEach(day => {
        const realHours = notationToDecimalHours(day.hours, weekstaat.week_number, weekstaat.year);
        if (realHours > 0) {
          const date = getDateOfWeek(weekstaat.week_number, weekstaat.year, day.offset);
          const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
          const taak = resolveSyntessTaak(entry.activity_code);
          const code = SYNTESS_CODE_MAP[taak];
          const isProjectHours = code.ksoort === '5510';
          const { project, kastnaam } = isProjectHours ? splitProjectAndKast(entry) : { project: '', kastnaam: '' };
          // Syntess day numbering: Sunday = 1, Monday = 2 ... Saturday = 7.
          const dag = day.offset === 6 ? 1 : day.offset + 2;

          rows.push({
            sortKey: date.getTime(),
            values: [
              'A', formattedDate, dag, taak, code.omschrijving, '', '', '',
              parseFloat(realHours.toFixed(2)), code.omschrijving, code.tariefsoort, '', code.ksoort,
              project, project ? (kastnaam || '1') : '',
              '', '', 'Nee', code.tariefCode, '',
            ],
          });
        }
      });
    });
  });

  return rows.sort((a, b) => a.sortKey - b.sortKey).map(row => row.values);
};

const downloadSyntessFile = (weekstaten: WeekstaatWithEntries[], filename: string) => {
  const ws = XLSX.utils.aoa_to_sheet([SYNTESS_HEADERS, ...buildSyntessRows(weekstaten)]);
  ws['!cols'] = SYNTESS_COLUMN_WIDTHS;

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const aantalColumn = SYNTESS_HEADERS.indexOf('Aantal');
  for (let r = 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: aantalColumn })];
    if (cell) cell.z = '0.00';
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Urenstaat');
  XLSX.writeFile(wb, filename);
};

export const exportWeekstaatToSyntess = (weekstaat: WeekstaatWithEntries) => {
  downloadSyntessFile(
    [weekstaat],
    `Syntess_${weekstaat.username}_Week${weekstaat.week_number}_${weekstaat.year}.xlsx`
  );
};

// The Syntess template has no employee column, so each employee gets their own file.
export const exportMultipleWeekstatenToSyntess = (weekstaten: WeekstaatWithEntries[]) => {
  const byEmployee = new Map<string, WeekstaatWithEntries[]>();
  weekstaten.forEach(weekstaat => {
    byEmployee.set(weekstaat.username, [...(byEmployee.get(weekstaat.username) || []), weekstaat]);
  });

  const date = new Date().toISOString().split('T')[0];
  byEmployee.forEach((employeeWeekstaten, username) => {
    downloadSyntessFile(employeeWeekstaten, `Syntess_${username}_${date}.xlsx`);
  });
};
