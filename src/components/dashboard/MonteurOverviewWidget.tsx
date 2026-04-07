import React, { useMemo, useState } from 'react';
import { Users, X, FolderOpen } from 'lucide-react';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  location?: string;
  distributors?: any[];
  expected_delivery_date?: string;
}

interface MonteurOverviewWidgetProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

interface MonteurData {
  username: string;
  profilePicture?: string;
  role?: string;
  totalVerdelers: number;
  completedVerdelers: number;
  productieVerdelers: number;
  testenVerdelers: number;
  leveringVerdelers: number;
  projects: { id: string; project_number: string; client: string; verdelerCount: number }[];
}

const MonteurOverviewWidget: React.FC<MonteurOverviewWidgetProps> = ({ projects, onProjectClick }) => {
  const [selectedMonteur, setSelectedMonteur] = useState<MonteurData | null>(null);

  const monteurData = useMemo(() => {
    const monteurs: Record<string, MonteurData> = {};

    projects.forEach(project => {
      project.distributors?.forEach((d: any) => {
        const name = d.toegewezen_monteur;
        if (!name) return;

        if (!monteurs[name]) {
          monteurs[name] = {
            username: name,
            totalVerdelers: 0,
            completedVerdelers: 0,
            productieVerdelers: 0,
            testenVerdelers: 0,
            leveringVerdelers: 0,
            projects: [],
          };
        }

        const m = monteurs[name];
        const status = d.status?.toLowerCase();

        if (['opgeleverd', 'verloren'].includes(project.status?.toLowerCase() || '')) return;

        m.totalVerdelers++;

        if (status === 'productie') m.productieVerdelers++;
        if (status === 'testen') m.testenVerdelers++;
        if (status === 'levering' || status === 'gereed voor facturatie') m.leveringVerdelers++;
        if (d.is_delivered || d.is_tested || status === 'levering' || status === 'gereed voor facturatie' || status === 'opgeleverd') {
          m.completedVerdelers++;
        }

        const existingProject = m.projects.find(p => p.id === project.id);
        if (existingProject) {
          existingProject.verdelerCount++;
        } else {
          m.projects.push({
            id: project.id,
            project_number: project.project_number,
            client: project.client || '-',
            verdelerCount: 1,
          });
        }
      });
    });

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    Object.values(monteurs).forEach(m => {
      const user = users.find((u: any) => u.username === m.username);
      if (user) {
        m.profilePicture = user.profilePicture;
        m.role = user.role;
      }
    });

    return Object.values(monteurs)
      .filter(m => m.totalVerdelers > 0)
      .sort((a, b) => b.productieVerdelers - a.productieVerdelers || b.totalVerdelers - a.totalVerdelers);
  }, [projects]);

  const getLoadColor = (productie: number): string => {
    if (productie >= 8) return 'text-red-400';
    if (productie >= 5) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getLoadBg = (productie: number): string => {
    if (productie >= 8) return 'bg-red-500/10 border-red-500/20';
    if (productie >= 5) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <>
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Monteur Overzicht</h2>
              <p className="text-sm text-gray-400">{monteurData.length} monteurs actief met verdelers</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {monteurData.map((monteur) => {
            const completionPercent = monteur.totalVerdelers > 0
              ? Math.round((monteur.completedVerdelers / monteur.totalVerdelers) * 100)
              : 0;

            return (
              <div
                key={monteur.username}
                onClick={() => setSelectedMonteur(monteur)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${getLoadBg(monteur.productieVerdelers)}`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  {monteur.profilePicture ? (
                    <img
                      src={monteur.profilePicture}
                      alt={monteur.username}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-2 ring-gray-700">
                      <span className="text-xs font-bold text-white">
                        {monteur.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{monteur.username}</p>
                    <p className="text-xs text-gray-500">{monteur.projects.length} projecten</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getLoadColor(monteur.productieVerdelers)}`}>
                      {monteur.productieVerdelers}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase">Productie</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">{monteur.testenVerdelers}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Testen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-teal-400">{monteur.leveringVerdelers}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Levering</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{completionPercent}%</span>
                </div>
              </div>
            );
          })}

          {monteurData.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Geen monteurs met actieve verdelers</p>
            </div>
          )}
        </div>
      </div>

      {selectedMonteur && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
            <div className="p-6 border-b border-gray-700 bg-gradient-to-br from-blue-500/10 to-blue-600/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {selectedMonteur.profilePicture ? (
                    <img
                      src={selectedMonteur.profilePicture}
                      alt={selectedMonteur.username}
                      className="w-14 h-14 rounded-full object-cover ring-4 ring-blue-500/30"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-4 ring-blue-500/30">
                      <span className="text-xl font-bold text-white">
                        {selectedMonteur.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedMonteur.username}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-orange-400">{selectedMonteur.productieVerdelers} in productie</span>
                      <span className="text-sm text-yellow-400">{selectedMonteur.testenVerdelers} in testen</span>
                      <span className="text-sm text-teal-400">{selectedMonteur.leveringVerdelers} in levering</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMonteur(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              <h4 className="text-lg font-semibold text-white mb-4">Toegewezen Projecten</h4>
              <div className="space-y-3">
                {selectedMonteur.projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setSelectedMonteur(null);
                      onProjectClick(project.id);
                    }}
                    className="p-4 bg-[#2A303C] rounded-lg border border-gray-700 hover:border-blue-500/60 cursor-pointer transition-all hover:shadow-lg group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-blue-400 group-hover:text-blue-300">
                          {project.project_number}
                        </span>
                        <p className="text-sm text-gray-400 mt-1">{project.client}</p>
                      </div>
                      <div className="bg-blue-500/20 px-3 py-1 rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-400">{project.verdelerCount}</div>
                        <div className="text-xs text-gray-500">verdelers</div>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedMonteur.projects.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Geen projecten toegewezen</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 bg-[#2A303C] flex justify-end">
              <button
                onClick={() => setSelectedMonteur(null)}
                className="btn-secondary px-6 py-2"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MonteurOverviewWidget;
