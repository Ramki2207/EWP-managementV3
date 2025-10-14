import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, Trash2, Download, Folder, X, Archive, Clock } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { dataService } from '../lib/supabase';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  storage_path?: string;
  uploaded_at: string;
}

interface DocumentViewerProps {
  projectId: string;
  distributorId: string;
  folder: string;
}

// Folders that support revision management
const REVISION_MANAGED_FOLDERS = [
  'Verdeler aanzicht',
  'Test certificaat', 
  'Installatie schema'
];

// Helper function to detect revision in filename
const detectRevision = (filename: string): { hasRevision: boolean; revisionNumber: number; baseFilename: string } => {
  const revMatch = filename.match(/(.+?)\s+rev\.?(\d+)(\.[^.]+)?$/i);
  if (revMatch) {
    const [, baseName, revNum, extension] = revMatch;
    return {
      hasRevision: true,
      revisionNumber: parseInt(revNum),
      baseFilename: baseName.trim() + (extension || '')
    };
  }
  return {
    hasRevision: false,
    revisionNumber: 0,
    baseFilename: filename
  };
};

// Helper function to find matching base document
const findMatchingBaseDocument = (documents: Document[], newFilename: string): Document | null => {
  const { baseFilename } = detectRevision(newFilename);
  
  console.log('🔍 REVISION: Looking for base document matching:', baseFilename);
  console.log('🔍 REVISION: Available documents:', documents.map(d => d.name));
  
  // Look for documents with same base name (including those with different revisions)
  const matchingDoc = documents.find(doc => {
    // First check for exact match (without revision)
    if (doc.name === baseFilename) {
      console.log('✅ REVISION: Found exact match:', doc.name);
      return true;
    }
    
    // Then check for documents with same base name but different revisions
    const { baseFilename: docBase } = detectRevision(doc.name);
    const matches = docBase === baseFilename;
    console.log('🔍 REVISION: Comparing', docBase, 'with', baseFilename, '=', matches);
    return matches;
  });
  
  if (matchingDoc) {
    console.log('✅ REVISION: Found matching document:', matchingDoc.name);
  } else {
    console.log('❌ REVISION: No matching document found');
  }
  
  return matchingDoc;
};

const DocumentViewer: React.FC<DocumentViewerProps> = ({ projectId, distributorId, folder }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [loadingContent, setLoadingContent] = useState<Record<string, boolean>>({});

  // Helper function to load document content on-demand
  const loadDocumentContent = useCallback(async (doc: Document): Promise<string> => {
    // If content already exists, return it immediately
    if (doc.content) {
      return doc.content;
    }

    // If storage_path exists, generate public URL immediately (no database call needed)
    if (doc.storage_path) {
      const publicUrl = dataService.getStorageUrl(doc.storage_path);
      // Update document in state with URL
      setDocuments(prev => prev.map(d =>
        d.id === doc.id ? { ...d, content: publicUrl } : d
      ));
      return publicUrl;
    }

    // Only for legacy base64 documents, fetch from database
    try {
      setLoadingContent(prev => ({ ...prev, [doc.id]: true }));

      // Show a loading message with file size
      const fileSizeMB = (doc.size / (1024 * 1024)).toFixed(1);
      toast.loading(`Laden ${doc.name} (${fileSizeMB}MB)...`, { id: doc.id });

      const content = await dataService.getDocumentContent(doc.id);

      // Update the document in state with the loaded content
      setDocuments(prev => prev.map(d =>
        d.id === doc.id ? { ...d, content } : d
      ));

      setLoadingContent(prev => ({ ...prev, [doc.id]: false }));
      toast.success('Document geladen!', { id: doc.id });
      return content;
    } catch (error) {
      setLoadingContent(prev => ({ ...prev, [doc.id]: false }));
      toast.error(`Fout bij laden: ${error.message}`, { id: doc.id });
      throw error;
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('Document loading timeout - stopping loading state');
      setLoading(false);
      setError('Document loading timed out. Please try again.');
    }, 10000); // 10 second timeout
    
    setLoadingTimeout(timeout);

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading documents for:', { projectId, distributorId, folder });
      
      // Add validation
      if (!projectId || !distributorId || !folder) {
        throw new Error('Missing required parameters for document loading');
      }
      
      // Load documents from main folder AND subfolders for revision-managed folders
      let allDocuments: Document[] = [];
      
      // Always load main folder documents
      const mainFolderDocs = await dataService.getDocuments(projectId, distributorId, folder);
      console.log('📁 LOAD: Main folder documents:', mainFolderDocs?.length || 0);
      allDocuments.push(...(mainFolderDocs || []));
      
      // For revision-managed folders, also load subfolder documents
      if (REVISION_MANAGED_FOLDERS.includes(folder)) {
        console.log('📁 LOAD: Loading subfolder documents for revision-managed folder...');
        
        try {
          const actueleDocuments = await dataService.getDocuments(projectId, distributorId, `${folder}/Actueel`);
          console.log('📁 LOAD: Actueel subfolder documents:', actueleDocuments?.length || 0);
          allDocuments.push(...(actueleDocuments || []));
        } catch (error) {
          console.log('📁 LOAD: No Actueel subfolder or error loading:', error.message);
        }
        
        try {
          const historieDocuments = await dataService.getDocuments(projectId, distributorId, `${folder}/Historie`);
          console.log('📁 LOAD: Historie subfolder documents:', historieDocuments?.length || 0);
          allDocuments.push(...(historieDocuments || []));
        } catch (error) {
          console.log('📁 LOAD: No Historie subfolder or error loading:', error.message);
        }
      }
      
      console.log('📁 LOAD: Total documents loaded:', allDocuments.length);
      console.log('📁 LOAD: Document folders:', allDocuments.map(d => d.folder));

      // Preload public URLs for storage-based documents
      const documentsWithUrls = allDocuments.map(doc => {
        if (doc.storage_path && !doc.content) {
          // Generate public URL immediately for fast preview
          return {
            ...doc,
            content: dataService.getStorageUrl(doc.storage_path)
          };
        }
        return doc;
      });

      setDocuments(documentsWithUrls);
      
      // Clear timeout on success
      clearTimeout(timeout);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Er is een fout opgetreden bij het laden van de documenten');
      setDocuments([]);
      
      // Clear timeout on error
      clearTimeout(timeout);
    } finally {
      setLoading(false);
      setLoadingTimeout(null);
    }
  }, [projectId, distributorId, folder]);

  useEffect(() => {
    // Add a small delay to prevent rapid successive calls
    const delayedLoad = setTimeout(() => {
      loadDocuments();
    }, 100);
    
    return () => {
      clearTimeout(delayedLoad);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadDocuments]);

  const handleRevisionManagement = async (newDoc: any, existingDocuments: Document[]) => {
    const { hasRevision, baseFilename } = detectRevision(newDoc.name);
    
    if (!hasRevision || !REVISION_MANAGED_FOLDERS.includes(folder)) {
      // No revision management needed
      console.log('🔄 REVISION: No revision management needed for:', newDoc.name);
      return;
    }

    console.log('🔄 REVISION: Managing revision for document:', newDoc.name);
    console.log('🔄 REVISION: Base filename:', baseFilename);
    console.log('🔄 REVISION: Target folder:', folder);
    console.log('🔄 REVISION: All existing documents:', existingDocuments.length);
    
    // Find matching document in BOTH main folder AND Actueel subfolder
    const mainFolderDocs = existingDocuments.filter(doc => doc.folder === folder);
    const actueelFolderDocs = existingDocuments.filter(doc => doc.folder === `${folder}/Actueel`);
    
    console.log('🔄 REVISION: Documents in main folder:', mainFolderDocs.length, mainFolderDocs.map(d => d.name));
    console.log('🔄 REVISION: Documents in Actueel folder:', actueelFolderDocs.length, actueelFolderDocs.map(d => d.name));
    
    // First check main folder, then Actueel folder
    let matchingDoc = findMatchingBaseDocument(mainFolderDocs, newDoc.name);
    let sourceLocation = 'main';
    
    if (!matchingDoc) {
      matchingDoc = findMatchingBaseDocument(actueelFolderDocs, newDoc.name);
      sourceLocation = 'actueel';
    }
    
    if (matchingDoc) {
      console.log('🔄 REVISION: Found matching document:', matchingDoc.name, 'in', sourceLocation, 'folder');
      console.log('🔄 REVISION: Original document ID:', matchingDoc.id);
      console.log('🔄 REVISION: Will move original to Historie:', `${folder}/Historie`);
      console.log('🔄 REVISION: Will place new revision in Actueel:', `${folder}/Actueel`);

      try {
        // Step 1: Create copy of original document in Historie subfolder
        console.log('📁 REVISION: Creating document in Historie...');

        // For storage-based documents, we need to copy the file in storage
        // For now, we'll just update the database record to point to the same storage file
        // (multiple docs can reference the same storage file)
        const historieDoc = await dataService.createDocument({
          projectId,
          distributorId,
          folder: `${folder}/Historie`,
          name: matchingDoc.name,
          type: matchingDoc.type,
          size: matchingDoc.size,
          storagePath: matchingDoc.storage_path || null,
          content: matchingDoc.storage_path ? null : await loadDocumentContent(matchingDoc)
        });

        console.log('✅ REVISION: Successfully created document in Historie:', historieDoc?.id);
        
        // Step 2: Delete original document from its current location
        console.log(`🗑️ REVISION: Deleting original document from ${sourceLocation} folder...`);
        console.log('🗑️ REVISION: Deleting document ID:', matchingDoc.id);
        await dataService.deleteDocument(matchingDoc.id);
        console.log(`✅ REVISION: Successfully deleted original document from ${sourceLocation} folder`);
        
        // Step 3: Set new document to go to Actueel subfolder
        console.log('📁 REVISION: Setting new revision document folder to Actueel...');
        newDoc.folder = `${folder}/Actueel`;
        console.log('✅ REVISION: New revision document will be saved to:', newDoc.folder);
        
        toast.success(`Original document moved from ${sourceLocation === 'main' ? 'Hoofdmap' : 'Actueel'} to Historie, new revision placed in Actueel`);
        
      } catch (error) {
        console.error('❌ REVISION: Error during revision management:', error);
        toast.error(`Revision management failed: ${error.message}`);
        console.log('⚠️ REVISION: Revision management failed - saving to main folder instead');
        // Keep original folder if revision management fails
        newDoc.folder = folder;
      }
    } else {
      console.log('ℹ️ REVISION: No matching document found in main folder OR Actueel folder');
      console.log('📁 REVISION: This appears to be the first revision - placing in Actueel');
      newDoc.folder = `${folder}/Actueel`;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);
  const handleFileSave = useCallback(async (files: File[]) => {
    if (!projectId || !distributorId || !folder) {
      toast.error('Kan documenten niet uploaden: ontbrekende project informatie');
      return;
    }

    const processFile = async (file: File): Promise<any> => {
      // Check file size (limit to 15MB to match storage limit)
      if (file.size > 15 * 1024 * 1024) {
        throw new Error(`Bestand ${file.name} is te groot. Maximum grootte is 15MB`);
      }

      try {
        // Upload file to Supabase Storage
        console.log('📤 Uploading file to storage:', file.name);
        const storagePath = await dataService.uploadFileToStorage(file, projectId, distributorId, folder);
        console.log('✅ File uploaded to storage:', storagePath);

        // Get public URL for the file (bucket is public)
        const publicUrl = dataService.getStorageUrl(storagePath);
        console.log('📎 Public URL:', publicUrl);

        return {
          projectId,
          distributorId,
          folder,
          name: file.name,
          type: file.type,
          size: file.size,
          storagePath,
          content: publicUrl, // Store public URL as content for immediate display
        };
      } catch (error) {
        console.error('Error processing file:', error);
        throw new Error(`Fout bij het verwerken van bestand ${file.name}: ${error.message}`);
      }
    };

    try {
      console.log('🚀 UPLOAD: Starting file upload process with revision management...');
      console.log('🚀 UPLOAD: Files to process:', files.map(f => f.name));
      console.log('🚀 UPLOAD: Target folder:', folder);
      
      // CRITICAL: Load ALL current documents (main + subfolders) BEFORE processing revisions
      console.log('📥 UPLOAD: Loading ALL current documents for revision check...');
      const currentMainDocs = await dataService.getDocuments(projectId, distributorId, folder);
      console.log('📥 UPLOAD: Current main folder documents:', currentMainDocs?.length || 0);
      
      let currentActueelDocs: any[] = [];
      let currentHistorieDocs: any[] = [];
      
      if (REVISION_MANAGED_FOLDERS.includes(folder)) {
        try {
          currentActueelDocs = await dataService.getDocuments(projectId, distributorId, `${folder}/Actueel`) || [];
          console.log('📥 UPLOAD: Current Actueel documents:', currentActueelDocs.length);
          console.log('📥 UPLOAD: Actueel doc names:', currentActueelDocs.map(d => d.name));
        } catch (error) {
          console.log('📥 UPLOAD: No Actueel folder or error:', error.message);
        }
        
        try {
          currentHistorieDocs = await dataService.getDocuments(projectId, distributorId, `${folder}/Historie`) || [];
          console.log('📥 UPLOAD: Current Historie documents:', currentHistorieDocs.length);
        } catch (error) {
          console.log('📥 UPLOAD: No Historie folder or error:', error.message);
        }
      }
      
      // Combine all documents for revision checking
      const allCurrentDocs = [...(currentMainDocs || []), ...currentActueelDocs, ...currentHistorieDocs];
      console.log('📥 UPLOAD: Total current documents for revision check:', allCurrentDocs.length);
      console.log('📥 UPLOAD: All current doc names:', allCurrentDocs.map(d => d.name));

      const newDocs = await Promise.all(files.map(processFile));
      console.log('🚀 UPLOAD: Files processed successfully, saving directly...');
      
      // Process each document
      for (const doc of newDocs) {
        console.log('💾 UPLOAD: Processing document:', doc.name);
        
        // Apply revision management if needed
        if (REVISION_MANAGED_FOLDERS.includes(folder)) {
          console.log('🔄 UPLOAD: Applying revision management...');
          await handleRevisionManagement(doc, allCurrentDocs);
        }
        
        console.log('💾 UPLOAD: Saving document:', doc.name, 'to folder:', doc.folder);
        
        try {
          await dataService.createDocument(doc);
          console.log('✅ UPLOAD: Document saved successfully:', doc.name);
        } catch (saveError) {
          console.error('❌ UPLOAD: Error saving document:', doc.name, saveError);
          toast.error(`Fout bij opslaan van ${doc.name}: ${saveError.message}`);
        }
      }

      // Reload documents
      console.log('🔄 UPLOAD: Reloading documents...');
      await loadDocuments();
      toast.success(`${newDocs.length} document${newDocs.length > 1 ? 'en' : ''} succesvol geüpload!`);
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error(typeof error === 'string' ? error : 'Er is een fout opgetreden bij het uploaden van de bestanden');
    }
  }, [projectId, distributorId, folder, loadDocuments, handleRevisionManagement]);

  const renderFolderStructure = () => {
    // Group documents by subfolder for revision-managed folders
    if (REVISION_MANAGED_FOLDERS.includes(folder)) {
      // Filter documents by their exact folder path
      const actueel = documents.filter(doc => 
        doc.folder === `${folder}/Actueel`
      );
      const historie = documents.filter(doc => 
        doc.folder === `${folder}/Historie`
      );
      const main = documents.filter(doc => 
        doc.folder === folder
      );
      
      console.log('📁 FOLDER STRUCTURE DEBUG:');
      console.log('  Main folder:', folder);
      console.log('  Documents in main:', main.length);
      console.log('  Documents in Actueel:', actueel.length);
      console.log('  Documents in Historie:', historie.length);
      console.log('  All document folders:', documents.map(d => d.folder));
      console.log('  Main folder docs:', main.map(d => d.name));
      console.log('  Actueel docs:', actueel.map(d => d.name));
      console.log('  Historie docs:', historie.map(d => d.name));
      
      return (
        <div className="space-y-6">
          {/* Main folder documents (legacy) */}
          {main.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Folder size={20} className="text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-400">Hoofdmap</h3>
                <span className="text-sm text-gray-400">({main.length} documenten)</span>
                <span className="text-xs text-gray-500">- Originele documenten</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {main.map(renderDocumentCard)}
              </div>
            </div>
          )}
          
          {/* Actueel subfolder */}
          <div>
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Clock size={20} className="text-green-400" />
                <h3 className="text-lg font-semibold text-green-400">Actueel</h3>
                <span className="text-sm text-gray-400">({actueel.length} documenten)</span>
                <span className="text-xs text-gray-500">- Nieuwste versies</span>
              </div>
              {actueel.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {actueel.map(renderDocumentCard)}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Geen actuele documenten
                </div>
              )}
            </div>
          </div>
          
          {/* Historie subfolder */}
          <div>
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Archive size={20} className="text-orange-400" />
                <h3 className="text-lg font-semibold text-orange-400">Historie</h3>
                <span className="text-sm text-gray-400">({historie.length} documenten)</span>
                <span className="text-xs text-gray-500">- Vorige versies</span>
              </div>
              {historie.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {historie.map(renderDocumentCard)}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Geen historische documenten
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Regular folder structure for non-revision-managed folders
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {documents.map(renderDocumentCard)}
      </div>
    );
  };

  const renderDocumentCard = (doc: Document) => (
    <div
      key={doc.id}
      className="bg-[#2A303C] rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Load content first, then open modal
        try {
          const content = await loadDocumentContent(doc);
          // Find the updated document in state (it may have been updated with content)
          const updatedDoc = documents.find(d => d.id === doc.id) || doc;
          // Ensure the document has content before opening modal
          setSelectedDocument({ ...updatedDoc, content });
        } catch (error) {
          console.error('Error loading document content:', error);
          toast.error('Kan document niet laden');
        }
      }}
    >
      <div className="aspect-video bg-[#1E2530] flex items-center justify-center relative">
        {loadingContent[doc.id] && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        {isImage(doc.type, doc.name) && doc.content ? (
          <img
            src={doc.content}
            alt={doc.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              console.error('Error loading image:', doc.name);
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <FileText size={48} className="text-gray-400" />
        )}
      </div>
      <div className="p-4">
        <p className="font-medium text-white truncate" title={doc.name}>{doc.name}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-400">
            {formatFileSize(doc.size)}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(doc.uploaded_at).toLocaleDateString('nl-NL')}
          </p>
        </div>
        {/* Show revision indicator */}
        {(() => {
          const { hasRevision, revisionNumber } = detectRevision(doc.name);
          return hasRevision ? (
            <div className="mt-2">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                Rev. {revisionNumber}
              </span>
            </div>
          ) : null;
        })()}
        <div className="flex justify-end mt-2 space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDownload(doc);
            }}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Download"
          >
            <Download size={20} className="text-gray-400 hover:text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDelete(doc.id);
            }}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
            title="Verwijderen"
          >
            <Trash2 size={20} className="text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileSave(Array.from(files));
    }
    // Reset the input value to allow uploading the same file again
    event.target.value = '';
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

  const handleDelete = async (docId: string) => {
    if (window.confirm('Weet je zeker dat je dit document wilt verwijderen?')) {
      try {
        setLoading(true);
        await dataService.deleteDocument(docId);
        await loadDocuments();
        toast.success('Document verwijderd!');
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Er is een fout opgetreden bij het verwijderen van het document');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const content = await loadDocumentContent(doc);

      // Check if it's a base64 data URL or a regular URL
      if (content.startsWith('data:')) {
        // For base64 data URLs, we can download directly
        const link = document.createElement('a');
        link.href = content;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For storage URLs, fetch as blob to avoid CORS issues
        toast.loading('Bestand wordt gedownload...', { id: 'download' });

        const response = await fetch(content);
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      }

      toast.success('Document gedownload!', { id: 'download' });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Er is een fout opgetreden bij het downloaden van het document', { id: 'download' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (type: string, name: string) => {
    // Check by MIME type first
    if (type.startsWith('image/')) {
      return true;
    }
    // Also check by file extension for HEIC files (browsers may not recognize the MIME type)
    const ext = name.split('.').pop()?.toLowerCase();
    return ext === 'heic' || ext === 'heif' || ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'webp';
  };

  const isPDF = (type: string) => type === 'application/pdf';

  const renderPreview = (doc: Document) => {
    if (!doc.content) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-400 mt-4">Document laden...</p>
        </div>
      );
    }

    if (isImage(doc.type, doc.name)) {
      // Special handling for HEIC files
      const ext = doc.name.split('.').pop()?.toLowerCase();
      const isHEIC = ext === 'heic' || ext === 'heif';

      if (isHEIC) {
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <FileText size={64} className="text-gray-400 mb-4" />
            <p className="text-gray-400 mb-4">Preview niet beschikbaar voor HEIC bestanden</p>
            <p className="text-sm text-gray-500 mb-4">HEIC formaat wordt niet ondersteund in browsers</p>
            <button
              onClick={() => handleDownload(doc)}
              className="btn-primary"
            >
              <Download size={16} className="mr-2" />
              Download bestand
            </button>
          </div>
        );
      }

      const [imageError, setImageError] = React.useState(false);

      if (imageError) {
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <FileText size={64} className="text-gray-400 mb-4" />
            <p className="text-gray-400 mb-4">Kan afbeelding niet laden</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDownload(doc);
              }}
              className="btn-primary"
            >
              <Download size={16} className="mr-2" />
              Download bestand
            </button>
          </div>
        );
      }

      return (
        <img
          src={doc.content}
          alt={doc.name}
          className="max-h-[500px] object-contain mx-auto"
          loading="lazy"
          onError={(e) => {
            console.error('Image failed to load:', doc.name);
            setImageError(true);
          }}
        />
      );
    } else if (isPDF(doc.type)) {
      return (
        <div className="w-full h-[500px] relative">
          <object
            data={doc.content}
            type="application/pdf"
            className="w-full h-full"
          >
            <div className="flex flex-col items-center justify-center h-full bg-[#1E2530] p-8">
              <FileText size={64} className="text-gray-400 mb-4" />
              <p className="text-gray-400 mb-2">Kan PDF niet weergeven in browser</p>
              <p className="text-sm text-gray-500 mb-4">Browser ondersteunt geen PDF preview of het bestand kan niet worden geladen</p>
              <button
                onClick={() => handleDownload(doc)}
                className="btn-primary"
              >
                <Download size={16} className="mr-2" />
                Download PDF
              </button>
            </div>
          </object>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <FileText size={64} className="text-gray-400 mb-4" />
          <p className="text-gray-400 mb-4">Preview niet beschikbaar voor dit bestandstype</p>
          <button
            onClick={() => handleDownload(doc)}
            className="btn-primary"
          >
            <Download size={16} className="mr-2" />
            Download bestand
          </button>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Documenten laden...</span>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">Dit kan even duren...</p>
          <button
            onClick={() => {
              setLoading(false);
              setError('Loading geannuleerd door gebruiker');
            }}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Annuleren
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-400 mb-2">Fout bij laden</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadDocuments();
            }}
            className="btn-primary"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }
  return (
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
      {documents.length > 0 && renderFolderStructure()}

      {documents.length === 0 && (
        <div className="text-center py-8">
          <Folder size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Geen documenten gevonden</p>
          <p className="text-sm text-gray-500 mt-2">Upload bestanden om ze hier te zien</p>
        </div>
      )}

      {/* Revision Management Info */}
      {REVISION_MANAGED_FOLDERS.includes(folder) && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Archive size={16} className="text-blue-400" />
            <h4 className="font-medium text-blue-400">Automatisch Revisie Beheer</h4>
          </div>
          <div className="text-sm text-blue-300 space-y-1">
            <p>• Upload documenten normaal voor de eerste versie</p>
            <p>• Documenten met "rev.1", "rev.2", etc. in de naam activeren automatisch revisie beheer</p>
            <p>• Oude versies worden automatisch naar <strong>Historie</strong> verplaatst</p>
            <p>• Nieuwe versies worden in <strong>Actueel</strong> geplaatst</p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {selectedDocument && createPortal(
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedDocument(null);
                }}
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDownload(selectedDocument);
                }}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download size={20} />
                <span>Download</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(selectedDocument.id);
                  setSelectedDocument(null);
                }}
                className="btn-secondary flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400"
              >
                <Trash2 size={20} />
                <span>Verwijderen</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DocumentViewer;