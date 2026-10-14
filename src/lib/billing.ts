// Pure billing rules: no database access, so client components (the live bill
// total) can import this too. Transactional writes live in billing-server.ts.
//
// Money is integer paise. Quantities are integer base units (g, ml, count).

import { isUnit, MAX_BILL_PAISE, unitFactor, type Unit } from "./constants";
import { formatPaise, formatQty } from "./format";
import type { BillItemInput } from "./validation";

/** A user-facing rule violation. Its message is safe to show in the ErrorBox. */
export class BillingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingError";
  }
}

/** Message for ?error=: BillingError text as-is, anything else logged and replaced. */
export function toUserMessage(error: unknown): string {
  if (error instanceof BillingError) return error.message;
  console.error(error);
  return "Something went wrong. Please try again.";
}

/** Narrows a unit string from the database. */
export function toUnit(value: string): Unit {
  if (!isUnit(value)) throw new BillingError(`Unknown unit "${value}"`);
  return value;
}

/**
 * Line total in paise. `unitPricePaise` is per display unit (per kg, per L, per piece),
 * `quantity` is in base units. This is the ONLY place money is rounded.
 *
 * Uses BigInt so `unitPricePaise * quantity` can't lose precision past 2^53;
 * rounds half up, like Math.round for these non-negative values.
 * An oversized result is caught by subtotalError.
 */
export function computeLineTotalPaise(unitPricePaise: number, quantity: number, unit: Unit): number {
  const factor = BigInt(unitFactor(unit));
  const doubled = BigInt(2) * BigInt(unitPricePaise) * BigInt(quantity);
  return Number((doubled + factor) / (BigInt(2) * factor));
}

export type BillTotals = { subtotalPaise: number; discountPaise: number; totalPaise: number };

/** Plain integer sums. Call discountError first; this does not clamp. */
export function computeTotals(lineTotalsPaise: readonly number[], discountPaise: number): BillTotals {
  const subtotalPaise = lineTotalsPaise.reduce((sum, line) => sum + line, 0);
  return { subtotalPaise, discountPaise, totalPaise: subtotalPaise - discountPaise };
}

export function discountError(subtotalPaise: number, discountPaise: number): string | null {
  return discountPaise > subtotalPaise
    ? `Discount (${formatPaise(discountPaise)}) can't be more than the subtotal (${formatPaise(subtotalPaise)})`
    : null;
}

export function subtotalError(subtotalPaise: number): string | null {
  return subtotalPaise > MAX_BILL_PAISE
    ? `Bill subtotal (${formatPaise(subtotalPaise)}) can't be more than ${formatPaise(MAX_BILL_PAISE)}`
    : null;
}

type StockInfo ={ name: string; unit: Unit; stock: number };

export function stockError(product: StockInfo, quantity: number): string | null {
  return quantity > product.stock
    ? `Not enough stock for ${product.name}: only ${formatQty(product.stock, product.unit)} left, ` +
        `you tried to bill ${formatQty(quantity, product.unit)}`
    : null;
}

export function isLowStock(product: { stock: number; lowStockLevel: number }): boolean {
  return product.stock <= product.lowStockLevel;
}

/** Combines lines for the same product, so stock is checked against the total quantity. */
export function mergeDuplicateItems(items: readonly BillItemInput[]): BillItemInput[] {
  const byProduct = new Map<number, number>();
  for (const item of items) {
    byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + item.quantity);
  }
  return Array.from(byProduct, ([productId, quantity]) => ({ productId, quantity }));
}

/** "B-0007" -> "B-0008"; no previous bill -> "B-0001". Grows past 4 digits after B-9999. */
export function nextBillNumber(lastBillNumber: string | null | undefined): string {
  const match = lastBillNumber ? /^B-(\d+)$/.exec(lastBillNumber) : null;
  const next = match ? Number(match[1]) + 1 : 1;
  return `B-${String(next).padStart(4, "0")}`;
}
