import React, { useMemo, useState, useEffect } from 'react';
import { ClipboardList, AlertTriangle, CheckCircle2, ArrowRight, ChevronDown, ChevronUp, FileWarning, Shield, UserX, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import TestReviewNotifications from '../TestReviewNotifications';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  location?: string;
  distributors?: any[];
  expected_delivery_date?: string;
  created_by?: string;
}

interface MyTasksWidgetProps {
  projects: Project[];
  currentUserId: string;
  pendingApprovals: any[];
  isAdmin: boolean;
  onProjectClick: (projectId: string) => void;
}

interface ProjectIssue {
  projectId: string;
  projectNumber: string;
  client: string;
  issues: string[];
  issueCount: number;
}

const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({
  projects,
  currentUserId,
  pendingApprovals,
  isAdmin,
  onProjectClick,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [docStatus, setDocStatus] = useState<Record<string, { verdelerAanzicht: boolean; installatieSchema: boolean }>>({});
  const [docLoading, setDocLoading] = useState(true);
  const navigate = useNavigate();

  const myProjects = useMemo(() => {
    return projects.filter(p => {
      if ((p as any).created_by !== currentUserId) return false;
      const s = p.status?.toLowerCase();
      return s && !['opgeleverd', 'verloren'].includes(s);
    });
  }, [projects, currentUserId]);

  useEffect(() => {
    const fetchDocStatus = async () => {
      if (myProjects.length === 0) {
        setDocLoading(false);
        return;
      }

      try {
        const projectIds = myProjects.map(p => p.id);
        const { data } = await supabase
          .from('documents')
          .select('project_id, distributor_id, folder')
          .in('project_id', projectIds);

        const status: Record<string, { verdelerAanzicht: boolean; installatieSchema: boolean }> = {};

        data?.forEach((doc: any) => {
          if (!doc.distributor_id) return;
          if (!status[doc.distributor_id]) {
            status[doc.distributor_id] = { verdelerAanzicht: false, installatieSchema: false };
          }
          if (doc.folder === 'Verdeler aanzicht' || doc.folder?.startsWith('Verdeler aanzicht/')) {
            status[doc.distributor_id].verdelerAanzicht = true;
          }
          if (doc.folder === 'Installatie schema' || doc.folder?.startsWith('Installatie schema/')) {
            status[doc.distributor_id].installatieSchema = true;
          }
        });

        setDocStatus(status);
      } catch (err) {
        console.error('Error fetching document status:', err);
      } finally {
        setDocLoading(false);
      }
    };

    setDocLoading(true);
    fetchDocStatus();
  }, [myProjects.map(p => p.id).join(',')]);

  const projectIssues = useMemo((): ProjectIssue[] => {
    const issues: ProjectIssue[] = [];

    myProjects.forEach(project => {
      const projectIssueList: string[] = [];
      const s = project.status?.toLowerCase();

      if (['gereed voor facturatie', 'opgeleverd', 'verloren'].includes(s || '')) return;

      if (!project.expected_delivery_date) {
        projectIssueList.push('Geen leverdatum ingesteld');
      }
      if (!project.client || project.client.trim() === '') {
        projectIssueList.push('Geen klant toegewezen');
      }

      const activeVerdelers = project.distributors?.filter((d: any) => {
        const ds = d.status?.toLowerCase();
        return ds && !['opgeleverd', 'gereed voor facturatie'].includes(ds);
      }) || [];

      const unassigned = activeVerdelers.filter((d: any) => !d.toegewezen_monteur || d.toegewezen_monteur.trim() === '');
      if (unassigned.length > 0) {
        projectIssueList.push(`${unassigned.length} verdeler${unassigned.length > 1 ? 's' : ''} zonder monteur`);
      }

      const noHours = activeVerdelers.filter((d: any) => !d.expected_hours);
      if (noHours.length > 0) {
        projectIssueList.push(`${noHours.length} verdeler${noHours.length > 1 ? 's' : ''} zonder uren inschatting`);
      }

      if (s !== 'intake' && s !== 'offerte') {
        const noDeliveryDate = activeVerdelers.filter((d: any) => !d.gewenste_lever_datum);
        if (noDeliveryDate.length > 0) {
          projectIssueList.push(`${noDeliveryDate.length} verdeler${noDeliveryDate.length > 1 ? 's' : ''} zonder gewenste leverdatum`);
        }
      }

      if (!docLoading) {
        const noVerdelerAanzicht = activeVerdelers.filter((d: any) => {
          const ds = d.status?.toLowerCase();
          if (['intake', 'offerte'].includes(ds || '')) return false;
          return !docStatus[d.id]?.verdelerAanzicht;
        });
        if (noVerdelerAanzicht.length > 0) {
          projectIssueList.push(`${noVerdelerAanzicht.length} verdeler${noVerdelerAanzicht.length > 1 ? 's' : ''} zonder Verdeler aanzicht`);
        }

        const noInstallatieSchema = activeVerdelers.filter((d: any) => {
          const ds = d.status?.toLowerCase();
          if (['intake', 'offerte'].includes(ds || '')) return false;
          return !docStatus[d.id]?.installatieSchema;
        });
        if (noInstallatieSchema.length > 0) {
          projectIssueList.push(`${noInstallatieSchema.length} verdeler${noInstallatieSchema.length > 1 ? 's' : ''} zonder Installatie schema`);
        }
      }

      if (projectIssueList.length > 0) {
        issues.push({
          projectId: project.id,
          projectNumber: project.project_number,
          client: project.client || '-',
          issues: projectIssueList,
          issueCount: projectIssueList.length,
        });
      }
    });

    return issues.sort((a, b) => b.issueCount - a.issueCount);
  }, [myProjects, docStatus, docLoading]);

  const totalApprovals = isAdmin ? pendingApprovals.length : 0;
  const totalIssueCount = projectIssues.reduce((sum, p) => sum + p.issueCount, 0);
  const totalTasks = totalApprovals + projectIssues.length;

  const visibleIssues = showAll ? projectIssues : projectIssues.slice(0, 5);

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <ClipboardList size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Mijn Taken</h2>
            <p className="text-xs text-gray-500">
              {myProjects.length} projecten | {totalIssueCount} actiepunten
            </p>
          </div>
        </div>
        {totalTasks > 0 && (
          <span className="flex items-center space-x-1 text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-medium">
            <AlertTriangle size={12} />
            <span>{totalTasks}</span>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[600px]">
        {isAdmin && pendingApprovals.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Shield size={14} className="text-orange-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                Pre-Testing Goedkeuringen
              </span>
              <span className="text-xs text-gray-600">({pendingApprovals.length})</span>
            </div>
            <div className="space-y-2">
              {pendingApprovals.map((approval: any, index: number) => (
                <div
                  key={`approval-${index}`}
                  onClick={() => navigate(`/project/${approval.project?.id}`)}
                  className="border-l-2 border-l-orange-500 bg-orange-500/5 rounded-r-lg p-3 cursor-pointer hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-blue-400">
                          {approval.project?.project_number}
                        </span>
                        <span className="text-xs text-gray-600">|</span>
                        <span className="text-xs text-gray-400 truncate">
                          {approval.distributor?.kast_naam || approval.distributor?.distributor_id}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={10} className="text-gray-500" />
                        <p className="text-xs text-gray-500">
                          Ingediend door {approval.submittedBy}
                          {approval.submittedAt && ` | ${new Date(approval.submittedAt).toLocaleDateString('nl-NL')}`}
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-gray-700 group-hover:text-gray-400 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <TestReviewNotifications embedded />
        )}

        {projectIssues.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <FileWarning size={14} className="text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Onvolledige Projecten
              </span>
              <span className="text-xs text-gray-600">({projectIssues.length})</span>
            </div>
            <div className="space-y-2">
              {visibleIssues.map(project => (
                <div
                  key={project.projectId}
                  onClick={() => onProjectClick(project.projectId)}
                  className="border-l-2 border-l-amber-500 bg-amber-500/5 rounded-r-lg p-3 cursor-pointer hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-blue-400">{project.projectNumber}</span>
                        <span className="text-xs text-gray-600">|</span>
                        <span className="text-xs text-gray-400 truncate">{project.client}</span>
                      </div>
                      <div className="space-y-0.5">
                        {project.issues.map((issue, i) => (
                          <p key={i} className="text-xs text-gray-400 flex items-center space-x-1.5">
                            <AlertTriangle size={10} className="text-amber-500/70 flex-shrink-0" />
                            <span>{issue}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-gray-700 group-hover:text-gray-400 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalTasks === 0 && !docLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 size={40} className="text-emerald-500/30 mb-3" />
            <p className="text-gray-400 text-sm font-medium">Alles bijgewerkt</p>
            <p className="text-gray-600 text-xs mt-1">Geen openstaande taken</p>
          </div>
        )}

        {docLoading && totalTasks === 0 && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {projectIssues.length > 5 && (
        <div className="pt-3 border-t border-gray-800 mt-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center justify-center space-x-1 text-xs text-gray-400 hover:text-blue-400 transition-colors w-full py-1"
          >
            {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showAll ? 'Toon minder' : `Toon alle ${projectIssues.length} projecten`}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTasksWidget;
