# Schema

Full data model for the cookbook. All tables are created in the first migration, including fields that only later phases use.

## recipes

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| slug | text unique | |
| title | text | |
| description | text null | |
| base_servings | int | required, defaults to 4 |
| serving_noun | text | "servings", "cups", "loaves" |
| source_type | enum | `original`, `handwritten`, `url` |
| source_url | text null | |
| source_title | text null | preserved even if the link dies |
| is_component | bool | true for sauces, doughs, spice blends |
| make_ahead | bool | can be made before cook day |
| make_ahead_days | int null | how far ahead it holds |
| course | text null | taxonomy below |
| cuisine | text null | |
| protein | text null | |
| method | text null | |
| season | text null | |
| active_minutes | int null | derived from steps, cached |
| total_minutes | int null | derived from steps, cached |
| created_at | timestamptz | |
| updated_at | timestamptz | |

A component is a normal recipe. It has its own page, its own notes, its own scaling. `is_component` only affects how it sorts and where it surfaces.

## ingredients

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| recipe_id | uuid fk | |
| position | int | |
| raw_text | text | always populated, never null |
| quantity | numeric null | |
| unit | text null | normalized, see units section |
| item | text null | |
| prep_note | text null | "finely chopped", "divided" |
| scalable | bool | default true |
| group_label | text null | "For the sauce", "For the topping" |

`raw_text` is the fallback and the display default when parsing fails. An ingredient with no parsed quantity still saves and still renders. "Salt to taste" gets `scalable = false` and no structured fields.

## steps

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| recipe_id | uuid fk | |
| position | int | |
| text | text | |
| duration_seconds | int null | |
| is_passive | bool | default false, true for rests, marinades, bakes |
| video_id | uuid null | fk to videos |
| video_seconds | int null | jump point in that video |

`is_passive` and `duration_seconds` are what the meal timeline runs on later. Capture them now even though nothing reads them yet.

## recipe_components

| Field | Type | Notes |
| --- | --- | --- |
| parent_recipe_id | uuid fk | |
| child_recipe_id | uuid fk | |
| scale | numeric | default 1.0 |
| position | int | |
| note | text null | "make the day before" |

Self-referencing many-to-many. See rules below.

## cooks

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| recipe_id | uuid fk | |
| cooked_at | date | |
| scale_used | numeric | default 1.0 |
| rating | int null | 1 to 5 |

A cook event is the anchor for notes and dish photos. Creating either one from a recipe page creates or attaches to a cook event for that date.

## notes

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| recipe_id | uuid fk | |
| cook_id | uuid null fk | |
| body | text | |
| promoted | bool | default false |
| created_at | timestamptz | |

Append-only. No editing, no deleting from the UI. Promoting a note means its change was folded into the recipe body; the note stays as the record of why.

## photos

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| recipe_id | uuid fk | |
| cook_id | uuid null fk | |
| kind | enum | `source_card`, `dish` |
| blob_key | text | full resolution |
| thumb_key | text | max 400px, for the cache and the index |
| created_at | timestamptz | |

`source_card` photos are permanent provenance and never deleted when a recipe is edited.

## videos

| Field | Type | Notes |
| --- | --- | --- |
| id | uuid | primary key |
| recipe_id | uuid fk | |
| position | int | |
| url | text | |
| provider | text | youtube for now |
| provider_video_id | text | |
| title | text | captured at save time |
| channel | text | captured at save time |
| label | text null | why this one is saved |

Position 1 renders expanded on the recipe card, the rest collapsed.

## tags and recipe_tags

Free-text tags, many-to-many, alongside the fixed taxonomy fields on the recipe.

## Rules

### Scaling

A view-time multiplier, never written to the recipe. Presets at 0.25x, 0.5x, 2x, 3x, plus a target servings input that computes the factor against `base_servings`.

- Only ingredients with `scalable = true` and a parsed quantity are multiplied
- Non-scaling ingredients render unchanged with a subtle marker
- Fractions display as fractions (0.75 renders as 3/4, 1.5 tsp as 1 1/2 tsp)
- Round to kitchen precision, no 0.3333 cups
- Step text is not rewritten. If a step says "add the 2 cups of flour" it stays as written. Flag this in the review screen at capture time so quantities live in the ingredient list rather than inline in steps
- Components scale by the parent factor multiplied by their own `scale` value

### Unit normalization

Store what the recipe says. Normalize the unit string on write to a canonical set: g, kg, oz, lb, tsp, tbsp, cup, ml, l, each, pinch.

Never convert the stored quantity. Conversion happens only in the grocery list (a later issue). Build the normalization and a conversion table for volume-to-volume and weight-to-weight now. Cross-system conversion (volume to weight or weight to volume) requires ingredient density data, so it is not included.

### Taxonomy vocabularies

Fixed vocabularies, seeded and editable:

- **course**: appetizer, soup, salad, main, side, sauce, bread, dessert, breakfast, drink
- **cuisine**: standard list, start with 20
- **protein**: beef, pork, chicken, turkey, seafood, egg, bean, vegetarian, vegan
- **method**: grill, smoke, roast, braise, fry, saute, bake, no-cook, slow cooker, pressure cooker
- **season**: spring, summer, fall, winter, year-round

### recipe_components constraints

Depth limit of 3. A recipe that is already at depth 3 in any chain cannot be added as a component of another recipe.

Cycles are rejected on write. Before inserting a row, walk the graph from the proposed child upward. If the proposed parent appears anywhere in that ancestry, reject the insert.

### Notes append-only rule

Notes cannot be edited or deleted from the UI. The `promoted` flag marks notes whose changes were folded into the recipe body. The note itself is preserved as the record of why the change was made.
