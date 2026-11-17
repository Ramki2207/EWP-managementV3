import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FlaskConical, ChevronRight, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';
import VerdelerPreTestingApproval from './VerdelerPreTestingApproval';
import PreTestingApproval from './PreTestingApproval';

interface PendingApproval {
  project: any;
  distributor: any;
  submittedBy?: string;
  submittedAt?: string;
}

interface PendingProjectApproval {
  project: any;
  submittedBy?: string;
  submittedAt?: string;
}

type ReviewItem =
  | ({ level: 'verdeler' } & PendingApproval)
  | ({ level: 'project' } & PendingProjectApproval);

interface TesterWorkboardProps {
  pendingApprovals: PendingApproval[];
  pendingProjectApprovals: PendingProjectApproval[];
  projects: any[];
  currentUser: any;
  onChanged: () => void;
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : '';

const TesterWorkboard: React.FC<TesterWorkboardProps> = ({ pendingApprovals, pendingProjectApprovals, projects, currentUser, onChanged }) => {
  const navigate = useNavigate();
  const [reviewing, setReviewing] = useState<ReviewItem | null>(null);

  const submitted = useMemo<ReviewItem[]>(() => [
    ...pendingProjectApprovals.map(item => ({ level: 'project' as const, ...item })),
    ...pendingApprovals.map(item => ({ level: 'verdeler' as const, ...item }))
  ].sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()),
  [pendingApprovals, pendingProjectApprovals]);

  const myVerdelers = useMemo(() => {
    const items: { project: any; distributor: any }[] = [];
    projects.forEach(project => {
      (project.distributors || []).forEach((distributor: any) => {
        if (
          distributor.status?.toLowerCase() === 'testen' &&
          distributor.toegewezen_tester === currentUser?.username
        ) {
          items.push({ project, distributor });
        }
      });
    });
    return items;
  }, [projects, currentUser?.username]);

  const handleApprove = async () => {
    if (!reviewing) return;
    try {
      if (reviewing.level === 'verdeler') {
        await dataService.updateDistributor(reviewing.distributor.id, { status: 'Testen' });
      } else if (reviewing.project.status?.toLowerCase() !== 'testen') {
        await dataService.updateProject(reviewing.project.id, { ...reviewing.project, status: 'Testen' });
      }
    } catch (error) {
      console.error('Error setting status to Testen:', error);
      toast.error('Status kon niet worden bijgewerkt');
    }
    if (reviewing.level === 'project') setReviewing(null);
    onChanged();
  };

  const handleDecline = async () => {
    if (!reviewing) return;
    if (reviewing.level === 'verdeler') {
      try {
        await dataService.updateDistributor(reviewing.distributor.id, { status: 'Productie' });
      } catch (error) {
        console.error('Error setting verdeler back to Productie:', error);
        toast.error('Status kon niet worden bijgewerkt');
      }
    } else {
      setReviewing(null);
    }
    onChanged();
  };

  return (
    <div className="mx-4 md:mx-8 mb-6 md:mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <section className="card p-5 md:p-6 border border-amber-500/20">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/15 rounded-lg">
              <ClipboardCheck size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">Ingediende verdelers om te testen</h2>
              <p className="text-xs text-gray-400">Pre-checklists van monteurs die wachten op beoordeling</p>
            </div>
          </div>
          <span className="min-w-[2rem] text-center px-2.5 py-1 rounded-full text-sm font-semibold bg-amber-500/15 text-amber-300">
            {submitted.length}
          </span>
        </header>

        {submitted.length === 0 ? (
          <EmptyState text="Geen nieuwe aanvragen. Zodra een monteur een pre-checklist indient, verschijnt die hier." />
        ) : (
          <ul className="space-y-2">
            {submitted.map(item => (
              <li key={item.level === 'verdeler' ? item.distributor.id : `project-${item.project.id}`}>
                <button
                  onClick={() => setReviewing(item)}
                  className="group w-full text-left p-3 md:p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">
                        {item.project.project_number} · {item.level === 'verdeler' ? item.distributor.distributor_id : 'Heel project'}
                        {item.level === 'verdeler' && item.distributor.kast_naam && <span className="text-gray-400 font-normal"> · {item.distributor.kast_naam}</span>}
                        {item.level === 'project' && <span className="text-gray-400 font-normal"> · {item.project.distributors?.length || 0} verdelers</span>}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {item.project.client && `${item.project.client} · `}
                        Ingediend door {item.submittedBy || 'onbekend'} {item.submittedAt && `op ${formatDate(item.submittedAt)}`}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-amber-300 whitespace-nowrap">
                      Beoordelen
                      <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5 md:p-6 border border-sky-500/20">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/15 rounded-lg">
              <FlaskConical size={20} className="text-sky-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">Mijn verdelers om te testen</h2>
              <p className="text-xs text-gray-400">Door jou goedgekeurd en klaar voor de testprocedure</p>
            </div>
          </div>
          <span className="min-w-[2rem] text-center px-2.5 py-1 rounded-full text-sm font-semibold bg-sky-500/15 text-sky-300">
            {myVerdelers.length}
          </span>
        </header>

        {myVerdelers.length === 0 ? (
          <EmptyState text="Nog geen verdelers. Keur een ingediende pre-checklist goed om hem hier te zien." />
        ) : (
          <ul className="space-y-2">
            {myVerdelers.map(({ project, distributor }) => (
              <li key={distributor.id}>
                <button
                  onClick={() => navigate(`/verdelers/${distributor.id}`)}
                  className="group w-full text-left p-3 md:p-4 rounded-lg border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">
                        {project.project_number} · {distributor.distributor_id}
                        {distributor.kast_naam && <span className="text-gray-400 font-normal"> · {distributor.kast_naam}</span>}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {project.client || 'Geen klant'}{project.location && ` · ${project.location}`}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-sky-300 whitespace-nowrap">
                      Testen
                      <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewing?.level === 'project' && (
        <PreTestingApproval
          project={reviewing.project}
          currentUser={currentUser}
          onCancel={() => setReviewing(null)}
          onApprove={handleApprove}
          onDecline={handleDecline}
        />
      )}

      {reviewing?.level === 'verdeler' && (
        <VerdelerPreTestingApproval
          distributor={reviewing.distributor}
          currentUser={currentUser}
          onClose={() => setReviewing(null)}
          onApprove={handleApprove}
          onDecline={handleDecline}
        />
      )}
    </div>
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-lg border border-dashed border-gray-700">
    <Inbox size={28} className="text-gray-600 mb-2" />
    <p className="text-sm text-gray-400 max-w-xs">{text}</p>
  </div>
);

export default TesterWorkboard;
