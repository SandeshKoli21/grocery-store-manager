// Product reads and writes. Writes that set `stock` run in a transaction.

import type { Product } from "@prisma/client";
import { prisma } from "./db";
import { CATEGORIES, type Category, type Unit } from "./constants";
import { BillingError, toUnit, unitChangeError } from "./billing";
import type { ProductInput, ProductUpdateInput } from "./validation";

export type ProductRow = Omit<Product, "unit"> & { unit: Unit };

function toRow(product: Product): ProductRow {
  return { ...product, unit: toUnit(product.unit) };
}

export function isCategory(value: string | undefined): value is Category {
  return value !== undefined && (CATEGORIES as readonly string[]).includes(value);
}

/** Search by name (case-insensitive for English letters in SQLite) and filter by category. */
export async function listProducts(filters: { q?: string; category?: string } = {}): Promise<ProductRow[]> {
  const q = filters.q?.trim();
  const products = await prisma.product.findMany({
    where: {
      ...(q ? { name: { contains: q } } : {}),
      ...(isCategory(filters.category) ? { category: filters.category } : {}),
    },
    orderBy: { name: "asc" },
  });
  return products.map(toRow);
}

export async function countProducts(): Promise<number> {
  return prisma.product.count();
}

export async function isOnAnyBill(productId: number): Promise<boolean> {
  return (await prisma.billItem.count({ where: { productId } })) > 0;
}

export async function getProduct(id: number): Promise<ProductRow | null> {
  const product = await prisma.product.findUnique({ where: { id } });
  return product ? toRow(product) : null;
}

export async function createProduct(input: ProductInput): Promise<ProductRow> {
  return prisma.$transaction(async (tx) => toRow(await tx.product.create({ data: input })));
}

/** Edits everything except stock, which changes only via Add stock and bills. */
export async function updateProduct(id: number, input: ProductUpdateInput): Promise<ProductRow> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { id }, select: { name: true, unit: true, stock: true } });
    if (!existing) throw new BillingError("Product not found");
    const onAnyBill = (await tx.billItem.count({ where: { productId: id } })) > 0;
    const unitProblem = unitChangeError({ ...existing, unit: toUnit(existing.unit) }, input.unit, onAnyBill);
    if (unitProblem) throw new BillingError(unitProblem);
    return toRow(await tx.product.update({ where: { id }, data: input }));
  });
}

/** Refuses if the product appears on any bill, so old bills stay correct. */
export async function deleteProduct(id: number): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id }, select: { name: true } });
    if (!product) throw new BillingError("Product not found");
    const billLines = await tx.billItem.count({ where: { productId: id } });
    if (billLines > 0) {
      throw new BillingError(
        `Can't delete ${product.name}: it appears on ${billLines} bill line${billLines === 1 ? "" : "s"}. ` +
          "Old bills need it to stay correct.",
      );
    }
    await tx.product.delete({ where: { id } });
    return product.name;
  });
}
