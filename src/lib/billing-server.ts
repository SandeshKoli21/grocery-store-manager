// Database writes that change stock. Every one runs inside prisma.$transaction.
// Server-only: imports the Prisma client. Pure rules live in billing.ts.

import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { isUnit, type Unit } from "./constants";
import { qtyRuleMessage, toBaseQty } from "./format";
import {
  BillingError,
  computeLineTotalPaise,
  computeTotals,
  discountError,
  mergeDuplicateItems,
  nextBillNumber,
  stockError,
} from "./billing";
import type { AddStockInput, SaveBillInput } from "./validation";

function toUnit(value: string): Unit {
  if (!isUnit(value)) throw new BillingError(`Unknown unit "${value}"`);
  return value;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Creates a bill, its items, and decrements stock for every item in ONE transaction.
 * Any BillingError thrown inside rolls back everything. Returns the new bill's id.
 */
export async function createBill(input: SaveBillInput): Promise<number> {
  // Bill numbers are generated inside the transaction; @unique on billNumber is the backstop.
  // If two saves race for the same number, retry once with a fresh number.
  try {
    return await createBillOnce(input);
  } catch (error: unknown) {
    if (!isUniqueViolation(error)) throw error;
    return createBillOnce(input);
  }
}

async function createBillOnce(input: SaveBillInput): Promise<number> {
  const items = mergeDuplicateItems(input.items);

  return prisma.$transaction(async (tx) => {
    // 1. Load products fresh, inside the transaction.
    const products = await tx.product.findMany({
      where: { id: { in: items.map((item) => item.productId) } },
    });
    const productsById = new Map(products.map((p) => [p.id, { ...p, unit: toUnit(p.unit) }]));

    // 2. Check every line against current stock, then build snapshot lines.
    const lines = items.map((item) => {
      const product = productsById.get(item.productId);
      if (!product) throw new BillingError("A product on this bill no longer exists. Please remove it.");
      const error = stockError(product, item.quantity);
      if (error) throw new BillingError(error);
      return {
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        unitPrice: product.price,
        quantity: item.quantity,
        lineTotal: computeLineTotalPaise(product.price, item.quantity, product.unit),
      };
    });

    // 3. Totals in paise, from DB prices (never client prices).
    const totals = computeTotals(
      lines.map((line) => line.lineTotal),
      input.discount,
    );
    const discountProblem = discountError(totals.subtotalPaise, totals.discountPaise);
    if (discountProblem) throw new BillingError(discountProblem);

    // 4. Decrement stock. The `gte` guard re-checks stock atomically in the UPDATE itself,
    //    so a concurrent bill can never push stock below zero.
    for (const line of lines) {
      const { count } = await tx.product.updateMany({
        where: { id: line.productId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      });
      if (count !== 1) {
        throw new BillingError(`Stock for ${line.productName} changed while saving. Please try again.`);
      }
    }

    // 5. Next sequential bill number, then the bill and its items in one nested create.
    const lastBill = await tx.bill.findFirst({ orderBy: { id: "desc" }, select: { billNumber: true } });
    const bill = await tx.bill.create({
      data: {
        billNumber: nextBillNumber(lastBill?.billNumber),
        customerName: input.customerName,
        subtotal: totals.subtotalPaise,
        discount: totals.discountPaise,
        total: totals.totalPaise,
        paymentMode: input.paymentMode,
        items: { create: lines },
      },
      select: { id: true },
    });
    return bill.id;
  });
}

/** Restock: converts the display quantity using the product's unit, then increments stock. */
export async function addStock(input: AddStockInput): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new BillingError("Product not found");
    const unit = toUnit(product.unit);

    const quantity = toBaseQty(input.quantity, unit);
    if (Number.isNaN(quantity)) throw new BillingError(qtyRuleMessage(unit));
    if (quantity <= 0) throw new BillingError("Quantity to add must be more than 0");

    await tx.product.update({
      where: { id: product.id },
      data: { stock: { increment: quantity } },
    });
  });
}
