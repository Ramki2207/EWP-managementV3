import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, Trash2, CheckCircle, AlertCircle, Package, Truck, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';

interface VerdelerDeliveryManagerProps {
  project: any;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface VerdelerDelivery {
  id?: string;
  distributor_id: string;
  delivery_status: 'pending' | 'ready_for_delivery' | 'delivered';
  fysiek_checklist: ChecklistItem[];
  documentatie_checklist: ChecklistItem[];
  delivery_photos: string[];
}

const VerdelerDeliveryManager: React.FC<VerdelerDeliveryManagerProps> = ({ project, onConfirm, onCancel }) => {
  const [verdelers, setVerdelers] = useState<any[]>([]);
  const [selectedVerdeler, setSelectedVerdeler] = useState<string | null>(null);
  const [deliveryData, setDeliveryData] = useState<Record<string, VerdelerDelivery>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);

  const defaultFysiekChecklist: ChecklistItem[] = [
    { id: 'extern_gereinigd', label: 'Verdeler extern gereinigd', checked: false },
    { id: 'behuizing_gecontroleerd', label: 'Behuizing gecontroleerd op krassen of deuken', checked: false },
    { id: 'bewegende_onderdelen', label: 'Beweegbare onderdelen (deuren, sloten) functioneren correct', checked: false },
    { id: 'losse_accessoires', label: 'Losse accessoires (reserveonderdelen, documentatie) toegevoegd', checked: false },
    { id: 'stevig_verpakt', label: 'Verdeler stevig verpakt (transportkist/pallet)', checked: false },
    { id: 'beschermhoeken', label: 'Beschermhoeken, folie en label "BOVEN"/"BREUKGEVOELIG" aangebracht', checked: false },
  ];

  const defaultDocumentatieChecklist: ChecklistItem[] = [
    { id: 'technisch_dossier', label: 'Technisch dossier toegevoegd (schema\'s, componentenlijst, testverslag)', checked: false },
    { id: 'handleiding', label: 'Handleiding en certificaten bijgevoegd', checked: false },
    { id: 'leverbon', label: 'Leverbon of paklijst toegevoegd', checked: false },
    { id: 'projectgegevens', label: 'Projectgegevens en serienummer op verpakking vermeld', checked: false },
    { id: 'digitaal_opgeslagen', label: 'Kopie van leverdocument digitaal opgeslagen in systeem', checked: false },
  ];

  useEffect(() => {
    loadVerdelers();
  }, [project.id]);

  const loadVerdelers = async () => {
    try {
      setLoading(true);
      const verdelersData = await dataService.getDistributorsByProject(project.id);
      setVerdelers(verdelersData || []);

      const existingDeliveries = await dataService.getVerdelerDeliveries(project.id);
      const deliveryMap: Record<string, VerdelerDelivery> = {};

      verdelersData?.forEach((verdeler: any) => {
        const existing = existingDeliveries?.find((d: any) => d.distributor_id === verdeler.id);

        deliveryMap[verdeler.id] = {
          id: existing?.id,
          distributor_id: verdeler.id,
          delivery_status: existing?.delivery_status || 'pending',
          fysiek_checklist: existing?.fysiek_checklist || JSON.parse(JSON.stringify(defaultFysiekChecklist)),
          documentatie_checklist: existing?.documentatie_checklist || JSON.parse(JSON.stringify(defaultDocumentatieChecklist)),
          delivery_photos: existing?.delivery_photos || []
        };
      });

      setDeliveryData(deliveryMap);

      if (verdelersData && verdelersData.length > 0) {
        setSelectedVerdeler(verdelersData[0].id);
      }
    } catch (error) {
      console.error('Error loading verdelers:', error);
      toast.error('Fout bij laden van verdelers');
    } finally {
      setLoading(false);
    }
  };

  const currentDelivery = selectedVerdeler ? deliveryData[selectedVerdeler] : null;

  const toggleFysiekItem = (itemId: string) => {
    if (!selectedVerdeler || !currentDelivery) return;

    setDeliveryData(prev => ({
      ...prev,
      [selectedVerdeler]: {
        ...prev[selectedVerdeler],
        fysiek_checklist: prev[selectedVerdeler].fysiek_checklist.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        )
      }
    }));
  };

  const toggleDocumentatieItem = (itemId: string) => {
    if (!selectedVerdeler || !currentDelivery) return;

    setDeliveryData(prev => ({
      ...prev,
      [selectedVerdeler]: {
        ...prev[selectedVerdeler],
        documentatie_checklist: prev[selectedVerdeler].documentatie_checklist.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        )
      }
    }));
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedVerdeler) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is geen afbeelding`);
          return null;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is te groot (max 10MB)`);
          return null;
        }

        try {
          const verdeler = verdelers.find(v => v.id === selectedVerdeler);
          const storagePath = await dataService.uploadFileToStorage(
            file,
            project.id,
            selectedVerdeler,
            `Verzend foto's ${verdeler?.distributor_id || ''}`
          );

          await dataService.createDocument({
            projectId: project.id,
            distributorId: selectedVerdeler,
            folder: `Verzend foto's ${verdeler?.distributor_id || ''}`,
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
        setDeliveryData(prev => ({
          ...prev,
          [selectedVerdeler]: {
            ...prev[selectedVerdeler],
            delivery_photos: [...prev[selectedVerdeler].delivery_photos, ...successfulUploads]
          }
        }));
        toast.success(`${successfulUploads.length} foto(s) geüpload!`);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Fout bij uploaden van foto\'s');
    } finally {
      setIsUploading(false);
    }
  }, [selectedVerdeler, project.id, verdelers]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removePhoto = (photoPath: string) => {
    if (!selectedVerdeler) return;

    setDeliveryData(prev => ({
      ...prev,
      [selectedVerdeler]: {
        ...prev[selectedVerdeler],
        delivery_photos: prev[selectedVerdeler].delivery_photos.filter(p => p !== photoPath)
      }
    }));
  };

  const markVerdelerAsReady = async (verdelerId: string) => {
    const delivery = deliveryData[verdelerId];

    const allFysiekChecked = delivery.fysiek_checklist.every(item => item.checked);
    const allDocumentatieChecked = delivery.documentatie_checklist.every(item => item.checked);
    const hasPhotos = delivery.delivery_photos.length > 0;

    if (!allFysiekChecked || !allDocumentatieChecked || !hasPhotos) {
      toast.error('Vul alle checklist items in en upload minimaal 1 foto');
      return;
    }

    try {
      await dataService.saveVerdelerDelivery(project.id, verdelerId, {
        delivery_status: 'ready_for_delivery',
        fysiek_checklist: delivery.fysiek_checklist,
        documentatie_checklist: delivery.documentatie_checklist,
        delivery_photos: delivery.delivery_photos
      });

      await dataService.updateDistributor(verdelerId, { status: 'Levering' });

      setDeliveryData(prev => ({
        ...prev,
        [verdelerId]: {
          ...prev[verdelerId],
          delivery_status: 'ready_for_delivery'
        }
      }));

      const verdeler = verdelers.find(v => v.id === verdelerId);
      toast.success(`${verdeler?.distributor_id} status bijgewerkt naar Levering!`);
    } catch (error) {
      console.error('Error marking verdeler as ready:', error);
      toast.error('Fout bij opslaan van leverstatus');
    }
  };

  const handleConfirm = async () => {
    const hasAtLeastOneReady = Object.values(deliveryData).some(
      d => d.delivery_status === 'ready_for_delivery'
    );

    if (!hasAtLeastOneReady) {
      toast.error('Markeer minimaal 1 verdeler als klaar voor levering');
      return;
    }

    try {
      for (const [verdelerId, delivery] of Object.entries(deliveryData)) {
        await dataService.saveVerdelerDelivery(project.id, verdelerId, {
          delivery_status: delivery.delivery_status,
          fysiek_checklist: delivery.fysiek_checklist,
          documentatie_checklist: delivery.documentatie_checklist,
          delivery_photos: delivery.delivery_photos
        });

        if (delivery.delivery_status === 'ready_for_delivery') {
          await dataService.updateDistributor(verdelerId, { status: 'Levering' });
        }
      }

      const readyCount = Object.values(deliveryData).filter(d => d.delivery_status === 'ready_for_delivery').length;
      toast.success(`${readyCount} verdeler(s) klaargezet voor levering!`);
      onConfirm();
    } catch (error) {
      console.error('Error saving delivery data:', error);
      toast.error('Fout bij opslaan van levergegevens');
    }
  };

  const getCompletionStatus = (verdelerId: string) => {
    const delivery = deliveryData[verdelerId];
    if (!delivery) return { fysiek: 0, documentatie: 0, photos: 0 };

    const fysiekCount = delivery.fysiek_checklist.filter(i => i.checked).length;
    const documentatieCount = delivery.documentatie_checklist.filter(i => i.checked).length;

    return {
      fysiek: (fysiekCount / delivery.fysiek_checklist.length) * 100,
      documentatie: (documentatieCount / delivery.documentatie_checklist.length) * 100,
      photos: delivery.delivery_photos.length
    };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1E2530] rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Verdelers laden...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#1E2530] rounded-2xl max-w-6xl w-full my-8">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Truck className="text-blue-400" size={24} />
              <div>
                <h2 className="text-xl font-semibold">Levering per Verdeler</h2>
                <p className="text-sm text-gray-400">Project: {project.project_number}</p>
              </div>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Verdeler List */}
          <div className="w-80 border-r border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Verdelers ({verdelers.length})</h3>
              <div className="space-y-2">
                {verdelers.map((verdeler) => {
                  const status = getCompletionStatus(verdeler.id);
                  const delivery = deliveryData[verdeler.id];
                  const isReady = delivery?.delivery_status === 'ready_for_delivery';

                  return (
                    <div
                      key={verdeler.id}
                      onClick={() => setSelectedVerdeler(verdeler.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedVerdeler === verdeler.id
                          ? 'bg-blue-500/20 border-2 border-blue-500'
                          : 'bg-[#2A303C] border-2 border-transparent hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{verdeler.distributor_id}</div>
                        {isReady && (
                          <CheckCircle className="text-green-400" size={18} />
                        )}
                      </div>
                      {verdeler.kast_naam && (
                        <div className="text-xs text-gray-400 mb-2">{verdeler.kast_naam}</div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Fysiek</span>
                          <span className={status.fysiek === 100 ? 'text-green-400' : 'text-orange-400'}>
                            {status.fysiek.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Documentatie</span>
                          <span className={status.documentatie === 100 ? 'text-green-400' : 'text-orange-400'}>
                            {status.documentatie.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Foto's</span>
                          <span className={status.photos > 0 ? 'text-green-400' : 'text-orange-400'}>
                            {status.photos}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Checklist Content */}
          {selectedVerdeler && currentDelivery && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {verdelers.find(v => v.id === selectedVerdeler)?.distributor_id}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {verdelers.find(v => v.id === selectedVerdeler)?.kast_naam}
                    </p>
                  </div>
                  {currentDelivery.delivery_status === 'ready_for_delivery' ? (
                    <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 rounded-lg">
                      <CheckCircle className="text-green-400" size={20} />
                      <span className="text-green-400 font-medium">Klaar voor levering</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => markVerdelerAsReady(selectedVerdeler)}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <CheckCircle size={18} />
                      <span>Markeer als klaar</span>
                    </button>
                  )}
                </div>

                {/* Fysieke Controle */}
                <div className="bg-[#2A303C] rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Package className="text-blue-400" size={20} />
                    <h4 className="font-medium">Fysieke Controle</h4>
                  </div>
                  <div className="space-y-2">
                    {currentDelivery.fysiek_checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-[#1E2530] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleFysiekItem(item.id)}
                          className="mt-1 w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                          disabled={currentDelivery.delivery_status === 'ready_for_delivery'}
                        />
                        <span className={`flex-1 text-sm ${item.checked ? 'text-gray-300' : 'text-gray-400'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Documentatie */}
                <div className="bg-[#2A303C] rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="text-orange-400" size={20} />
                    <h4 className="font-medium">Documentatie</h4>
                  </div>
                  <div className="space-y-2">
                    {currentDelivery.documentatie_checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-[#1E2530] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleDocumentatieItem(item.id)}
                          className="mt-1 w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                          disabled={currentDelivery.delivery_status === 'ready_for_delivery'}
                        />
                        <span className={`flex-1 text-sm ${item.checked ? 'text-gray-300' : 'text-gray-400'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="bg-[#2A303C] rounded-xl p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Camera className="text-green-400" size={20} />
                    <h4 className="font-medium">Verzend Foto's</h4>
                  </div>

                  {currentDelivery.delivery_status !== 'ready_for_delivery' && (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragging
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="file"
                        id={`file-upload-${selectedVerdeler}`}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e.target.files)}
                        disabled={isUploading}
                      />
                      <label htmlFor={`file-upload-${selectedVerdeler}`} className="cursor-pointer">
                        <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-400">
                          {isUploading ? 'Uploaden...' : 'Klik of sleep foto\'s hierheen'}
                        </p>
                      </label>
                    </div>
                  )}

                  {currentDelivery.delivery_photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mt-4">
                      {currentDelivery.delivery_photos.map((photoPath, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={dataService.getStorageUrl(photoPath)}
                            alt={`Verzend foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          {currentDelivery.delivery_status !== 'ready_for_delivery' && (
                            <button
                              onClick={() => removePhoto(photoPath)}
                              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {Object.values(deliveryData).filter(d => d.delivery_status === 'ready_for_delivery').length} van {verdelers.length} verdelers klaar voor levering
          </div>
          <div className="flex space-x-3">
            <button onClick={onCancel} className="btn btn-secondary">
              Annuleren
            </button>
            <button onClick={handleConfirm} className="btn btn-primary">
              Bevestigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerdelerDeliveryManager;
