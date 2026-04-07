import React, { useMemo } from 'react';
import { AlertTriangle, Clock, UserX, ShieldAlert, ArrowRight } from 'lucide-react';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  location?: string;
  distributors?: any[];
  expected_delivery_date?: string;
}

interface NeedsAttentionBannerProps {
  projects: Project[];
  pendingApprovals: any[];
  onProjectClick: (projectId: string) => void;
}

interface AttentionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  items: { id: string; projectId: string; text: string; subtext: string }[];
}

const NeedsAttentionBanner: React.FC<NeedsAttentionBannerProps> = ({
  projects,
  pendingApprovals,
  onProjectClick,
}) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const attentionCategories = useMemo(() => {
    const categories: AttentionItem[] = [];

    const overdueProjects = projects.filter(p => {
      if (!p.expected_delivery_date) return false;
      const s = p.status?.toLowerCase();
      if (!s || ['opgeleverd', 'verloren', 'gereed voor facturatie'].includes(s)) return false;
      const delivery = new Date(p.expected_delivery_date);
      delivery.setHours(0, 0, 0, 0);
      return delivery < today;
    });

    if (overdueProjects.length > 0) {
      categories.push({
        id: 'overdue',
        icon: <Clock size={18} className="text-red-400" />,
        label: 'Achter op schema',
        count: overdueProjects.length,
        color: 'red',
        items: overdueProjects
          .sort((a, b) => new Date(a.expected_delivery_date!).getTime() - new Date(b.expected_delivery_date!).getTime())
          .slice(0, 5)
          .map(p => {
            const days = Math.ceil((today.getTime() - new Date(p.expected_delivery_date!).getTime()) / 86400000);
            return {
              id: p.id,
              projectId: p.id,
              text: `${p.project_number} - ${p.client || 'Geen klant'}`,
              subtext: `${days} ${days === 1 ? 'dag' : 'dagen'} over deadline | ${p.status}`,
            };
          }),
      });
    }

    const unassignedVerdelers: { id: string; projectId: string; text: string; subtext: string }[] = [];
    projects.forEach(p => {
      const s = p.status?.toLowerCase();
      if (!s || ['opgeleverd', 'verloren', 'gereed voor facturatie'].includes(s)) return;
      p.distributors?.forEach((d: any) => {
        const ds = d.status?.toLowerCase();
        if (!ds || ['opgeleverd', 'gereed voor facturatie', 'levering'].includes(ds)) return;
        if (!d.toegewezen_monteur || d.toegewezen_monteur.trim() === '') {
          unassignedVerdelers.push({
            id: d.id,
            projectId: p.id,
            text: `${d.kast_naam || d.distributor_id} (${p.project_number})`,
            subtext: `Status: ${d.status} | Geen monteur toegewezen`,
          });
        }
      });
    });

    if (unassignedVerdelers.length > 0) {
      categories.push({
        id: 'unassigned',
        icon: <UserX size={18} className="text-amber-400" />,
        label: 'Zonder eigenaar',
        count: unassignedVerdelers.length,
        color: 'amber',
        items: unassignedVerdelers.slice(0, 5),
      });
    }

    if (pendingApprovals.length > 0) {
      categories.push({
        id: 'blocked',
        icon: <ShieldAlert size={18} className="text-orange-400" />,
        label: 'Wacht op goedkeuring',
        count: pendingApprovals.length,
        color: 'orange',
        items: pendingApprovals.slice(0, 5).map((a: any) => ({
          id: `approval-${a.project?.id}-${a.distributor?.id}`,
          projectId: a.project?.id,
          text: `${a.project?.project_number} - ${a.distributor?.distributor_id || 'Verdeler'}`,
          subtext: `Ingediend door ${a.submittedBy} | Wacht op beoordeling`,
        })),
      });
    }

    const atRiskProjects = projects.filter(p => {
      if (!p.expected_delivery_date) return false;
      const s = p.status?.toLowerCase();
      if (!s || ['opgeleverd', 'verloren', 'gereed voor facturatie', 'levering'].includes(s)) return false;
      const delivery = new Date(p.expected_delivery_date);
      delivery.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((delivery.getTime() - today.getTime()) / 86400000);
      if (daysUntil < 0 || daysUntil > 5) return false;

      const isEarlyStage = ['intake', 'offerte', 'werkvoorbereiding'].includes(s);
      const isProductieWithLotsOfWork = s === 'productie' && (p.distributors?.length || 0) > 3;
      return isEarlyStage || isProductieWithLotsOfWork || daysUntil <= 2;
    });

    if (atRiskProjects.length > 0) {
      categories.push({
        id: 'at-risk',
        icon: <AlertTriangle size={18} className="text-yellow-400" />,
        label: 'Risico op vertraging',
        count: atRiskProjects.length,
        color: 'yellow',
        items: atRiskProjects.slice(0, 5).map(p => {
          const daysUntil = Math.ceil(
            (new Date(p.expected_delivery_date!).getTime() - today.getTime()) / 86400000
          );
          return {
            id: p.id,
            projectId: p.id,
            text: `${p.project_number} - ${p.client || 'Geen klant'}`,
            subtext: `Levering over ${daysUntil}d | Status: ${p.status} | ${p.distributors?.length || 0} verdelers`,
          };
        }),
      });
    }

    return categories;
  }, [projects, pendingApprovals, today]);

  const totalIssues = attentionCategories.reduce((sum, cat) => sum + cat.count, 0);

  if (totalIssues === 0) return null;

  const colorMap: Record<string, { border: string; bg: string; text: string; dot: string }> = {
    red: { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-400', dot: 'bg-red-500' },
    amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400', dot: 'bg-amber-500' },
    orange: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', text: 'text-orange-400', dot: 'bg-orange-500' },
    yellow: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  };

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Aandacht Vereist</h2>
          <p className="text-sm text-gray-400">{totalIssues} items die actie vereisen</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {attentionCategories.map(cat => {
          const colors = colorMap[cat.color] || colorMap.yellow;
          return (
            <div
              key={cat.id}
              className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}
            >
              <div className="p-4 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {cat.icon}
                    <span className={`text-sm font-semibold ${colors.text}`}>{cat.label}</span>
                  </div>
                  <span className={`text-xl font-bold ${colors.text}`}>{cat.count}</span>
                </div>

                <div className="space-y-2">
                  {cat.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => onProjectClick(item.projectId)}
                      className="flex items-start justify-between p-2 rounded-lg bg-gray-900/40 hover:bg-gray-900/70 cursor-pointer transition-colors group"
                    >
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-sm text-white font-medium truncate">{item.text}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtext}</p>
                      </div>
                      <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-1 transition-colors" />
                    </div>
                  ))}
                  {cat.count > 5 && (
                    <p className="text-xs text-gray-500 text-center pt-1">
                      +{cat.count - 5} meer
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NeedsAttentionBanner;
