import React, { useState } from 'react';
import { Folder, ChevronRight, ChevronDown, Server, Upload, FileText, X, Trash2, Download, Building } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadsStepProps {
  onBack: () => void;
  onSave: () => void;
  verdelers: any[];
  saving?: boolean;
  onDocumentsChange?: (documents: { [key: string]: any[] }) => void;
  tempDocuments?: { [key: string]: any[] };
}

const defaultFolders = [
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

const projectLevelFolders = [
  'Opname Locatie',
  'Aanvraag',
  'Bestelling',
  'Calculatie',
  'Offerte',
  'Opdracht',
  'Ondersteuning',
];

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  folder: string;
  distributorId: string | null;
  uploadedAt: string;
}

const UploadsStep: React.FC<UploadsStepProps> = ({
  onBack,
  onSave,
  verdelers,
  saving = false,
  onDocumentsChange,
  tempDocuments = {}
}) => {
  const [viewMode, setViewMode] = useState<'project' | 'verdelers'>('project');
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expandedDistributors, setExpandedDistributors] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

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
    const selectedDistributorData = verdelers.find(v => v.distributorId === selectedDistributor);

    const parts = ['Nieuw Project'];
    if (selectedDistributorData) {
      parts.push(`${selectedDistributorData.distributorId} - ${selectedDistributorData.kastNaam || 'Naamloos'}`);
    }
    if (selectedFolder) {
      parts.push(selectedFolder);
    }

    return parts.join(' / ');
  };

  const getDocumentKey = (distributorId: string | null, folder: string) => {
    // For project-level docs, use 'project' as the key prefix
    const distKey = distributorId || 'project';
    return `${distKey}-${folder}`;
  };

  const getCurrentDocuments = () => {
    if (!selectedFolder) return [];
    const key = getDocumentKey(selectedDistributor, selectedFolder);
    return tempDocuments[key] || [];
  };

  const handleFileSave = async (files: File[]) => {
    if (!selectedFolder) {
      toast.error('Selecteer eerst een map!');
      return;
    }

    const processFile = (file: File) => {
      return new Promise<Document>((resolve, reject) => {
        // Check file size (limit to 15MB)
        if (file.size > 15 * 1024 * 1024) {
          reject(`Bestand ${file.name} is te groot. Maximum grootte is 15MB`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const newDoc: Document = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: file.name,
              type: file.type,
              size: file.size,
              content: e.target?.result as string,
              folder: selectedFolder,
              distributorId: selectedDistributor || null,
              uploadedAt: new Date().toISOString(),
            };
            resolve(newDoc);
          } catch (error) {
            reject(`Fout bij het verwerken van bestand ${file.name}`);
          }
        };
        reader.onerror = () => reject(`Fout bij het lezen van bestand ${file.name}`);
        reader.readAsDataURL(file);
      });
    };

    try {
      const newDocs = await Promise.all(files.map(processFile));
      
      // Store documents temporarily during project creation
      const key = getDocumentKey(selectedDistributor, selectedFolder);
      const updatedDocuments = {
        ...tempDocuments,
        [key]: [...(tempDocuments[key] || []), ...newDocs]
      };
      
      if (onDocumentsChange) {
        onDocumentsChange(updatedDocuments);
      }

      toast.success(`${newDocs.length} document${newDocs.length > 1 ? 'en' : ''} succesvol geüpload!`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error(typeof error === 'string' ? error : 'Er is een fout opgetreden bij het uploaden van de bestanden');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileSave(Array.from(files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSave(files);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (!selectedFolder) return;

    if (window.confirm('Weet je zeker dat je dit document wilt verwijderen?')) {
      const key = getDocumentKey(selectedDistributor, selectedFolder);
      const updatedDocuments = {
        ...tempDocuments,
        [key]: (tempDocuments[key] || []).filter(doc => doc.id !== docId)
      };
      
      if (onDocumentsChange) {
        onDocumentsChange(updatedDocuments);
      }
      
      toast.success('Document verwijderd!');
    }
  };

  const handleDownload = (doc: Document) => {
    try {
      const link = document.createElement('a');
      link.href = doc.content;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Er is een fout opgetreden bij het downloaden van het document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (type: string) => type.startsWith('image/');

  const renderPreview = (doc: Document) => {
    if (isImage(doc.type)) {
      return (
        <img 
          src={doc.content} 
          alt={doc.name}
          className="max-h-[500px] object-contain mx-auto"
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

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-white mb-2">Project Documenten</h2>
        <p className="text-gray-400">Upload project documenten of verdeler-specifieke documenten</p>
      </div>

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
            <Building size={16} />
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
            <span>Verdeler documenten ({verdelers.length})</span>
          </div>
        </button>
      </div>

      {viewMode === 'project' ? (
        /* Project-level documents */
        <div className="flex gap-6">
          {/* Project Folders Sidebar */}
          <div className="w-80 bg-[#2A303C] rounded-lg p-4 h-[500px] overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wide">Project Mappen</h3>
            <div className="space-y-1">
              {projectLevelFolders.map((folder) => {
                const key = getDocumentKey(null, folder);
                const docCount = tempDocuments[key]?.length || 0;

                return (
                  <div
                    key={folder}
                    className={`flex items-center p-3 rounded-lg transition-all cursor-pointer group ${
                      selectedFolder === folder && !selectedDistributor
                        ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white'
                        : 'hover:bg-[#1E2530] text-gray-300 hover:text-white'
                    }`}
                    onClick={() => handleSelectProjectFolder(folder)}
                  >
                    <Folder size={16} className="mr-3 flex-shrink-0 text-blue-400" />
                    <span className="text-sm font-medium truncate flex-1">{folder}</span>
                    {docCount > 0 && (
                      <span className="ml-2 text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full">
                        {docCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content Area - same as below */}
          <div className="flex-1">
            {selectedFolder && !selectedDistributor ? (
              /* Project folder selected */
              <div>
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-gray-400 space-x-2 mb-4">
                  <span>Locatie:</span>
                  <span className="text-blue-400">Nieuw Project</span>
                  <ChevronRight size={14} />
                  <span className="text-blue-400">{selectedFolder}</span>
                </div>

                {/* Document Management */}
                <div className="space-y-6">
                  {/* Upload area */}
                  <div
                    className={`border-2 border-dashed ${
                      isDragging ? 'border-blue-400 bg-blue-400/10' : 'border-gray-600'
                    } rounded-xl p-8 text-center transition-colors`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload-project"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      multiple
                    />
                    <label
                      htmlFor="file-upload-project"
                      className="cursor-pointer flex flex-col items-center space-y-4"
                    >
                      <Upload size={48} className="text-gray-400" />
                      <div>
                        <p className="text-lg font-semibold">Sleep bestanden hierheen</p>
                        <p className="text-gray-400">of klik om te uploaden</p>
                        <p className="text-sm text-gray-400 mt-2">Maximum bestandsgrootte: 15MB</p>
                      </div>
                    </label>
                  </div>

                  {/* Documents grid */}
                  {getCurrentDocuments().length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {getCurrentDocuments().map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-[#1E2530] rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <div className="aspect-video bg-[#2A303C] flex items-center justify-center">
                            {isImage(doc.type) ? (
                              <img
                                src={doc.content}
                                alt={doc.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FileText size={48} className="text-gray-400" />
                            )}
                          </div>
                          <div className="p-4">
                            <p className="font-medium text-white truncate">{doc.name}</p>
                            <p className="text-sm text-gray-400">
                              {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleString('nl-NL')}
                            </p>
                            <div className="flex justify-end mt-2 space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(doc);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download size={16} className="text-gray-400 hover:text-white" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id);
                                }}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Verwijderen"
                              >
                                <Trash2 size={16} className="text-gray-400 hover:text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {getCurrentDocuments().length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Geen documenten in deze map</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Folder Grid View */
              <div>
                <div className="text-center py-8 mb-4">
                  <Building size={48} className="mx-auto text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Selecteer een map</h3>
                  <p className="text-gray-400">Kies een map om project documenten te uploaden</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {projectLevelFolders.map((folderName) => {
                    const key = getDocumentKey(null, folderName);
                    const docCount = tempDocuments[key]?.length || 0;

                    return (
                      <div
                        key={folderName}
                        onClick={() => handleSelectProjectFolder(folderName)}
                        className="bg-[#1E2530] rounded-lg p-6 flex flex-col items-center justify-center space-y-3 hover:bg-[#2A303C] transition-colors cursor-pointer group min-h-[120px] relative"
                      >
                        <Folder
                          size={40}
                          className="text-gray-400 group-hover:text-blue-400 transition-colors"
                        />
                        <span className="text-sm text-center font-medium group-hover:text-white transition-colors">
                          {folderName}
                        </span>
                        {docCount > 0 && (
                          <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            {docCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : verdelers.length === 0 ? (
        <div className="text-center py-12">
          <Server size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">Geen verdelers toegevoegd</p>
          <p className="text-gray-500 text-sm mt-2">Ga terug naar de vorige stap om verdelers toe te voegen</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Navigation Sidebar */}
          <div className="w-80 bg-[#2A303C] rounded-lg p-4 h-[500px] overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wide">Document Explorer</h3>
            <div className="space-y-2">
              {/* Project Level */}
              <div className="flex items-center p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-4 mr-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">Nieuw Project</div>
                    <div className="text-xs opacity-75 truncate">{verdelers.length} verdelers</div>
                  </div>
                </div>
              </div>

              {/* Distributors Level */}
              <div className="ml-4 space-y-1">
                {verdelers.map((verdeler) => (
                  <div key={verdeler.distributorId} className="space-y-1">
                    <div
                      className={`flex items-center p-2 rounded-lg transition-all cursor-pointer group ${
                        selectedDistributor === verdeler.distributorId && !selectedFolder
                          ? 'bg-gradient-to-r from-green-600 to-green-400 text-white'
                          : 'hover:bg-[#1E2530] text-gray-300 hover:text-white'
                      }`}
                      onClick={() => {
                        handleSelectFolder(verdeler.distributorId);
                        toggleDistributorExpansion(verdeler.distributorId);
                      }}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        {expandedDistributors.has(verdeler.distributorId) ? (
                          <ChevronDown size={14} className="mr-2 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="mr-2 flex-shrink-0" />
                        )}
                        <Server size={14} className="mr-2 flex-shrink-0 text-green-400" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {verdeler.distributorId}
                          </div>
                          {verdeler.kastNaam && (
                            <div className="text-xs opacity-75 truncate">
                              {verdeler.kastNaam}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Folders Level */}
                    {expandedDistributors.has(verdeler.distributorId) && (
                      <div className="ml-6 space-y-1">
                        {defaultFolders.map((folder) => (
                          <div
                            key={folder}
                            className={`flex items-center p-2 rounded-lg transition-all cursor-pointer group ${
                              selectedDistributor === verdeler.distributorId && selectedFolder === folder
                                ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white'
                                : 'hover:bg-[#1E2530] text-gray-300 hover:text-white'
                            }`}
                            onClick={() => handleSelectFolder(verdeler.distributorId, folder)}
                          >
                            <Folder size={12} className="mr-2 flex-shrink-0 text-purple-400" />
                            <span className="text-xs truncate">{folder}</span>
                            {(() => {
                              const key = getDocumentKey(verdeler.distributorId, folder);
                              const docCount = tempDocuments[key]?.length || 0;
                              return docCount > 0 ? (
                                <span className="ml-auto text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">
                                  {docCount}
                                </span>
                              ) : null;
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
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

                {/* Document Management */}
                <div className="space-y-6">
                  {/* Upload area */}
                  <div
                    className={`border-2 border-dashed ${
                      isDragging ? 'border-blue-400 bg-blue-400/10' : 'border-gray-600'
                    } rounded-xl p-8 text-center transition-colors`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      multiple
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center space-y-4"
                    >
                      <Upload size={48} className="text-gray-400" />
                      <div>
                        <p className="text-lg font-semibold">Sleep bestanden hierheen</p>
                        <p className="text-gray-400">of klik om te uploaden</p>
                        <p className="text-sm text-gray-400 mt-2">Maximum bestandsgrootte: 15MB</p>
                      </div>
                    </label>
                  </div>

                  {/* Documents grid */}
                  {getCurrentDocuments().length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {getCurrentDocuments().map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-[#1E2530] rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <div className="aspect-video bg-[#2A303C] flex items-center justify-center">
                            {isImage(doc.type) ? (
                              <img
                                src={doc.content}
                                alt={doc.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FileText size={48} className="text-gray-400" />
                            )}
                          </div>
                          <div className="p-4">
                            <p className="font-medium text-white truncate">{doc.name}</p>
                            <p className="text-sm text-gray-400">
                              {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleString('nl-NL')}
                            </p>
                            <div className="flex justify-end mt-2 space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(doc);
                                }}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download size={16} className="text-gray-400 hover:text-white" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id);
                                }}
                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Verwijderen"
                              >
                                <Trash2 size={16} className="text-gray-400 hover:text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {getCurrentDocuments().length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Geen documenten in deze map</p>
                    </div>
                  )}
                </div>
              </div>
            ) : selectedDistributor ? (
              /* Folder Grid View */
              <div>
                <div className="flex items-center text-sm text-gray-400 space-x-2 mb-4">
                  <span>Selecteer een map voor:</span>
                  <span className="text-green-400">
                    {verdelers.find(v => v.distributorId === selectedDistributor)?.distributorId}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {defaultFolders.map((folderName) => {
                    const key = getDocumentKey(selectedDistributor, folderName);
                    const docCount = tempDocuments[key]?.length || 0;
                    
                    return (
                      <div
                        key={folderName}
                        onClick={() => handleSelectFolder(selectedDistributor, folderName)}
                        className="bg-[#1E2530] rounded-lg p-6 flex flex-col items-center justify-center space-y-3 hover:bg-[#2A303C] transition-colors cursor-pointer group min-h-[120px] relative"
                      >
                        <Folder
                          size={40}
                          className="text-gray-400 group-hover:text-purple-400 transition-colors"
                        />
                        <span className="text-sm text-center font-medium group-hover:text-white transition-colors">
                          {folderName}
                        </span>
                        {docCount > 0 && (
                          <span className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                            {docCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Distributor Selection */
              <div>
                <div className="text-center py-8">
                  <Server size={48} className="mx-auto text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Selecteer een verdeler</h3>
                  <p className="text-gray-400">
                    Kies een verdeler uit de lijst links om documenten te uploaden
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedDocument && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDocument(null);
            }
          }}
        >
          <div 
            className="bg-[#1E2530] rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedDocument.name}</h2>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="bg-[#2A303C] rounded-lg p-4">
              {renderPreview(selectedDocument)}
            </div>
            <div className="flex justify-end mt-4 space-x-4">
              <button
                onClick={() => handleDownload(selectedDocument)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download size={20} />
                <span>Download</span>
              </button>
              <button
                onClick={() => {
                  handleDeleteDocument(selectedDocument.id);
                  setSelectedDocument(null);
                }}
                className="btn-secondary flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400"
              >
                <Trash2 size={20} />
                <span>Verwijderen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-700">
        <button
          onClick={onBack}
          className="btn-secondary"
          disabled={saving}
        >
          Terug
        </button>
        <div className="flex items-center space-x-4">
          {Object.values(tempDocuments).flat().length > 0 && (
            <span className="text-sm text-gray-400">
              {Object.values(tempDocuments).flat().length} document{Object.values(tempDocuments).flat().length !== 1 ? 'en' : ''} geüpload
            </span>
          )}
          <button
            onClick={onSave}
            className={`btn-primary flex items-center space-x-2 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                <span>Project opslaan...</span>
              </>
            ) : (
              <span>Project opslaan</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadsStep;