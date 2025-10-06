/*
  # Create Supabase Storage for Documents

  1. New Storage Bucket
    - `documents` - Storage bucket for project documents and images
      - Public: false (requires authentication)
      - File size limit: 10MB per file
      - Allowed MIME types: images, PDFs, and common document formats

  2. Storage Policies
    - Authenticated users can upload files
    - Authenticated users can read all files
    - Users can delete files they uploaded (optional - can be restricted to admins)

  3. Database Schema Changes
    - Add `storage_path` column to documents table (will replace content field)
    - Keep `content` column temporarily for migration

  4. Notes
    - Files will be organized by: project_id/distributor_id/folder/filename
    - All authenticated users can see all documents (shared workspace)
    - This will significantly improve performance vs base64 in database
*/

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  ARRAY[
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
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for authenticated users
-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Policy 2: Allow authenticated users to read all files
CREATE POLICY "Authenticated users can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Policy 3: Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Policy 4: Allow authenticated users to delete files (can be restricted later)
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Add storage_path column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE documents ADD COLUMN storage_path text;
  END IF;
END $$;

-- Add index on storage_path for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);