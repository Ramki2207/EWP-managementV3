import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FolderOpen, Trash2, Server } from 'lucide-react';
import toast from "react-hot-toast";
import { dataService } from '../lib/supabase';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';
import { hasLocationAccess } from '../lib/locationUtils';
import { useLocationFilter } from '../contexts/LocationFilterContext';

const Verdelers = () => {
  const navigate = useNavigate();
  const { currentUser } = useEnhancedPermissions();
  const { isLocationVisible } = useLocationFilter();
  const [distributors, setDistributors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDistributors();
  }, [currentUser]);

  const loadDistributors = async () => {
    try {
      setLoading(true);
      const data = await dataService.getDistributors();
      
      // Apply location filtering based on user's assigned locations
      let filteredDistributors = data || [];
      
      console.log('🌍 VERDELERS: Raw distributors loaded:', filteredDistributors.length);
      console.log('🌍 VERDELERS: Current user:', currentUser?.username, 'Assigned locations:', currentUser?.assignedLocations);

      // Role-based filtering for Montage users
      if (currentUser?.role === 'montage') {
        const beforeMontageFilter = filteredDistributors.length;
        filteredDistributors = filteredDistributors.filter((distributor: any) => {
          const isAssignedToUser = distributor.toegewezen_monteur === currentUser.username;

          if (!isAssignedToUser) {
            console.log(`🔧 MONTAGE FILTER: Hiding distributor ${distributor.distributor_id} (assigned to: ${distributor.toegewezen_monteur}) from monteur ${currentUser.username} - NOT ASSIGNED`);
          } else {
            console.log(`🔧 MONTAGE FILTER: Showing distributor ${distributor.distributor_id} to monteur ${currentUser.username} - ASSIGNED TO USER`);
          }

          return isAssignedToUser;
        });
        console.log(`🔧 MONTAGE FILTER: Filtered ${beforeMontageFilter} distributors down to ${filteredDistributors.length} for monteur ${currentUser.username}`);
      }

      // Role-based filtering for Tester users
      if (currentUser?.role === 'tester') {
        const beforeRoleFilter = filteredDistributors.length;
        filteredDistributors = filteredDistributors.filter((distributor: any) => {
          const projectStatus = distributor.projects?.status;
          const verdelerStatus = distributor.status;
          const hasProjectTestingStatus = projectStatus?.toLowerCase() === 'testen';
          const hasVerdelerTestingStatus = verdelerStatus?.toLowerCase() === 'testen';
          const shouldShow = hasProjectTestingStatus || hasVerdelerTestingStatus;

          if (!shouldShow) {
            console.log(`🧪 TESTER FILTER: Hiding distributor ${distributor.distributor_id} (project status: ${projectStatus}, verdeler status: ${verdelerStatus}) from tester ${currentUser.username} - NOT IN TESTING PHASE`);
          } else {
            console.log(`🧪 TESTER FILTER: Showing distributor ${distributor.distributor_id} (project status: ${projectStatus}, verdeler status: ${verdelerStatus}) to tester ${currentUser.username} - IN TESTING PHASE`);
          }

          return shouldShow;
        });
        console.log(`🧪 TESTER FILTER: Filtered ${beforeRoleFilter} distributors down to ${filteredDistributors.length} for tester ${currentUser.username}`);
      }

      // Role-based filtering for Logistiek users
      if (currentUser?.role === 'logistiek') {
        const beforeLogistiekFilter = filteredDistributors.length;
        filteredDistributors = filteredDistributors.filter((distributor: any) => {
          const verdelerStatus = distributor.status;
          const isInLevering = verdelerStatus === 'Levering';

          if (!isInLevering) {
            console.log(`📦 LOGISTIEK FILTER: Hiding distributor ${distributor.distributor_id} (status: ${verdelerStatus}) from logistiek ${currentUser.username} - NOT IN LEVERING`);
          } else {
            console.log(`📦 LOGISTIEK FILTER: Showing distributor ${distributor.distributor_id} (status: ${verdelerStatus}) to logistiek ${currentUser.username} - IN LEVERING`);
          }

          return isInLevering;
        });
        console.log(`📦 LOGISTIEK FILTER: Filtered ${beforeLogistiekFilter} distributors down to ${filteredDistributors.length} for logistiek ${currentUser.username}`);
      }
      
      // Location filter for specific users (applies first)
      if (currentUser?.username === 'Lysander Koenraadt' ||
          currentUser?.username === 'Patrick Herman' ||
          currentUser?.username === 'Stefano de Weger') {
        const beforeFilter = filteredDistributors.length;
        filteredDistributors = filteredDistributors.filter((distributor: any) => {
          const projectLocation = distributor.projects?.location;
          if (!isLocationVisible(projectLocation)) {
            console.log(`📍 LOCATION FILTER: Hiding distributor ${distributor.distributor_id} (project location: ${projectLocation})`);
            return false;
          }
          return true;
        });
        console.log(`📍 LOCATION FILTER: Filtered ${beforeFilter} distributors down to ${filteredDistributors.length} for ${currentUser.username}`);
      }

      // Apply location-based filtering for users with restricted location access
      if (currentUser?.assignedLocations && Array.isArray(currentUser.assignedLocations) && currentUser.assignedLocations.length > 0) {
        // If user doesn't have access to all locations, filter by assigned locations
        if (currentUser.assignedLocations.length < AVAILABLE_LOCATIONS.length) {
          const beforeFilter = filteredDistributors.length;
          console.log(`🌍 VERDELERS LOCATION FILTER: Starting with ${beforeFilter} distributors for ${currentUser.username}`);
          console.log(`🌍 VERDELERS LOCATION FILTER: User assigned locations:`, currentUser.assignedLocations);

          filteredDistributors = filteredDistributors.filter((distributor: any) => {
            const projectLocation = distributor.projects?.location;
            // Check if user has access to this location (with backward compatibility)
            const hasAccess = hasLocationAccess(projectLocation, currentUser.assignedLocations);

            if (!hasAccess) {
              console.log(`🌍 VERDELERS FILTER: Hiding distributor ${distributor.distributor_id} (project location: ${projectLocation}) from user ${currentUser.username} - NO ACCESS`);
            } else {
              console.log(`🌍 VERDELERS FILTER: Showing distributor ${distributor.distributor_id} (project location: ${projectLocation}) to user ${currentUser.username} - HAS ACCESS`);
            }

            return hasAccess;
          });
          console.log(`🌍 VERDELERS FILTER: Filtered ${beforeFilter} distributors down to ${filteredDistributors.length} for user ${currentUser.username}`);
        } else {
          console.log(`🌍 VERDELERS FILTER: User ${currentUser.username} has access to all ${AVAILABLE_LOCATIONS.length} locations - showing all distributors`);
        }
      } else {
        console.log(`🌍 VERDELERS FILTER: User ${currentUser?.username} has no valid location restrictions (assignedLocations:`, currentUser?.assignedLocations, `) - showing all distributors`);
      }

      // Filter for Stefano de Weger and Patrick Herman when viewing as Projectleider
      const viewAsRole = localStorage.getItem('viewAsRole');
      if (
        currentUser &&
        (currentUser.username === 'Stefano de Weger' || currentUser.username === 'Patrick Herman') &&
        viewAsRole === 'projectleider'
      ) {
        const beforeFilter = filteredDistributors.length;
        filteredDistributors = filteredDistributors.filter((distributor: any) => {
          const shouldShow = distributor.created_by === currentUser.id;
          console.log(`👤 VERDELERS PROJECTLEIDER FILTER: Verdeler ${distributor.distributor_id} - created_by: ${distributor.created_by}, currentUser.id: ${currentUser.id}, shouldShow: ${shouldShow}`);
          return shouldShow;
        });
        console.log(`👤 VERDELERS PROJECTLEIDER FILTER: Filtered ${beforeFilter} verdelers down to ${filteredDistributors.length} for ${currentUser.username} (only own verdelers)`);
      }

      setDistributors(filteredDistributors);
    } catch (error) {
      console.error('Error loading distributors:', error);
      toast.error(error.message || 'Er is een fout opgetreden bij het laden van de verdelers');
    } finally {
      setLoading(false);
    }
  };

  const filteredDistributors = distributors.filter(
    (d) =>
      d.distributor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.kast_naam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.projects?.project_number?.includes(searchTerm)
  );

  const handleDeleteDistributor = async (distributorId: string) => {
    const distributorToDelete = distributors.find(d => d.id === distributorId);
    if (!distributorToDelete) return;

    if (window.confirm('Weet je zeker dat je deze verdeler wilt verwijderen?')) {
      try {
        await dataService.deleteDistributor(distributorId);
        setDistributors(distributors.filter((d) => d.id !== distributorId));
        toast.success("Verdeler succesvol verwijderd!");
      } catch (error) {
        console.error('Error deleting distributor:', error);
        toast.error('Er is een fout opgetreden bij het verwijderen van de verdeler');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Verdelers laden...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="card p-6 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">Verdelers overzicht</h1>
          <p className="text-gray-400">Beheer al je verdelers op één plek</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-6 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Zoeken op verdeler ID, kastnaam of projectnummer..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-6">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pr-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="table-header text-left">Verdeler ID</th>
                <th className="table-header text-left">Kastnaam</th>
                <th className="table-header text-left">Projectnummer</th>
                <th className="table-header text-left">Klant</th>
                <th className="table-header text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistributors.map((distributor) => (
                <tr
                  key={distributor.id}
                  className={`cursor-pointer ${
                    distributor.status?.toLowerCase() === 'vervallen'
                      ? 'bg-red-500/10 hover:bg-red-500/20'
                      : 'table-row'
                  }`}
                  onClick={() => navigate(`/verdelers/${distributor.id}`)}
                >
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        distributor.status?.toLowerCase() === 'vervallen' ? 'bg-red-400' :
                        distributor.status?.toLowerCase() === 'testen' ? 'bg-orange-400' : 'bg-green-400'
                      }`}></div>
                      <span className={`font-medium ${
                        distributor.status?.toLowerCase() === 'vervallen' ? 'text-red-400' :
                        distributor.status?.toLowerCase() === 'testen' ? 'text-orange-400' : 'text-green-400'
                      }`}>{distributor.distributor_id}</span>
                      {distributor.status?.toLowerCase() === 'testen' && (
                        <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                          Testen
                        </span>
                      )}
                      {distributor.status?.toLowerCase() === 'vervallen' && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                          Vervallen
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-gray-300">{distributor.kast_naam || "-"}</td>
                  <td className="py-4 text-gray-300">{distributor.projects?.project_number || "-"}</td>
                  <td className="py-4 text-gray-300">{distributor.projects?.client || "-"}</td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/verdelers/${distributor.id}`);
                        }}
                        className="p-2 bg-[#2A303C] hover:bg-green-500/20 rounded-lg transition-colors group"
                        title="Openen"
                      >
                        <FolderOpen size={16} className="text-gray-400 group-hover:text-green-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDistributor(distributor.id);
                        }}
                        className="p-2 bg-[#2A303C] hover:bg-red-500/20 rounded-lg transition-colors group"
                        title="Verwijderen"
                      >
                        <Trash2 size={16} className="text-gray-400 group-hover:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDistributors.length === 0 && (
            <div className="text-center py-12">
              <Server size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">Geen verdelers gevonden</p>
              <p className="text-gray-500 text-sm mt-2">Probeer een andere zoekterm of voeg een nieuwe verdeler toe</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verdelers;