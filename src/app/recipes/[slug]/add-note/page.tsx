"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addNote } from "../actions";

export default function AddNotePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError("");

    // We need the recipeId — fetch it via a lightweight call
    const recipeRes = await fetch(`/api/recipe-id?slug=${slug}`);
    if (!recipeRes.ok) {
      setError("Recipe not found");
      setSaving(false);
      return;
    }
    const { id: recipeId } = await recipeRes.json();

    formData.set("recipeId", recipeId);
    formData.set("recipeSlug", slug);
    if (rating) formData.set("rating", rating.toString());

    const result = await addNote(formData);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    } else {
      router.push(`/recipes/${slug}`);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Note</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="body">Note</Label>
              <Textarea
                id="body"
                name="body"
                required
                className="min-h-[120px] text-lg"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="cookDate">Cook date</Label>
              <Input
                id="cookDate"
                name="cookDate"
                type="date"
                defaultValue={today}
              />
            </div>
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    variant={rating === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRating(rating === n ? null : n)}
                  >
                    {"★".repeat(n)}
                  </Button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="h-12 w-full text-lg" disabled={saving}>
              {saving ? "Saving…" : "Save Note"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
