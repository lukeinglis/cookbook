"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { recipeFormSchema, type RecipeFormData } from "@/lib/recipe-schema";
import { COURSES, CUISINES, PROTEINS, METHODS, SEASONS, CANONICAL_UNITS } from "@/lib/taxonomy";
import { saveRecipe } from "./actions";

export default function NewRecipePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");

  const form = useForm<RecipeFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recipeFormSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      baseServings: 4,
      servingNoun: "servings",
      sourceType: "original",
      sourceUrl: "",
      sourceTitle: "",
      isComponent: false,
      makeAhead: false,
      course: "",
      cuisine: "",
      protein: "",
      method: "",
      season: "",
      ingredients: [{ quantity: "", unit: "", item: "", prepNote: "", scalable: true, groupLabel: "" }],
      steps: [{ text: "", durationMinutes: "", isPassive: false }],
      videos: [],
      tags: [],
    },
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = form;

  const ingredientFields = useFieldArray({ control, name: "ingredients" });
  const stepFields = useFieldArray({ control, name: "steps" });
  const videoFields = useFieldArray({ control, name: "videos" });
  const watchTags = watch("tags");
  const watchSourceType = watch("sourceType");
  const watchMakeAhead = watch("makeAhead");

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !watchTags.includes(tag)) {
      setValue("tags", [...watchTags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setValue("tags", watchTags.filter((t) => t !== tag));
  }

  async function onSubmit(data: RecipeFormData) {
    setSaving(true);
    setError("");
    try {
      const result = await saveRecipe(data);
      if (result.error) {
        setError(result.error);
        setSaving(false);
      } else if (result.slug) {
        router.push(`/recipes/${result.slug}`);
      }
    } catch {
      setError("Failed to save recipe");
      setSaving(false);
    }
  }

  async function fetchVideoMetadata(index: number) {
    const url = form.getValues(`videos.${index}.url`);
    if (!url) return;
    try {
      const res = await fetch(`/api/youtube-metadata?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        setValue(`videos.${index}.title`, data.title ?? "");
        setValue(`videos.${index}.channel`, data.author_name ?? "");
        setValue(`videos.${index}.providerVideoId`, data.videoId ?? "");
      }
    } catch {
      // silent
    }
  }

  function moveIngredient(from: number, to: number) {
    if (to >= 0 && to < ingredientFields.fields.length) {
      ingredientFields.move(from, to);
    }
  }

  function moveStep(from: number, to: number) {
    if (to >= 0 && to < stepFields.fields.length) {
      stepFields.move(from, to);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">New Recipe</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Title & Description */}
        <Card>
          <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register("title")} className="h-12 text-lg" />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="baseServings">Servings</Label>
                <Input id="baseServings" type="number" min={1} {...register("baseServings")} />
              </div>
              <div>
                <Label htmlFor="servingNoun">Serving noun</Label>
                <Input id="servingNoun" {...register("servingNoun")} placeholder="servings" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isComponent"
                  checked={watch("isComponent")}
                  onCheckedChange={(v) => setValue("isComponent", v === true)}
                />
                <Label htmlFor="isComponent">Component recipe</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="makeAhead"
                  checked={watchMakeAhead}
                  onCheckedChange={(v) => setValue("makeAhead", v === true)}
                />
                <Label htmlFor="makeAhead">Make ahead</Label>
              </div>
              {watchMakeAhead && (
                <div>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Days ahead"
                    {...register("makeAheadDays")}
                    className="w-24"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Source */}
        <Card>
          <CardHeader><CardTitle>Source</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Source type</Label>
              <Select
                value={watchSourceType}
                onValueChange={(v) => setValue("sourceType", v as "original" | "handwritten" | "url")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="handwritten">Handwritten</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {watchSourceType === "url" && (
              <>
                <div>
                  <Label htmlFor="sourceUrl">Source URL</Label>
                  <Input id="sourceUrl" {...register("sourceUrl")} placeholder="https://..." />
                </div>
                <div>
                  <Label htmlFor="sourceTitle">Source title</Label>
                  <Input id="sourceTitle" {...register("sourceTitle")} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Taxonomy */}
        <Card>
          <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "course" as const, options: COURSES },
                { name: "cuisine" as const, options: CUISINES },
                { name: "protein" as const, options: PROTEINS },
                { name: "method" as const, options: METHODS },
                { name: "season" as const, options: SEASONS },
              ].map(({ name, options }) => (
                <div key={name}>
                  <Label className="capitalize">{name}</Label>
                  <Select
                    value={watch(name) || ""}
                    onValueChange={(v) => setValue(name, v ?? "")}
                  >
                    <SelectTrigger><SelectValue placeholder={`Select ${name}`} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {options.map((o) => (
                        <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="activeMinutes">Active time (min)</Label>
                <Input id="activeMinutes" type="number" min={0} {...register("activeMinutes")} />
              </div>
              <div>
                <Label htmlFor="totalMinutes">Total time (min)</Label>
                <Input id="totalMinutes" type="number" min={0} {...register("totalMinutes")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag"
              />
              <Button type="button" variant="outline" onClick={addTag}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {watchTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card>
          <CardHeader><CardTitle>Ingredients</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {ingredientFields.fields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => moveIngredient(index, index - 1)} disabled={index === 0}>↑</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => moveIngredient(index, index + 1)} disabled={index === ingredientFields.fields.length - 1}>↓</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => ingredientFields.remove(index)} className="text-red-600">×</Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Input placeholder="Qty" {...register(`ingredients.${index}.quantity`)} />
                  </div>
                  <div>
                    <Select
                      value={watch(`ingredients.${index}.unit`) || ""}
                      onValueChange={(v) => setValue(`ingredients.${index}.unit`, v ?? "")}
                    >
                      <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {CANONICAL_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input placeholder="Item" {...register(`ingredients.${index}.item`)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Prep note" {...register(`ingredients.${index}.prepNote`)} />
                  <Input placeholder="Group label" {...register(`ingredients.${index}.groupLabel`)} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`scalable-${index}`}
                    checked={watch(`ingredients.${index}.scalable`)}
                    onCheckedChange={(v) => setValue(`ingredients.${index}.scalable`, v === true)}
                  />
                  <Label htmlFor={`scalable-${index}`} className="text-sm">Scalable</Label>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => ingredientFields.append({ quantity: "", unit: "", item: "", prepNote: "", scalable: true, groupLabel: "" })}
            >
              + Add ingredient
            </Button>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader><CardTitle>Steps</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {stepFields.fields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Step {index + 1}</span>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => moveStep(index, index - 1)} disabled={index === 0}>↑</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => moveStep(index, index + 1)} disabled={index === stepFields.fields.length - 1}>↓</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => stepFields.remove(index)} className="text-red-600">×</Button>
                  </div>
                </div>
                <Textarea placeholder="Step instructions" {...register(`steps.${index}.text`)} />
                {errors.steps?.[index]?.text && (
                  <p className="text-sm text-red-600">{errors.steps[index].text?.message}</p>
                )}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Duration (min)"
                      className="w-32"
                      {...register(`steps.${index}.durationMinutes`)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`passive-${index}`}
                      checked={watch(`steps.${index}.isPassive`)}
                      onCheckedChange={(v) => setValue(`steps.${index}.isPassive`, v === true)}
                    />
                    <Label htmlFor={`passive-${index}`} className="text-sm">Passive step</Label>
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => stepFields.append({ text: "", durationMinutes: "", isPassive: false })}
            >
              + Add step
            </Button>
          </CardContent>
        </Card>

        {/* Videos */}
        <Card>
          <CardHeader><CardTitle>Videos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {videoFields.fields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Video {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => videoFields.remove(index)} className="text-red-600">×</Button>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="YouTube URL" {...register(`videos.${index}.url`)} className="flex-1" />
                  <Button type="button" variant="outline" onClick={() => fetchVideoMetadata(index)}>
                    Fetch
                  </Button>
                </div>
                <Input placeholder="Label" {...register(`videos.${index}.label`)} />
                {watch(`videos.${index}.title`) && (
                  <p className="text-sm text-muted-foreground">
                    {watch(`videos.${index}.title`)} — {watch(`videos.${index}.channel`)}
                  </p>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => videoFields.append({ url: "", label: "", title: "", channel: "", providerVideoId: "" })}
            >
              + Add video
            </Button>
          </CardContent>
        </Card>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="sticky bottom-4">
          <Button type="submit" className="h-14 w-full text-lg" disabled={saving}>
            {saving ? "Saving…" : "Save Recipe"}
          </Button>
        </div>
      </form>
    </div>
  );
}
