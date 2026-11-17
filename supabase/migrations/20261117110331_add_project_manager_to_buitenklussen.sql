/*
# Add project manager to buitenklussen

1. Modified Tables
- `buitenklussen`
  - `project_manager` (text, default '') - name of the projectmanager responsible for the buitenklus
2. Security
- No changes; existing policies and grants cover the new column.
*/

ALTER TABLE buitenklussen ADD COLUMN IF NOT EXISTS project_manager text NOT NULL DEFAULT '';
