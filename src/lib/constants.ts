export const CATEGORIES = [
  "Grains",
  "Pulses",
  "Dairy",
  "Vegetables",
  "Fruits",
  "Snacks",
  "Beverages",
  "Household",
  "Personal Care",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const UNITS = ["kg", "g", "L", "pcs", "pack"] as const;
export type Unit = (typeof UNITS)[number];

export const PAYMENT_MODES = ["Cash", "UPI", "Card"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

/**
 * Quantities are stored as integers in the smallest unit:
 * kg -> grams, L -> ml, g -> g, pcs/pack -> count.
 * UNIT_DECIMALS is how many decimal places a display quantity may have;
 * the base-units-per-display-unit factor is 10 ** UNIT_DECIMALS.
 */
export const UNIT_DECIMALS: Record<Unit, number> = {
  kg: 3,
  L: 3,
  g: 0,
  pcs: 0,
  pack: 0,
};

export function unitFactor(unit: Unit): number {
  return 10 ** UNIT_DECIMALS[unit];
}

export function isUnit(value: string): value is Unit {
  return (UNITS as readonly string[]).includes(value);
}
