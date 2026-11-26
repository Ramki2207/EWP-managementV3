/*
# Add "afgerond" (archived) marker to projects

1. Modified Tables
- `projects`
  - `afgerond_at` (timestamptz, nullable): moment the project was closed via "Afronden". Null means still active.
  - `afgerond_by` (uuid, nullable, references users.id): who closed the project.

2. Purpose
- Projects closed via the "Afronden" action move to the Historie page and are hidden
  from the Projecten page and productieplanning for the user who uses this feature.

3. Security
- No RLS or grant changes; the projects table keeps its existing access rules.

4. Notes
1. Existing projects are untouched (afgerond_at stays null).
2. Index on afgerond_at for quick Historie lookups.
*/

ALTER TABLE projects ADD COLUMN IF NOT EXISTS afgerond_at timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS afgerond_by uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_afgerond_at ON projects (afgerond_at);