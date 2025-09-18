import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Server, FileText, Database } from 'lucide-react';

interface ProjectDeleteConfirmationProps {
  project: any;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

const ProjectDeleteConfirmation: React.FC<ProjectDeleteConfirmationProps> = ({
  project,
  onConfirm,
  onCancel,
  isDeleting = false
}) => {
  const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);

  const handleFirstConfirm = () => {
    setShowSecondConfirmation(true);
  };

  const handleFinalConfirm = () => {
    onConfirm();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isDeleting) {
      onCancel();
    }
  };

  const FirstConfirmationModal = () => (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-[#1E2530] rounded-2xl p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-red-500/20 rounded-xl">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Project verwijderen</h2>
            <p className="text-gray-400">Dit kan niet ongedaan worden gemaakt</p>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-red-400 mb-3">⚠️ Waarschuwing</h3>
          <p className="text-red-300 mb-4">
            Je staat op het punt om <strong>ALLE gegevens</strong> van dit project te verwijderen:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-red-500/10 rounded-lg">
              <Database size={20} className="text-red-400" />
              <div>
                <p className="font-medium text-white">Project: {project.project_number}</p>
                <p className="text-sm text-gray-400">{project.client} - {project.location}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-red-500/10 rounded-lg">
              <Server size={20} className="text-red-400" />
              <div>
                <p className="font-medium text-white">Verdelers: {project.distributors?.length || 0}</p>
                <p className="text-sm text-gray-400">Alle verdeler gegevens en specificaties</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-red-500/10 rounded-lg">
              <FileText size={20} className="text-red-400" />
              <div>
                <p className="font-medium text-white">Documenten & Uploads</p>
                <p className="text-sm text-gray-400">Alle geüploade bestanden en documenten</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>Let op:</strong> Klantgegevens blijven behouden en worden niet verwijderd.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="btn-secondary"
            disabled={isDeleting}
          >
            Annuleren
          </button>
          <button
            onClick={handleFirstConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transition-all flex items-center space-x-2"
            disabled={isDeleting}
          >
            <Trash2 size={20} />
            <span>Ja, verwijder project</span>
          </button>
        </div>
      </div>
    </div>
  );

  const SecondConfirmationModal = () => (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-[#1E2530] rounded-2xl p-6 max-w-md w-full border-2 border-red-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-2">Laatste bevestiging</h2>
          <p className="text-gray-400 mb-6">
            Weet je het <strong className="text-red-400">100% zeker</strong>?
          </p>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">
              Project <strong>{project.project_number}</strong> en alle bijbehorende gegevens 
              worden <strong>permanent verwijderd</strong>. Dit kan niet ongedaan worden gemaakt!
            </p>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowSecondConfirmation(false)}
              className="btn-secondary"
              disabled={isDeleting}
            >
              Nee, annuleren
            </button>
            <button
              onClick={handleFinalConfirm}
              className={`bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-all flex items-center space-x-2 ${
                isDeleting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Verwijderen...</span>
                </>
              ) : (
                <>
                  <Trash2 size={20} />
                  <span>Ja, definitief verwijderen</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    showSecondConfirmation ? <SecondConfirmationModal /> : <FirstConfirmationModal />,
    document.body
  );
};

export default ProjectDeleteConfirmation;