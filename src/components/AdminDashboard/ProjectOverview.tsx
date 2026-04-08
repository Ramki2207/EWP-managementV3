import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, ArrowRight } from 'lucide-react';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  expected_delivery_date?: string;
  description?: string;
  project_naam?: string;
  distributors?: any[];
}

interface ProjectOverviewProps {
  projects: Project[];
}

type HealthStatus = 'on_track' | 'at_risk' | 'delayed';

interface ProjectSummary {
  project: Project;
  progress: number;
  health: HealthStatus;
  totalDistributors: number;
  completedDistributors: number;
  openTasks: number;
}

const healthConfig: Record<HealthStatus, { label: string; color: string; bg: string; dot: string }> = {
  on_track: { label: 'Op schema', color: 'text-green-400', bg: 'bg-green-500/20', dot: 'bg-green-400' },
  at_risk: { label: 'Risico', color: 'text-amber-400', bg: 'bg-amber-500/20', dot: 'bg-amber-400' },
  delayed: { label: 'Vertraagd', color: 'text-red-400', bg: 'bg-red-500/20', dot: 'bg-red-400' },
};

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projects }) => {
  const navigate = useNavigate();

  const getProjectSummaries = (): ProjectSummary[] => {
    const activeStatuses = ['Offerte', 'Productie', 'Testen', 'Levering'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return projects
      .filter(p => activeStatuses.includes(p.status))
      .map(project => {
        const totalDistributors = project.distributors?.length || 0;
        const completedDistributors = project.distributors?.filter(
          (d: any) => d.is_delivered || d.status === 'Opgeleverd' || d.is_closed
        ).length || 0;

        const progress = totalDistributors > 0
          ? Math.round((completedDistributors / totalDistributors) * 100)
          : 0;

        const openTasks = project.distributors?.filter(
          (d: any) => !d.is_delivered && d.status !== 'Opgeleverd' && !d.is_closed
        ).length || 0;

        let health: HealthStatus = 'on_track';
        if (project.expected_delivery_date) {
          const deliveryDate = new Date(project.expected_delivery_date);
          deliveryDate.setHours(0, 0, 0, 0);
          const daysLeft = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysLeft < 0) {
            health = 'delayed';
          } else if (daysLeft <= 7 && progress < 70) {
            health = 'at_risk';
          } else if (daysLeft <= 14 && progress < 40) {
            health = 'at_risk';
          }
        }

        const unassigned = project.distributors?.some(
          (d: any) => !d.toegewezen_monteur && !['Opgeleverd'].includes(d.status || '')
        );
        if (unassigned && health === 'on_track') {
          health = 'at_risk';
        }

        return { project, progress, health, totalDistributors, completedDistributors, openTasks };
      })
      .sort((a, b) => {
        const healthPriority = { delayed: 0, at_risk: 1, on_track: 2 };
        return healthPriority[a.health] - healthPriority[b.health];
      });
  };

  const summaries = getProjectSummaries();

  const statusCounts = {
    on_track: summaries.filter(s => s.health === 'on_track').length,
    at_risk: summaries.filter(s => s.health === 'at_risk').length,
    delayed: summaries.filter(s => s.health === 'delayed').length,
  };

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Projectoverzicht</h3>
          <p className="text-xs text-gray-400">{summaries.length} actieve projecten</p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Bekijk alles <ArrowRight size={14} />
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        {Object.entries(statusCounts).map(([key, count]) => {
          const config = healthConfig[key as HealthStatus];
          return (
            <div key={key} className={`flex-1 px-3 py-2 rounded-lg ${config.bg} text-center`}>
              <p className={`text-lg font-bold ${config.color}`}>{count}</p>
              <p className={`text-xs ${config.color} opacity-80`}>{config.label}</p>
            </div>
          );
        })}
      </div>

      <div className="overflow-y-auto max-h-[430px] pr-1 space-y-2 custom-scrollbar">
        {summaries.length === 0 ? (
          <div className="text-center py-8">
            <Folder size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">Geen actieve projecten</p>
          </div>
        ) : (
          summaries.map(({ project, progress, health, totalDistributors, completedDistributors, openTasks }) => {
            const config = healthConfig[health];
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="p-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 bg-[#1E2530]/50 cursor-pointer transition-all hover:scale-[1.01] group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">
                        {project.project_number}
                      </p>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {project.client || 'Geen klant'}
                      {project.project_naam ? ` - ${project.project_naam}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Voortgang</span>
                    <span className="text-gray-300 font-medium">{completedDistributors}/{totalDistributors}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        health === 'delayed' ? 'bg-red-500' :
                        health === 'at_risk' ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.max(progress, 2)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {project.expected_delivery_date
                      ? `Levering: ${new Date(project.expected_delivery_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`
                      : 'Geen leverdatum'}
                  </span>
                  <span className="text-gray-500">
                    {openTasks} open verdeler{openTasks !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;
