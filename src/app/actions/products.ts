"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toUserMessage } from "@/lib/billing";
import { addStock } from "@/lib/billing-server";
import { createProduct, deleteProduct, updateProduct } from "@/lib/products";
import {
  addStockSchema,
  firstIssueMessage,
  productIdSchema,
  productSchema,
  productUpdateSchema,
} from "@/lib/validation";
import { withError } from "@/lib/urls";

function revalidateStockPages() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/billing");
}

export async function createProductAction(formData: FormData) {
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(withError("/products/new", firstIssueMessage(parsed.error)));

  let name: string;
  try {
    name = (await createProduct(parsed.data)).name;
  } catch (error: unknown) {
    redirect(withError("/products/new", toUserMessage(error)));
  }
  revalidateStockPages();
  redirect(`/products?success=${encodeURIComponent(`Added ${name}`)}`);
}

export async function updateProductAction(formData: FormData) {
  const idParsed = productIdSchema.safeParse(Object.fromEntries(formData));
  if (!idParsed.success) redirect(withError("/products", "Product not found"));
  const { productId } = idParsed.data;
  const editPath = `/products/${productId}/edit`;

  const parsed = productUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(withError(editPath, firstIssueMessage(parsed.error)));

  let name: string;
  try {
    name = (await updateProduct(productId, parsed.data)).name;
  } catch (error: unknown) {
    redirect(withError(editPath, toUserMessage(error)));
  }
  revalidateStockPages();
  redirect(`/products?success=${encodeURIComponent(`Saved ${name}`)}`);
}

export async function deleteProductAction(formData: FormData) {
  const idParsed = productIdSchema.safeParse(Object.fromEntries(formData));
  if (!idParsed.success) redirect(withError("/products", "Product not found"));
  const { productId } = idParsed.data;

  let name: string;
  try {
    name = await deleteProduct(productId);
  } catch (error: unknown) {
    redirect(withError(`/products/${productId}/edit`, toUserMessage(error)));
  }
  revalidateStockPages();
  redirect(`/products?success=${encodeURIComponent(`Deleted ${name}`)}`);
}

export async function addStockAction(formData: FormData) {
  const parsed = addStockSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const productId = Number(formData.get("productId"));
    const back = Number.isInteger(productId) && productId > 0 ? `/products/${productId}/stock` : "/products";
    redirect(withError(back, firstIssueMessage(parsed.error)));
  }
  const stockPath = `/products/${parsed.data.productId}/stock`;

  try {
    await addStock(parsed.data);
  } catch (error: unknown) {
    redirect(withError(stockPath, toUserMessage(error)));
  }
  revalidateStockPages();
  redirect(`/products?success=${encodeURIComponent("Stock updated")}`);
}
