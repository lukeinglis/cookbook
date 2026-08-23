import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  recipes,
  ingredients,
  steps,
  videos,
  notes,
  photos,
  cooks,
  recipeComponents,
  tags,
  recipeTags,
} from "@/lib/db/schema";
import { requireAuth } from "@/lib/dal";
import { eq, desc, sql, asc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScalingControls } from "./scaling-controls";
import { NotesList } from "./notes-list";
import { PhotoGallery } from "./photo-gallery";
import { ComponentSection } from "./component-section";
import { VideoSection } from "./video-section";
import { PhotoUpload } from "./photo-upload";

async function getRecipe(slug: string) {
  await requireAuth();

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.slug, slug));
  if (!recipe) return null;

  const recipeIngredients = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.recipeId, recipe.id))
    .orderBy(asc(ingredients.position));

  const recipeSteps = await db
    .select()
    .from(steps)
    .where(eq(steps.recipeId, recipe.id))
    .orderBy(asc(steps.position));

  const recipeVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.recipeId, recipe.id))
    .orderBy(asc(videos.position));

  const recipeNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.recipeId, recipe.id))
    .orderBy(desc(notes.createdAt));

  const recipePhotos = await db
    .select()
    .from(photos)
    .where(eq(photos.recipeId, recipe.id))
    .orderBy(desc(photos.createdAt));

  const recipeCooks = await db
    .select()
    .from(cooks)
    .where(eq(cooks.recipeId, recipe.id))
    .orderBy(desc(cooks.cookedAt));

  const components = await db
    .select({
      parentRecipeId: recipeComponents.parentRecipeId,
      childRecipeId: recipeComponents.childRecipeId,
      scale: recipeComponents.scale,
      position: recipeComponents.position,
      note: recipeComponents.note,
      childTitle: recipes.title,
      childSlug: recipes.slug,
    })
    .from(recipeComponents)
    .innerJoin(recipes, eq(recipeComponents.childRecipeId, recipes.id))
    .where(eq(recipeComponents.parentRecipeId, recipe.id))
    .orderBy(asc(recipeComponents.position));

  // Fetch component ingredients
  const componentData = await Promise.all(
    components.map(async (comp) => {
      const compIngredients = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.recipeId, comp.childRecipeId))
        .orderBy(asc(ingredients.position));
      const compSteps = await db
        .select()
        .from(steps)
        .where(eq(steps.recipeId, comp.childRecipeId))
        .orderBy(asc(steps.position));
      return { ...comp, ingredients: compIngredients, steps: compSteps };
    })
  );

  const recipeTags_ = await db
    .select({ name: tags.name })
    .from(recipeTags)
    .innerJoin(tags, eq(recipeTags.tagId, tags.id))
    .where(eq(recipeTags.recipeId, recipe.id));

  return {
    ...recipe,
    ingredients: recipeIngredients,
    steps: recipeSteps,
    videos: recipeVideos,
    notes: recipeNotes,
    photos: recipePhotos,
    cooks: recipeCooks,
    components: componentData,
    tags: recipeTags_.map((t) => t.name),
  };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);
  if (!recipe) notFound();

  const dishPhotos = recipe.photos.filter((p) => p.kind === "dish");
  const sourcePhotos = recipe.photos.filter((p) => p.kind === "source_card");
  const pinnedPhoto = recipe.thumbnailPhotoId
    ? dishPhotos.find((p) => p.id === recipe.thumbnailPhotoId)
    : dishPhotos[0];

  const taxonomyBadges = [
    recipe.course,
    recipe.cuisine,
    recipe.protein,
    recipe.method,
    recipe.season,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Hero photo */}
      {pinnedPhoto && (
        <img
          src={pinnedPhoto.blobKey}
          alt={recipe.title}
          className="mb-6 w-full rounded-lg object-cover"
          style={{ maxHeight: 400 }}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{recipe.title}</h1>
        {recipe.description && (
          <p className="mt-2 text-lg text-muted-foreground">{recipe.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {taxonomyBadges.map((b) => (
            <Badge key={b} variant="secondary" className="capitalize">
              {b}
            </Badge>
          ))}
          {recipe.tags.map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            {recipe.baseServings} {recipe.servingNoun}
          </span>
          {recipe.activeMinutes && <span>{recipe.activeMinutes} min active</span>}
          {recipe.totalMinutes && <span>{recipe.totalMinutes} min total</span>}
          {recipe.cooks.length > 0 && (
            <span>
              Cooked {recipe.cooks.length}× · Last: {recipe.cooks[0].cookedAt}
            </span>
          )}
        </div>

        {recipe.sourceUrl && (
          <p className="mt-2 text-sm">
            Source:{" "}
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {recipe.sourceTitle || recipe.sourceUrl}
            </a>
          </p>
        )}

        {recipe.makeAhead && (
          <p className="mt-1 text-sm text-muted-foreground">
            ✓ Make ahead{recipe.makeAheadDays ? ` (${recipe.makeAheadDays} days)` : ""}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={`/recipes/${slug}/edit`}>
          <Button variant="outline">Edit</Button>
        </Link>
        <PhotoUpload recipeId={recipe.id} recipeSlug={slug} kind="dish" />
        <PhotoUpload recipeId={recipe.id} recipeSlug={slug} kind="source_card" />
      </div>

      <Separator className="my-6" />

      {/* Scaling + Ingredients */}
      <ScalingControls
        baseServings={recipe.baseServings}
        servingNoun={recipe.servingNoun}
        ingredients={recipe.ingredients.map((i) => ({
          id: i.id,
          rawText: i.rawText,
          quantity: i.quantity ? parseFloat(i.quantity) : null,
          unit: i.unit,
          item: i.item,
          prepNote: i.prepNote,
          scalable: i.scalable,
          groupLabel: i.groupLabel,
        }))}
      />

      <Separator className="my-6" />

      {/* Steps */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Steps</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step, idx) => (
            <li key={step.id} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {idx + 1}
              </span>
              <div>
                <p className="text-lg">{step.text}</p>
                <div className="mt-1 flex gap-2 text-sm text-muted-foreground">
                  {step.durationSeconds && (
                    <span>
                      {step.isPassive ? "⏳" : "⏱"}{" "}
                      {Math.round(step.durationSeconds / 60)} min
                    </span>
                  )}
                  {step.isPassive && !step.durationSeconds && (
                    <span>⏳ Passive step</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Components */}
      {recipe.components.length > 0 && (
        <>
          <Separator className="my-6" />
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Components</h2>
            {recipe.components.map((comp) => (
              <ComponentSection
                key={comp.childRecipeId}
                title={comp.childTitle}
                slug={comp.childSlug}
                scale={parseFloat(comp.scale)}
                note={comp.note}
                ingredients={comp.ingredients.map((i) => ({
                  id: i.id,
                  rawText: i.rawText,
                  quantity: i.quantity ? parseFloat(i.quantity) : null,
                  unit: i.unit,
                  item: i.item,
                  prepNote: i.prepNote,
                  scalable: i.scalable,
                  groupLabel: i.groupLabel,
                }))}
                steps={comp.steps.map((s) => ({
                  id: s.id,
                  text: s.text,
                  durationSeconds: s.durationSeconds,
                  isPassive: s.isPassive,
                }))}
                baseServings={recipe.baseServings}
              />
            ))}
          </section>
        </>
      )}

      {/* Videos */}
      {recipe.videos.length > 0 && (
        <>
          <Separator className="my-6" />
          <VideoSection videos={recipe.videos} />
        </>
      )}

      {/* Photos */}
      {dishPhotos.length > 0 && (
        <>
          <Separator className="my-6" />
          <PhotoGallery photos={dishPhotos} title="Photos" />
        </>
      )}

      {sourcePhotos.length > 0 && (
        <>
          <Separator className="my-6" />
          <PhotoGallery photos={sourcePhotos} title="Source" />
        </>
      )}

      {/* Notes */}
      <Separator className="my-6" />
      <NotesList
        notes={recipe.notes.map((n) => ({
          id: n.id,
          body: n.body,
          promoted: n.promoted,
          createdAt: n.createdAt.toISOString(),
          cookId: n.cookId,
        }))}
        recipeId={recipe.id}
        recipeSlug={slug}
      />
    </div>
  );
}
