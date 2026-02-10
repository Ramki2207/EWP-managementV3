/*
  # Fix Project Shared Locations Constraint

  1. Changes
    - Update the CHECK constraint on project_shared_locations to use the correct location names
    - Match the locations that are actually used in the system and assigned to users
  
  2. Valid Locations
    - 'Leerdam'
    - 'Leerdam (PM)'
    - 'Naaldwijk'
    - 'Naaldwijk (PD)'
    - 'Naaldwijk (PW)'
    - 'Rotterdam'
*/

-- Drop the existing constraint
ALTER TABLE project_shared_locations 
DROP CONSTRAINT IF EXISTS project_shared_locations_location_check;

-- Add the corrected constraint with all valid locations
ALTER TABLE project_shared_locations 
ADD CONSTRAINT project_shared_locations_location_check 
CHECK (location IN ('Leerdam', 'Leerdam (PM)', 'Naaldwijk', 'Naaldwijk (PD)', 'Naaldwijk (PW)', 'Rotterdam'));
