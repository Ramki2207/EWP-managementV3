import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TimerState {
  isRunning: boolean;
  distributorId: string | null;
  distributorName: string | null;
  projectNumber: string | null;
  projectId: string | null;
  startTime: string | null;
  elapsedSeconds: number;
}

interface TimerContextType {
  timerState: TimerState;
  startTimer: (distributorId: string, distributorName: string, projectNumber: string, projectId: string) => void;
  stopTimer: () => Promise<number>;
  clearTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TIMER_STORAGE_KEY = 'production_timer_state';

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          isRunning: false,
          distributorId: null,
          distributorName: null,
          projectNumber: null,
          projectId: null,
          startTime: null,
          elapsedSeconds: 0
        };
      }
    }
    return {
      isRunning: false,
      distributorId: null,
      distributorName: null,
      projectNumber: null,
      projectId: null,
      startTime: null,
      elapsedSeconds: 0
    };
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerState.isRunning && timerState.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const start = new Date(timerState.startTime!);
        const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
        setTimerState(prev => ({ ...prev, elapsedSeconds: elapsed }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isRunning, timerState.startTime]);

  useEffect(() => {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
  }, [timerState]);

  const startTimer = (distributorId: string, distributorName: string, projectNumber: string, projectId: string) => {
    const newState: TimerState = {
      isRunning: true,
      distributorId,
      distributorName,
      projectNumber,
      projectId,
      startTime: new Date().toISOString(),
      elapsedSeconds: 0
    };
    setTimerState(newState);
  };

  const stopTimer = async (): Promise<number> => {
    if (!timerState.startTime) return 0;

    const endTime = new Date();
    const startTime = new Date(timerState.startTime);
    const elapsedMs = endTime.getTime() - startTime.getTime();
    let hours = elapsedMs / (1000 * 60 * 60);
    hours = Math.max(0.01, Math.round(hours * 100) / 100);

    return hours;
  };

  const clearTimer = () => {
    setTimerState({
      isRunning: false,
      distributorId: null,
      distributorName: null,
      projectNumber: null,
      projectId: null,
      startTime: null,
      elapsedSeconds: 0
    });
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  return (
    <TimerContext.Provider value={{ timerState, startTimer, stopTimer, clearTimer }}>
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
