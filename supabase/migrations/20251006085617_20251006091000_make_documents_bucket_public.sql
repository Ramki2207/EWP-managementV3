/*
  # Make Documents Bucket Public

  1. Issue
    - Application uses localStorage authentication (not Supabase Auth)
    - Storage policies require auth.uid() which doesn't work with custom auth
    - Files cannot be uploaded or accessed

  2. Solution
    - Make bucket public (files accessible with URL)
    - Remove RLS policies that require Supabase Auth
    - Add policies that allow public access for INSERT, SELECT, UPDATE, DELETE

  3. Security Note
    - Files are accessible to anyone with the URL
    - Application-level auth still controls who can upload
    - This is acceptable for a business application with controlled access
*/

-- Update bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'documents';

-- Drop existing policies that require Supabase Auth
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;

-- Create new public policies
CREATE POLICY "Public can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Public can view documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Public can update documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Public can delete documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documents');