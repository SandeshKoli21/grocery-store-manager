import { z } from "zod";
import { CATEGORIES, PAYMENT_MODES, UNITS } from "./constants";
import { qtyRuleMessage, rupeesToPaise, toBaseQty } from "./format";

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
    .positive("Price must be more than ₹0"),
);

/** ₹ text -> paise; blank means no discount. */
const discountPaise = z.preprocess(
  (v) => (emptyToUndefined(v) === undefined ? 0 : rupeesToPaise(v)),
  z
    .number({ invalid_type_error: "Enter a valid discount in ₹ (up to 2 decimals)" })
    .int()
    .nonnegative("Discount can't be negative"),
);

/** Quantity text in display units; converted per unit once the unit is known. */
const qtyText = z.string({ required_error: "Required" }).trim().min(1, "Required");

const id = z.coerce.number().int().positive();

// ---- Products ----

export const productSchema = z
  .object({
    name: z.string({ required_error: "Name is required" }).trim().min(1, "Name is required").max(100),
    category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Pick a category" }) }),
    unit: z.enum(UNITS, { errorMap: () => ({ message: "Pick a unit" }) }),
    price: pricePaise,
    stock: qtyText,
    lowStockLevel: qtyText,
  })
  .transform((v, ctx) => {
    const stock = toBaseQty(v.stock, v.unit);
    const lowStockLevel = toBaseQty(v.lowStockLevel, v.unit);
    if (Number.isNaN(stock)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stock"], message: `Stock: ${qtyRuleMessage(v.unit)}` });
    }
    if (Number.isNaN(lowStockLevel)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lowStockLevel"],
        message: `Low-stock level: ${qtyRuleMessage(v.unit)}`,
      });
    }
    if (Number.isNaN(stock) || Number.isNaN(lowStockLevel)) return z.NEVER;
    // toBaseQty only accepts non-negative digits, so stock >= 0 and lowStockLevel >= 0 here.
    return { ...v, stock, lowStockLevel };
  });
export type ProductInput = z.infer<typeof productSchema>;

export const productIdSchema = z.object({ productId: id });

/**
 * Restock. The quantity is converted to base units in billing-server.ts,
 * because the product's unit has to come from the database, not the form.
 */
export const addStockSchema = z.object({
  productId: id,
  quantity: qtyText,
});
export type AddStockInput = z.infer<typeof addStockSchema>;

// ---- Bills ----

/** One cart line. The client converts the quantity to base units with toBaseQty before submitting. */
export const billItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be more than 0"),
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
