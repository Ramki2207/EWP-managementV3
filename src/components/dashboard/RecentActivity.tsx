import React, { useState, useEffect, useMemo } from 'react';
import { Activity, ArrowRight, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RecentActivityProps {
  onProjectClick: (projectId: string) => void;
}

interface ActivityItem {
  id: string;
  projectId: string;
  projectNumber: string;
  client: string;
  action: string;
  timestamp: string;
  actor?: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ onProjectClick }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const { data: notifications } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        const items: ActivityItem[] = (notifications || []).map((n: any) => ({
          id: n.id,
          projectId: n.verdeler_id || '',
          projectNumber: n.project_number || '',
          client: '',
          action: n.description || n.type || 'Actie uitgevoerd',
          timestamp: n.created_at,
          actor: n.worker_name || undefined,
        }));

        setActivities(items);
      } catch (err) {
        console.error('Error fetching activity:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  const visibleActivities = showAll ? activities : activities.slice(0, 5);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Zojuist';
    if (diffMins < 60) return `${diffMins}m geleden`;
    if (diffHours < 24) return `${diffHours}u geleden`;
    if (diffDays < 7) return `${diffDays}d geleden`;
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="card p-5 h-full">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Activity size={18} className="text-blue-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Recente Activiteit</h2>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Activity size={18} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Recente Activiteit</h2>
          <p className="text-[11px] text-gray-500">{activities.length} meldingen</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 max-h-[400px]">
        {visibleActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity size={28} className="mx-auto text-gray-700 mb-2" />
            <p className="text-xs text-gray-500">Geen recente activiteit</p>
          </div>
        ) : (
          visibleActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-gray-800/40 transition-colors group cursor-default"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 leading-relaxed">
                  {activity.actor && (
                    <span className="text-blue-400 font-medium">{activity.actor}</span>
                  )}{' '}
                  {activity.action}
                </p>
                <div className="flex items-center space-x-2 mt-0.5">
                  {activity.projectNumber && (
                    <span className="text-[10px] text-gray-500 font-medium">
                      {activity.projectNumber}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-600">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center justify-center space-x-1 text-xs text-gray-400 hover:text-blue-400 transition-colors w-full pt-3 border-t border-gray-800 mt-2"
        >
          <ChevronDown size={14} className={showAll ? 'rotate-180 transition-transform' : 'transition-transform'} />
          <span>{showAll ? 'Toon minder' : `Toon alle ${activities.length}`}</span>
        </button>
      )}
    </div>
  );
};

export default RecentActivity;
