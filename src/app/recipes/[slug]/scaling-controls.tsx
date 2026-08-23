"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const PRESETS = [0.25, 0.5, 1, 2, 3];

export function ScalingControls({
  baseServings,
  servingNoun,
  ingredients,
}: {
  baseServings: number;
  servingNoun: string;
  ingredients: Ingredient[];
}) {
  const [factor, setFactor] = useState(1);
  const [targetInput, setTargetInput] = useState(baseServings.toString());

  function handlePreset(f: number) {
    setFactor(f);
    setTargetInput(Math.round(baseServings * f).toString());
  }

  function handleTargetChange(val: string) {
    setTargetInput(val);
    const n = parseInt(val);
    if (n > 0) {
      setFactor(n / baseServings);
    }
  }

  const groups = new Map<string, Ingredient[]>();
  for (const ing of ingredients) {
    const key = ing.groupLabel || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(ing);
  }

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-2xl font-semibold">Ingredients</h2>

      {/* Scaling controls */}
      <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-background/95 p-3 backdrop-blur-sm border">
        {PRESETS.map((p) => (
          <Button
            key={p}
            variant={factor === p ? "default" : "outline"}
            size="sm"
            onClick={() => handlePreset(p)}
          >
            {p}×
          </Button>
        ))}
        <div className="flex items-center gap-1 ml-2">
          <Input
            type="number"
            min={1}
            value={targetInput}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="h-9 w-20"
          />
          <span className="text-sm text-muted-foreground">{servingNoun}</span>
        </div>
      </div>

      {/* Ingredient list */}
      {Array.from(groups).map(([groupLabel, items]) => (
        <div key={groupLabel} className="mb-4">
          {groupLabel && (
            <h3 className="mb-2 text-lg font-medium text-muted-foreground">
              {groupLabel}
            </h3>
          )}
          <ul className="space-y-2">
            {items.map((ing) => {
              const scaled = scaleQuantity(ing.quantity, factor, ing.scalable);
              const qtyDisplay = formatQuantity(scaled);
              return (
                <li key={ing.id} className="flex items-baseline gap-2 text-lg">
                  <span className="min-w-[3rem] text-right font-medium">
                    {qtyDisplay}
                  </span>
                  <span className="text-muted-foreground">{ing.unit}</span>
                  <span>{ing.item}</span>
                  {ing.prepNote && (
                    <span className="text-muted-foreground">, {ing.prepNote}</span>
                  )}
                  {!ing.scalable && ing.quantity !== null && (
                    <span className="text-xs text-muted-foreground italic ml-1">
                      (not scaled)
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
