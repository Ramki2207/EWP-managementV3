import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, MapPin, Calendar, User, Phone, Mail, FileText, ExternalLink,
  CheckCircle2, Circle, Clock, ArrowRight, Wrench, Users
} from 'lucide-react';
import type { MyTasksProject } from './MyTasks';

interface MyProjectDetailModalProps {
  project: MyTasksProject;
  onClose: () => void;
}

const PROJECT_STATUSES = [
  'Intake', 'Offerte', 'Order', 'Werkvoorbereiding',
  'Productie', 'Testen', 'Levering', 'Gereed voor facturatie', 'Opgeleverd'
];

const VERDELER_STATUSES = [
  'Offerte', 'Productie', 'Testen', 'Gereed', 'Levering', 'Opgeleverd'
];

const verdelerStatusColors: Record<string, { bg: string; text: string; dot: string }> = {
  'Offerte': { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  'Productie': { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  'Testen': { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  'Gereed': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  'Levering': { bg: 'bg-teal-500/10', text: 'text-teal-400', dot: 'bg-teal-400' },
  'Opgeleverd': { bg: 'bg-green-500/10', text: 'text-green-500', dot: 'bg-green-500' },
};

const projectStatusColors: Record<string, string> = {
  'Intake': 'bg-gray-500',
  'Offerte': 'bg-blue-500',
  'Order': 'bg-cyan-500',
  'Werkvoorbereiding': 'bg-teal-500',
  'Productie': 'bg-amber-500',
  'Testen': 'bg-orange-500',
  'Levering': 'bg-emerald-500',
  'Gereed voor facturatie': 'bg-green-500',
  'Opgeleverd': 'bg-green-600',
};

const MyProjectDetailModal: React.FC<MyProjectDetailModalProps> = ({ project, onClose }) => {
  const navigate = useNavigate();
  const distributors = project.distributors || [];
  const currentStatusIdx = PROJECT_STATUSES.indexOf(project.status);

  const getRemainingSteps = (currentStatus: string): string[] => {
    const idx = VERDELER_STATUSES.indexOf(currentStatus);
    if (idx === -1 || idx >= VERDELER_STATUSES.length - 1) return [];
    return VERDELER_STATUSES.slice(idx + 1);
  };

  const getContactName = () => {
    const parts = [project.contactpersoon_voornaam, project.contactpersoon_achternaam].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : project.contact_person || null;
  };

  const completedDistributors = distributors.filter(
    (d: any) => d.status === 'Opgeleverd' || d.is_delivered || d.is_closed
  ).length;

  const overallProgress = distributors.length > 0
    ? Math.round((completedDistributors / distributors.length) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#161b24] border border-gray-700/50 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">{project.project_number}</h2>
              {project.project_naam && (
                <span className="text-sm text-gray-400">- {project.project_naam}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onClose(); navigate(`/project/${project.id}`); }}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-all"
            >
              <ExternalLink size={13} />
              Open project
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-gray-700/30">
          <div className="flex items-center gap-1">
            {PROJECT_STATUSES.map((status, i) => {
              const isPast = i < currentStatusIdx;
              const isCurrent = i === currentStatusIdx;
              return (
                <div key={status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`h-1.5 w-full rounded-full ${
                        isPast || isCurrent
                          ? projectStatusColors[project.status] || 'bg-gray-500'
                          : 'bg-gray-700/40'
                      }`}
                    />
                    {isCurrent && (
                      <span className="text-[10px] text-gray-400 mt-1 whitespace-nowrap">{status}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-700/30 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Projectinformatie</h3>

            <div className="space-y-3">
              <InfoRow label="Status" value={project.status} />
              <InfoRow label="Klant" value={project.client || '-'} />
              {project.location && <InfoRow label="Locatie" value={project.location} icon={<MapPin size={13} />} />}
              {project.expected_delivery_date && (
                <InfoRow
                  label="Verwachte levering"
                  value={new Date(project.expected_delivery_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  icon={<Calendar size={13} />}
                />
              )}
              {project.aflever_adres && <InfoRow label="Afleveradres" value={project.aflever_adres} icon={<MapPin size={13} />} />}
              {project.referentie_ewp && <InfoRow label="Referentie EWP" value={project.referentie_ewp} />}
              {project.referentie_klant && <InfoRow label="Referentie klant" value={project.referentie_klant} />}
              {project.description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Omschrijving</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{project.description}</p>
                </div>
              )}
            </div>

            {getContactName() && (
              <>
                <div className="border-t border-gray-700/30 pt-4">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contactpersoon</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <User size={13} className="text-gray-500" />
                      {getContactName()}
                    </div>
                    {project.contactpersoon_telefoon && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Phone size={13} className="text-gray-500" />
                        {project.contactpersoon_telefoon}
                      </div>
                    )}
                    {project.contactpersoon_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Mail size={13} className="text-gray-500" />
                        {project.contactpersoon_email}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="border-t border-gray-700/30 pt-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Voortgang</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-300">{overallProgress}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {completedDistributors} van {distributors.length} verdeler{distributors.length !== 1 ? 's' : ''} opgeleverd
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Verdelers ({distributors.length})
              </h3>
            </div>

            {distributors.length === 0 ? (
              <div className="text-center py-8">
                <Users size={28} className="mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">Geen verdelers toegevoegd</p>
              </div>
            ) : (
              <div className="space-y-3">
                {distributors.map((d: any) => {
                  const colors = verdelerStatusColors[d.status] || verdelerStatusColors['Offerte'];
                  const remaining = getRemainingSteps(d.status || 'Offerte');
                  const verdelerStatusIdx = VERDELER_STATUSES.indexOf(d.status || 'Offerte');
                  const isComplete = d.status === 'Opgeleverd' || d.is_delivered || d.is_closed;

                  return (
                    <div
                      key={d.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isComplete
                          ? 'border-green-500/20 bg-green-500/5'
                          : 'border-gray-700/40 bg-[#1E2530]/60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {isComplete ? (
                              <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                            ) : (
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                            )}
                            <span className="text-sm font-medium text-white truncate">
                              {d.kast_naam || d.distributor_id || 'Naamloos'}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {d.status || 'Offerte'}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 mb-2">
                        {VERDELER_STATUSES.map((s, i) => (
                          <div
                            key={s}
                            className={`h-1 flex-1 rounded-full ${
                              i <= verdelerStatusIdx
                                ? colors.dot
                                : 'bg-gray-700/40'
                            }`}
                            title={s}
                          />
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        {d.toegewezen_monteur && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Wrench size={11} />
                            <span>{d.toegewezen_monteur}</span>
                          </div>
                        )}
                        {d.gewenste_lever_datum && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Calendar size={11} />
                            <span>{new Date(d.gewenste_lever_datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        )}

                        {remaining.length > 0 && !isComplete && (
                          <div className="mt-2 pt-2 border-t border-gray-700/30">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Nog te doen</p>
                            <div className="flex flex-wrap gap-1">
                              {remaining.map(step => (
                                <span
                                  key={step}
                                  className="text-[11px] px-1.5 py-0.5 rounded bg-gray-700/40 text-gray-400"
                                >
                                  {step}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {isComplete && (
                          <p className="text-xs text-green-500/80 mt-1">Volledig afgerond</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-start gap-2">
    {icon && <span className="text-gray-500 mt-0.5 flex-shrink-0">{icon}</span>}
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-300">{value}</p>
    </div>
  </div>
);

export default MyProjectDetailModal;
