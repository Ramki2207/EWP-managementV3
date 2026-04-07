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
  Users
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

      // Get most recent projects
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
      // Overdue projects - CRITICAL
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

      // Projects without distributors - HIGH
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

      // Distributors without monteur - MEDIUM
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

      // Blocked projects - HIGH
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

      // Projects ready for testing
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

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    setUrgentActions(actions.slice(0, 15));
  };

  const extractMyActivity = (projectList: Project[]) => {
    const activity: any[] = [];
    const username = currentUser?.username;

    projectList.forEach(project => {
      // Projects I created
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

      // Distributors assigned to me
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

    // If no activity, show recent projects the user has access to
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
        {/* Top Action Bar */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 shadow-lg">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Startpagina</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Welkom terug, <span className="text-cyan-400 font-medium">{currentUser?.username}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Filter size={18} />
                  Filters
                  {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Location Filter */}
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">Alle Locaties</option>
                  {AVAILABLE_LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>

                {/* New Project Button */}
                <button
                  onClick={() => navigate('/create-project')}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all shadow-lg hover:shadow-cyan-500/50"
                >
                  <Plus size={18} />
                  Nieuw Project
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  Uitloggen
                </button>
              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Status Filter</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Locatie Filter</label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="all">Alle Locaties</option>
                      {AVAILABLE_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 max-w-[1800px] mx-auto">
          {/* KPI Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg hover:shadow-cyan-500/10 transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm font-medium">Actieve Projecten</span>
                <TrendingUp className="text-cyan-400" size={24} />
              </div>
              <div className="text-4xl font-bold text-white mb-1">{kpiData.totalActiveProjects}</div>
              <div className="text-xs text-gray-500">Totaal in behandeling</div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-green-700/30 shadow-lg hover:shadow-green-500/10 transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm font-medium">On Track</span>
                <CheckCircle2 className="text-green-400" size={24} />
              </div>
              <div className="text-4xl font-bold text-green-400 mb-1">{kpiData.projectsOnTrack}%</div>
              <div className="text-xs text-gray-500">Loopt volgens planning</div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-orange-700/30 shadow-lg hover:shadow-orange-500/10 transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm font-medium">At Risk</span>
                <AlertTriangle className="text-orange-400" size={24} />
              </div>
              <div className="text-4xl font-bold text-orange-400 mb-1">{kpiData.projectsAtRisk}</div>
              <div className="text-xs text-gray-500">Vereist aandacht</div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-red-700/30 shadow-lg hover:shadow-red-500/10 transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm font-medium">Achter Schema</span>
                <Clock className="text-red-400" size={24} />
              </div>
              <div className="text-4xl font-bold text-red-400 mb-1">{kpiData.overdueTasks}</div>
              <div className="text-xs text-gray-500">Past deadline</div>
            </div>
          </div>

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

                        {/* Progress Bar */}
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
              <BarChart3 className="text-cyan-400" size={24} />
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
