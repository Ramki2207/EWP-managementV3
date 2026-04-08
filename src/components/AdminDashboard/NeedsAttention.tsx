import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, UserX, ShieldAlert } from 'lucide-react';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  expected_delivery_date?: string;
  description?: string;
  distributors?: any[];
}

interface NeedsAttentionProps {
  projects: Project[];
}

interface AttentionItem {
  id: string;
  type: 'overdue' | 'no_owner' | 'behind_schedule' | 'pending_review';
  title: string;
  subtitle: string;
  projectId: string;
  projectNumber: string;
}

const NeedsAttention: React.FC<NeedsAttentionProps> = ({ projects }) => {
  const navigate = useNavigate();

  const getAttentionItems = (): AttentionItem[] => {
    const items: AttentionItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeStatuses = ['Offerte', 'Productie', 'Testen', 'Levering'];

    projects.forEach(project => {
      if (!activeStatuses.includes(project.status)) return;

      if (project.expected_delivery_date) {
        const deliveryDate = new Date(project.expected_delivery_date);
        deliveryDate.setHours(0, 0, 0, 0);
        if (deliveryDate < today) {
          items.push({
            id: `overdue-${project.id}`,
            type: 'overdue',
            title: `${project.project_number} - leverdatum verstreken`,
            subtitle: `${project.client || 'Geen klant'} - verwacht: ${new Date(project.expected_delivery_date).toLocaleDateString('nl-NL')}`,
            projectId: project.id,
            projectNumber: project.project_number,
          });
        }

        const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const totalDistributors = project.distributors?.length || 0;
        const completedDistributors = project.distributors?.filter(
          (d: any) => d.is_delivered || d.status === 'Opgeleverd'
        ).length || 0;

        if (daysUntilDelivery > 0 && daysUntilDelivery <= 7 && totalDistributors > 0) {
          const progressPct = (completedDistributors / totalDistributors) * 100;
          if (progressPct < 50) {
            items.push({
              id: `behind-${project.id}`,
              type: 'behind_schedule',
              title: `${project.project_number} - achter op schema`,
              subtitle: `${completedDistributors}/${totalDistributors} verdelers klaar, levering over ${daysUntilDelivery} dag${daysUntilDelivery !== 1 ? 'en' : ''}`,
              projectId: project.id,
              projectNumber: project.project_number,
            });
          }
        }
      }

      const unassignedDistributors = project.distributors?.filter(
        (d: any) => !d.toegewezen_monteur && !['Opgeleverd', 'Levering'].includes(d.status || '')
      ) || [];

      if (unassignedDistributors.length > 0) {
        items.push({
          id: `noowner-${project.id}`,
          type: 'no_owner',
          title: `${project.project_number} - ${unassignedDistributors.length} verdeler${unassignedDistributors.length !== 1 ? 's' : ''} niet toegewezen`,
          subtitle: `${project.client || 'Geen klant'} - ${unassignedDistributors.map((d: any) => d.kast_naam).join(', ')}`,
          projectId: project.id,
          projectNumber: project.project_number,
        });
      }

      const pendingTestDistributors = project.distributors?.filter(
        (d: any) => d.status === 'Testen' && !d.is_tested
      ) || [];

      if (pendingTestDistributors.length > 0) {
        items.push({
          id: `review-${project.id}`,
          type: 'pending_review',
          title: `${project.project_number} - wacht op test`,
          subtitle: `${pendingTestDistributors.length} verdeler${pendingTestDistributors.length !== 1 ? 's' : ''} in testfase`,
          projectId: project.id,
          projectNumber: project.project_number,
        });
      }
    });

    return items.sort((a, b) => {
      const priority = { overdue: 0, behind_schedule: 1, no_owner: 2, pending_review: 3 };
      return priority[a.type] - priority[b.type];
    });
  };

  const attentionItems = getAttentionItems();

  const iconMap = {
    overdue: <Clock size={18} className="text-red-400" />,
    behind_schedule: <AlertTriangle size={18} className="text-amber-400" />,
    no_owner: <UserX size={18} className="text-orange-400" />,
    pending_review: <ShieldAlert size={18} className="text-blue-400" />,
  };

  const bgMap = {
    overdue: 'border-red-500/30 bg-red-500/5',
    behind_schedule: 'border-amber-500/30 bg-amber-500/5',
    no_owner: 'border-orange-500/30 bg-orange-500/5',
    pending_review: 'border-blue-500/30 bg-blue-500/5',
  };

  const labelMap = {
    overdue: 'Verlopen',
    behind_schedule: 'Achter schema',
    no_owner: 'Niet toegewezen',
    pending_review: 'Wacht op test',
  };

  const labelColorMap = {
    overdue: 'text-red-400 bg-red-500/20',
    behind_schedule: 'text-amber-400 bg-amber-500/20',
    no_owner: 'text-orange-400 bg-orange-500/20',
    pending_review: 'text-blue-400 bg-blue-500/20',
  };

  if (attentionItems.length === 0) {
    return (
      <div className="card border border-green-500/30 bg-green-500/5">
        <div className="flex items-center gap-3 p-1">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <AlertTriangle size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-green-400">Alles op schema</h2>
            <p className="text-sm text-gray-400">Er zijn geen items die direct aandacht vereisen.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border border-red-500/20">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Aandacht vereist</h2>
          <p className="text-sm text-gray-400">{attentionItems.length} item{attentionItems.length !== 1 ? 's' : ''} die aandacht nodig {attentionItems.length !== 1 ? 'hebben' : 'heeft'}</p>
        </div>
      </div>

      <div className="space-y-2">
        {attentionItems.slice(0, 8).map(item => (
          <div
            key={item.id}
            onClick={() => navigate(`/projects/${item.projectId}`)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${bgMap[item.type]}`}
          >
            <div className="flex-shrink-0">{iconMap[item.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.title}</p>
              <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${labelColorMap[item.type]}`}>
              {labelMap[item.type]}
            </span>
          </div>
        ))}
        {attentionItems.length > 8 && (
          <p className="text-xs text-gray-500 text-center pt-2">
            + {attentionItems.length - 8} meer items
          </p>
        )}
      </div>
    </div>
  );
};

export default NeedsAttention;
