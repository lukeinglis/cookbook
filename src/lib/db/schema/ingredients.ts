import { pgTable, uuid, text, integer, boolean, numeric, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { recipes } from "./recipes";

export const ingredients = pgTable(
  "ingredients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    rawText: text("raw_text").notNull(),
    quantity: numeric("quantity"),
    unit: text("unit"),
    item: text("item"),
    prepNote: text("prep_note"),
    scalable: boolean("scalable").notNull().default(true),
    groupLabel: text("group_label"),
  },
  (table) => [
    check(
      "unit_check",
      sql`${table.unit} IS NULL OR ${table.unit} IN ('g', 'kg', 'oz', 'lb', 'tsp', 'tbsp', 'cup', 'ml', 'l', 'each', 'pinch')`
    ),
  ]
);
