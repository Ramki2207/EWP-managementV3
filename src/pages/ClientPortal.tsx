import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Lock, Eye, Download, Calendar, Package, CheckCircle,
  AlertTriangle, FileText, Server, Building, User, Mail, Phone,
  Folder, ChevronRight, ChevronDown, X
} from 'lucide-react';
import { clientPortalService } from '../lib/clientPortalService';
import { dataService } from '../lib/supabase';
import toast from 'react-hot-toast';
import ewpLogo from '../assets/ewp-logo.png';

const ClientPortal = () => {
  const { accessCode } = useParams<{ accessCode: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portalData, setPortalData] = useState<any>(null);
  const [verdelers, setVerdelers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedDistributors, setExpandedDistributors] = useState<Set<string>>(new Set());
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'distributors' | 'documents'>('overview');
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Get shared folders from portal data, or fall back to defaults
  const sharedFolders = portalData?.shared_folders || [
    'Verdeler aanzicht',
    'Test certificaat',
    'Installatie schema'
  ];

  console.log('Current portalData:', portalData);
  console.log('Shared folders being used:', sharedFolders);

  useEffect(() => {
    // Never auto-authenticate - always require manual code entry
    if (accessCode) {
      // Just pre-fill the input but don't auto-authenticate
      setInputCode(accessCode);
    }
  }, [accessCode]);

  const handleAuthenticate = async (code: string) => {
    if (!code || code.length < 5) {
      setError('Voer een geldige toegangscode in');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const portal = await clientPortalService.getPortalByAccessCode(code);
      
      if (!portal) {
        setError('Ongeldige of verlopen toegangscode');
        return;
      }

      // Track portal access
      await clientPortalService.trackPortalAccess(portal.id);

      console.log('Portal data loaded:', portal);
      console.log('Shared folders from portal:', portal.shared_folders);

      setPortalData(portal);
      setIsAuthenticated(true);
      
      // Load project verdelers
      const projectVerdelers = await clientPortalService.getPortalVerdelers(portal.project_id);
      setVerdelers(projectVerdelers);
      
      toast.success('Toegang verleend tot portal!');
      
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Er is een fout opgetreden bij het valideren van de toegangscode');
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (projectId: string, distributorId?: string, folder?: string) => {
    try {
      setDocumentsLoading(true);
      console.log('🔍 Loading documents for client portal:', { projectId, distributorId, folder });

      const docs = await dataService.getDocuments(projectId, distributorId, folder);
      console.log('📦 Raw documents loaded from database:', docs?.length || 0);
      console.log('📦 First document example:', docs?.[0]);

      // Process documents and load their content
      const docsWithContent = await Promise.all(
        (docs || []).map(async (doc) => {
          console.log('🔄 Processing document:', doc.name);
          console.log('  - Has storage_path:', !!doc.storage_path);
          console.log('  - Has content field:', !!doc.content);

          // If document uses storage, generate public URL
          if (doc.storage_path) {
            const storageUrl = dataService.getStorageUrl(doc.storage_path);
            console.log('✅ Generated storage URL for:', doc.name);
            return {
              ...doc,
              content: storageUrl
            };
          }

          // If document has base64 content in metadata, fetch it
          if (!doc.content) {
            try {
              console.log('📥 Fetching content for legacy document:', doc.name);
              const content = await dataService.getDocumentContent(doc.id);
              console.log('✅ Content fetched for:', doc.name);
              return {
                ...doc,
                content
              };
            } catch (error) {
              console.error('❌ Failed to fetch content for:', doc.name, error);
              return doc;
            }
          }

          return doc;
        })
      );

      console.log('✨ Documents with content prepared:', docsWithContent.length);
      setDocuments(docsWithContent);
    } catch (error) {
      console.error('❌ Error loading documents:', error);
      setDocuments([]);
      toast.error('Er is een fout opgetreden bij het laden van de documenten');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleSelectFolder = (distributorId?: string, folder?: string) => {
    setSelectedDistributor(distributorId || null);
    setSelectedFolder(folder || null);
    
    if (distributorId && folder && portalData) {
      loadDocuments(portalData.project_id, distributorId, folder);
    } else {
      setDocuments([]);
    }
  };

  const toggleDistributorExpansion = (distributorId: string) => {
    const newExpanded = new Set(expandedDistributors);
    if (newExpanded.has(distributorId)) {
      newExpanded.delete(distributorId);
    } else {
      newExpanded.add(distributorId);
    }
    setExpandedDistributors(newExpanded);
  };

  const handleDownload = async (doc: any) => {
    try {
      console.log('=== Download Debug Info ===');
      console.log('Document name:', doc.name);
      console.log('Document storage_path:', doc.storage_path);
      console.log('Document content:', doc.content ? (doc.content.substring(0, 50) + '...') : 'NULL');
      console.log('Document content type:', typeof doc.content);
      console.log('Document object:', doc);

      // If no content but has storage_path, generate URL as fallback
      let contentUrl = doc.content;
      if (!contentUrl && doc.storage_path) {
        console.log('⚠️ No content URL found, generating from storage_path...');
        contentUrl = dataService.getStorageUrl(doc.storage_path);
        console.log('✅ Generated fallback URL:', contentUrl);
      }

      // Check if document has valid content
      if (!contentUrl) {
        console.error('❌ No content found for document:', doc.name);
        console.error('Document has no content and no storage_path');
        toast.error('Document inhoud niet beschikbaar voor download');
        return;
      }

      toast.loading('Document downloaden...', { id: 'download' });

      // Handle different content formats
      if (contentUrl.startsWith('data:')) {
        // For data URLs (base64), use download attribute
        const linkElement = window.document.createElement('a');
        linkElement.href = contentUrl;
        linkElement.download = doc.name;
        window.document.body.appendChild(linkElement);
        linkElement.click();
        window.document.body.removeChild(linkElement);
        toast.success('Document gedownload!', { id: 'download' });
      } else if (contentUrl.startsWith('http')) {
        // For storage URLs, fetch as blob to avoid CORS and download issues
        try {
          console.log('📥 Fetching file from storage URL:', contentUrl);
          const response = await fetch(contentUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          console.log('✅ File fetched, size:', blob.size, 'bytes');
          const blobUrl = URL.createObjectURL(blob);

          const linkElement = window.document.createElement('a');
          linkElement.href = blobUrl;
          linkElement.download = doc.name;
          window.document.body.appendChild(linkElement);
          linkElement.click();
          window.document.body.removeChild(linkElement);

          // Clean up the blob URL after a short delay
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

          toast.success('Document gedownload!', { id: 'download' });
        } catch (fetchError) {
          console.error('❌ Error fetching storage file:', fetchError);
          toast.error('Download mislukt - probeer het opnieuw', { id: 'download' });
        }
      } else {
        // Assume it's base64 without data URL prefix
        const mimeType = doc.type || 'application/octet-stream';
        const dataUrl = `data:${mimeType};base64,${contentUrl}`;

        const linkElement = window.document.createElement('a');
        linkElement.href = dataUrl;
        linkElement.download = doc.name;
        window.document.body.appendChild(linkElement);
        linkElement.click();
        window.document.body.removeChild(linkElement);
        toast.success('Document gedownload!', { id: 'download' });
      }

      console.log('Download completed for:', doc.name);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error(`Download fout: ${error.message || 'Onbekende fout'}`, { id: 'download' });
    }
  };

  const handleDownloadAll = async () => {
    if (documents.length === 0) {
      toast.error('Geen documenten om te downloaden');
      return;
    }

    toast.loading('Alle documenten voorbereiden voor download...');

    try {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];

        await new Promise(resolve => setTimeout(resolve, 500));

        handleDownload(doc);
      }

      toast.dismiss();
      toast.success(`${documents.length} documenten gedownload!`);
    } catch (error) {
      console.error('Error downloading all documents:', error);
      toast.error('Er is een fout opgetreden bij het downloaden van de documenten');
    }
  };

  const getBreadcrumb = () => {
    const selectedDistributorData = verdelers.find(d => d.id === selectedDistributor);
    
    const parts = [portalData?.projects?.project_number || 'Project'];
    if (selectedDistributorData) {
      parts.push(`${selectedDistributorData.distributor_id} - ${selectedDistributorData.kast_naam || 'Naamloos'}`);
    }
    if (selectedFolder) {
      parts.push(selectedFolder);
    }
    
    return parts.join(' / ');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (type: string) => type.startsWith('image/');
  const isPDF = (type: string) => type === 'application/pdf';

  const renderPreview = (doc: any) => {
    if (isImage(doc.type)) {
      return (
        <img 
          src={doc.content} 
          alt={doc.name}
          className="max-h-[500px] object-contain mx-auto"
        />
      );
    } else if (isPDF(doc.type)) {
      return (
        <iframe
          src={doc.content}
          className="w-full h-[500px]"
          title={doc.name}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <FileText size={64} className="text-gray-400 mb-4" />
          <p className="text-gray-400">Preview niet beschikbaar voor dit bestandstype</p>
        </div>
      );
    }
  };

  const getDeliveryStatusLabel = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'Wordt voorbereid';
      case 'ready':
        return 'Gereed voor levering';
      case 'in_transit':
        return 'Onderweg';
      case 'delivered':
        return 'Geleverd';
      case 'completed':
        return 'Voltooid';
      default:
        return 'Onbekend';
    }
  };

  // Authentication screen - ALWAYS show this first unless authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-[#1a1a1a] to-[#111] flex items-center justify-center p-4">
        <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src={ewpLogo} alt="EWP Paneelbouw" className="h-16 w-auto object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Klant Portal</h1>
            <p className="text-gray-400">Voer uw toegangscode in om uw projectdocumenten te bekijken</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleAuthenticate(inputCode); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Toegangscode
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setError('');
                }}
                className="w-full bg-[#2A303C] text-white border border-gray-700 rounded-lg p-3 text-center text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Voer uw code in"
                maxLength={10}
                disabled={loading}
              />
              {error && (
                <p className="text-red-400 text-sm mt-2 flex items-center space-x-2">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !inputCode}
              className={`w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 px-4 rounded-lg shadow-lg transition-all flex items-center justify-center space-x-2 ${
                loading || !inputCode ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Valideren...</span>
                </>
              ) : (
                <>
                  <Eye size={20} />
                  <span>Toegang tot portal</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              © 2025 EWP Paneelbouw - Beveiligde klant portal
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main portal interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-[#1a1a1a] to-[#111] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={ewpLogo} alt="EWP Paneelbouw" className="h-12 w-auto object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-white">Klant Portal</h1>
                <p className="text-gray-400">Project {portalData?.projects?.project_number}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                <Package size={16} className="text-green-400" />
                <span className="font-medium text-green-400">
                  {getDeliveryStatusLabel(portalData?.delivery_status || 'ready')}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Toegang verloopt: {portalData?.expires_at ? new Date(portalData.expires_at).toLocaleDateString('nl-NL') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-4 mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white'
                  : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
              }`}
            >
              Project Overzicht
            </button>
            <button
              onClick={() => setActiveTab('distributors')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'distributors'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white'
                  : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
              }`}
            >
              Verdeler Specificaties
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'documents'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white'
                  : 'text-gray-400 hover:bg-[#2A303C] hover:text-white'
              }`}
            >
              Oplever documentatie
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Information */}
            <div className="lg:col-span-2 bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Building size={24} className="text-blue-400" />
                <h2 className="text-xl font-semibold text-white">Project Informatie</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Projectnummer</label>
                  <p className="text-white font-medium">{portalData?.projects?.project_number}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Klant</label>
                  <p className="text-white font-medium">{portalData?.projects?.client}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Locatie</label>
                  <p className="text-white font-medium">{portalData?.projects?.location}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-400 font-medium">Gereed voor levering</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Beschrijving</label>
                  <p className="text-white">{portalData?.projects?.description || '-'}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <User size={24} className="text-purple-400" />
                <h2 className="text-xl font-semibent text-white">Contactgegevens</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Bedrijf</label>
                  <p className="text-white font-medium">{portalData?.clients?.name || portalData?.projects?.client}</p>
                </div>
                {portalData?.clients?.visit_street && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Adres</label>
                    <p className="text-white">
                      {portalData.clients.visit_street}<br />
                      {portalData.clients.visit_postcode} {portalData.clients.visit_city}
                    </p>
                  </div>
                )}
                {portalData?.clients?.contacts && portalData.clients.contacts.length > 0 && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Contactpersoon</label>
                    {portalData.clients.contacts.map((contact: any, index: number) => (
                      <div key={index} className="bg-[#2A303C] p-3 rounded-lg">
                        <p className="font-medium text-white">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {contact.email && (
                          <div className="flex items-center space-x-2 mt-1">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-300">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center space-x-2 mt-1">
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-300">{contact.phone}</span>
                          </div>
                        )}
                        {contact.department && (
                          <p className="text-xs text-gray-400 mt-1">{contact.department}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'distributors' && (
          <div className="bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Server size={24} className="text-green-400" />
              <h2 className="text-xl font-semibold text-white">Verdeler Specificaties</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {verdelers.map((distributor: any) => (
                <div key={distributor.id} className="bg-[#2A303C]/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-green-400">
                      {distributor.distributor_id}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
                      ✓ Goedgekeurd
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400">Kastnaam</label>
                      <p className="text-white font-medium">{distributor.kast_naam || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400">Systeem</label>
                        <p className="text-white text-sm">{distributor.systeem || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400">Voeding</label>
                        <p className="text-white text-sm">{distributor.voeding || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400">Spanning</label>
                        <p className="text-white text-sm">{distributor.un_in_v ? `${distributor.un_in_v}V` : '-'}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400">Stroom</label>
                        <p className="text-white text-sm">{distributor.in_in_a ? `${distributor.in_in_a}A` : '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400">Fabrikant</label>
                      <p className="text-white text-sm">{distributor.fabrikant || '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {verdelers.length === 0 && (
              <div className="text-center py-8">
                <Server size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Geen verdelers beschikbaar</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="flex gap-6 h-[600px]">
            {/* Navigation Sidebar - Same as uploads page */}
            <div className="w-80 bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-4 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wide">Document Explorer</h3>
              <div className="space-y-2">
                {/* Project Level */}
                <div className="flex items-center p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Building size={16} className="mr-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{portalData?.projects?.project_number}</div>
                    {portalData?.projects?.client && (
                      <div className="text-xs opacity-75 truncate">{portalData.projects.client}</div>
                    )}
                  </div>
                  <div className="text-xs opacity-60 ml-2 flex-shrink-0">
                    {verdelers.length}
                  </div>
                </div>

                {/* Distributors Level */}
                {verdelers.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {verdelers.map((distributor: any) => (
                      <div key={distributor.id} className="space-y-1">
                        <div
                          className={`flex items-center p-2 rounded-lg transition-all cursor-pointer group ${
                            selectedDistributor === distributor.id && !selectedFolder
                              ? 'bg-gradient-to-r from-green-600 to-green-400 text-white'
                              : 'hover:bg-[#2A303C] text-gray-300 hover:text-white'
                          }`}
                          onClick={() => {
                            handleSelectFolder(distributor.id);
                            toggleDistributorExpansion(distributor.id);
                          }}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            {expandedDistributors.has(distributor.id) ? (
                              <ChevronDown size={14} className="mr-2 flex-shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="mr-2 flex-shrink-0" />
                            )}
                            <Server size={14} className="mr-2 flex-shrink-0 text-green-400" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">
                                {distributor.distributor_id}
                              </div>
                              {distributor.kast_naam && (
                                <div className="text-xs opacity-75 truncate">
                                  {distributor.kast_naam}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Folders Level - Only show client folders */}
                        {expandedDistributors.has(distributor.id) && (
                          <div className="ml-6 space-y-1">
                            {sharedFolders.map((folder) => (
                              <div
                                key={folder}
                                className={`flex items-center p-2 rounded-lg transition-all cursor-pointer group ${
                                  selectedDistributor === distributor.id && selectedFolder === folder
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white'
                                    : 'hover:bg-[#2A303C] text-gray-300 hover:text-white'
                                }`}
                                onClick={() => handleSelectFolder(distributor.id, folder)}
                              >
                                <Folder size={12} className="mr-2 flex-shrink-0 text-purple-400" />
                                <span className="text-xs truncate">{folder}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {verdelers.length === 0 && (
                  <div className="text-center py-8">
                    <Server size={32} className="mx-auto text-gray-600 mb-2" />
                    <p className="text-gray-400 text-sm">Geen verdelers beschikbaar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-[#1E2530]/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-6 overflow-y-auto">
              {selectedDistributor && selectedFolder ? (
                <div>
                  {/* Breadcrumb and Download All Button */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center text-sm text-gray-400 space-x-2">
                      <span>Locatie:</span>
                      <div className="flex items-center space-x-2">
                        {getBreadcrumb().split(' / ').map((part, index, array) => (
                          <React.Fragment key={index}>
                            <span className="text-blue-400">{part}</span>
                            {index < array.length - 1 && <ChevronRight size={14} />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    {documents.length > 0 && (
                      <button
                        onClick={handleDownloadAll}
                        className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center space-x-2 shadow-lg"
                      >
                        <Download size={16} />
                        <span>Download Alles ({documents.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Documents */}
                  {documentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Documenten laden...</span>
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents.map((document: any) => (
                        <div key={document.id} className="bg-[#2A303C]/50 rounded-xl p-4 border border-gray-700 hover:border-blue-500/50 transition-colors">
                          <div className="mb-3">
                            <div className="flex items-start space-x-3">
                              <FileText size={20} className="text-orange-400" />
                              <div>
                                <h4 className="font-medium text-white text-sm">{document.name}</h4>
                                <p className="text-xs text-gray-400">{document.folder}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Calendar size={12} />
                                <span>{new Date(document.uploaded_at).toLocaleDateString('nl-NL')}</span>
                              </div>
                              {document.size && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <FileText size={12} />
                                  <span>{formatFileSize(document.size)}</span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleDownload(document)}
                              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1"
                            >
                              <Download size={14} />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Folder size={48} className="mx-auto text-gray-600 mb-4" />
                      <p className="text-gray-400">Geen documenten gevonden in deze map</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Documenten worden hier getoond zodra ze zijn geüpload
                      </p>
                    </div>
                  )}
                </div>
              ) : selectedDistributor ? (
                /* Folder Selection */
                <div>
                  <div className="flex items-center text-sm text-gray-400 space-x-2 mb-6">
                    <span>Selecteer een map voor:</span>
                    <span className="text-green-400">
                      {verdelers.find(v => v.id === selectedDistributor)?.distributor_id}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sharedFolders.map((folderName) => (
                      <div
                        key={folderName}
                        onClick={() => handleSelectFolder(selectedDistributor, folderName)}
                        className="bg-[#2A303C]/50 rounded-xl p-6 flex flex-col items-center justify-center space-y-3 hover:bg-[#2A303C] transition-colors cursor-pointer group min-h-[120px]"
                      >
                        <Folder
                          size={40}
                          className="text-gray-400 group-hover:text-purple-400 transition-colors"
                        />
                        <span className="text-sm text-center font-medium group-hover:text-white transition-colors">
                          {folderName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Distributor Selection */
                <div>
                  <div className="text-center py-8">
                    <Server size={48} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Selecteer een verdeler</h3>
                    <p className="text-gray-400">
                      Kies een verdeler uit de lijst links om documenten te bekijken
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Document Preview Modal */}
        {selectedDocument && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedDocument(null);
              }
            }}
          >
            <div 
              className="bg-[#1E2530] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">{selectedDocument.name}</h2>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="bg-[#2A303C] rounded-lg p-4">
                {renderPreview(selectedDocument)}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => handleDownload(selectedDocument)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Download size={20} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 p-4">
          <p className="text-sm text-gray-500">
            © 2025 EWP Paneelbouw - Beveiligde klant portal
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Portal toegang: {portalData?.access_count || 0} keer gebruikt
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;