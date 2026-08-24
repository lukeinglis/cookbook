CREATE OR REPLACE FUNCTION check_component_cycle()
RETURNS TRIGGER AS $$
DECLARE
  has_cycle BOOLEAN;
  upward_depth INTEGER;
  downward_depth INTEGER;
BEGIN
  -- Self-reference check
  IF NEW.parent_recipe_id = NEW.child_recipe_id THEN
    RAISE EXCEPTION 'A recipe cannot be a component of itself';
  END IF;

  -- Walk upward from the proposed parent through ancestor links.
  -- Detects cycles (child appearing in ancestry) and measures upward depth.
  WITH RECURSIVE ancestry AS (
    SELECT parent_recipe_id AS ancestor_id, 1 AS depth
    FROM recipe_components
    WHERE child_recipe_id = NEW.parent_recipe_id

    UNION ALL

    SELECT rc.parent_recipe_id, a.depth + 1
    FROM recipe_components rc
    JOIN ancestry a ON rc.child_recipe_id = a.ancestor_id
    WHERE a.depth < 10
  )
  SELECT
    COALESCE(bool_or(ancestor_id = NEW.child_recipe_id), FALSE),
    COALESCE(MAX(depth), 0)
  INTO has_cycle, upward_depth
  FROM ancestry;

  IF has_cycle THEN
    RAISE EXCEPTION 'Adding this component would create a cycle in the recipe graph';
  END IF;

  -- Walk downward from the proposed child through descendant links.
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
  SELECT COALESCE(MAX(depth), 0)
  INTO downward_depth
  FROM descendants;

  IF upward_depth + 1 + downward_depth > 3 THEN
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
