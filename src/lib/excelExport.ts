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

const SYNTESS_CODE_MAP: Record<string, { urensoort: string; tarief: string; tariefsoort: string }> = {
  '01': { urensoort: '01', tarief: 'F001', tariefsoort: '' },
  '02': { urensoort: '01', tarief: 'F002', tariefsoort: '' },
  '04': { urensoort: '01', tarief: 'F002', tariefsoort: '' },
  '05': { urensoort: '01', tarief: 'F004', tariefsoort: '' },
  '06': { urensoort: '01', tarief: 'F003', tariefsoort: 'NUL' },
  '07': { urensoort: '01', tarief: 'F008', tariefsoort: '' },
  '08': { urensoort: '01', tarief: 'F006', tariefsoort: '' },
  '09': { urensoort: '10', tarief: 'F005', tariefsoort: 'STD' },
  '10': { urensoort: '01', tarief: 'F009', tariefsoort: '' },
  '11': { urensoort: '10', tarief: 'F001', tariefsoort: 'STD' },
  '12': { urensoort: '10', tarief: 'F001', tariefsoort: 'STD' },
  '13': { urensoort: '10', tarief: 'F001', tariefsoort: '' },
  '14': { urensoort: '10', tarief: 'F005', tariefsoort: 'STD' },
  '15': { urensoort: '01', tarief: 'F010', tariefsoort: '' },
  '21': { urensoort: '10', tarief: 'F003', tariefsoort: '' },
  '22': { urensoort: '10', tarief: 'F003', tariefsoort: '' },
  '25': { urensoort: '10', tarief: 'F003', tariefsoort: '' },
  '30': { urensoort: '10', tarief: 'F003', tariefsoort: 'STD' },
  '35': { urensoort: '10', tarief: 'F003', tariefsoort: 'STD' },
  '50': { urensoort: '01', tarief: 'F003', tariefsoort: 'NUL' },
  '60': { urensoort: '01', tarief: 'F001', tariefsoort: '' },
  '70': { urensoort: '01', tarief: 'F001', tariefsoort: '' },
};

const notationToRealHours = (val: any): number => {
  if (val === '' || val === null || val === undefined || val === 0) return 0;
  const num = typeof val === 'number' ? val : parseFloat(val.toString());
  if (isNaN(num)) return 0;
  const h = Math.floor(num);
  const dec = Math.round((num - h) * 100);
  let frac = 0;
  if (dec === 15) frac = 0.25;
  else if (dec === 30) frac = 0.50;
  else if (dec === 45) frac = 0.75;
  return h + frac;
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

const SYNTESS_COLUMNS = [
  { wch: 10 },  // Aantal
  { wch: 10 },  // Bedrag
  { wch: 18 },  // Besteksparagraaf
  { wch: 12 },  // Datum
  { wch: 15 },  // Kostenplaats
  { wch: 12 },  // Kostensoort
  { wch: 22 },  // Medewerker
  { wch: 40 },  // Omschrijving
  { wch: 15 },  // Project
  { wch: 10 },  // Taak
  { wch: 10 },  // Tarief
  { wch: 12 },  // Tariefsoort
  { wch: 15 },  // Werkbon
  { wch: 18 },  // Werkbonparagraaf
  { wch: 15 },  // Referentie
];

const formatSyntessName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastName = parts.slice(1).join('');
  return `${firstInitial}.${lastName}`;
};

const buildSyntessRows = (weekstaten: WeekstaatWithEntries[]) => {
  const rows: any[] = [];

  weekstaten.forEach(weekstaat => {
    const medewerker = formatSyntessName(weekstaat.username);
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
        const realHours = notationToRealHours(day.hours);
        if (realHours > 0) {
          const date = getDateOfWeek(weekstaat.week_number, weekstaat.year, day.offset);
          const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
          const codeInfo = SYNTESS_CODE_MAP[entry.activity_code] || { urensoort: '01', tarief: 'F001', tariefsoort: '' };

          rows.push({
            'Aantal': realHours,
            'Bedrag': '',
            'Besteksparagraaf': '',
            'Datum': formattedDate,
            'Kostenplaats': '',
            'Kostensoort': codeInfo.urensoort,
            'Medewerker': medewerker,
            'Omschrijving': entry.activity_description,
            'Project': entry.project_number || entry.workorder_number || '',
            'Taak': codeInfo.tarief,
            'Tarief': '',
            'Tariefsoort': codeInfo.tariefsoort,
            'Werkbon': '',
            'Werkbonparagraaf': '',
            'Referentie': '',
          });
        }
      });
    });
  });

  return rows;
};

export const exportWeekstaatToSyntess = (weekstaat: WeekstaatWithEntries) => {
  const rows = buildSyntessRows([weekstaat]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = SYNTESS_COLUMNS;

  XLSX.utils.book_append_sheet(wb, ws, 'Syntess');

  const filename = `Syntess_${weekstaat.username}_Week${weekstaat.week_number}_${weekstaat.year}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const exportMultipleWeekstatenToSyntess = (weekstaten: WeekstaatWithEntries[]) => {
  const rows = buildSyntessRows(weekstaten);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = SYNTESS_COLUMNS;

  XLSX.utils.book_append_sheet(wb, ws, 'Syntess');

  const filename = `Syntess_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};
