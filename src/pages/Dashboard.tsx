import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Plus, LogOut, HelpCircle, FolderOpen, Upload, AlertCircle, CheckCircle2, Clock, Trash2, Filter, Calendar, X, TrendingUp, BarChart3 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase, dataService } from '../lib/supabase';
import { ProjectLock, projectLockManager } from '../lib/projectLocks';
import ProjectLockStatus from '../components/ProjectLockStatus';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';
import ProjectLockBanner from '../components/ProjectLockBanner';
import ProjectDeleteConfirmation from '../components/ProjectDeleteConfirmation';
import HoursTrafficLight from '../components/HoursTrafficLight';
import TestReviewNotifications from '../components/TestReviewNotifications';
import { hasLocationAccess } from '../lib/locationUtils';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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

interface Notification {
  id: string;
  verdeler_id: string;
  project_number: string;
  kast_naam?: string;
  type: string;
  status: string;
  description: string;
  created_at: string;
  worker_name: string;
  read: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useEnhancedPermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectLocks, setProjectLocks] = useState<ProjectLock[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [selectedUserWorkload, setSelectedUserWorkload] = useState<any>(null);
  const [viewAsRole, setViewAsRole] = useState<string>(() => {
    return localStorage.getItem('viewAsRole') || 'admin';
  });
  const [showPreTestingWidget, setShowPreTestingWidget] = useState<boolean>(() => {
    const saved = localStorage.getItem('showPreTestingWidget');
    return saved !== null ? saved === 'true' : true;
  });
  const [showTestReviewWidget, setShowTestReviewWidget] = useState<boolean>(() => {
    const saved = localStorage.getItem('showTestReviewWidget');
    return saved !== null ? saved === 'true' : true;
  });

  const effectiveRole = currentUser?.role === 'admin' ? viewAsRole : currentUser?.role;

  const handleRoleChange = (role: string) => {
    setViewAsRole(role);
    localStorage.setItem('viewAsRole', role);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('viewAsProjectleiderChanged'));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getProjects();
      
      let filteredData = data || [];

      // Role-based filtering for Montage users (except Sven who sees all projects)
      if (effectiveRole === 'montage' && currentUser.username !== 'Sven') {
        const beforeMontageFilter = filteredData.length;
        filteredData = filteredData.filter((project: any) => {
          const hasAssignedVerdelers = project.distributors?.some(
            (dist: any) => dist.toegewezen_monteur === currentUser.username
          );

          if (!hasAssignedVerdelers) {
            console.log(`🔧 DASHBOARD MONTAGE FILTER: Hiding project ${project.project_number} from monteur ${currentUser.username} - NO ASSIGNED VERDELERS`);
          } else {
            console.log(`🔧 DASHBOARD MONTAGE FILTER: Showing project ${project.project_number} to monteur ${currentUser.username} - HAS ASSIGNED VERDELERS`);
          }

          return hasAssignedVerdelers;
        });
        console.log(`🔧 DASHBOARD MONTAGE FILTER: Filtered ${beforeMontageFilter} projects down to ${filteredData.length} for monteur ${currentUser.username}`);
      } else if (effectiveRole === 'montage' && currentUser.username === 'Sven') {
        console.log(`🔧 DASHBOARD MONTAGE FILTER: Sven sees all ${filteredData.length} projects (special access)`);
      }

      // Role-based filtering for Tester users
      if (effectiveRole === 'tester') {
        const beforeRoleFilter = filteredData.length;
        filteredData = filteredData.filter((project: any) => {
          const projectHasTestingStatus = project.status?.toLowerCase() === 'testen';
          const hasDistributorsInTesting = project.distributors?.some(
            (dist: any) => dist.status?.toLowerCase() === 'testen'
          );
          const shouldShow = projectHasTestingStatus || hasDistributorsInTesting;

          if (!shouldShow) {
            console.log(`🧪 DASHBOARD TESTER FILTER: Hiding project ${project.project_number} (status: ${project.status}) from tester ${currentUser.username} - NO TESTING PHASE`);
          } else {
            const reason = projectHasTestingStatus ? 'PROJECT IN TESTING' : 'HAS DISTRIBUTORS IN TESTING';
            console.log(`🧪 DASHBOARD TESTER FILTER: Showing project ${project.project_number} (status: ${project.status}) to tester ${currentUser.username} - ${reason}`);
          }

          return shouldShow;
        });
        console.log(`🧪 DASHBOARD TESTER FILTER: Filtered ${beforeRoleFilter} projects down to ${filteredData.length} for tester ${currentUser.username}`);
      }

      // Role-based filtering for Logistiek users
      if (effectiveRole === 'logistiek') {
        const beforeLogistiekFilter = filteredData.length;
        filteredData = filteredData.filter((project: any) => {
          // Check if project status is "Levering" OR if project has any verdelers with status "Levering"
          const projectIsLevering = project.status === 'Levering';
          const hasVerdelersInLevering = project.distributors?.some(
            (dist: any) => dist.status === 'Levering'
          );

          const shouldShow = projectIsLevering || hasVerdelersInLevering;

          if (!shouldShow) {
            console.log(`📦 DASHBOARD LOGISTIEK FILTER: Hiding project ${project.project_number} from logistiek ${currentUser.username} - NOT IN LEVERING STATUS`);
          } else {
            console.log(`📦 DASHBOARD LOGISTIEK FILTER: Showing project ${project.project_number} to logistiek ${currentUser.username} - IN LEVERING STATUS`);
          }

          return shouldShow;
        });
        console.log(`📦 DASHBOARD LOGISTIEK FILTER: Filtered ${beforeLogistiekFilter} projects down to ${filteredData.length} for logistiek ${currentUser.username}`);
      }

      // Status-based filtering for Dave Moret
      if (currentUser?.username === 'Dave Moret') {
        const beforeDaveFilter = filteredData.length;
        const allowedStatuses = ['Productie', 'Levering', 'Gereed voor facturatie'];
        filteredData = filteredData.filter((project: any) => {
          const hasAllowedStatus = allowedStatuses.includes(project.status);

          if (!hasAllowedStatus) {
            console.log(`👤 DAVE MORET FILTER (loadData): Hiding project ${project.project_number} (status: ${project.status}) - NOT IN ALLOWED STATUSES`);
          } else {
            console.log(`👤 DAVE MORET FILTER (loadData): Showing project ${project.project_number} (status: ${project.status}) - IN ALLOWED STATUSES`);
          }

          return hasAllowedStatus;
        });
        console.log(`👤 DAVE MORET FILTER (loadData): Filtered ${beforeDaveFilter} projects down to ${filteredData.length} for Dave Moret (only Productie, Levering, Gereed voor facturatie)`);
      }

      // Filter for Stefano de Weger and Patrick Herman when viewing as Projectleider
      if (
        currentUser &&
        (currentUser.username === 'Stefano de Weger' || currentUser.username === 'Patrick Herman') &&
        viewAsRole === 'projectleider'
      ) {
        const beforeFilter = filteredData.length;
        filteredData = filteredData.filter((project: any) => {
          const shouldShow = project.created_by === currentUser.id;
          console.log(`👤 DASHBOARD PROJECTLEIDER FILTER: Project ${project.project_number} - created_by: ${project.created_by}, currentUser.id: ${currentUser.id}, shouldShow: ${shouldShow}`);
          return shouldShow;
        });
        console.log(`👤 DASHBOARD PROJECTLEIDER FILTER: Filtered ${beforeFilter} projects down to ${filteredData.length} for ${currentUser.username} (only own projects)`);
      }

      // Apply location filtering if user has location restrictions
      if (currentUser?.assignedLocations && currentUser.assignedLocations.length > 0) {
        if (currentUser.assignedLocations.length < AVAILABLE_LOCATIONS.length) {
          const beforeLocationFilter = filteredData.length;
          filteredData = filteredData.filter((project: any) => {
            const locationAccess = hasLocationAccess(project.location, currentUser.assignedLocations);
            console.log(`🌍 DASHBOARD FILTER: Project ${project.project_number} (location: ${project.location}) - Access: ${locationAccess}`);
            return locationAccess;
          });
          console.log(`🌍 DASHBOARD: Filtered ${beforeLocationFilter} projects to ${filteredData.length} for user ${currentUser.username}`);
        } else {
          console.log(`🌍 DASHBOARD: User ${currentUser.username} has access to all locations`);
        }
      } else {
        console.log(`🌍 DASHBOARD: User ${currentUser?.username} has no location restrictions`);
      }
      
      setProjects(filteredData);
      
      // Check for pending approvals
      await checkPendingApprovals(filteredData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Er is een fout opgetreden bij het laden van de dashboard gegevens');
    } finally {
      setLoading(false);
    }
  };

  const checkPendingApprovals = async (projectList: any[]) => {
    const approvals = [];

    // Determine if current user can see all approvals
    const isAdmin = currentUser?.role === 'admin';
    const isTester = effectiveRole === 'tester';
    const isIbrahimOrZouhair = currentUser?.username === 'Ibrahim Abdalla' || currentUser?.username === 'Zouhair Taha';
    const canSeeAll = isAdmin || isTester || isIbrahimOrZouhair;

    console.log('👁️ Pre-Testing Approvals Filter:', {
      username: currentUser?.username,
      role: currentUser?.role,
      effectiveRole,
      canSeeAll,
      isAdmin,
      isTester,
      isIbrahimOrZouhair
    });

    for (const project of projectList) {
      if (project.distributors?.length > 0) {
        // Check ALL distributors that are in 'testen' status
        for (const distributor of project.distributors) {
          // Only check distributors with status 'testen'
          if (distributor.status?.toLowerCase() !== 'testen') {
            continue;
          }

          try {
            const testData = await dataService.getTestData(distributor.id);
            const approvalRecord = testData?.find((data: any) => data.test_type === 'verdeler_pre_testing_approval');

            if (approvalRecord && approvalRecord.data.approvalData) {
              const approvalData = approvalRecord.data.approvalData;

              // Only show items that are waiting for review (status = 'submitted' and not yet reviewed)
              if (approvalData.status === 'submitted' && !approvalData.reviewedAt) {
                // Filter based on user permissions
                const submittedBy = approvalData.submittedBy;
                const isOwnSubmission = submittedBy === currentUser?.username;

                // Show if: user can see all OR it's their own submission
                if (canSeeAll || isOwnSubmission) {
                  console.log('✅ Showing approval:', {
                    project: project.project_number,
                    distributor: distributor.distributor_id,
                    submittedBy,
                    reason: canSeeAll ? 'Can see all' : 'Own submission'
                  });

                  approvals.push({
                    project,
                    distributor,
                    status: 'submitted',
                    submittedBy: approvalData.submittedBy,
                    submittedAt: approvalData.submittedAt
                  });
                } else {
                  console.log('❌ Hiding approval:', {
                    project: project.project_number,
                    distributor: distributor.distributor_id,
                    submittedBy,
                    currentUser: currentUser?.username
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error checking approval for distributor:', distributor.distributor_id, error);
          }
        }
      }
    }

    console.log(`📋 Total approvals visible: ${approvals.length}`);
    setPendingApprovals(approvals);
  };


  // Get current user ID from localStorage
  const userId = localStorage.getItem('currentUserId');

  useEffect(() => {
    console.log('🚀 DASHBOARD: Component mounting, setting up subscriptions...');
    
    // Get current user's info
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.id === currentUserId);
      if (user) {
    // Load data after we have user info
    if (currentUser || userId) {
      loadData();
    }
        setUsername(user.username);
        setProfilePicture(user.profilePicture || '');
        console.log('👤 DASHBOARD: Current user set:', user.username, user.id);
      }
    }

    // Load data
    loadProjects();
    fetchNotifications();

    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    // Set up real-time subscription for project locks
    console.log('🔄 DASHBOARD: Setting up project locks subscription...');
    const lockUnsubscribe = projectLockManager.subscribeToAllProjectLocks((locks) => {
      console.log('📊 DASHBOARD: Received locks update:', locks.length, 'locks');
      console.log('🔒 DASHBOARD: Lock details:', locks.map(l => `${l.project_id.slice(0, 8)} by ${l.username}`));
      setProjectLocks(locks);
    });

    return () => {
      console.log('🔄 DASHBOARD: Cleaning up subscriptions...');
      subscription.unsubscribe();
      lockUnsubscribe();
    };
  }, [currentUser]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await dataService.getProjects();
      
      // Apply location filtering based on user's assigned locations
      let filteredProjects = data || [];
      
      console.log('🌍 DASHBOARD: Raw projects loaded:', filteredProjects.length);
      console.log('🌍 DASHBOARD: Current user:', currentUser?.username, 'Assigned locations:', currentUser?.assignedLocations);

      // Role-based filtering for Montage users (except Sven who sees all projects)
      if (effectiveRole === 'montage' && currentUser.username !== 'Sven') {
        const beforeMontageFilter = filteredProjects.length;
        filteredProjects = filteredProjects.filter((project: any) => {
          // Check if this project has any verdelers assigned to this monteur
          const hasAssignedVerdelers = project.distributors?.some(
            (dist: any) => dist.toegewezen_monteur === currentUser.username
          );

          if (!hasAssignedVerdelers) {
            console.log(`🔧 DASHBOARD MONTAGE FILTER: Hiding project ${project.project_number} from monteur ${currentUser.username} - NO ASSIGNED VERDELERS`);
          } else {
            console.log(`🔧 DASHBOARD MONTAGE FILTER: Showing project ${project.project_number} to monteur ${currentUser.username} - HAS ASSIGNED VERDELERS`);
          }

          return hasAssignedVerdelers;
        });
        console.log(`🔧 DASHBOARD MONTAGE FILTER: Filtered ${beforeMontageFilter} projects down to ${filteredProjects.length} for monteur ${currentUser.username}`);
      } else if (effectiveRole === 'montage' && currentUser.username === 'Sven') {
        console.log(`🔧 DASHBOARD MONTAGE FILTER (loadProjects): Sven sees all ${filteredProjects.length} projects (special access)`);
      }

      // Role-based filtering for Tester users
      if (effectiveRole === 'tester') {
        const beforeRoleFilter = filteredProjects.length;
        filteredProjects = filteredProjects.filter((project: any) => {
          const hasTestingStatus = project.status?.toLowerCase() === 'testen';

          if (!hasTestingStatus) {
            console.log(`🧪 DASHBOARD TESTER FILTER: Hiding project ${project.project_number} (status: ${project.status}) from tester ${currentUser.username} - NOT IN TESTING PHASE`);
          } else {
            console.log(`🧪 DASHBOARD TESTER FILTER: Showing project ${project.project_number} (status: ${project.status}) to tester ${currentUser.username} - IN TESTING PHASE`);
          }

          return hasTestingStatus;
        });
        console.log(`🧪 DASHBOARD TESTER FILTER: Filtered ${beforeRoleFilter} projects down to ${filteredProjects.length} for tester ${currentUser.username}`);
      }

      // Role-based filtering for Logistiek users
      if (effectiveRole === 'logistiek') {
        const beforeLogistiekFilter = filteredProjects.length;
        filteredProjects = filteredProjects.filter((project: any) => {
          // Check if project status is "Levering" OR if project has any verdelers with status "Levering"
          const projectIsLevering = project.status === 'Levering';
          const hasVerdelersInLevering = project.distributors?.some(
            (dist: any) => dist.status === 'Levering'
          );

          const shouldShow = projectIsLevering || hasVerdelersInLevering;

          if (!shouldShow) {
            console.log(`📦 DASHBOARD LOGISTIEK FILTER (loadProjects): Hiding project ${project.project_number} from logistiek ${currentUser.username} - NOT IN LEVERING STATUS`);
          } else {
            console.log(`📦 DASHBOARD LOGISTIEK FILTER (loadProjects): Showing project ${project.project_number} to logistiek ${currentUser.username} - IN LEVERING STATUS`);
          }

          return shouldShow;
        });
        console.log(`📦 DASHBOARD LOGISTIEK FILTER (loadProjects): Filtered ${beforeLogistiekFilter} projects down to ${filteredProjects.length} for logistiek ${currentUser.username}`);
      }

      // Status-based filtering for Dave Moret
      if (currentUser?.username === 'Dave Moret') {
        const beforeDaveFilter = filteredProjects.length;
        const allowedStatuses = ['Productie', 'Levering', 'Gereed voor facturatie'];
        filteredProjects = filteredProjects.filter((project: any) => {
          const hasAllowedStatus = allowedStatuses.includes(project.status);

          if (!hasAllowedStatus) {
            console.log(`👤 DAVE MORET FILTER: Hiding project ${project.project_number} (status: ${project.status}) - NOT IN ALLOWED STATUSES`);
          } else {
            console.log(`👤 DAVE MORET FILTER: Showing project ${project.project_number} (status: ${project.status}) - IN ALLOWED STATUSES`);
          }

          return hasAllowedStatus;
        });
        console.log(`👤 DAVE MORET FILTER: Filtered ${beforeDaveFilter} projects down to ${filteredProjects.length} for Dave Moret (only Productie, Levering, Gereed voor facturatie)`);
      }

      if (currentUser?.assignedLocations && currentUser.assignedLocations.length > 0) {
        // If user doesn't have access to all locations, filter by assigned locations
        if (currentUser.assignedLocations.length < AVAILABLE_LOCATIONS.length) {
          const beforeFilter = filteredProjects.length;
          filteredProjects = filteredProjects.filter((project: any) => {
            // If project has a location, user must have access to that specific location
            // If project has no location, allow access (legacy projects)
            const locationAccess = hasLocationAccess(project.location, currentUser.assignedLocations);

            if (!locationAccess) {
              console.log(`🌍 DASHBOARD FILTER: Hiding project ${project.project_number} (location: ${project.location}) from user ${currentUser.username} - NO ACCESS`);
            }

            return locationAccess;
          });
          console.log(`🌍 DASHBOARD FILTER: Filtered ${beforeFilter} projects down to ${filteredProjects.length} for user ${currentUser.username}`);
        } else {
          console.log(`🌍 DASHBOARD FILTER: User ${currentUser.username} has access to all locations - showing all projects`);
        }
      } else {
        console.log(`🌍 DASHBOARD FILTER: User ${currentUser?.username} has no location restrictions - showing all projects`);
      }
      
      setProjects(filteredProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
     toast.error(error.message || 'Er is een fout opgetreden bij het laden van de projecten');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
     toast.error(error.message || 'Er is een fout opgetreden bij het laden van de meldingen');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} className="text-green-400" />;
      case 'in_progress':
        return <Clock size={16} className="text-blue-400" />;
      default:
        return <AlertCircle size={16} className="text-yellow-400" />;
    }
  };

  const handleForceUnlock = async (projectId: string) => {
    if (currentUser?.role === 'admin') {
      await projectLockManager.forceUnlockProject(projectId);
    }
  };

  const isProjectLocked = (projectId: string) => {
    if (!currentUser?.id) {
      console.log(`❌ DASHBOARD: No current user ID available`);
      return false;
    }
    
    console.log(`🔍 DASHBOARD: Checking lock for ${projectId} with ${projectLocks.length} total locks`);
    console.log(`📊 DASHBOARD: Available locks:`, projectLocks.map(l => `${l.project_id} by ${l.username}`));
    
    const lock = projectLocks.find(lock => lock.project_id === projectId && lock.is_active);
    console.log(`🔍 DASHBOARD: Found lock for ${projectId}:`, lock);
    console.log(`👤 DASHBOARD: Current user: ${currentUser.username} (${currentUser.id})`);
    
    if (!lock) {
      console.log(`✅ DASHBOARD: No lock found - project available`);
      return false;
    }
    
    const isLocked = lock.user_id !== currentUser.id;
    console.log(`🔒 DASHBOARD: Lock check result - isLocked: ${isLocked}, lock owner: ${lock.username} (${lock.user_id})`);
    
    return isLocked;
  };

  const handleProjectClick = (projectId: string) => {
    handleProjectNavigation(projectId);
  };

  const handleProjectNavigation = async (projectId: string) => {
    if (!currentUser?.id) {
      console.log(`❌ DASHBOARD: No current user ID available`);
      return;
    }

    console.log(`🎯 DASHBOARD: Attempting to navigate to project ${projectId}`);
    
    try {
      // First check if project is already locked by someone else
      const lockCheck = await projectLockManager.isProjectLocked(projectId, currentUser.id);
      console.log(`🔍 DASHBOARD: Lock check result:`, lockCheck);
      
      if (lockCheck.locked) {
        console.log(`🚫 DASHBOARD: Project ${projectId} is LOCKED by ${lockCheck.lockInfo?.username} - BLOCKING NAVIGATION`);
        toast.error(`Project wordt bewerkt door ${lockCheck.lockInfo?.username}`);
        return;
      }

      // Apply location filtering for projects
      let filteredProjects = projects || [];
      
      console.log('🌍 DASHBOARD: Loading projects for user:', currentUser?.username);
      console.log('🌍 DASHBOARD: User assigned locations:', currentUser?.assignedLocations);
      console.log('🌍 DASHBOARD: Total projects before filtering:', filteredProjects.length);
      
      if (currentUser?.assignedLocations && currentUser.assignedLocations.length > 0) {
        // If user doesn't have access to all locations, filter by assigned locations
        if (currentUser.assignedLocations.length < AVAILABLE_LOCATIONS.length) {
          filteredProjects = filteredProjects.filter((project: any) => {
            const projectLocation = project.location;
            const locationAccess = hasLocationAccess(projectLocation, currentUser.assignedLocations);

            console.log(`🌍 DASHBOARD FILTER: Project ${project.project_number} (${projectLocation}) - Access: ${locationAccess}`);

            return locationAccess;
          });
          console.log(`🌍 DASHBOARD: Filtered to ${filteredProjects.length} projects for user ${currentUser.username}`);
        } else {
          console.log(`🌍 DASHBOARD: User ${currentUser.username} has access to all locations`);
        }
      } else {
        console.log(`🌍 DASHBOARD: User ${currentUser?.username} has no location restrictions`);
      }
      
      setProjects(filteredProjects);
      
      // Create lock and navigate
      const result = await projectLockManager.lockProject(
        projectId,
        currentUser.id,
        currentUser.username
      );
      
      console.log(`🔒 DASHBOARD: Lock creation result:`, result);
      
      if (result.success) {
      const project = projects.find(p => p.id === projectId);
        navigate(`/project/${projectId}`);
      } else {
        console.log(`❌ DASHBOARD: Failed to lock project ${projectId}`);
        toast.error('Kon project niet vergrendelen');
      }
    } catch (error) {
      console.error('❌ DASHBOARD: Error during project navigation:', error);
      toast.error('Er is een fout opgetreden');
    }
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
      // Role-based filtering for Montage users (except Sven who sees all projects)
      if (effectiveRole === 'montage' && currentUser.username !== 'Sven') {
        const hasAssignedVerdelers = project.distributors?.some(
          (dist: any) => dist.toegewezen_monteur === currentUser.username
        );
        if (!hasAssignedVerdelers) {
          return false;
        }
      }

      // Status-based filtering for Dave Moret
      if (currentUser?.username === 'Dave Moret') {
        const allowedStatuses = ['Productie', 'Levering', 'Gereed voor facturatie'];
        if (!allowedStatuses.includes(project.status)) {
          return false;
        }
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

  const handleLogout = () => {
    toast.success('Je bent succesvol uitgelogd!');
    setTimeout(() => {
      localStorage.removeItem('loggedIn');
      navigate('/login');
    }, 1500);
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
            <span className="ml-2">Dashboard laden...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <Toaster position="top-right" />
      
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="card p-8 mb-8 relative">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
            {/* Welcome Section */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={username}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/30 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-4 ring-blue-500/30 shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[#1E2530]"></div>
              </div>
              <div>
                <p className="text-gray-400 text-lg mb-1">{(() => {
                  const hour = new Date().getHours();
                  if (hour >= 0 && hour <= 12) return 'Goedemorgen';
                  if (hour >= 12 && hour <= 17) return 'Goedemiddag';
                  return 'Goedeavond';
                })()}, {username}</p>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent mb-2">
                  Welkom terug! 👋
                </h1>
                <p className="text-gray-400">
                  {new Date().toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>

                {/* Admin Role Selector */}
                {currentUser?.role === 'admin' && (
                  <div className="mt-4 flex items-center gap-3 bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-800/30">
                    <span className="text-sm text-gray-300">
                      Weergave als:
                    </span>
                    <select
                      value={viewAsRole}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="bg-[#2A303C] text-white border border-gray-700 rounded-lg px-3 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="admin">Admin</option>
                      <option value="projectleider">Projectleider</option>
                      <option value="montage">Montage</option>
                      <option value="tester">Tester</option>
                      <option value="logistiek">Logistiek</option>
                      <option value="inkoop">Inkoop</option>
                      <option value="engineering">Engineering</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => navigate('/create-project')}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
              >
                <Plus size={20} />
                <span className="font-semibold">Nieuw Project</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="bg-[#2A303C] hover:bg-[#374151] text-white px-4 py-3 rounded-xl shadow-lg transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
              >
                <LogOut size={20} />
                <span>Uitloggen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Special Section for Sven */}
      {currentUser?.username === 'Sven' && (
        <div className="card p-6 mb-8 border-2 border-blue-500/30">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FolderOpen size={20} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold">Mijn Toegewezen Verdelers</h2>
            <span className="text-sm text-gray-400">Projecten met verdelers toegewezen aan jou</span>
          </div>

          <div className="overflow-x-auto">
            {(() => {
              const completedStatuses = ['Testen', 'Levering', 'Opgeleverd'];

              const myProjects = projects
                .filter(project =>
                  project.distributors?.some(
                    (dist: any) => dist.toegewezen_monteur === 'Sven'
                  )
                )
                .map(project => ({
                  ...project,
                  myVerdelers: project.distributors?.filter(
                    (dist: any) => dist.toegewezen_monteur === 'Sven'
                  ) || []
                }))
                .filter(project => {
                  const allCompleted = project.myVerdelers.every(
                    (verdeler: any) => completedStatuses.includes(verdeler.status)
                  );
                  return !allCompleted;
                });

              if (myProjects.length === 0) {
                return (
                  <div className="text-center py-12">
                    <FolderOpen size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">Geen verdelers aan jou toegewezen</p>
                  </div>
                );
              }

              return (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Project</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Klant</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Locatie</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Mijn Verdelers</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Actie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-white">{project.project_number}</div>
                          <div className="text-sm text-gray-400 line-clamp-1">{project.description}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-300">{project.client}</td>
                        <td className="py-4 px-4 text-sm text-gray-300">{project.location}</td>
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            {project.myVerdelers.map((verdeler: any, idx: number) => (
                              <div
                                key={idx}
                                className="text-sm bg-blue-500/10 border border-blue-500/30 rounded px-2 py-1 inline-block mr-1 mb-1"
                              >
                                <span className="text-blue-400 font-medium">{verdeler.distributor_id}</span>
                                {verdeler.kast_naam && (
                                  <span className="text-gray-400"> - {verdeler.kast_naam}</span>
                                )}
                              </div>
                            ))}
                            <div className="text-xs text-gray-500 mt-1">
                              {project.myVerdelers.length} verdeler{project.myVerdelers.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            project.status === 'In behandeling' ? 'bg-blue-500/20 text-blue-400' :
                            project.status === 'Gereed' ? 'bg-green-500/20 text-green-400' :
                            project.status === 'Testen' ? 'bg-yellow-500/20 text-yellow-400' :
                            project.status === 'Levering' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {project.status || 'Onbekend'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleProjectClick(project.id)}
                            disabled={isProjectLocked(project.id)}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      {/* Admin and Projectleider: Quick Actions at Top */}
      {(effectiveRole === 'admin' || effectiveRole === 'projectleider') && (
        <div className="card p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Plus size={20} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold">Snelle Acties</h2>
            <span className="text-sm text-gray-400">Veelgebruikte functies</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/create-project')}
              className="group bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 border border-blue-500/20 hover:border-blue-400/40 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                  <Plus size={24} className="text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">Nieuw Project</h3>
                  <p className="text-xs text-gray-400 mt-1">Start een nieuw project</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/verdelers')}
              className="group bg-gradient-to-br from-green-500/10 to-green-600/10 hover:from-green-500/20 hover:to-green-600/20 border border-green-500/20 hover:border-green-400/40 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                  <Upload size={24} className="text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">Verdelers</h3>
                  <p className="text-xs text-gray-400 mt-1">Beheer verdelers</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/uploads')}
              className="group bg-gradient-to-br from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 border border-purple-500/20 hover:border-purple-400/40 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                  <FolderOpen size={24} className="text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">Documenten</h3>
                  <p className="text-xs text-gray-400 mt-1">Bekijk uploads</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/meldingen')}
              className="group bg-gradient-to-br from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20 border border-orange-500/20 hover:border-orange-400/40 rounded-xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg relative"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300">
                  <Bell size={24} className="text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">Meldingen</h3>
                  <p className="text-xs text-gray-400 mt-1">Service desk</p>
                </div>
              </div>
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Info cards */}
      {/* Enhanced Project Table Section - Top Priority Position */}
      {/* Project Activity Banner */}
      <ProjectLockBanner
        projectLocks={projectLocks}
        currentUserId={currentUser?.id || ''}
      />

      {/* Admin toggle for Pre-Testing widget - Always visible for admins */}
      {currentUser?.role === 'admin' && pendingApprovals.length > 0 && currentUser?.role !== 'logistiek' && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={16} className="text-orange-400" />
              <span className="text-sm text-gray-400">Pre-Testing Goedkeuringen Widget:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const newValue = !showPreTestingWidget;
                  setShowPreTestingWidget(newValue);
                  localStorage.setItem('showPreTestingWidget', String(newValue));
                  toast.success(newValue ? 'Pre-Testing widget ingeschakeld' : 'Pre-Testing widget uitgeschakeld');
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showPreTestingWidget ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showPreTestingWidget ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-medium ${showPreTestingWidget ? 'text-green-400' : 'text-gray-500'}`}>
                {showPreTestingWidget ? 'Aan' : 'Uit'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Approval Status Alerts - Hidden for Logistiek users */}
      {pendingApprovals.length > 0 && currentUser?.role !== 'logistiek' && showPreTestingWidget && (
        <div className="card p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <CheckCircle2 size={20} className="text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-orange-400">Pre-Testing Goedkeuringen</h2>
          </div>
          
          <div className="space-y-3">
            {pendingApprovals.map((approval, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  approval.status === 'approved' ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' :
                  approval.status === 'declined' ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' :
                  'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20'
                }`}
                onClick={() => navigate(`/project/${approval.project.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`text-2xl ${
                      approval.status === 'approved' ? 'text-green-400' :
                      approval.status === 'declined' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {approval.status === 'approved' ? '✅' :
                       approval.status === 'declined' ? '❌' : '⏳'}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        Project {approval.project.project_number} - {approval.distributor?.distributor_id || 'Verdeler'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {approval.distributor?.kast_naam && `${approval.distributor.kast_naam} • `}
                        {approval.status === 'approved' ?
                          `Goedgekeurd door ${approval.reviewedBy}` :
                         approval.status === 'declined' ?
                          `Afgekeurd door ${approval.reviewedBy} - Aanpassingen vereist` :
                          `Ingediend door ${approval.submittedBy} - Wacht op beoordeling`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      approval.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      approval.status === 'declined' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {approval.status === 'approved' ? 'Goedgekeurd' :
                       approval.status === 'declined' ? 'Afgekeurd' :
                       'Wacht op beoordeling'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {approval.reviewedAt ? 
                        new Date(approval.reviewedAt).toLocaleDateString('nl-NL') :
                        approval.submittedAt ?
                        new Date(approval.submittedAt).toLocaleDateString('nl-NL') : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin toggle for Test Review widget */}
      {currentUser?.role === 'admin' && (
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle size={16} className="text-yellow-400" />
              <span className="text-sm text-gray-400">Tests Ter Controle Widget:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const newValue = !showTestReviewWidget;
                  setShowTestReviewWidget(newValue);
                  localStorage.setItem('showTestReviewWidget', String(newValue));
                  toast.success(newValue ? 'Tests Ter Controle widget ingeschakeld' : 'Tests Ter Controle widget uitgeschakeld');
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showTestReviewWidget ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showTestReviewWidget ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-medium ${showTestReviewWidget ? 'text-green-400' : 'text-gray-500'}`}>
                {showTestReviewWidget ? 'Aan' : 'Uit'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Test Review Notifications - Appears after Pre-Testing Goedkeuringen */}
      {(effectiveRole === 'admin' ||
        effectiveRole === 'projectleider' ||
        currentUser?.username === 'Zouhair Taha' ||
        currentUser?.username === 'Ibrahim Abdalla') && showTestReviewWidget && (
        <div className="mb-8">
          <TestReviewNotifications />
        </div>
      )}

      <div id="projecten-overzicht" className="card p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FolderOpen size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Projecten Overzicht</h2>
              <p className="text-sm text-gray-400">Alle actieve en recente projecten</p>
            </div>
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
            <div className="text-sm text-gray-400">
              {filteredProjects.length} van {projects.length} projecten
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="btn-primary flex items-center space-x-2"
            >
              <FolderOpen size={16} />
              <span>Alle projecten</span>
            </button>
          </div>
        </div>
        
        {/* Enhanced Filters */}
        {showFilters && (
          <div className="bg-[#2A303C]/50 rounded-xl p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-400">Project Filters</h3>
              {getActiveFilterCount() > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="btn-secondary flex items-center space-x-2 text-sm"
                >
                  <X size={14} />
                  <span>Wis filters</span>
                </button>
              )}
            </div>

            {/* Quick Date Filters */}
            <div>
              <label className="block text-sm text-gray-400 mb-3">Snelle datum selectie</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Deze week', value: 'this_week' },
                  { label: 'Deze maand', value: 'this_month' },
                  { label: 'Dit kwartaal', value: 'this_quarter' },
                  { label: 'Alle tijd', value: 'all' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setDateFilter(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      dateFilter === option.value
                        ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                        : 'bg-[#374151] text-gray-400 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} />
                      <span>{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
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
                <label className="block text-sm text-gray-400 mb-2">Klant</label>
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
                <label className="block text-sm text-gray-400 mb-2">Zoeken</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Zoeken..."
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

            {/* Filter Summary */}
            {getActiveFilterCount() > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-400">Actieve filters:</span>
                {searchTerm && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                    Zoekterm: "{searchTerm}"
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                    Status: {statusFilter}
                  </span>
                )}
                {clientFilter !== 'all' && (
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                    Klant: {clientFilter}
                  </span>
                )}
                {dateFilter !== 'all' && (
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full">
                    Periode: {dateFilter === 'this_week' ? 'Deze week' : 
                             dateFilter === 'this_month' ? 'Deze maand' : 
                             dateFilter === 'this_quarter' ? 'Dit kwartaal' : dateFilter}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Project Table */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto pr-4">
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
                <th className="table-header text-left">Uren</th>
                <th className="table-header text-left">Omschrijving</th>
                <th className="table-header text-left">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.slice(0, 10).map((project) => (
                <tr 
                  key={project.id} 
                  className={`table-row ${
                    isProjectLocked(project.id) 
                      ? 'opacity-60 cursor-not-allowed' 
                      : 'cursor-pointer hover:bg-[#2A303C]/50'
                  }`}
                  onClick={() => {
                    if (!isProjectLocked(project.id)) {
                      handleProjectNavigation(project.id);
                    } else {
                      console.log(`🚫 Dashboard: Project ${project.id} is locked, cannot navigate`);
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                      {project.status || 'Onbekend'}
                    </span>
                  </td>
                  <td className="py-4">
                    <ProjectLockStatus
                      projectId={project.id}
                      projectLocks={projectLocks}
                      currentUserId={currentUser?.id || ''}
                      currentUserRole={currentUser?.role || 'user'}
                      onForceUnlock={() => handleForceUnlock(project.id)}
                      compact={true}
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
                  <td className="py-4" onClick={(e) => e.stopPropagation()}>
                    <HoursTrafficLight projectId={project.id} />
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
                            handleProjectNavigation(project.id);
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
                        className={`p-2 bg-[#2A303C] rounded-lg transition-colors group ${
                          isProjectLocked(project.id)
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-red-500/20'
                        }`}
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

      {/* Admin and Projectleider: Project Status Overview with Drill-through - Moved to Top */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'projectleider') && (
        <div className="card p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <CheckCircle2 size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Projecten per Status</h2>
              <p className="text-sm text-gray-400">Klik op een status om projecten te bekijken</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Intake', 'Offerte', 'Order', 'Werkvoorbereiding', 'Productie', 'Testen', 'Levering', 'Opgeleverd'].map((status) => {
              const statusProjects = projects.filter(p => p.status?.toLowerCase() === status.toLowerCase());
              const count = statusProjects.length;

              return (
                <div
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setShowFilters(true);
                    const element = document.getElementById('projecten-overzicht');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="p-4 bg-gradient-to-br from-[#2A303C] to-[#1E2530] rounded-lg border border-gray-700 hover:border-blue-500/40 cursor-pointer transition-all transform hover:scale-105"
                >
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${getStatusColor(status).split(' ')[1]}`}>
                      {count}
                    </div>
                    <div className="text-sm text-gray-300 font-medium mb-1">{status}</div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full ${getStatusColor(status).replace('text-', 'bg-').replace('/20', '/60')}`}
                        style={{ width: `${projects.length > 0 ? (count / projects.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin and Projectleider: Compact Dashboard Sections */}
      {(effectiveRole === 'admin' || effectiveRole === 'projectleider') && (
        <>
          {/* Three Column Layout for Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Today's Deliveries - Compact Card */}
            <div className="card p-6 bg-gradient-to-br from-green-500/5 to-green-600/5 border-green-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Calendar size={18} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Vandaag</h3>
                    <p className="text-xs text-gray-400">Leveringen</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-400">
                  {projects.filter(p => p.expected_delivery_date === new Date().toISOString().split('T')[0]).length}
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {projects
                  .filter(p => p.expected_delivery_date === new Date().toISOString().split('T')[0])
                  .sort((a, b) => new Date(a.expected_delivery_date).getTime() - new Date(b.expected_delivery_date).getTime())
                  .map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectNavigation(project.id)}
                      className="p-3 bg-[#2A303C] rounded-lg border border-green-500/20 hover:border-green-500/60 cursor-pointer transition-all hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-blue-400 text-sm truncate">{project.project_number}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 truncate">{project.client}</p>
                        </div>
                        <div className="text-xs text-green-400 ml-2 bg-green-500/10 px-2 py-1 rounded">
                          {project.distributors?.length || 0}x
                        </div>
                      </div>
                    </div>
                  ))}
                {projects.filter(p => p.expected_delivery_date === new Date().toISOString().split('T')[0]).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Geen leveringen vandaag</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deliveries - Next 7 Days - Timeline Style */}
            <div className="card p-6 bg-gradient-to-br from-orange-500/5 to-orange-600/5 border-orange-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Clock size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Deze Week</h3>
                    <p className="text-xs text-gray-400">7 Dagen</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-400">
                  {projects.filter(p => {
                    if (!p.expected_delivery_date) return false;
                    const deliveryDate = new Date(p.expected_delivery_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);
                    return deliveryDate >= tomorrow && deliveryDate <= nextWeek;
                  }).length}
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {projects
                  .filter(p => {
                    if (!p.expected_delivery_date) return false;
                    const deliveryDate = new Date(p.expected_delivery_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    const nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);
                    return deliveryDate >= tomorrow && deliveryDate <= nextWeek;
                  })
                  .sort((a, b) => new Date(a.expected_delivery_date).getTime() - new Date(b.expected_delivery_date).getTime())
                  .map((project) => {
                    const deliveryDate = new Date(project.expected_delivery_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysUntil = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <div
                        key={project.id}
                        onClick={() => handleProjectNavigation(project.id)}
                        className="p-3 bg-[#2A303C] rounded-lg border border-orange-500/20 hover:border-orange-500/60 cursor-pointer transition-all hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-blue-400 text-sm truncate">{project.project_number}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-300 truncate">{project.client}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-orange-400 font-medium whitespace-nowrap">
                              {deliveryDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                            </div>
                            <div className="text-xs text-gray-500">{daysUntil} {daysUntil === 1 ? 'dag' : 'dagen'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {projects.filter(p => {
                  if (!p.expected_delivery_date) return false;
                  const deliveryDate = new Date(p.expected_delivery_date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(today.getDate() + 1);
                  const nextWeek = new Date(today);
                  nextWeek.setDate(today.getDate() + 7);
                  return deliveryDate >= tomorrow && deliveryDate <= nextWeek;
                }).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Clock size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Geen leveringen deze week</p>
                  </div>
                )}
              </div>
            </div>

            {/* User Workload Overview - Compact Grid */}
            <div className="card p-6 bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FolderOpen size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Werkbelasting</h3>
                    <p className="text-xs text-gray-400">Medewerkers</p>
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  {(() => {
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    return users.filter((user: any) => {
                      // Only count users with verdelers that have status "Productie"
                      const hasWork = projects.some(p => {
                        const hasProductieVerdelers = p.distributors?.some((d: any) =>
                          d.toegewezen_monteur === user.username &&
                          d.status?.toLowerCase() === 'productie'
                        );
                        return hasProductieVerdelers;
                      });
                      return hasWork;
                    }).length;
                  })()}
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {(() => {
                  const users = JSON.parse(localStorage.getItem('users') || '[]');
                  const workload = users.map((user: any) => {
                    // Only include projects where user has verdelers with status "Productie"
                    const userProjects = projects.filter(p => {
                      const hasProductieVerdelers = p.distributors?.some((d: any) =>
                        d.toegewezen_monteur === user.username &&
                        d.status?.toLowerCase() === 'productie'
                      );
                      return hasProductieVerdelers;
                    });

                    // Count only verdelers with status "Productie" assigned to this user
                    const verdelerCount = projects.reduce((total, p) => {
                      const userVerdelers = p.distributors?.filter((d: any) =>
                        d.toegewezen_monteur === user.username &&
                        d.status?.toLowerCase() === 'productie'
                      ) || [];
                      return total + userVerdelers.length;
                    }, 0);

                    return {
                      user,
                      projectCount: userProjects.length,
                      verdelerCount,
                      projects: userProjects
                    };
                  }).filter((w: any) => w.projectCount > 0 || w.verdelerCount > 0)
                    .sort((a: any, b: any) => b.verdelerCount - a.verdelerCount);

                  return workload.length > 0 ? workload.map((item: any) => (
                    <div
                      key={item.user.id}
                      onClick={() => setSelectedUserWorkload(item)}
                      className="p-3 bg-[#2A303C] rounded-lg border border-blue-500/20 hover:border-blue-500/60 cursor-pointer transition-all hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {item.user.profilePicture ? (
                            <img
                              src={item.user.profilePicture}
                              alt={item.user.username}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-white">
                                {item.user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">{item.user.username}</p>
                            <p className="text-xs text-gray-400">{item.user.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-center bg-blue-500/10 px-2 py-1 rounded">
                            <div className="text-sm text-blue-400 font-medium">{item.projectCount}</div>
                            <div className="text-xs text-gray-500">proj</div>
                          </div>
                          <div className="text-center bg-green-500/10 px-2 py-1 rounded">
                            <div className="text-sm text-green-400 font-medium">{item.verdelerCount}</div>
                            <div className="text-xs text-gray-500">verd</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-xs">Geen toegewezen werk</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Combined Deliveries & Workload Chart */}
          <div className="card p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                <BarChart3 size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Werkbelasting & Levering Overzicht</h2>
                <p className="text-sm text-gray-400">Dagelijkse distributie van leveringen en werkbelasting</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const chartData = [];

                  for (let i = 0; i < 7; i++) {
                    const date = new Date(today);
                    date.setDate(today.getDate() + i);
                    const dateStr = date.toISOString().split('T')[0];

                    const dayProjects = projects.filter(p => p.expected_delivery_date === dateStr);
                    const deliveriesCount = dayProjects.length;

                    const verdelersCount = dayProjects.reduce((total, p) => total + (p.distributors?.length || 0), 0);

                    const allVerdelers = dayProjects.flatMap(p =>
                      (p.distributors || []).map((d: any) => ({
                        kast_naam: d.kast_naam,
                        project_number: p.project_number,
                        toegewezen_monteur: d.toegewezen_monteur
                      }))
                    );

                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const activeUsers = users.filter((user: any) => {
                      return dayProjects.some(p =>
                        p.distributors?.some((d: any) => d.toegewezen_monteur === user.username)
                      );
                    });

                    chartData.push({
                      date: date.toLocaleDateString('nl-NL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      }),
                      fullDate: dateStr,
                      Projecten: deliveriesCount,
                      Verdelers: verdelersCount,
                      Medewerkers: activeUsers.length,
                      isToday: i === 0,
                      projectDetails: dayProjects.map(p => ({
                        project_number: p.project_number,
                        client: p.client,
                        location: p.location
                      })),
                      verdelerDetails: allVerdelers,
                      employeeDetails: activeUsers.map((u: any) => ({
                        username: u.username,
                        verdelerCount: allVerdelers.filter((v: any) => v.toegewezen_monteur === u.username).length
                      }))
                    });
                  }

                  return chartData;
                })()}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorProjecten" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="colorVerdelers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{
                    value: 'Aantal',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#9ca3af', fontSize: 12 }
                  }}
                />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload || !payload.length) return null;

                    const data = payload[0].payload;

                    return (
                      <div className="bg-[#1e293b] border border-gray-700 rounded-lg p-4 shadow-2xl max-w-md">
                        <div className="font-bold text-white mb-3 pb-2 border-b border-gray-700">
                          {data.date}
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{data.Projecten}</div>
                            <div className="text-xs text-gray-400">Projecten</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-400">{data.Verdelers}</div>
                            <div className="text-xs text-gray-400">Verdelers</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-400">{data.Medewerkers}</div>
                            <div className="text-xs text-gray-400">Medewerkers</div>
                          </div>
                        </div>

                        {/* Project Details */}
                        {data.projectDetails && data.projectDetails.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-semibold text-green-400 mb-2 flex items-center">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                              Projecten:
                            </div>
                            <div className="space-y-1 ml-4">
                              {data.projectDetails.map((p: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-300">
                                  <span className="font-medium text-white">{p.project_number}</span>
                                  {p.client && <span className="text-gray-400"> - {p.client}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Verdeler Details */}
                        {data.verdelerDetails && data.verdelerDetails.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-semibold text-orange-400 mb-2 flex items-center">
                              <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                              Verdelers:
                            </div>
                            <div className="space-y-1 ml-4 max-h-32 overflow-y-auto">
                              {data.verdelerDetails.map((v: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-300">
                                  <span className="font-medium text-white">{v.kast_naam}</span>
                                  <span className="text-gray-400"> ({v.project_number})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Employee Details */}
                        {data.employeeDetails && data.employeeDetails.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-blue-400 mb-2 flex items-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                              Medewerkers:
                            </div>
                            <div className="space-y-1 ml-4">
                              {data.employeeDetails.map((e: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-300 flex justify-between items-center">
                                  <span className="font-medium text-white">{e.username}</span>
                                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                    {e.verdelerCount} {e.verdelerCount === 1 ? 'verdeler' : 'verdelers'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    color: '#fff'
                  }}
                  iconType="circle"
                />
                <Bar
                  dataKey="Projecten"
                  fill="url(#colorProjecten)"
                  radius={[8, 8, 0, 0]}
                  name="Projecten"
                />
                <Bar
                  dataKey="Verdelers"
                  fill="url(#colorVerdelers)"
                  radius={[8, 8, 0, 0]}
                  name="Verdelers"
                />
                <Line
                  type="monotone"
                  dataKey="Medewerkers"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Medewerkers"
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Chart Legend with Details */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const chartData = [];

                for (let i = 0; i < 7; i++) {
                  const date = new Date(today);
                  date.setDate(today.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];

                  const dayProjects = projects.filter(p => p.expected_delivery_date === dateStr);
                  chartData.push({
                    projectCount: dayProjects.length,
                    verdelerCount: dayProjects.reduce((total, p) => total + (p.distributors?.length || 0), 0),
                    verdelers: dayProjects.flatMap(p => (p.distributors || []))
                  });
                }

                const totalProjects = chartData.reduce((sum, day) => sum + day.projectCount, 0);
                const totalVerdelers = chartData.reduce((sum, day) => sum + day.verdelerCount, 0);

                const allAssignedUsers = new Set();
                chartData.forEach(day => {
                  day.verdelers.forEach((v: any) => {
                    if (v.toegewezen_monteur) {
                      allAssignedUsers.add(v.toegewezen_monteur);
                    }
                  });
                });

                return (
                  <>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-300">Projecten</span>
                      </div>
                      <p className="text-2xl font-bold text-green-400">
                        {totalProjects}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Komende 7 dagen</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-300">Verdelers</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-400">
                        {totalVerdelers}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Te leveren verdelers</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-300">Medewerkers</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-400">
                        {allAssignedUsers.size}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Actieve medewerkers</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Project & Verdeler Timeline Agenda */}
          <div className="card p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <Calendar className="text-blue-400" size={24} />
                  <span>Project Planning & Status Overzicht</span>
                </h2>
                <p className="text-sm text-gray-400 mt-1">Realtime inzicht in projectstatus en verwachte leverdata</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-400">Op schema</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-400">Waarschuwing</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-400">Urgent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Timeline View */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Klant</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Leverdatum</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Verdelers</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Voortgang</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    // Filter projects: Include if project status is Productie/Testen OR if it has verdelers with Productie/Testen status
                    const upcomingProjects = projects
                      .filter(p => {
                        if (!p.expected_delivery_date) return false;

                        const projectStatus = p.status?.toLowerCase();
                        const isProjectProductieOrTesten = projectStatus === 'productie' || projectStatus === 'testen';

                        // Check if any verdelers have Productie or Testen status
                        const hasProductieOrTestenVerdelers = p.distributors?.some((d: any) => {
                          const verdelerStatus = d.status?.toLowerCase();
                          return verdelerStatus === 'productie' || verdelerStatus === 'testen';
                        }) || false;

                        return isProjectProductieOrTesten || hasProductieOrTestenVerdelers;
                      })
                      .sort((a, b) => {
                        const dateA = new Date(a.expected_delivery_date!);
                        const dateB = new Date(b.expected_delivery_date!);
                        return dateA.getTime() - dateB.getTime();
                      });

                    if (upcomingProjects.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <Calendar className="mx-auto text-gray-600 mb-4" size={48} />
                            <p className="text-gray-400">Geen actieve projecten met verwachte leverdatum</p>
                          </td>
                        </tr>
                      );
                    }

                    return upcomingProjects.map((project) => {
                      const deliveryDate = new Date(project.expected_delivery_date!);
                      const daysUntil = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                      let statusColor = 'green';
                      let statusText = 'Op schema';

                      if (daysUntil < 0) {
                        statusColor = 'red';
                        statusText = 'Verlopen';
                      } else if (daysUntil <= 2) {
                        statusColor = 'red';
                        statusText = 'Urgent';
                      } else if (daysUntil <= 5) {
                        statusColor = 'yellow';
                        statusText = 'Binnenkort';
                      }

                      // Only count verdelers with Productie or Testen status
                      const relevantVerdelers = project.distributors?.filter((d: any) => {
                        const verdelerStatus = d.status?.toLowerCase();
                        return verdelerStatus === 'productie' || verdelerStatus === 'testen';
                      }) || [];

                      const verdelerCount = relevantVerdelers.length;
                      const completedVerdelers = relevantVerdelers.filter((d: any) =>
                        d.testing_status === 'completed'
                      ).length;
                      const progressPercent = verdelerCount > 0 ? (completedVerdelers / verdelerCount) * 100 : 0;

                      return (
                        <tr
                          key={project.id}
                          className="border-b border-gray-800 hover:bg-gray-800/30 cursor-pointer transition-colors"
                          onClick={() => handleProjectClick(project.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full bg-${statusColor}-500 animate-pulse`}></div>
                              <span className={`text-xs font-medium text-${statusColor}-400`}>
                                {statusText}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium text-white">{project.project_number}</div>
                            <div className="text-xs text-gray-500 capitalize">{project.status}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-300">{project.client || '-'}</div>
                            <div className="text-xs text-gray-500">{project.location || '-'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-white">
                              {deliveryDate.toLocaleDateString('nl-NL', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {daysUntil < 0 ? (
                                <span className="text-red-400">{Math.abs(daysUntil)}d verlopen</span>
                              ) : daysUntil === 0 ? (
                                <span className="text-yellow-400">Vandaag</span>
                              ) : daysUntil === 1 ? (
                                <span className="text-yellow-400">Morgen</span>
                              ) : (
                                <span>Over {daysUntil}d</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-300">{verdelerCount} verdelers</div>
                            <div className="text-xs text-gray-500">{completedVerdelers} voltooid</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-700 rounded-full h-2 min-w-[80px]">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    progressPercent === 100 ? 'bg-green-500' :
                                    progressPercent > 50 ? 'bg-blue-500' : 'bg-yellow-500'
                                  }`}
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-400 min-w-[35px]">
                                {Math.round(progressPercent)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Enhanced KPI Dashboard - Hidden for Admin and Projectleider */}
      {effectiveRole !== 'admin' && effectiveRole !== 'projectleider' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Projects KPI */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl"></div>
          <div className="card p-6 relative backdrop-blur-sm border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                <FolderOpen size={24} className="text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">Actief</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Totaal Projecten</h3>
              <p className="text-3xl font-bold text-white mb-2">{projects.length}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((projects.length / Math.max(projects.length, 10)) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className="text-xs text-blue-400 font-medium">100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Projects KPI */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl"></div>
          <div className="card p-6 relative backdrop-blur-sm border border-green-500/20 hover:border-green-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                <Clock size={24} className="text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-sm">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 font-medium">Lopend</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Actieve Projecten</h3>
              <p className="text-3xl font-bold text-white mb-2">
                {projects.filter(p => p.status && !['opgeleverd', 'verloren'].includes(p.status.toLowerCase())).length}
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${projects.length > 0 ? Math.min((projects.filter(p => p.status && !['opgeleverd', 'verloren'].includes(p.status.toLowerCase())).length / projects.length) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-xs text-green-400 font-medium">
                  {projects.length > 0 ? Math.round((projects.filter(p => p.status && !['opgeleverd', 'verloren'].includes(p.status.toLowerCase())).length / projects.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Projects KPI */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl"></div>
          <div className="card p-6 relative backdrop-blur-sm border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                <CheckCircle2 size={24} className="text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">Voltooid</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Voltooide Projecten</h3>
              <p className="text-3xl font-bold text-white mb-2">
                {projects.filter(p => p.status?.toLowerCase() === 'opgeleverd').length}
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${projects.length > 0 ? Math.min((projects.filter(p => p.status?.toLowerCase() === 'opgeleverd').length / projects.length) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-xs text-purple-400 font-medium">
                  {projects.length > 0 ? Math.round((projects.filter(p => p.status?.toLowerCase() === 'opgeleverd').length / projects.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Distributors KPI */}
        <div className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-2xl"></div>
          <div className="card p-6 relative backdrop-blur-sm border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300">
                <Upload size={24} className="text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-400 font-medium">Systeem</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Totaal Verdelers</h3>
              <p className="text-3xl font-bold text-white mb-2">
                {projects.reduce((total, project) => total + (project.distributors?.length || 0), 0)}
              </p>
              <div className="flex items-center space-x-2">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${projects.length > 0 ? Math.min((projects.reduce((total, project) => total + (project.distributors?.length || 0), 0) / (projects.length * 3)) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-xs text-orange-400 font-medium">
                  {projects.length > 0 ? Math.round((projects.reduce((total, project) => total + (project.distributors?.length || 0), 0) / Math.max(projects.length, 1))) : 0} gem.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Activity Feed Section */}
      {/* Status Overview Section - Hidden for Admin */}
      {currentUser?.role !== 'admin' && (
      <div className="card p-6 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <CheckCircle2 size={20} className="text-green-400" />
          </div>
          <h2 className="text-xl font-semibold">Status Overzicht</h2>
          <span className="text-sm text-gray-400">Project voortgang en distributie</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Project Completion Progress */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-400">Project Voltooiing</h3>
              <div className="text-2xl font-bold text-blue-400">
                {projects.length > 0 ? Math.round((projects.filter(p => p.status?.toLowerCase() === 'opgeleverd').length / projects.length) * 100) : 0}%
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Voltooid</span>
                <span className="text-green-400 font-medium">
                  {projects.filter(p => p.status?.toLowerCase() === 'opgeleverd').length}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${projects.length > 0 ? (projects.filter(p => p.status?.toLowerCase() === 'opgeleverd').length / projects.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Actief</span>
                <span className="text-blue-400 font-medium">
                  {projects.filter(p => p.status && !['opgeleverd', 'verloren'].includes(p.status.toLowerCase())).length}
                </span>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <h3 className="font-semibold text-purple-400 mb-4">Status Verdeling</h3>
            <div className="space-y-3">
              {['Intake', 'Offerte', 'Order', 'Testen', 'Levering', 'Gereed voor facturatie', 'Opgeleverd', 'Verloren'].map((status) => {
                const count = projects.filter(p => p.status?.toLowerCase() === status.toLowerCase()).length;
                const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;
                const colors = {
                  'Intake': 'from-blue-500 to-blue-400',
                  'Offerte': 'from-yellow-500 to-yellow-400',
                  'Order': 'from-indigo-500 to-indigo-400',
                  'Testen': 'from-orange-500 to-orange-400',
                  'Levering': 'from-teal-500 to-teal-400',
                  'Gereed voor facturatie': 'from-cyan-500 to-cyan-400',
                  'Opgeleverd': 'from-green-500 to-green-400',
                  'Verloren': 'from-red-500 to-red-400'
                };
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[status] || 'from-gray-500 to-gray-400'}`}></div>
                      <span className="text-sm text-gray-300">{status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${colors[status] || 'from-gray-500 to-gray-400'} h-2 rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-white font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Progress */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <h3 className="font-semibold text-green-400 mb-4">Deze Maand</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Nieuwe Projecten</span>
                  <span className="text-lg font-bold text-green-400">
                    {projects.filter(p => {
                      const projectDate = new Date(p.created_at);
                      const thisMonth = new Date();
                      return projectDate.getMonth() === thisMonth.getMonth() && 
                             projectDate.getFullYear() === thisMonth.getFullYear();
                    }).length}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${projects.length > 0 ? Math.min((projects.filter(p => {
                        const projectDate = new Date(p.created_at);
                        const thisMonth = new Date();
                        return projectDate.getMonth() === thisMonth.getMonth() && 
                               projectDate.getFullYear() === thisMonth.getFullYear();
                      }).length / Math.max(projects.length * 0.3, 1)) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Verdelers Toegevoegd</span>
                  <span className="text-lg font-bold text-blue-400">
                    {projects.reduce((total, project) => {
                      const projectDate = new Date(project.created_at);
                      const thisMonth = new Date();
                      if (projectDate.getMonth() === thisMonth.getMonth() && 
                          projectDate.getFullYear() === thisMonth.getFullYear()) {
                        return total + (project.distributors?.length || 0);
                      }
                      return total;
                    }, 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${Math.min((projects.reduce((total, project) => {
                        const projectDate = new Date(project.created_at);
                        const thisMonth = new Date();
                        if (projectDate.getMonth() === thisMonth.getMonth() && 
                            projectDate.getFullYear() === thisMonth.getFullYear()) {
                          return total + (project.distributors?.length || 0);
                        }
                        return total;
                      }, 0) / Math.max(projects.reduce((total, project) => total + (project.distributors?.length || 0), 0) * 0.3, 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}


      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <ProjectDeleteConfirmation
          project={projectToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* User Workload Detail Modal */}
      {selectedUserWorkload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 bg-gradient-to-br from-blue-500/10 to-blue-600/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {selectedUserWorkload.user.profilePicture ? (
                    <img
                      src={selectedUserWorkload.user.profilePicture}
                      alt={selectedUserWorkload.user.username}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-500/30"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-4 ring-blue-500/30">
                      <span className="text-2xl font-bold text-white">
                        {selectedUserWorkload.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedUserWorkload.user.username}</h3>
                    <p className="text-sm text-gray-400">{selectedUserWorkload.user.role}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-sm text-blue-400">{selectedUserWorkload.projectCount} projecten</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-green-400">{selectedUserWorkload.verdelerCount} verdelers</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUserWorkload(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              <h4 className="text-lg font-semibold text-white mb-4">Toegewezen Projecten</h4>
              <div className="space-y-3">
                {selectedUserWorkload.projects.length > 0 ? (
                  selectedUserWorkload.projects.map((project: any) => {
                    const userVerdelers = project.distributors?.filter(
                      (d: any) => d.toegewezen_monteur === selectedUserWorkload.user.username &&
                        d.status?.toLowerCase() === 'productie'
                    ) || [];

                    return (
                      <div
                        key={project.id}
                        onClick={() => {
                          setSelectedUserWorkload(null);
                          handleProjectNavigation(project.id);
                        }}
                        className="p-4 bg-[#2A303C] rounded-lg border border-gray-700 hover:border-blue-500/60 cursor-pointer transition-all hover:shadow-lg group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-semibold text-blue-400 group-hover:text-blue-300">
                                {project.project_number}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 mb-1">{project.client}</p>
                            {project.location && (
                              <p className="text-xs text-gray-400">{project.location}</p>
                            )}
                            {project.expected_delivery_date && (
                              <p className="text-xs text-orange-400 mt-2">
                                Leverdatum: {new Date(project.expected_delivery_date).toLocaleDateString('nl-NL', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="bg-green-500/20 px-3 py-1 rounded-lg">
                              <div className="text-lg font-bold text-green-400">{userVerdelers.length}</div>
                              <div className="text-xs text-gray-400">verdelers</div>
                            </div>
                          </div>
                        </div>

                        {/* List verdelers for this user */}
                        {userVerdelers.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-xs text-gray-400 mb-2">Toegewezen verdelers:</p>
                            <div className="flex flex-wrap gap-2">
                              {userVerdelers.map((verdeler: any) => (
                                <span
                                  key={verdeler.id}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                                >
                                  {verdeler.kast_naam}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Click indicator */}
                        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-end">
                          <span className="text-xs text-gray-500 group-hover:text-blue-400 transition-colors">
                            Klik om project te openen →
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Geen projecten toegewezen</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-700 bg-[#2A303C] flex justify-end">
              <button
                onClick={() => setSelectedUserWorkload(null)}
                className="btn-secondary px-6 py-2"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;