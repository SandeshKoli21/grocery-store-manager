// The unsaved bill (cart) kept in sessionStorage, so it survives an error
// redirect or reload. Per tab, browser-only, never trusted by the server.

import { z } from "zod";
import { PAYMENT_MODES } from "./constants";

const DRAFT_KEY = "grocery-app:bill-draft";

const draftSchema = z.object({
  lines: z.array(z.object({ productId: z.number().int(), qtyText: z.string() })),
  customerName: z.string(),
  discountText: z.string(),
  paymentMode: z.enum(PAYMENT_MODES),
});
export type BillDraft = z.infer<typeof draftSchema>;

export function readDraft(): BillDraft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Saves the draft, or clears it when passed null. */
export function writeDraft(draft: BillDraft | null): void {
  try {
    if (draft) window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage unavailable (private mode etc.): the form still works, just without a draft.
  }
}
