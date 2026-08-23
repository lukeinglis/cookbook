"use client";

import { useState } from "react";
import Link from "next/link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { scaleQuantity, formatQuantity } from "@/lib/scaling";

type Ingredient = {
  id: string;
  rawText: string;
  quantity: number | null;
  unit: string | null;
  item: string | null;
  prepNote: string | null;
  scalable: boolean;
  groupLabel: string | null;
};

type Step = {
  id: string;
  text: string;
  durationSeconds: number | null;
  isPassive: boolean;
};

export function ComponentSection({
  title,
  slug,
  scale,
  note,
  ingredients,
  steps,
  baseServings,
}: {
  title: string;
  slug: string;
  scale: number;
  note: string | null;
  ingredients: Ingredient[];
  steps: Step[];
  baseServings: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border p-4 text-left hover:bg-accent">
        <div>
          <span className="text-lg font-medium">{title}</span>
          {note && (
            <span className="ml-2 text-sm text-muted-foreground">— {note}</span>
          )}
          {scale !== 1 && (
            <span className="ml-2 text-sm text-muted-foreground">({scale}×)</span>
          )}
        </div>
        <span className="text-muted-foreground">{open ? "▼" : "▶"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pt-4">
        <p className="mb-2 text-sm">
          <Link href={`/recipes/${slug}`} className="text-blue-600 underline">
            View full recipe
          </Link>
        </p>

        {ingredients.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 font-medium">Ingredients</h4>
            <ul className="space-y-1">
              {ingredients.map((ing) => {
                const scaled = scaleQuantity(ing.quantity, scale, ing.scalable);
                return (
                  <li key={ing.id} className="flex items-baseline gap-2">
                    <span className="min-w-[3rem] text-right font-medium">
                      {formatQuantity(scaled)}
                    </span>
                    <span className="text-muted-foreground">{ing.unit}</span>
                    <span>{ing.item}</span>
                    {ing.prepNote && (
                      <span className="text-muted-foreground">, {ing.prepNote}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {steps.length > 0 && (
          <div>
            <h4 className="mb-2 font-medium">Steps</h4>
            <ol className="space-y-2">
              {steps.map((step, idx) => (
                <li key={step.id} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p>{step.text}</p>
                    {step.durationSeconds && (
                      <span className="text-sm text-muted-foreground">
                        {step.isPassive ? "⏳" : "⏱"}{" "}
                        {Math.round(step.durationSeconds / 60)} min
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
