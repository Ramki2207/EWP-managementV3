import React, { useState, useEffect } from 'react';
import { X, Share2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ProjectSharingModalProps {
  projectId: string;
  projectNumber: string;
  projectLocation: string;
  onClose: () => void;
  onUpdate?: () => void;
}

const LOCATIONS = ['Leerdam', 'Naaldwijk', 'Rotterdam', 'Leerdam - PM'];

export default function ProjectSharingModal({
  projectId,
  projectNumber,
  projectLocation,
  onClose,
  onUpdate,
}: ProjectSharingModalProps) {
  const [sharedLocations, setSharedLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSharedLocations();
  }, [projectId]);

  const loadSharedLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('project_shared_locations')
        .select('location')
        .eq('project_id', projectId);

      if (error) throw error;

      setSharedLocations(data?.map(d => d.location) || []);
    } catch (error) {
      console.error('Error loading shared locations:', error);
      toast.error('Failed to load shared locations');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = async (location: string) => {
    if (location === projectLocation) {
      toast.error('Cannot share with the project\'s own location');
      return;
    }

    setSaving(true);
    try {
      const isShared = sharedLocations.includes(location);

      if (isShared) {
        const { error } = await supabase
          .from('project_shared_locations')
          .delete()
          .eq('project_id', projectId)
          .eq('location', location);

        if (error) throw error;

        setSharedLocations(prev => prev.filter(loc => loc !== location));
        toast.success(`Removed access for ${location}`);
      } else {
        const { data: userData } = await supabase.auth.getUser();

        const { error } = await supabase
          .from('project_shared_locations')
          .insert({
            project_id: projectId,
            location,
            shared_by: userData?.user?.id,
          });

        if (error) throw error;

        setSharedLocations(prev => [...prev, location]);
        toast.success(`Shared with ${location}`);
      }

      onUpdate?.();
    } catch (error) {
      console.error('Error toggling location share:', error);
      toast.error('Failed to update sharing settings');
    } finally {
      setSaving(false);
    }
  };

  const availableLocations = LOCATIONS.filter(loc => loc !== projectLocation);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Share Project</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Project: <span className="font-medium text-gray-900">{projectNumber}</span>
          </p>
          <p className="text-sm text-gray-600">
            Primary Location: <span className="font-medium text-gray-900">{projectLocation}</span>
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-3">
            Share this project with other locations:
          </p>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {availableLocations.map((location) => {
                const isShared = sharedLocations.includes(location);

                return (
                  <button
                    key={location}
                    onClick={() => toggleLocation(location)}
                    disabled={saving}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isShared
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`font-medium ${isShared ? 'text-blue-700' : 'text-gray-700'}`}>
                      {location}
                    </span>
                    {isShared && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Check className="w-5 h-5" />
                        <span className="text-sm">Shared</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Users from shared locations will be able to view and edit this project.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
