"use server";

import { db } from "@/lib/db";
import { recipes, ingredients, steps, videos, tags, recipeTags } from "@/lib/db/schema";
import { requireAuth } from "@/lib/dal";
import { recipeFormSchema, type RecipeFormData } from "@/lib/recipe-schema";
import { slugify } from "@/lib/slugify";
import { normalizeUnit } from "@/lib/taxonomy";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";

function parseFractionQuantity(s: string): number | null {
  if (!s || !s.trim()) return null;
  const trimmed = s.trim();

  // Mixed fraction: "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }

  // Simple fraction: "1/2"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    return parseInt(fracMatch[1]) / parseInt(fracMatch[2]);
  }

  // Decimal or integer
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

function buildRawText(qty: string, unit: string, item: string, prepNote: string): string {
  const parts = [qty, unit, item].filter(Boolean).join(" ");
  if (prepNote) return `${parts}, ${prepNote}`;
  return parts || "—";
}

function extractYouTubeVideoId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    return u.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

export async function saveRecipe(data: RecipeFormData): Promise<{ slug?: string; error?: string }> {
  await requireAuth();

  const parsed = recipeFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid recipe data" };
  }

  const d = parsed.data;
  let slug = slugify(d.title);

  // Ensure unique slug
  const existing = await db.select({ slug: recipes.slug }).from(recipes).where(eq(recipes.slug, slug));
  if (existing.length > 0) {
    slug = `${slug}-${Date.now()}`;
  }

  try {
    const [recipe] = await db
      .insert(recipes)
      .values({
        slug,
        title: d.title,
        description: d.description || null,
        baseServings: d.baseServings,
        servingNoun: d.servingNoun,
        sourceType: d.sourceType,
        sourceUrl: d.sourceUrl || null,
        sourceTitle: d.sourceTitle || null,
        isComponent: d.isComponent,
        makeAhead: d.makeAhead,
        makeAheadDays: d.makeAheadDays ?? null,
        course: d.course || null,
        cuisine: d.cuisine || null,
        protein: d.protein || null,
        method: d.method || null,
        season: d.season || null,
        activeMinutes: d.activeMinutes ?? null,
        totalMinutes: d.totalMinutes ?? null,
      })
      .returning({ id: recipes.id });

    const recipeId = recipe.id;

    // Insert ingredients
    const validIngredients = d.ingredients.filter((i) => i.item || i.quantity);
    if (validIngredients.length > 0) {
      await db.insert(ingredients).values(
        validIngredients.map((ing, idx) => ({
          recipeId,
          position: idx,
          rawText: buildRawText(ing.quantity, ing.unit, ing.item, ing.prepNote),
          quantity: parseFractionQuantity(ing.quantity)?.toString() ?? null,
          unit: normalizeUnit(ing.unit),
          item: ing.item || null,
          prepNote: ing.prepNote || null,
          scalable: ing.scalable,
          groupLabel: ing.groupLabel || null,
        }))
      );
    }

    // Insert steps
    const validSteps = d.steps.filter((s) => s.text.trim());
    if (validSteps.length > 0) {
      await db.insert(steps).values(
        validSteps.map((step, idx) => ({
          recipeId,
          position: idx,
          text: step.text,
          durationSeconds: step.durationMinutes ? parseInt(step.durationMinutes) * 60 : null,
          isPassive: step.isPassive,
        }))
      );
    }

    // Insert videos
    const validVideos = d.videos.filter((v) => v.url);
    if (validVideos.length > 0) {
      await db.insert(videos).values(
        validVideos.map((video, idx) => ({
          recipeId,
          position: idx,
          url: video.url,
          provider: "youtube",
          providerVideoId: video.providerVideoId || extractYouTubeVideoId(video.url),
          title: video.title || "Untitled",
          channel: video.channel || "Unknown",
          label: video.label || null,
        }))
      );
    }

    // Insert tags
    if (d.tags.length > 0) {
      for (const tagName of d.tags) {
        const existing = await db.select().from(tags).where(eq(tags.name, tagName));
        let tagId: string;
        if (existing.length > 0) {
          tagId = existing[0].id;
        } else {
          const [newTag] = await db.insert(tags).values({ name: tagName }).returning({ id: tags.id });
          tagId = newTag.id;
        }
        await db.insert(recipeTags).values({ recipeId, tagId });
      }
    }

    logger.info({ event: "recipe_created", slug, recipeId }, "Recipe created");
    return { slug };
  } catch (err) {
    logger.error({ event: "recipe_create_error", error: err }, "Failed to create recipe");
    return { error: "Failed to save recipe" };
  }
}
