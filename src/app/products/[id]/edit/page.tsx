import { notFound } from "next/navigation";
import { deleteProductAction, updateProductAction } from "@/app/actions/products";
import { ErrorBox } from "@/components/Feedback";
import { Card, PageHeader } from "@/components/Layout";
import { ProductForm } from "@/components/ProductForm";
import { SubmitButton } from "@/components/SubmitButton";
import { getProduct, isOnAnyBill } from "@/lib/products";
import { parseId, type SearchParams } from "@/lib/urls";

export const dynamic = "force-dynamic";

type Props = { params: { id: string }; searchParams: SearchParams };

export default async function EditProductPage({ params, searchParams }: Props) {
  const id = parseId(params.id);
  const product = id ? await getProduct(id) : null;
  if (!product) notFound();
  const unitLocked = await isOnAnyBill(product.id);

  return (
    <div className="space-y-4">
      <PageHeader title={`Edit ${product.name}`} />
      <ErrorBox message={searchParams.error} />
      <ProductForm action={updateProductAction} product={product} unitLocked={unitLocked} submitLabel="Save changes" />

      <Card className="space-y-2">
        <h2 className="font-semibold">Delete product</h2>
        <p className="text-sm text-gray-600">Products that appear on a bill can&apos;t be deleted.</p>
        <form action={deleteProductAction}>
          <input type="hidden" name="productId" value={product.id} />
          <SubmitButton variant="danger" pendingText="Deleting…" confirmMessage={`Delete ${product.name}?`}>
            Delete {product.name}
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
