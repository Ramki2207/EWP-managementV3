/*
  # Increase Storage Bucket Size Limit

  1. Changes
    - Increase `documents` bucket file size limit from 10MB to 50MB
    - This allows users to upload larger files (PDFs, high-res images, etc.)

  2. Reason
    - Current 10MB limit is too restrictive for typical project documents
    - Users need to upload larger technical drawings, detailed PDFs, and high-quality photos
    - 50MB is a reasonable limit that balances usability with storage costs

  3. Notes
    - This change only affects the bucket configuration
    - Existing uploaded files are not affected
    - Frontend validation will be updated to match the new limit
*/

-- Update the documents bucket to increase file size limit to 50MB
UPDATE storage.buckets
SET file_size_limit = 52428800  -- 50MB in bytes (50 * 1024 * 1024)
WHERE id = 'documents';
