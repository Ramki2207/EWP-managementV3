import React, { useMemo } from 'react';

interface Project {
  id: string;
  project_number: string;
  status: string;
}

interface PipelineBarProps {
  projects: Project[];
}

const PHASES = [
  { key: 'intake', label: 'Intake', color: 'bg-sky-500' },
  { key: 'offerte', label: 'Offerte', color: 'bg-yellow-500' },
  { key: 'werkvoorbereiding', label: 'Werkvoorber.', color: 'bg-blue-500' },
  { key: 'productie', label: 'Productie', color: 'bg-orange-500' },
  { key: 'testen', label: 'Testen', color: 'bg-amber-500' },
  { key: 'levering', label: 'Levering', color: 'bg-teal-500' },
  { key: 'gereed voor facturatie', label: 'Facturatie', color: 'bg-emerald-500' },
];

const PipelineBar: React.FC<PipelineBarProps> = ({ projects }) => {
  const phaseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PHASES.forEach(p => { counts[p.key] = 0; });

    projects.forEach(project => {
      const s = project.status?.toLowerCase();
      if (s && counts[s] !== undefined) {
        counts[s]++;
      }
    });

    return counts;
  }, [projects]);

  const activeTotal = useMemo(() => {
    return PHASES.reduce((sum, phase) => sum + (phaseCounts[phase.key] || 0), 0);
  }, [phaseCounts]);

  if (activeTotal === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pipeline</span>
        <span className="text-xs text-gray-500">{activeTotal} projecten in pipeline</span>
      </div>

      <div className="flex h-3 rounded-full overflow-hidden bg-gray-800 mb-2">
        {PHASES.map(phase => {
          const count = phaseCounts[phase.key] || 0;
          if (count === 0) return null;
          const widthPercent = (count / activeTotal) * 100;

          return (
            <div
              key={phase.key}
              className={`${phase.color} transition-all duration-500 relative group`}
              style={{ width: `${widthPercent}%` }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {phase.label}: {count}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {PHASES.map(phase => {
          const count = phaseCounts[phase.key] || 0;
          if (count === 0) return null;

          return (
            <div key={phase.key} className="flex items-center space-x-1.5">
              <div className={`w-2 h-2 rounded-full ${phase.color}`} />
              <span className="text-[11px] text-gray-400">
                {phase.label} <span className="text-gray-500">({count})</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineBar;
