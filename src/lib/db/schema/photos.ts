import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { recipes } from "./recipes";
import { cooks } from "./cooks";

export const photoKindEnum = pgEnum("photo_kind", ["source_card", "dish"]);

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  cookId: uuid("cook_id").references(() => cooks.id, { onDelete: "set null" }),
  kind: photoKindEnum("kind").notNull(),
  blobKey: text("blob_key").notNull(),
  thumbKey: text("thumb_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
