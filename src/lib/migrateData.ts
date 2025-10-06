import { dataService } from './supabase';
import toast from 'react-hot-toast';

export const migrateLocalStorageToSupabase = async () => {
  try {
    // Get all data from localStorage
    const localClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const localProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    const localDistributors = JSON.parse(localStorage.getItem('distributors') || '[]');

    let migratedCount = 0;

    // Migrate clients first
    for (const client of localClients) {
      try {
        await dataService.createClient(client);
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating client ${client.name}:`, error);
      }
    }

    // Migrate projects
    for (const project of localProjects) {
      try {
        await dataService.createProject({
          projectNumber: project.projectNumber,
          date: project.date,
          location: project.location,
          client: project.client,
          status: project.status,
          description: project.description
        });
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating project ${project.projectNumber}:`, error);
      }
    }

    // Get the migrated projects to map IDs
    const migratedProjects = await dataService.getProjects();
    const projectIdMap = new Map();
    migratedProjects.forEach((project: any) => {
      const localProject = localProjects.find((p: any) => p.projectNumber === project.project_number);
      if (localProject) {
        projectIdMap.set(localProject.id, project.id);
      }
    });

    // Migrate distributors
    for (const distributor of localDistributors) {
      try {
        // Find the corresponding project ID
        const localProject = localProjects.find((p: any) => p.projectNumber === distributor.projectnummer);
        const projectId = localProject ? projectIdMap.get(localProject.id) : null;

        await dataService.createDistributor({
          distributorId: distributor.distributorId,
          projectId: projectId,
          kastNaam: distributor.kastNaam,
          systeem: distributor.systeem,
          voeding: distributor.voeding,
          bouwjaar: distributor.bouwjaar,
          keuringDatum: distributor.keuringDatum,
          getestDoor: distributor.getestDoor,
          unInV: distributor.unInV,
          inInA: distributor.inInA,
          ikThInKA1s: distributor.ikThInKA1s,
          ikDynInKA: distributor.ikDynInKA,
          freqInHz: distributor.freqInHz,
          typeNrHs: distributor.typeNrHs,
          fabrikant: distributor.fabrikant,
          profilePhoto: distributor.profilePhoto,
          status: distributor.status
        });
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating distributor ${distributor.distributorId}:`, error);
      }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem('projects');
    localStorage.removeItem('distributors');
    localStorage.removeItem('fileStructure');

    toast.success(`${migratedCount} items succesvol gemigreerd naar de database!`);
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    toast.error('Er is een fout opgetreden tijdens de migratie');
    return false;
  }
};

// Migrate documents from base64 content to Supabase Storage
export const migrateDocumentsToStorage = async (onProgress?: (current: number, total: number) => void) => {
  try {
    console.log('🚀 Starting document migration to storage...');

    // Get all documents that have content but no storage_path
    const { data: documents, error } = await dataService.supabase
      .from('documents')
      .select('*')
      .not('content', 'is', null)
      .is('storage_path', null);

    if (error) {
      throw error;
    }

    if (!documents || documents.length === 0) {
      console.log('✅ No documents to migrate');
      toast.success('Alle documenten zijn al gemigreerd!');
      return { success: true, migrated: 0, failed: 0 };
    }

    console.log(`📊 Found ${documents.length} documents to migrate`);

    let migratedCount = 0;
    let failedCount = 0;
    const failedDocs: any[] = [];

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];

      try {
        console.log(`\n📄 Migrating ${i + 1}/${documents.length}: ${doc.name}`);

        // Convert base64 data URL to blob
        const base64Data = doc.content;
        if (!base64Data || !base64Data.startsWith('data:')) {
          console.error('❌ Invalid content format for document:', doc.id);
          failedCount++;
          failedDocs.push({ id: doc.id, name: doc.name, error: 'Invalid content format' });
          continue;
        }

        // Extract mime type and base64 string
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          console.error('❌ Could not parse base64 data for document:', doc.id);
          failedCount++;
          failedDocs.push({ id: doc.id, name: doc.name, error: 'Could not parse base64' });
          continue;
        }

        const mimeType = matches[1];
        const base64String = matches[2];

        // Convert base64 to blob
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });

        // Create a File object from the blob
        const file = new File([blob], doc.name, { type: mimeType });

        console.log(`📤 Uploading to storage: ${doc.name} (${(file.size / 1024).toFixed(2)} KB)`);

        // Upload to storage
        const storagePath = await dataService.uploadFileToStorage(
          file,
          doc.project_id,
          doc.distributor_id,
          doc.folder
        );

        console.log(`✅ Uploaded to: ${storagePath}`);

        // Update database record with storage path and remove content
        const { error: updateError } = await dataService.supabase
          .from('documents')
          .update({
            storage_path: storagePath,
            content: null // Clear the base64 content to save space
          })
          .eq('id', doc.id);

        if (updateError) {
          throw updateError;
        }

        migratedCount++;
        console.log(`✅ Migrated document ${i + 1}/${documents.length}`);

        // Call progress callback
        if (onProgress) {
          onProgress(i + 1, documents.length);
        }

      } catch (error) {
        console.error(`❌ Error migrating document ${doc.name}:`, error);
        failedCount++;
        failedDocs.push({ id: doc.id, name: doc.name, error: error.message });
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`❌ Failed: ${failedCount}`);

    if (failedDocs.length > 0) {
      console.log('\n❌ Failed documents:');
      failedDocs.forEach(doc => {
        console.log(`  - ${doc.name} (${doc.id}): ${doc.error}`);
      });
    }

    if (migratedCount > 0) {
      toast.success(`${migratedCount} documenten succesvol gemigreerd naar storage!`);
    }

    if (failedCount > 0) {
      toast.error(`${failedCount} documenten konden niet worden gemigreerd`);
    }

    return {
      success: failedCount === 0,
      migrated: migratedCount,
      failed: failedCount,
      failedDocs
    };

  } catch (error) {
    console.error('Error during document migration:', error);
    toast.error('Er is een fout opgetreden tijdens de migratie');
    return {
      success: false,
      migrated: 0,
      failed: 0,
      error: error.message
    };
  }
};