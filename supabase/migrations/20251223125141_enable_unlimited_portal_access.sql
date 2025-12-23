/*
  # Enable Unlimited Access for Client Portals

  1. Changes
    - Updates all existing client portals to have unlimited access
    - Sets expires_at to far future date (2099-12-31)
    - Ensures all active portals remain accessible indefinitely

  2. Purpose
    - Removes 30-day expiration limit on client portals
    - Provides continuous access to project documentation
    - Applies to all existing and future portals
*/

-- Update all existing client portals to have unlimited access
UPDATE client_portals
SET expires_at = '2099-12-31'::timestamptz
WHERE expires_at < '2099-12-31'::timestamptz;

-- Reactivate any portals that were previously deactivated due to expiration
UPDATE client_portals
SET is_active = true
WHERE is_active = false
  AND expires_at < '2099-12-31'::timestamptz;
