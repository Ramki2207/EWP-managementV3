import React, { useMemo, useState } from 'react';
import { ClipboardList, AlertTriangle, Clock, Calendar, CheckCircle2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  location?: string;
  distributors?: any[];
  expected_delivery_date?: string;
}

interface MyTasksWidgetProps {
  projects: Project[];
  currentUsername: string;
  onProjectClick: (projectId: string) => void;
}

interface Task {
  id: string;
  projectId: string;
  projectNumber: string;
  client: string;
  verdelerName: string;
  verdelerStatus: string;
  deadline: Date | null;
  daysUntil: number | null;
  priority: 'overdue' | 'today' | 'this_week' | 'upcoming';
}

const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({ projects, currentUsername, onProjectClick }) => {
  const [showAll, setShowAll] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const endOfWeek = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d;
  }, [today]);

  const { overdueTasks, todayTasks, weekTasks, upcomingTasks } = useMemo(() => {
    const allTasks: Task[] = [];

    projects.forEach(project => {
      const projectStatus = project.status?.toLowerCase();
      if (!projectStatus || ['opgeleverd', 'verloren'].includes(projectStatus)) return;

      project.distributors?.forEach((d: any) => {
        const isAssigned = d.toegewezen_monteur === currentUsername;
        if (!isAssigned) return;

        const verdelerStatus = d.status?.toLowerCase();
        if (!verdelerStatus || ['opgeleverd', 'gereed voor facturatie'].includes(verdelerStatus)) return;

        const deadline = project.expected_delivery_date ? new Date(project.expected_delivery_date) : null;
        if (deadline) deadline.setHours(0, 0, 0, 0);
        const daysUntil = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / 86400000) : null;

        let priority: Task['priority'] = 'upcoming';
        if (daysUntil !== null) {
          if (daysUntil < 0) priority = 'overdue';
          else if (daysUntil === 0) priority = 'today';
          else if (daysUntil <= 7) priority = 'this_week';
        }

        allTasks.push({
          id: `${project.id}-${d.id}`,
          projectId: project.id,
          projectNumber: project.project_number,
          client: project.client || '-',
          verdelerName: d.kast_naam || d.distributor_id || 'Verdeler',
          verdelerStatus: d.status || 'Onbekend',
          deadline,
          daysUntil,
          priority,
        });
      });

      const isProjectLeader = true;
      if (isProjectLeader) {
        const hasDeliveryToday = project.expected_delivery_date &&
          new Date(project.expected_delivery_date).toDateString() === today.toDateString();

        if (hasDeliveryToday && projectStatus === 'levering') {
          const alreadyHasTask = allTasks.some(t => t.projectId === project.id);
          if (!alreadyHasTask) {
            allTasks.push({
              id: `delivery-${project.id}`,
              projectId: project.id,
              projectNumber: project.project_number,
              client: project.client || '-',
              verdelerName: 'Project levering',
              verdelerStatus: 'Levering',
              deadline: today,
              daysUntil: 0,
              priority: 'today',
            });
          }
        }
      }
    });

    const overdueTasks = allTasks.filter(t => t.priority === 'overdue')
      .sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0));
    const todayTasks = allTasks.filter(t => t.priority === 'today');
    const weekTasks = allTasks.filter(t => t.priority === 'this_week')
      .sort((a, b) => (a.daysUntil ?? 99) - (b.daysUntil ?? 99));
    const upcomingTasks = allTasks.filter(t => t.priority === 'upcoming');

    return { overdueTasks, todayTasks, weekTasks, upcomingTasks };
  }, [projects, currentUsername, today, endOfWeek]);

  const totalTasks = overdueTasks.length + todayTasks.length + weekTasks.length + upcomingTasks.length;

  const getPriorityStyles = (priority: Task['priority']) => {
    switch (priority) {
      case 'overdue': return 'border-l-red-500 bg-red-500/5';
      case 'today': return 'border-l-amber-500 bg-amber-500/5';
      case 'this_week': return 'border-l-blue-500 bg-blue-500/5';
      default: return 'border-l-gray-600 bg-gray-800/30';
    }
  };

  const getDeadlineText = (task: Task) => {
    if (task.daysUntil === null) return 'Geen deadline';
    if (task.daysUntil < 0) return `${Math.abs(task.daysUntil)}d te laat`;
    if (task.daysUntil === 0) return 'Vandaag';
    if (task.daysUntil === 1) return 'Morgen';
    return `Over ${task.daysUntil} dagen`;
  };

  const getDeadlineColor = (task: Task) => {
    if (task.daysUntil === null) return 'text-gray-500';
    if (task.daysUntil < 0) return 'text-red-400';
    if (task.daysUntil === 0) return 'text-amber-400';
    if (task.daysUntil <= 3) return 'text-amber-400';
    return 'text-gray-400';
  };

  const renderTask = (task: Task) => (
    <div
      key={task.id}
      onClick={() => onProjectClick(task.projectId)}
      className={`border-l-2 ${getPriorityStyles(task.priority)} rounded-r-lg p-3 cursor-pointer hover:bg-gray-800/50 transition-colors group`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-blue-400">{task.projectNumber}</span>
            <span className="text-xs text-gray-600">|</span>
            <span className="text-xs text-gray-400 truncate">{task.client}</span>
          </div>
          <p className="text-sm text-white">{task.verdelerName}</p>
          <div className="flex items-center space-x-3 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
              {task.verdelerStatus}
            </span>
            <span className={`text-xs font-medium ${getDeadlineColor(task)}`}>
              {getDeadlineText(task)}
            </span>
          </div>
        </div>
        <ArrowRight size={14} className="text-gray-700 group-hover:text-gray-400 flex-shrink-0 mt-1 transition-colors" />
      </div>
    </div>
  );

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    tasks: Task[],
    accentColor: string,
    showWhenEmpty: boolean = false
  ) => {
    if (tasks.length === 0 && !showWhenEmpty) return null;
    const visible = showAll ? tasks : tasks.slice(0, 4);

    return (
      <div className="mb-4 last:mb-0">
        <div className="flex items-center space-x-2 mb-2">
          {icon}
          <span className={`text-xs font-semibold uppercase tracking-wider ${accentColor}`}>
            {title}
          </span>
          <span className="text-xs text-gray-600">({tasks.length})</span>
        </div>
        {tasks.length > 0 ? (
          <div className="space-y-2">
            {visible.map(renderTask)}
            {!showAll && tasks.length > 4 && (
              <p className="text-xs text-gray-500 text-center pt-1">+{tasks.length - 4} meer</p>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <CheckCircle2 size={20} className="mx-auto text-emerald-500/40 mb-1" />
            <p className="text-xs text-gray-500">Geen taken</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <ClipboardList size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Mijn Taken</h2>
            <p className="text-xs text-gray-500">{totalTasks} openstaande taken</p>
          </div>
        </div>
        {totalTasks > 0 && (
          <div className="flex items-center space-x-2">
            {overdueTasks.length > 0 && (
              <span className="flex items-center space-x-1 text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full">
                <AlertTriangle size={12} />
                <span>{overdueTasks.length}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-1 max-h-[520px]">
        {totalTasks === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 size={40} className="text-emerald-500/30 mb-3" />
            <p className="text-gray-400 text-sm font-medium">Alles bijgewerkt</p>
            <p className="text-gray-600 text-xs mt-1">Geen openstaande taken</p>
          </div>
        ) : (
          <>
            {renderSection(
              'Te laat',
              <AlertTriangle size={14} className="text-red-400" />,
              overdueTasks,
              'text-red-400'
            )}
            {renderSection(
              'Vandaag',
              <Clock size={14} className="text-amber-400" />,
              todayTasks,
              'text-amber-400',
              overdueTasks.length === 0
            )}
            {renderSection(
              'Deze week',
              <Calendar size={14} className="text-blue-400" />,
              weekTasks,
              'text-blue-400'
            )}
            {renderSection(
              'Overig',
              <ClipboardList size={14} className="text-gray-400" />,
              upcomingTasks,
              'text-gray-400'
            )}
          </>
        )}
      </div>

      {totalTasks > 8 && (
        <div className="pt-3 border-t border-gray-800 mt-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center justify-center space-x-1 text-xs text-gray-400 hover:text-blue-400 transition-colors w-full py-1"
          >
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showAll ? 'Toon minder' : `Toon alle ${totalTasks} taken`}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTasksWidget;
