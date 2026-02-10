import React, { useState } from 'react';
import { Mail, Send, Eye, Copy, Calendar, Package, AlertCircle, CheckCircle, X, Folder } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientPortalService } from '../lib/clientPortalService';
import { dataService } from '../lib/supabase';

interface DeliveryNotificationManagerProps {
  project: any;
  onStatusChange?: () => void;
}

const availableVerdelerFolders = [
  'Verdeler aanzicht',
  'Test certificaat',
  'Algemene informatie',
  'Installatie schema',
  'Onderdelen',
  'Handleidingen',
  'Documentatie',
  'Oplever foto\'s',
  'Klant informatie',
];

const availableProjectFolders = [
  'Aanvraag',
  'Bestelling',
  'Calculatie',
  'Offerte',
  'Ondersteuning',
  'Opdracht',
  'Opname Locatie',
  'Software bestand',
  'Verzend foto\'s',
];

const DeliveryNotificationManager: React.FC<DeliveryNotificationManagerProps> = ({
  project,
  onStatusChange
}) => {
  const [showFolderSelection, setShowFolderSelection] = useState(false);
  const [showVerdelerSelection, setShowVerdelerSelection] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [portal, setPortal] = useState<any>(null);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [allVerdelers, setAllVerdelers] = useState<any[]>([]);
  const [selectedVerdelerIds, setSelectedVerdelerIds] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([
    'Verdeler aanzicht',
    'Test certificaat',
    'Installatie schema'
  ]);
  const [selectedProjectFolders, setSelectedProjectFolders] = useState<string[]>([]);

  const handleGenerateDeliveryNotification = async () => {
    try {
      console.log('Starting notification generation for project:', project.id);
      setIsGenerating(true);

      // Get project verdelers
      console.log('Loading verdelers...');
      const verdelers = await dataService.getDistributorsByProject(project.id);
      console.log('Verdelers:', verdelers);

      if (verdelers.length === 0) {
        toast.error('Geen verdelers gevonden voor dit project');
        setIsGenerating(false);
        return;
      }

      setAllVerdelers(verdelers);

      // Check if portal already exists for this project
      console.log('Fetching existing portals...');
      const existingPortals = await clientPortalService.getAllClientPortals();
      console.log('Existing portals:', existingPortals);
      const existingPortal = existingPortals.find(p => p.project_id === project.id && p.is_active);
      console.log('Found existing portal:', existingPortal);

      if (existingPortal) {
        // Load existing folder selection
        if (existingPortal.shared_folders && existingPortal.shared_folders.length > 0) {
          setSelectedFolders(existingPortal.shared_folders);
        }

        // Load existing project folder selection
        if (existingPortal.shared_project_folders && existingPortal.shared_project_folders.length > 0) {
          setSelectedProjectFolders(existingPortal.shared_project_folders);
        }

        // Load existing verdeler selection or default to "Levering" status verdelers
        if (existingPortal.verdeler_ids && existingPortal.verdeler_ids.length > 0) {
          setSelectedVerdelerIds(existingPortal.verdeler_ids);
        } else {
          // Pre-select verdelers with "Levering" status
          const leveringVerdelers = verdelers.filter((v: any) => v.status === 'Levering');
          setSelectedVerdelerIds(leveringVerdelers.map((v: any) => v.id));
        }

        setPortal(existingPortal);
        toast.success('Bestaande portal geladen voor dit project!');
      } else {
        // Pre-select verdelers with "Levering" status for new portal
        const leveringVerdelers = verdelers.filter((v: any) => v.status === 'Levering');
        setSelectedVerdelerIds(leveringVerdelers.map((v: any) => v.id));

        // Find client for this project
        console.log('Finding client...');
        const clients = await dataService.getClients();
        const client = clients.find((c: any) => c.name === project.client);
        console.log('Client:', client);

        // Create client portal with default folders (verdelers will be set later)
        console.log('Creating new portal...');
        const newPortal = await clientPortalService.createClientPortal(
          project.id,
          client?.id,
          selectedFolders,
          leveringVerdelers.map((v: any) => v.id)
        );
        console.log('New portal created:', newPortal);

        setPortal(newPortal);
        toast.success('Nieuwe portal aangemaakt voor dit project!');
      }

      // Show verdeler selection modal
      setShowVerdelerSelection(true);
    } catch (error) {
      console.error('Error generating delivery notification:', error);
      toast.error(`Fout: ${error.message || 'Er is een fout opgetreden bij het genereren van de notificatie'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenFolderSelection = () => {
    setShowPreview(false);
    setShowFolderSelection(true);
  };

  const handleOpenVerdelerSelection = () => {
    setShowPreview(false);
    setShowVerdelerSelection(true);
  };

  const handleConfirmFolderSelection = async () => {
    try {
      setIsGenerating(true);
      setShowFolderSelection(false);

      if (!portal) {
        toast.error('Portal niet gevonden');
        return;
      }

      // Check if at least one folder is selected
      if (selectedFolders.length === 0 && selectedProjectFolders.length === 0) {
        toast.error('Er moet minimaal 1 map geselecteerd zijn');
        setShowFolderSelection(true);
        return;
      }

      // Update portal with selected folders
      await clientPortalService.updatePortalFolders(
        portal.id,
        selectedFolders,
        selectedProjectFolders
      );

      // Update local portal state
      setPortal({
        ...portal,
        shared_folders: selectedFolders,
        shared_project_folders: selectedProjectFolders
      });

      toast.success('Mappen geselecteerd! De geselecteerde mappen zijn opgeslagen.');

      // Go back to preview
      setShowPreview(true);
    } catch (error) {
      console.error('Error confirming folder selection:', error);
      toast.error('Er is een fout opgetreden bij het bevestigen van de mapselectie');
      setShowPreview(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFolder = (folder: string) => {
    setSelectedFolders(prev => {
      if (prev.includes(folder)) {
        return prev.filter(f => f !== folder);
      } else {
        return [...prev, folder];
      }
    });
  };

  const toggleProjectFolder = (folder: string) => {
    setSelectedProjectFolders(prev => {
      if (prev.includes(folder)) {
        return prev.filter(f => f !== folder);
      } else {
        return [...prev, folder];
      }
    });
  };

  const toggleVerdeler = (verdelerId: string) => {
    setSelectedVerdelerIds(prev => {
      if (prev.includes(verdelerId)) {
        // Don't allow removing all verdelers
        if (prev.length === 1) {
          toast.error('Er moet minimaal 1 verdeler geselecteerd zijn');
          return prev;
        }
        return prev.filter(id => id !== verdelerId);
      } else {
        return [...prev, verdelerId];
      }
    });
  };

  const handleConfirmVerdelerSelection = async () => {
    try {
      setIsGenerating(true);
      setShowVerdelerSelection(false);

      if (!portal) {
        toast.error('Portal niet gevonden');
        return;
      }

      // Update portal with selected verdelers
      await clientPortalService.updatePortalVerdelers(portal.id, selectedVerdelerIds);

      // Update local portal state
      setPortal({ ...portal, verdeler_ids: selectedVerdelerIds });

      // Get only selected verdelers for email template
      const selectedVerdelers = allVerdelers.filter((v: any) => selectedVerdelerIds.includes(v.id));
      const template = clientPortalService.generateEmailTemplate(project, portal, selectedVerdelers, deliveryDate);
      setEmailTemplate(template);

      toast.success('Verdelers geselecteerd! De geselecteerde verdelers zijn opgeslagen.');

      // Go to preview
      setShowPreview(true);
    } catch (error) {
      console.error('Error confirming verdeler selection:', error);
      toast.error('Er is een fout opgetreden bij het bevestigen van de verdelerselectie');
      setShowPreview(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Update email template when delivery date changes
  React.useEffect(() => {
    console.log('DeliveryDate changed:', deliveryDate);
    console.log('Portal exists:', !!portal);
    console.log('Selected verdeler IDs count:', selectedVerdelerIds.length);

    if (portal && selectedVerdelerIds.length > 0) {
      console.log('Regenerating email template with date:', deliveryDate);
      const selectedVerdelers = allVerdelers.filter((v: any) => selectedVerdelerIds.includes(v.id));
      const updatedTemplate = clientPortalService.generateEmailTemplate(project, portal, selectedVerdelers, deliveryDate);
      console.log('New template generated');
      setEmailTemplate(updatedTemplate);
    }
  }, [deliveryDate, portal, selectedVerdelerIds, allVerdelers, project]);

  const handleSendNotification = async () => {
    if (!portal) return;

    try {
      // Get only selected verdelers for the email
      const selectedVerdelers = allVerdelers.filter((v: any) => selectedVerdelerIds.includes(v.id));

      // Send the notification (this will be enhanced with actual email sending later)
      await clientPortalService.sendDeliveryNotification(portal.id, project, selectedVerdelers, deliveryDate);

      // Update project status to "Opgeleverd" when notification is sent
      await dataService.updateProject(project.id, {
        ...project,
        status: 'Opgeleverd' // Automatically set to delivered when notification is sent
      });

      toast.success('Levering notificatie verzonden naar klant!');
      setShowPreview(false);

      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Er is een fout opgetreden bij het verzenden van de notificatie');
    }
  };

  const handleCopyPortalInfo = () => {
    if (!portal) return;
    
    const info = `Portal Link: ${portal.portal_url}\nToeganscode: ${portal.access_code}`;
    navigator.clipboard.writeText(info);
    toast.success('Portal informatie gekopieerd naar klembord!');
  };

  const handleCopyEmailTemplate = () => {
    navigator.clipboard.writeText(emailTemplate);
    toast.success('Email template gekopieerd naar klembord!');
  };

  return (
    <div className="space-y-4">
      {/* Trigger Button */}
      <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Levering Notificatie</h3>
              <p className="text-sm text-gray-400">
                Genereer automatisch een klant portal en verstuur levering notificatie
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateDeliveryNotification}
            disabled={isGenerating}
            className={`bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                <span>Genereren...</span>
              </>
            ) : (
              <>
                <Mail size={20} />
                <span>Genereer Notificatie</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verdeler Selection Modal */}
      {showVerdelerSelection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-blue-400">Selecteer verdelers voor levering</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Kies welke verdelers zichtbaar zijn in het klantportaal (standaard: verdelers met status "Levering")
                </p>
              </div>
              <button
                onClick={() => setShowVerdelerSelection(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-[#2A303C]/50 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
                Verdelers ({selectedVerdelerIds.length} van {allVerdelers.length} geselecteerd)
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allVerdelers.map((verdeler: any) => {
                  const isSelected = selectedVerdelerIds.includes(verdeler.id);
                  const isLevering = verdeler.status === 'Levering';

                  return (
                    <div
                      key={verdeler.id}
                      onClick={() => toggleVerdeler(verdeler.id)}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-600 bg-[#374151] hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'border-green-500 bg-green-500' : 'border-gray-500'
                          }`}>
                            {isSelected && (
                              <CheckCircle size={16} className="text-white" />
                            )}
                          </div>
                          <Package size={18} className={isSelected ? 'text-green-400' : 'text-gray-400'} />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-medium ${
                                isSelected ? 'text-white' : 'text-gray-300'
                              }`}>
                                {verdeler.distributor_id}
                              </span>
                              {isLevering && (
                                <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
                                  Levering
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400">
                              {verdeler.kast_naam || 'Geen naam'} - {verdeler.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Minimaal 1 verdeler moet geselecteerd zijn. Verdelers met status "Levering" zijn standaard geselecteerd.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowVerdelerSelection(false)}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={handleConfirmVerdelerSelection}
                disabled={selectedVerdelerIds.length === 0 || isGenerating}
                className={`bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 ${
                  selectedVerdelerIds.length === 0 || isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Bevestigen...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>Bevestig Selectie ({selectedVerdelerIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Selection Modal */}
      {showFolderSelection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-blue-400">Selecteer te delen mappen</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Kies welke document mappen zichtbaar zijn in het klantportaal
                </p>
              </div>
              <button
                onClick={() => setShowFolderSelection(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-[#2A303C]/50 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
                Beschikbare Mappen ({selectedFolders.length + selectedProjectFolders.length} geselecteerd)
              </h3>

              {/* Verdeler Folders Section */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Verdeler Documenten</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableVerdelerFolders.map((folder) => {
                    const isSelected = selectedFolders.includes(folder);
                    return (
                      <div
                        key={folder}
                        onClick={() => toggleFolder(folder)}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-600 bg-[#374151] hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-500'
                          }`}>
                            {isSelected && (
                              <CheckCircle size={16} className="text-white" />
                            )}
                          </div>
                          <Folder size={18} className={isSelected ? 'text-blue-400' : 'text-gray-400'} />
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-white' : 'text-gray-300'
                          }`}>
                            {folder}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Folders Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Project Documenten</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableProjectFolders.map((folder) => {
                    const isSelected = selectedProjectFolders.includes(folder);
                    return (
                      <div
                        key={folder}
                        onClick={() => toggleProjectFolder(folder)}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-600 bg-[#374151] hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'border-green-500 bg-green-500' : 'border-gray-500'
                          }`}>
                            {isSelected && (
                              <CheckCircle size={16} className="text-white" />
                            )}
                          </div>
                          <Folder size={18} className={isSelected ? 'text-green-400' : 'text-gray-400'} />
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-white' : 'text-gray-300'
                          }`}>
                            {folder}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Minimaal 1 map moet geselecteerd zijn (verdeler of project)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowFolderSelection(false)}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={handleConfirmFolderSelection}
                disabled={(selectedFolders.length === 0 && selectedProjectFolders.length === 0) || isGenerating}
                className={`bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2 ${
                  (selectedFolders.length === 0 && selectedProjectFolders.length === 0) || isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Bevestigen...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>Bevestig Selectie</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && portal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-green-400">Levering Notificatie Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Portal Information */}
            <div className="bg-[#2A303C]/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-400 mb-4">Portal Informatie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Portal Link</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={portal.portal_url}
                      readOnly
                      className="flex-1 bg-[#374151] text-white border border-gray-600 rounded-lg p-2 text-sm"
                    />
                    <button
                      onClick={handleCopyPortalInfo}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                      title="Kopieer portal informatie"
                    >
                      <Copy size={16} className="text-blue-400" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Toegangscode</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={portal.access_code}
                      readOnly
                      className="flex-1 bg-[#374151] text-white border border-gray-600 rounded-lg p-2 text-sm font-mono text-center text-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Vervaldatum</label>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-white">
                      {new Date(portal.expires_at).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-400">Actief</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Verdelers Info */}
            <div className="bg-[#2A303C]/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Geselecteerde Verdelers</h3>
              <div className="flex flex-wrap gap-2">
                {allVerdelers
                  .filter((v: any) => selectedVerdelerIds.includes(v.id))
                  .map((verdeler: any) => (
                    <div
                      key={verdeler.id}
                      className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2"
                    >
                      <Package size={14} className="text-green-400" />
                      <span className="text-sm text-green-300">
                        {verdeler.distributor_id} - {verdeler.kast_naam || 'Geen naam'}
                      </span>
                      <span className="text-xs text-gray-400">({verdeler.status})</span>
                    </div>
                  ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Deze verdelers zijn zichtbaar voor de klant in het portal. Klik op "Selecteer Verdelers" om aan te passen.
              </p>
            </div>

            {/* Shared Folders Info */}
            <div className="bg-[#2A303C]/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-purple-400 mb-4">Gedeelde Mappen</h3>

              {selectedFolders.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Verdeler Documenten</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedFolders.map((folder) => (
                      <div
                        key={folder}
                        className="flex items-center space-x-2 bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2"
                      >
                        <Folder size={14} className="text-blue-400" />
                        <span className="text-sm text-blue-300">{folder}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedProjectFolders.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Project Documenten</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProjectFolders.map((folder) => (
                      <div
                        key={folder}
                        className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2"
                      >
                        <Folder size={14} className="text-green-400" />
                        <span className="text-sm text-green-300">{folder}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFolders.length === 0 && selectedProjectFolders.length === 0 && (
                <p className="text-sm text-gray-400">Geen mappen geselecteerd</p>
              )}

              <p className="text-xs text-gray-500 mt-3">
                Deze mappen zijn zichtbaar voor de klant in het portal. Klik op "Selecteer Mappen" om aan te passen.
              </p>
            </div>

            {/* Delivery Date Selection */}
            <div className="bg-[#2A303C]/50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-orange-400 mb-4">Levering Planning</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Verwachte leverdatum</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="input-field"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laat leeg voor "zoals afgesproken"
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setDeliveryDate('')}
                    className="btn-secondary text-sm"
                  >
                    Datum wissen
                  </button>
                </div>
              </div>
            </div>

            {/* Email Preview */}
            <div className="bg-[#2A303C]/50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-400">Email Preview</h3>
                <button
                  onClick={handleCopyEmailTemplate}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Copy size={16} />
                  <span>Kopieer Email</span>
                </button>
              </div>
              
              <div className="bg-[#374151] text-white rounded-lg p-6 font-sans border border-gray-600">
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Mail size={16} className="text-gray-300" />
                    <span className="text-sm text-gray-300">Aan: {project.client}</span>
                  </div>
                  <h4 className="font-semibold text-lg">
                    Verdelers gereed voor levering - Project {project.project_number}
                  </h4>
                </div>
                
                <div className="whitespace-pre-line text-sm leading-relaxed text-white">
                  {emailTemplate}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowPreview(false)}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={handleOpenVerdelerSelection}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2"
                >
                  <Package size={20} />
                  <span>Selecteer Verdelers</span>
                </button>
                <button
                  onClick={handleOpenFolderSelection}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2"
                >
                  <Folder size={20} />
                  <span>Selecteer Mappen</span>
                </button>
                <button
                  onClick={handleSendNotification}
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2"
                >
                  <Send size={20} />
                  <span>Verstuur Notificatie</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNotificationManager;