/*
  # Add Project Reference and Delivery Information Fields

  1. New Columns
    - `referentie_ewp` (text) - Reference number from EWP Paneelbouw
    - `referentie_klant` (text) - Customer reference number
    - `aflever_adres` (text) - Delivery address
    - `contactpersoon_voornaam` (text) - Contact person first name at delivery location
    - `contactpersoon_achternaam` (text) - Contact person last name at delivery location
    - `contactpersoon_telefoon` (text) - Contact person phone number
    - `contactpersoon_email` (text) - Contact person email address

  2. Notes
    - All fields are optional (nullable)
    - These fields can be filled during project creation or updated later
    - Fields support project tracking and delivery coordination
*/

-- Add reference fields
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS referentie_ewp text,
ADD COLUMN IF NOT EXISTS referentie_klant text;

-- Add delivery address field
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS aflever_adres text;

-- Add contact person fields
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS contactpersoon_voornaam text,
ADD COLUMN IF NOT EXISTS contactpersoon_achternaam text,
ADD COLUMN IF NOT EXISTS contactpersoon_telefoon text,
ADD COLUMN IF NOT EXISTS contactpersoon_email text;