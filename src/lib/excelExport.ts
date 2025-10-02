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

  // Prepare data rows
  const data = verdelers.map(verdeler => {
    const verdelerIdValue = verdeler.distributor_id || verdeler.distributorId || '';
    const kastNaamValue = verdeler.kast_naam || verdeler.kastNaam || '';

    // Generate maintenance URL for QR code
    const maintenanceUrl = `${window.location.origin}/maintenance-report?verdeler_id=${encodeURIComponent(verdelerIdValue)}&project_number=${encodeURIComponent(projectNumber)}&kast_naam=${encodeURIComponent(kastNaamValue)}`;

    return {
      'Verdeler ID': verdelerIdValue,
      'Project Nummer': projectNumber,
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
    : `${projectNumber}_Labels.xlsx`;

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
