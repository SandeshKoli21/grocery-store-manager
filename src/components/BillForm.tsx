"use client";

import { useEffect, useMemo, useState } from "react";
import { saveBillAction } from "@/app/actions/bills";
import { readDraft, writeDraft } from "@/lib/bill-draft";
import { PAYMENT_MODES, type PaymentMode, type Unit } from "@/lib/constants";
import { computeLineTotalPaise, computeTotals, discountError, isLowStock, stockError } from "@/lib/billing";
import { baseQtyToInput, formatPaise, formatQty, qtyRuleMessage, rupeesToPaise, toBaseQty } from "@/lib/format";
import { Card } from "./Layout";
import { Field, SelectField } from "./Field";
import { SubmitButton } from "./SubmitButton";
import { Button } from "./Button";
import { inputClasses, labelClasses } from "./ui";

export type BillProduct = {
  id: number;
  name: string;
  unit: Unit;
  price: number; // paise per display unit
  stock: number; // base units
  lowStockLevel: number; // base units
};

type CartLine = { productId: number; qtyText: string };

type Props = { products: BillProduct[] };

export function BillForm({ products }: Props) {
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [discountText, setDiscountText] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [pickId, setPickId] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [pickError, setPickError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Restore after mount (not during render) to avoid a hydration mismatch.
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setLines(draft.lines.filter((line) => productsById.has(line.productId)));
      setCustomerName(draft.customerName);
      setDiscountText(draft.discountText);
      setPaymentMode(draft.paymentMode);
    }
    setDraftLoaded(true);
    // Runs once per mount. The bill page clears the draft after a successful save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;
    const empty = lines.length === 0 && customerName === "" && discountText === "";
    writeDraft(empty ? null : { lines, customerName, discountText, paymentMode });
  }, [draftLoaded, lines, customerName, discountText, paymentMode]);

  // ---- Live calculation (same rules the server re-checks) ----
  const rows = lines.flatMap((line) => {
    const product = productsById.get(line.productId);
    if (!product) return [];
    const quantity = toBaseQty(line.qtyText, product.unit);
    let error: string | null = null;
    if (Number.isNaN(quantity)) error = qtyRuleMessage(product.unit);
    else if (quantity <= 0) error = "Quantity must be more than 0";
    else error = stockError(product, quantity);
    const lineTotalPaise = error ? 0 : computeLineTotalPaise(product.price, quantity, product.unit);
    return [{ line, product, quantity, error, lineTotalPaise }];
  });

  const discountPaise = discountText.trim() === "" ? 0 : rupeesToPaise(discountText);
  const totals = computeTotals(
    rows.map((row) => row.lineTotalPaise),
    Number.isNaN(discountPaise) ? 0 : discountPaise,
  );
  const discountProblem = Number.isNaN(discountPaise)
    ? "Enter a valid discount in ₹ (up to 2 decimals)"
    : discountError(totals.subtotalPaise, totals.discountPaise);
  const hasLineErrors = rows.some((row) => row.error);
  const canSave = rows.length > 0 && !hasLineErrors && !discountProblem;
  const itemsJson = JSON.stringify(rows.map((row) => ({ productId: row.product.id, quantity: row.quantity })));

  // ---- Cart editing ----
  function addLine() {
    const product = productsById.get(Number(pickId));
    if (!product) {
      setPickError("Choose a product");
      return;
    }
    const quantity = toBaseQty(pickQty, product.unit);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setPickError(Number.isNaN(quantity) ? qtyRuleMessage(product.unit) : "Quantity must be more than 0");
      return;
    }
    setPickError(null);
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (!existing) return [...current, { productId: product.id, qtyText: pickQty.trim() }];
      // Same product again: add to the existing line instead of creating a duplicate.
      const existingQty = toBaseQty(existing.qtyText, product.unit);
      const merged = Number.isNaN(existingQty) ? quantity : existingQty + quantity;
      return current.map((line) =>
        line.productId === product.id ? { ...line, qtyText: baseQtyToInput(merged, product.unit) } : line,
      );
    });
    setPickId("");
    setPickQty("1");
  }

  function updateQty(productId: number, qtyText: string) {
    setLines((current) => current.map((line) => (line.productId === productId ? { ...line, qtyText } : line)));
  }

  function removeLine(productId: number) {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Add item</h2>
        <div className="grid gap-4 sm:grid-cols-4 sm:items-end">
          <div className="sm:col-span-2">
            <SelectField label="Product" name="pickProduct" value={pickId} onChange={(e) => setPickId(e.target.value)}>
              <option value="">Choose a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                  {p.name}: {formatPaise(p.price)}/{p.unit}, {formatQty(p.stock, p.unit)} left
                  {p.stock <= 0 ? " (out of stock)" : isLowStock(p) ? " ⚠ low stock" : ""}
                </option>
              ))}
            </SelectField>
          </div>
          <Field
            label={`Quantity${productsById.get(Number(pickId)) ? ` (${productsById.get(Number(pickId))?.unit})` : ""}`}
            name="pickQty"
            inputMode="decimal"
            value={pickQty}
            onChange={(e) => setPickQty(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLine();
              }
            }}
          />
          <Button variant="secondary" onClick={addLine}>
            Add to bill
          </Button>
        </div>
        {pickError && (
          <p role="alert" className="text-sm font-medium text-red-700">
            ⚠ {pickError}
          </p>
        )}
      </Card>

      <form action={saveBillAction} className="space-y-4">
        <input type="hidden" name="items" value={itemsJson} />

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold">Items</h2>
          {rows.length === 0 ? (
            <p className="text-gray-600">No items yet. Choose a product above and add it to the bill.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {rows.map(({ product, line, error, lineTotalPaise }) => {
                const qtyId = `qty-${product.id}`;
                return (
                  <li key={product.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatPaise(product.price)}/{product.unit} ·{" "}
                          <span className={isLowStock(product) ? "font-semibold text-red-700" : ""}>
                            {formatQty(product.stock, product.unit)} in stock
                            {isLowStock(product) ? " ⚠ low" : ""}
                          </span>
                        </p>
                      </div>
                      <p className="font-semibold" aria-label={`Line total for ${product.name}`}>
                        {error ? "—" : formatPaise(lineTotalPaise)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="space-y-1">
                        <label htmlFor={qtyId} className={labelClasses}>
                          Quantity ({product.unit})
                        </label>
                        <input
                          id={qtyId}
                          inputMode="decimal"
                          value={line.qtyText}
                          onChange={(e) => updateQty(product.id, e.target.value)}
                          aria-invalid={error ? true : undefined}
                          aria-describedby={error ? `${qtyId}-error` : undefined}
                          className={`${inputClasses} w-32`}
                        />
                      </div>
                      <Button variant="secondary" onClick={() => removeLine(product.id)}>
                        Remove<span className="sr-only"> {product.name}</span>
                      </Button>
                    </div>
                    {error && (
                      <p id={`${qtyId}-error`} role="alert" className="text-sm font-medium text-red-700">
                        ⚠ {error}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Customer name (optional)"
              name="customerName"
              maxLength={100}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoComplete="off"
            />
            <Field
              label="Discount (₹)"
              name="discount"
              inputMode="decimal"
              placeholder="0"
              value={discountText}
              onChange={(e) => setDiscountText(e.target.value)}
              aria-invalid={discountProblem ? true : undefined}
            />
            <SelectField
              label="Payment mode"
              name="paymentMode"
              value={paymentMode}
              onChange={(e) => {
                const mode = PAYMENT_MODES.find((m) => m === e.target.value);
                if (mode) setPaymentMode(mode);
              }}
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </SelectField>
          </div>
          {discountProblem && (
            <p role="alert" className="text-sm font-medium text-red-700">
              ⚠ {discountProblem}
            </p>
          )}

          <dl className="space-y-1 border-t border-gray-200 pt-4" aria-live="polite">
            <div className="flex justify-between">
              <dt className="text-gray-700">Subtotal</dt>
              <dd>{formatPaise(totals.subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-700">Discount</dt>
              <dd>− {formatPaise(totals.discountPaise)}</dd>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <dt>Total</dt>
              <dd data-testid="bill-total">{formatPaise(discountProblem ? totals.subtotalPaise : totals.totalPaise)}</dd>
            </div>
          </dl>

          <SubmitButton pendingText="Saving bill…" disabled={!canSave} className="w-full sm:w-auto">
            Save bill
          </SubmitButton>
          {!canSave && rows.length > 0 && (
            <p className="text-sm text-gray-600">Fix the errors above to save this bill.</p>
          )}
        </Card>
      </form>
    </div>
  );
}
