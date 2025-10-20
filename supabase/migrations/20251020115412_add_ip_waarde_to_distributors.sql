/*
  # Add IP-Waarde field to distributors table
  
  1. Changes
    - Add `ip_waarde` column to store IP protection rating (default: '65')
    - This allows users to customize the IP rating per verdeler
    - Default value of '65' ensures backward compatibility with existing records
  
  2. Notes
    - Existing distributors will automatically get '65' as default value
    - The value will be displayed on M-Print labels
*/

-- Add ip_waarde column with default value for backwards compatibility
ALTER TABLE distributors 
ADD COLUMN IF NOT EXISTS ip_waarde text DEFAULT '65';