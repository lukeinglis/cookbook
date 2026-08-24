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
import { updateRecipe } from "./actions";

type RecipeData = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  baseServings: number;
  servingNoun: string;
  sourceType: "original" | "handwritten" | "url";
  sourceUrl: string | null;
  sourceTitle: string | null;
  isComponent: boolean;
  makeAhead: boolean;
  makeAheadDays: number | null;
  course: string | null;
  cuisine: string | null;
  protein: string | null;
  method: string | null;
  season: string | null;
  activeMinutes: number | null;
  totalMinutes: number | null;
  ingredients: {
    quantity: string | null;
    unit: string | null;
    item: string | null;
    prepNote: string | null;
    scalable: boolean;
    groupLabel: string | null;
  }[];
  steps: {
    text: string;
    durationSeconds: number | null;
    isPassive: boolean;
  }[];
  videos: {
    url: string;
    label: string | null;
    title: string;
    channel: string;
    providerVideoId: string;
  }[];
  tags: string[];
};

export function EditRecipeForm({ recipe }: { recipe: RecipeData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");

  const form = useForm<RecipeFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recipeFormSchema) as any,
    defaultValues: {
      title: recipe.title,
      description: recipe.description ?? "",
      baseServings: recipe.baseServings,
      servingNoun: recipe.servingNoun,
      sourceType: recipe.sourceType,
      sourceUrl: recipe.sourceUrl ?? "",
      sourceTitle: recipe.sourceTitle ?? "",
      isComponent: recipe.isComponent,
      makeAhead: recipe.makeAhead,
      makeAheadDays: recipe.makeAheadDays ?? undefined,
      course: (recipe.course ?? "") as string,
      cuisine: (recipe.cuisine ?? "") as string,
      protein: (recipe.protein ?? "") as string,
      method: (recipe.method ?? "") as string,
      season: (recipe.season ?? "") as string,
      activeMinutes: recipe.activeMinutes ?? undefined,
      totalMinutes: recipe.totalMinutes ?? undefined,
      ingredients: recipe.ingredients.map((i) => ({
        quantity: i.quantity ?? "",
        unit: i.unit ?? "",
        item: i.item ?? "",
        prepNote: i.prepNote ?? "",
        scalable: i.scalable,
        groupLabel: i.groupLabel ?? "",
      })),
      steps: recipe.steps.map((s) => ({
        text: s.text,
        durationMinutes: s.durationSeconds ? (s.durationSeconds / 60).toString() : "",
        isPassive: s.isPassive,
      })),
      videos: recipe.videos.map((v) => ({
        url: v.url,
        label: v.label ?? "",
        title: v.title,
        channel: v.channel,
        providerVideoId: v.providerVideoId,
      })),
      tags: recipe.tags,
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
      const result = await updateRecipe(recipe.id, recipe.slug, data);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
              <Input id="servingNoun" {...register("servingNoun")} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="isComponent" checked={watch("isComponent")} onCheckedChange={(v) => setValue("isComponent", v === true)} />
              <Label htmlFor="isComponent">Component recipe</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="makeAhead" checked={watchMakeAhead} onCheckedChange={(v) => setValue("makeAhead", v === true)} />
              <Label htmlFor="makeAhead">Make ahead</Label>
            </div>
            {watchMakeAhead && (
              <Input type="number" min={1} placeholder="Days" {...register("makeAheadDays")} className="w-24" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Source</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select value={watchSourceType} onValueChange={(v) => setValue("sourceType", v as "original" | "handwritten" | "url")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="handwritten">Handwritten</SelectItem>
              <SelectItem value="url">URL</SelectItem>
            </SelectContent>
          </Select>
          {watchSourceType === "url" && (
            <>
              <Input placeholder="Source URL" {...register("sourceUrl")} />
              <Input placeholder="Source title" {...register("sourceTitle")} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Classification</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {([
              { name: "course" as const, options: COURSES },
              { name: "cuisine" as const, options: CUISINES },
              { name: "protein" as const, options: PROTEINS },
              { name: "method" as const, options: METHODS },
              { name: "season" as const, options: SEASONS },
            ]).map(({ name, options }) => (
              <div key={name}>
                <Label className="capitalize">{name}</Label>
                <Select value={watch(name) || ""} onValueChange={(v) => setValue(name, v ?? "")}>
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
              <Label>Active time (min)</Label>
              <Input type="number" min={0} {...register("activeMinutes")} />
            </div>
            <div>
              <Label>Total time (min)</Label>
              <Input type="number" min={0} {...register("totalMinutes")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add a tag" />
            <Button type="button" variant="outline" onClick={addTag}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {watchTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>{tag} ×</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ingredients</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {ingredientFields.fields.map((field, index) => (
            <div key={field.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => ingredientFields.move(index, index - 1)} disabled={index === 0}>↑</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => ingredientFields.move(index, index + 1)} disabled={index === ingredientFields.fields.length - 1}>↓</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => ingredientFields.remove(index)} className="text-red-600">×</Button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Input placeholder="Qty" {...register(`ingredients.${index}.quantity`)} />
                <Select value={watch(`ingredients.${index}.unit`) || ""} onValueChange={(v) => setValue(`ingredients.${index}.unit`, v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {CANONICAL_UNITS.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
                <div className="col-span-2">
                  <Input placeholder="Item" {...register(`ingredients.${index}.item`)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Prep note" {...register(`ingredients.${index}.prepNote`)} />
                <Input placeholder="Group label" {...register(`ingredients.${index}.groupLabel`)} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id={`scalable-${index}`} checked={watch(`ingredients.${index}.scalable`)} onCheckedChange={(v) => setValue(`ingredients.${index}.scalable`, v === true)} />
                <Label htmlFor={`scalable-${index}`} className="text-sm">Scalable</Label>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={() => ingredientFields.append({ quantity: "", unit: "", item: "", prepNote: "", scalable: true, groupLabel: "" })}>
            + Add ingredient
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Steps</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {stepFields.fields.map((field, index) => (
            <div key={field.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Step {index + 1}</span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => stepFields.move(index, index - 1)} disabled={index === 0}>↑</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => stepFields.move(index, index + 1)} disabled={index === stepFields.fields.length - 1}>↓</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => stepFields.remove(index)} className="text-red-600">×</Button>
                </div>
              </div>
              <Textarea placeholder="Step instructions" {...register(`steps.${index}.text`)} />
              <div className="flex items-center gap-4">
                <Input type="number" min={0} placeholder="Duration (min)" className="w-32" {...register(`steps.${index}.durationMinutes`)} />
                <div className="flex items-center gap-2">
                  <Checkbox id={`passive-${index}`} checked={watch(`steps.${index}.isPassive`)} onCheckedChange={(v) => setValue(`steps.${index}.isPassive`, v === true)} />
                  <Label htmlFor={`passive-${index}`} className="text-sm">Passive</Label>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={() => stepFields.append({ text: "", durationMinutes: "", isPassive: false })}>
            + Add step
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Videos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {videoFields.fields.map((field, index) => (
            <div key={field.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Video {index + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => videoFields.remove(index)} className="text-red-600">×</Button>
              </div>
              <Input placeholder="YouTube URL" {...register(`videos.${index}.url`)} />
              <Input placeholder="Label" {...register(`videos.${index}.label`)} />
              {watch(`videos.${index}.title`) && <p className="text-sm text-muted-foreground">{watch(`videos.${index}.title`)} — {watch(`videos.${index}.channel`)}</p>}
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full" onClick={() => videoFields.append({ url: "", label: "", title: "", channel: "", providerVideoId: "" })}>
            + Add video
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="sticky bottom-4">
        <Button type="submit" className="h-14 w-full text-lg" disabled={saving}>
          {saving ? "Saving…" : "Update Recipe"}
        </Button>
      </div>
    </form>
  );
}
