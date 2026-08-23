import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { recipes, ingredients, steps, videos, tags, recipeTags } from "@/lib/db/schema";
import { requireAuth } from "@/lib/dal";
import { eq, asc } from "drizzle-orm";
import { EditRecipeForm } from "./edit-form";

async function getRecipeForEdit(slug: string) {
  await requireAuth();
  const [recipe] = await db.select().from(recipes).where(eq(recipes.slug, slug));
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
    tags: recipeTags_.map((t) => t.name),
  };
}

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getRecipeForEdit(slug);
  if (!recipe) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Edit Recipe</h1>
      <EditRecipeForm recipe={recipe} />
    </div>
  );
}
