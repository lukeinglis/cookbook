import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { recipes } from "./recipes";
import { cooks } from "./cooks";

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  cookId: uuid("cook_id").references(() => cooks.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  promoted: boolean("promoted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
