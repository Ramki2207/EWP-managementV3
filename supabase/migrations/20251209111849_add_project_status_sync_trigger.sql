/*
  # Add Project Status Sync Trigger

  1. Purpose
    - Automatically update project status based on verdeler statuses
    - Project status should always reflect the lowest/earliest status among all verdelers
    - Only when ALL verdelers have the same status should the project match that status
    
  2. Status Hierarchy (earliest to latest)
    - Offerte (1)
    - Intake (2)
    - Werkvoorbereiding (3)
    - Productie (4)
    - Testen (5)
    - Levering (6)
    - Opgeleverd (7)
    
  3. Logic
    - When a verdeler status changes, find the minimum status across all verdelers
    - Update the project to have that minimum status
    - This ensures the project reflects the overall progress accurately
*/

-- Function to get status priority (lower number = earlier in process)
CREATE OR REPLACE FUNCTION get_status_priority(status_value text)
RETURNS integer AS $$
BEGIN
  RETURN CASE status_value
    WHEN 'Offerte' THEN 1
    WHEN 'Intake' THEN 2
    WHEN 'Werkvoorbereiding' THEN 3
    WHEN 'Productie' THEN 4
    WHEN 'Testen' THEN 5
    WHEN 'Levering' THEN 6
    WHEN 'Opgeleverd' THEN 7
    ELSE 999 -- Unknown statuses get lowest priority
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update project status based on distributor statuses
CREATE OR REPLACE FUNCTION update_project_status_from_distributors()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id uuid;
  v_min_status text;
  v_current_project_status text;
BEGIN
  -- Get the project ID (works for both INSERT, UPDATE, and DELETE)
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
  ELSE
    v_project_id := NEW.project_id;
  END IF;

  -- Get current project status
  SELECT status INTO v_current_project_status
  FROM projects
  WHERE id = v_project_id;

  -- Find the minimum (earliest) status among all distributors for this project
  SELECT status INTO v_min_status
  FROM distributors
  WHERE project_id = v_project_id
  ORDER BY get_status_priority(status) ASC
  LIMIT 1;

  -- If no distributors remain (all deleted), don't update project status
  IF v_min_status IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Only update if the status actually changed
  IF v_current_project_status IS DISTINCT FROM v_min_status THEN
    UPDATE projects
    SET status = v_min_status
    WHERE id = v_project_id;
    
    RAISE NOTICE 'Project % status updated from % to % (based on distributor statuses)', 
      v_project_id, v_current_project_status, v_min_status;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS sync_project_status_on_distributor_change ON distributors;

-- Create trigger on distributors table
CREATE TRIGGER sync_project_status_on_distributor_change
AFTER INSERT OR UPDATE OF status OR DELETE ON distributors
FOR EACH ROW
EXECUTE FUNCTION update_project_status_from_distributors();

-- Update all existing projects to have the correct status based on their distributors
DO $$
DECLARE
  v_project record;
  v_min_status text;
BEGIN
  FOR v_project IN SELECT DISTINCT project_id FROM distributors WHERE project_id IS NOT NULL
  LOOP
    -- Find minimum status for this project
    SELECT status INTO v_min_status
    FROM distributors
    WHERE project_id = v_project.project_id
    ORDER BY get_status_priority(status) ASC
    LIMIT 1;

    -- Update project if status is different
    IF v_min_status IS NOT NULL THEN
      UPDATE projects
      SET status = v_min_status
      WHERE id = v_project.project_id
        AND status IS DISTINCT FROM v_min_status;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Updated existing project statuses based on distributor statuses';
END $$;
