import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lock, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { ProjectLock, projectLockManager } from '../lib/projectLocks';

interface ProjectLockStatusProps {
  projectId: string;
  projectLocks: ProjectLock[];
  currentUserId: string;
  currentUserRole: string;
  onForceUnlock?: () => void;
  compact?: boolean;
}

const ProjectLockStatus: React.FC<ProjectLockStatusProps> = ({
  projectId,
  projectLocks,
  currentUserId,
  currentUserRole,
  onForceUnlock,
  compact = false
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);

      // Calculate position
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPopupPosition({
          top: rect.top - 10,
          left: rect.left
        });
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);
  const projectLock = projectLocks.find(lock => lock.project_id === projectId && lock.is_active);
  
  if (!projectLock) {
    // Project is available
    return (
      <div className={`flex items-center space-x-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <CheckCircle size={compact ? 14 : 16} className="text-green-400" />
        <span className="text-green-400 font-medium">Beschikbaar</span>
      </div>
    );
  }

  const isOwnLock = projectLock.user_id === currentUserId;
  const timeSinceLocked = projectLockManager.getTimeSinceLocked(projectLock.locked_at);
  const timeSinceActivity = projectLockManager.getTimeSinceActivity(projectLock.last_activity);
  
  // Check if lock is stale (no activity for more than 3 minutes)
  const isStale = new Date().getTime() - new Date(projectLock.last_activity).getTime() > 3 * 60 * 1000;

  if (isOwnLock) {
    // User's own lock
    return (
      <div className={`flex items-center space-x-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <div className="relative">
          <Lock size={compact ? 14 : 16} className="text-blue-400" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        </div>
        <span className="text-blue-400 font-medium">
          {compact ? 'Jij' : 'Je werkt hier'}
        </span>
      </div>
    );
  }

  if (isStale) {
    // Stale lock
    return (
      <>
        <div
          ref={triggerRef}
          onClick={() => !compact && setShowPopup(!showPopup)}
          className={`flex items-center space-x-2 ${compact ? 'text-xs' : 'text-sm'} ${!compact ? 'cursor-pointer' : ''}`}
        >
          <AlertTriangle size={compact ? 14 : 16} className="text-yellow-400" />
          <span className="text-yellow-400 font-medium">
            {compact ? projectLock.username.split(' ')[0] : `Inactief (${timeSinceActivity})`}
          </span>
        </div>

        {!compact && showPopup && createPortal(
          <div
            ref={popupRef}
            className="fixed z-[9999]"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              transform: 'translateY(-100%)'
            }}
          >
            <div
              className="border-2 border-yellow-500 rounded-lg p-4 shadow-2xl min-w-64"
              style={{
                backgroundColor: '#1f2937',
                opacity: 1
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-yellow-400" />
                  <span className="font-medium text-yellow-400">Inactieve vergrendeling</span>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-1 text-sm text-gray-300 mb-3">
                <p><strong>Gebruiker:</strong> {projectLock.username}</p>
                <p><strong>Vergrendeld:</strong> {timeSinceLocked} geleden</p>
                <p><strong>Laatste activiteit:</strong> {timeSinceActivity}</p>
              </div>
              {currentUserRole === 'admin' && onForceUnlock && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onForceUnlock();
                    setShowPopup(false);
                  }}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm transition-colors font-medium"
                >
                  Forceer ontgrendelen
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // Active lock by another user
  return (
    <>
      <div
        ref={triggerRef}
        onClick={() => !compact && setShowPopup(!showPopup)}
        className={`flex items-center space-x-2 ${compact ? 'text-xs' : 'text-sm'} ${!compact ? 'cursor-pointer' : ''}`}
      >
        <Lock size={compact ? 14 : 16} className="text-red-400" />
        <span className="text-red-400 font-medium">
          {compact ? projectLock.username.split(' ')[0] : `Vergrendeld door ${projectLock.username}`}
        </span>
      </div>

      {!compact && showPopup && createPortal(
        <div
          ref={popupRef}
          className="fixed z-[9999]"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            transform: 'translateY(-100%)'
          }}
        >
          <div
            className="border-2 border-red-500 rounded-lg p-4 shadow-2xl min-w-64"
            style={{
              backgroundColor: '#1f2937',
              opacity: 1
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Lock size={16} className="text-red-400" />
                <span className="font-medium text-red-400">Project vergrendeld</span>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-1 text-sm text-gray-300 mb-3">
              <p><strong>Gebruiker:</strong> {projectLock.username}</p>
              <p><strong>Sinds:</strong> {timeSinceLocked} geleden</p>
              <p><strong>Laatste activiteit:</strong> {timeSinceActivity}</p>
            </div>
            {currentUserRole === 'admin' && onForceUnlock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onForceUnlock();
                  setShowPopup(false);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors font-medium"
              >
                Forceer ontgrendelen
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ProjectLockStatus;