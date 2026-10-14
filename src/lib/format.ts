import { UNIT_DECIMALS, type Unit } from "./constants";

/**
 * Parses a non-negative decimal string into an integer scaled by 10 ** decimals,
 * without going through floating point ("12.5", 2 -> 1250).
 * Returns NaN if the input isn't a plain decimal or has too many decimal places.
 */
function parseScaledInt(input: unknown, decimals: number): number {
  const text = typeof input === "number" ? String(input) : typeof input === "string" ? input.trim() : "";
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) return NaN;
  const [, whole, fraction = ""] = match;
  if (fraction.length > decimals) return NaN;
  const scaled = Number(whole + fraction.padEnd(decimals, "0"));
  return Number.isSafeInteger(scaled) ? scaled : NaN;
}

/** Integer-scaled value -> plain decimal string, trailing zeros trimmed (1250, 3 -> "1.25"). */
function scaledIntToString(value: number, decimals: number, trimZeros: boolean): string {
  if (decimals === 0) return String(value);
  const sign = value < 0 ? "-" : "";
  const digits = String(Math.abs(value)).padStart(decimals + 1, "0");
  const whole = digits.slice(0, -decimals);
  let fraction = digits.slice(-decimals);
  if (trimZeros) fraction = fraction.replace(/0+$/, "");
  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
}

// ---- Money (paise) ----

/** Form ₹ input -> integer paise ("55.5" -> 5550). NaN if invalid or more than 2 decimals. */
export function rupeesToPaise(input: unknown): number {
  return parseScaledInt(input, 2);
}

/** Paise -> plain ₹ string for prefilling form inputs (5550 -> "55.50"). */
export function paiseToRupeesInput(paise: number): string {
  return scaledIntToString(paise, 2, false);
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Paise -> display string with Indian grouping (12550 -> "₹125.50"). Display only. */
export function formatPaise(paise: number): string {
  return inrFormatter.format(paise / 100);
}

// ---- Quantities (base units) ----

/**
 * Form quantity in display units -> integer base units ("1.25" kg -> 1250 g).
 * NaN if invalid, or if it has more decimals than the unit allows
 * (so pcs/pack/g must be whole numbers).
 */
export function toBaseQty(input: unknown, unit: Unit): number {
  return parseScaledInt(input, UNIT_DECIMALS[unit]);
}

/** Base units -> plain display-unit string for form inputs (1250, "kg" -> "1.25"). */
export function baseQtyToInput(base: number, unit: Unit): string {
  return scaledIntToString(base, UNIT_DECIMALS[unit], true);
}

/** Base units -> display string with unit (1250, "kg" -> "1.25 kg"). Display only. */
export function formatQty(base: number, unit: Unit): string {
  return `${baseQtyToInput(base, unit)} ${unit}`;
}

/** Human-readable hint for what a quantity field accepts. */
export function qtyRuleMessage(unit: Unit): string {
  const decimals = UNIT_DECIMALS[unit];
  return decimals === 0
    ? `Enter a whole number of ${unit}`
    : `Enter a number of ${unit} with up to ${decimals} decimal places`;
}
