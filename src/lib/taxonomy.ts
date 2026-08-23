export const COURSES = [
  "appetizer",
  "soup",
  "salad",
  "main",
  "side",
  "sauce",
  "bread",
  "dessert",
  "breakfast",
  "drink",
] as const;

export const CUISINES = [
  "american",
  "chinese",
  "french",
  "greek",
  "indian",
  "italian",
  "japanese",
  "korean",
  "lebanese",
  "mexican",
  "moroccan",
  "spanish",
  "thai",
  "turkish",
  "vietnamese",
  "british",
  "ethiopian",
  "caribbean",
  "german",
  "peruvian",
] as const;

export const PROTEINS = [
  "beef",
  "pork",
  "chicken",
  "turkey",
  "seafood",
  "egg",
  "bean",
  "vegetarian",
  "vegan",
] as const;

export const METHODS = [
  "grill",
  "smoke",
  "roast",
  "braise",
  "fry",
  "saute",
  "bake",
  "no-cook",
  "slow cooker",
  "pressure cooker",
] as const;

export const SEASONS = [
  "spring",
  "summer",
  "fall",
  "winter",
  "year-round",
] as const;

export type Course = (typeof COURSES)[number];
export type Cuisine = (typeof CUISINES)[number];
export type Protein = (typeof PROTEINS)[number];
export type Method = (typeof METHODS)[number];
export type Season = (typeof SEASONS)[number];

export const CANONICAL_UNITS = [
  "g",
  "kg",
  "oz",
  "lb",
  "tsp",
  "tbsp",
  "cup",
  "ml",
  "l",
  "each",
  "pinch",
] as const;

export type CanonicalUnit = (typeof CANONICAL_UNITS)[number];

const UNIT_ALIASES: Record<string, CanonicalUnit> = {
  gram: "g",
  grams: "g",
  kilogram: "kg",
  kilograms: "kg",
  ounce: "oz",
  ounces: "oz",
  pound: "lb",
  pounds: "lb",
  lbs: "lb",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  cups: "cup",
  milliliter: "ml",
  milliliters: "ml",
  millilitre: "ml",
  millilitres: "ml",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
};

export function normalizeUnit(unit: string | null | undefined): CanonicalUnit | null {
  if (!unit) return null;
  const lower = unit.toLowerCase().trim();
  if ((CANONICAL_UNITS as readonly string[]).includes(lower)) {
    return lower as CanonicalUnit;
  }
  return UNIT_ALIASES[lower] ?? null;
}
