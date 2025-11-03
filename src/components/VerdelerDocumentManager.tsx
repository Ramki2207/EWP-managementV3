import React, { useState } from 'react';
import DocumentViewer from './DocumentViewer';

interface VerdelerDocumentManagerProps {
  distributor: any;
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
];

const VerdelerDocumentManager: React.FC<VerdelerDocumentManagerProps> = ({ distributor }) => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const getBreadcrumb = () => {
    const parts = [
      `${distributor.distributor_id} - ${distributor.kast_naam || 'Naamloos'}`
    ];
    if (selectedFolder) {
      parts.push(selectedFolder);
    }
    return parts.join(' / ');
  };

  return (
    <div className="flex gap-6 h-[600px]">
      {/* Navigation Sidebar */}
      <div className="w-80 bg-[#2A303C] rounded-lg p-4 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wide">Document Explorer</h3>
        <div className="space-y-2">
          {/* Verdeler Level */}
          <div className="flex items-center p-2 rounded-lg bg-green-500/20 text-green-400">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12l4-4m-4 4l4 4" />
            </svg>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{distributor.distributor_id}</div>
              {distributor.kast_naam && (
                <div className="text-xs opacity-75 truncate">{distributor.kast_naam}</div>
              )}
            </div>
          </div>

          {/* Folders Level */}
          <div className="ml-4 space-y-1">
            {defaultFolders.map((folder) => (
              <div
                key={folder}
                className={`flex items-center p-2 rounded-lg transition-all cursor-pointer group ${
                  selectedFolder === folder
                    ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white'
                    : 'hover:bg-[#1E2530] text-gray-300 hover:text-white'
                }`}
                onClick={() => setSelectedFolder(folder)}
              >
                <svg className="w-3 h-3 mr-2 flex-shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-xs truncate">{folder}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {selectedFolder ? (
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-gray-400 space-x-2 mb-4">
              <span>Locatie:</span>
              <div className="flex items-center space-x-2">
                {getBreadcrumb().split(' / ').map((part, index, array) => (
                  <React.Fragment key={index}>
                    <span className="text-blue-400">{part}</span>
                    {index < array.length - 1 && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Use the actual DocumentViewer component */}
            <DocumentViewer
              projectId={distributor.project_id}
              distributorId={distributor.id}
              folder={selectedFolder}
            />
          </div>
        ) : (
          /* Folder Selection */
          <div>
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Selecteer een map</h3>
              <p className="text-gray-400">
                Kies een map uit de lijst om documenten te bekijken
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerdelerDocumentManager;