"use client";

import { useEffect } from "react";
import { writeDraft } from "@/lib/bill-draft";
import { Button } from "./Button";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      Print bill
    </Button>
  );
}

/** Rendered after a successful save: the cart draft is no longer needed. */
export function ClearBillDraft() {
  useEffect(() => writeDraft(null), []);
  return null;
}
