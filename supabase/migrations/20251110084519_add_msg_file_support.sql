/*
  # Add .msg File Support to Storage Bucket

  1. Changes
    - Update the `documents` storage bucket to allow .msg files (Outlook email files)
    - Add MIME types: 'application/vnd.ms-outlook' and 'application/octet-stream'
    - .msg files typically use application/vnd.ms-outlook MIME type
    - Some systems may export them as application/octet-stream

  2. Notes
    - This change allows users to upload Outlook email files (.msg)
    - The bucket already supports images, PDFs, Word docs, and Excel files
*/

-- Update the documents bucket to allow .msg files
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-outlook',
  'application/octet-stream'
]
WHERE id = 'documents';