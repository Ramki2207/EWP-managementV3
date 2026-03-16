import React, { useState } from 'react';
import { AlertTriangle, FileEdit as Edit, Save, X } from 'lucide-react';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CriticalMessageBannerProps {
  project: any;
  currentUser: any;
  onUpdate: (updatedProject: any) => void;
}

const AUTHORIZED_USERS = [
  'dcbefaf1-2236-4daa-b54d-93c88ec697f7', // Ronald
  '24178c5a-0b4f-42d2-ba73-e2131d90f218', // Michel de Ruiter
  '5cd8ac9b-5451-483c-92a0-f5a3f826c4fe', // Radjesh
];

const CriticalMessageBanner: React.FC<CriticalMessageBannerProps> = ({
  project,
  currentUser,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(project?.critical_message || '');
  const [saving, setSaving] = useState(false);

  const canEdit = AUTHORIZED_USERS.includes(currentUser?.id);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        critical_message: message.trim() || null,
        critical_message_updated_at: message.trim() ? new Date().toISOString() : null,
        critical_message_updated_by: message.trim() ? currentUser.id : null,
      };

      await dataService.updateProject(project.id, updateData);

      const updatedProject = {
        ...project,
        ...updateData,
      };

      onUpdate(updatedProject);
      setIsEditing(false);
      toast.success(message.trim() ? 'Kritische melding opgeslagen' : 'Kritische melding verwijderd');
    } catch (error) {
      console.error('Error saving critical message:', error);
      toast.error('Fout bij opslaan van kritische melding');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setMessage(project?.critical_message || '');
    setIsEditing(false);
  };

  // Don't show banner if no message and user can't edit
  if (!project?.critical_message && !canEdit) {
    return null;
  }

  // Show banner if there's a message OR user is editing
  if (!project?.critical_message && !isEditing) {
    return canEdit ? (
      <div className="card mb-6 p-4 border-2 border-dashed border-yellow-500/30 bg-yellow-500/5">
        <button
          onClick={() => setIsEditing(true)}
          className="btn-secondary flex items-center space-x-2 w-full justify-center"
        >
          <AlertTriangle size={20} />
          <span>Kritische melding toevoegen</span>
        </button>
      </div>
    ) : null;
  }

  return (
    <div className="card mb-6 border-l-4 border-red-500 bg-red-500/10">
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-400">
                KRITISCHE MELDING VOOR MONTEUR
              </h3>
              {project?.critical_message_updated_at && (
                <p className="text-xs text-gray-400 mt-1">
                  Laatst bijgewerkt: {new Date(project.critical_message_updated_at).toLocaleString('nl-NL')}
                </p>
              )}
            </div>
          </div>
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary p-2"
              title="Bewerken"
            >
              <Edit size={18} />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Voer een kritische melding in voor de monteur..."
              className="input-field w-full min-h-[120px] font-medium"
              autoFocus
            />
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center space-x-2"
              >
                <Save size={18} />
                <span>{saving ? 'Opslaan...' : 'Opslaan'}</span>
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="btn-secondary flex items-center space-x-2"
              >
                <X size={18} />
                <span>Annuleren</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
            <p className="text-white text-base md:text-lg font-medium whitespace-pre-wrap">
              {project?.critical_message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriticalMessageBanner;
