"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { COURSES, CUISINES, PROTEINS, METHODS, SEASONS } from "@/lib/taxonomy";

type Recipe = {
  id: string;
  slug: string;
  title: string;
  course: string | null;
  cuisine: string | null;
  totalMinutes: number | null;
  isComponent: boolean;
  thumbUrl: string | null;
  cookCount: number;
  lastCooked: string | null;
  createdAt: string;
};

const SORT_OPTIONS = [
  { value: "alpha", label: "A–Z" },
  { value: "recently-cooked", label: "Recently cooked" },
  { value: "recently-added", label: "Recently added" },
  { value: "times-cooked", label: "Most cooked" },
  { value: "total-time", label: "Total time" },
];

const FILTER_GROUPS = [
  { key: "course", label: "Course", options: COURSES },
  { key: "cuisine", label: "Cuisine", options: CUISINES },
  { key: "protein", label: "Protein", options: PROTEINS },
  { key: "method", label: "Method", options: METHODS },
  { key: "season", label: "Season", options: SEASONS },
] as const;

export function RecipeGrid({
  recipes,
  currentSort,
  currentSearch,
  currentFilters,
  showComponents,
}: {
  recipes: Recipe[];
  currentSort: string;
  currentSearch: string;
  currentFilters: Record<string, string[]>;
  showComponents: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(val)) {
          params.delete(key);
          val.forEach((v) => params.append(key, v));
        } else {
          params.set(key, val as string);
        }
      }
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleSearchChange(val: string) {
    setSearch(val);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateParams({ q: val || undefined });
    }, 300);
  }

  function toggleFilter(key: string, value: string) {
    const current = currentFilters[key] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateParams({ [key]: next.length > 0 ? next : undefined });
  }

  const courseColors: Record<string, string> = {
    appetizer: "bg-amber-100 text-amber-800",
    soup: "bg-orange-100 text-orange-800",
    salad: "bg-green-100 text-green-800",
    main: "bg-red-100 text-red-800",
    side: "bg-blue-100 text-blue-800",
    sauce: "bg-purple-100 text-purple-800",
    bread: "bg-yellow-100 text-yellow-800",
    dessert: "bg-pink-100 text-pink-800",
    breakfast: "bg-sky-100 text-sky-800",
    drink: "bg-teal-100 text-teal-800",
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cookbook</h1>
        <Link href="/recipes/new">
          <Button>+ New Recipe</Button>
        </Link>
      </div>

      {/* Search + Sort + Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-12 text-lg sm:flex-1"
        />
        <Select
          value={currentSort}
          onValueChange={(v) => updateParams({ sort: v })}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 cursor-pointer">
            Filters
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-6">
              {FILTER_GROUPS.map(({ key, label, options }) => (
                <div key={key}>
                  <h3 className="mb-2 font-medium">{label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => {
                      const active = (currentFilters[key] || []).includes(opt);
                      return (
                        <Badge
                          key={opt}
                          variant={active ? "default" : "outline"}
                          className="cursor-pointer capitalize"
                          onClick={() => toggleFilter(key, opt)}
                        >
                          {opt}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-components"
                  checked={showComponents}
                  onCheckedChange={(v) =>
                    updateParams({ components: v ? "true" : undefined })
                  }
                />
                <Label htmlFor="show-components">Show component recipes</Label>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Recipe Grid */}
      {recipes.length === 0 ? (
        <div className="py-20 text-center">
          {currentSearch || Object.keys(currentFilters).length > 0 ? (
            <>
              <p className="text-lg text-muted-foreground">No results found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/")}
              >
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <p className="text-lg text-muted-foreground">
                No recipes yet — create your first one
              </p>
              <Link href="/recipes/new">
                <Button className="mt-4">+ New Recipe</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.slug}`}>
              <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                {recipe.thumbUrl ? (
                  <img
                    src={recipe.thumbUrl}
                    alt={recipe.title}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div
                    className={`flex aspect-[4/3] items-center justify-center ${
                      courseColors[recipe.course ?? ""] ?? "bg-muted"
                    }`}
                  >
                    <span className="text-2xl font-bold opacity-70">
                      {recipe.title}
                    </span>
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold">{recipe.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {recipe.course && (
                      <Badge variant="secondary" className="capitalize text-xs">
                        {recipe.course}
                      </Badge>
                    )}
                    {recipe.cuisine && (
                      <Badge variant="outline" className="capitalize text-xs">
                        {recipe.cuisine}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex gap-3 text-sm text-muted-foreground">
                    {recipe.totalMinutes && <span>{recipe.totalMinutes} min</span>}
                    {recipe.cookCount > 0 && (
                      <span>Cooked {recipe.cookCount}×</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
