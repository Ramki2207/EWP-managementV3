import { dataService } from './supabase';
import { generateVerdelerTestingPDF } from '../components/VerdelerTestingPDF';
import { generateVerdelerVanaf630PDF } from '../components/VerdelerVanaf630PDF';
import { generateVerdelerTestSimpelPDF } from '../components/VerdelerTestSimpelPDF';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  project_id: string;
  distributor_id: string;
  folder: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  uploaded_at: string;
  storage_path?: string;
}

interface RegenerationResult {
  success: number;
  failed: number;
  skipped: number;
  totalSizeBefore: number;
  totalSizeAfter: number;
  errors: Array<{ docId: string; error: string }>;
}

export const regenerateTestCertificatePDFs = async (): Promise<RegenerationResult> => {
  const result: RegenerationResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    totalSizeBefore: 0,
    totalSizeAfter: 0,
    errors: []
  };

  try {
    const documents = await dataService.getDocuments() as Document[];

    const testCertificates = documents.filter(
      (doc): doc is Document => doc.folder === 'Test certificaat' && doc.type === 'application/pdf'
    );

    console.log(`Found ${testCertificates.length} test certificate PDFs to regenerate`);

    for (const doc of testCertificates) {
      try {
        if (!doc.distributor_id || !doc.project_id) {
          console.log(`Skipping ${doc.name} - missing distributor or project ID`);
          result.skipped++;
          continue;
        }

        const distributors = await dataService.getDistributorsByProject(doc.project_id);
        const verdeler = distributors?.find((d: any) => d.id === doc.distributor_id);

        if (!verdeler) {
          console.log(`Skipping ${doc.name} - distributor not found`);
          result.skipped++;
          continue;
        }

        const project = await dataService.getProjectByDistributorId(verdeler.id);
        if (!project) {
          console.log(`Skipping ${doc.name} - project not found`);
          result.skipped++;
          continue;
        }

        const testDataRecords = await dataService.getTestData(verdeler.id);

        if (!testDataRecords || testDataRecords.length === 0) {
          console.log(`Skipping ${doc.name} - no test data found`);
          result.skipped++;
          continue;
        }

        const workshopChecklist = testDataRecords.find((t: any) => t.test_type === 'workshop_checklist');
        const verdelerVanaf630Test = testDataRecords.find((t: any) => t.test_type === 'verdeler_vanaf_630');
        const verdelerTestSimpel = testDataRecords.find((t: any) => t.test_type === 'verdeler_test_simpel');

        let newPdfBase64: string | null = null;

        if (doc.name.includes('vanaf_630')) {
          if (!verdelerVanaf630Test) {
            console.log(`Skipping ${doc.name} - no vanaf_630 test data`);
            result.skipped++;
            continue;
          }

          newPdfBase64 = await generateVerdelerVanaf630PDF(
            { verdelerVanaf630Test: verdelerVanaf630Test.data },
            verdeler,
            project.project_number
          );
        } else if (doc.name.includes('simpel')) {
          if (!verdelerTestSimpel) {
            console.log(`Skipping ${doc.name} - no simpel test data`);
            result.skipped++;
            continue;
          }

          newPdfBase64 = await generateVerdelerTestSimpelPDF(
            { verdelerTestSimpel: verdelerTestSimpel.data },
            verdeler,
            project.project_number
          );
        } else {
          if (!workshopChecklist) {
            console.log(`Skipping ${doc.name} - no workshop checklist data`);
            result.skipped++;
            continue;
          }

          newPdfBase64 = await generateVerdelerTestingPDF(
            { workshopChecklist: workshopChecklist.data },
            verdeler,
            project.project_number
          );
        }

        if (!newPdfBase64) {
          console.log(`Skipping ${doc.name} - PDF generation failed`);
          result.failed++;
          result.errors.push({ docId: doc.id, error: 'PDF generation returned null' });
          continue;
        }

        const oldSize = doc.size || 0;
        const newSize = newPdfBase64.length;

        result.totalSizeBefore += oldSize;
        result.totalSizeAfter += newSize;

        await dataService.updateDocument(doc.id, {
          content: newPdfBase64,
          size: newSize
        });

        result.success++;

        const reduction = ((oldSize - newSize) / oldSize * 100).toFixed(1);
        console.log(
          `✓ Regenerated ${doc.name}: ${(oldSize / 1024 / 1024).toFixed(2)} MB → ${(newSize / 1024 / 1024).toFixed(2)} MB (${reduction}% reduction)`
        );

      } catch (error: any) {
        console.error(`Error regenerating ${doc.name}:`, error);
        result.failed++;
        result.errors.push({ docId: doc.id, error: error.message });
      }
    }

    return result;

  } catch (error: any) {
    console.error('Error in regenerateTestCertificatePDFs:', error);
    throw error;
  }
};

export const getTestCertificateStats = async () => {
  try {
    const documents = await dataService.getDocuments() as Document[];

    const testCertificates = documents.filter(
      (doc): doc is Document => doc.folder === 'Test certificaat' && doc.type === 'application/pdf'
    );

    const totalSize = testCertificates.reduce((sum, doc) => sum + (doc.size || 0), 0);
    const avgSize = totalSize / testCertificates.length;
    const maxSize = Math.max(...testCertificates.map(doc => doc.size || 0));

    return {
      count: testCertificates.length,
      totalSize,
      avgSize,
      maxSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      avgSizeMB: (avgSize / 1024 / 1024).toFixed(2),
      maxSizeMB: (maxSize / 1024 / 1024).toFixed(2)
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
};
