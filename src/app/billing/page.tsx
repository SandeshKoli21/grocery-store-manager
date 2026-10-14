import { BillForm, type BillProduct } from "@/components/BillForm";
import { EmptyState, ErrorBox } from "@/components/Feedback";
import { PageHeader } from "@/components/Layout";
import { listProducts } from "@/lib/products";
import type { SearchParams } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function BillingPage({ searchParams }: { searchParams: SearchParams }) {
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
      {products.length === 0 ? (
        <EmptyState message="No products yet. Add products before creating a bill." actionHref="/products/new" actionLabel="Add product" />
      ) : (
        <BillForm products={products} />
      )}
    </div>
  );
}
