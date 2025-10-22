import React, { useState, useCallback } from 'react';
import { X, Upload, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';

interface DeliveryChecklistProps {
  project: any;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const DeliveryChecklist: React.FC<DeliveryChecklistProps> = ({ project, onConfirm, onCancel }) => {
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

  const toggleFysiekItem = (id: string) => {
    setFysiekChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const toggleDocumentatieItem = (id: string) => {
    setDocumentatieChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Check file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is geen afbeelding`);
          return null;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is te groot (max 10MB)`);
          return null;
        }

        try {
          // Upload file to storage
          const storagePath = await dataService.uploadFileToStorage(file, project.id, null, 'Verzend foto\'s');

          // Create document record in database
          await dataService.createDocument({
            projectId: project.id,
            distributorId: null,
            folder: 'Verzend foto\'s',
            name: file.name,
            type: file.type,
            size: file.size,
            storagePath: storagePath
          });

          return storagePath;
        } catch (error) {
          console.error('Error uploading file:', error);
          toast.error(`Fout bij uploaden van ${file.name}`);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((path): path is string => path !== null);

      if (successfulUploads.length > 0) {
        setUploadedPhotos(prev => [...prev, ...successfulUploads]);
        toast.success(`${successfulUploads.length} foto(s) geüpload!`);
      }
    } catch (error) {
      console.error('Error during upload:', error);
      toast.error('Er is een fout opgetreden bij het uploaden');
    } finally {
      setIsUploading(false);
    }
  }, [project.id]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const deletePhoto = async (storagePath: string) => {
    try {
      // Find the document by storage path and delete it
      const docs = await dataService.getDocuments(project.id, null, 'Verzend foto\'s');
      const docToDelete = docs?.find((d: any) => d.storage_path === storagePath);

      if (docToDelete) {
        await dataService.deleteDocument(docToDelete.id);
        setUploadedPhotos(prev => prev.filter(path => path !== storagePath));
        toast.success('Foto verwijderd');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Fout bij verwijderen van foto');
    }
  };

  const allChecked = () => {
    return fysiekChecklist.every(item => item.checked) &&
           documentatieChecklist.every(item => item.checked);
  };

  const hasPhotos = uploadedPhotos.length > 0;

  const handleConfirm = () => {
    if (!allChecked()) {
      toast.error('Vul alle checklijst items in voordat u doorgaat');
      return;
    }

    if (!hasPhotos) {
      toast.error('Upload minimaal één foto van de verpakte verdeler(s)');
      return;
    }

    onConfirm();
  };

  const fysiekCompleted = fysiekChecklist.filter(item => item.checked).length;
  const fysiekTotal = fysiekChecklist.length;
  const documentatieCompleted = documentatieChecklist.filter(item => item.checked).length;
  const documentatieTotal = documentatieChecklist.length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e2836] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 sticky top-0 bg-[#1e2836] z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-green-400">🚚 Levering Controle Checklist</h2>
              <p className="text-gray-400 mt-2">
                Controleer dat alles gereed is voor verzending om schade tijdens transport te voorkomen
              </p>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Fysieke Verpakking */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">📦 Fysieke Verpakking</h3>
              <span className={`text-sm px-3 py-1 rounded-full ${
                fysiekCompleted === fysiekTotal
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-orange-500/20 text-orange-400'
              }`}>
                {fysiekCompleted}/{fysiekTotal} voltooid
              </span>
            </div>
            <div className="space-y-3">
              {fysiekChecklist.map(item => (
                <label key={item.id} className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleFysiekItem(item.id)}
                    className="mt-1 w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-gray-700 cursor-pointer"
                  />
                  <span className={`flex-1 ${item.checked ? 'text-gray-400 line-through' : 'text-gray-300 group-hover:text-white'}`}>
                    {item.label}
                  </span>
                  {item.checked && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
                </label>
              ))}
            </div>
          </div>

          {/* Documentatie */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">🧰 Documentatie</h3>
              <span className={`text-sm px-3 py-1 rounded-full ${
                documentatieCompleted === documentatieTotal
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-orange-500/20 text-orange-400'
              }`}>
                {documentatieCompleted}/{documentatieTotal} voltooid
              </span>
            </div>
            <div className="space-y-3">
              {documentatieChecklist.map(item => (
                <label key={item.id} className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleDocumentatieItem(item.id)}
                    className="mt-1 w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-gray-700 cursor-pointer"
                  />
                  <span className={`flex-1 ${item.checked ? 'text-gray-400 line-through' : 'text-gray-300 group-hover:text-white'}`}>
                    {item.label}
                  </span>
                  {item.checked && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
                </label>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold text-white mb-4">📸 Verzend Foto's</h3>
            <p className="text-sm text-gray-400 mb-4">
              Upload foto's van de verpakte verdeler(s) als bewijs voor de klant
            </p>

            {/* Upload Area */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-600 hover:border-purple-500 bg-gray-800/50'
              }`}
            >
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-300 mb-2">
                  Sleep foto's hierheen of klik om te uploaden
                </p>
                <p className="text-sm text-gray-500">
                  Ondersteunde formaten: JPG, PNG, GIF (max 10MB per foto)
                </p>
              </label>
            </div>

            {/* Uploaded Photos */}
            {uploadedPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {uploadedPhotos.map((path, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={dataService.getStorageUrl(path)}
                      alt={`Verzend foto ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => deletePhoto(path)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isUploading && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Foto's uploaden...</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {(allChecked() && hasPhotos) && (
            <div className="card p-4 bg-green-500/10 border border-green-500/30">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-400">Checklist Compleet!</h4>
                  <p className="text-sm text-gray-300 mt-1">
                    Alle items zijn afgevinkt en {uploadedPhotos.length} foto('s) zijn geüpload.
                    U kunt nu doorgaan naar levering.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(!allChecked() || !hasPhotos) && (
            <div className="card p-4 bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-400">Nog niet compleet</h4>
                  <ul className="text-sm text-gray-300 mt-2 space-y-1">
                    {!allChecked() && (
                      <li>• Vink alle checklist items af ({fysiekCompleted + documentatieCompleted}/{fysiekTotal + documentatieTotal} voltooid)</li>
                    )}
                    {!hasPhotos && (
                      <li>• Upload minimaal één foto van de verpakte verdeler(s)</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-700 flex justify-end space-x-4 sticky bottom-0 bg-[#1e2836]">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            Annuleren
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allChecked() || !hasPhotos}
            className={`btn-primary ${(!allChecked() || !hasPhotos) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Bevestigen en doorgaan naar levering
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryChecklist;
