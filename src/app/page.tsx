import { db } from "@/lib/db";
import { recipes, cooks, photos } from "@/lib/db/schema";
import { requireAuth } from "@/lib/dal";
import { eq, desc, asc, sql, count } from "drizzle-orm";
import { RecipeGrid } from "./recipe-grid";

type SortOption = "alpha" | "recently-cooked" | "recently-added" | "times-cooked" | "total-time";

async function getRecipes(
  sort: SortOption = "alpha",
  search: string = "",
  filters: Record<string, string[]> = {},
  showComponents: boolean = false
) {
  await requireAuth();

  const conditions: ReturnType<typeof sql>[] = [];

  if (!showComponents) {
    conditions.push(sql`${recipes.isComponent} = false`);
  }

  for (const [field, values] of Object.entries(filters)) {
    if (values.length > 0) {
      conditions.push(
        sql`${sql.identifier(field)} IN (${sql.join(
          values.map((v) => sql`${v}`),
          sql`, `
        )})`
      );
    }
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      sql`(${recipes.title} ILIKE ${pattern} OR EXISTS (
        SELECT 1 FROM ingredients WHERE ingredients.recipe_id = recipes.id AND ingredients.item ILIKE ${pattern}
      ) OR EXISTS (
        SELECT 1 FROM notes WHERE notes.recipe_id = recipes.id AND notes.body ILIKE ${pattern}
      ))`
    );
  }

  const whereClause =
    conditions.length > 0 ? sql`WHERE ${sql.join(conditions, sql` AND `)}` : sql``;

  let orderClause;
  switch (sort) {
    case "recently-added":
      orderClause = desc(recipes.createdAt);
      break;
    case "total-time":
      orderClause = sql`${recipes.totalMinutes} ASC NULLS LAST`;
      break;
    case "alpha":
    default:
      orderClause = asc(recipes.title);
  }

  const results = await db
    .select({
      id: recipes.id,
      slug: recipes.slug,
      title: recipes.title,
      course: recipes.course,
      cuisine: recipes.cuisine,
      totalMinutes: recipes.totalMinutes,
      isComponent: recipes.isComponent,
      thumbnailPhotoId: recipes.thumbnailPhotoId,
      createdAt: recipes.createdAt,
    })
    .from(recipes)
    .where(
      conditions.length > 0
        ? sql`${sql.join(conditions, sql` AND `)}`
        : undefined
    )
    .orderBy(orderClause);

  const enriched = await Promise.all(
    results.map(async (r) => {
      let thumbUrl: string | null = null;
      if (r.thumbnailPhotoId) {
        const [photo] = await db
          .select({ thumbKey: photos.thumbKey })
          .from(photos)
          .where(eq(photos.id, r.thumbnailPhotoId));
        thumbUrl = photo?.thumbKey ?? null;
      }

      const cookData = await db
        .select({
          count: count(),
          lastCooked: sql<string>`MAX(${cooks.cookedAt})`,
        })
        .from(cooks)
        .where(eq(cooks.recipeId, r.id));

      return {
        ...r,
        thumbUrl,
        cookCount: Number(cookData[0]?.count ?? 0),
        lastCooked: cookData[0]?.lastCooked ?? null,
        createdAt: r.createdAt.toISOString(),
      };
    })
  );

  if (sort === "recently-cooked") {
    enriched.sort((a, b) => {
      if (!a.lastCooked && !b.lastCooked) return 0;
      if (!a.lastCooked) return 1;
      if (!b.lastCooked) return -1;
      return b.lastCooked.localeCompare(a.lastCooked);
    });
  } else if (sort === "times-cooked") {
    enriched.sort((a, b) => b.cookCount - a.cookCount);
  }

  return enriched;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sort = (params.sort as SortOption) ?? "alpha";
  const search = (params.q as string) ?? "";
  const showComponents = params.components === "true";

  const filters: Record<string, string[]> = {};
  for (const key of ["course", "cuisine", "protein", "method", "season"]) {
    const val = params[key];
    if (val) {
      filters[key] = Array.isArray(val) ? val : [val];
    }
  }

  const allRecipes = await getRecipes(sort, search, filters, showComponents);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <RecipeGrid
        recipes={allRecipes}
        currentSort={sort}
        currentSearch={search}
        currentFilters={filters}
        showComponents={showComponents}
      />
    </div>
  );
}
