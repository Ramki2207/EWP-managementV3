import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Archive, Search, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { dataService } from '../lib/supabase';
import { canArchiveProjects } from '../types/userRoles';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { useLocationFilter } from '../contexts/LocationFilterContext';

interface AfgerondProject {
  id: string;
  project_number: string;
  client?: string | null;
  location?: string | null;
  description?: string | null;
  afgerond_at: string;
  afgerond_by?: string | null;
  distributors?: { id: string }[];
}

const Historie = () => {
  const navigate = useNavigate();
  const { currentUser } = useEnhancedPermissions();
  const { isLocationVisible } = useLocationFilter();
  const [projects, setProjects] = useState<AfgerondProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const usersMap = useMemo(() => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const map: Record<string, string> = {};
    users.forEach((u: any) => { map[u.id] = u.name || u.username; });
    return map;
  }, []);

  const allowed = canArchiveProjects(currentUser?.username);

  useEffect(() => {
    if (!allowed) return;
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const data = await dataService.getAfgerondeProjects();
        setProjects(data as AfgerondProject[]);
      } catch (error) {
        console.error('Error loading historie:', error);
        setLoadError(true);
        toast.error('Historie kon niet worden geladen');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [allowed]);

  if (currentUser && !allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  const term = searchTerm.toLowerCase();
  const visibleProjects = projects.filter(p => {
    if (!isLocationVisible(p.location || undefined)) return false;
    if (!term) return true;
    return (
      p.project_number.toLowerCase().includes(term) ||
      (p.client || '').toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      <Toaster position="top-right" />

      <div className="card mb-6 md:mb-8">
        <div className="card-header">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-green-500/20">
              <Archive size={24} className="text-green-400" />
            </div>
            <div>
              <h1 className="page-title text-white mb-1">Historie</h1>
              <p className="text-gray-400 text-sm md:text-base">Afgeronde en opgeleverde projecten</p>
            </div>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Zoek op projectnummer, klant, locatie..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Historie laden...</span>
          </div>
        ) : loadError ? (
          <div className="text-center py-12 text-red-400">Historie kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.</div>
        ) : (
          <div className="table-container max-h-[70vh] overflow-y-auto pr-2 md:pr-4">
            <table className="table-wrapper">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="table-header text-left">Projectnummer</th>
                  <th className="table-header text-left">Klant</th>
                  <th className="table-header text-left">Locatie</th>
                  <th className="table-header text-left">Verdelers</th>
                  <th className="table-header text-left">Omschrijving</th>
                  <th className="table-header text-left">Afgerond op</th>
                  <th className="table-header text-left">Afgerond door</th>
                </tr>
              </thead>
              <tbody>
                {visibleProjects.map(project => (
                  <tr
                    key={project.id}
                    className="table-row cursor-pointer hover:bg-green-500/5"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <td className="table-cell">
                      <span className="font-medium text-blue-400">{project.project_number}</span>
                    </td>
                    <td className="table-cell text-gray-300">{project.client || '-'}</td>
                    <td className="table-cell text-gray-300">{project.location || '-'}</td>
                    <td className="table-cell text-gray-300">{project.distributors?.length || 0}</td>
                    <td className="table-cell max-w-xs">
                      <p className="text-sm text-gray-300 truncate" title={project.description || ''}>
                        {project.description || '-'}
                      </p>
                    </td>
                    <td className="table-cell text-gray-300">
                      {new Date(project.afgerond_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="table-cell text-gray-300">
                      {project.afgerond_by ? (usersMap[project.afgerond_by] || '-') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visibleProjects.length === 0 && (
              <div className="text-center py-12">
                <Archive size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">Geen afgeronde projecten gevonden</p>
                <p className="text-gray-500 text-sm mt-2">
                  Selecteer projecten op de Projecten pagina en klik op Afronden om ze hier te plaatsen
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Historie;
