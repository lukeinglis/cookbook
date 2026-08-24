import { pgTable, uuid, text, integer } from "drizzle-orm/pg-core";
import { recipes } from "./recipes";

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  url: text("url").notNull(),
  provider: text("provider").notNull().default("youtube"),
  providerVideoId: text("provider_video_id").notNull(),
  title: text("title").notNull(),
  channel: text("channel").notNull(),
  label: text("label"),
});
