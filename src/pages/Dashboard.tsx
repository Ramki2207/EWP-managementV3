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
  ArrowRight
} from 'lucide-react';
import { supabase, dataService } from '../lib/supabase';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { hasLocationAccess } from '../lib/locationUtils';
import { useLocationFilter } from '../contexts/LocationFilterContext';
import Sidebar from '../components/Sidebar';
import TestReviewNotifications from '../components/TestReviewNotifications';

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

interface Task {
  id: string;
  project_number: string;
  project_description: string;
  type: string;
  status: string;
  priority: 'high' | 'medium' | 'low';
  deadline?: string;
  assignee?: string;
  blocker?: string;
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
  const { isLocationVisible } = useLocationFilter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalActiveProjects: 0,
    projectsOnTrack: 0,
    projectsAtRisk: 0,
    overdueTasks: 0
  });
  const [needsAttention, setNeedsAttention] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [blockers, setBlockers] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getProjects();

      let filteredProjects = (data || []).filter((p: Project) =>
        isLocationVisible(p.location) && p.status !== 'Voltooid'
      );

      setProjects(filteredProjects);
      calculateKPIs(filteredProjects);
      identifyNeedsAttention(filteredProjects);
      extractMyTasks(filteredProjects);
      identifyBlockers(filteredProjects);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = (projectList: Project[]) => {
    const activeProjects = projectList.filter(p => p.status !== 'Voltooid');
    const total = activeProjects.length;

    // Calculate project health based on status
    const onTrack = activeProjects.filter(p =>
      p.status === 'Productie' || p.status === 'Engineering' || p.status === 'Testen'
    ).length;

    const atRisk = activeProjects.filter(p =>
      p.status === 'Wacht op onderdelen' || p.status === 'On Hold'
    ).length;

    // Count overdue tasks (projects past deadline)
    const now = new Date();
    const overdue = activeProjects.filter(p => {
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

  const identifyNeedsAttention = (projectList: Project[]) => {
    const attention: any[] = [];
    const now = new Date();

    projectList.forEach(project => {
      // Overdue projects
      if (project.deadline && new Date(project.deadline) < now) {
        attention.push({
          type: 'overdue',
          severity: 'critical',
          project_number: project.project_number,
          description: project.description,
          message: `Project achter schema - deadline ${new Date(project.deadline).toLocaleDateString('nl-NL')}`,
          project
        });
      }

      // Projects without distributors
      if (!project.distributors || project.distributors.length === 0) {
        attention.push({
          type: 'no_distributors',
          severity: 'warning',
          project_number: project.project_number,
          description: project.description,
          message: 'Geen verdelers toegevoegd',
          project
        });
      }

      // Distributors without assigned monteur
      project.distributors?.forEach((dist: any) => {
        if (!dist.toegewezen_monteur || dist.toegewezen_monteur === 'Vrij') {
          attention.push({
            type: 'unassigned',
            severity: 'warning',
            project_number: project.project_number,
            description: project.description,
            verdeler: dist.kast_naam || dist.id,
            message: `Verdeler "${dist.kast_naam || 'Onbekend'}" zonder toegewezen monteur`,
            project
          });
        }
      });

      // Blocked projects
      if (project.status === 'On Hold' || project.status === 'Wacht op onderdelen') {
        attention.push({
          type: 'blocked',
          severity: 'warning',
          project_number: project.project_number,
          description: project.description,
          message: `Project geblokkeerd: ${project.status}`,
          project
        });
      }
    });

    // Sort by severity (critical first)
    attention.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return 0;
    });

    setNeedsAttention(attention.slice(0, 10)); // Show top 10
  };

  const extractMyTasks = (projectList: Project[]) => {
    const tasks: any[] = [];
    const username = currentUser?.username;

    projectList.forEach(project => {
      // Projects created by me
      if (project.created_by === username) {
        tasks.push({
          type: 'created',
          project_number: project.project_number,
          description: project.description,
          status: project.status,
          deadline: project.deadline,
          project
        });
      }

      // Distributors assigned to me
      project.distributors?.forEach((dist: any) => {
        if (dist.toegewezen_monteur === username) {
          tasks.push({
            type: 'assigned',
            project_number: project.project_number,
            description: project.description,
            verdeler: dist.kast_naam,
            status: dist.status || project.status,
            deadline: project.deadline,
            project
          });
        }
      });
    });

    setMyTasks(tasks.slice(0, 15)); // Show top 15
  };

  const identifyBlockers = (projectList: Project[]) => {
    const blockersList: any[] = [];

    projectList.forEach(project => {
      // Projects without owners
      if (!project.created_by) {
        blockersList.push({
          type: 'no_owner',
          project_number: project.project_number,
          description: project.description,
          message: 'Geen eigenaar toegewezen',
          project
        });
      }

      // Projects on hold
      if (project.status === 'On Hold') {
        blockersList.push({
          type: 'on_hold',
          project_number: project.project_number,
          description: project.description,
          message: 'Project on hold',
          project
        });
      }

      // Distributors without monteur
      const unassignedCount = project.distributors?.filter(
        (d: any) => !d.toegewezen_monteur || d.toegewezen_monteur === 'Vrij'
      ).length || 0;

      if (unassignedCount > 0) {
        blockersList.push({
          type: 'unassigned_monteur',
          project_number: project.project_number,
          description: project.description,
          message: `${unassignedCount} verdeler(s) zonder monteur`,
          project
        });
      }
    });

    setBlockers(blockersList.slice(0, 10));
  };

  const getProjectHealthColor = (project: Project) => {
    if (project.deadline && new Date(project.deadline) < new Date()) return 'red';
    if (project.status === 'On Hold' || project.status === 'Wacht op onderdelen') return 'orange';
    return 'green';
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
        <div className="p-8 max-w-[1800px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Startpagina</h1>
            <p className="text-gray-400">Welkom terug, {currentUser?.username}</p>
          </div>

          {/* KPI Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Actieve Projecten</span>
                <TrendingUp className="text-blue-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-white">{kpiData.totalActiveProjects}</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">On Track</span>
                <CheckCircle2 className="text-green-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-green-400">{kpiData.projectsOnTrack}%</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">At Risk</span>
                <AlertTriangle className="text-orange-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-orange-400">{kpiData.projectsAtRisk}</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Achter Schema</span>
                <AlertCircle className="text-red-400" size={20} />
              </div>
              <div className="text-3xl font-bold text-red-400">{kpiData.overdueTasks}</div>
            </div>
          </div>

          {/* Needs Attention Section */}
          {needsAttention.length > 0 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-700/50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="text-red-400" size={24} />
                  <h2 className="text-xl font-bold text-white">Aandacht Vereist</h2>
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {needsAttention.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {needsAttention.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleProjectClick(item.project_number)}
                      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                        item.severity === 'critical'
                          ? 'bg-red-900/40 hover:bg-red-900/60 border border-red-700'
                          : 'bg-orange-900/40 hover:bg-orange-900/60 border border-orange-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.type === 'overdue' && <Clock className="text-red-400" size={18} />}
                        {item.type === 'unassigned' && <UserX className="text-orange-400" size={18} />}
                        {item.type === 'blocked' && <Pause className="text-orange-400" size={18} />}
                        {item.type === 'no_distributors' && <AlertCircle className="text-orange-400" size={18} />}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{item.project_number}</span>
                            <span className="text-gray-400 text-sm">{item.description}</span>
                          </div>
                          <div className="text-sm text-gray-300 mt-1">{item.message}</div>
                        </div>
                      </div>
                      <ArrowRight className="text-gray-400" size={18} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Test Review Notifications */}
          <div className="mb-8">
            <TestReviewNotifications />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* LEFT: My Tasks */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <User size={20} />
                Mijn Taken
                <span className="ml-auto text-sm text-gray-400">{myTasks.length} taken</span>
              </h2>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {myTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Geen taken toegewezen
                  </div>
                ) : (
                  myTasks.map((task, index) => (
                    <div
                      key={index}
                      onClick={() => handleProjectClick(task.project_number)}
                      className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-white font-medium">{task.project_number}</div>
                          <div className="text-sm text-gray-400">{task.description}</div>
                          {task.verdeler && (
                            <div className="text-xs text-cyan-400 mt-1">Verdeler: {task.verdeler}</div>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)} text-white`}>
                          {task.status}
                        </span>
                      </div>
                      {task.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} />
                          Deadline: {new Date(task.deadline).toLocaleDateString('nl-NL')}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT: Project Overview */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Project Overzicht
                <span className="ml-2 text-sm text-gray-400">{projects.length} actief</span>
              </h2>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {projects.slice(0, 20).map((project) => {
                  const progress = getProjectProgress(project);
                  const healthColor = getProjectHealthColor(project);
                  const openTasks = project.distributors?.filter(
                    (d: any) => d.status !== 'Voltooid'
                  ).length || 0;

                  return (
                    <div
                      key={project.id}
                      onClick={() => handleProjectClick(project.project_number)}
                      className="bg-gray-900 p-4 rounded-lg border border-gray-700 hover:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{project.project_number}</span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                healthColor === 'green' ? 'bg-green-400' :
                                healthColor === 'orange' ? 'bg-orange-400' : 'bg-red-400'
                              }`}
                            />
                          </div>
                          <div className="text-sm text-gray-400 mb-2">{project.description}</div>

                          {/* Progress Bar */}
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Voortgang</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  healthColor === 'green' ? 'bg-green-500' :
                                  healthColor === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded ${getStatusColor(project.status)} text-white`}>
                              {project.status}
                            </span>
                            {project.deadline && (
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(project.deadline).toLocaleDateString('nl-NL')}
                              </span>
                            )}
                            <span>{openTasks} open taken</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Blockers / Issues Section */}
          {blockers.length > 0 && (
            <div className="mb-8">
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Pause size={20} />
                  Blockers & Issues
                  <span className="ml-auto text-sm text-gray-400">{blockers.length}</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {blockers.map((blocker, index) => (
                    <div
                      key={index}
                      onClick={() => handleProjectClick(blocker.project_number)}
                      className="bg-gray-900 p-4 rounded-lg border border-orange-700/50 hover:border-orange-500 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {blocker.type === 'no_owner' && <UserX className="text-orange-400 flex-shrink-0" size={16} />}
                        {blocker.type === 'on_hold' && <Pause className="text-orange-400 flex-shrink-0" size={16} />}
                        {blocker.type === 'unassigned_monteur' && <AlertCircle className="text-orange-400 flex-shrink-0" size={16} />}

                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm truncate">{blocker.project_number}</div>
                          <div className="text-xs text-gray-400 truncate">{blocker.description}</div>
                          <div className="text-xs text-orange-400 mt-1">{blocker.message}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Organization Status */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Organisatie Status</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(
                projects.reduce((acc: any, p) => {
                  acc[p.status] = (acc[p.status] || 0) + 1;
                  return acc;
                }, {})
              ).map(([status, count]) => (
                <div key={status} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <div className={`text-xs px-2 py-1 rounded ${getStatusColor(status)} text-white inline-block mb-2`}>
                    {status}
                  </div>
                  <div className="text-2xl font-bold text-white">{count as number}</div>
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
