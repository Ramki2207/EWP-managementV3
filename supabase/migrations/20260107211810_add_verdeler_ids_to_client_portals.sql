/*
  # Add Verdeler Selection to Client Portals

  1. Changes
    - Add `verdeler_ids` column to `client_portals` table to track which verdelers are included in the portal
    - This allows selective sharing of verdelers with "Levering" status
    - Array of UUID references to distributors table
    
  2. Purpose
    - Enable granular control over which verdelers are visible in the client portal
    - Support workflow where only verdelers with "Levering" status are shared with clients
    - Allow incremental addition of verdelers as they become ready for delivery
*/

-- Add verdeler_ids column to track which verdelers are included in this portal
ALTER TABLE client_portals
ADD COLUMN IF NOT EXISTS verdeler_ids uuid[] DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN client_portals.verdeler_ids IS 'Array of distributor IDs that are included in this client portal. NULL means all verdelers for the project are included (legacy behavior).';
