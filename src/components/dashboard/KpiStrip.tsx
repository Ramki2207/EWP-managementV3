import React, { useMemo } from 'react';
import { FolderOpen, Wrench, AlertTriangle, Package, Calendar } from 'lucide-react';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  location?: string;
  distributors?: any[];
  expected_delivery_date?: string;
}

interface KpiStripProps {
  projects: Project[];
}

const KpiStrip: React.FC<KpiStripProps> = ({ projects }) => {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const active = projects.filter(p => {
      const s = p.status?.toLowerCase();
      return s && !['opgeleverd', 'verloren'].includes(s);
    });

    const inProduction = projects.filter(p => p.status?.toLowerCase() === 'productie');

    const delayed = projects.filter(p => {
      if (!p.expected_delivery_date) return false;
      const s = p.status?.toLowerCase();
      if (!s || ['opgeleverd', 'verloren', 'gereed voor facturatie'].includes(s)) return false;
      const delivery = new Date(p.expected_delivery_date);
      delivery.setHours(0, 0, 0, 0);
      return delivery < today;
    });

    const totalVerdelers = active.reduce((sum, p) => sum + (p.distributors?.length || 0), 0);

    const dueThisWeek = projects.filter(p => {
      if (!p.expected_delivery_date) return false;
      const s = p.status?.toLowerCase();
      if (!s || ['opgeleverd', 'verloren', 'gereed voor facturatie'].includes(s)) return false;
      const delivery = new Date(p.expected_delivery_date);
      delivery.setHours(0, 0, 0, 0);
      return delivery >= today && delivery <= weekFromNow;
    });

    return {
      active: active.length,
      inProduction: inProduction.length,
      delayed: delayed.length,
      totalVerdelers,
      dueThisWeek: dueThisWeek.length,
    };
  }, [projects]);

  const kpis = [
    {
      label: 'Actieve projecten',
      value: stats.active,
      icon: FolderOpen,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'In productie',
      value: stats.inProduction,
      icon: Wrench,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Vertraagd',
      value: stats.delayed,
      icon: AlertTriangle,
      color: stats.delayed > 0 ? 'text-red-400' : 'text-gray-500',
      bgColor: stats.delayed > 0 ? 'bg-red-500/10' : 'bg-gray-500/10',
    },
    {
      label: 'Verdelers totaal',
      value: stats.totalVerdelers,
      icon: Package,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/10',
    },
    {
      label: 'Levering deze week',
      value: stats.dueThisWeek,
      icon: Calendar,
      color: stats.dueThisWeek > 0 ? 'text-amber-400' : 'text-gray-500',
      bgColor: stats.dueThisWeek > 0 ? 'bg-amber-500/10' : 'bg-gray-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`${kpi.bgColor} rounded-xl px-4 py-3 border border-gray-800/50 transition-colors hover:border-gray-700/50`}
        >
          <div className="flex items-center space-x-2.5">
            <kpi.icon size={16} className={kpi.color} />
            <span className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 leading-tight">{kpi.label}</p>
        </div>
      ))}
    </div>
  );
};

export default KpiStrip;
