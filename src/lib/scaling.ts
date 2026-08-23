import Fraction from "fractional";

const KITCHEN_FRACTIONS: [number, string][] = [
  [0.125, "⅛"],
  [0.25, "¼"],
  [0.333, "⅓"],
  [0.375, "⅜"],
  [0.5, "½"],
  [0.625, "⅝"],
  [0.667, "⅔"],
  [0.75, "¾"],
  [0.875, "⅞"],
];

function roundToKitchenPrecision(value: number): number {
  if (value < 1) {
    return Math.round(value * 8) / 8;
  }
  return Math.round(value * 4) / 4;
}

export function scaleQuantity(
  quantity: number | null,
  factor: number,
  scalable: boolean
): number | null {
  if (quantity === null || !scalable) return quantity;
  return roundToKitchenPrecision(quantity * factor);
}

export function formatQuantity(value: number | null): string {
  if (value === null) return "";
  if (value === 0) return "0";

  const whole = Math.floor(value);
  const frac = value - whole;

  if (frac < 0.01) {
    return whole.toString();
  }

  let closest: [number, string] | undefined;
  let closestDist = Infinity;
  for (const entry of KITCHEN_FRACTIONS) {
    const dist = Math.abs(frac - entry[0]);
    if (dist < 0.05 && dist < closestDist) {
      closest = entry;
      closestDist = dist;
    }
  }
  if (closest) {
    return whole > 0 ? `${whole}${closest[1]}` : closest[1];
  }

  try {
    const f = new Fraction(value);
    if (f.denominator <= 8) {
      if (whole > 0 && f.numerator > f.denominator) {
        const remainder = f.numerator % f.denominator;
        if (remainder === 0) return whole.toString();
        return `${whole} ${remainder}/${f.denominator}`;
      }
      return `${f.numerator}/${f.denominator}`;
    }
  } catch {
    // fall through
  }

  return value % 1 === 0 ? value.toString() : value.toFixed(2);
}
