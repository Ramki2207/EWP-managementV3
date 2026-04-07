import React, { useMemo } from 'react';
import { AlertTriangle, Calendar, Clock, CheckCircle2, ArrowRight, Package } from 'lucide-react';

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

interface ActionItemsWidgetProps {
  projects: Project[];
  onProjectClick: (projectId: string) => void;
}

interface ActionItem {
  id: string;
  projectId: string;
  projectNumber: string;
  client: string;
  type: 'overdue' | 'today' | 'upcoming' | 'blocked' | 'ready_for_delivery';
  title: string;
  subtitle: string;
  urgency: 'critical' | 'warning' | 'info';
  daysUntil?: number;
}

const ActionItemsWidget: React.FC<ActionItemsWidgetProps> = ({ projects, onProjectClick }) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { todayItems, weekItems, monthItems } = useMemo(() => {
    const todayItems: ActionItem[] = [];
    const weekItems: ActionItem[] = [];
    const monthItems: ActionItem[] = [];

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);

    const endOfMonth = new Date(today);
    endOfMonth.setDate(today.getDate() + 30);

    projects.forEach(project => {
      if (!project.expected_delivery_date) return;
      if (['opgeleverd', 'verloren'].includes(project.status?.toLowerCase() || '')) return;

      const deliveryDate = new Date(project.expected_delivery_date);
      deliveryDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const verdelerCount = project.distributors?.length || 0;

      if (daysUntil < 0) {
        todayItems.push({
          id: `overdue-${project.id}`,
          projectId: project.id,
          projectNumber: project.project_number,
          client: project.client || '-',
          type: 'overdue',
          title: `${Math.abs(daysUntil)} dagen over deadline`,
          subtitle: `${verdelerCount} verdelers - Status: ${project.status}`,
          urgency: 'critical',
          daysUntil,
        });
      } else if (daysUntil === 0) {
        todayItems.push({
          id: `today-${project.id}`,
          projectId: project.id,
          projectNumber: project.project_number,
          client: project.client || '-',
          type: 'today',
          title: 'Levering vandaag',
          subtitle: `${verdelerCount} verdelers - Status: ${project.status}`,
          urgency: 'critical',
          daysUntil: 0,
        });
      } else if (daysUntil <= 7) {
        weekItems.push({
          id: `week-${project.id}`,
          projectId: project.id,
          projectNumber: project.project_number,
          client: project.client || '-',
          type: 'upcoming',
          title: `Levering over ${daysUntil} ${daysUntil === 1 ? 'dag' : 'dagen'}`,
          subtitle: `${verdelerCount} verdelers - Status: ${project.status}`,
          urgency: daysUntil <= 2 ? 'warning' : 'info',
          daysUntil,
        });
      } else if (daysUntil <= 30) {
        monthItems.push({
          id: `month-${project.id}`,
          projectId: project.id,
          projectNumber: project.project_number,
          client: project.client || '-',
          type: 'upcoming',
          title: `Levering ${deliveryDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`,
          subtitle: `${verdelerCount} verdelers - Status: ${project.status}`,
          urgency: 'info',
          daysUntil,
        });
      }
    });

    projects.forEach(project => {
      if (project.status?.toLowerCase() === 'testen') {
        const testedCount = project.distributors?.filter((d: any) => d.is_tested).length || 0;
        const total = project.distributors?.length || 0;
        if (testedCount === total && total > 0) {
          todayItems.push({
            id: `ready-${project.id}`,
            projectId: project.id,
            projectNumber: project.project_number,
            client: project.client || '-',
            type: 'ready_for_delivery',
            title: 'Alle testen voltooid - Klaar voor levering',
            subtitle: `${total} verdelers getest`,
            urgency: 'info',
          });
        }
      }
    });

    todayItems.sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0));
    weekItems.sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0));
    monthItems.sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0));

    return { todayItems, weekItems, monthItems };
  }, [projects, today]);

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'border-red-500/30 bg-red-500/5 hover:border-red-500/50';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50';
      default:
        return 'border-gray-700 bg-gray-800/30 hover:border-blue-500/40';
    }
  };

  const getUrgencyIcon = (item: ActionItem) => {
    switch (item.type) {
      case 'overdue':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'today':
        return <Clock size={16} className="text-red-400 animate-pulse" />;
      case 'ready_for_delivery':
        return <Package size={16} className="text-teal-400" />;
      default:
        return <Calendar size={16} className="text-blue-400" />;
    }
  };

  const renderActionItem = (item: ActionItem) => (
    <div
      key={item.id}
      onClick={() => onProjectClick(item.projectId)}
      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${getUrgencyStyles(item.urgency)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="mt-0.5 flex-shrink-0">{getUrgencyIcon(item)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-0.5">
              <span className="font-medium text-blue-400 text-sm">{item.projectNumber}</span>
              <span className="text-gray-500 text-xs">|</span>
              <span className="text-gray-300 text-xs truncate">{item.client}</span>
            </div>
            <p className="text-sm text-white font-medium">{item.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
          </div>
        </div>
        <ArrowRight size={14} className="text-gray-600 flex-shrink-0 mt-1" />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      <div className="card p-5 border-t-2 border-t-red-500/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-red-500/20 rounded-lg">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Vandaag</h3>
              <p className="text-xs text-gray-500">Directe actie vereist</p>
            </div>
          </div>
          <div className={`text-2xl font-bold ${todayItems.length > 0 ? 'text-red-400' : 'text-gray-600'}`}>
            {todayItems.length}
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {todayItems.length > 0 ? (
            todayItems.map(renderActionItem)
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 size={32} className="mx-auto text-green-500/40 mb-2" />
              <p className="text-sm text-gray-500">Geen acties voor vandaag</p>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 border-t-2 border-t-amber-500/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-500/20 rounded-lg">
              <Clock size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Deze Week</h3>
              <p className="text-xs text-gray-500">Komende 7 dagen</p>
            </div>
          </div>
          <div className={`text-2xl font-bold ${weekItems.length > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
            {weekItems.length}
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {weekItems.length > 0 ? (
            weekItems.map(renderActionItem)
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 size={32} className="mx-auto text-green-500/40 mb-2" />
              <p className="text-sm text-gray-500">Geen leveringen deze week</p>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 border-t-2 border-t-blue-500/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-500/20 rounded-lg">
              <Calendar size={16} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Deze Maand</h3>
              <p className="text-xs text-gray-500">Komende 30 dagen</p>
            </div>
          </div>
          <div className={`text-2xl font-bold ${monthItems.length > 0 ? 'text-blue-400' : 'text-gray-600'}`}>
            {monthItems.length}
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {monthItems.length > 0 ? (
            monthItems.map(renderActionItem)
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 size={32} className="mx-auto text-green-500/40 mb-2" />
              <p className="text-sm text-gray-500">Geen leveringen deze maand</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionItemsWidget;
