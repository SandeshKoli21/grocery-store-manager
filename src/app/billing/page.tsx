import { BillForm, type BillProduct } from "@/components/BillForm";
import { EmptyState, ErrorBox, SuccessBox } from "@/components/Feedback";
import { PageHeader } from "@/components/Layout";
import { listProducts } from "@/lib/products";
import { getParam, type SearchParams } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: { searchParams: SearchParams }) {
  const saved = getParam(searchParams.saved);
  const products: BillProduct[] = (await listProducts()).map(({ id, name, unit, price, stock, lowStockLevel }) => ({
    id,
    name,
    unit,
    price,
    stock,
    lowStockLevel,
  }));

  return (
    <div className="space-y-4">
      <PageHeader title="New bill" description="Pick products and quantities. The total updates as you go." />
      <ErrorBox message={searchParams.error} />
      {saved && <SuccessBox>Bill {saved} saved and stock updated.</SuccessBox>}
      {products.length === 0 ? (
        <EmptyState message="No products yet. Add products before creating a bill." actionHref="/products/new" actionLabel="Add product" />
      ) : (
        // A new `saved` value remounts the form, which clears the saved draft.
        <BillForm key={saved ?? "draft"} products={products} savedBillNumber={saved} />
      )}
    </div>
  );
}
