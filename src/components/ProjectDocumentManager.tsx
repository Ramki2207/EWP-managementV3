import React, { useState } from 'react';
import { Folder, ChevronRight, ChevronDown, Server, Building, FileText } from 'lucide-react';
import DocumentViewer from './DocumentViewer';

interface ProjectDocumentManagerProps {
  project: any;
}

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
  'DWG Bestanden',
];

const projectLevelFolders = [
  'Opname Locatie',
  'Aanvraag',
  'Bestelling',
  'Calculatie',
  'Offerte',
  'Opdracht',
  'Ondersteuning',
  'Verzend foto\'s',
  'Software bestand',
];

const ProjectDocumentManager: React.FC<ProjectDocumentManagerProps> = ({ project }) => {
  const [viewMode, setViewMode] = useState<'project' | 'verdelers'>('project');
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedDistributors, setExpandedDistributors] = useState<Set<string>>(new Set());

  // Debug: Log project data when component receives it
  React.useEffect(() => {
    console.log('📄 ProjectDocumentManager - Project data received:', {
      projectId: project?.id,
      projectNumber: project?.project_number,
      distributorsCount: project?.distributors?.length,
      distributors: project?.distributors?.map((d: any) => ({
        id: d.id,
        distributor_id: d.distributor_id,
        kast_naam: d.kast_naam
      }))
    });
  }, [project]);

  const handleSelectFolder = (distributorId?: string, folder?: string) => {
    setSelectedDistributor(distributorId || null);
    setSelectedFolder(folder || null);
  };

  const handleSelectProjectFolder = (folder: string) => {
    setViewMode('project');
    setSelectedDistributor(null);
    setSelectedFolder(folder);
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

  const getBreadcrumb = () => {
    const selectedDistributorData = project.distributors?.find((d: any) => d.id === selectedDistributor);
    
    const parts = [project.project_number];
    if (selectedDistributorData) {
      parts.push(`${selectedDistributorData.distributor_id} - ${selectedDistributorData.kast_naam || 'Naamloos'}`);
    }
    if (selectedFolder) {
      parts.push(selectedFolder);
    }
    
    return parts.join(' / ');
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => {
            setViewMode('project');
            setSelectedDistributor(null);
            setSelectedFolder(null);
          }}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            viewMode === 'project'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={16} />
            <span>Project documenten</span>
          </div>
        </button>
        <button
          onClick={() => {
            setViewMode('verdelers');
            setSelectedDistributor(null);
            setSelectedFolder(null);
          }}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            viewMode === 'verdelers'
              ? 'border-green-500 text-green-400'
              : 'border-transparent text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Server size={16} />
            <span>Verdeler documenten ({project.distributors?.length || 0})</span>
          </div>
        </button>
      </div>

      {/* Content Area */}
      {viewMode === 'project' ? (
        <div className="flex gap-6 h-[600px]">
          {/* Project Folders Sidebar */}
          <div className="w-80 bg-[#2A303C] rounded-lg p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wide">Project Mappen</h3>
            <div className="space-y-1">
              {projectLevelFolders.map((folder) => (
                <div
                  key={folder}
                  className={`flex items-center p-3 rounded-lg transition-all cursor-pointer group ${
                    selectedFolder === folder
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white'
                      : 'hover:bg-[#1E2530] text-gray-300 hover:text-white'
                  }`}
                  onClick={() => handleSelectProjectFolder(folder)}
                >
                  <Folder size={16} className="mr-3 flex-shrink-0 text-blue-400" />
                  <span className="text-sm font-medium truncate">{folder}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Document Viewer */}
          <div className="flex-1 overflow-y-auto">
            {selectedFolder ? (
              <div>
                <div className="flex items-center text-sm text-gray-400 space-x-2 mb-4">
                  <span>Locatie:</span>
                  <span className="text-blue-400">{project.project_number}</span>
                  <ChevronRight size={14} />
                  <span className="text-blue-400">{selectedFolder}</span>
                </div>
                <DocumentViewer
                  projectId={project.id}
                  distributorId={null}
                  folder={selectedFolder}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <Folder size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Selecteer een map</h3>
                <p className="text-gray-400">
                  Kies een map uit de lijst om project documenten te beheren
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-6 h-[600px]">
          {/* Navigation Sidebar */}
          <div className="w-80 bg-[#2A303C] rounded-lg p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wide">Verdelers</h3>
            <div className="space-y-2">
              {/* Project Level */}
              <div className="flex items-center p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <Building size={16} className="mr-2 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{project.project_number}</div>
                  {project.client && (
                    <div className="text-xs opacity-75 truncate">{project.client}</div>
                  )}
                </div>
                <div className="text-xs opacity-60 ml-2 flex-shrink-0">
                  {project.distributors?.length || 0} verdelers
                </div>
              </div>

          {/* Distributors Level */}
          {project.distributors && project.distributors.length > 0 ? (
            <div className="ml-4 space-y-1">
              {project.distributors.map((distributor: any) => (
                <div key={distributor.id} className="space-y-1">
                  <div
                    className={`flex items-center p-2 rounded-lg transition-all cursor-pointer group ${
                      selectedDistributor === distributor.id && !selectedFolder
                        ? 'bg-gradient-to-r from-green-600 to-green-400 text-white'
                        : 'hover:bg-[#1E2530] text-gray-300 hover:text-white'
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
                          {distributor.kast_naam || distributor.distributor_id}
                        </div>
                        {distributor.kast_naam && (
                          <div className="text-xs opacity-75 truncate">
                            {distributor.distributor_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Folders Level */}
                  {expandedDistributors.has(distributor.id) && (
                    <div className="ml-6 space-y-1">
                      {defaultFolders.map((folder) => (
                        <div
                          key={folder}
                          className={`flex items-center p-2 rounded-lg transition-all cursor-pointer group ${
                            selectedDistributor === distributor.id && selectedFolder === folder
                              ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white'
                              : 'hover:bg-[#1E2530] text-gray-300 hover:text-white'
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
          ) : (
            <div className="text-center py-8">
              <Server size={32} className="mx-auto text-gray-600 mb-2" />
              <p className="text-gray-400 text-sm">Geen verdelers toegevoegd</p>
              <p className="text-gray-500 text-xs mt-1">Voeg verdelers toe om documenten te beheren</p>
            </div>
          )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            {selectedDistributor && selectedFolder ? (
              <div>
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-gray-400 space-x-2 mb-4">
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

                {/* Use the actual DocumentViewer component */}
                <DocumentViewer
                  projectId={project.id}
                  distributorId={selectedDistributor}
                  folder={selectedFolder}
                />
              </div>
            ) : selectedDistributor ? (
              /* Folder Grid View */
              <div>
                <div className="flex items-center text-sm text-gray-400 space-x-2 mb-4">
                  <span>Selecteer een map voor:</span>
                  <span className="text-green-400">
                    {project.distributors?.find((d: any) => d.id === selectedDistributor)?.distributor_id}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {defaultFolders.map((folderName) => (
                    <div
                      key={folderName}
                      onClick={() => handleSelectFolder(selectedDistributor, folderName)}
                      className="bg-[#1E2530] rounded-lg p-6 flex flex-col items-center justify-center space-y-3 hover:bg-[#2A303C] transition-colors cursor-pointer group min-h-[120px]"
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
                    Kies een verdeler uit de lijst om documenten te beheren
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDocumentManager;