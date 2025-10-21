import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { dataService } from '../lib/supabase';

interface HoursTrafficLightProps {
  projectId: string;
  showDetails?: boolean;
}

const HoursTrafficLight: React.FC<HoursTrafficLightProps> = ({ projectId, showDetails = false }) => {
  const [hoursData, setHoursData] = useState<{
    totalExpected: number;
    totalWorked: number;
    percentage: number;
    remaining: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHoursData();
  }, [projectId]);

  const loadHoursData = async () => {
    try {
      setLoading(true);
      const data = await dataService.getProjectHoursData(projectId);
      setHoursData(data);
    } catch (error) {
      console.error('Error loading hours data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !hoursData || hoursData.totalExpected === 0) {
    return null;
  }

  const getStatus = () => {
    if (hoursData.percentage <= 40) {
      return {
        color: 'green',
        bgClass: 'bg-green-500',
        textClass: 'text-green-400',
        borderClass: 'border-green-500',
        label: 'Goed',
        icon: Clock
      };
    } else if (hoursData.percentage <= 70) {
      return {
        color: 'orange',
        bgClass: 'bg-orange-500',
        textClass: 'text-orange-400',
        borderClass: 'border-orange-500',
        label: 'Let op',
        icon: TrendingUp
      };
    } else {
      return {
        color: 'red',
        bgClass: 'bg-red-500',
        textClass: 'text-red-400',
        borderClass: 'border-red-500',
        label: 'Kritiek',
        icon: AlertTriangle
      };
    }
  };

  const status = getStatus();
  const Icon = status.icon;
  const remainingPercentage = 100 - hoursData.percentage;

  if (showDetails) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${status.borderClass} bg-[#1A1F2C]`}>
        <div className={`w-3 h-3 rounded-full ${status.bgClass} animate-pulse`}></div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${status.textClass}`} />
            <span className={`text-sm font-medium ${status.textClass}`}>
              {status.label}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {hoursData.totalWorked.toFixed(1)}u / {hoursData.totalExpected.toFixed(1)}u
            <span className="ml-2">({remainingPercentage.toFixed(0)}% over)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" title={`${hoursData.totalWorked.toFixed(1)}u / ${hoursData.totalExpected.toFixed(1)}u (${remainingPercentage.toFixed(0)}% over)`}>
      <div className={`w-3 h-3 rounded-full ${status.bgClass} shadow-lg`}></div>
      <span className={`text-xs ${status.textClass}`}>
        {remainingPercentage.toFixed(0)}%
      </span>
    </div>
  );
};

export default HoursTrafficLight;
