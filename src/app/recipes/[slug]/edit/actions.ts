"use server";

import { db } from "@/lib/db";
import { recipes, ingredients, steps, videos, tags, recipeTags } from "@/lib/db/schema";
import { requireAuth } from "@/lib/dal";
import { recipeFormSchema, type RecipeFormData } from "@/lib/recipe-schema";
import { slugify } from "@/lib/slugify";
import { normalizeUnit } from "@/lib/taxonomy";
import { logger } from "@/lib/logger";
import { parseFractionQuantity } from "@/lib/parse-fraction";
import { buildRawText, extractYouTubeVideoId } from "@/lib/recipe-utils";
import { eq, and, ne } from "drizzle-orm";

export async function updateRecipe(
  recipeId: string,
  currentSlug: string,
  data: RecipeFormData
): Promise<{ slug?: string; error?: string }> {
  await requireAuth();

  const parsed = recipeFormSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid recipe data" };

  const d = parsed.data;
  let slug = slugify(d.title);

  const existing = await db
    .select({ slug: recipes.slug })
    .from(recipes)
    .where(and(eq(recipes.slug, slug), ne(recipes.id, recipeId)));
  if (existing.length > 0) slug = `${slug}-${Date.now()}`;

  try {
    await db
      .update(recipes)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, recipeId));

    // Replace ingredients
    await db.delete(ingredients).where(eq(ingredients.recipeId, recipeId));
    const validIngredients = d.ingredients
      .map((ing) => ({ ...ing, rawText: buildRawText(ing.quantity, ing.unit, ing.item, ing.prepNote) }))
      .filter((ing) => ing.rawText.trim());
    if (validIngredients.length > 0) {
      await db.insert(ingredients).values(
        validIngredients.map((ing, idx) => ({
          recipeId,
          position: idx,
          rawText: ing.rawText,
          quantity: parseFractionQuantity(ing.quantity)?.toString() ?? null,
          unit: normalizeUnit(ing.unit),
          item: ing.item || null,
          prepNote: ing.prepNote || null,
          scalable: ing.scalable,
          groupLabel: ing.groupLabel || null,
        }))
      );
    }

    // Replace steps
    await db.delete(steps).where(eq(steps.recipeId, recipeId));
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

    // Replace videos
    await db.delete(videos).where(eq(videos.recipeId, recipeId));
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

    // Replace tags
    await db.delete(recipeTags).where(eq(recipeTags.recipeId, recipeId));
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

    logger.info({ event: "recipe_updated", slug, recipeId }, "Recipe updated");
    return { slug };
  } catch (err) {
    logger.error({ event: "recipe_update_error", error: err }, "Failed to update recipe");
    return { error: "Failed to update recipe" };
  }
}
