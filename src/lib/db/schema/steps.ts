import { pgTable, uuid, text, integer, boolean } from "drizzle-orm/pg-core";
import { recipes } from "./recipes";

export const steps = pgTable("steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  text: text("text").notNull(),
  durationSeconds: integer("duration_seconds"),
  isPassive: boolean("is_passive").notNull().default(false),
  videoId: uuid("video_id"),
  videoSeconds: integer("video_seconds"),
});
