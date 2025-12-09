/*
  # Update status naming from "In productie" to "Productie"

  1. Changes
    - Update all projects with status "In productie" to "Productie"
    - Update all distributors with status "In productie" to "Productie"
  
  2. Purpose
    - Standardize status naming between projects and distributors
    - Fix Werkbelasting widget functionality by using consistent status names
*/

-- Update projects table
UPDATE projects
SET status = 'Productie'
WHERE status = 'In productie';

-- Update distributors table
UPDATE distributors
SET status = 'Productie'
WHERE status = 'In productie';