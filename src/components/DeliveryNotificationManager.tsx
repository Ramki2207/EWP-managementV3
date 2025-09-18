import React, { useState } from 'react';
import { Mail, Send, Eye, Copy, Calendar, Package, AlertCircle, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientPortalService } from '../lib/clientPortalService';
import { dataService } from '../lib/supabase';

interface DeliveryNotificationManagerProps {
  project: any;
  onStatusChange?: () => void;
}

const DeliveryNotificationManager: React.FC<DeliveryNotificationManagerProps> = ({ 
  project, 
  onStatusChange 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [portal, setPortal] = useState<any>(null);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [verdelers, setVerdelers] = useState<any[]>([]);

  const handleGenerateDeliveryNotification = async () => {
    try {
      setIsGenerating(true);
      
      // Check if portal already exists for this project
      const existingPortals = await clientPortalService.getAllClientPortals();
      const existingPortal = existingPortals.find(p => p.project_id === project.id && p.is_active);
      
      if (existingPortal) {
        // Use existing portal instead of creating new one
        const verdelers = await dataService.getDistributorsByProject(project.id);
        setVerdelers(verdelers);
        const template = clientPortalService.generateEmailTemplate(project, existingPortal, verdelers, deliveryDate);
        
        setPortal(existingPortal);
        setEmailTemplate(template);
        setShowPreview(true);
        
        toast.success('Bestaande portal geladen voor dit project!');
        return;
      }
      
      // Get project verdelers
      const verdelers = await dataService.getDistributorsByProject(project.id);
      
      if (verdelers.length === 0) {
        toast.error('Geen verdelers gevonden voor dit project');
        return;
      }

      // Find client for this project
      const clients = await dataService.getClients();
      const client = clients.find((c: any) => c.name === project.client);

      // Create client portal
      const newPortal = await clientPortalService.createClientPortal(
        project.id,
        client?.id
      );

      // Generate email template
      const template = clientPortalService.generateEmailTemplate(project, newPortal, verdelers, deliveryDate);
      
      setPortal(newPortal);
      setVerdelers(verdelers);
      setEmailTemplate(template);
      setShowPreview(true);
      
      toast.success('Nieuwe portal aangemaakt voor dit project!');
    } catch (error) {
      console.error('Error generating delivery notification:', error);
      toast.error('Er is een fout opgetreden bij het genereren van de notificatie');
    } finally {
      setIsGenerating(false);
    }
  };

  // Update email template when delivery date changes
  React.useEffect(() => {
    console.log('DeliveryDate changed:', deliveryDate);
    console.log('Portal exists:', !!portal);
    console.log('Verdelers count:', verdelers.length);
    
    if (portal && verdelers.length > 0) {
      console.log('Regenerating email template with date:', deliveryDate);
      const updatedTemplate = clientPortalService.generateEmailTemplate(project, portal, verdelers, deliveryDate);
      console.log('New template generated');
      setEmailTemplate(updatedTemplate);
    }
  }, [deliveryDate, portal, verdelers, project]);

  const handleSendNotification = async () => {
    if (!portal) return;

    try {
      // Get verdelers for the email
      const verdelers = await dataService.getDistributorsByProject(project.id);
      
      // Send the notification (this will be enhanced with actual email sending later)
      await clientPortalService.sendDeliveryNotification(portal.id, project, verdelers, deliveryDate);
      
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
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowPreview(false)}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={handleSendNotification}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-6 py-3 rounded-xl shadow-lg transition-all flex items-center space-x-2"
              >
                <Send size={20} />
                <span>Verstuur Notificatie</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNotificationManager;