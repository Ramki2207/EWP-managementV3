import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, FileX, Search, Filter, X,
  FolderOpen, Image, FileText, Info, ExternalLink, RefreshCw,
  ChevronRight, CheckCircle2
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
  userId: string;
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
  docIssues: number;
  infoIssues: number;
}

type IssueFilter = 'all' | 'documents' | 'info';

const REQUIRED_FOLDERS = ['Verdeler aanzicht', 'Installatie schema'];

type ProjectScope = 'mine' | 'all';

const ProjectOverview: React.FC<ProjectOverviewProps> = ({ projects, userId }) => {
  const navigate = useNavigate();
  const [docMap, setDocMap] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [issueFilter, setIssueFilter] = useState<IssueFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectIssue | null>(null);
  const [projectScope, setProjectScope] = useState<ProjectScope>('mine');

  const scopedProjects = useMemo(() => {
    if (projectScope === 'mine') return projects.filter(p => p.created_by === userId);
    return projects;
  }, [projects, userId, projectScope]);

  const activeProjects = useMemo(() => {
    const active = ['Intake', 'Offerte', 'Order', 'Werkvoorbereiding', 'Productie', 'Testen', 'Levering'];
    return scopedProjects.filter(p => active.includes(p.status));
  }, [scopedProjects]);

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

        const docIssues = verdelerIssues.reduce((sum, v) =>
          sum + (v.missingAanzicht ? 1 : 0) + (v.missingSchema ? 1 : 0), 0
        );
        const infoIssues = missingProjectInfo.length +
          verdelerIssues.reduce((sum, v) => sum + v.missingInfo.length, 0);
        const totalIssues = docIssues + infoIssues;

        return { project, missingProjectInfo, verdelerIssues, totalIssues, docIssues, infoIssues };
      })
      .filter(pi => pi.totalIssues > 0)
      .sort((a, b) => b.totalIssues - a.totalIssues);
  }, [activeProjects, docMap]);

  const filteredIssues = useMemo(() => {
    let result = projectIssues;

    if (issueFilter === 'documents') {
      result = result.filter(pi => pi.docIssues > 0);
    } else if (issueFilter === 'info') {
      result = result.filter(pi => pi.infoIssues > 0);
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
  }, [projectIssues, issueFilter, searchQuery]);

  const totalDocIssues = projectIssues.reduce((s, pi) => s + pi.docIssues, 0);
  const totalInfoIssues = projectIssues.reduce((s, pi) => s + pi.infoIssues, 0);

  return (
    <>
      <div className="card h-full flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">Projecten Werkvoorbereiding</h3>
            <p className="text-xs text-gray-400">
              {projectIssues.length} project{projectIssues.length !== 1 ? 'en' : ''} met aandachtspunten
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#1a1f2b] rounded-lg p-0.5">
              {([
                { key: 'mine' as ProjectScope, label: 'Mijn Projecten' },
                { key: 'all' as ProjectScope, label: 'Alle Projecten' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setProjectScope(key)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                    projectScope === key
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setLoading(true); loadDocumentData(); }}
              className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-all"
              title="Vernieuwen"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-3 flex-shrink-0">
          <button
            onClick={() => setIssueFilter(issueFilter === 'documents' ? 'all' : 'documents')}
            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
              issueFilter === 'documents'
                ? 'bg-red-500/15 border-red-500/40 ring-1 ring-red-500/20'
                : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
            }`}
          >
            <FileX size={14} className="text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-400">{totalDocIssues}</p>
              <p className="text-[10px] text-red-400/70">Documenten</p>
            </div>
          </button>
          <button
            onClick={() => setIssueFilter(issueFilter === 'info' ? 'all' : 'info')}
            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
              issueFilter === 'info'
                ? 'bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/20'
                : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
            }`}
          >
            <Info size={14} className="text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-400">{totalInfoIssues}</p>
              <p className="text-[10px] text-amber-400/70">Informatie</p>
            </div>
          </button>
        </div>

        <div className="relative mb-3 flex-shrink-0">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Zoek op project, klant..."
            className="w-full bg-[#161b24] border border-gray-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw size={20} className="mx-auto text-gray-600 animate-spin mb-2" />
              <p className="text-xs text-gray-500">Controleren...</p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen size={28} className="mx-auto text-gray-600 mb-2" />
              <p className="text-sm text-gray-400">
                {projectIssues.length === 0
                  ? 'Alle projecten zijn compleet'
                  : 'Geen resultaten'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredIssues.map((pi) => (
                <button
                  key={pi.project.id}
                  onClick={() => setSelectedProject(pi)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#1E2530] transition-all text-left group"
                >
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    pi.totalIssues >= 4 ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {pi.project.project_number}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400 flex-shrink-0">
                        {pi.project.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">
                      {pi.project.client || 'Geen klant'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pi.docIssues > 0 && (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                        <FileX size={10} />
                        {pi.docIssues}
                      </span>
                    )}
                    {pi.infoIssues > 0 && (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                        <Info size={10} />
                        {pi.infoIssues}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <ProjectDetailModal
          projectIssue={selectedProject}
          onClose={() => setSelectedProject(null)}
          onNavigate={(id) => navigate(`/projects/${id}`)}
        />
      )}
    </>
  );
};

interface ProjectDetailModalProps {
  projectIssue: ProjectIssue;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ projectIssue, onClose, onNavigate }) => {
  const { project, missingProjectInfo, verdelerIssues, totalIssues } = projectIssue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#1a1f2b] border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/40">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white truncate">
                {project.project_number}
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">
                {project.status}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                totalIssues >= 4 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {totalIssues} punt{totalIssues !== 1 ? 'en' : ''}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {project.client || 'Geen klant'}
              {project.project_naam ? ` — ${project.project_naam}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
            <button
              onClick={() => onNavigate(project.id)}
              className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-blue-400 transition-all"
              title="Open project"
            >
              <ExternalLink size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4 custom-scrollbar">
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Projectgegevens
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Klant', value: project.client, key: 'Klant' },
                { label: 'Leverdatum', value: project.expected_delivery_date, key: 'Leverdatum' },
                { label: 'Locatie', value: project.location, key: 'Locatie' },
                { label: 'Verdelers', value: project.distributors?.length ? `${project.distributors.length} verdeler(s)` : null, key: 'Verdelers' },
              ].map(({ label, value, key }) => {
                const isMissing = missingProjectInfo.includes(key);
                return (
                  <div
                    key={key}
                    className={`px-3 py-2 rounded-lg border ${
                      isMissing
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-[#161b24] border-gray-700/30'
                    }`}
                  >
                    <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
                    {isMissing ? (
                      <p className="text-xs text-amber-400 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Ontbreekt
                      </p>
                    ) : (
                      <p className="text-xs text-white truncate">{value}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {verdelerIssues.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Verdelers ({verdelerIssues.length} met aandachtspunten)
              </h4>
              <div className="space-y-2">
                {verdelerIssues.map(v => {
                  const issueCount = (v.missingAanzicht ? 1 : 0) + (v.missingSchema ? 1 : 0) + v.missingInfo.length;
                  return (
                    <div
                      key={v.distributorId}
                      className="rounded-lg border border-gray-700/30 bg-[#161b24] overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/20">
                        <span className="text-sm font-medium text-white">{v.kastNaam}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          issueCount >= 3 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {issueCount} punt{issueCount !== 1 ? 'en' : ''}
                        </span>
                      </div>

                      <div className="px-3 py-2 space-y-1.5">
                        <div className="grid grid-cols-2 gap-1.5">
                          <DocStatus label="Verdeler aanzicht" missing={v.missingAanzicht} />
                          <DocStatus label="Installatie schema" missing={v.missingSchema} />
                        </div>
                        {v.missingInfo.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {v.missingInfo.map(info => (
                              <span key={info} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                <AlertTriangle size={9} />
                                {info}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DocStatus: React.FC<{ label: string; missing: boolean }> = ({ label, missing }) => (
  <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] ${
    missing
      ? 'bg-red-500/10 text-red-400 border border-red-500/15'
      : 'bg-green-500/10 text-green-400 border border-green-500/15'
  }`}>
    {missing ? <FileX size={11} /> : <CheckCircle2 size={11} />}
    <span className="truncate">{label}</span>
  </div>
);

export default ProjectOverview;
