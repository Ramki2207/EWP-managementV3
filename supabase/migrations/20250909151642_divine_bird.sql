/*
  # Add assigned_locations column to users table

  1. Schema Changes
    - Add `assigned_locations` column to `users` table
    - Column type: text[] (array of text)
    - Default value: empty array
    - Allow null values for backward compatibility

  2. Purpose
    - Enable location-based filtering for users
    - Users can be assigned to specific locations
    - Empty array means no location restrictions
*/

-- Add assigned_locations column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_locations text[] DEFAULT '{}';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_assigned_locations ON users USING gin (assigned_locations);