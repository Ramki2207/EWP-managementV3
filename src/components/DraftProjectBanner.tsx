import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileEdit, X, Clock } from 'lucide-react';

const DRAFT_STORAGE_KEY = 'newProjectDraft';
const DRAFT_TIMESTAMP_KEY = 'newProjectDraftTimestamp';
const BANNER_DISMISSED_KEY = 'draftBannerDismissed';

export const DraftProjectBanner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [draftInfo, setDraftInfo] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const checkDraft = () => {
      const isDismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
      if (isDismissed) {
        setShowBanner(false);
        return;
      }

      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      const timestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

      if (draft && timestamp) {
        try {
          const parsedDraft = JSON.parse(draft);
          const projectData = parsedDraft.projectData || parsedDraft;

          const hasContent = projectData.projectNumber ||
                            projectData.client ||
                            projectData.description ||
                            projectData.verdelers?.length > 0 ||
                            parsedDraft.tempVerdelerData;

          if (hasContent && location.pathname !== '/create-project') {
            setDraftInfo({
              projectData,
              timestamp: new Date(timestamp),
              currentStep: parsedDraft.currentStep || 0
            });
            setShowBanner(true);
          } else {
            setShowBanner(false);
          }
        } catch (error) {
          console.error('Error parsing draft:', error);
          setShowBanner(false);
        }
      } else {
        setShowBanner(false);
      }
    };

    checkDraft();

    const interval = setInterval(checkDraft, 1000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleContinue = () => {
    sessionStorage.removeItem(BANNER_DISMISSED_KEY);
    navigate('/create-project');
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setShowBanner(false);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dag${days > 1 ? 'en' : ''} geleden`;
    if (hours > 0) return `${hours} uur geleden`;
    if (minutes > 0) return `${minutes} minuten geleden`;
    return 'zojuist';
  };

  const getStepName = (step: number) => {
    switch (step) {
      case 0: return 'Projectdetails';
      case 1: return 'Verdelers';
      case 2: return 'Documenten';
      default: return 'Stap ' + (step + 1);
    }
  };

  if (!showBanner || !draftInfo) {
    return null;
  }

  const { projectData, timestamp, currentStep } = draftInfo;

  return (
    <div
      onClick={handleContinue}
      className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-4 py-3 cursor-pointer hover:from-blue-100 hover:to-blue-150 transition-colors shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="bg-blue-500 text-white p-2 rounded-lg flex-shrink-0">
            <FileEdit className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">
                Bezig met nieuw project
              </span>
              {projectData.projectNumber && (
                <span className="text-gray-600">
                  • {projectData.projectNumber}
                </span>
              )}
              {projectData.client && (
                <span className="text-gray-600">
                  • {projectData.client}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {getTimeAgo(timestamp)}
              </span>
              <span>•</span>
              <span>{getStepName(currentStep)}</span>
              {projectData.verdelers?.length > 0 && (
                <>
                  <span>•</span>
                  <span>{projectData.verdelers.length} verdeler{projectData.verdelers.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleContinue}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
          >
            Doorgaan
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
            title="Verberg banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
