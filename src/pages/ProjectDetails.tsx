import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileEdit as Edit, Save, X, Plus, Trash2, Upload, FileText, Server, Key } from 'lucide-react';
import { Eye } from 'lucide-react';
import VerdelersStep from '../components/VerdelersStep';
import DocumentViewer from '../components/DocumentViewer';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';
import { projectLockManager } from '../lib/projectLocks';
import ProjectDocumentManager from '../components/ProjectDocumentManager';
import DeliveryNotificationManager from '../components/DeliveryNotificationManager';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import ProductionTracking from '../components/ProductionTracking';
import PreTestingApproval from '../components/PreTestingApproval';
import InvoiceReportPDF from '../components/InvoiceReportPDF';
import DeliveryChecklist from '../components/DeliveryChecklist';

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useEnhancedPermissions();

  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'verdelers' | 'documents' | 'intake' | 'productie'>('details');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lockId, setLockId] = useState<string | null>(null);
  const [showPreTestingApproval, setShowPreTestingApproval] = useState(false);
  const [showWerkvoorbereidingModal, setShowWerkvoorbereidingModal] = useState(false);
  const [tempProjectDeliveryDate, setTempProjectDeliveryDate] = useState('');
  const [tempVerdelerDates, setTempVerdelerDates] = useState<{[key: string]: string}>({});
  const [documentStatus, setDocumentStatus] = useState<Record<string, { verdelerAanzicht: boolean; installatieSchema: boolean }>>({});
  const [checkingDocuments, setCheckingDocuments] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<{ distributorId: string; folder: string } | null>(null);
  const [showDeliveryChecklist, setShowDeliveryChecklist] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<{
    hasApproval: boolean;
    status: 'submitted' | 'approved' | 'declined' | null;
    reviewedBy?: string;
    reviewedAt?: string;
  }>({ hasApproval: false, status: null });

  useEffect(() => {
    // Get current user info
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === currentUserId);
      setCurrentUser(user);
    }

    if (projectId) {
      loadProject();
      loadUsers();
      attemptProjectLock();
      checkApprovalStatus();
    }

    // Cleanup lock on unmount
    return () => {
      if (projectId && currentUser?.id) {
        projectLockManager.unlockProject(projectId, currentUser.id);
      }
    };
  }, [projectId]);

  const checkApprovalStatus = async () => {
    if (!project?.distributors || project.distributors.length === 0) return;
    
    try {
      const firstDistributorId = project.distributors[0].id;
      const testData = await dataService.getTestData(firstDistributorId);
      const approvalRecord = testData?.find((data: any) => data.test_type === 'pre_testing_approval');
      
      if (approvalRecord && approvalRecord.data.approvalData) {
        const approvalData = approvalRecord.data.approvalData;
        
        if (approvalData.reviewedAt) {
          // Review completed
          setApprovalStatus({
            hasApproval: true,
            status: approvalData.overallApproval ? 'approved' : 'declined',
            reviewedBy: approvalData.reviewedBy,
            reviewedAt: approvalData.reviewedAt
          });
        } else if (approvalData.status === 'submitted') {
          // Submitted but not reviewed
          setApprovalStatus({
            hasApproval: true,
            status: 'submitted'
          });
        }
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    }
  };

  // Re-check approval status when project changes
  useEffect(() => {
    if (project) {
      checkApprovalStatus();
    }
  }, [project]);
  // Cleanup lock when user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (projectId && currentUser?.id) {
        projectLockManager.unlockProject(projectId, currentUser.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (projectId && currentUser?.id) {
        projectLockManager.unlockProject(projectId, currentUser.id);
      }
    };
  }, [projectId, currentUser]);

  const attemptProjectLock = async () => {
    if (!projectId || !currentUser) return;

    try {
      console.log(`🎯 PROJECT DETAILS: Attempting to lock project ${projectId} for user ${currentUser.username} (${currentUser.id})`);
      
      // First check if project is already locked
      const lockCheck = await projectLockManager.isProjectLocked(projectId, currentUser.id);
      console.log(`🔍 PROJECT DETAILS: Lock check result:`, lockCheck);
      
      if (lockCheck.locked) {
        console.log(`🚫 PROJECT DETAILS: Project ${projectId} is LOCKED by ${lockCheck.lockInfo?.username} - BLOCKING ACCESS`);
        toast.error(`Dit project wordt momenteel bewerkt door ${lockCheck.lockInfo?.username}`);
        setTimeout(() => {
          console.log('🔄 PROJECT DETAILS: Redirecting to projects due to lock');
          navigate('/projects');
        }, 2000);
        return;
      }

      console.log(`✅ PROJECT DETAILS: Project ${projectId} is available, attempting to lock...`);
      const result = await projectLockManager.lockProject(
        projectId,
        currentUser.id,
        currentUser.username
      );
      console.log(`🔒 PROJECT DETAILS: Lock attempt result:`, result);

      if (result.success && result.lockId) {
        console.log(`✅ PROJECT DETAILS: Successfully locked project ${projectId} with lock ID ${result.lockId}`);
        setLockId(result.lockId);
        
        // Force a refresh of locks to ensure all components see the new lock
        console.log('🔄 PROJECT DETAILS: Forcing lock refresh after successful lock creation');
        await projectLockManager.forceRefreshLocks();
      } else {
        // Project is locked by someone else, redirect back
        console.log(`❌ PROJECT DETAILS: Failed to lock project ${projectId} - redirecting`);
        toast.error('Project kon niet worden vergrendeld');
        setTimeout(() => {
          console.log('🔄 PROJECT DETAILS: Redirecting to projects due to lock failure');
          navigate('/projects');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ PROJECT DETAILS: CRITICAL ERROR attempting to lock project:', error);
      toast.error('Kon project niet vergrendelen');
      setTimeout(() => {
        console.log('🔄 PROJECT DETAILS: Redirecting to projects due to error');
        navigate('/projects');
      }, 2000);
    }
  };

  const loadProject = async () => {
    try {
      setLoading(true);
      const projects = await dataService.getProjects();
      const foundProject = projects.find((p: any) => p.id === projectId);

      console.log('🔍 ProjectDetails - Loaded project:', {
        projectId: foundProject?.id,
        projectNumber: foundProject?.project_number,
        distributorsCount: foundProject?.distributors?.length,
        distributorsSample: foundProject?.distributors?.slice(0, 2).map((d: any) => ({
          id: d.id,
          distributor_id: d.distributor_id,
          kast_naam: d.kast_naam
        }))
      });

      setProject(foundProject || null);
      setEditedProject(foundProject || null);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Er is een fout opgetreden bij het laden van het project');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleEdit = () => {
    // Check if user has permission to update projects
    if (!hasPermission('projects', 'update')) {
      toast.error('Je hebt geen toestemming om projecten te bewerken');
      return;
    }
    setIsEditing(true);
    setEditedProject({ ...project });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProject({ ...project });
  };

  const handleSave = async () => {
    if (!editedProject) return;

    // Check if user has permission to update projects
    if (!hasPermission('projects', 'update')) {
      toast.error('Je hebt geen toestemming om projecten bij te werken');
      return;
    }
    try {
      const updateData = {
        projectNumber: editedProject.project_number,
        date: editedProject.date,
        location: editedProject.location,
        client: editedProject.client,
        contact_person: editedProject.contact_person,
        status: editedProject.status,
        description: editedProject.description,
        expectedDeliveryDate: editedProject.expected_delivery_date
      };

      await dataService.updateProject(editedProject.id, updateData);
      setProject(editedProject);
      setIsEditing(false);
      toast.success('Project gegevens opgeslagen!');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Er is een fout opgetreden bij het opslaan van het project');
    }
  };

  const handleInputChange = async (field: string, value: string) => {
    // Special handling for status change from Order to Werkvoorbereiding
    if (field === 'status' && value === 'Werkvoorbereiding' && editedProject?.status === 'Order') {
      setTempProjectDeliveryDate(editedProject?.expected_delivery_date || '');
      const verdelerDates: {[key: string]: string} = {};
      editedProject?.distributors?.forEach((v: any) => {
        verdelerDates[v.id] = v.gewenste_lever_datum || '';
      });
      setTempVerdelerDates(verdelerDates);

      // Check document status for all verdelers
      setCheckingDocuments(true);
      try {
        const distributorIds = editedProject?.distributors?.map((d: any) => d.id) || [];
        const docStatus = await dataService.checkRequiredDocuments(editedProject.id, distributorIds);
        setDocumentStatus(docStatus);
      } catch (error) {
        console.error('Error checking documents:', error);
        toast.error('Fout bij controleren van documenten');
      } finally {
        setCheckingDocuments(false);
      }

      setShowWerkvoorbereidingModal(true);
      return;
    }

    // Special handling for status change from Productie to Testen
    if (field === 'status' && value === 'Testen' && editedProject?.status === 'Productie') {
      // Only show approval modal if approval hasn't been granted yet
      if (approvalStatus.status !== 'approved') {
        setShowPreTestingApproval(true);
        return;
      }
      // If already approved, allow direct status change
    }

    // Special handling for status change to Levering
    if (field === 'status' && value === 'Levering' && editedProject?.status !== 'Levering') {
      setShowDeliveryChecklist(true);
      return;
    }

    setEditedProject({
      ...editedProject,
      [field]: value
    });
  };
  const handlePreTestingApprove = async () => {
    try {
      // Update project status to Testen
      const updatedProject = {
        ...editedProject,
        status: 'Testen'
      };
      
      setEditedProject(updatedProject);
      setShowPreTestingApproval(false);
      setPendingStatusChange(null);
      
      toast.success('Project goedgekeurd voor testfase!');
    } catch (error) {
      console.error('Error approving for testing:', error);
      toast.error('Er is een fout opgetreden bij het goedkeuren voor testfase');
    }
  };

  const handlePreTestingDecline = async () => {
    try {
      // Keep project status as Productie
      setShowPreTestingApproval(false);
      setPendingStatusChange(null);
      
      toast.success('Project afgekeurd - blijft in productie voor aanpassingen');
    } catch (error) {
      console.error('Error declining for testing:', error);
      toast.error('Er is een fout opgetreden bij het afkeuren voor testfase');
    }
  };

  const handlePreTestingCancel = () => {
    setShowPreTestingApproval(false);
  };

  const handleWerkvoorbereidingConfirm = async () => {
    try {
      // Check if all required documents are uploaded
      const allDocsUploaded = Object.values(documentStatus).every(
        status => status.verdelerAanzicht && status.installatieSchema
      );

      if (!allDocsUploaded) {
        toast.error('Upload eerst alle verplichte documenten (Verdeler aanzicht en Installatie schema) voor elke verdeler!');
        return;
      }

      const updateData = {
        status: 'Werkvoorbereiding',
        expectedDeliveryDate: tempProjectDeliveryDate
      };

      await dataService.updateProject(editedProject.id, updateData);

      for (const [verdId, date] of Object.entries(tempVerdelerDates)) {
        if (date) {
          await dataService.updateDistributor(verdId, {
            gewensteLeverDatum: date
          });
        }
      }

      const updatedProject = {
        ...editedProject,
        status: 'Werkvoorbereiding',
        expected_delivery_date: tempProjectDeliveryDate,
        distributors: editedProject.distributors?.map((v: any) => ({
          ...v,
          gewenste_lever_datum: tempVerdelerDates[v.id] || v.gewenste_lever_datum
        }))
      };

      setProject(updatedProject);
      setEditedProject(updatedProject);
      setShowWerkvoorbereidingModal(false);
      toast.success('Project status bijgewerkt naar Werkvoorbereiding!');
    } catch (error) {
      console.error('Error updating to Werkvoorbereiding:', error);
      toast.error('Er is een fout opgetreden bij het bijwerken van de status');
    }
  };

  const handleWerkvoorbereidingCancel = () => {
    setShowWerkvoorbereidingModal(false);
  };

  const handleDeliveryChecklistConfirm = async () => {
    try {
      // Update project status to Levering
      const updateData = {
        status: 'Levering'
      };

      await dataService.updateProject(editedProject.id, updateData);

      const updatedProject = {
        ...editedProject,
        status: 'Levering'
      };

      setProject(updatedProject);
      setEditedProject(updatedProject);
      setShowDeliveryChecklist(false);
      toast.success('Project status bijgewerkt naar Levering!');
    } catch (error) {
      console.error('Error updating to Levering:', error);
      toast.error('Er is een fout opgetreden bij het bijwerken van de status');
    }
  };

  const handleDeliveryChecklistCancel = () => {
    setShowDeliveryChecklist(false);
  };

  const handleVerdelersChange = (verdelers: any[]) => {
    // Update the project with new verdelers data
    setProject(prev => ({
      ...prev,
      distributors: verdelers
    }));
  };

  const handleVerdelerClick = (verdeler: any) => {
    // Navigate to verdeler details with the verdeler ID
    navigate(`/verdelers/${verdeler.id}`);
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500/20 text-gray-400';

    switch (status.toLowerCase()) {
      case 'intake':
        return 'bg-blue-500/20 text-blue-400';
      case 'offerte':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'order':
        return 'bg-blue-500/20 text-blue-400';
      case 'werkvoorbereiding':
        return 'bg-purple-500/20 text-purple-400';
      case 'productie':
        return 'bg-orange-500/20 text-orange-400';
      case 'testen':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'levering':
        return 'bg-green-500/20 text-green-400';
      case 'gereed voor oplevering':
        return 'bg-green-500/20 text-green-400';
      case 'opgeleverd':
        return 'bg-green-500/20 text-green-400';
      case 'verloren':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Project laden...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <h1 className="text-2xl mb-4">Project niet gevonden</h1>
          <button
            onClick={() => navigate("/projects")}
            className="btn-primary"
          >
            Terug naar projecten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary p-2"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">Project details</h1>
              <p className="text-gray-400">{project.project_number}</p>
              {lockId && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-400">Je werkt nu in dit project</span>
                </div>
              )}
            </div>
          </div>
          {activeTab === 'details' && (
            <div className="flex space-x-2">
              {!isEditing ? (
                hasPermission('projects', 'update') && (
                <button
                  onClick={handleEdit}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Edit size={20} />
                  <span>Bewerken</span>
                </button>
                )
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <X size={20} />
                    <span>Annuleren</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save size={20} />
                    <span>Opslaan</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Approval Status Alert */}
      {project?.status?.toLowerCase() === 'productie' && approvalStatus.hasApproval && (
        <div className={`card p-4 mb-8 border-l-4 ${
          approvalStatus.status === 'approved' ? 'border-green-400 bg-green-500/10' :
          approvalStatus.status === 'declined' ? 'border-red-400 bg-red-500/10' :
          'border-yellow-400 bg-yellow-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                approvalStatus.status === 'approved' ? 'bg-green-500/20' :
                approvalStatus.status === 'declined' ? 'bg-red-500/20' :
                'bg-yellow-500/20'
              }`}>
                {approvalStatus.status === 'approved' ? '✅' :
                 approvalStatus.status === 'declined' ? '❌' : '⏳'}
              </div>
              <div>
                <h3 className={`font-medium ${
                  approvalStatus.status === 'approved' ? 'text-green-400' :
                  approvalStatus.status === 'declined' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {approvalStatus.status === 'approved' ? 'Pre-Testing Goedgekeurd' :
                   approvalStatus.status === 'declined' ? 'Pre-Testing Afgekeurd' :
                   'Pre-Testing Wacht op Beoordeling'}
                </h3>
                <p className="text-sm text-gray-400">
                  {approvalStatus.status === 'approved' ? 
                    `Goedgekeurd door ${approvalStatus.reviewedBy} op ${approvalStatus.reviewedAt ? new Date(approvalStatus.reviewedAt).toLocaleDateString('nl-NL') : ''}` :
                   approvalStatus.status === 'declined' ?
                    `Afgekeurd door ${approvalStatus.reviewedBy} op ${approvalStatus.reviewedAt ? new Date(approvalStatus.reviewedAt).toLocaleDateString('nl-NL') : ''} - Aanpassingen vereist` :
                    'Checklist is ingediend en wacht op beoordeling door tester'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPreTestingApproval(true)}
              className={`btn-primary flex items-center space-x-2 ${
                approvalStatus.status === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                approvalStatus.status === 'declined' ? 'bg-red-600 hover:bg-red-700' :
                'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              <span>
                {approvalStatus.status === 'approved' ? 'Bekijk Goedkeuring' :
                 approvalStatus.status === 'declined' ? 'Bekijk Afkeuring' :
                 'Bekijk Status'}
              </span>
            </button>
          </div>
        </div>
      )}
      {/* Navigation Tabs */}
      <div className="card p-4 mb-8">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'details'
                ? 'bg-[#4169e1] text-white'
                : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('verdelers')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'verdelers'
                ? 'bg-[#4169e1] text-white'
                : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
            }`}
          >
            Verdelers ({project.distributors?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'documents'
                ? 'bg-[#4169e1] text-white'
                : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
            }`}
          >
            Documenten
          </button>
          <button
            onClick={() => setActiveTab('intake')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'intake'
                ? 'bg-[#4169e1] text-white'
                : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
            }`}
          >
            Intake Formulier
          </button>
          <button
            onClick={() => setActiveTab('productie')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'productie'
                ? 'bg-[#4169e1] text-white'
                : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
            }`}
          >
            Productie
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="card p-6">
        {activeTab === 'details' && (
          <div>
            <h2 className="text-lg text-gradient mb-6">Project gegevens</h2>

            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Projectnummer", field: "project_number", readOnly: true },
                { label: "Datum", field: "date", type: "date" },
                { label: "Verwachte leverdatum", field: "expected_delivery_date", type: "date" },
                { label: "Locatie", field: "location" },
                { label: "Klant", field: "client" },
                { label: "Contactpersoon", field: "contact_person" },
                {
                  label: "Status",
                  field: "status",
                  type: "select",
                  options: ["", "Intake", "Offerte", "Order", "Werkvoorbereiding", "Productie", "Testen", "Levering", "Gereed voor facturatie", "Opgeleverd", "Verloren"]
                },
                { label: "Omschrijving", field: "description", type: "textarea", colSpan: 2 },
              ].map((field) => {
                const currentValue = isEditing ? editedProject?.[field.field] : project?.[field.field];
                
                return (
                  <div key={field.field} className={field.colSpan ? `col-span-${field.colSpan}` : ''}>
                    <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
                    {isEditing && !field.readOnly ? (
                      field.type === "select" ? (
                        <select
                          className="input-field"
                          value={editedProject?.[field.field] || ''}
                          onChange={(e) => handleInputChange(field.field, e.target.value)}
                        >
                          {field.options?.map(option => (
                            <option key={option} value={option}>
                              {option || 'Selecteer status'}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          className="input-field h-32"
                          value={editedProject?.[field.field] || ''}
                          onChange={(e) => handleInputChange(field.field, e.target.value)}
                        />
                      ) : (
                        <input
                          type={field.type || "text"}
                          className="input-field"
                          value={field.type === "date" && editedProject?.[field.field] 
                            ? editedProject[field.field].split('T')[0]
                            : editedProject?.[field.field] || ''}
                          onChange={(e) => handleInputChange(field.field, e.target.value)}
                        />
                      )
                    ) : (
                      <div className={`input-field ${field.type === "textarea" ? "h-32 overflow-y-auto" : ""}`}>
                        {field.type === "date" && currentValue 
                          ? new Date(currentValue).toLocaleDateString('nl-NL')
                          : field.field === "status" && currentValue ? (
                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(currentValue)}`}>
                              {currentValue}
                            </span>
                          ) : currentValue || "-"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Delivery Notification Section - Only show when status is "Levering" */}
            {project?.status === 'Levering' && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-green-400 mb-4">🚚 Levering Proces</h3>
                <DeliveryNotificationManager
                  project={project}
                  onStatusChange={loadProject}
                />
              </div>
            )}

            {/* Invoice Report Section - Only show when status is "Gereed voor facturatie" */}
            {project?.status === 'Gereed voor facturatie' && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-blue-400 mb-4">💼 Factuurrapport</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Download een overzicht van alle gewerkte uren en gebruikte materialen voor dit project.
                  Dit rapport is bedoeld voor administratie en facturatie.
                </p>
                <InvoiceReportPDF project={project} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'verdelers' && (
          <VerdelersStep
            projectData={project}
            onVerdelersChange={handleVerdelersChange}
            onNext={() => {}} // No next step in project details
            onBack={() => {}} // No back step in project details
            hideNavigation={true} // Hide navigation buttons in project details
          />
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-lg text-gradient mb-6">Project documenten</h2>
            {/* Embedded Document Management */}
            <ProjectDocumentManager project={project} />
          </div>
        )}

        {activeTab === 'intake' && (
          <div>
            <h2 className="text-lg text-gradient mb-6">Intake Formulier</h2>
            {project.intake_form ? (
              <div className="space-y-6">
                {/* Kast Specificaties */}
                <div className="bg-[#2A303C] p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-400 mb-4">Kast Specificaties</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Merk</label>
                      <p className="input-field">{project.intake_form.merk || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Uitvoering</label>
                      <p className="input-field">{project.intake_form.uitvoering || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Breedte (cm)</label>
                      <p className="input-field">{project.intake_form.breedte || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Hoogte (cm)</label>
                      <p className="input-field">{project.intake_form.hoogte || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Diepte (cm)</label>
                      <p className="input-field">{project.intake_form.diepte || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">IP Klasse</label>
                      <p className="input-field">{project.intake_form.ipKlasse || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Amperage</label>
                      <p className="input-field">{project.intake_form.amperage || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Hoofdschakelaar</label>
                      <p className="input-field">{project.intake_form.hoofdschakelaar1 || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Kabel Configuratie */}
                <div className="bg-[#2A303C] p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">Kabel Configuratie</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Inkomende kabel</label>
                      <p className="input-field">{project.intake_form.inkomendeKabel || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Afgaande kabels</label>
                      <p className="input-field">{project.intake_form.afgaandeKabels || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Wartels</label>
                      <p className="input-field">{project.intake_form.wartels ? 'Ja' : 'Nee'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Draai</label>
                      <p className="input-field">{project.intake_form.draai ? 'Ja' : 'Nee'}</p>
                    </div>
                  </div>
                </div>

                {/* Extra Opties */}
                <div className="bg-[#2A303C] p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-400 mb-4">Extra Opties</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Meterbord</label>
                      <p className="input-field">{project.intake_form.meterbord ? 'Ja' : 'Nee'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">PV Groepen</label>
                      <p className="input-field">{project.intake_form.pvGroepen ? 'Ja' : 'Nee'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">PV Subsidie</label>
                      <p className="input-field">{project.intake_form.pvSubsidie ? 'Ja' : 'Nee'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">PV Meettrafo</label>
                      <p className="input-field">{project.intake_form.pvMeettrafo ? 'Ja' : 'Nee'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Totaal Meting</label>
                      <p className="input-field">{project.intake_form.totaalMeting ? 'Ja' : 'Nee'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Laadpaal Groepen</label>
                      <p className="input-field">{project.intake_form.laadpaalGroepen ? 'Ja' : 'Nee'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Laadpaal Afschakeling</label>
                      <p className="input-field">{project.intake_form.laadpaalAfschakeling ? 'Ja' : 'Nee'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Uitbedraden op klemmen</label>
                      <p className="input-field">{project.intake_form.uitbedradenOpKlemmen ? 'Ja' : 'Nee'}</p>
                    </div>
                  </div>
                </div>

                {/* Afgaande Velden 1 */}
                {project.intake_form.afgaandeVelden1 && project.intake_form.afgaandeVelden1.some((veld: any) => veld.aantal) && (
                  <div className="bg-[#2A303C] p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-orange-400 mb-4">Afgaande Velden 1</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left p-2 text-gray-400">Aantal</th>
                            <th className="text-left p-2 text-gray-400">Type</th>
                            <th className="text-left p-2 text-gray-400">Amp</th>
                            <th className="text-left p-2 text-gray-400">Aut</th>
                            <th className="text-left p-2 text-gray-400">MA</th>
                            <th className="text-left p-2 text-gray-400">Imp</th>
                            <th className="text-left p-2 text-gray-400">Mag</th>
                            <th className="text-left p-2 text-gray-400">ALA</th>
                            <th className="text-left p-2 text-gray-400">ALS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.intake_form.afgaandeVelden1.map((veld: any, index: number) => {
                            if (!veld.aantal) return null;
                            return (
                              <tr key={index} className="border-b border-gray-700">
                                <td className="p-2">{veld.aantal}</td>
                                <td className="p-2">{veld.type}</td>
                                <td className="p-2">{veld.amp}</td>
                                <td className="p-2">{veld.aut}</td>
                                <td className="p-2">{veld.ma}</td>
                                <td className="p-2">{veld.imp}</td>
                                <td className="p-2">{veld.mag}</td>
                                <td className="p-2">{veld.ala ? 'Ja' : 'Nee'}</td>
                                <td className="p-2">{veld.als ? 'Ja' : 'Nee'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Afgaande Velden 2 */}
                {project.intake_form.afgaandeVelden2 && project.intake_form.afgaandeVelden2.some((veld: any) => veld.aantal) && (
                  <div className="bg-[#2A303C] p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-orange-400 mb-4">Afgaande Velden 2</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left p-2 text-gray-400">Aantal</th>
                            <th className="text-left p-2 text-gray-400">Type</th>
                            <th className="text-left p-2 text-gray-400">Amp</th>
                            <th className="text-left p-2 text-gray-400">Aut</th>
                            <th className="text-left p-2 text-gray-400">MA</th>
                            <th className="text-left p-2 text-gray-400">Imp</th>
                            <th className="text-left p-2 text-gray-400">Mag</th>
                            <th className="text-left p-2 text-gray-400">ALA</th>
                            <th className="text-left p-2 text-gray-400">ALS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.intake_form.afgaandeVelden2.map((veld: any, index: number) => {
                            if (!veld.aantal) return null;
                            return (
                              <tr key={index} className="border-b border-gray-700">
                                <td className="p-2">{veld.aantal}</td>
                                <td className="p-2">{veld.type}</td>
                                <td className="p-2">{veld.amp}</td>
                                <td className="p-2">{veld.aut}</td>
                                <td className="p-2">{veld.ma}</td>
                                <td className="p-2">{veld.imp}</td>
                                <td className="p-2">{veld.mag}</td>
                                <td className="p-2">{veld.ala ? 'Ja' : 'Nee'}</td>
                                <td className="p-2">{veld.als ? 'Ja' : 'Nee'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Opmerkingen */}
                {project.intake_form.opmerkingen && (
                  <div className="bg-[#2A303C] p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-400 mb-4">Opmerkingen</h3>
                    <p className="input-field h-32 overflow-y-auto whitespace-pre-wrap">
                      {project.intake_form.opmerkingen}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#2A303C] p-8 rounded-lg text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                    <FileText size={32} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Geen Intake Formulier</h3>
                    <p className="text-gray-400 mb-4">
                      Er is geen intake formulier beschikbaar voor dit project.
                    </p>
                    <p className="text-sm text-gray-500">
                      Het intake formulier wordt automatisch opgeslagen wanneer een project wordt aangemaakt via het formulier.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'productie' && (
          <div>
            <h2 className="text-lg text-gradient mb-6">Productie Tracking</h2>
            <ProductionTracking project={project} />
          </div>
        )}
      </div>

      {/* Pre-Testing Approval Modal */}
      {showPreTestingApproval && (
        <PreTestingApproval
          project={project}
          onApprove={handlePreTestingApprove}
          onDecline={handlePreTestingDecline}
          onCancel={handlePreTestingCancel}
          currentUser={currentUser}
        />
      )}

      {/* Werkvoorbereiding Modal */}
      {showWerkvoorbereidingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-orange-400">📋 Werkvoorbereiding Controle</h2>
              <p className="text-gray-400 mt-2">
                Controleer de leverdata en upload de benodigde documenten voordat u doorgaat naar werkvoorbereiding.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Delivery Date */}
              <div className="card p-4">
                <h3 className="text-lg font-semibold text-white mb-4">📅 Project Leverdatum</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Verwachte leverdatum project
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={tempProjectDeliveryDate}
                    onChange={(e) => setTempProjectDeliveryDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Verdelers Delivery Dates */}
              {editedProject?.distributors && editedProject.distributors.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">🔌 Verdeler Leverdata</h3>
                  <div className="space-y-4">
                    {editedProject.distributors.map((verdeler: any) => (
                      <div key={verdeler.id} className="flex items-center space-x-4">
                        <div className="flex-1">
                          <label className="block text-sm text-gray-400 mb-2">
                            {verdeler.distributorId || verdeler.distributor_id} - {verdeler.kastNaam || verdeler.kast_naam || 'Naamloos'}
                          </label>
                          <input
                            type="date"
                            className="input-field"
                            value={tempVerdelerDates[verdeler.id] || ''}
                            onChange={(e) => setTempVerdelerDates({
                              ...tempVerdelerDates,
                              [verdeler.id]: e.target.value
                            })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Upload Section */}
              <div className="card p-4">
                <h3 className="text-lg font-semibold text-white mb-4">📄 Verplichte Documentatie</h3>
                {checkingDocuments ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Documenten controleren...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editedProject?.distributors?.map((verdeler: any) => {
                      const status = documentStatus[verdeler.id] || { verdelerAanzicht: false, installatieSchema: false };
                      const allComplete = status.verdelerAanzicht && status.installatieSchema;

                      return (
                        <div key={verdeler.id} className={`p-4 rounded-lg border ${allComplete ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-white">
                                {verdeler.distributorId || verdeler.distributor_id} - {verdeler.kastNaam || verdeler.kast_naam || 'Naamloos'}
                              </h4>
                            </div>
                            {allComplete && (
                              <span className="text-green-400 text-sm flex items-center gap-2">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Documenten compleet
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {/* Verdeler aanzicht */}
                            <div className={`p-3 rounded border ${status.verdelerAanzicht ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800 border-gray-700'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-300">Verdeler aanzicht</span>
                                {status.verdelerAanzicht ? (
                                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              {!status.verdelerAanzicht && (
                                <button
                                  onClick={() => setUploadingFor({ distributorId: verdeler.id, folder: 'Verdeler aanzicht' })}
                                  className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 w-full"
                                >
                                  Upload
                                </button>
                              )}
                            </div>

                            {/* Installatie schema */}
                            <div className={`p-3 rounded border ${status.installatieSchema ? 'bg-green-500/10 border-green-500/30' : 'bg-gray-800 border-gray-700'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-300">Installatie schema</span>
                                {status.installatieSchema ? (
                                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              {!status.installatieSchema && (
                                <button
                                  onClick={() => setUploadingFor({ distributorId: verdeler.id, folder: 'Installatie schema' })}
                                  className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 w-full"
                                >
                                  Upload
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end space-x-4">
              <button
                onClick={handleWerkvoorbereidingCancel}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={handleWerkvoorbereidingConfirm}
                className="btn-primary"
              >
                Bevestigen en doorgaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {uploadingFor && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Upload Document</h2>
              <p className="text-gray-400 mt-2">
                {uploadingFor.folder}
              </p>
            </div>

            <div className="p-6">
              <DocumentViewer
                projectId={editedProject.id}
                distributorId={uploadingFor.distributorId}
                folder={uploadingFor.folder}
              />
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end space-x-4">
              <button
                onClick={async () => {
                  setUploadingFor(null);
                  // Refresh document status
                  setCheckingDocuments(true);
                  try {
                    const distributorIds = editedProject?.distributors?.map((d: any) => d.id) || [];
                    const docStatus = await dataService.checkRequiredDocuments(editedProject.id, distributorIds);
                    setDocumentStatus(docStatus);
                  } catch (error) {
                    console.error('Error refreshing document status:', error);
                  } finally {
                    setCheckingDocuments(false);
                  }
                }}
                className="btn-primary"
              >
                Sluiten en vernieuwen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Checklist Modal */}
      {showDeliveryChecklist && editedProject && (
        <DeliveryChecklist
          project={editedProject}
          onConfirm={handleDeliveryChecklistConfirm}
          onCancel={handleDeliveryChecklistCancel}
        />
      )}
    </div>
  );
};

export default ProjectDetails;