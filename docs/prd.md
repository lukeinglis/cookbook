# Product spec

Personal digital cookbook at `cooking.lukeinglis.me`.

## Problem

Recipes are scattered across handwritten cards, bookmarked URLs, and memory. There is no single place to find them, no record of the adjustments made over years of cooking the same dish, and no help coordinating the 3 or 4 recipes that make up one meal.

## Scope

### The cookbook layer

Every recipe in one place, editable from a phone. Three entry paths (photo of a handwritten card, URL, manual entry), dated notes tracking how each dish changes over time, dish photos attached to specific cooks, and reference videos stored as YouTube links with captured metadata.

Postgres is the source of truth. A scheduled markdown export to a git repo keeps the data portable. The repo is a backup, not the database. Notes get written from a phone mid-cook, and committing to git from a phone is friction that would stop notes from being written at all.

### The tooling layer

Features that make the cookbook useful in the 2 hours before and during dinner: cook mode (large type, step-at-a-time, inline timers), merged grocery lists, and a meal timeline that backward-schedules multiple recipes to a target serve time.

The cookbook layer must be complete and populated before the tooling layer is worth building. A cookbook with 4 recipes in it does not need a meal planner.

## Requirements: cookbook

**Capture.** Three entry paths.

1. Photo of a handwritten card. VLM extraction into the structured schema. The photo is kept as permanent provenance (`source_card`). Lands on the review screen before saving.
2. URL. Prefer JSON-LD recipe schema when the page publishes it, fall back to VLM extraction on the page text. Also accept a screenshot of a recipe page, which routes through the photo path. Lands on the review screen before saving.
3. Manual entry. A direct form for the same fields. No review screen, since there is no extraction output to correct.

**Review screen.** For extraction paths (photo and URL) only. Assume extraction is wrong. Source photo or page text shown alongside parsed fields. Every ingredient shows `raw_text` and its parsed pieces, both editable. Ingredients that fail to parse are visually flagged without blocking save. Nothing writes to the database until confirmed.

**Provenance.** Original card photos are permanent and survive recipe edits. Imported recipes track their source URL and original title.

**Reference videos.** YouTube links with a short label, ordered by position. Title and channel name captured at save time so a dead embed still identifies what it was. Position 1 renders expanded, the rest collapsed. A video can optionally point at a step with a timestamp.

**Dish photos.** Camera capture from inside the app, attached to a cook event for that date. Multiple per recipe. One pinned as the card thumbnail. Thumbnails and full-res originals stored separately.

**Notes.** Append-only, dated. Reachable in 2 taps from the recipe page. Promoting a note means its change was folded into the recipe body; the note stays as the record of why. No editing, no deleting from the UI.

**Components.** A recipe can reference other recipes (sauces, doughs, spice blends). Self-referencing with a depth limit of 3 and cycle rejection on write. Parent recipes render components inline as collapsed sections.

**Scaling.** View-time multiplier, never persisted. Presets at 0.25x, 0.5x, 2x, 3x, plus a target servings input. Only ingredients with `scalable = true` and a parsed quantity are multiplied. Fractions display as fractions. Components scale by the parent factor multiplied by their own `scale` value.

**Index.** Grid with dish thumbnails, falling back to a title card. Sorts: alphabetical, recently cooked, recently added, times cooked, total time. Filters on every taxonomy field plus tags. Components filterable in or out, defaulting to out.

**Search.** Full-text across title, ingredients, and notes.

See [docs/schema.md](./schema.md) for the full data model.

## Requirements: tooling

**Cook mode.** Large type, step-at-a-time view, screen stays awake, inline timers on steps with a duration. Reference videos stay reachable without leaving the recipe.

**Grocery list.** Select 2 to 5 recipes, get a merged list that combines duplicate ingredients and groups by store section.

**Meal timeline.** Same recipe selection plus a target serve time, backward-scheduled into one plan that interleaves passive waits across recipes.

**Offline.** PWA with a service worker. Full recipe text, ingredients, steps, and card photos cached for the entire library. Notes written offline queue and sync on reconnect. Video, imports, and grocery lists are online-only.

## Deferred

Accounts, sharing, comments, discovery, publishing. Pantry and inventory tracking. Nothing in v1 assumes a second user.

## Key risk

The tooling layer depends entirely on ingredient and step parsing coming out of the capture step. If extraction is unreliable on handwritten cards, the grocery merge produces garbage and the timeline cannot be built.

Test VLM extraction on the 10 messiest handwritten cards before building the tooling layer. That result decides whether the timeline is a v2 feature or never.

## Open questions

- How large does the library get before the offline cache is a problem? Card photos and dish thumbnails are the weight, not the text. A recipe cooked 30 times carries 30 photos.
- Does a video ever become the source of a recipe (pulled from its transcript), or are those always written out by hand?
- Do timestamped video steps get set by hand, or is that too much work per recipe to bother with?

## Phasing

### Milestone: Cookbook

| Issue | Scope |
| --- | --- |
| 1a Foundation | Schema, password gate, manual entry, recipe page, index with sorts and filters |
| 1b Capture | Photo upload, URL import, screenshot import, VLM extraction, review screen |

### Milestone: Cooking

| Issue | Scope |
| --- | --- |
| 2 Cook mode | Step-at-a-time view, timers, wake lock, video access |
| 3 Offline | Service worker, recipe cache, offline note queue |

### Milestone: Planning

| Issue | Scope |
| --- | --- |
| 4 Grocery list | Recipe selection, ingredient merge, store section grouping |
| 5 Meal timeline | Target serve time, backward scheduling, interleaved passive waits |
| 6 Markdown export | Scheduled export of every recipe to markdown in a git repo |
