// Bill and dashboard reads.

import type { Bill, BillItem } from "@prisma/client";
import { prisma } from "./db";
import { toUnit } from "./billing";
import { istDayRange } from "./dates";
import type { Unit } from "./constants";
import type { ProductRow } from "./products";

export type BillListRow = Bill & { itemCount: number };

/** Search by bill number or customer name (case-insensitive for English letters in SQLite). */
export async function listBills(filters: { q?: string } = {}): Promise<BillListRow[]> {
  const q = filters.q?.trim();
  const bills = await prisma.bill.findMany({
    where: q ? { OR: [{ billNumber: { contains: q } }, { customerName: { contains: q } }] } : {},
    orderBy: { id: "desc" },
    include: { _count: { select: { items: true } } },
  });
  return bills.map(({ _count, ...bill }) => ({ ...bill, itemCount: _count.items }));
}

export async function countBills(): Promise<number> {
  return prisma.bill.count();
}

export type BillItemRow = Omit<BillItem, "unit"> & { unit: Unit };
export type BillDetail = Bill & { items: BillItemRow[] };

export async function getBill(id: number): Promise<BillDetail | null> {
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } } },
  });
  if (!bill) return null;
  return { ...bill, items: bill.items.map((item) => ({ ...item, unit: toUnit(item.unit) })) };
}

export type DashboardData = {
  todaySalesPaise: number;
  todayBillCount: number;
  lowStock: ProductRow[];
};

export async function getDashboardData(now: Date = new Date()): Promise<DashboardData> {
  const { start, end } = istDayRange(now);
  const [today, lowStock] = await Promise.all([
    prisma.bill.aggregate({
      where: { createdAt: { gte: start, lt: end } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    // Low stock: stock <= lowStockLevel (column-to-column comparison).
    prisma.product.findMany({
      where: { stock: { lte: prisma.product.fields.lowStockLevel } },
      orderBy: { name: "asc" },
    }),
  ]);
  return {
    todaySalesPaise: today._sum.total ?? 0,
    todayBillCount: today._count._all,
    lowStock: lowStock.map((product) => ({ ...product, unit: toUnit(product.unit) })),
  };
}
