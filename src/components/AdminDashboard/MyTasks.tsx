import React, { useState, useMemo } from 'react';
import { FolderOpen, ChevronRight, Calendar, Users, CheckCircle2, Search } from 'lucide-react';
import MyProjectDetailModal from './MyProjectDetailModal';

const PROJECT_STATUSES = [
  'Intake', 'Offerte', 'Order', 'Werkvoorbereiding',
  'Productie', 'Testen', 'Levering', 'Gereed voor facturatie', 'Opgeleverd'
];

const statusColors: Record<string, string> = {
  'Intake': 'bg-gray-500',
  'Offerte': 'bg-blue-500',
  'Order': 'bg-cyan-500',
  'Werkvoorbereiding': 'bg-teal-500',
  'Productie': 'bg-amber-500',
  'Testen': 'bg-orange-500',
  'Levering': 'bg-emerald-500',
  'Gereed voor facturatie': 'bg-green-500',
  'Opgeleverd': 'bg-green-600',
};

const statusTextColors: Record<string, string> = {
  'Intake': 'text-gray-400',
  'Offerte': 'text-blue-400',
  'Order': 'text-cyan-400',
  'Werkvoorbereiding': 'text-teal-400',
  'Productie': 'text-amber-400',
  'Testen': 'text-orange-400',
  'Levering': 'text-emerald-400',
  'Gereed voor facturatie': 'text-green-400',
  'Opgeleverd': 'text-green-500',
};

export interface MyTasksProject {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  expected_delivery_date?: string;
  description?: string;
  project_naam?: string;
  created_by?: string;
  location?: string;
  contact_person?: string;
  contactpersoon_voornaam?: string;
  contactpersoon_achternaam?: string;
  contactpersoon_telefoon?: string;
  contactpersoon_email?: string;
  referentie_ewp?: string;
  referentie_klant?: string;
  aflever_adres?: string;
  distributors?: any[];
}

interface MyTasksProps {
  projects: MyTasksProject[];
  userId: string;
}

type StatusFilter = 'all' | 'active' | 'completed';

const MyTasks: React.FC<MyTasksProps> = ({ projects, userId }) => {
  const [selectedProject, setSelectedProject] = useState<MyTasksProject | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const myProjects = useMemo(() => {
    return projects.filter(p => p.created_by === userId);
  }, [projects, userId]);

  const filteredProjects = useMemo(() => {
    let result = myProjects;

    if (statusFilter === 'active') {
      result = result.filter(p => p.status !== 'Opgeleverd');
    } else if (statusFilter === 'completed') {
      result = result.filter(p => p.status === 'Opgeleverd');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.project_number?.toLowerCase().includes(q) ||
        p.client?.toLowerCase().includes(q) ||
        p.project_naam?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [myProjects, statusFilter, searchQuery]);

  const getStatusIndex = (status: string) => PROJECT_STATUSES.indexOf(status);

  const getVerdelerSummary = (distributors: any[] | undefined) => {
    if (!distributors || distributors.length === 0) return { total: 0, completed: 0, text: 'Geen verdelers' };
    const completed = distributors.filter(
      (d: any) => d.status === 'Opgeleverd' || d.is_delivered || d.is_closed
    ).length;
    return { total: distributors.length, completed, text: `${completed}/${distributors.length} gereed` };
  };

  const getDeliveryInfo = (date: string | undefined) => {
    if (!date) return null;
    const delivery = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    delivery.setHours(0, 0, 0, 0);
    const diff = Math.ceil((delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { text: `${Math.abs(diff)}d verlopen`, color: 'text-red-400' };
    if (diff === 0) return { text: 'Vandaag', color: 'text-amber-400' };
    if (diff <= 7) return { text: `${diff}d`, color: 'text-amber-400' };
    return { text: new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }), color: 'text-gray-400' };
  };

  const activeCount = myProjects.filter(p => p.status !== 'Opgeleverd').length;
  const completedCount = myProjects.filter(p => p.status === 'Opgeleverd').length;

  return (
    <>
      <div className="card h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">Mijn Taken</h3>
            <p className="text-xs text-gray-400">
              {activeCount} actief{completedCount > 0 ? ` / ${completedCount} opgeleverd` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#1a1f2b] rounded-lg p-0.5">
            {([
              { key: 'active' as StatusFilter, label: 'Actief' },
              { key: 'completed' as StatusFilter, label: 'Gereed' },
              { key: 'all' as StatusFilter, label: 'Alles' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === key
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-3 flex-shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Zoek op project, klant..."
            className="w-full bg-[#161b24] border border-gray-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-2">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen size={32} className="mx-auto text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">
                {myProjects.length === 0
                  ? 'Geen projecten aangemaakt'
                  : 'Geen projecten gevonden'}
              </p>
            </div>
          ) : (
            filteredProjects.map(project => {
              const statusIdx = getStatusIndex(project.status);
              const verdeler = getVerdelerSummary(project.distributors);
              const deliveryInfo = getDeliveryInfo(project.expected_delivery_date);
              const isCompleted = project.status === 'Opgeleverd';

              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`group p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                    isCompleted
                      ? 'border-green-500/20 bg-green-500/5 opacity-70 hover:opacity-100'
                      : 'border-gray-700/50 bg-[#1E2530]/50 hover:border-gray-600/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {project.project_number}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[project.status] || 'bg-gray-500'} bg-opacity-20 ${statusTextColors[project.status] || 'text-gray-400'}`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {project.client || 'Geen klant'}
                        {project.project_naam ? ` - ${project.project_naam}` : ''}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-0.5 transition-colors" />
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    {PROJECT_STATUSES.map((s, i) => (
                      <div
                        key={s}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= statusIdx
                            ? statusColors[project.status] || 'bg-gray-500'
                            : 'bg-gray-700/50'
                        }`}
                        title={s}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Users size={12} />
                      <span>{verdeler.text}</span>
                    </div>
                    {verdeler.total > 0 && (
                      <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500/60 rounded-full transition-all"
                          style={{ width: `${verdeler.total > 0 ? (verdeler.completed / verdeler.total) * 100 : 0}%` }}
                        />
                      </div>
                    )}
                    {deliveryInfo && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Calendar size={11} className={deliveryInfo.color} />
                        <span className={deliveryInfo.color}>{deliveryInfo.text}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedProject && (
        <MyProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
};

export default MyTasks;
