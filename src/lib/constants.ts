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

/** The base unit each unit is stored in. Units sharing one can swap without converting stock. */
export const BASE_UNIT: Record<Unit, "g" | "ml" | "count"> = {
  kg: "g",
  g: "g",
  L: "ml",
  pcs: "count",
  pack: "count",
};

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

// ---- Limits ----
// Prisma `Int` columns are 32-bit: a larger value can be written to SQLite but
// then makes every read of that row fail. Keep every stored number inside these.

/** Largest value a Prisma Int column can hold. */
export const MAX_DB_INT = 2_147_483_647;

/** Highest price per display unit: ₹1,00,000. */
export const MAX_PRICE_PAISE = 10_000_000;

/** Highest bill subtotal (and so discount and total): ₹1,00,00,000. */
export const MAX_BILL_PAISE = 1_000_000_000;

/** Highest stock, low-stock level, or billed/added quantity, in base units. */
export const MAX_QTY = MAX_DB_INT;

/** Most lines one bill can have. Keeps a single save transaction small. */
export const MAX_BILL_ITEMS = 100;

/** Longest accepted items JSON: MAX_BILL_ITEMS lines with plenty of room each. */
export const MAX_BILL_ITEMS_JSON_LENGTH = MAX_BILL_ITEMS * 100;

export function unitFactor(unit: Unit): number {
  return 10 ** UNIT_DECIMALS[unit];
}

export function isUnit(value: string): value is Unit {
  return (UNITS as readonly string[]).includes(value);
}
