import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Trash2, CheckCircle, Save, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService, supabase } from '../lib/supabase';

interface VerdelerLeveringChecklistProps {
  verdeler: any;
  onComplete: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const VerdelerLeveringChecklist: React.FC<VerdelerLeveringChecklistProps> = ({
  verdeler,
  onComplete
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fysiekChecklist, setFysiekChecklist] = useState<ChecklistItem[]>([
    { id: 'extern_gereinigd', label: 'Verdeler extern gereinigd', checked: false },
    { id: 'behuizing_gecontroleerd', label: 'Behuizing gecontroleerd op krassen of deuken', checked: false },
    { id: 'bewegende_onderdelen', label: 'Beweegbare onderdelen (deuren, sloten) functioneren correct', checked: false },
    { id: 'losse_accessoires', label: 'Losse accessoires (reserveonderdelen, documentatie) toegevoegd', checked: false },
    { id: 'stevig_verpakt', label: 'Verdeler stevig verpakt (transportkist/pallet)', checked: false },
    { id: 'beschermhoeken', label: 'Beschermhoeken, folie en label "BOVEN"/"BREUKGEVOELIG" aangebracht', checked: false },
  ]);

  const [documentatieChecklist, setDocumentatieChecklist] = useState<ChecklistItem[]>([
    { id: 'technisch_dossier', label: 'Technisch dossier toegevoegd (schema\'s, componentenlijst, testverslag)', checked: false },
    { id: 'handleiding', label: 'Handleiding en certificaten bijgevoegd', checked: false },
    { id: 'leverbon', label: 'Leverbon of paklijst toegevoegd', checked: false },
    { id: 'projectgegevens', label: 'Projectgegevens en serienummer op verpakking vermeld', checked: false },
    { id: 'digitaal_opgeslagen', label: 'Kopie van leverdocument digitaal opgeslagen in systeem', checked: false },
  ]);

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadExistingData();
  }, [verdeler.id]);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      const existingData = await dataService.getVerdelerDelivery(verdeler.project_id, verdeler.id);

      if (existingData) {
        if (existingData.fysiek_checklist) {
          setFysiekChecklist(existingData.fysiek_checklist);
        }
        if (existingData.documentatie_checklist) {
          setDocumentatieChecklist(existingData.documentatie_checklist);
        }
        if (existingData.delivery_photos) {
          setUploadedPhotos(existingData.delivery_photos);
        }
      }
    } catch (error) {
      console.error('Error loading existing delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFysiekItem = (id: string) => {
    setFysiekChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const toggleDocumentatieItem = (id: string) => {
    setDocumentatieChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const photoUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is geen afbeelding`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${verdeler.project_id}/${verdeler.id}/delivery_${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('project-files')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl }
        } = supabase.storage.from('project-files').getPublicUrl(fileName);

        photoUrls.push(publicUrl);
      }

      setUploadedPhotos(prev => [...prev, ...photoUrls]);
      toast.success(`${photoUrls.length} foto('s) geüpload`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Fout bij uploaden van foto');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (photoUrl: string) => {
    setUploadedPhotos(prev => prev.filter(url => url !== photoUrl));
    toast.success('Foto verwijderd');
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, []);

  const isComplete = () => {
    const allFysiekChecked = fysiekChecklist.every(item => item.checked);
    const allDocumentatieChecked = documentatieChecklist.every(item => item.checked);
    const hasPhotos = uploadedPhotos.length > 0;

    return allFysiekChecked && allDocumentatieChecked && hasPhotos;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await dataService.saveVerdelerDelivery(verdeler.project_id, verdeler.id, {
        delivery_status: isComplete() ? 'ready_for_delivery' : 'pending',
        fysiek_checklist: fysiekChecklist,
        documentatie_checklist: documentatieChecklist,
        delivery_photos: uploadedPhotos
      });

      toast.success('Levering checklist opgeslagen');
      onComplete();
    } catch (error) {
      console.error('Error saving delivery checklist:', error);
      toast.error('Fout bij opslaan van checklist');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const fysiekProgress = (fysiekChecklist.filter(i => i.checked).length / fysiekChecklist.length) * 100;
  const documentatieProgress = (documentatieChecklist.filter(i => i.checked).length / documentatieChecklist.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-[#2A303C] p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Voortgang</h3>
          {isComplete() && (
            <div className="flex items-center text-green-400">
              <CheckCircle size={20} className="mr-2" />
              <span>Voltooid</span>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Fysieke Controle</span>
              <span>{Math.round(fysiekProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${fysiekProgress}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Documentatie</span>
              <span>{Math.round(documentatieProgress)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${documentatieProgress}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Foto's</span>
              <span>{uploadedPhotos.length} foto('s)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${uploadedPhotos.length > 0 ? 'bg-blue-500' : 'bg-gray-600'}`}
                style={{ width: uploadedPhotos.length > 0 ? '100%' : '0%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fysieke Controle Checklist */}
      <div className="bg-[#2A303C] p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Fysieke Controle</h3>
        <div className="space-y-3">
          {fysiekChecklist.map(item => (
            <label key={item.id} className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleFysiekItem(item.id)}
                className="mt-1 mr-3 w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <span className={`flex-1 ${item.checked ? 'text-gray-400 line-through' : 'text-white'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Documentatie Checklist */}
      <div className="bg-[#2A303C] p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Documentatie</h3>
        <div className="space-y-3">
          {documentatieChecklist.map(item => (
            <label key={item.id} className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleDocumentatieItem(item.id)}
                className="mt-1 mr-3 w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <span className={`flex-1 ${item.checked ? 'text-gray-400 line-through' : 'text-white'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div className="bg-[#2A303C] p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Levering Foto's</h3>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <input
            type="file"
            id="photo-upload"
            multiple
            accept="image/*"
            onChange={e => handleFileUpload(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
          <label htmlFor="photo-upload" className="cursor-pointer">
            <Camera size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-white mb-2">Klik om foto's te uploaden</p>
            <p className="text-sm text-gray-400">of sleep foto's hierheen</p>
          </label>
        </div>

        {uploadedPhotos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {uploadedPhotos.map((photoUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={photoUrl}
                  alt={`Delivery ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(photoUrl)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center disabled:opacity-50"
        >
          <Save size={20} className="mr-2" />
          {saving ? 'Opslaan...' : 'Checklist Opslaan'}
        </button>
      </div>
    </div>
  );
};

export default VerdelerLeveringChecklist;
