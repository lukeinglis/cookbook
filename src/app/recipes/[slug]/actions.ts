"use server";

import { db } from "@/lib/db";
import { notes, cooks, photos, recipes } from "@/lib/db/schema";
import { requireAuth } from "@/lib/dal";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

export async function togglePromoted(
  noteId: string,
  promoted: boolean,
  recipeSlug: string
) {
  await requireAuth();
  await db.update(notes).set({ promoted }).where(eq(notes.id, noteId));
  revalidatePath(`/recipes/${recipeSlug}`);
}

export async function addNote(formData: FormData) {
  await requireAuth();

  const recipeId = formData.get("recipeId") as string;
  const recipeSlug = formData.get("recipeSlug") as string;
  const body = formData.get("body") as string;
  const cookDate = (formData.get("cookDate") as string) || new Date().toISOString().split("T")[0];
  const ratingStr = formData.get("rating") as string;
  const rating = ratingStr ? parseInt(ratingStr) : null;

  if (!body?.trim()) {
    return { error: "Note body is required" };
  }

  // Find or create cook event for this date
  let [cook] = await db
    .select()
    .from(cooks)
    .where(and(eq(cooks.recipeId, recipeId), eq(cooks.cookedAt, cookDate)));

  if (!cook) {
    [cook] = await db
      .insert(cooks)
      .values({
        recipeId,
        cookedAt: cookDate,
        scaleUsed: "1.0",
        rating,
      })
      .returning();
  } else if (rating && !cook.rating) {
    await db.update(cooks).set({ rating }).where(eq(cooks.id, cook.id));
  }

  await db.insert(notes).values({
    recipeId,
    cookId: cook.id,
    body: body.trim(),
  });

  logger.info(
    { event: "note_added", recipeId, cookId: cook.id },
    "Note added to recipe"
  );

  revalidatePath(`/recipes/${recipeSlug}`);
  return { success: true };
}

export async function addPhoto(formData: FormData) {
  await requireAuth();

  const recipeId = formData.get("recipeId") as string;
  const recipeSlug = formData.get("recipeSlug") as string;
  const blobKey = formData.get("blobKey") as string;
  const thumbKey = formData.get("thumbKey") as string;
  const kind = (formData.get("kind") as "dish" | "source_card") || "dish";

  if (!blobKey || !thumbKey) {
    return { error: "Photo URLs required" };
  }

  // Find or create cook event for today
  const today = new Date().toISOString().split("T")[0];
  let cookId: string | null = null;

  if (kind === "dish") {
    let [cook] = await db
      .select()
      .from(cooks)
      .where(and(eq(cooks.recipeId, recipeId), eq(cooks.cookedAt, today)));

    if (!cook) {
      [cook] = await db
        .insert(cooks)
        .values({ recipeId, cookedAt: today })
        .returning();
    }
    cookId = cook.id;
  }

  const [photo] = await db
    .insert(photos)
    .values({ recipeId, cookId, kind, blobKey, thumbKey })
    .returning();

  // Auto-pin first dish photo
  if (kind === "dish") {
    const [recipe] = await db
      .select({ thumbnailPhotoId: recipes.thumbnailPhotoId })
      .from(recipes)
      .where(eq(recipes.id, recipeId));
    if (!recipe.thumbnailPhotoId) {
      await db
        .update(recipes)
        .set({ thumbnailPhotoId: photo.id })
        .where(eq(recipes.id, recipeId));
    }
  }

  logger.info(
    { event: "photo_added", recipeId, kind },
    "Photo added to recipe"
  );

  revalidatePath(`/recipes/${recipeSlug}`);
  return { success: true };
}

export async function pinPhoto(
  recipeId: string,
  photoId: string,
  recipeSlug: string
) {
  await requireAuth();
  await db
    .update(recipes)
    .set({ thumbnailPhotoId: photoId })
    .where(eq(recipes.id, recipeId));
  revalidatePath(`/recipes/${recipeSlug}`);
}
