import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { recipes } from "../schema/recipes";
import { recipeComponents } from "../schema/recipe-components";
import { eq, or } from "drizzle-orm";

const POSTGRES_URL = process.env.POSTGRES_URL;

const describeDb = POSTGRES_URL
  ? describe
  : describe.skip;

const TEST_PREFIX = "cycle-test-";

function testSlug(name: string) {
  return `${TEST_PREFIX}${name}-${Date.now()}`;
}

describeDb("cycle detection trigger", () => {
  const db = drizzle(sql, { schema: { recipes, recipeComponents } });
  let slugs: string[] = [];

  async function createRecipe(name: string) {
    const slug = testSlug(name);
    slugs.push(slug);
    const [row] = await db
      .insert(recipes)
      .values({
        slug,
        title: `Test ${name}`,
        baseServings: 4,
        servingNoun: "servings",
      })
      .returning({ id: recipes.id });
    return row.id;
  }

  beforeEach(() => {
    slugs = [];
  });

  afterEach(async () => {
    if (slugs.length === 0) return;
    await db
      .delete(recipes)
      .where(
        or(...slugs.map((s) => eq(recipes.slug, s)))
      );
  });

  it("allows a simple parent-child relationship", async () => {
    const a = await createRecipe("a");
    const b = await createRecipe("b");
    await db.insert(recipeComponents).values({
      parentRecipeId: a,
      childRecipeId: b,
      position: 0,
    });
  });

  it("rejects a cycle (A->B then B->A)", async () => {
    const a = await createRecipe("a");
    const b = await createRecipe("b");
    await db.insert(recipeComponents).values({
      parentRecipeId: a,
      childRecipeId: b,
      position: 0,
    });
    await expect(
      db.insert(recipeComponents).values({
        parentRecipeId: b,
        childRecipeId: a,
        position: 0,
      })
    ).rejects.toThrow(/cycle/i);
  });

  it("rejects nesting deeper than 3 levels", async () => {
    const a = await createRecipe("a");
    const b = await createRecipe("b");
    const c = await createRecipe("c");
    const d = await createRecipe("d");
    const e = await createRecipe("e");

    await db.insert(recipeComponents).values({
      parentRecipeId: a,
      childRecipeId: b,
      position: 0,
    });
    await db.insert(recipeComponents).values({
      parentRecipeId: b,
      childRecipeId: c,
      position: 0,
    });
    await db.insert(recipeComponents).values({
      parentRecipeId: c,
      childRecipeId: d,
      position: 0,
    });
    await expect(
      db.insert(recipeComponents).values({
        parentRecipeId: d,
        childRecipeId: e,
        position: 0,
      })
    ).rejects.toThrow(/depth/i);
  });

  it("rejects self-reference (A->A)", async () => {
    const a = await createRecipe("a");
    await expect(
      db.insert(recipeComponents).values({
        parentRecipeId: a,
        childRecipeId: a,
        position: 0,
      })
    ).rejects.toThrow(/itself/i);
  });
});
