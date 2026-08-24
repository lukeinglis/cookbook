-- Cycle detection trigger for recipe_components
-- Uses a bounded recursive CTE to walk the graph from the proposed child upward.
-- Rejects if the proposed parent appears anywhere in the ancestry (cycle)
-- or if the resulting depth would exceed 3.

CREATE OR REPLACE FUNCTION check_component_cycle()
RETURNS TRIGGER AS $$
DECLARE
  max_depth INTEGER;
  has_cycle BOOLEAN;
BEGIN
  -- Check for direct self-reference
  IF NEW.parent_recipe_id = NEW.child_recipe_id THEN
    RAISE EXCEPTION 'A recipe cannot be a component of itself';
  END IF;

  -- Walk upward from the proposed parent to see if the child appears as an ancestor (cycle check)
  -- Also compute depth to enforce the 3-level limit
  WITH RECURSIVE ancestry AS (
    SELECT parent_recipe_id AS ancestor_id, 1 AS depth
    FROM recipe_components
    WHERE child_recipe_id = NEW.parent_recipe_id

    UNION ALL

    SELECT rc.parent_recipe_id, a.depth + 1
    FROM recipe_components rc
    JOIN ancestry a ON rc.child_recipe_id = a.ancestor_id
    WHERE a.depth < 10 -- safety bound
  )
  SELECT
    bool_or(ancestor_id = NEW.child_recipe_id),
    COALESCE(MAX(depth), 0)
  INTO has_cycle, max_depth
  FROM ancestry;

  IF has_cycle THEN
    RAISE EXCEPTION 'Adding this component would create a cycle in the recipe graph';
  END IF;

  -- Check depth from the child downward
  WITH RECURSIVE descendants AS (
    SELECT child_recipe_id AS descendant_id, 1 AS depth
    FROM recipe_components
    WHERE parent_recipe_id = NEW.child_recipe_id

    UNION ALL

    SELECT rc.child_recipe_id, d.depth + 1
    FROM recipe_components rc
    JOIN descendants d ON rc.parent_recipe_id = d.descendant_id
    WHERE d.depth < 10
  )
  SELECT COALESCE(MAX(depth), 0) INTO max_depth FROM descendants;

  -- Total depth = levels above parent + 1 (this link) + levels below child
  -- We already know levels above parent from the ancestry CTE
  -- The depth limit is 3, meaning max 3 levels of nesting
  IF max_depth + 1 > 3 THEN
    RAISE EXCEPTION 'Adding this component would exceed the maximum nesting depth of 3';
  END IF;

  -- Also check upward depth
  WITH RECURSIVE upward AS (
    SELECT parent_recipe_id AS ancestor_id, 1 AS depth
    FROM recipe_components
    WHERE child_recipe_id = NEW.parent_recipe_id

    UNION ALL

    SELECT rc.parent_recipe_id, u.depth + 1
    FROM recipe_components rc
    JOIN upward u ON rc.child_recipe_id = u.ancestor_id
    WHERE u.depth < 10
  )
  SELECT COALESCE(MAX(depth), 0) INTO max_depth FROM upward;

  -- max_depth (above) + 1 (this link) + child_depth (below)
  -- For simplicity: total chain length must not exceed 3
  WITH RECURSIVE child_depth AS (
    SELECT child_recipe_id AS descendant_id, 1 AS depth
    FROM recipe_components
    WHERE parent_recipe_id = NEW.child_recipe_id

    UNION ALL

    SELECT rc.child_recipe_id, cd.depth + 1
    FROM recipe_components rc
    JOIN child_depth cd ON rc.parent_recipe_id = cd.descendant_id
    WHERE cd.depth < 10
  )
  SELECT COALESCE(MAX(depth), 0) INTO has_cycle FROM child_depth; -- reusing variable

  IF max_depth + 1 + COALESCE((SELECT MAX(depth) FROM (
    WITH RECURSIVE cd AS (
      SELECT child_recipe_id AS did, 1 AS depth
      FROM recipe_components WHERE parent_recipe_id = NEW.child_recipe_id
      UNION ALL
      SELECT rc.child_recipe_id, cd.depth + 1
      FROM recipe_components rc JOIN cd ON rc.parent_recipe_id = cd.did WHERE cd.depth < 10
    ) SELECT depth FROM cd
  ) sub), 0) > 3 THEN
    RAISE EXCEPTION 'Adding this component would exceed the maximum nesting depth of 3';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_component_cycle ON recipe_components;
CREATE TRIGGER trg_check_component_cycle
  BEFORE INSERT OR UPDATE ON recipe_components
  FOR EACH ROW
  EXECUTE FUNCTION check_component_cycle();
