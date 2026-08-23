declare module "fractional" {
  class Fraction {
    constructor(value: number);
    numerator: number;
    denominator: number;
    toString(): string;
  }
  export = Fraction;
}
