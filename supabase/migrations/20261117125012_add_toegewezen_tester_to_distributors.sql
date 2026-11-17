/*
# Track which tester is testing a verdeler

1. Modified Tables
- `distributors`
  - `toegewezen_tester` (text, nullable): username of the tester who approved the pre-checklist ("Goedkeuren") and is now testing this verdeler.

2. Data
- Backfill: for verdelers currently in status 'Testen', copy the reviewer name from the most recent approved
  pre-testing checklist (test_data, test_type 'verdeler_pre_testing_approval' / 'pre_testing_approval').

3. Security
- No changes. Existing access rules on `distributors` are unchanged.

4. Notes
- Index added because the dashboard filters verdelers by tester.
*/

ALTER TABLE distributors ADD COLUMN IF NOT EXISTS toegewezen_tester text;

CREATE INDEX IF NOT EXISTS idx_distributors_toegewezen_tester ON distributors (toegewezen_tester);

UPDATE distributors d
SET toegewezen_tester = latest.reviewed_by
FROM (
  SELECT DISTINCT ON (t.distributor_id)
    t.distributor_id,
    t.data->'approvalData'->>'reviewedBy' AS reviewed_by
  FROM test_data t
  WHERE t.test_type IN ('verdeler_pre_testing_approval', 'pre_testing_approval')
    AND (t.data->'approvalData'->>'overallApproval')::boolean IS TRUE
    AND coalesce(t.data->'approvalData'->>'reviewedBy', '') <> ''
  ORDER BY t.distributor_id, t.created_at DESC
) latest
WHERE d.id = latest.distributor_id
  AND lower(d.status) = 'testen'
  AND d.toegewezen_tester IS NULL;