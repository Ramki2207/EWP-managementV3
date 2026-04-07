import React, { useMemo, useState } from 'react';
import { LayoutGrid, ArrowRight, ChevronDown, ChevronUp, CircleDot, UserX, ShieldAlert } from 'lucide-react';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  location?: string;
  distributors?: any[];
  expected_delivery_date?: string;
}

interface ProjectOverviewWidgetProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

type HealthStatus = 'on_track' | 'at_risk' | 'delayed';

const STATUS_ORDER = [
  'Intake', 'Offerte', 'Werkvoorbereiding', 'Productie', 'Testen', 'Levering', 'Gereed voor facturatie', 'Opgeleverd',
];

interface EnrichedProject {
  project: Project;
  health: HealthStatus;
  progressPercent: number;
  daysUntil: number | null;
  totalVerdelers: number;
  openVerdelers: number;
  unassignedVerdelers: number;
  blockedVerdelers: number;
}

const getHealthLabel = (health: HealthStatus) => {
  switch (health) {
    case 'on_track': return 'Op schema';
    case 'at_risk': return 'Risico';
    case 'delayed': return 'Vertraagd';
  }
};

const getHealthStyles = (health: HealthStatus) => {
  switch (health) {
    case 'on_track': return { dot: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    case 'at_risk': return { dot: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' };
    case 'delayed': return { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' };
  }
};

const getProgressBarColor = (health: HealthStatus) => {
  switch (health) {
    case 'on_track': return 'bg-emerald-500';
    case 'at_risk': return 'bg-amber-500';
    case 'delayed': return 'bg-red-500';
  }
};

const ProjectOverviewWidget: React.FC<ProjectOverviewWidgetProps> = ({ projects, onProjectClick }) => {
  const [showAll, setShowAll] = useState(false);
  const [filterHealth, setFilterHealth] = useState<HealthStatus | 'all'>('all');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const enrichedProjects = useMemo((): EnrichedProject[] => {
    return projects
      .filter(p => {
        const s = p.status?.toLowerCase();
        return s && !['opgeleverd', 'verloren'].includes(s);
      })
      .map(p => {
        const statusIndex = STATUS_ORDER.findIndex(s => s.toLowerCase() === p.status?.toLowerCase());
        const progressPercent = statusIndex >= 0 ? Math.round(((statusIndex + 1) / STATUS_ORDER.length) * 100) : 0;

        const deadline = p.expected_delivery_date ? new Date(p.expected_delivery_date) : null;
        if (deadline) deadline.setHours(0, 0, 0, 0);
        const daysUntil = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / 86400000) : null;

        const totalVerdelers = p.distributors?.length || 0;
        const openVerdelers = p.distributors?.filter((d: any) => {
          const ds = d.status?.toLowerCase();
          return ds && !['opgeleverd', 'gereed voor facturatie'].includes(ds);
        }).length || 0;
        const unassignedVerdelers = p.distributors?.filter((d: any) => {
          const ds = d.status?.toLowerCase();
          if (!ds || ['opgeleverd', 'gereed voor facturatie', 'levering'].includes(ds)) return false;
          return !d.toegewezen_monteur || d.toegewezen_monteur.trim() === '';
        }).length || 0;
        const blockedVerdelers = p.distributors?.filter((d: any) => {
          return d.status?.toLowerCase() === 'testen' && !d.is_tested;
        }).length || 0;

        let health: HealthStatus = 'on_track';
        if (daysUntil !== null) {
          if (daysUntil < 0) {
            health = 'delayed';
          } else if (daysUntil <= 5) {
            const s = p.status?.toLowerCase();
            if (s && ['intake', 'offerte', 'werkvoorbereiding'].includes(s)) {
              health = 'delayed';
            } else if (daysUntil <= 2) {
              health = 'at_risk';
            } else if (s === 'productie' && totalVerdelers > 3) {
              health = 'at_risk';
            }
          }
        }
        if (unassignedVerdelers > 0 && openVerdelers > 0) {
          if (health === 'on_track') health = 'at_risk';
        }

        return {
          project: p,
          health,
          progressPercent,
          daysUntil,
          totalVerdelers,
          openVerdelers,
          unassignedVerdelers,
          blockedVerdelers,
        };
      })
      .sort((a, b) => {
        const healthOrder: Record<HealthStatus, number> = { delayed: 0, at_risk: 1, on_track: 2 };
        const hDiff = healthOrder[a.health] - healthOrder[b.health];
        if (hDiff !== 0) return hDiff;
        if (a.daysUntil !== null && b.daysUntil !== null) return a.daysUntil - b.daysUntil;
        if (a.daysUntil !== null) return -1;
        if (b.daysUntil !== null) return 1;
        return 0;
      });
  }, [projects, today]);

  const healthCounts = useMemo(() => {
    return {
      delayed: enrichedProjects.filter(p => p.health === 'delayed').length,
      at_risk: enrichedProjects.filter(p => p.health === 'at_risk').length,
      on_track: enrichedProjects.filter(p => p.health === 'on_track').length,
    };
  }, [enrichedProjects]);

  const filteredProjects = filterHealth === 'all'
    ? enrichedProjects
    : enrichedProjects.filter(p => p.health === filterHealth);

  const visibleProjects = showAll ? filteredProjects : filteredProjects.slice(0, 10);

  const totalUnassigned = enrichedProjects.reduce((sum, p) => sum + p.unassignedVerdelers, 0);
  const totalBlocked = enrichedProjects.reduce((sum, p) => sum + p.blockedVerdelers, 0);

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <LayoutGrid size={20} className="text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Project Overzicht</h2>
            <p className="text-xs text-gray-500">{enrichedProjects.length} actieve projecten</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        {[
          { key: 'all' as const, label: 'Alles', count: enrichedProjects.length },
          { key: 'delayed' as const, label: 'Vertraagd', count: healthCounts.delayed },
          { key: 'at_risk' as const, label: 'Risico', count: healthCounts.at_risk },
          { key: 'on_track' as const, label: 'Op schema', count: healthCounts.on_track },
        ].map(tab => {
          const isActive = filterHealth === tab.key;
          const styles = tab.key === 'all'
            ? { active: 'bg-gray-700 text-white', inactive: 'text-gray-400 hover:text-white hover:bg-gray-800' }
            : tab.key === 'delayed'
            ? { active: 'bg-red-500/20 text-red-400', inactive: 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' }
            : tab.key === 'at_risk'
            ? { active: 'bg-amber-500/20 text-amber-400', inactive: 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10' }
            : { active: 'bg-emerald-500/20 text-emerald-400', inactive: 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10' };

          return (
            <button
              key={tab.key}
              onClick={() => setFilterHealth(tab.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${isActive ? styles.active : styles.inactive}`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {(totalUnassigned > 0 || totalBlocked > 0) && (
        <div className="flex items-center space-x-4 mb-4 p-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
          {totalUnassigned > 0 && (
            <div className="flex items-center space-x-1.5 text-xs text-amber-400">
              <UserX size={13} />
              <span>{totalUnassigned} zonder eigenaar</span>
            </div>
          )}
          {totalBlocked > 0 && (
            <div className="flex items-center space-x-1.5 text-xs text-orange-400">
              <ShieldAlert size={13} />
              <span>{totalBlocked} wachtend op test</span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1 max-h-[520px]">
        <div className="space-y-2">
          {visibleProjects.map(ep => {
            const healthStyle = getHealthStyles(ep.health);
            return (
              <div
                key={ep.project.id}
                onClick={() => onProjectClick(ep.project.id)}
                className="p-3 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-900/20 hover:bg-gray-800/40 cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-0.5">
                      <span className="text-sm font-medium text-blue-400 group-hover:text-blue-300">
                        {ep.project.project_number}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${healthStyle.bg} ${healthStyle.text}`}>
                        {getHealthLabel(ep.health)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{ep.project.client || '-'}</p>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    {ep.daysUntil !== null && (
                      <span className={`text-xs font-medium ${
                        ep.daysUntil < 0 ? 'text-red-400' :
                        ep.daysUntil <= 3 ? 'text-amber-400' : 'text-gray-500'
                      }`}>
                        {ep.daysUntil < 0
                          ? `${Math.abs(ep.daysUntil)}d te laat`
                          : ep.daysUntil === 0
                          ? 'Vandaag'
                          : `${ep.daysUntil}d`
                        }
                      </span>
                    )}
                    <ArrowRight size={13} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(ep.health)}`}
                      style={{ width: `${ep.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 w-8 text-right">{ep.progressPercent}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] text-gray-500">
                      <span className="text-gray-400 font-medium">{ep.project.status}</span>
                    </span>
                    {ep.totalVerdelers > 0 && (
                      <span className="text-[10px] text-gray-500">
                        {ep.openVerdelers}/{ep.totalVerdelers} open
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {ep.unassignedVerdelers > 0 && (
                      <span className="text-[10px] text-amber-400 flex items-center space-x-0.5">
                        <UserX size={10} />
                        <span>{ep.unassignedVerdelers}</span>
                      </span>
                    )}
                    {ep.blockedVerdelers > 0 && (
                      <span className="text-[10px] text-orange-400 flex items-center space-x-0.5">
                        <ShieldAlert size={10} />
                        <span>{ep.blockedVerdelers}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="py-12 text-center">
              <CircleDot size={32} className="mx-auto text-gray-700 mb-2" />
              <p className="text-sm text-gray-500">Geen projecten in deze categorie</p>
            </div>
          )}
        </div>
      </div>

      {filteredProjects.length > 10 && (
        <div className="pt-3 border-t border-gray-800 mt-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center justify-center space-x-1 text-xs text-gray-400 hover:text-blue-400 transition-colors w-full py-1"
          >
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showAll ? 'Toon minder' : `Toon alle ${filteredProjects.length} projecten`}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectOverviewWidget;
