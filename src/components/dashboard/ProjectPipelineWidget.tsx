import React, { useMemo } from 'react';
import { ChevronRight, TrendingUp } from 'lucide-react';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  location?: string;
  distributors?: any[];
  expected_delivery_date?: string;
}

interface ProjectPipelineWidgetProps {
  projects: Project[];
  onStatusClick: (status: string) => void;
}

const PIPELINE_STAGES = [
  { key: 'Intake', label: 'Intake', color: 'bg-sky-500', textColor: 'text-sky-400', bgLight: 'bg-sky-500/10', borderColor: 'border-sky-500/30' },
  { key: 'Offerte', label: 'Offerte', color: 'bg-amber-500', textColor: 'text-amber-400', bgLight: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { key: 'Werkvoorbereiding', label: 'Werkvoorb.', color: 'bg-blue-500', textColor: 'text-blue-400', bgLight: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { key: 'Productie', label: 'Productie', color: 'bg-orange-500', textColor: 'text-orange-400', bgLight: 'bg-orange-500/10', borderColor: 'border-orange-500/30' },
  { key: 'Testen', label: 'Testen', color: 'bg-yellow-500', textColor: 'text-yellow-400', bgLight: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  { key: 'Levering', label: 'Levering', color: 'bg-teal-500', textColor: 'text-teal-400', bgLight: 'bg-teal-500/10', borderColor: 'border-teal-500/30' },
  { key: 'Gereed voor facturatie', label: 'Facturatie', color: 'bg-emerald-500', textColor: 'text-emerald-400', bgLight: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
];

const ProjectPipelineWidget: React.FC<ProjectPipelineWidgetProps> = ({ projects, onStatusClick }) => {
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach(stage => {
      counts[stage.key] = projects.filter(p =>
        p.status?.toLowerCase() === stage.key.toLowerCase()
      ).length;
    });
    return counts;
  }, [projects]);

  const totalActive = useMemo(() => {
    return projects.filter(p =>
      p.status && !['opgeleverd', 'verloren'].includes(p.status.toLowerCase())
    ).length;
  }, [projects]);

  const maxCount = useMemo(() => Math.max(...Object.values(stageCounts), 1), [stageCounts]);

  const verdelersByStage = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach(stage => {
      counts[stage.key] = 0;
    });
    projects.forEach(p => {
      p.distributors?.forEach((d: any) => {
        const status = d.status;
        if (status && counts[status] !== undefined) {
          counts[status]++;
        }
      });
    });
    return counts;
  }, [projects]);

  return (
    <div className="card p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <TrendingUp size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Project Pipeline</h2>
            <p className="text-sm text-gray-400">{totalActive} actieve projecten in de pipeline</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {PIPELINE_STAGES.map((stage, index) => {
          const count = stageCounts[stage.key];
          const verdelers = verdelersByStage[stage.key];
          const barHeight = maxCount > 0 ? Math.max((count / maxCount) * 100, 8) : 8;

          return (
            <React.Fragment key={stage.key}>
              <div
                onClick={() => onStatusClick(stage.key)}
                className={`relative group cursor-pointer rounded-xl border ${stage.borderColor} ${stage.bgLight} p-3 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg`}
              >
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-white mb-1">{count}</div>
                  <div className={`text-xs font-medium ${stage.textColor} mb-2`}>{stage.label}</div>

                  <div className="w-full bg-gray-800/50 rounded-full h-20 flex flex-col justify-end overflow-hidden">
                    <div
                      className={`${stage.color} rounded-full transition-all duration-700 ease-out opacity-80`}
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>

                  <div className="mt-2 text-center">
                    <span className="text-xs text-gray-500">{verdelers} verd.</span>
                  </div>
                </div>

                {index < PIPELINE_STAGES.length - 1 && (
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 hidden lg:block">
                    <ChevronRight size={14} className="text-gray-600" />
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>Klik op een fase om projecten te filteren</span>
        <div className="flex items-center space-x-4">
          <span>Totaal verdelers: {Object.values(verdelersByStage).reduce((a, b) => a + b, 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectPipelineWidget;
