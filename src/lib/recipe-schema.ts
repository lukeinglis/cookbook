import { z } from "zod";

const ingredientSchema = z.object({
  quantity: z.string().default(""),
  unit: z.string().default(""),
  item: z.string().default(""),
  prepNote: z.string().default(""),
  scalable: z.boolean().default(true),
  groupLabel: z.string().default(""),
});

const stepSchema = z.object({
  text: z.string().min(1, "Step text is required"),
  durationMinutes: z.string().default(""),
  isPassive: z.boolean().default(false),
});

const videoSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  label: z.string().default(""),
  title: z.string().default(""),
  channel: z.string().default(""),
  providerVideoId: z.string().default(""),
});

export const recipeFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  baseServings: z.coerce.number().int().min(1).default(4),
  servingNoun: z.string().default("servings"),
  sourceType: z.enum(["original", "handwritten", "url"]).default("original"),
  sourceUrl: z.string().default(""),
  sourceTitle: z.string().default(""),
  isComponent: z.boolean().default(false),
  makeAhead: z.boolean().default(false),
  makeAheadDays: z.coerce.number().int().optional(),
  course: z.string().default(""),
  cuisine: z.string().default(""),
  protein: z.string().default(""),
  method: z.string().default(""),
  season: z.string().default(""),
  activeMinutes: z.coerce.number().int().optional(),
  totalMinutes: z.coerce.number().int().optional(),
  ingredients: z.array(ingredientSchema).default([]),
  steps: z.array(stepSchema).default([]),
  videos: z.array(videoSchema).default([]),
  tags: z.array(z.string()).default([]),
});

export type RecipeFormData = z.infer<typeof recipeFormSchema>;
