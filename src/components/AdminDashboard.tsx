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
  User,
  Building2,
  Package,
  Activity,
  ArrowUpRight,
  Search,
  FileText
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
  const [searchTerm, setSearchTerm] = useState('');

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
    if (statusLower.includes('afgerond') || statusLower.includes('compleet')) return 'text-green-600 bg-green-50 border-green-200';
    if (statusLower.includes('levering') || statusLower.includes('verzonden')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (statusLower.includes('testen')) return 'text-purple-600 bg-purple-50 border-purple-200';
    if (statusLower.includes('productie')) return 'text-amber-600 bg-amber-50 border-amber-200';
    if (statusLower.includes('engineering')) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (statusLower.includes('calculatie') || statusLower.includes('offerte')) return 'text-cyan-600 bg-cyan-50 border-cyan-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const filteredProjects = projects.filter(p => {
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    const matchesSearch = !searchTerm ||
      p.project_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overzicht</h1>
          <p className="text-gray-400">Beheer al uw projecten, teams en leveringen op één plek</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/create-project')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
          >
            <Plus className="w-5 h-5" />
            Nieuw Project
          </button>
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all border border-gray-200"
          >
            <Building2 className="w-5 h-5" />
            Klanten
          </button>
          <button
            onClick={() => navigate('/verdelers')}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all border border-gray-200"
          >
            <Package className="w-5 h-5" />
            Verdelers
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all border border-gray-200"
          >
            <FileText className="w-5 h-5" />
            Alle Projecten
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Folder className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">+12%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{projects.length}</h3>
          <p className="text-sm text-gray-600">Totaal Projecten</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Afgerond</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {statusCounts['Afgerond'] || 0}
          </h3>
          <p className="text-sm text-gray-600">Voltooide projecten</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Truck className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-orange-600">Vandaag</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{todayDeliveries.length}</h3>
          <p className="text-sm text-gray-600">Leveringen gepland</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Actief</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{userWorkload.length}</h3>
          <p className="text-sm text-gray-600">Team leden bezig</p>
        </div>
      </div>

      {/* Today's Deliveries Alert */}
      {todayDeliveries.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {todayDeliveries.length} levering{todayDeliveries.length !== 1 ? 'en' : ''} gepland voor vandaag
              </h3>
              <div className="flex flex-wrap gap-2">
                {todayDeliveries.map(project => (
                  <button
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="px-3 py-1.5 bg-white hover:bg-orange-50 text-gray-900 text-sm font-medium rounded-lg border border-orange-200 transition-colors"
                  >
                    {project.project_number}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Projects Overview - Takes 2 columns */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-semibold text-gray-900">Alle Projecten</h2>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Zoek projecten..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedStatus('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                    selectedStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Alle ({projects.length})
                </button>
                {Object.entries(statusCounts).map(([status, count]) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                      selectedStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status} ({count})
                  </button>
                ))}
              </div>
            </div>

            {/* Projects List */}
            <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="p-12 text-center">
                  <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Geen projecten gevonden</p>
                </div>
              ) : (
                filteredProjects.map(project => {
                  const progress = getVerdelerProgress(project);
                  return (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-base font-semibold text-gray-900">
                              {project.project_number}
                            </span>
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${getStatusColor(project.status)}`}>
                              {project.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm text-gray-700 font-medium truncate">
                              {project.client || 'Geen klant'}
                            </p>
                            {project.location && (
                              <p className="text-xs text-gray-500">📍 {project.location}</p>
                            )}
                            {project.verwachte_leverdatum && (
                              <p className="text-xs text-gray-500">
                                📅 Verwacht: {format(parseISO(project.verwachte_leverdatum), 'dd-MM-yyyy')}
                              </p>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {progress.total > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span className="font-medium">Verdelers: {progress.completed} / {progress.total}</span>
                                <span>{progress.percentage}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 transition-all duration-300"
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Team Workload Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Team Werkzaamheden</h2>
              <p className="text-sm text-gray-600 mt-1">Huidige toewijzingen</p>
            </div>

            <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
              {userWorkload.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Geen actieve toewijzingen</p>
                </div>
              ) : (
                userWorkload.map(userTask => (
                  <div key={userTask.username} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {userTask.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{userTask.username}</p>
                        <p className="text-xs text-gray-600">
                          {userTask.projectCount} project{userTask.projectCount !== 1 ? 'en' : ''} · {userTask.verdelerCount} verdeler{userTask.verdelerCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 ml-13">
                      {userTask.projects.map(project => (
                        <div
                          key={project.project_id}
                          onClick={() => navigate(`/projects/${project.project_id}`)}
                          className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{project.project_number}</span>
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {project.verdelers.map((verdeler, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium"
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
