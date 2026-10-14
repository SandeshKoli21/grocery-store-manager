import { z } from "zod";
import { CATEGORIES, MAX_BILL_PAISE, MAX_PRICE_PAISE, MAX_QTY, PAYMENT_MODES, UNITS, type Unit } from "./constants";
import { formatPaise, formatQty, qtyRuleMessage, rupeesToPaise, toBaseQty } from "./format";

// Form values arrive as strings (or are missing). Schemas take
// Object.fromEntries(formData) and output DB-ready values: money in paise,
// quantities in integer base units.

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

/** ₹ text -> paise, then validated as a positive integer. */
const pricePaise = z.preprocess(
  rupeesToPaise,
  z
    .number({ invalid_type_error: "Enter a valid amount in ₹ (up to 2 decimals)" })
    .int()
    .positive("Price must be more than ₹0")
    .max(MAX_PRICE_PAISE, `Price can't be more than ${formatPaise(MAX_PRICE_PAISE)}`),
);

/** ₹ text -> paise; blank means no discount. */
const discountPaise = z.preprocess(
  (v) => (emptyToUndefined(v) === undefined ? 0 : rupeesToPaise(v)),
  z
    .number({ invalid_type_error: "Enter a valid discount in ₹ (up to 2 decimals)" })
    .int()
    .nonnegative("Discount can't be negative")
    .max(MAX_BILL_PAISE, `Discount can't be more than ${formatPaise(MAX_BILL_PAISE)}`),
);

/** Quantity text in display units; converted per unit once the unit is known. */
const qtyText = z.string({ required_error: "Required" }).trim().min(1, "Required");

const id = z.coerce.number().int().positive();

/** Display-quantity text -> base units, or an error message (format, or over MAX_QTY). */
function parseQtyField(text: string, unit: Unit, label: string): number | string {
  const base = toBaseQty(text, unit);
  if (Number.isNaN(base)) return `${label}: ${qtyRuleMessage(unit)}`;
  if (base > MAX_QTY) return `${label} can't be more than ${formatQty(MAX_QTY, unit)}`;
  return base;
}

// ---- Products ----

const productFields = z.object({
  name: z.string({ required_error: "Name is required" }).trim().min(1, "Name is required").max(100),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Pick a category" }) }),
  unit: z.enum(UNITS, { errorMap: () => ({ message: "Pick a unit" }) }),
  price: pricePaise,
  lowStockLevel: qtyText,
});

/** Add product. Opening stock is entered once; after that it changes only via Add stock and bills. */
export const productSchema = productFields
  .extend({ stock: qtyText })
  .transform((v, ctx) => {
    const stock = parseQtyField(v.stock, v.unit, "Stock");
    const lowStockLevel = parseQtyField(v.lowStockLevel, v.unit, "Low-stock level");
    if (typeof stock === "string") ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stock"], message: stock });
    if (typeof lowStockLevel === "string") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lowStockLevel"], message: lowStockLevel });
    }
    if (typeof stock === "string" || typeof lowStockLevel === "string") return z.NEVER;
    // toBaseQty only accepts non-negative digits, so stock >= 0 and lowStockLevel >= 0 here.
    return { ...v, stock, lowStockLevel };
  });
export type ProductInput = z.infer<typeof productSchema>;

/** Edit product. No stock field, so an edit can't overwrite stock changed by a bill meanwhile. */
export const productUpdateSchema = productFields.transform((v, ctx) => {
  const lowStockLevel = parseQtyField(v.lowStockLevel, v.unit, "Low-stock level");
  if (typeof lowStockLevel === "string") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["lowStockLevel"], message: lowStockLevel });
    return z.NEVER;
  }
  return { ...v, lowStockLevel };
});
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const productIdSchema = z.object({ productId: id });

/**
 * Restock. Built per product, because the unit has to come from the database,
 * not the form. Outputs the quantity in base units, plus the unit it was
 * converted with so the write can check the product's unit hasn't changed since.
 */
export function addStockSchema(unit: Unit) {
  return z
    .object({
      productId: id,
      quantity: qtyText.transform((text, ctx) => {
        const base = parseQtyField(text, unit, "Quantity to add");
        if (typeof base === "string" || base === 0) {
          const message = typeof base === "string" ? base : "Quantity to add must be more than 0";
          ctx.addIssue({ code: z.ZodIssueCode.custom, message });
          return z.NEVER;
        }
        return base;
      }),
    })
    .transform((v) => ({ ...v, unit }));
}
export type AddStockInput = z.infer<ReturnType<typeof addStockSchema>>;

// ---- Bills ----

/** One cart line. The client converts the quantity to base units with toBaseQty before submitting. */
export const billItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be more than 0").max(MAX_QTY, "Quantity is too large"),
});
export type BillItemInput = z.infer<typeof billItemSchema>;

export const saveBillSchema = z.object({
  customerName: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  discount: discountPaise,
  paymentMode: z.enum(PAYMENT_MODES, { errorMap: () => ({ message: "Pick a payment mode" }) }),
  items: z
    .string({ required_error: "Add at least one product" })
    .transform((text, ctx): unknown => {
      try {
        return JSON.parse(text);
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bill items could not be read" });
        return z.NEVER;
      }
    })
    .pipe(z.array(billItemSchema).min(1, "Add at least one product")),
});
export type SaveBillInput = z.infer<typeof saveBillSchema>;

/** First error message, for ?error= redirects. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
