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

type Severity = 'critical' | 'high' | 'medium';

interface AttentionItemData {
  id: string;
  projectId: string;
  text: string;
  subtext: string;
  severity: Severity;
  daysInfo?: number;
}

interface AttentionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  severity: Severity;
  items: AttentionItemData[];
}

const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };

const getSeverityIndicator = (severity: Severity) => {
  switch (severity) {
    case 'critical': return { dot: 'bg-red-500', pulse: true, label: 'Urgent' };
    case 'high': return { dot: 'bg-orange-500', pulse: false, label: 'Hoog' };
    case 'medium': return { dot: 'bg-yellow-500', pulse: false, label: 'Medium' };
  }
};

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
      if (!s || ['opgeleverd', 'verloren', 'gereed voor facturatie', 'levering', 'gereed'].includes(s)) return false;
      const delivery = new Date(p.expected_delivery_date);
      delivery.setHours(0, 0, 0, 0);
      return delivery < today;
    });

    if (overdueProjects.length > 0) {
      categories.push({
        id: 'overdue',
        icon: <Clock size={16} className="text-red-400" />,
        label: 'Achter op schema',
        count: overdueProjects.length,
        color: 'red',
        severity: 'critical',
        items: overdueProjects
          .sort((a, b) => new Date(a.expected_delivery_date!).getTime() - new Date(b.expected_delivery_date!).getTime())
          .slice(0, 5)
          .map(p => {
            const days = Math.ceil((today.getTime() - new Date(p.expected_delivery_date!).getTime()) / 86400000);
            const severity: Severity = days > 14 ? 'critical' : days > 7 ? 'critical' : 'high';
            return {
              id: p.id,
              projectId: p.id,
              text: `${p.project_number} - ${p.client || 'Geen klant'}`,
              subtext: `${days}d over deadline | ${p.status}`,
              severity,
              daysInfo: days,
            };
          }),
      });
    }

    const unassignedVerdelers: AttentionItemData[] = [];
    projects.forEach(p => {
      const s = p.status?.toLowerCase();
      if (!s || ['opgeleverd', 'verloren', 'gereed voor facturatie'].includes(s)) return;
      p.distributors?.forEach((d: any) => {
        const ds = d.status?.toLowerCase();
        if (!ds || ['opgeleverd', 'gereed voor facturatie'].includes(ds)) return;
        if (!d.toegewezen_monteur || d.toegewezen_monteur.trim() === '') {
          const isInProd = ds === 'productie';
          unassignedVerdelers.push({
            id: d.id,
            projectId: p.id,
            text: `${d.kast_naam || d.distributor_id} (${p.project_number})`,
            subtext: `Status: ${d.status} | Geen monteur`,
            severity: isInProd ? 'high' : 'medium',
          });
        }
      });
    });

    if (unassignedVerdelers.length > 0) {
      categories.push({
        id: 'unassigned',
        icon: <UserX size={16} className="text-amber-400" />,
        label: 'Zonder eigenaar',
        count: unassignedVerdelers.length,
        color: 'amber',
        severity: unassignedVerdelers.some(v => v.severity === 'high') ? 'high' : 'medium',
        items: unassignedVerdelers
          .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
          .slice(0, 5),
      });
    }

    if (pendingApprovals.length > 0) {
      const now = new Date();
      categories.push({
        id: 'blocked',
        icon: <ShieldAlert size={16} className="text-orange-400" />,
        label: 'Wacht op goedkeuring',
        count: pendingApprovals.length,
        color: 'orange',
        severity: 'high',
        items: pendingApprovals.slice(0, 5).map((a: any) => {
          const waitDays = a.submittedAt ? Math.ceil((now.getTime() - new Date(a.submittedAt).getTime()) / 86400000) : 0;
          return {
            id: `approval-${a.project?.id}-${a.distributor?.id}`,
            projectId: a.project?.id,
            text: `${a.project?.project_number} - ${a.distributor?.distributor_id || 'Verdeler'}`,
            subtext: `Door ${a.submittedBy}${waitDays > 0 ? ` | ${waitDays}d wachtend` : ''}`,
            severity: (waitDays > 3 ? 'critical' : 'high') as Severity,
            daysInfo: waitDays,
          };
        }),
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
        icon: <AlertTriangle size={16} className="text-yellow-400" />,
        label: 'Risico op vertraging',
        count: atRiskProjects.length,
        color: 'yellow',
        severity: 'medium',
        items: atRiskProjects.slice(0, 5).map(p => {
          const daysUntil = Math.ceil(
            (new Date(p.expected_delivery_date!).getTime() - today.getTime()) / 86400000
          );
          return {
            id: p.id,
            projectId: p.id,
            text: `${p.project_number} - ${p.client || 'Geen klant'}`,
            subtext: `Levering over ${daysUntil}d | ${p.status}`,
            severity: (daysUntil <= 1 ? 'high' : 'medium') as Severity,
            daysInfo: daysUntil,
          };
        }),
      });
    }

    return categories.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [projects, pendingApprovals, today]);

  const totalIssues = attentionCategories.reduce((sum, cat) => sum + cat.count, 0);

  if (totalIssues === 0) return null;

  const colorMap: Record<string, { border: string; bg: string; text: string }> = {
    red: { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-400' },
    amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400' },
    orange: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', text: 'text-orange-400' },
    yellow: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/5', text: 'text-yellow-400' },
  };

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Aandacht Vereist</h2>
          <p className="text-[11px] text-gray-500">{totalIssues} items die actie vereisen</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px]">
        {attentionCategories.map(cat => {
          const colors = colorMap[cat.color] || colorMap.yellow;
          return (
            <div
              key={cat.id}
              className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}
            >
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {cat.icon}
                    <span className={`text-xs font-semibold ${colors.text}`}>{cat.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      cat.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      cat.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    } font-medium`}>
                      {getSeverityIndicator(cat.severity).label}
                    </span>
                    <span className={`text-lg font-bold ${colors.text}`}>{cat.count}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {cat.items.map(item => {
                    const sev = getSeverityIndicator(item.severity);
                    return (
                      <div
                        key={item.id}
                        onClick={() => onProjectClick(item.projectId)}
                        className="flex items-center space-x-2.5 p-2 rounded-lg bg-gray-900/40 hover:bg-gray-900/70 cursor-pointer transition-colors group"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${sev.dot} flex-shrink-0 ${sev.pulse ? 'animate-pulse' : ''}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium truncate">{item.text}</p>
                          <p className="text-[10px] text-gray-500 truncate">{item.subtext}</p>
                        </div>
                        <ArrowRight size={12} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
                      </div>
                    );
                  })}
                  {cat.count > 5 && (
                    <p className="text-[10px] text-gray-500 text-center pt-0.5">
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
