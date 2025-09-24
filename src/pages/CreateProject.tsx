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
        for (const verdeler of projectData.verdelers) {
          console.log('Saving verdeler with data:', verdeler);
          
          const distributorData = {
            distributorId: verdeler.distributorId,
            projectId: savedProject.id,
            kastNaam: verdeler.kastNaam,
            systeem: verdeler.systeem,
            voeding: verdeler.voeding,
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
            status: verdeler.status
          };

          console.log('Distributor data being sent to database:', distributorData);
          await dataService.createDistributor(distributorData);
        }
      }

      // Save documents after project and distributors are created
      if (Object.keys(tempDocuments).length > 0) {
        console.log('Saving temporary documents to database...');
        
        // Get the created distributors to map IDs
        const createdDistributors = await dataService.getDistributorsByProject(savedProject.id);
        
        for (const [key, docs] of Object.entries(tempDocuments)) {
          const [distributorId, folder] = key.split('-');
          
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
              } catch (error) {
                console.error(`Error saving document ${doc.name}:`, error);
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