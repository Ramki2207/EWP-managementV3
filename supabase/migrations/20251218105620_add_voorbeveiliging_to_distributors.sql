/*
  # Add voorbeveiliging field to distributors

  1. Changes
    - Add `voorbeveiliging` column to distributors table (boolean, default false)
    - This field indicates whether the distributor is "Voorbeveiligd volgens IEC60947-02"
    - When true, the text "Voorbeveiligd volgens IEC60947-02" will be appended to the kA Waarde display
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'distributors' AND column_name = 'voorbeveiliging'
  ) THEN
    ALTER TABLE distributors ADD COLUMN voorbeveiliging boolean DEFAULT false;
  END IF;
END $$;