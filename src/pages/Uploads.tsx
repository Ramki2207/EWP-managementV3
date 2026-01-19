import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Folder, FolderPlus, Trash2, Search, Plus, ChevronRight, ChevronDown, Building, Server, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentViewer from '../components/DocumentViewer';
import { dataService } from '../lib/supabase';
import { useEnhancedPermissions } from '../hooks/useEnhancedPermissions';
import { AVAILABLE_LOCATIONS } from '../types/userRoles';

const defaultFolders = [
  'Verdeler aanzicht',
  'Test certificaat',
  'Algemene informatie',
  'Installatie schema',
  'Warmte berekening',
  'RVS behuizing',
  'Onderdelen',
  'Handleidingen',
  'Documentatie',
  'Oplever foto\'s',
  'Klant informatie',
  'Pakbon',
];

const Uploads = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useEnhancedPermissions();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [documentError, setDocumentError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadProjects();
    }

    // Check for URL parameters to auto-navigate
    const urlProjectId = searchParams.get('projectId');
    const urlDistributorId = searchParams.get('distributorId');

    if (urlProjectId) {
      setSelectedProject(urlProjectId);
      setExpandedProjects(prev => new Set([...prev, urlProjectId]));

      if (urlDistributorId) {
        setSelectedDistributor(urlDistributorId);
        setSelectedFolder('Algemene informatie'); // Default folder
      }
    }
  }, [currentUser]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setDocumentError(null);
      
      // Add timeout for project loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setDocumentError('Project loading timed out');
        setLoading(false);
      }, 10000);
      
      const data = await dataService.getProjects();
      clearTimeout(timeoutId);
      
      let filteredProjects = data || [];

      // Role-based filtering for Tester users
      if (currentUser?.role === 'tester') {
        const beforeRoleFilter = filteredProjects.length;
        filteredProjects = filteredProjects.filter((project: any) => {
          const hasTestingStatus = project.status?.toLowerCase() === 'testen';

          if (!hasTestingStatus) {
            console.log(`🧪 UPLOADS TESTER FILTER: Hiding project ${project.project_number} (status: ${project.status}) from tester ${currentUser.username} - NOT IN TESTING PHASE`);
          } else {
            console.log(`🧪 UPLOADS TESTER FILTER: Showing project ${project.project_number} (status: ${project.status}) to tester ${currentUser.username} - IN TESTING PHASE`);
          }

          return hasTestingStatus;
        });
        console.log(`🧪 UPLOADS TESTER FILTER: Filtered ${beforeRoleFilter} projects down to ${filteredProjects.length} for tester ${currentUser.username}`);
      }

      // Location-based filtering (admins see all)
      if (currentUser && currentUser.role !== 'admin' && currentUser.assignedLocations && currentUser.assignedLocations.length > 0) {
        const hasAllLocations =
          currentUser.assignedLocations.length >= AVAILABLE_LOCATIONS.length ||
          AVAILABLE_LOCATIONS.every(loc => currentUser.assignedLocations.includes(loc));

        if (!hasAllLocations) {
          const beforeLocationFilter = filteredProjects.length;
          filteredProjects = filteredProjects.filter((project: any) => {
            const projectLocation = project.location;
            // Only show projects that have a location matching user's assigned locations
            const hasAccess = projectLocation && currentUser.assignedLocations.includes(projectLocation);

            if (!hasAccess) {
              console.log(`🌍 UPLOADS LOCATION FILTER: Hiding project ${project.project_number} (location: ${projectLocation || 'none'}) from user ${currentUser.username}`);
            }

            return hasAccess;
          });
          console.log(`🌍 UPLOADS LOCATION FILTER: Filtered ${beforeLocationFilter} projects down to ${filteredProjects.length} for user ${currentUser.username}`);
        }
      }

      setProjects(filteredProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setDocumentError('Er is een fout opgetreden bij het laden van de projecten');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFolder = (projectId: string, distributorId?: string, folder?: string) => {
    console.log('Selecting folder:', { projectId, distributorId, folder });
    setDocumentError(null); // Clear any previous errors
    setSelectedProject(projectId);
    setSelectedDistributor(distributorId || null);
    setSelectedFolder(folder || null);
  };

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const filteredProjects = projects.filter((project) =>
    project.project_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBreadcrumb = () => {
    const selectedProjectData = projects.find(p => p.id === selectedProject);
    const selectedDistributorData = selectedProjectData?.distributors?.find((d: any) => d.id === selectedDistributor);
    
    const parts = [];
    if (selectedProjectData) {
      parts.push(selectedProjectData.project_number);
    }
    if (selectedDistributorData) {
      parts.push(`${selectedDistributorData.distributor_id} - ${selectedDistributorData.kast_naam || 'Naamloos'}`);
    }
    if (selectedFolder) {
      parts.push(selectedFolder);
    }
    
    return parts.join(' / ');
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Projecten laden...</span>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">Grote projecten kunnen langer duren...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (documentError) {
    return (
      <div className="min-h-screen p-8">
        <div className="card p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-red-400 mb-2">Fout bij laden</h3>
            <p className="text-gray-400 mb-4">{documentError}</p>
            <button
              onClick={() => {
                setDocumentError(null);
                loadProjects();
              }}
              className="btn-primary"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen">
      {/* Enhanced Sidebar */}
      <div className="w-80 card m-4 p-0 h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-3">Document Explorer</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Zoek projecten..."
              className="input-field pl-10 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Navigation Tree */}
        <div className="flex-1 overflow-y-auto p-4" style={{ contain: 'layout style paint' }}>
          <div className="space-y-1">
            {filteredProjects.map((project) => (
              <div key={project.id} className="space-y-1">
                {/* Project Level */}
                <div
                  className={`flex items-center p-2 rounded-lg transition-all cursor-pointer group ${
                    selectedProject === project.id && !selectedDistributor
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white'
                      : 'hover:bg-[#2A303C] text-gray-300 hover:text-white'
                  }`}
                  onClick={() => {
                    handleSelectFolder(project.id);
                    if (project.distributors && project.distributors.length > 0) {
                      toggleProjectExpansion(project.id);
                    }
                  }}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    {project.distributors && project.distributors.length > 0 ? (
                      expandedProjects.has(project.id) ? (
                        <ChevronDown size={16} className="mr-2 flex-shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="mr-2 flex-shrink-0" />
                      )
                    ) : (
                      <div className="w-4 mr-2 flex-shrink-0" />
                    )}
                    <Building size={16} className="mr-2 flex-shrink-0 text-blue-400" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{project.project_number}</div>
                      {project.client && (
                        <div className="text-xs opacity-75 truncate">{project.client}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs opacity-60 ml-2 flex-shrink-0">
                    {project.distributors?.length || 0} verdelers
                  </div>
                </div>

                {/* Distributors Level */}
                {expandedProjects.has(project.id) && project.distributors && project.distributors.length > 0 && (
                  <div className="ml-6 space-y-1">
                    {project.distributors.map((distributor: any) => (
                      <div key={distributor.id} className="space-y-1">
                        <div
                          className={`flex items-center p-2 rounded-lg transition-all cursor-pointer group ${
                            selectedProject === project.id && selectedDistributor === distributor.id && !selectedFolder
                              ? 'bg-gradient-to-r from-green-600 to-green-400 text-white'
                              : 'hover:bg-[#2A303C] text-gray-300 hover:text-white'
                          }`}
                          onClick={() => handleSelectFolder(project.id, distributor.id)}
                        >
                          <div className="flex items-center flex-1 min-w-0">
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

                        {/* Folders Level */}
                        {selectedProject === project.id && selectedDistributor === distributor.id && (
                          <div className="ml-6 space-y-1">
                            {defaultFolders.map((folder) => (
                              <div
                                key={folder}
                                className={`flex items-center p-2 rounded-lg transition-all cursor-pointer group ${
                                  selectedFolder === folder
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white'
                                    : 'hover:bg-[#2A303C] text-gray-300 hover:text-white'
                                }`}
                                onClick={() => handleSelectFolder(project.id, distributor.id, folder)}
                              >
                                <Folder size={14} className="mr-2 flex-shrink-0 text-purple-400" />
                                <span className="text-sm truncate">{folder}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-8">
              <Building size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-sm">Geen projecten gevonden</p>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4">
        {/* Enhanced Header */}
        <div className="card p-6 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-white mb-2">
                {selectedProject && selectedDistributor && selectedFolder
                  ? 'Document Viewer'
                  : selectedProject && selectedDistributor
                  ? 'Map Selectie'
                  : selectedProject
                  ? 'Verdeler Selectie'
                  : 'Project Selectie'}
              </h1>
              
              {/* Breadcrumb */}
              {getBreadcrumb() && (
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
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="text-right">
              <div className="text-sm text-gray-400">
                {projects.length} projecten
              </div>
              <div className="text-sm text-gray-400">
                {projects.reduce((total, project) => total + (project.distributors?.length || 0), 0)} verdelers
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {selectedProject && selectedDistributor && selectedFolder ? (
          <div className="card p-6">
            {documentError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <X size={16} className="text-red-400" />
                  <span className="text-red-400">{documentError}</span>
                </div>
              </div>
            )}
            <DocumentViewer
              projectId={selectedProject}
              distributorId={selectedDistributor}
              folder={selectedFolder}
            />
          </div>
        ) : selectedProject && selectedDistributor ? (
          /* Folder Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {defaultFolders.map((folderName) => (
              <div
                key={folderName}
                onClick={() => handleSelectFolder(selectedProject, selectedDistributor, folderName)}
                className="card p-6 flex flex-col items-center justify-center space-y-3 hover:bg-[#2A303C] transition-colors cursor-pointer group min-h-[120px]"
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
        ) : selectedProject ? (
          /* Distributor Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.find(p => p.id === selectedProject)?.distributors?.map((distributor: any) => (
              <div
                key={distributor.id}
                onClick={() => handleSelectFolder(selectedProject, distributor.id)}
                className="card p-6 hover:bg-[#2A303C] transition-colors cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  <Server
                    size={32}
                    className="text-gray-400 group-hover:text-green-400 transition-colors flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">
                      {distributor.distributor_id}
                    </h3>
                    {distributor.kast_naam && (
                      <p className="text-sm text-gray-400 mt-1">{distributor.kast_naam}</p>
                    )}
                    {distributor.systeem && (
                      <p className="text-xs text-gray-500 mt-1">{distributor.systeem}</p>
                    )}
                  </div>
                </div>
              </div>
            )) || (
              <div className="col-span-full card p-8 text-center">
                <Server size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">Geen verdelers gevonden voor dit project</p>
              </div>
            )}
          </div>
        ) : (
          /* Project Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  handleSelectFolder(project.id);
                  if (project.distributors && project.distributors.length > 0) {
                    setExpandedProjects(prev => new Set([...prev, project.id]));
                  }
                }}
                className="card p-6 hover:bg-[#2A303C] transition-colors cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  <Building
                    size={32}
                    className="text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {project.project_number}
                    </h3>
                    {project.client && (
                      <p className="text-sm text-gray-400 mt-1">{project.client}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {project.distributors?.length || 0} verdelers
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        project.status === 'Opgeleverd' ? 'bg-green-500/20 text-green-400' :
                        project.status === 'In uitvoering' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {project.status || 'Onbekend'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Uploads;