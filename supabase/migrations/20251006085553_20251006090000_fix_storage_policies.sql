/*
  # Fix Storage Policies for Documents Bucket

  1. Issue
    - Storage policies exist but don't properly check authentication
    - Policies need to verify auth.uid() is not null for authenticated users

  2. Changes
    - Drop existing policies
    - Recreate with proper authentication checks
    - Ensure authenticated users can upload, view, update, and delete files

  3. Security
    - Only authenticated users can access storage
    - All authenticated users share the same workspace
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- Recreate policies with proper authentication checks
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);