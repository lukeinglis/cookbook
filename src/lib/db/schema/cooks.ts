import { pgTable, uuid, date, numeric, integer } from "drizzle-orm/pg-core";
import { recipes } from "./recipes";

export const cooks = pgTable("cooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  cookedAt: date("cooked_at").notNull(),
  scaleUsed: numeric("scale_used").notNull().default("1.0"),
  rating: integer("rating"),
});
