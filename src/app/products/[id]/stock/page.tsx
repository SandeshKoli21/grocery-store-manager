import { notFound } from "next/navigation";
import { addStockAction } from "@/app/actions/products";
import { LinkButton } from "@/components/Button";
import { ErrorBox, LowStockBadge } from "@/components/Feedback";
import { Field } from "@/components/Field";
import { Card, PageHeader } from "@/components/Layout";
import { SubmitButton } from "@/components/SubmitButton";
import { isLowStock } from "@/lib/billing";
import { formatQty, qtyRuleMessage } from "@/lib/format";
import { getProduct } from "@/lib/products";
import { parseId, type SearchParams } from "@/lib/urls";

export const dynamic = "force-dynamic";

type Props = { params: { id: string }; searchParams: SearchParams };

export default async function AddStockPage({ params, searchParams }: Props) {
  const id = parseId(params.id);
  const product = id ? await getProduct(id) : null;
  if (!product) notFound();
  const low = isLowStock(product);

  return (
    <div className="space-y-4">
      <PageHeader title={`Add stock: ${product.name}`} />
      <ErrorBox message={searchParams.error} />
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-700">Current stock:</span>
          <span className={`font-semibold ${low ? "text-red-700" : ""}`}>{formatQty(product.stock, product.unit)}</span>
          {low && <LowStockBadge />}
        </div>
        <form action={addStockAction} className="space-y-4">
          <input type="hidden" name="productId" value={product.id} />
          <Field
            label={`Quantity to add (${product.unit})`}
            name="quantity"
            required
            inputMode="decimal"
            autoFocus
            hint={qtyRuleMessage(product.unit)}
          />
          <div className="flex flex-wrap gap-2">
            <SubmitButton pendingText="Adding…">Add stock</SubmitButton>
            <LinkButton href="/products" variant="secondary">
              Cancel
            </LinkButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
