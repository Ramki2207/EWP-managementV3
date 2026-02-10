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

const LOCATIONS = ['Leerdam', 'Leerdam (PM)', 'Naaldwijk', 'Naaldwijk (PD)', 'Naaldwijk (PW)', 'Rotterdam'];

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
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    if (userId) {
      setCurrentUserId(userId);
    }
    loadSharedLocations();
  }, [projectId]);

  const loadSharedLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('project_shared_locations')
        .select('location')
        .eq('project_id', projectId);

      if (error) throw error;

      const locations = data?.map(d => d.location) || [];
      console.log('📋 SHARING MODAL: Loaded shared locations for project', projectId, ':', locations);
      setSharedLocations(locations);
    } catch (error) {
      console.error('Error loading shared locations:', error);
      toast.error('Kon gedeelde locaties niet laden');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = async (location: string) => {
    console.log('🔄 SHARING: Toggle location clicked:', location, 'for project', projectId);

    if (location === projectLocation) {
      toast.error('Kan niet delen met de eigen locatie van het project');
      return;
    }

    setSaving(true);
    try {
      const isShared = sharedLocations.includes(location);
      console.log('🔄 SHARING: Location', location, 'is currently shared:', isShared);

      if (isShared) {
        console.log('🗑️ SHARING: Removing shared location:', location);
        const { error } = await supabase
          .from('project_shared_locations')
          .delete()
          .eq('project_id', projectId)
          .eq('location', location);

        if (error) throw error;

        setSharedLocations(prev => prev.filter(loc => loc !== location));
        console.log('✅ SHARING: Successfully removed shared location');
        toast.success(`Toegang verwijderd voor ${location}`);
      } else {
        console.log('➕ SHARING: Adding shared location:', location, 'by user:', currentUserId);
        const { error } = await supabase
          .from('project_shared_locations')
          .insert({
            project_id: projectId,
            location,
            shared_by: currentUserId || null,
          });

        if (error) {
          console.error('❌ SHARING: Error sharing project:', error);
          throw error;
        }

        setSharedLocations(prev => [...prev, location]);
        console.log('✅ SHARING: Successfully added shared location');
        toast.success(`Gedeeld met ${location}`);
      }

      onUpdate?.();
    } catch (error) {
      console.error('❌ SHARING: Error toggling location share:', error);
      toast.error('Kon delen niet bijwerken');
    } finally {
      setSaving(false);
    }
  };

  const availableLocations = LOCATIONS.filter(loc => loc !== projectLocation);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#1E2530] rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Project Delen</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">
              Project: <span className="font-medium text-white">{projectNumber}</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Hoofdlocatie: <span className="font-medium text-white">{projectLocation}</span>
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-3 font-medium">
              Deel dit project met andere locaties:
            </p>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
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
                      className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        isShared
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`font-medium ${isShared ? 'text-blue-400' : 'text-gray-300'}`}>
                        {location}
                      </span>
                      {isShared && (
                        <div className="flex items-center gap-2 text-blue-400">
                          <Check className="w-5 h-5" />
                          <span className="text-sm">Gedeeld</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong className="text-blue-400">Let op:</strong> Gebruikers van gedeelde locaties kunnen dit project bekijken en bewerken.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
