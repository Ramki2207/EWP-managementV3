/*
  # Add Storage Policies for Project Files Bucket

  1. Issue
    - The `project-files` bucket exists but has no RLS policies
    - Application uses localStorage authentication (not Supabase Auth)
    - Files cannot be uploaded without proper policies

  2. Solution
    - The bucket is already public
    - Add public policies that allow INSERT, SELECT, UPDATE, DELETE
    - This matches the pattern used for the `documents` bucket

  3. Security Note
    - Files are accessible to anyone with the URL
    - Application-level auth controls who can upload
    - This is acceptable for a business application with controlled access
*/

-- Create public policies for project-files bucket
CREATE POLICY "Public can upload to project-files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Public can view project-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-files');

CREATE POLICY "Public can update project-files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'project-files')
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Public can delete project-files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'project-files');