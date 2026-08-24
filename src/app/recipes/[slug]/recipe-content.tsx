"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ScalingControls } from "./scaling-controls";
import { ComponentSection } from "./component-section";

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

type Component = {
  childRecipeId: string;
  childTitle: string;
  childSlug: string;
  scale: number;
  note: string | null;
  ingredients: Ingredient[];
  steps: Step[];
};

export function RecipeContent({
  baseServings,
  servingNoun,
  ingredients,
  components,
}: {
  baseServings: number;
  servingNoun: string;
  ingredients: Ingredient[];
  components: Component[];
}) {
  const [factor, setFactor] = useState(1);

  return (
    <>
      <ScalingControls
        baseServings={baseServings}
        servingNoun={servingNoun}
        ingredients={ingredients}
        factor={factor}
        onFactorChange={setFactor}
      />
      {components.length > 0 && (
        <>
          <Separator className="my-6" />
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Components</h2>
            {components.map((comp) => (
              <ComponentSection
                key={comp.childRecipeId}
                title={comp.childTitle}
                slug={comp.childSlug}
                scale={comp.scale}
                parentScaleFactor={factor}
                note={comp.note}
                ingredients={comp.ingredients}
                steps={comp.steps}
                baseServings={baseServings}
              />
            ))}
          </section>
        </>
      )}
    </>
  );
}
