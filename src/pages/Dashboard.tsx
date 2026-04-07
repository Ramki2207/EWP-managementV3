import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  User,
  UserX,
  Pause,
  ArrowRight,
  Plus,
  LogOut,
  Filter,
  ChevronDown,
  ChevronUp,
  Bell,
  Package,
  Zap,
  BarChart3,
  FileText,
  Users,
  CalendarDays,
  Timer,
  Wrench,
  Target,
  Activity
} from 'lucide-react';
import { supabase, dataService } from '../lib/supabase';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { hasLocationAccess } from '../lib/locationUtils';
import { useLocationFilter } from '../contexts/LocationFilterContext';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  project_number: string;
  date: string;
  status: string;
  description: string;
  client?: string;
  location?: string;
  distributors?: any[];
  deadline?: string;
  created_at: string;
  created_by?: string;
}

interface TestNotification {
  id: string;
  project_number: string;
  kast_naam?: string;
  type: string;
  status: string;
  worker_name: string;
  created_at: string;
}

interface KPIData {
  totalActiveProjects: number;
  projectsOnTrack: number;
  projectsAtRisk: number;
  overdueTasks: number;
}

interface MonteurWorkload {
  name: string;
  activeProjects: number;
  verdelers: Array<{
    project_number: string;
    kast_naam: string;
    status: string;
    deadline?: string;
  }>;
}

interface DeadlineItem {
  project_number: string;
  description: string;
  deadline: string;
  status: string;
  daysUntil: number;
  urgency: 'overdue' | 'today' | 'this_week' | 'this_month' | 'later';
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useEnhancedPermissions();
  const { isLocationVisible, filterMode, setFilterMode } = useLocationFilter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [testNotifications, setTestNotifications] = useState<TestNotification[]>([]);
  const [showTestWidget, setShowTestWidget] = useState(false);
  const [monteurWorkloads, setMonteurWorkloads] = useState<MonteurWorkload[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([]);

  const [kpiData, setKpiData] = useState<KPIData>({
    totalActiveProjects: 0,
    projectsOnTrack: 0,
    projectsAtRisk: 0,
    overdueTasks: 0
  });
  const [urgentActions, setUrgentActions] = useState<any[]>([]);
  const [myActivity, setMyActivity] = useState<any[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);

  useEffect(() => {
    loadDashboardData();
    loadTestNotifications();
  }, [currentUser, statusFilter, locationFilter]);

  const loadTestNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('test_review_notifications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestNotifications(data || []);
    } catch (error) {
      console.error('Error loading test notifications:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getProjects();

      let filteredProjects = (data || []).filter((p: Project) => {
        if (p.status === 'Voltooid') return false;
        if (!isLocationVisible(p.location)) return false;
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (locationFilter !== 'all' && p.location !== locationFilter) return false;
        return true;
      });

      setProjects(filteredProjects);
      calculateKPIs(filteredProjects);
      identifyUrgentActions(filteredProjects);
      extractMyActivity(filteredProjects);
      calculateMonteurWorkloads(filteredProjects);
      calculateUpcomingDeadlines(filteredProjects);

      const recent = [...filteredProjects]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      setRecentProjects(recent);

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateUpcomingDeadlines = (projectList: Project[]) => {
    const deadlines: DeadlineItem[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    projectList.forEach(project => {
      if (project.deadline) {
        const deadline = new Date(project.deadline);
        deadline.setHours(0, 0, 0, 0);

        const diffTime = deadline.getTime() - now.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let urgency: DeadlineItem['urgency'];
        if (daysUntil < 0) urgency = 'overdue';
        else if (daysUntil === 0) urgency = 'today';
        else if (daysUntil <= 7) urgency = 'this_week';
        else if (daysUntil <= 30) urgency = 'this_month';
        else urgency = 'later';

        deadlines.push({
          project_number: project.project_number,
          description: project.description,
          deadline: project.deadline,
          status: project.status,
          daysUntil,
          urgency
        });
      }
    });

    deadlines.sort((a, b) => a.daysUntil - b.daysUntil);
    setUpcomingDeadlines(deadlines.slice(0, 15));
  };

  const calculateMonteurWorkloads = (projectList: Project[]) => {
    const workloadMap: Record<string, MonteurWorkload> = {};

    projectList.forEach(project => {
      project.distributors?.forEach((dist: any) => {
        const monteur = dist.toegewezen_monteur;
        if (monteur && monteur !== 'Vrij') {
          if (!workloadMap[monteur]) {
            workloadMap[monteur] = {
              name: monteur,
              activeProjects: 0,
              verdelers: []
            };
          }

          if (dist.status !== 'Voltooid') {
            workloadMap[monteur].verdelers.push({
              project_number: project.project_number,
              kast_naam: dist.kast_naam,
              status: dist.status || project.status,
              deadline: project.deadline
            });
          }
        }
      });
    });

    Object.values(workloadMap).forEach(workload => {
      const uniqueProjects = new Set(workload.verdelers.map(v => v.project_number));
      workload.activeProjects = uniqueProjects.size;
    });

    const sorted = Object.values(workloadMap).sort((a, b) => b.verdelers.length - a.verdelers.length);
    setMonteurWorkloads(sorted);
  };

  const calculateKPIs = (projectList: Project[]) => {
    const total = projectList.length;

    const onTrack = projectList.filter(p =>
      p.status === 'Productie' || p.status === 'Engineering' || p.status === 'Testen'
    ).length;

    const atRisk = projectList.filter(p =>
      p.status === 'Wacht op onderdelen' || p.status === 'On Hold'
    ).length;

    const now = new Date();
    const overdue = projectList.filter(p => {
      if (!p.deadline) return false;
      return new Date(p.deadline) < now;
    }).length;

    setKpiData({
      totalActiveProjects: total,
      projectsOnTrack: total > 0 ? Math.round((onTrack / total) * 100) : 0,
      projectsAtRisk: atRisk,
      overdueTasks: overdue
    });
  };

  const identifyUrgentActions = (projectList: Project[]) => {
    const actions: any[] = [];
    const now = new Date();

    projectList.forEach(project => {
      if (project.deadline && new Date(project.deadline) < now) {
        actions.push({
          type: 'overdue',
          severity: 'critical',
          icon: Clock,
          project_number: project.project_number,
          description: project.description,
          message: `Achter schema sinds ${new Date(project.deadline).toLocaleDateString('nl-NL')}`,
          project
        });
      }

      if (!project.distributors || project.distributors.length === 0) {
        if (project.status !== 'Offerte' && project.status !== 'Engineering') {
          actions.push({
            type: 'no_distributors',
            severity: 'high',
            icon: Package,
            project_number: project.project_number,
            description: project.description,
            message: 'Geen verdelers toegevoegd aan project',
            project
          });
        }
      }

      const unassignedDist = project.distributors?.filter(
        (d: any) => !d.toegewezen_monteur || d.toegewezen_monteur === 'Vrij'
      ) || [];

      if (unassignedDist.length > 0) {
        actions.push({
          type: 'unassigned',
          severity: 'medium',
          icon: UserX,
          project_number: project.project_number,
          description: project.description,
          message: `${unassignedDist.length} verdeler(s) zonder monteur`,
          count: unassignedDist.length,
          project
        });
      }

      if (project.status === 'On Hold' || project.status === 'Wacht op onderdelen') {
        actions.push({
          type: 'blocked',
          severity: 'high',
          icon: Pause,
          project_number: project.project_number,
          description: project.description,
          message: project.status,
          project
        });
      }

      const readyForTest = project.distributors?.filter(
        (d: any) => d.status === 'Gereed voor testen'
      ) || [];

      if (readyForTest.length > 0) {
        actions.push({
          type: 'ready_test',
          severity: 'medium',
          icon: Zap,
          project_number: project.project_number,
          description: project.description,
          message: `${readyForTest.length} verdeler(s) klaar voor testen`,
          count: readyForTest.length,
          project
        });
      }
    });

    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    setUrgentActions(actions.slice(0, 15));
  };

  const extractMyActivity = (projectList: Project[]) => {
    const activity: any[] = [];
    const username = currentUser?.username;

    projectList.forEach(project => {
      if (project.created_by === username) {
        const openDistributors = project.distributors?.filter(
          (d: any) => d.status !== 'Voltooid'
        ).length || 0;

        activity.push({
          type: 'created',
          icon: FileText,
          project_number: project.project_number,
          description: project.description,
          status: project.status,
          deadline: project.deadline,
          details: `${openDistributors} open verdelers`,
          project
        });
      }

      project.distributors?.forEach((dist: any) => {
        if (dist.toegewezen_monteur === username) {
          activity.push({
            type: 'assigned',
            icon: Package,
            project_number: project.project_number,
            description: project.description,
            verdeler: dist.kast_naam,
            status: dist.status || project.status,
            deadline: project.deadline,
            details: `Verdeler: ${dist.kast_naam}`,
            project
          });
        }
      });
    });

    if (activity.length === 0) {
      projectList.slice(0, 10).forEach(project => {
        activity.push({
          type: 'recent',
          icon: BarChart3,
          project_number: project.project_number,
          description: project.description,
          status: project.status,
          deadline: project.deadline,
          details: `${project.distributors?.length || 0} verdelers`,
          project
        });
      });
    }

    setMyActivity(activity.slice(0, 12));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-900/20';
      default: return 'border-blue-500 bg-blue-900/20';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getUrgencyColor = (urgency: DeadlineItem['urgency']) => {
    switch (urgency) {
      case 'overdue': return 'border-red-500 bg-red-900/30';
      case 'today': return 'border-orange-500 bg-orange-900/30';
      case 'this_week': return 'border-yellow-500 bg-yellow-900/30';
      case 'this_month': return 'border-blue-500 bg-blue-900/30';
      default: return 'border-gray-500 bg-gray-900/30';
    }
  };

  const getUrgencyBadge = (urgency: DeadlineItem['urgency']) => {
    switch (urgency) {
      case 'overdue': return 'bg-red-500';
      case 'today': return 'bg-orange-500';
      case 'this_week': return 'bg-yellow-500';
      case 'this_month': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyLabel = (item: DeadlineItem) => {
    if (item.urgency === 'overdue') return `${Math.abs(item.daysUntil)} dagen te laat`;
    if (item.urgency === 'today') return 'Vandaag';
    if (item.daysUntil === 1) return 'Morgen';
    return `Over ${item.daysUntil} dagen`;
  };

  const getProjectProgress = (project: Project) => {
    const statusProgress: Record<string, number> = {
      'Offerte': 10,
      'Engineering': 30,
      'Productie': 50,
      'Testen': 80,
      'Afgeleverd': 95,
      'Voltooid': 100
    };
    return statusProgress[project.status] || 0;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Offerte': 'bg-gray-500',
      'Engineering': 'bg-blue-500',
      'Productie': 'bg-yellow-500',
      'Testen': 'bg-orange-500',
      'Afgeleverd': 'bg-green-500',
      'Voltooid': 'bg-gray-400',
      'On Hold': 'bg-red-500',
      'Wacht op onderdelen': 'bg-red-400'
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleProjectClick = (projectNumber: string) => {
    navigate(`/projects/${projectNumber}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleTestNotificationClick = async (notification: TestNotification) => {
    try {
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('project_number', notification.project_number);

      if (projects && projects[0]) {
        navigate(`/verdelers/${projects[0].id}`, {
          state: { openTestReview: notification.id }
        });
      }
    } catch (error) {
      console.error('Error navigating to test:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Laden...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Enhanced Hero Top Banner */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-cyan-600 via-blue-700 to-blue-900 shadow-2xl">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                  Dashboard Overzicht
                </h1>
                <p className="text-cyan-100 text-lg font-medium">
                  Welkom terug, <span className="text-white font-bold">{currentUser?.username}</span>
                  <span className="mx-2">•</span>
                  <span className="text-cyan-200">{new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                {testNotifications.length > 0 && (
                  <div className="relative">
                    <button className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all hover:scale-105">
                      <Bell size={24} />
                    </button>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {testNotifications.length}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => navigate('/create-project')}
                  className="flex items-center gap-3 px-8 py-3 bg-white text-blue-700 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                >
                  <Plus size={24} strokeWidth={3} />
                  Nieuw Project
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-xl hover:scale-105 transition-all"
                >
                  <LogOut size={20} />
                  Uitloggen
                </button>
              </div>
            </div>

            {/* Mini Stats in Header */}
            <div className="grid grid-cols-5 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="text-cyan-200" size={18} />
                  <span className="text-xs text-cyan-200 font-medium">Actief</span>
                </div>
                <div className="text-2xl font-bold text-white">{kpiData.totalActiveProjects}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="text-green-300" size={18} />
                  <span className="text-xs text-green-200 font-medium">On Track</span>
                </div>
                <div className="text-2xl font-bold text-white">{kpiData.projectsOnTrack}%</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="text-orange-300" size={18} />
                  <span className="text-xs text-orange-200 font-medium">At Risk</span>
                </div>
                <div className="text-2xl font-bold text-white">{kpiData.projectsAtRisk}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="text-red-300" size={18} />
                  <span className="text-xs text-red-200 font-medium">Te Laat</span>
                </div>
                <div className="text-2xl font-bold text-white">{kpiData.overdueTasks}</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className="text-yellow-300" size={18} />
                  <span className="text-xs text-yellow-200 font-medium">Monteurs</span>
                </div>
                <div className="text-2xl font-bold text-white">{monteurWorkloads.length}</div>
              </div>
            </div>

            {/* Quick Filters Row */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/20">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all border border-white/20"
              >
                <Filter size={18} />
                Filters
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="all">Alle Locaties</option>
                {AVAILABLE_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>

              {showFilters && (
                <>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="all">Alle Statussen</option>
                    <option value="Offerte">Offerte</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Productie">Productie</option>
                    <option value="Testen">Testen</option>
                    <option value="Afgeleverd">Afgeleverd</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Wacht op onderdelen">Wacht op onderdelen</option>
                  </select>

                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="all">Alle Locaties</option>
                    {AVAILABLE_LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 max-w-[1800px] mx-auto">
          {/* Test Review Compact Widget */}
          {testNotifications.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-700/50 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <Bell className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Test Ter Controle</h3>
                      <p className="text-sm text-gray-400">
                        {testNotifications.length} test{testNotifications.length !== 1 ? 's' : ''} wachten op goedkeuring
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTestWidget(!showTestWidget)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                  >
                    {showTestWidget ? (
                      <>
                        <ChevronUp size={16} />
                        Verberg
                      </>
                    ) : (
                      <>
                        Bekijk Alle
                        <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                </div>

                {showTestWidget && (
                  <div className="mt-4 pt-4 border-t border-purple-700/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                      {testNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleTestNotificationClick(notif)}
                          className="bg-gray-900/50 p-3 rounded-lg border border-purple-700/30 hover:border-purple-500 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                            <span className="text-white font-medium text-sm">{notif.project_number}</span>
                          </div>
                          {notif.kast_naam && (
                            <div className="text-xs text-gray-400 mb-1">{notif.kast_naam}</div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-purple-400">{notif.worker_name}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(notif.created_at).toLocaleDateString('nl-NL')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NEW: Deadline Calendar & Monteur Overview Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Deadline Calendar */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 px-6 py-4 border-b border-blue-700/50">
                <div className="flex items-center gap-3">
                  <CalendarDays className="text-blue-400" size={24} />
                  <div>
                    <h2 className="text-xl font-bold text-white">Agenda & Deadlines</h2>
                    <p className="text-sm text-gray-400">Aankomende deadlines en mijlpalen</p>
                  </div>
                  <span className="ml-auto bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
                    {upcomingDeadlines.length}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {upcomingDeadlines.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CalendarDays size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Geen deadlines gevonden</p>
                    </div>
                  ) : (
                    upcomingDeadlines.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleProjectClick(item.project_number)}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${getUrgencyColor(item.urgency)} cursor-pointer hover:scale-[1.02] transition-transform`}
                      >
                        <div className={`${getUrgencyBadge(item.urgency)} p-2 rounded-lg flex-shrink-0`}>
                          <Timer className="text-white" size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold text-sm">{item.project_number}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(item.status)} text-white`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mb-1 truncate">{item.description}</div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500">
                              {new Date(item.deadline).toLocaleDateString('nl-NL')}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className={item.urgency === 'overdue' ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                              {getUrgencyLabel(item)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Monteur Workload Overview */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-900/40 to-yellow-900/40 px-6 py-4 border-b border-orange-700/50">
                <div className="flex items-center gap-3">
                  <Wrench className="text-orange-400" size={24} />
                  <div>
                    <h2 className="text-xl font-bold text-white">Monteur Capaciteit</h2>
                    <p className="text-sm text-gray-400">Werkbelasting per monteur</p>
                  </div>
                  <span className="ml-auto bg-orange-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
                    {monteurWorkloads.length}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {monteurWorkloads.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Geen monteurs met actieve taken</p>
                    </div>
                  ) : (
                    monteurWorkloads.map((workload, index) => (
                      <div
                        key={index}
                        className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-orange-500 transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-orange-600/20 p-2 rounded-lg">
                              <User className="text-orange-400" size={18} />
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">{workload.name}</h3>
                              <p className="text-xs text-gray-500">
                                {workload.activeProjects} project{workload.activeProjects !== 1 ? 'en' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{workload.verdelers.length}</div>
                            <div className="text-xs text-gray-500">verdelers</div>
                          </div>
                        </div>

                        {/* Workload Bar */}
                        <div className="mb-2">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                workload.verdelers.length > 10
                                  ? 'bg-red-500'
                                  : workload.verdelers.length > 5
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((workload.verdelers.length / 15) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Top 3 Verdelers */}
                        <div className="space-y-1">
                          {workload.verdelers.slice(0, 3).map((v, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs cursor-pointer hover:text-orange-400 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProjectClick(v.project_number);
                              }}
                            >
                              <span className="text-gray-400">{v.project_number} - {v.kast_naam}</span>
                              <span className={`px-2 py-0.5 rounded ${getStatusColor(v.status)} text-white`}>
                                {v.status}
                              </span>
                            </div>
                          ))}
                          {workload.verdelers.length > 3 && (
                            <div className="text-xs text-gray-500 italic">
                              +{workload.verdelers.length - 3} meer...
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Actions Section */}
          {urgentActions.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 px-6 py-4 border-b border-red-700/50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="text-red-400" size={24} />
                    <div>
                      <h2 className="text-xl font-bold text-white">Aandacht Vereist</h2>
                      <p className="text-sm text-gray-400">Urgente acties en belangrijke updates</p>
                    </div>
                    <span className="ml-auto bg-red-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
                      {urgentActions.length}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {urgentActions.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={index}
                          onClick={() => handleProjectClick(item.project_number)}
                          className={`flex items-start gap-3 p-4 rounded-lg border ${getSeverityColor(item.severity)} cursor-pointer hover:scale-[1.02] transition-transform`}
                        >
                          <div className={`${getSeverityBadge(item.severity)} p-2 rounded-lg flex-shrink-0`}>
                            <Icon className="text-white" size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-semibold">{item.project_number}</span>
                              <span className="text-xs text-gray-500 truncate">{item.description}</span>
                            </div>
                            <div className="text-sm text-gray-300">{item.message}</div>
                          </div>
                          <ArrowRight className="text-gray-500 flex-shrink-0" size={18} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* LEFT: My Activity */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 px-6 py-4 border-b border-cyan-700/50">
                <div className="flex items-center gap-3">
                  <User className="text-cyan-400" size={20} />
                  <div>
                    <h2 className="text-lg font-bold text-white">Mijn Activiteit</h2>
                    <p className="text-xs text-gray-400">Projecten waar ik bij betrokken ben</p>
                  </div>
                  <span className="ml-auto text-sm text-gray-400">{myActivity.length} items</span>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {myActivity.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users size={48} className="mx-auto mb-3 opacity-50" />
                      <p>Geen activiteit gevonden</p>
                    </div>
                  ) : (
                    myActivity.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={index}
                          onClick={() => handleProjectClick(item.project_number)}
                          className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-cyan-500 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="bg-cyan-600/20 p-2 rounded-lg group-hover:bg-cyan-600/40 transition-colors">
                              <Icon className="text-cyan-400" size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white font-medium">{item.project_number}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(item.status)} text-white`}>
                                  {item.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-400 truncate mb-1">{item.description}</div>
                              <div className="text-xs text-gray-500">{item.details}</div>
                              {item.deadline && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                  <Calendar size={10} />
                                  {new Date(item.deadline).toLocaleDateString('nl-NL')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Recent Projects */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 px-6 py-4 border-b border-blue-700/50">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-blue-400" size={20} />
                  <div>
                    <h2 className="text-lg font-bold text-white">Recente Projecten</h2>
                    <p className="text-xs text-gray-400">Laatst aangemaakte projecten</p>
                  </div>
                  <span className="ml-auto text-sm text-gray-400">{recentProjects.length} actief</span>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {recentProjects.map((project) => {
                    const progress = getProjectProgress(project);
                    const openTasks = project.distributors?.filter(
                      (d: any) => d.status !== 'Voltooid'
                    ).length || 0;

                    return (
                      <div
                        key={project.id}
                        onClick={() => handleProjectClick(project.project_number)}
                        className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white font-medium">{project.project_number}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(project.status)} text-white`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 mb-3 truncate">{project.description}</div>

                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Voortgang</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{openTasks} open taken</span>
                          {project.deadline && (
                            <span className="flex items-center gap-1 text-gray-500">
                              <Calendar size={10} />
                              {new Date(project.deadline).toLocaleDateString('nl-NL')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Organization Status Summary */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="text-cyan-400" size={24} />
              Organisatie Overzicht
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Object.entries(
                projects.reduce((acc: any, p) => {
                  acc[p.status] = (acc[p.status] || 0) + 1;
                  return acc;
                }, {})
              ).map(([status, count]) => (
                <div key={status} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className={`text-xs px-2 py-1 rounded ${getStatusColor(status)} text-white inline-block mb-3`}>
                    {status}
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{count as number}</div>
                  <div className="text-xs text-gray-500">
                    {Math.round(((count as number) / projects.length) * 100)}% van totaal
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
