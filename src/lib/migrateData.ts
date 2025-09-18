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