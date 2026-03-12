import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Timer {
  id: string;
  distributorId: string;
  distributorName: string;
  projectNumber: string;
  projectId: string;
  startTime: string;
  elapsedSeconds: number;
}

interface TimerContextType {
  timers: Timer[];
  startTimer: (distributorId: string, distributorName: string, projectNumber: string, projectId: string) => void;
  stopTimer: (timerId: string) => Promise<{ hours: number; projectNumber: string }>;
  isTimerRunning: (distributorId: string) => boolean;
  getTimerByDistributor: (distributorId: string) => Timer | undefined;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TIMER_STORAGE_KEY = 'production_timers';

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timers, setTimers] = useState<Timer[]>(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers =>
        prevTimers.map(timer => {
          const now = new Date();
          const start = new Date(timer.startTime);
          const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
          return { ...timer, elapsedSeconds: elapsed };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers));
  }, [timers]);

  const startTimer = (distributorId: string, distributorName: string, projectNumber: string, projectId: string) => {
    const existingTimer = timers.find(t => t.distributorId === distributorId);
    if (existingTimer) {
      return;
    }

    const newTimer: Timer = {
      id: `${distributorId}-${Date.now()}`,
      distributorId,
      distributorName,
      projectNumber,
      projectId,
      startTime: new Date().toISOString(),
      elapsedSeconds: 0
    };

    setTimers(prev => [...prev, newTimer]);
  };

  const stopTimer = async (timerId: string): Promise<{ hours: number; projectNumber: string }> => {
    const timer = timers.find(t => t.id === timerId);
    if (!timer) return { hours: 0, projectNumber: '' };

    const endTime = new Date();
    const startTime = new Date(timer.startTime);
    const elapsedMs = endTime.getTime() - startTime.getTime();
    let hours = elapsedMs / (1000 * 60 * 60);
    hours = Math.max(0.01, Math.round(hours * 100) / 100);

    setTimers(prev => prev.filter(t => t.id !== timerId));

    return { hours, projectNumber: timer.projectNumber };
  };

  const isTimerRunning = (distributorId: string): boolean => {
    return timers.some(t => t.distributorId === distributorId);
  };

  const getTimerByDistributor = (distributorId: string): Timer | undefined => {
    return timers.find(t => t.distributorId === distributorId);
  };

  return (
    <TimerContext.Provider value={{ timers, startTimer, stopTimer, isTimerRunning, getTimerByDistributor }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
