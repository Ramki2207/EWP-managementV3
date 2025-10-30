import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Users,
  Folder,
  ChevronRight,
  Calendar,
  User
} from 'lucide-react';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format, isToday, parseISO } from 'date-fns';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  location?: string;
  description?: string;
  verwachte_leverdatum?: string;
  distributors?: any[];
  created_at: string;
}

interface UserTask {
  username: string;
  projectCount: number;
  verdelerCount: number;
  projects: Array<{
    project_number: string;
    project_id: string;
    verdelers: string[];
  }>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, usersData] = await Promise.all([
        dataService.getProjects(),
        dataService.getUsers()
      ]);

      setProjects(projectsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      toast.error('Fout bij laden dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts: { [key: string]: number } = {};
    projects.forEach(p => {
      const status = p.status || 'Onbekend';
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  };

  const getTodayDeliveries = () => {
    return projects.filter(p => {
      if (!p.verwachte_leverdatum) return false;
      try {
        return isToday(parseISO(p.verwachte_leverdatum));
      } catch {
        return false;
      }
    });
  };

  const getUserWorkload = (): UserTask[] => {
    const workloadMap: { [key: string]: UserTask } = {};

    projects.forEach(project => {
      project.distributors?.forEach(dist => {
        const monteur = dist.toegewezen_monteur;
        if (monteur) {
          if (!workloadMap[monteur]) {
            workloadMap[monteur] = {
              username: monteur,
              projectCount: 0,
              verdelerCount: 0,
              projects: []
            };
          }

          const existingProject = workloadMap[monteur].projects.find(
            p => p.project_id === project.id
          );

          if (existingProject) {
            existingProject.verdelers.push(dist.distributor_id || dist.kast_naam);
          } else {
            workloadMap[monteur].projects.push({
              project_number: project.project_number,
              project_id: project.id,
              verdelers: [dist.distributor_id || dist.kast_naam]
            });
            workloadMap[monteur].projectCount++;
          }
          workloadMap[monteur].verdelerCount++;
        }
      });
    });

    return Object.values(workloadMap).sort((a, b) => b.verdelerCount - a.verdelerCount);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('afgerond') || statusLower.includes('compleet')) return 'bg-green-500';
    if (statusLower.includes('levering') || statusLower.includes('verzonden')) return 'bg-blue-500';
    if (statusLower.includes('testen')) return 'bg-purple-500';
    if (statusLower.includes('productie')) return 'bg-yellow-500';
    if (statusLower.includes('engineering')) return 'bg-orange-500';
    if (statusLower.includes('calculatie') || statusLower.includes('offerte')) return 'bg-cyan-500';
    return 'bg-gray-500';
  };

  const getVerdelerProgress = (project: Project) => {
    if (!project.distributors || project.distributors.length === 0) return { total: 0, completed: 0, percentage: 0 };

    const total = project.distributors.length;
    const completed = project.distributors.filter(d => d.status?.toLowerCase() === 'compleet').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  };

  const statusCounts = getStatusCounts();
  const todayDeliveries = getTodayDeliveries();
  const userWorkload = getUserWorkload();
  const filteredProjects = selectedStatus === 'all'
    ? projects
    : projects.filter(p => p.status === selectedStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Volledig overzicht van alle projecten en activiteiten</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/create-project')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nieuw Project
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 px-4 py-2 bg-[#2A303C] text-white rounded-lg hover:bg-[#1E2530] transition-all"
          >
            <Folder className="w-5 h-5" />
            Alle Projecten
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Totaal Projecten</p>
              <p className="text-3xl font-bold mt-1">{projects.length}</p>
            </div>
            <Folder className="w-12 h-12 opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Afgerond</p>
              <p className="text-3xl font-bold mt-1">
                {statusCounts['Afgerond'] || 0}
              </p>
            </div>
            <CheckCircle2 className="w-12 h-12 opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Levering Vandaag</p>
              <p className="text-3xl font-bold mt-1">{todayDeliveries.length}</p>
            </div>
            <Truck className="w-12 h-12 opacity-20" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Actieve Gebruikers</p>
              <p className="text-3xl font-bold mt-1">{userWorkload.length}</p>
            </div>
            <Users className="w-12 h-12 opacity-20" />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Project Overview (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Deliveries */}
          {todayDeliveries.length > 0 && (
            <div className="bg-[#2A303C] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-orange-400" />
                <h2 className="text-xl font-semibold text-white">Leveringen Vandaag</h2>
                <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  {todayDeliveries.length}
                </span>
              </div>
              <div className="space-y-3">
                {todayDeliveries.map(project => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="bg-[#1E2530] rounded-lg p-4 hover:bg-[#252D3A] cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-white">{project.project_number}</span>
                          <span className={`${getStatusColor(project.status)} text-white text-xs px-2 py-1 rounded`}>
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{project.client || 'Geen klant'}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Status Overview */}
          <div className="bg-[#2A303C] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Project Overzicht</h2>
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-3 py-1 text-sm rounded-lg transition-all whitespace-nowrap ${
                    selectedStatus === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#1E2530] text-gray-400 hover:bg-[#252D3A]'
                  }`}
                >
                  Alle ({projects.length})
                </button>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1 text-sm rounded-lg transition-all whitespace-nowrap ${
                      selectedStatus === status
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#1E2530] text-gray-400 hover:bg-[#252D3A]'
                    }`}
                  >
                    {status} ({count})
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredProjects.map(project => {
                const progress = getVerdelerProgress(project);
                return (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="bg-[#1E2530] rounded-lg p-4 hover:bg-[#252D3A] cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-white">{project.project_number}</span>
                          <span className={`${getStatusColor(project.status)} text-white text-xs px-2 py-1 rounded`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-300">{project.client || 'Geen klant'}</p>
                          {project.location && (
                            <p className="text-xs text-gray-400">📍 {project.location}</p>
                          )}
                          {project.verwachte_leverdatum && (
                            <p className="text-xs text-gray-400">
                              📅 Verwacht: {format(parseISO(project.verwachte_leverdatum), 'dd-MM-yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" />
                    </div>

                    {/* Verdeler Progress */}
                    {progress.total > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Verdelers: {progress.completed} / {progress.total}</span>
                          <span>{progress.percentage}%</span>
                        </div>
                        <div className="h-2 bg-[#0F1419] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - User Workload (1 column) */}
        <div className="space-y-6">
          <div className="bg-[#2A303C] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Team Werkzaamheden</h2>
            </div>

            <div className="space-y-3 max-h-[800px] overflow-y-auto">
              {userWorkload.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Geen toegewezen werkzaamheden
                </p>
              ) : (
                userWorkload.map(userTask => (
                  <div
                    key={userTask.username}
                    className="bg-[#1E2530] rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {userTask.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{userTask.username}</p>
                        <p className="text-xs text-gray-400">
                          {userTask.projectCount} project{userTask.projectCount !== 1 ? 'en' : ''} · {userTask.verdelerCount} verdeler{userTask.verdelerCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {userTask.projects.map(project => (
                        <div
                          key={project.project_id}
                          onClick={() => navigate(`/projects/${project.project_id}`)}
                          className="bg-[#0F1419] rounded p-3 hover:bg-[#1A1F28] cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-white font-medium">{project.project_number}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {project.verdelers.map((verdeler, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded"
                              >
                                {verdeler}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
