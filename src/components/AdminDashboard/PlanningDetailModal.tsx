import React, { useState, useEffect, useMemo } from 'react';
import { X, ExternalLink, Clock, Calendar, User, MapPin, AlertTriangle, ChevronRight } from 'lucide-react';
import { format, differenceInCalendarDays, isPast, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { ScheduledBlock } from './planningTypes';
import { useNavigate } from 'react-router-dom';

interface PlanningDetailModalProps {
  block: ScheduledBlock;
  onClose: () => void;
}

interface WorkEntry {
  id: string;
  date: string;
  hours: number;
  phase: string | null;
  notes: string | null;
  worker_name: string;
}

interface ProjectInfo {
  project_number: string;
  client: string;
  location: string | null;
  description: string | null;
  expected_delivery_date: string | null;
  contact_person: string | null;
  project_naam: string | null;
  referentie_klant: string | null;
}

interface VerdelerInfo {
  kast_naam: string;
  status: string;
  systeem: string | null;
  voeding: string | null;
  expected_hours: number;
  expected_werkvoorbereiding_hours: number | null;
  expected_productie_hours: number | null;
  expected_testen_hours: number | null;
  gewenste_lever_datum: string | null;
  toegewezen_monteur: string;
  delivery_week: number | null;
}

const PlanningDetailModal: React.FC<PlanningDetailModalProps> = ({ block, onClose }) => {
  const navigate = useNavigate();
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [verdelerInfo, setVerdelerInfo] = useState<VerdelerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      const [projectRes, verdelerRes, workRes] = await Promise.all([
        supabase
          .from('projects')
          .select('project_number, client, location, description, expected_delivery_date, contact_person, project_naam, referentie_klant')
          .eq('id', block.verdeler.project_id)
          .maybeSingle(),
        supabase
          .from('distributors')
          .select('kast_naam, status, systeem, voeding, expected_hours, expected_werkvoorbereiding_hours, expected_productie_hours, expected_testen_hours, gewenste_lever_datum, toegewezen_monteur, delivery_week')
          .eq('id', block.verdeler.id)
          .maybeSingle(),
        supabase
          .from('work_entries')
          .select('id, date, hours, phase, notes, worker_id')
          .eq('distributor_id', block.verdeler.id)
          .order('date', { ascending: false }),
      ]);

      if (projectRes.data) setProjectInfo(projectRes.data);
      if (verdelerRes.data) setVerdelerInfo(verdelerRes.data);

      if (workRes.data && workRes.data.length > 0) {
        const workerIds = [...new Set(workRes.data.map((w: any) => w.worker_id).filter(Boolean))];
        let usernameMap: Record<string, string> = {};
        if (workerIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, username')
            .in('id', workerIds);
          (users || []).forEach((u: any) => { usernameMap[u.id] = u.username; });
        }
        setWorkEntries(
          workRes.data.map((w: any) => ({
            id: w.id,
            date: w.date,
            hours: w.hours || 0,
            phase: w.phase,
            notes: w.notes,
            worker_name: usernameMap[w.worker_id] || 'Onbekend',
          }))
        );
      }
      setLoading(false);
    };
    loadDetails();
  }, [block.verdeler.id, block.verdeler.project_id]);

  const deadline = verdelerInfo?.gewenste_lever_datum?.split('T')[0] || block.verdeler.project_delivery_date;
  const isOverdue = deadline ? isPast(parseISO(deadline)) : false;
  const daysUntilDeadline = deadline ? differenceInCalendarDays(parseISO(deadline), new Date()) : null;

  const totalWorked = useMemo(() =>
    workEntries.reduce((sum, e) => sum + e.hours, 0),
    [workEntries]
  );

  const phaseHours = useMemo(() => {
    const map: Record<string, number> = {};
    workEntries.forEach(e => {
      const phase = e.phase || 'Overig';
      map[phase] = (map[phase] || 0) + e.hours;
    });
    return map;
  }, [workEntries]);

  const expectedTotal = verdelerInfo?.expected_hours || block.verdeler.expected_hours;
  const progressPercent = expectedTotal > 0 ? Math.min((totalWorked / expectedTotal) * 100, 100) : 0;

  const dailySchedule = useMemo(() => {
    return Object.entries(block.dailyHours)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, hours]) => ({ date, hours }));
  }, [block.dailyHours]);

  const totalScheduledHours = useMemo(() =>
    dailySchedule.reduce((sum, d) => sum + d.hours, 0),
    [dailySchedule]
  );

  const STATUS_COLORS: Record<string, string> = {
    'Productie': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Testen': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'Werkvoorbereiding': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    'Levering': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  const handleGoToProject = () => {
    onClose();
    navigate(`/project/${block.verdeler.project_id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#1A1F2C] border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/40">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white truncate">
                {block.verdeler.kast_naam}
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[block.verdeler.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                {block.verdeler.status}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {block.verdeler.project_number} &middot; {block.verdeler.client}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0 ml-3"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <InfoCard
                  icon={<User size={14} />}
                  label="Monteur"
                  value={block.monteur}
                  color="text-blue-400"
                />
                <InfoCard
                  icon={<MapPin size={14} />}
                  label="Locatie"
                  value={projectInfo?.location || '-'}
                  color="text-teal-400"
                />
                <InfoCard
                  icon={<Calendar size={14} />}
                  label="Deadline"
                  value={deadline ? format(parseISO(deadline), 'd MMMM yyyy', { locale: nl }) : 'Geen deadline'}
                  color={isOverdue ? 'text-red-400' : 'text-emerald-400'}
                  subtitle={
                    daysUntilDeadline !== null
                      ? daysUntilDeadline < 0
                        ? `${Math.abs(daysUntilDeadline)} dagen over deadline`
                        : daysUntilDeadline === 0
                          ? 'Vandaag!'
                          : `Nog ${daysUntilDeadline} dagen`
                      : undefined
                  }
                />
                {verdelerInfo?.delivery_week && (
                  <InfoCard
                    icon={<Calendar size={14} />}
                    label="Leverweek"
                    value={`Week ${verdelerInfo.delivery_week}`}
                    color="text-gray-300"
                  />
                )}
              </div>

              {(verdelerInfo?.systeem || verdelerInfo?.voeding || projectInfo?.referentie_klant) && (
                <div className="rounded-xl border border-gray-700/30 bg-gray-800/20 p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Verdeler details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {verdelerInfo?.systeem && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Systeem</p>
                        <p className="text-sm text-gray-200">{verdelerInfo.systeem}</p>
                      </div>
                    )}
                    {verdelerInfo?.voeding && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Voeding</p>
                        <p className="text-sm text-gray-200">{verdelerInfo.voeding}</p>
                      </div>
                    )}
                    {projectInfo?.referentie_klant && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Ref. klant</p>
                        <p className="text-sm text-gray-200">{projectInfo.referentie_klant}</p>
                      </div>
                    )}
                    {projectInfo?.contact_person && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Contactpersoon</p>
                        <p className="text-sm text-gray-200">{projectInfo.contact_person}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-gray-700/30 bg-gray-800/20 p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  <Clock size={12} className="inline mr-1.5 -mt-0.5" />
                  Uren overzicht
                </h3>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Gewerkt: <span className="text-white font-medium">{totalWorked}u</span></span>
                      <span className="text-gray-400">Verwacht: <span className="text-white font-medium">{expectedTotal}u</span></span>
                    </div>
                    <div className="h-2.5 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progressPercent >= 100 ? 'bg-emerald-500' : progressPercent >= 75 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {Math.round(progressPercent)}% afgerond &middot; Nog {Math.max(0, expectedTotal - totalWorked)}u resterend
                    </p>
                  </div>
                </div>

                {(verdelerInfo?.expected_werkvoorbereiding_hours || verdelerInfo?.expected_productie_hours || verdelerInfo?.expected_testen_hours) && (
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-700/30">
                    <PhaseBlock
                      label="Werkvoorbereiding"
                      expected={verdelerInfo?.expected_werkvoorbereiding_hours || 0}
                      actual={phaseHours['werkvoorbereiding'] || phaseHours['Werkvoorbereiding'] || 0}
                      color="teal"
                    />
                    <PhaseBlock
                      label="Productie"
                      expected={verdelerInfo?.expected_productie_hours || 0}
                      actual={phaseHours['productie'] || phaseHours['Productie'] || 0}
                      color="blue"
                    />
                    <PhaseBlock
                      label="Testen"
                      expected={verdelerInfo?.expected_testen_hours || 0}
                      actual={phaseHours['testen'] || phaseHours['Testen'] || 0}
                      color="orange"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-700/30 bg-gray-800/20 p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  <Calendar size={12} className="inline mr-1.5 -mt-0.5" />
                  Ingepland ({totalScheduledHours}u over {dailySchedule.length} dagen)
                </h3>
                <div className="grid grid-cols-5 gap-1.5">
                  {dailySchedule.map(({ date, hours }) => (
                    <div
                      key={date}
                      className="rounded-lg border border-gray-700/30 bg-gray-800/40 p-2 text-center"
                    >
                      <p className="text-[10px] text-gray-500">
                        {format(parseISO(date), 'EEE', { locale: nl })}
                      </p>
                      <p className="text-xs font-medium text-gray-200">
                        {format(parseISO(date), 'd MMM', { locale: nl })}
                      </p>
                      <p className="text-sm font-bold text-blue-400 mt-0.5">{hours}u</p>
                    </div>
                  ))}
                </div>
              </div>

              {workEntries.length > 0 && (
                <div className="rounded-xl border border-gray-700/30 bg-gray-800/20 p-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Uren registratie ({workEntries.length} boekingen)
                  </h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {workEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-gray-700/20 transition-colors"
                      >
                        <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                          {format(parseISO(entry.date), 'd MMM yyyy', { locale: nl })}
                        </span>
                        <span className="text-xs font-medium text-white w-8 text-right flex-shrink-0">{entry.hours}u</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{entry.worker_name}</span>
                        {entry.phase && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-700/40 text-gray-400 flex-shrink-0">{entry.phase}</span>
                        )}
                        {entry.notes && (
                          <span className="text-[10px] text-gray-600 truncate">{entry.notes}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isOverdue && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">
                    De deadline van deze verdeler is verlopen. Neem actie om de planning bij te stellen.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-700/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Sluiten
          </button>
          <button
            onClick={handleGoToProject}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium"
          >
            Naar project
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  subtitle?: string;
}> = ({ icon, label, value, color, subtitle }) => (
  <div className="rounded-xl border border-gray-700/30 bg-gray-800/20 p-3">
    <div className="flex items-center gap-1.5 mb-1">
      <span className={color}>{icon}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-sm font-medium ${color}`}>{value}</p>
    {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

const PhaseBlock: React.FC<{
  label: string;
  expected: number;
  actual: number;
  color: string;
}> = ({ label, expected, actual, color }) => {
  const percent = expected > 0 ? Math.min((actual / expected) * 100, 100) : 0;
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
  };
  return (
    <div className="text-center">
      <p className="text-[10px] text-gray-500 mb-1 truncate">{label}</p>
      <p className="text-xs font-medium text-gray-200">{actual}/{expected}u</p>
      <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden mt-1">
        <div
          className={`h-full rounded-full ${colorMap[color] || 'bg-gray-500'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default PlanningDetailModal;
