import React, { useMemo, useState } from 'react';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  location?: string;
  distributors?: any[];
  expected_delivery_date?: string;
  created_at: string;
}

interface ProjectProgressionWidgetProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

const STATUS_ORDER = ['Intake', 'Offerte', 'Werkvoorbereiding', 'Productie', 'Testen', 'Levering', 'Gereed voor facturatie', 'Opgeleverd'];

const getProgressPercent = (status: string): number => {
  const index = STATUS_ORDER.findIndex(s => s.toLowerCase() === status?.toLowerCase());
  if (index === -1) return 0;
  return Math.round(((index + 1) / STATUS_ORDER.length) * 100);
};

const getProgressColor = (percent: number, daysUntil: number | null): string => {
  if (daysUntil !== null && daysUntil < 0) return 'bg-red-500';
  if (daysUntil !== null && daysUntil <= 3) return 'bg-amber-500';
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 50) return 'bg-blue-500';
  return 'bg-sky-500';
};

const getDeliveryBadge = (daysUntil: number | null) => {
  if (daysUntil === null) return null;
  if (daysUntil < 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
        {Math.abs(daysUntil)}d te laat
      </span>
    );
  }
  if (daysUntil === 0) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium animate-pulse">
        Vandaag
      </span>
    );
  }
  if (daysUntil <= 3) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
        {daysUntil}d
      </span>
    );
  }
  if (daysUntil <= 7) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
        {daysUntil}d
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
      {daysUntil}d
    </span>
  );
};

const ProjectProgressionWidget: React.FC<ProjectProgressionWidgetProps> = ({ projects, onProjectClick }) => {
  const [expanded, setExpanded] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const activeProjects = useMemo(() => {
    return projects
      .filter(p => {
        const s = p.status?.toLowerCase();
        return s && !['opgeleverd', 'verloren'].includes(s);
      })
      .map(p => {
        const deliveryDate = p.expected_delivery_date ? new Date(p.expected_delivery_date) : null;
        if (deliveryDate) deliveryDate.setHours(0, 0, 0, 0);
        const daysUntil = deliveryDate
          ? Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const totalVerdelers = p.distributors?.length || 0;
        const completedVerdelers = p.distributors?.filter((d: any) => {
          const s = d.status?.toLowerCase();
          return s === 'levering' || s === 'gereed voor facturatie' || s === 'opgeleverd' || d.is_delivered || d.is_tested;
        }).length || 0;

        const verdelerProgress = totalVerdelers > 0 ? Math.round((completedVerdelers / totalVerdelers) * 100) : 0;

        return {
          ...p,
          progress: getProgressPercent(p.status),
          daysUntil,
          deliveryDate,
          totalVerdelers,
          completedVerdelers,
          verdelerProgress,
        };
      })
      .sort((a, b) => {
        if (a.daysUntil !== null && b.daysUntil !== null) {
          return a.daysUntil - b.daysUntil;
        }
        if (a.daysUntil !== null) return -1;
        if (b.daysUntil !== null) return 1;
        return b.progress - a.progress;
      });
  }, [projects, today]);

  const visibleProjects = expanded ? activeProjects : activeProjects.slice(0, 8);

  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <Activity size={20} className="text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Project Voortgang</h2>
            <p className="text-sm text-gray-400">{activeProjects.length} actieve projecten gesorteerd op urgentie</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Te laat</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span>Binnenkort</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span>Op schema</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Klant</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Voortgang</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Verdelers</th>
              <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Leverdatum</th>
            </tr>
          </thead>
          <tbody>
            {visibleProjects.map((project) => (
              <tr
                key={project.id}
                onClick={() => onProjectClick(project.id)}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors group"
              >
                <td className="py-3 px-3">
                  <span className="font-medium text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
                    {project.project_number}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-sm text-gray-300 truncate block max-w-[150px]">{project.client || '-'}</span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-xs text-gray-400">{project.status}</span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getProgressColor(project.progress, project.daysUntil)}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-9 text-right">{project.progress}%</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-1">
                      {Array.from({ length: Math.min(project.totalVerdelers, 5) }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full border border-gray-900 ${
                            i < project.completedVerdelers ? 'bg-emerald-500' : 'bg-gray-600'
                          }`}
                        />
                      ))}
                      {project.totalVerdelers > 5 && (
                        <div className="w-4 h-4 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center">
                          <span className="text-[8px] text-gray-400">+{project.totalVerdelers - 5}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {project.completedVerdelers}/{project.totalVerdelers}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right">
                  {project.deliveryDate ? (
                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-xs text-gray-400">
                        {project.deliveryDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                      </span>
                      {getDeliveryBadge(project.daysUntil)}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeProjects.length > 8 && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-1 text-sm text-gray-400 hover:text-blue-400 transition-colors py-2 px-4 rounded-lg hover:bg-gray-800/50"
          >
            {expanded ? (
              <>
                <ChevronUp size={16} />
                <span>Toon minder</span>
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                <span>Toon alle {activeProjects.length} projecten</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectProgressionWidget;
