import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("source_type", [
  "original",
  "handwritten",
  "url",
]);

export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  baseServings: integer("base_servings").notNull().default(4),
  servingNoun: text("serving_noun").notNull().default("servings"),
  sourceType: sourceTypeEnum("source_type").notNull().default("original"),
  sourceUrl: text("source_url"),
  sourceTitle: text("source_title"),
  isComponent: boolean("is_component").notNull().default(false),
  makeAhead: boolean("make_ahead").notNull().default(false),
  makeAheadDays: integer("make_ahead_days"),
  course: text("course"),
  cuisine: text("cuisine"),
  protein: text("protein"),
  method: text("method"),
  season: text("season"),
  activeMinutes: integer("active_minutes"),
  totalMinutes: integer("total_minutes"),
  thumbnailPhotoId: uuid("thumbnail_photo_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
