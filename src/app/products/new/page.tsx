import { createProductAction } from "@/app/actions/products";
import { ErrorBox } from "@/components/Feedback";
import { PageHeader } from "@/components/Layout";
import { ProductForm } from "@/components/ProductForm";
import type { SearchParams } from "@/lib/urls";

export default function NewProductPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="space-y-4">
      <PageHeader title="Add product" />
      <ErrorBox message={searchParams.error} />
      <ProductForm action={createProductAction} submitLabel="Add product" />
    </div>
  );
}
