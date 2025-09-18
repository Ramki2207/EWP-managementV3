/*
  # Add indexes to documents table for performance

  1. Performance Improvements
    - Add index on `project_id` for faster project document queries
    - Add index on `distributor_id` for faster distributor document queries  
    - Add index on `folder` for faster folder-based document queries
    - Add composite index for common query patterns

  2. Query Optimization
    - Prevents statement timeouts on document retrieval
    - Improves performance for filtered document searches
    - Optimizes the most common document query patterns used in the application
*/

-- Add individual indexes for common filter columns
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_distributor_id ON documents(distributor_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder);

-- Add composite index for the most common query pattern (project + distributor + folder)
CREATE INDEX IF NOT EXISTS idx_documents_project_distributor_folder ON documents(project_id, distributor_id, folder);

-- Add index on uploaded_at for ordering performance
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);