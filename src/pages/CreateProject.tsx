import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectStep from './CreateProject/ProjectStep';
import VerdelersStep from '../components/VerdelersStep';
import UploadsStep from '../components/CreateProject/UploadsStep';
import StepNavigation from '../components/StepNavigation';
import ProjectHoursPopup from '../components/ProjectHoursPopup';
import { dataService, supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const today = new Date();

const CreateProject = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [tempDocuments, setTempDocuments] = useState<{ [key: string]: any[] }>({});
  const [showHoursPopup, setShowHoursPopup] = useState(false);
  const [savedProjectData, setSavedProjectData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
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

  useEffect(() => {
    const loadCurrentUser = async () => {
      const currentUserId = localStorage.getItem('currentUserId');
      if (currentUserId) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();
        setCurrentUser(data);
      }
    };
    loadCurrentUser();
  }, []);

  const shouldShowHoursPopup = () => {
    if (!currentUser) return false;
    const allowedUsers = ['Raja', 'Radjesh', 'Ronald', 'Michel de Ruiter'];
    return allowedUsers.includes(currentUser.username);
  };

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

      if (shouldShowHoursPopup()) {
        setSavedProjectData(savedProject);
        setShowHoursPopup(true);
      } else {
        navigate('/projects');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van het project');
    } finally {
      setSaving(false);
    }
  };

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getDayOfWeek = (date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const handleHoursSubmit = async (hours: { teken: number; offerte: number; administratie: number }) => {
    try {
      if (!currentUser || !savedProjectData) return;

      const today = new Date();
      const weekNumber = getWeekNumber(today);
      const year = today.getFullYear();
      const dayColumn = getDayOfWeek(today);

      const weekstaatData = {
        user_id: currentUser.id,
        week_number: weekNumber,
        year: year,
        status: 'draft',
        updated_at: new Date().toISOString()
      };

      const { data: weekstaat, error: weekstaatError } = await supabase
        .from('weekstaten')
        .upsert(weekstaatData, {
          onConflict: 'user_id,week_number,year'
        })
        .select()
        .single();

      if (weekstaatError) {
        console.error('Error creating weekstaat:', weekstaatError);
        throw weekstaatError;
      }

      const entries = [];

      if (hours.teken > 0) {
        entries.push({
          weekstaat_id: weekstaat.id,
          activity_code: savedProjectData.project_number,
          activity_description: `Teken uren - ${savedProjectData.project_number}`,
          workorder_number: savedProjectData.project_number,
          [dayColumn]: hours.teken,
          monday: dayColumn === 'monday' ? hours.teken : 0,
          tuesday: dayColumn === 'tuesday' ? hours.teken : 0,
          wednesday: dayColumn === 'wednesday' ? hours.teken : 0,
          thursday: dayColumn === 'thursday' ? hours.teken : 0,
          friday: dayColumn === 'friday' ? hours.teken : 0,
          saturday: dayColumn === 'saturday' ? hours.teken : 0,
          sunday: dayColumn === 'sunday' ? hours.teken : 0
        });
      }

      if (hours.offerte > 0) {
        entries.push({
          weekstaat_id: weekstaat.id,
          activity_code: savedProjectData.project_number,
          activity_description: `Offerte uren - ${savedProjectData.project_number}`,
          workorder_number: savedProjectData.project_number,
          [dayColumn]: hours.offerte,
          monday: dayColumn === 'monday' ? hours.offerte : 0,
          tuesday: dayColumn === 'tuesday' ? hours.offerte : 0,
          wednesday: dayColumn === 'wednesday' ? hours.offerte : 0,
          thursday: dayColumn === 'thursday' ? hours.offerte : 0,
          friday: dayColumn === 'friday' ? hours.offerte : 0,
          saturday: dayColumn === 'saturday' ? hours.offerte : 0,
          sunday: dayColumn === 'sunday' ? hours.offerte : 0
        });
      }

      if (hours.administratie > 0) {
        entries.push({
          weekstaat_id: weekstaat.id,
          activity_code: savedProjectData.project_number,
          activity_description: `Administratie uren - ${savedProjectData.project_number}`,
          workorder_number: savedProjectData.project_number,
          [dayColumn]: hours.administratie,
          monday: dayColumn === 'monday' ? hours.administratie : 0,
          tuesday: dayColumn === 'tuesday' ? hours.administratie : 0,
          wednesday: dayColumn === 'wednesday' ? hours.administratie : 0,
          thursday: dayColumn === 'thursday' ? hours.administratie : 0,
          friday: dayColumn === 'friday' ? hours.administratie : 0,
          saturday: dayColumn === 'saturday' ? hours.administratie : 0,
          sunday: dayColumn === 'sunday' ? hours.administratie : 0
        });
      }

      if (entries.length > 0) {
        const { error: entriesError } = await supabase
          .from('weekstaat_entries')
          .insert(entries);

        if (entriesError) {
          console.error('Error creating weekstaat entries:', entriesError);
          throw entriesError;
        }

        toast.success('Uren succesvol toegevoegd aan je weekstaat!');
      }

      setShowHoursPopup(false);
      navigate('/projects');
    } catch (error) {
      console.error('Error saving hours to weekstaat:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van de uren');
    }
  };

  const handleHoursCancel = () => {
    setShowHoursPopup(false);
    navigate('/projects');
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

      {showHoursPopup && savedProjectData && (
        <ProjectHoursPopup
          projectNumber={savedProjectData.project_number}
          onSubmit={handleHoursSubmit}
          onCancel={handleHoursCancel}
        />
      )}
    </div>
  );
};

export default CreateProject;