import React, { useState, useEffect } from 'react';
import { Lock, Users, Clock, AlertTriangle } from 'lucide-react';
import { ProjectLock, projectLockManager } from '../lib/projectLocks';

interface ProjectLockBannerProps {
  projectLocks: ProjectLock[];
  currentUserId: string;
}

const ProjectLockBanner: React.FC<ProjectLockBannerProps> = ({ projectLocks, currentUserId }) => {
  const [showBanner, setShowBanner] = useState(true);

  // Get locks for projects other than current user's
  const otherUserLocks = projectLocks.filter(lock => 
    lock.user_id !== currentUserId && lock.is_active
  );

  // Get current user's locks
  const myLocks = projectLocks.filter(lock => 
    lock.user_id === currentUserId && lock.is_active
  );

  if (!showBanner || (otherUserLocks.length === 0 && myLocks.length === 0)) {
    return null;
  }

  return (
    <div className="card p-4 mb-6 border-l-4 border-blue-400">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Users size={20} className="text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-400 mb-2">Project Activiteit</h3>
            
            {myLocks.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-300 mb-1">
                  <strong>Je werkt momenteel in:</strong>
                </p>
                {myLocks.map(lock => (
                  <div key={lock.id} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-blue-400">Project {lock.project_id.slice(0, 8)}...</span>
                    <span className="text-gray-400">
                      ({projectLockManager.getTimeSinceLocked(lock.locked_at)})
                    </span>
                  </div>
                ))}
              </div>
            )}

            {otherUserLocks.length > 0 && (
              <div>
                <p className="text-sm text-gray-300 mb-1">
                  <strong>Andere gebruikers actief:</strong>
                </p>
                {otherUserLocks.slice(0, 3).map(lock => (
                  <div key={lock.id} className="flex items-center space-x-2 text-sm">
                    <Lock size={12} className="text-red-400" />
                    <span className="text-red-400">{lock.username}</span>
                    <span className="text-gray-400">in project {lock.project_id.slice(0, 8)}...</span>
                    <span className="text-gray-500 text-xs">
                      ({projectLockManager.getTimeSinceActivity(lock.last_activity)})
                    </span>
                  </div>
                ))}
                {otherUserLocks.length > 3 && (
                  <p className="text-xs text-gray-400 mt-1">
                    +{otherUserLocks.length - 3} meer...
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setShowBanner(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ProjectLockBanner;