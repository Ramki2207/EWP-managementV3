UPDATE storage.buckets
SET allowed_mime_types = array_cat(allowed_mime_types, ARRAY['message/rfc822', 'application/x-outlook-msg'])
WHERE id = 'documents'
  AND NOT ('message/rfc822' = ANY(allowed_mime_types));