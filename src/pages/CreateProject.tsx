import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectStep from './CreateProject/ProjectStep';
import VerdelersStep from '../components/VerdelersStep';
import UploadsStep from '../components/CreateProject/UploadsStep';
import StepNavigation from '../components/StepNavigation';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';

const today = new Date();

const CreateProject = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [tempDocuments, setTempDocuments] = useState<{ [key: string]: any[] }>({});
  const [projectData, setProjectData] = useState(() => {
    return {
      projectNumber: '',
      date: today.toISOString().split('T')[0],
      location: '',
      client: '',
      status: '',
      description: '',
      verdelers: [],
      intakeForm: null
    };
  });

  const steps = ["Project Details", "Verdelers", "Uploads"];

  const handleProjectChange = (data: any) => {
    setProjectData(data);
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSaveProject = async () => {
    try {
      setSaving(true);

      console.log('Saving project with data:', projectData);
      console.log('Intake form data being saved:', projectData.intakeForm);

      // Create the project first
      const savedProject = await dataService.createProject(projectData);

      // Create distributors if any
      if (projectData.verdelers && projectData.verdelers.length > 0) {
        console.log('🚀 SAVE: Starting to save verdelers...');
        console.log('🚀 SAVE: Number of verdelers to save:', projectData.verdelers.length);
        
        for (const verdeler of projectData.verdelers) {
          console.log('🔍 SAVE: Processing verdeler:', verdeler);
          console.log('🔍 SAVE: Verdeler distributorId:', verdeler.distributorId);
          console.log('🔍 SAVE: Verdeler kastNaam:', verdeler.kastNaam);
          console.log('🔍 SAVE: Full verdeler object:', JSON.stringify(verdeler, null, 2));
          
          const distributorData = {
            distributorId: verdeler.distributorId,
            projectId: savedProject.id,
            kastNaam: verdeler.kastNaam,
            toegewezenMonteur: verdeler.toegewezenMonteur,
            systeem: verdeler.systeem,
            voeding: verdeler.voeding,
            stuurspanning: verdeler.stuurspanning,
            kaWaarde: verdeler.kaWaarde || verdeler.ka_waarde,
            bouwjaar: verdeler.bouwjaar,
            keuringDatum: verdeler.keuringDatum,
            getestDoor: verdeler.getestDoor,
            unInV: verdeler.unInV,
            inInA: verdeler.inInA,
            ikThInKA1s: verdeler.ikThInKA1s,
            ikDynInKA: verdeler.ikDynInKA,
            freqInHz: verdeler.freqInHz,
            typeNrHs: verdeler.typeNrHs,
            fabrikant: verdeler.fabrikant,
            profilePhoto: verdeler.profilePhoto,
            status: verdeler.status,
            expectedHours: verdeler.expectedHours || verdeler.expected_hours,
            gewensteLeverDatum: verdeler.deliveryDate || verdeler.gewenste_lever_datum
          };

          console.log('🔍 SAVE: Mapped distributor data:', distributorData);
          console.log('🔍 SAVE: Critical field check:');
          console.log('  - distributorId (mapped):', distributorData.distributorId);
          console.log('  - kastNaam (mapped):', distributorData.kastNaam);
          console.log('  - projectId (mapped):', distributorData.projectId);
          
          // Verify the data has the required fields
          if (!distributorData.distributorId) {
            console.error('❌ CRITICAL: Missing distributorId for verdeler:', verdeler);
            console.error('❌ Original verdeler data:', JSON.stringify(verdeler, null, 2));
            console.error('❌ Mapped distributorData:', JSON.stringify(distributorData, null, 2));
            toast.error(`Verdeler ID ontbreekt voor verdeler ${verdeler.kastNaam || 'onbekend'}`);
            continue;
          }
          
          if (!distributorData.kastNaam) {
            console.error('❌ CRITICAL: Missing kastNaam for verdeler:', verdeler);
            console.error('❌ Original verdeler data:', JSON.stringify(verdeler, null, 2));
            console.error('❌ Mapped distributorData:', JSON.stringify(distributorData, null, 2));
            toast.error(`Kastnaam ontbreekt voor verdeler ${verdeler.distributorId}`);
            continue;
          }
          
          console.log('✅ SAVE: Validation passed, calling createDistributor...');
          await dataService.createDistributor(distributorData);
          console.log('✅ SAVE: Distributor saved successfully');
        }
        
        console.log('🎉 SAVE: All verdelers processed');
      }

      // Save documents after project and distributors are created
      if (Object.keys(tempDocuments).length > 0) {
        console.log('Saving temporary documents to database...');

        // Get the created distributors to map IDs
        const createdDistributors = await dataService.getDistributorsByProject(savedProject.id);

        for (const [key, docs] of Object.entries(tempDocuments)) {
          // Split only on the first dash to handle folder names with dashes
          const firstDashIndex = key.indexOf('-');
          const distributorId = key.substring(0, firstDashIndex);
          const folder = key.substring(firstDashIndex + 1);

          // Check if this is a project-level document or distributor-level document
          if (distributorId === 'project') {
            // Save project-level documents with distributorId: null
            if (docs.length > 0) {
              for (const doc of docs) {
                try {
                  await dataService.createDocument({
                    projectId: savedProject.id,
                    distributorId: null,
                    folder: folder,
                    name: doc.name,
                    type: doc.type,
                    size: doc.size,
                    content: doc.content
                  });
                  console.log(`Saved project-level document: ${doc.name} in folder: ${folder}`);
                } catch (error) {
                  console.error(`Error saving project-level document ${doc.name}:`, error);
                }
              }
            }
          } else {
            // Find the actual database ID for this distributor
            const dbDistributor = createdDistributors.find((d: any) => d.distributor_id === distributorId);

            if (dbDistributor && docs.length > 0) {
              for (const doc of docs) {
                try {
                  await dataService.createDocument({
                    projectId: savedProject.id,
                    distributorId: dbDistributor.id,
                    folder: folder,
                    name: doc.name,
                    type: doc.type,
                    size: doc.size,
                    content: doc.content
                  });
                  console.log(`Saved distributor document: ${doc.name} for ${distributorId} in folder: ${folder}`);
                } catch (error) {
                  console.error(`Error saving document ${doc.name}:`, error);
                }
              }
            }
          }
        }

        console.log('All temporary documents saved to database');
      }

      toast.success('Project succesvol aangemaakt!');
      navigate('/projects');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van het project');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ProjectStep
            projectData={projectData}
            onProjectChange={handleProjectChange}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <VerdelersStep
            projectData={projectData}
            onVerdelersChange={(verdelers: any) =>
              setProjectData({ ...projectData, verdelers })
            }
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <UploadsStep
            onBack={handleBack}
            onSave={handleSaveProject}
            verdelers={projectData.verdelers}
            saving={saving}
            onDocumentsChange={setTempDocuments}
            tempDocuments={tempDocuments}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="card p-6">
        <StepNavigation steps={steps} activeStep={currentStep} />
        {renderStep()}
      </div>
    </div>
  );
};

export default CreateProject;