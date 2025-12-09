import heic2any from 'heic2any';

export async function convertHeicToJpeg(file: File): Promise<File> {
  const isHeic = file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif') ||
                 file.type === 'image/heic' ||
                 file.type === 'image/heif';

  if (!isHeic) {
    return file;
  }

  try {
    console.log(`🔄 Converting HEIC file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);

    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });

    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

    const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');

    const convertedFile = new File([blob], newFileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    console.log(`✅ HEIC converted successfully: ${newFileName} (${(convertedFile.size / (1024 * 1024)).toFixed(2)}MB)`);

    return convertedFile;
  } catch (error) {
    console.error('❌ Error converting HEIC file:', error);
    throw new Error(`Kan HEIC bestand niet converteren: ${error.message}`);
  }
}

export function isHeicFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.heic') ||
         file.name.toLowerCase().endsWith('.heif') ||
         file.type === 'image/heic' ||
         file.type === 'image/heif';
}
