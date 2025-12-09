import { dataService } from './supabase';
import { convertHeicToJpeg } from './heicConverter';
import toast from 'react-hot-toast';

interface ConversionResult {
  success: boolean;
  converted: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export async function convertExistingHeicFiles(
  onProgress?: (current: number, total: number) => void
): Promise<ConversionResult> {
  const result: ConversionResult = {
    success: true,
    converted: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    console.log('🔄 HEIC MIGRATION: Starting conversion of existing HEIC files...');

    const heicDocuments = await dataService.getHeicDocuments();
    console.log(`📁 HEIC MIGRATION: Found ${heicDocuments.length} potential HEIC documents`);

    if (heicDocuments.length === 0) {
      console.log(`⚠️ HEIC MIGRATION: No HEIC files found in database`);
      toast.info('Geen HEIC bestanden gevonden om te converteren');
      return result;
    }

    const validHeicDocuments = heicDocuments.filter((doc: any) => {
      const fileName = doc.name?.toLowerCase() || '';
      const fileType = doc.type?.toLowerCase() || '';

      const isHeicByExtension = fileName.endsWith('.heic') || fileName.endsWith('.heif');
      const isHeicByType = fileType.includes('heic') || fileType.includes('heif');
      const isHeic = isHeicByExtension || isHeicByType;

      if (isHeic) {
        console.log(`🔍 HEIC MIGRATION: Confirmed HEIC file - Name: ${doc.name}, Type: ${doc.type}, Storage: ${doc.storage_path ? 'Yes' : 'No'}`);
      }

      return isHeic;
    });

    console.log(`🔄 HEIC MIGRATION: Validated ${validHeicDocuments.length} HEIC files to convert`);
    console.log(`📋 HEIC MIGRATION: File list:`, validHeicDocuments.map(d => ({ name: d.name, type: d.type, folder: d.folder })));

    if (validHeicDocuments.length === 0) {
      console.log(`⚠️ HEIC MIGRATION: No valid HEIC files found after validation`);
      toast.info('Geen HEIC bestanden gevonden om te converteren');
      return result;
    }

    if (onProgress) {
      onProgress(0, validHeicDocuments.length);
    }

    for (let i = 0; i < validHeicDocuments.length; i++) {
      const doc = validHeicDocuments[i];

      try {
        console.log(`🔄 HEIC MIGRATION: Converting ${i + 1}/${validHeicDocuments.length}: ${doc.name}`);

        if (!doc.storage_path) {
          console.log(`⚠️ HEIC MIGRATION: Document ${doc.name} has no storage_path, fetching from content...`);

          if (!doc.content) {
            const content = await dataService.getDocumentContent(doc.id);
            doc.content = content;
          }

          if (!doc.content || !doc.content.startsWith('data:')) {
            throw new Error('Document heeft geen geldige content');
          }

          const base64Response = await fetch(doc.content);
          const blob = await base64Response.blob();
          const originalFile = new File([blob], doc.name, { type: doc.type });

          const convertedFile = await convertHeicToJpeg(originalFile);

          const storagePath = await dataService.uploadFileToStorage(
            convertedFile,
            doc.project_id,
            doc.distributor_id,
            doc.folder
          );

          await dataService.updateDocument(doc.id, {
            name: convertedFile.name,
            type: convertedFile.type,
            size: convertedFile.size,
            storage_path: storagePath,
            content: null
          });

          console.log(`✅ HEIC MIGRATION: Converted and uploaded ${doc.name} -> ${convertedFile.name}`);
          result.converted++;
        } else {
          console.log(`🔄 HEIC MIGRATION: Document ${doc.name} already in storage, converting...`);

          const publicUrl = dataService.getStorageUrl(doc.storage_path);
          const response = await fetch(publicUrl);

          if (!response.ok) {
            throw new Error(`Kan bestand niet downloaden: ${response.statusText}`);
          }

          const blob = await response.blob();
          const originalFile = new File([blob], doc.name, { type: doc.type || 'image/heic' });

          const convertedFile = await convertHeicToJpeg(originalFile);

          const oldStoragePath = doc.storage_path;

          const newStoragePath = await dataService.uploadFileToStorage(
            convertedFile,
            doc.project_id,
            doc.distributor_id,
            doc.folder
          );

          await dataService.updateDocument(doc.id, {
            name: convertedFile.name,
            type: convertedFile.type,
            size: convertedFile.size,
            storage_path: newStoragePath
          });

          try {
            await dataService.deleteFromStorage(oldStoragePath);
            console.log(`🗑️ HEIC MIGRATION: Deleted old HEIC file from storage: ${oldStoragePath}`);
          } catch (deleteError) {
            console.warn(`⚠️ HEIC MIGRATION: Could not delete old file: ${deleteError.message}`);
          }

          console.log(`✅ HEIC MIGRATION: Converted ${doc.name} -> ${convertedFile.name}`);
          result.converted++;
        }

        if (onProgress) {
          onProgress(i + 1, heicDocuments.length);
        }

      } catch (error) {
        console.error(`❌ HEIC MIGRATION: Failed to convert ${doc.name}:`, error);
        result.failed++;
        result.errors.push(`${doc.name}: ${error.message}`);
        result.success = false;
      }
    }

    console.log(`✅ HEIC MIGRATION: Conversion complete. Converted: ${result.converted}, Failed: ${result.failed}`);

  } catch (error) {
    console.error('❌ HEIC MIGRATION: Fatal error:', error);
    result.success = false;
    result.errors.push(`Fatal error: ${error.message}`);
  }

  return result;
}
