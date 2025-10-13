import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FolderOpen, Trash2, Upload, Filter, Calendar, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { dataService } from '../lib/supabase';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';
import { ProjectLock, projectLockManager } from '../lib/projectLocks';
import ProjectLockStatus from '../components/ProjectLockStatus';
import ProjectDeleteConfirmation from '../components/ProjectDeleteConfirmation';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import PreTestingApproval from '../components/PreTestingApproval';

// Component to show approval status in project table
const ProjectApprovalStatus: React.FC<{ project: any }> = ({ project }) => {
  const [approvalStatus, setApprovalStatus] = useState<{
    status: 'submitted' | 'approved' | 'declined' | null;
    reviewedBy?: string;
  }>({ status: null });

  useEffect(() => {
    const checkStatus = async () => {
      if (!project.distributors || project.distributors.length === 0) return;
      
      try {
        const firstDistributorId = project.distributors[0].id;
        const testData = await dataService.getTestData(firstDistributorId);
        const approvalRecord = testData?.find((data: any) => data.test_type === 'pre_testing_approval');
        
        if (approvalRecord && approvalRecord.data.approvalData) {
          const approvalData = approvalRecord.data.approvalData;
          
          if (approvalData.reviewedAt) {
            setApprovalStatus({
              status: approvalData.overallApproval ? 'approved' : 'declined',
              reviewedBy: approvalData.reviewedBy
            });
          } else if (approvalData.status === 'submitted') {
            setApprovalStatus({ status: 'submitted' });
          }
        }
      } catch (error) {
        console.error('Error checking approval status:', error);
      }
    };
    
    checkStatus();
  }, [project]);

  if (!approvalStatus.status) return null;

  return (
    <span className={`px-2 py-1 rounded-full text-xs ml-2 ${
      approvalStatus.status === 'approved' ? 'bg-green-500/20 text-green-400' :
      approvalStatus.status === 'declined' ? 'bg-red-500/20 text-red-400' :
      'bg-yellow-500/20 text-yellow-400'
    }`}>
      {approvalStatus.status === 'approved' ? '✅ Goedgekeurd' :
       approvalStatus.status === 'declined' ? '❌ Afgekeurd' :
       '⏳ Ingediend'}
    </span>
  );
};

interface Project {
  id: string;
  project_number: string;
  date: string;
  status: string;
  description: string;
  created_at: string;
  client?: string;
  location?: string;
  distributors?: any[];
}

const Projects = () => {
  const navigate = useNavigate();
  const { currentUser } = useEnhancedPermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectLocks, setProjectLocks] = useState<ProjectLock[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPreTestingApproval, setShowPreTestingApproval] = useState(false);
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState<Project | null>(null);
  const [pendingApprovalProjects, setPendingApprovalProjects] = useState<Set<string>>(new Set());

  // Helper function to check for pending approvals in database
  const checkForPendingApproval = async (project: Project): Promise<boolean> => {
    console.log('🔍 APPROVAL CHECK: Checking project:', project.project_number, 'ID:', project.id);
    console.log('🔍 APPROVAL CHECK: Project distributors:', project.distributors?.length || 0);
    
    if (!project.distributors || project.distributors.length === 0) {
      console.log('❌ APPROVAL CHECK: No distributors found');
      return false;
    }

    try {
      const firstDistributorId = project.distributors[0].id;
      console.log('🔍 APPROVAL CHECK: Checking distributor ID:', firstDistributorId);
      
      const testData = await dataService.getTestData(firstDistributorId);
      console.log('🔍 APPROVAL CHECK: Test data found:', testData?.length || 0);
      
      const approvalRecord = testData?.find((data: any) => data.test_type === 'pre_testing_approval');
      console.log('🔍 APPROVAL CHECK: Approval record found:', !!approvalRecord);
      
      if (approvalRecord && approvalRecord.data.approvalData) {
        const approvalData = approvalRecord.data.approvalData;
        console.log('🔍 APPROVAL CHECK: Approval data status:', approvalData.status);
        console.log('🔍 APPROVAL CHECK: Reviewed at:', approvalData.reviewedAt);
        
        // Check if submitted but not yet reviewed
        const isPending = approvalData.status === 'submitted' && !approvalData.reviewedAt;
        console.log('🔍 APPROVAL CHECK: Is pending approval:', isPending);
        return isPending;
      }
      
      console.log('❌ APPROVAL CHECK: No approval record or data found');
      return false;
    } catch (error) {
      console.error('Error checking approval status:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log('🚀 PROJECTS: Component mounting, setting up subscriptions...');
    
    // Get current user info
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === currentUserId);
      console.log('👤 PROJECTS: Current user set:', user?.username, user?.id);
    }

    loadProjects();

    // Set up real-time subscription for project locks
    console.log('🔄 PROJECTS: Setting up project locks subscription...');
    const lockUnsubscribe = projectLockManager.subscribeToAllProjectLocks((locks) => {
      console.log('📊 PROJECTS: Received locks update:', locks.length, 'locks');
      console.log('🔒 PROJECTS: Lock details:', locks.map(l => `${l.project_id.slice(0, 8)} by ${l.username}`));
      setProjectLocks(locks);
    });

    return () => {
      console.log('🔄 PROJECTS: Cleaning up subscriptions...');
      lockUnsubscribe();
    };
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await dataService.getProjects();
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
     toast.error(error.message || 'Er is een fout opgetreden bij het laden van de projecten');
    } finally {
      setLoading(false);
    }
  };

  const handleForceUnlock = async (projectId: string) => {
    if (currentUser?.role === 'admin') {
      console.log(`Admin force unlocking project ${projectId}`);
      await projectLockManager.forceUnlockProject(projectId);
    }
  };

  const isProjectLocked = (projectId: string) => {
    if (!currentUser?.id) {
      console.log(`❌ PROJECTS: No current user ID available`);
      return false;
    }
    
    console.log(`🔍 PROJECTS: Checking lock for ${projectId} with ${projectLocks.length} total locks`);
    console.log(`📊 PROJECTS: Available locks:`, projectLocks.map(l => `${l.project_id} by ${l.username}`));
    
    const lock = projectLocks.find(lock => lock.project_id === projectId && lock.is_active);
    console.log(`🔍 PROJECTS: Found lock for ${projectId}:`, lock);
    console.log(`👤 PROJECTS: Current user: ${currentUser.username} (${currentUser.id})`);
    
    if (!lock) {
      console.log(`✅ PROJECTS: No lock found - project available`);
      return false;
    }
    
    const isLocked = lock.user_id !== currentUser.id;
    console.log(`🔒 PROJECTS: Lock check result - isLocked: ${isLocked}, lock owner: ${lock.username} (${lock.user_id})`);
    
    return isLocked;
  };

  const handleProjectNavigation = async (projectId: string) => {
    if (!currentUser?.id) {
      console.log(`❌ PROJECTS: No current user ID available`);
      return;
    }

    console.log(`🎯 PROJECTS: Attempting to navigate to project ${projectId}`);
    
    try {
      // First check if project is already locked by someone else
      const lockCheck = await projectLockManager.isProjectLocked(projectId, currentUser.id);
      console.log(`🔍 PROJECTS: Lock check result:`, lockCheck);
      
      if (lockCheck.locked) {
        console.log(`🚫 PROJECTS: Project ${projectId} is LOCKED by ${lockCheck.lockInfo?.username} - BLOCKING NAVIGATION`);
        toast.error(`Project wordt bewerkt door ${lockCheck.lockInfo?.username}`);
        return;
      }

      console.log(`✅ PROJECTS: Project ${projectId} is available, creating lock and navigating...`);
      
      // Create lock and navigate
      const result = await projectLockManager.lockProject(
        projectId,
        currentUser.id,
        currentUser.username
      );
      
      console.log(`🔒 PROJECTS: Lock creation result:`, result);
      
      if (result.success) {
        console.log(`✅ PROJECTS: Successfully locked project ${projectId}, navigating...`);
        navigate(`/project/${projectId}`);
      } else {
        console.log(`❌ PROJECTS: Failed to lock project ${projectId}`);
        toast.error('Kon project niet vergrendelen');
      }
    } catch (error) {
      console.error('❌ PROJECTS: Error during project navigation:', error);
      toast.error('Er is een fout opgetreden');
    }
  };

  const handleProjectClick = async (project: Project) => {
    // Check if this is a tester/admin accessing a project in Productie status
    if (currentUser?.role === 'tester' && 
        project.status?.toLowerCase() === 'productie') {
      // Check if there's a pending approval for this project
      const hasPendingApproval = await checkForPendingApproval(project);
      
      if (hasPendingApproval) {
        console.log('🧪 TESTER: Opening approval interface for project:', project.project_number);
      // There's a pending approval - show review interface
      setSelectedProjectForApproval(project);
      setShowPreTestingApproval(true);
      return;
      } else {
        console.log('🧪 TESTER: No pending approval found for project:', project.project_number);
      }
    }
    
    // Normal project navigation
    handleProjectNavigation(project.id);
  };

  const handlePreTestingApprove = async () => {
    if (!selectedProjectForApproval) return;
    
    try {
      // Update project status to Testen
      await dataService.updateProject(selectedProjectForApproval.id, {
        ...selectedProjectForApproval,
        status: 'Testen'
      });
      
      setShowPreTestingApproval(false);
      setSelectedProjectForApproval(null);
      
      // Reload projects to show updated status
      await loadProjects();
      
      toast.success('Project goedgekeurd voor testfase!');
    } catch (error) {
      console.error('Error approving project for testing:', error);
      toast.error('Er is een fout opgetreden bij het goedkeuren voor testfase');
    }
  };

  const handlePreTestingDecline = async () => {
    if (!selectedProjectForApproval) return;
    
    try {
      // Project stays in Productie status - no change needed
      setShowPreTestingApproval(false);
      setSelectedProjectForApproval(null);
      
      toast.success('Project afgekeurd - blijft in productie voor aanpassingen');
    } catch (error) {
      console.error('Error declining project for testing:', error);
      toast.error('Er is een fout opgetreden bij het afkeuren voor testfase');
    }
  };

  const handlePreTestingCancel = () => {
    setShowPreTestingApproval(false);
    setSelectedProjectForApproval(null);
  };

  const getDateRange = (filter: string) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'this_week':
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        return { start: startOfWeek, end: now };
      case 'this_month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: now };
      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
        return { start: startOfQuarter, end: now };
      default:
        return null;
    }
  };

  const applyFilters = (projectList: Project[]) => {
    return projectList.filter(project => {
      // Role-based filtering for Montage users
      if (currentUser?.role === 'montage') {
        // Check if this project has any verdelers assigned to this monteur
        const hasAssignedVerdelers = project.distributors?.some(
          (dist: any) => dist.toegewezen_monteur === currentUser.username
        );

        if (!hasAssignedVerdelers) {
          console.log(`🔧 MONTAGE FILTER: Hiding project ${project.project_number} from monteur ${currentUser.username} - NO ASSIGNED VERDELERS`);
          return false;
        }

        console.log(`🔧 MONTAGE FILTER: Showing project ${project.project_number} to monteur ${currentUser.username} - HAS ASSIGNED VERDELERS`);
      }

      // Role-based filtering for Tester users
      if (currentUser?.role === 'tester') {
        const isTestingStatus = project.status?.toLowerCase() === 'testen';

        // For production projects, we need to check database for pending approvals
        // This will be handled by the async filtering below
        const isProductionStatus = project.status?.toLowerCase() === 'productie';

        if (!isTestingStatus && !isProductionStatus) {
          console.log(`🧪 TESTER FILTER: Hiding project ${project.project_number} (status: ${project.status}) from tester ${currentUser.username} - NOT IN TESTING OR PRODUCTION PHASE`);
          return false;
        }

        if (isTestingStatus) {
          console.log(`🧪 TESTER FILTER: Showing project ${project.project_number} (status: ${project.status}) to tester ${currentUser.username} - IN TESTING PHASE`);
        } else if (isProductionStatus) {
          console.log(`🧪 TESTER FILTER: Showing project ${project.project_number} (status: ${project.status}) to tester ${currentUser.username} - PRODUCTION STATUS (will check for pending approval)`);
        }
      }

      // Location filter based on user's assigned locations
      console.log('🌍 FILTER: Checking project:', project.project_number, 'Location:', project.location);
      console.log('🌍 FILTER: Current user:', currentUser?.username, 'Assigned locations:', currentUser?.assignedLocations);
      
      if (currentUser?.assignedLocations && currentUser.assignedLocations.length > 0) {
        // Debug user's location data
        console.log('🔍 LOCATION DEBUG: User assignedLocations type:', typeof currentUser.assignedLocations);
        console.log('🔍 LOCATION DEBUG: User assignedLocations value:', currentUser.assignedLocations);
        console.log('🔍 LOCATION DEBUG: Available locations:', AVAILABLE_LOCATIONS);
        
        // Check if user has access to all locations (multiple ways to check)
        const hasAllLocations = 
          // Method 1: Array length equals available locations
          (Array.isArray(currentUser.assignedLocations) && currentUser.assignedLocations.length >= AVAILABLE_LOCATIONS.length) ||
          // Method 2: Contains all available locations
          (Array.isArray(currentUser.assignedLocations) && AVAILABLE_LOCATIONS.every(loc => currentUser.assignedLocations.includes(loc))) ||
          // Method 3: Empty array means all access (legacy)
          (Array.isArray(currentUser.assignedLocations) && currentUser.assignedLocations.length === 0);
        
        console.log('🔍 LOCATION DEBUG: hasAllLocations result:', hasAllLocations);
        
        if (hasAllLocations) {
          console.log(`🌍 LOCATION FILTER: User ${currentUser.username} has access to all locations - showing all projects`);
          // Don't filter by location - show all projects
        } else {
          // If project has a location, user must have access to that specific location
          // If project has no location, allow access (legacy projects)
          const hasLocationAccess = project.location ? currentUser.assignedLocations.includes(project.location) : true;
          console.log('🌍 FILTER: Location access check for', project.project_number, ':', hasLocationAccess);
          console.log('🌍 FILTER: Project location:', project.location, 'User locations:', currentUser.assignedLocations);
          if (!hasLocationAccess) {
            console.log(`🌍 LOCATION FILTER: Hiding project ${project.project_number} (location: ${project.location}) from user ${currentUser.username} (assigned: ${currentUser.assignedLocations.join(', ')}) - NO ACCESS`);
            return false;
          }
        }
      } else {
        console.log(`🌍 LOCATION FILTER: User ${currentUser?.username} has no location restrictions - showing all projects`);
      }

      // Search filter
      const matchesSearch = 
        project.project_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.status?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (project.client?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (project.location?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

      // Client filter
      const matchesClient = clientFilter === 'all' || project.client === clientFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const dateRange = getDateRange(dateFilter);
        if (dateRange) {
          const projectDate = new Date(project.created_at);
          matchesDate = projectDate >= dateRange.start && projectDate <= dateRange.end;
        }
      }

      return matchesSearch && matchesStatus && matchesClient && matchesDate;
    });
  };

  const filteredProjects = applyFilters(projects);

  const getUniqueClients = () => {
    const clients = [...new Set(projects.map(p => p.client).filter(Boolean))];
    return clients.sort();
  };

  const getUniqueStatuses = () => {
    const statuses = [...new Set(projects.map(p => p.status).filter(Boolean))];
    return statuses.sort();
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setClientFilter('all');
    setDateFilter('all');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (clientFilter !== 'all') count++;
    if (dateFilter !== 'all') count++;
    return count;
  };

  const handleAddProject = () => {
    navigate('/create-project');
  };

  const handleDeleteProject = async (projectId: string) => {
    const projectToDelete = projects.find(project => project.id === projectId);
    if (!projectToDelete) return;

    setProjectToDelete(projectToDelete);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      setIsDeleting(true);
      await dataService.deleteProject(projectToDelete.id);
      setProjects(projects.filter(project => project.id !== projectToDelete.id));
      toast.success('Project en alle bijbehorende gegevens zijn verwijderd!');
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Er is een fout opgetreden bij het verwijderen van het project');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setProjectToDelete(null);
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
            <span className="ml-2">Projecten laden...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">Projectenoverzicht</h1>
            <p className="text-gray-400">Beheer al je projecten op één plek</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center space-x-2 ${
                getActiveFilterCount() > 0 ? 'bg-blue-500/20 text-blue-400' : ''
              }`}
            >
              <Filter size={16} />
              <span>Filters</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
            <button
              onClick={handleAddProject}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Project toevoegen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      {showFilters && (
        <div className="card p-6 mb-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-400">Project Filters</h3>
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="btn-secondary flex items-center space-x-2 text-sm"
                >
                  <X size={14} />
                  <span>Wis alle filters ({getActiveFilterCount()})</span>
                </button>
              )}
            </div>

            {/* Quick Date Filters */}
            <div>
              <label className="block text-sm text-gray-400 mb-3">Snelle datum selectie</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Deze week', value: 'this_week', icon: Calendar },
                  { label: 'Deze maand', value: 'this_month', icon: Calendar },
                  { label: 'Dit kwartaal', value: 'this_quarter', icon: Calendar },
                  { label: 'Alle tijd', value: 'all', icon: Calendar }
                ].map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setDateFilter(option.value)}
                      className={`px-4 py-3 rounded-xl text-sm transition-all transform hover:scale-105 ${
                        dateFilter === option.value
                          ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                          : 'bg-[#2A303C] text-gray-400 hover:bg-[#374151] hover:text-white border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon size={16} />
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Status filter</label>
                <select
                  className="input-field"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Alle statussen</option>
                  {getUniqueStatuses().map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Klant filter</label>
                <select
                  className="input-field"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <option value="all">Alle klanten</option>
                  {getUniqueClients().map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Zoeken in projecten</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Projectnummer, klant, locatie..."
                    className="input-field pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Results Summary */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">
                  <strong className="text-white">{filteredProjects.length}</strong> van <strong className="text-white">{projects.length}</strong> projecten
                </span>
                {getActiveFilterCount() > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Actieve filters:</span>
                    {searchTerm && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                        "{searchTerm}"
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                        {statusFilter}
                      </span>
                    )}
                    {clientFilter !== 'all' && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                        {clientFilter}
                      </span>
                    )}
                    {dateFilter !== 'all' && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                        {dateFilter === 'this_week' ? 'Week' : 
                         dateFilter === 'this_month' ? 'Maand' : 
                         dateFilter === 'this_quarter' ? 'Kwartaal' : dateFilter}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Wis alle filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="card p-6">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pr-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="table-header text-left">Projectnummer</th>
                <th className="table-header text-left">Datum</th>
                <th className="table-header text-left">Klant</th>
                <th className="table-header text-left">Locatie</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Vergrendeling</th>
                <th className="table-header text-left">Verdelers</th>
                <th className="table-header text-left">Omschrijving</th>
                <th className="table-header text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr 
                  key={project.id} 
                  className={`table-row ${
                    isProjectLocked(project.id) 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!isProjectLocked(project.id)) {
                      handleProjectClick(project);
                    } else {
                      const lock = projectLocks.find(l => l.project_id === project.id && l.is_active);
                      toast.error(`Project wordt bewerkt door ${lock?.username}`);
                    }
                  }}
                >
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="font-medium text-blue-400">{project.project_number}</span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-300">
                    {new Date(project.date).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="py-4 text-gray-300">
                    {project.client || '-'}
                  </td>
                  <td className="py-4 text-gray-300">
                    {project.location || '-'}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                        {project.status || 'Onbekend'}
                      </span>
                      <ProjectApprovalStatus project={project} />
                    </div>
                  </td>
                  <td className="py-4">
                    <ProjectLockStatus
                      projectId={project.id}
                      projectLocks={projectLocks}
                      currentUserId={currentUser?.id || ''}
                      currentUserRole={currentUser?.role || 'user'}
                      onForceUnlock={() => handleForceUnlock(project.id)}
                    />
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-green-400">
                          {project.distributors?.length || 0}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">verdelers</span>
                    </div>
                  </td>
                  <td className="py-4 max-w-xs">
                    <p className="text-sm text-gray-300 truncate" title={project.description}>
                      {project.description || '-'}
                    </p>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isProjectLocked(project.id)) {
                            navigate(`/uploads?projectId=${project.id}`);
                          }
                        }}
                        className={`p-2 bg-[#2A303C] rounded-lg transition-colors group ${
                          isProjectLocked(project.id)
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-purple-500/20'
                        }`}
                        title="Uploads"
                        disabled={isProjectLocked(project.id)}
                      >
                        <Upload size={16} className="text-gray-400 group-hover:text-purple-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isProjectLocked(project.id)) {
                            handleProjectClick(project);
                          } else {
                            const lock = projectLocks.find(l => l.project_id === project.id && l.is_active);
                            toast.error(`Project wordt bewerkt door ${lock?.username}`);
                          }
                        }}
                        className={`p-2 bg-[#2A303C] rounded-lg transition-colors group ${
                          isProjectLocked(project.id)
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-blue-500/20'
                        }`}
                        title="Openen"
                        disabled={isProjectLocked(project.id)}
                      >
                        <FolderOpen size={16} className="text-gray-400 group-hover:text-blue-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-2 bg-[#2A303C] hover:bg-red-500/20 rounded-lg transition-colors group"
                        title="Verwijderen"
                        disabled={isProjectLocked(project.id)}
                      >
                        <Trash2 size={16} className="text-gray-400 group-hover:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">Geen projecten gevonden</p>
              <p className="text-gray-500 text-sm mt-2">Probeer een andere zoekterm of maak een nieuw project aan</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <ProjectDeleteConfirmation
          project={projectToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* Pre-Testing Approval Modal */}
      {showPreTestingApproval && selectedProjectForApproval && (
        <PreTestingApproval
          project={selectedProjectForApproval}
          onApprove={handlePreTestingApprove}
          onDecline={handlePreTestingDecline}
          onCancel={handlePreTestingCancel}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default Projects;