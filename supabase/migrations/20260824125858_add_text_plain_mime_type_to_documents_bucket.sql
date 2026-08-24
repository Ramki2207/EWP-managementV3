/*
  # Add text/plain MIME type to documents storage bucket

  1. Changes
    - Update the `documents` storage bucket to allow .txt files (plain text)
    - Add MIME type: 'text/plain'

  2. Notes
    - This enables users to upload .txt files via drag and drop
    - The bucket already supports images, PDFs, Word docs, Excel files, and .msg files
*/

-- Update the documents bucket to include text/plain
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
  'application/octet-stream',
  'text/plain'
]
WHERE id = 'documents';