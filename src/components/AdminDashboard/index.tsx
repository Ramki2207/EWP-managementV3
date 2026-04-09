import React, { useMemo } from 'react';
import { BarChart3, FolderOpen, Briefcase, Users } from 'lucide-react';
import NeedsAttention from './NeedsAttention';
import TestingOverview from './TestingOverview';
import MyTasks from './MyTasks';
import ProjectOverview from './ProjectOverview';
import ProductiePlanning from './ProductiePlanning';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  expected_delivery_date?: string;
  description?: string;
  project_naam?: string;
  created_by?: string;
  location?: string;
  contact_person?: string;
  contactpersoon_voornaam?: string;
  contactpersoon_achternaam?: string;
  contactpersoon_telefoon?: string;
  contactpersoon_email?: string;
  referentie_ewp?: string;
  referentie_klant?: string;
  aflever_adres?: string;
  distributors?: any[];
}

interface AdminDashboardProps {
  projects: Project[];
  userId: string;
  username: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ projects, userId, username }) => {
  const activeStatuses = ['Offerte', 'Productie', 'Testen', 'Levering'];
  const activeProjects = projects.filter(p => activeStatuses.includes(p.status));
  const totalDistributors = projects.reduce((sum, p) => sum + (p.distributors?.length || 0), 0);
  const completedDistributors = projects.reduce((sum, p) =>
    sum + (p.distributors?.filter((d: any) => d.is_delivered || d.status === 'Opgeleverd' || d.is_closed).length || 0), 0
  );

  const myProjectsCount = useMemo(() => {
    return projects.filter(p => p.created_by === userId && p.status !== 'Opgeleverd').length;
  }, [projects, userId]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<FolderOpen size={20} />}
          label="Actieve Projecten"
          value={activeProjects.length}
          color="blue"
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          label="Verdelers Gereed"
          value={`${completedDistributors}/${totalDistributors}`}
          color="green"
        />
        <StatCard
          icon={<Briefcase size={20} />}
          label="Mijn Projecten"
          value={myProjectsCount}
          color="amber"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Totaal Projecten"
          value={projects.length}
          color="teal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeedsAttention projects={projects} userId={userId} />
        <TestingOverview projects={projects} userId={userId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[600px]">
          <MyTasks
            projects={projects}
            userId={userId}
          />
        </div>
        <div className="h-[600px]">
          <ProjectOverview projects={projects} userId={userId} />
        </div>
      </div>

      <ProductiePlanning userId={userId} />
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'amber' | 'teal';
}

const colorMap = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'bg-blue-500/20 text-blue-400', value: 'text-blue-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'bg-green-500/20 text-green-400', value: 'text-green-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'bg-amber-500/20 text-amber-400', value: 'text-amber-400' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/20', icon: 'bg-teal-500/20 text-teal-400', value: 'text-teal-400' },
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4 transition-all hover:scale-[1.02]`}>
      <div className={`p-2 rounded-lg ${c.icon} w-fit mb-3`}>{icon}</div>
      <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
};

export default AdminDashboard;
