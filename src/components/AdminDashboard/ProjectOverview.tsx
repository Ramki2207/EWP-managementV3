import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, FileX, Search, Filter, ChevronDown,
  FolderOpen, Image, FileText, Info, ExternalLink, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Project {
  id: string;
  project_number: string;
  status: string;
  client?: string;
  expected_delivery_date?: string;
  description?: string;
  project_naam?: string;
  location?: string;
  created_by?: string;
  distributors?: any[];
}

interface ProjectOverviewProps {
  projects: Project[];
}

interface VerdelerIssue {
  distributorId: string;
  kastNaam: string;
  missingAanzicht: boolean;
  missingSchema: boolean;
  missingInfo: string[];
}

interface ProjectIssue {
  project: Project;
  missingProjectInfo: string[];
  verdelerIssues: VerdelerIssue[];
  totalIssues: number;
}

type IssueFilter = 'all' | 'documents' | 'info';
type SeverityFilter = 'all' | 'high' | 'medium';

const REQUIRED_FOLDERS = ['Verdeler aanzicht', 'Installatie schema'];

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projects }) => {
  const navigate = useNavigate();
  const [docMap, setDocMap] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const activeProjects = useMemo(() => {
    const active = ['Intake', 'Offerte', 'Order', 'Werkvoorbereiding', 'Productie', 'Testen', 'Levering'];
    return projects.filter(p => active.includes(p.status));
  }, [projects]);

  const loadDocumentData = useCallback(async () => {
    if (activeProjects.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const projectIds = activeProjects.map(p => p.id);
      const { data, error } = await supabase
        .from('documents')
        .select('project_id, distributor_id, folder')
        .in('project_id', projectIds)
        .in('folder', [
          ...REQUIRED_FOLDERS,
          ...REQUIRED_FOLDERS.map(f => `${f}/Actueel`),
        ]);

      if (error) throw error;

      const map: Record<string, Set<string>> = {};
      (data || []).forEach(doc => {
        if (!doc.distributor_id) return;
        const key = `${doc.project_id}:${doc.distributor_id}`;
        if (!map[key]) map[key] = new Set();
        const baseFolder = doc.folder.split('/')[0];
        map[key].add(baseFolder);
      });

      setDocMap(map);
    } catch (err) {
      console.error('Error loading document data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeProjects]);

  useEffect(() => {
    loadDocumentData();
  }, [loadDocumentData]);

  const getMissingProjectInfo = (project: Project): string[] => {
    const missing: string[] = [];
    if (!project.client) missing.push('Klant');
    if (!project.expected_delivery_date) missing.push('Leverdatum');
    if (!project.location) missing.push('Locatie');
    if (!project.distributors || project.distributors.length === 0) missing.push('Verdelers');
    return missing;
  };

  const getMissingVerdelerInfo = (d: any): string[] => {
    const missing: string[] = [];
    if (!d.kast_naam) missing.push('Kastnaam');
    if (!d.systeem) missing.push('Systeem');
    if (!d.voeding) missing.push('Voeding');
    if (!d.toegewezen_monteur) missing.push('Monteur');
    return missing;
  };

  const projectIssues = useMemo((): ProjectIssue[] => {
    return activeProjects
      .map(project => {
        const missingProjectInfo = getMissingProjectInfo(project);
        const verdelerIssues: VerdelerIssue[] = [];

        (project.distributors || []).forEach((d: any) => {
          if (d.status === 'Opgeleverd' || d.is_closed) return;

          const key = `${project.id}:${d.id}`;
          const folders = docMap[key] || new Set();
          const missingAanzicht = !folders.has('Verdeler aanzicht');
          const missingSchema = !folders.has('Installatie schema');
          const missingInfo = getMissingVerdelerInfo(d);

          if (missingAanzicht || missingSchema || missingInfo.length > 0) {
            verdelerIssues.push({
              distributorId: d.id,
              kastNaam: d.kast_naam || d.distributor_id || 'Naamloos',
              missingAanzicht,
              missingSchema,
              missingInfo,
            });
          }
        });

        const totalIssues = missingProjectInfo.length +
          verdelerIssues.reduce((sum, v) =>
            sum + (v.missingAanzicht ? 1 : 0) + (v.missingSchema ? 1 : 0) + v.missingInfo.length, 0
          );

        return { project, missingProjectInfo, verdelerIssues, totalIssues };
      })
      .filter(pi => pi.totalIssues > 0)
      .sort((a, b) => b.totalIssues - a.totalIssues);
  }, [activeProjects, docMap]);

  const filteredIssues = useMemo(() => {
    let result = projectIssues;

    if (issueFilter === 'documents') {
      result = result.filter(pi =>
        pi.verdelerIssues.some(v => v.missingAanzicht || v.missingSchema)
      );
    } else if (issueFilter === 'info') {
      result = result.filter(pi =>
        pi.missingProjectInfo.length > 0 ||
        pi.verdelerIssues.some(v => v.missingInfo.length > 0)
      );
    }

    if (severityFilter === 'high') {
      result = result.filter(pi => pi.totalIssues >= 4);
    } else if (severityFilter === 'medium') {
      result = result.filter(pi => pi.totalIssues >= 2 && pi.totalIssues < 4);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(pi =>
        pi.project.project_number?.toLowerCase().includes(q) ||
        pi.project.client?.toLowerCase().includes(q) ||
        pi.project.project_naam?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [projectIssues, issueFilter, severityFilter, searchQuery]);

  const docIssueCount = projectIssues.filter(pi =>
    pi.verdelerIssues.some(v => v.missingAanzicht || v.missingSchema)
  ).length;

  const infoIssueCount = projectIssues.filter(pi =>
    pi.missingProjectInfo.length > 0 || pi.verdelerIssues.some(v => v.missingInfo.length > 0)
  ).length;

  const getSeverityColor = (issues: number) => {
    if (issues >= 4) return { border: 'border-red-500/30', bg: 'bg-red-500/5' };
    if (issues >= 2) return { border: 'border-amber-500/30', bg: 'bg-amber-500/5' };
    return { border: 'border-gray-700/50', bg: 'bg-[#1E2530]/50' };
  };

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-white">Projecten Werkvoorbereiding</h3>
          <p className="text-xs text-gray-400">
            {projectIssues.length} project{projectIssues.length !== 1 ? 'en' : ''} met aandachtspunten
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setLoading(true); loadDocumentData(); }}
            className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-all"
            title="Vernieuwen"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-all ${
              showFilters ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-700/50 text-gray-500 hover:text-gray-300'
            }`}
          >
            <Filter size={14} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-3 space-y-2 flex-shrink-0 p-3 rounded-lg bg-[#1a1f2b] border border-gray-700/30">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Zoek project..."
              className="w-full bg-[#161b24] border border-gray-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Type</p>
              <div className="flex gap-1">
                {([
                  { key: 'all' as IssueFilter, label: 'Alles' },
                  { key: 'documents' as IssueFilter, label: 'Documenten' },
                  { key: 'info' as IssueFilter, label: 'Informatie' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setIssueFilter(key)}
                    className={`text-[11px] px-2 py-1 rounded-md transition-all ${
                      issueFilter === key
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-500 hover:text-gray-300 bg-[#161b24]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Ernst</p>
              <div className="flex gap-1">
                {([
                  { key: 'all' as SeverityFilter, label: 'Alles' },
                  { key: 'high' as SeverityFilter, label: 'Hoog' },
                  { key: 'medium' as SeverityFilter, label: 'Midden' },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSeverityFilter(key)}
                    className={`text-[11px] px-2 py-1 rounded-md transition-all ${
                      severityFilter === key
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-500 hover:text-gray-300 bg-[#161b24]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3 flex-shrink-0">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <FileX size={14} className="text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-400">{docIssueCount}</p>
            <p className="text-[10px] text-red-400/70">Ontbrekende documenten</p>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Info size={14} className="text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-400">{infoIssueCount}</p>
            <p className="text-[10px] text-amber-400/70">Ontbrekende informatie</p>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw size={24} className="mx-auto text-gray-600 animate-spin mb-3" />
            <p className="text-sm text-gray-500">Documenten controleren...</p>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">
              {projectIssues.length === 0
                ? 'Alle projecten zijn compleet'
                : 'Geen projecten gevonden met deze filters'}
            </p>
          </div>
        ) : (
          filteredIssues.map(({ project, missingProjectInfo, verdelerIssues, totalIssues }) => {
            const severity = getSeverityColor(totalIssues);
            return (
              <div
                key={project.id}
                className={`p-3 rounded-lg border ${severity.border} ${severity.bg} transition-all`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {project.project_number}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">
                        {project.status}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        totalIssues >= 4 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {totalIssues} punt{totalIssues !== 1 ? 'en' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {project.client || 'Geen klant'}
                      {project.project_naam ? ` - ${project.project_naam}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="p-1 rounded hover:bg-gray-700/50 text-gray-500 hover:text-blue-400 transition-all flex-shrink-0"
                    title="Open project"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>

                {missingProjectInfo.length > 0 && (
                  <div className="flex items-start gap-1.5 mb-2">
                    <AlertTriangle size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {missingProjectInfo.map(info => (
                        <span key={info} className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {info}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {verdelerIssues.length > 0 && (
                  <div className="space-y-1.5">
                    {verdelerIssues.map(v => (
                      <div key={v.distributorId} className="pl-2 border-l-2 border-gray-700/40">
                        <p className="text-xs text-gray-400 mb-1 font-medium">{v.kastNaam}</p>
                        <div className="flex flex-wrap gap-1">
                          {v.missingAanzicht && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                              <Image size={10} />
                              Verdeler aanzicht
                            </span>
                          )}
                          {v.missingSchema && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                              <FileText size={10} />
                              Installatie schema
                            </span>
                          )}
                          {v.missingInfo.map(info => (
                            <span key={info} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {info}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;
