import React, { useState, useEffect } from 'react';
import {
  Globe, Eye, Copy, Calendar, Package, Users, Mail,
  ExternalLink, Trash2, RefreshCw, AlertTriangle, CheckCircle, X as CloseIcon,
  Clock, Truck, MapPin, Search, Filter, FolderOpen, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clientPortalService } from '../lib/clientPortalService';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { dataService } from '../lib/supabase';

const availableFolders = [
  'Verdeler aanzicht',
  'Test certificaat',
  'Algemene informatie',
  'Installatie schema',
  'DWG Bestanden',
  'Warmte berekening',
  'RVS behuizing',
  'Onderdelen',
  'Handleidingen',
  'Documentatie',
  'Oplever foto\'s',
  'Klant informatie',
  'Pakbon',
];

const ClientPortalManagement = () => {
  const { hasPermission, currentUser } = useEnhancedPermissions();
  const [portals, setPortals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPortal, setSelectedPortal] = useState<any>(null);
  const [editingFoldersPortal, setEditingFoldersPortal] = useState<any>(null);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);

  useEffect(() => {
    loadPortals();
  }, []);

  const loadPortals = async () => {
    try {
      setLoading(true);
      let data = await clientPortalService.getAllClientPortals();
      
      // Role-based filtering for Tester users
      if (currentUser?.role === 'tester') {
        // Get all projects to check which ones are in testing phase
        const projects = await dataService.getProjects();
        const testingProjects = projects.filter((project: any) => 
          project.status?.toLowerCase() === 'testen'
        );
        const testingProjectIds = testingProjects.map(p => p.id);
        
        const beforeFilter = data?.length || 0;
        data = data?.filter((portal: any) => {
          const isFromTestingProject = testingProjectIds.includes(portal.project_id);
          
          if (!isFromTestingProject) {
            console.log(`🧪 CLIENT_PORTALS TESTER FILTER: Hiding portal for project ${portal.projects?.project_number} from tester ${currentUser.username} - NOT FROM TESTING PROJECT`);
          }
          
          return isFromTestingProject;
        });
        console.log(`🧪 CLIENT_PORTALS TESTER FILTER: Filtered ${beforeFilter} portals down to ${data?.length || 0} for tester ${currentUser.username}`);
      }
      
      setPortals(data || []);
    } catch (error) {
      console.error('Error loading portals:', error);
      toast.error('Er is een fout opgetreden bij het laden van de portals');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPortalInfo = (portal: any) => {
    const info = `Portal Link: ${portal.portal_url}\nToeganscode: ${portal.access_code}`;
    navigator.clipboard.writeText(info);
    toast.success('Portal informatie gekopieerd!');
  };

  const handleDeactivatePortal = async (portalId: string) => {
    if (!hasPermission('client_portals', 'update')) {
      toast.error('Je hebt geen toestemming om portals te deactiveren');
      return;
    }

    if (window.confirm('Weet je zeker dat je deze portal wilt deactiveren?')) {
      try {
        await clientPortalService.updateDeliveryStatus(portalId, 'completed');
        await loadPortals();
        toast.success('Portal gedeactiveerd!');
      } catch (error) {
        console.error('Error deactivating portal:', error);
        toast.error('Er is een fout opgetreden bij het deactiveren van de portal');
      }
    }
  };

  const handleReactivatePortal = async (portalId: string) => {
    if (!hasPermission('client_portals', 'update')) {
      toast.error('Je hebt geen toestemming om portals te wijzigen');
      return;
    }

    if (window.confirm('Weet je zeker dat je deze portal wilt heractiveren? De vervaldatum wordt verlengd met 30 dagen.')) {
      try {
        await clientPortalService.reactivatePortal(portalId);
        await loadPortals();
        toast.success('Portal hergeactiveerd voor 30 dagen!');
      } catch (error) {
        console.error('Error reactivating portal:', error);
        toast.error('Er is een fout opgetreden bij het heractiveren van de portal');
      }
    }
  };

  const handleOpenFolderEditor = (portal: any) => {
    if (!hasPermission('client_portals', 'update')) {
      toast.error('Je hebt geen toestemming om portal instellingen te wijzigen');
      return;
    }
    setEditingFoldersPortal(portal);
    setSelectedFolders(portal.shared_folders || []);
  };

  const handleToggleFolder = (folder: string) => {
    setSelectedFolders(prev =>
      prev.includes(folder)
        ? prev.filter(f => f !== folder)
        : [...prev, folder]
    );
  };

  const handleSaveFolders = async () => {
    if (!editingFoldersPortal) return;

    try {
      await clientPortalService.updatePortalFolders(editingFoldersPortal.id, selectedFolders);
      await loadPortals();
      setEditingFoldersPortal(null);
      toast.success('Gedeelde mappen bijgewerkt!');
    } catch (error) {
      console.error('Error updating shared folders:', error);
      toast.error('Er is een fout opgetreden bij het bijwerken van de mappen');
    }
  };
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'preparing':
        return { icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Wordt voorbereid' };
      case 'ready':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Gereed' };
      case 'in_transit':
        return { icon: Truck, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Onderweg' };
      case 'delivered':
        return { icon: MapPin, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Geleverd' };
      case 'completed':
        return { icon: CheckCircle, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Voltooid' };
      default:
        return { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Onbekend' };
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const filteredPortals = portals.filter(portal => {
    const matchesSearch = 
      portal.projects?.project_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portal.projects?.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      portal.access_code.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || portal.delivery_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Portals laden...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-white mb-2">Klant Portals</h1>
            <p className="text-gray-400">Beheer alle klant portals en levering notificaties</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={loadPortals}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw size={20} />
              <span>Vernieuwen</span>
            </button>
            <div className="text-sm text-gray-400">
              {portals.length} portals
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Zoeken op project, klant of toegangscode..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Alle statussen</option>
              <option value="preparing">Wordt voorbereid</option>
              <option value="ready">Gereed</option>
              <option value="in_transit">Onderweg</option>
              <option value="delivered">Geleverd</option>
              <option value="completed">Voltooid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Portals Table */}
      <div className="card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="table-header text-left">Project</th>
                <th className="table-header text-left">Klant</th>
                <th className="table-header text-left">Toegangscode</th>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Aangemaakt</th>
                <th className="table-header text-left">Vervalt</th>
                <th className="table-header text-left">Toegang</th>
                <th className="table-header text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredPortals.map((portal) => {
                const statusInfo = getStatusInfo(portal.delivery_status);
                const StatusIcon = statusInfo.icon;
                const expired = isExpired(portal.expires_at);
                
                return (
                  <tr key={portal.id} className="table-row">
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="font-medium text-blue-400">
                          {portal.projects?.project_number}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">
                      {portal.projects?.client || portal.clients?.name || '-'}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-lg">{portal.access_code}</span>
                        <button
                          onClick={() => handleCopyPortalInfo(portal)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Kopieer portal informatie"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        <StatusIcon size={16} className={statusInfo.color} />
                        <span className={`px-3 py-1 rounded-full text-sm ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">
                      {new Date(portal.created_at).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        {expired ? (
                          <AlertTriangle size={16} className="text-red-400" />
                        ) : (
                          <Calendar size={16} className="text-gray-400" />
                        )}
                        <span className={expired ? 'text-red-400' : 'text-gray-300'}>
                          {new Date(portal.expires_at).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="text-center">
                        <div className="text-white font-medium">{portal.access_count || 0}</div>
                        <div className="text-xs text-gray-400">
                          {portal.last_accessed 
                            ? new Date(portal.last_accessed).toLocaleDateString('nl-NL')
                            : 'Nooit'
                          }
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => window.open(portal.portal_url, '_blank')}
                          className="p-2 bg-[#2A303C] hover:bg-blue-500/20 rounded-lg transition-colors group"
                          title="Open portal"
                        >
                          <ExternalLink size={16} className="text-gray-400 group-hover:text-blue-400" />
                        </button>
                        <button
                          onClick={() => setSelectedPortal(portal)}
                          className="p-2 bg-[#2A303C] hover:bg-green-500/20 rounded-lg transition-colors group"
                          title="Details bekijken"
                        >
                          <Eye size={16} className="text-gray-400 group-hover:text-green-400" />
                        </button>
                        {hasPermission('client_portals', 'update') && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFolderEditor(portal);
                              }}
                              className="p-2 bg-[#2A303C] hover:bg-purple-500/20 rounded-lg transition-colors group"
                              title="Mappen beheren"
                            >
                              <FolderOpen size={16} className="text-gray-400 group-hover:text-purple-400" />
                            </button>
                            {expired || !portal.is_active ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReactivatePortal(portal.id);
                                }}
                                className="p-2 bg-[#2A303C] hover:bg-blue-500/20 rounded-lg transition-colors group"
                                title="Heractiveren"
                              >
                                <RefreshCw size={16} className="text-gray-400 group-hover:text-blue-400" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeactivatePortal(portal.id);
                                }}
                                className="p-2 bg-[#2A303C] hover:bg-red-500/20 rounded-lg transition-colors group"
                                title="Deactiveren"
                              >
                                <Trash2 size={16} className="text-gray-400 group-hover:text-red-400" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredPortals.length === 0 && (
            <div className="text-center py-12">
              <Globe size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">Geen portals gevonden</p>
              <p className="text-gray-500 text-sm mt-2">
                Portals worden automatisch aangemaakt wanneer een project status wordt gewijzigd naar "Levering"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Portal Details Modal */}
      {selectedPortal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Portal Details</h2>
              <button
                onClick={() => setSelectedPortal(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#2A303C]/50 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-1">Project</label>
                  <p className="font-medium text-white">{selectedPortal.projects?.project_number}</p>
                </div>
                <div className="bg-[#2A303C]/50 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-1">Klant</label>
                  <p className="font-medium text-white">{selectedPortal.projects?.client}</p>
                </div>
                <div className="bg-[#2A303C]/50 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-1">Toegangscode</label>
                  <p className="font-mono text-lg text-white">{selectedPortal.access_code}</p>
                </div>
                <div className="bg-[#2A303C]/50 rounded-lg p-4">
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const info = getStatusInfo(selectedPortal.delivery_status);
                      const Icon = info.icon;
                      return (
                        <>
                          <Icon size={16} className={info.color} />
                          <span className={info.color}>{info.label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Access Stats */}
              <div className="bg-[#2A303C]/50 rounded-lg p-4">
                <h3 className="font-medium text-gray-300 mb-3">Toegang Statistieken</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{selectedPortal.access_count || 0}</div>
                    <div className="text-sm text-gray-400">Keer bezocht</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {selectedPortal.last_accessed ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-gray-400">Ooit bezocht</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {Math.ceil((new Date(selectedPortal.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-sm text-gray-400">Dagen resterend</div>
                  </div>
                </div>
              </div>

              {/* Portal URL */}
              <div className="bg-[#2A303C]/50 rounded-lg p-4">
                <label className="block text-sm text-gray-400 mb-2">Portal URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={selectedPortal.portal_url}
                    readOnly
                    className="flex-1 bg-[#374151] text-white border border-gray-600 rounded-lg p-2 text-sm"
                  />
                  <button
                    onClick={() => window.open(selectedPortal.portal_url, '_blank')}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                    title="Open portal"
                  >
                    <ExternalLink size={16} className="text-blue-400" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => handleCopyPortalInfo(selectedPortal)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Copy size={16} />
                  <span>Kopieer Info</span>
                </button>
                <button
                  onClick={() => handleDeactivatePortal(selectedPortal.id)}
                  className="btn-secondary flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                  disabled={!selectedPortal.is_active}
                >
                  <Trash2 size={16} />
                  <span>Deactiveren</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folder Editor Modal */}
      {editingFoldersPortal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E2530] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Gedeelde Mappen Beheren</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Project: {editingFoldersPortal.projects?.project_number}
                </p>
              </div>
              <button
                onClick={() => setEditingFoldersPortal(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Selecteer welke mappen zichtbaar zijn voor de klant in hun portal:
              </p>

              <div className="space-y-2">
                {availableFolders.map((folder) => (
                  <label
                    key={folder}
                    className="flex items-center space-x-3 p-3 bg-[#2A303C]/50 rounded-lg hover:bg-[#2A303C] transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFolders.includes(folder)}
                      onChange={() => handleToggleFolder(folder)}
                      className="w-5 h-5 rounded border-gray-600 bg-[#1E2530] text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <FolderOpen size={18} className="text-gray-400" />
                    <span className="text-white flex-1">{folder}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-400">
                  <strong>{selectedFolders.length}</strong> van <strong>{availableFolders.length}</strong> mappen geselecteerd
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setEditingFoldersPortal(null)}
                className="btn-secondary"
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveFolders}
                className="btn-primary flex items-center space-x-2"
                disabled={selectedFolders.length === 0}
              >
                <FolderOpen size={16} />
                <span>Opslaan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortalManagement;