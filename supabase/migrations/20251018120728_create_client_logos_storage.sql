/*
  # Create Client Logos Storage Bucket

  1. Storage Setup
    - Create `project-files` bucket for storing client logos and other project-related files
    - Set bucket as public for easy access
    - Configure appropriate file size limits
*/

-- Create the project-files bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;