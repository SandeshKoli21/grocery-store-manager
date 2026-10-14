import { CATEGORIES, UNITS } from "@/lib/constants";
import { baseQtyToInput, paiseToRupeesInput } from "@/lib/format";
import type { ProductRow } from "@/lib/products";
import { Card } from "./Layout";
import { Field, SelectField } from "./Field";
import { SubmitButton } from "./SubmitButton";
import { LinkButton } from "./Button";

type ProductFormProps = {
  action: (formData: FormData) => Promise<void>;
  product?: ProductRow;
  submitLabel: string;
};

/** Add/edit product form. Prices are entered in ₹, quantities in the selected unit. */
export function ProductForm({ action, product, submitLabel }: ProductFormProps) {
  return (
    <Card>
      <form action={action} className="space-y-4">
        {product && <input type="hidden" name="productId" value={product.id} />}
        <Field label="Name" name="name" required maxLength={100} defaultValue={product?.name} autoComplete="off" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Category" name="category" required defaultValue={product?.category ?? ""}>
            <option value="" disabled>
              Choose a category
            </option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectField>
          <SelectField label="Unit" name="unit" required defaultValue={product?.unit ?? ""}>
            <option value="" disabled>
              Choose a unit
            </option>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </SelectField>
        </div>
        <Field
          label="Price (₹ per unit)"
          name="price"
          required
          inputMode="decimal"
          placeholder="e.g. 55.50"
          hint="Price for 1 kg, 1 L, 1 g, 1 piece or 1 pack, depending on the unit."
          defaultValue={product ? paiseToRupeesInput(product.price) : undefined}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Stock"
            name="stock"
            required
            inputMode="decimal"
            placeholder="e.g. 25"
            hint="In the unit above. kg and L allow up to 3 decimals."
            defaultValue={product ? baseQtyToInput(product.stock, product.unit) : "0"}
          />
          <Field
            label="Low-stock level"
            name="lowStockLevel"
            required
            inputMode="decimal"
            placeholder="e.g. 5"
            hint="Shown in red when stock is at or below this."
            defaultValue={product ? baseQtyToInput(product.lowStockLevel, product.unit) : undefined}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>
          <LinkButton href="/products" variant="secondary">
            Cancel
          </LinkButton>
        </div>
      </form>
    </Card>
  );
}
