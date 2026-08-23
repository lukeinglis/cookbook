import { pgTable, uuid, numeric, integer, text, primaryKey } from "drizzle-orm/pg-core";
import { recipes } from "./recipes";

export const recipeComponents = pgTable(
  "recipe_components",
  {
    parentRecipeId: uuid("parent_recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    childRecipeId: uuid("child_recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    scale: numeric("scale").notNull().default("1.0"),
    position: integer("position").notNull(),
    note: text("note"),
  },
  (table) => [
    primaryKey({ columns: [table.parentRecipeId, table.childRecipeId] }),
  ]
);
