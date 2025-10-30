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
  Building2,
  Package,
  FileText,
  LogOut,
  Activity,
  BarChart3,
  Search,
  Filter
} from 'lucide-react';
import { dataService, supabase } from '../lib/supabase';
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
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadData();
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const users = await dataService.getUsers();
        const currentUser = users.find((u: any) => u.email === user.email);
        if (currentUser) {
          setUsername(currentUser.username);
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast.success('Succesvol uitgelogd');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Fout bij uitloggen');
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
    if (statusLower.includes('afgerond') || statusLower.includes('compleet')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (statusLower.includes('levering') || statusLower.includes('verzonden')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (statusLower.includes('testen')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (statusLower.includes('productie')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (statusLower.includes('engineering')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (statusLower.includes('calculatie') || statusLower.includes('offerte')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
      <div className="flex items-center justify-center h-screen bg-[#0F1419]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Dashboard laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419] p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Top Header Bar */}
        <div className="bg-[#1A1F28] rounded-xl border border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-sm text-gray-400">Welkom terug, {username}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/create-project')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Nieuw Project
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-all border border-red-500/30"
              >
                <LogOut className="w-5 h-5" />
                Uitloggen
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#1A1F28] rounded-xl border border-gray-800 p-6 hover:border-blue-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Folder className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{projects.length}</p>
                <p className="text-sm text-gray-400 mt-1">Totaal Projecten</p>
              </div>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-3/4"></div>
            </div>
          </div>

          <div className="bg-[#1A1F28] rounded-xl border border-gray-800 p-6 hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{statusCounts['Afgerond'] || 0}</p>
                <p className="text-sm text-gray-400 mt-1">Afgerond</p>
              </div>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-2/3"></div>
            </div>
          </div>

          <div className="bg-[#1A1F28] rounded-xl border border-gray-800 p-6 hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Truck className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{todayDeliveries.length}</p>
                <p className="text-sm text-gray-400 mt-1">Levering Vandaag</p>
              </div>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500" style={{ width: `${Math.min((todayDeliveries.length / projects.length) * 100, 100)}%` }}></div>
            </div>
          </div>

          <div className="bg-[#1A1F28] rounded-xl border border-gray-800 p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{userWorkload.length}</p>
                <p className="text-sm text-gray-400 mt-1">Actieve Medewerkers</p>
              </div>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-1/2"></div>
            </div>
          </div>
        </div>

        {/* Today's Deliveries Alert */}
        {todayDeliveries.length > 0 && (
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {todayDeliveries.length} Levering{todayDeliveries.length !== 1 ? 'en' : ''} Gepland Vandaag
                </h3>
                <div className="flex flex-wrap gap-2">
                  {todayDeliveries.map(project => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="px-3 py-1.5 bg-[#1A1F28] hover:bg-[#252D3A] text-orange-400 text-sm font-medium rounded-lg border border-orange-500/30 transition-all"
                    >
                      {project.project_number}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center justify-center gap-3 bg-[#1A1F28] hover:bg-[#252D3A] border border-gray-800 hover:border-blue-500/50 rounded-xl p-4 transition-all group"
          >
            <FileText className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-white font-medium">Alle Projecten</span>
          </button>
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center justify-center gap-3 bg-[#1A1F28] hover:bg-[#252D3A] border border-gray-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all group"
          >
            <Building2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-white font-medium">Klanten</span>
          </button>
          <button
            onClick={() => navigate('/verdelers')}
            className="flex items-center justify-center gap-3 bg-[#1A1F28] hover:bg-[#252D3A] border border-gray-800 hover:border-purple-500/50 rounded-xl p-4 transition-all group"
          >
            <Package className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="text-white font-medium">Verdelers</span>
          </button>
          <button
            onClick={() => navigate('/insights')}
            className="flex items-center justify-center gap-3 bg-[#1A1F28] hover:bg-[#252D3A] border border-gray-800 hover:border-cyan-500/50 rounded-xl p-4 transition-all group"
          >
            <BarChart3 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-white font-medium">Inzichten</span>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Projects Table - 2 columns */}
          <div className="xl:col-span-2">
            <div className="bg-[#1A1F28] rounded-xl border border-gray-800">
              {/* Table Header */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <h2 className="text-xl font-bold text-white">Project Overzicht</h2>

                  <div className="relative flex-1 lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Zoek projecten..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0F1419] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Status Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedStatus('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                      selectedStatus === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#0F1419] text-gray-400 hover:text-white hover:bg-[#252D3A]'
                    }`}
                  >
                    Alle <span className="ml-1 opacity-70">({projects.length})</span>
                  </button>
                  {Object.entries(statusCounts).slice(0, 5).map(([status, count]) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                        selectedStatus === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#0F1419] text-gray-400 hover:text-white hover:bg-[#252D3A]'
                      }`}
                    >
                      {status} <span className="ml-1 opacity-70">({count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Projects List */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredProjects.length === 0 ? (
                  <div className="p-12 text-center">
                    <Folder className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">Geen projecten gevonden</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-[#0F1419] sticky top-0 z-10">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Project</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Klant</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Voortgang</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Levering</th>
                        <th className="text-right p-4 text-sm font-semibold text-gray-400">Actie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredProjects.map(project => {
                        const progress = getVerdelerProgress(project);
                        return (
                          <tr
                            key={project.id}
                            className="hover:bg-[#252D3A] transition-colors cursor-pointer"
                            onClick={() => navigate(`/projects/${project.id}`)}
                          >
                            <td className="p-4">
                              <span className="text-white font-semibold">{project.project_number}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-gray-300">{project.client || 'Geen klant'}</span>
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 text-xs font-medium rounded-md border ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                            </td>
                            <td className="p-4">
                              {progress.total > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden max-w-[100px]">
                                    <div
                                      className="h-full bg-blue-500 transition-all"
                                      style={{ width: `${progress.percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {progress.completed}/{progress.total}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">-</span>
                              )}
                            </td>
                            <td className="p-4">
                              {project.verwachte_leverdatum ? (
                                <span className="text-sm text-gray-400">
                                  {format(parseISO(project.verwachte_leverdatum), 'dd-MM-yyyy')}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-600">-</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <button className="text-blue-400 hover:text-blue-300">
                                <ChevronRight className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Team Workload Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-[#1A1F28] rounded-xl border border-gray-800">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white mb-1">Team Werkzaamheden</h2>
                <p className="text-sm text-gray-400">Huidige toewijzingen</p>
              </div>

              <div className="max-h-[600px] overflow-y-auto p-4 space-y-4">
                {userWorkload.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">Geen actieve toewijzingen</p>
                  </div>
                ) : (
                  userWorkload.map(userTask => (
                    <div key={userTask.username} className="bg-[#0F1419] rounded-lg border border-gray-800 p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {userTask.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold">{userTask.username}</p>
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
                            className="bg-[#1A1F28] hover:bg-[#252D3A] rounded-lg p-3 cursor-pointer transition-all border border-gray-800 hover:border-blue-500/50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">{project.project_number}</span>
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {project.verdelers.map((verdeler, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30"
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
    </div>
  );
};

export default AdminDashboard;
