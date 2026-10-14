// Seeds ~40 hand-picked Indian grocery products, a generated catalog of ~1450
// more (prisma/catalog.ts), and 3 sample bills.
// DESTRUCTIVE: it deletes ALL existing bills and products first, so it refuses
// to run without --force (`npm run seed -- --force`).
//
// Products go through the same zod schema as the Add product form (₹ and
// display quantities in, paise and base units out). Bills go through
// createBill, so they decrement stock exactly like a real bill.

import { prisma } from "../src/lib/db";
import { createBill } from "../src/lib/billing-server";
import { createProduct } from "../src/lib/products";
import { productSchema, saveBillSchema } from "../src/lib/validation";
import { formatPaise } from "../src/lib/format";
import { buildCatalog } from "./catalog";

// [name, category, unit, price ₹ per unit, stock, low-stock level]
type SeedProduct = [string, string, string, string, string, string];

const PRODUCTS: SeedProduct[] = [
  // Grains
  ["Basmati Rice", "Grains", "kg", "95.50", "50", "10"],
  ["Sona Masoori Rice", "Grains", "kg", "62", "40", "10"],
  ["Aashirvaad Atta", "Grains", "kg", "48", "60", "15"],
  ["Poha", "Grains", "kg", "60", "12", "3"],
  ["Sooji (Rava)", "Grains", "kg", "52", "8", "2"],
  ["Sugar", "Grains", "kg", "44", "45", "10"],
  // Pulses
  ["Toor Dal", "Pulses", "kg", "165", "25", "5"],
  ["Moong Dal", "Pulses", "kg", "140", "15", "4"],
  ["Chana Dal", "Pulses", "kg", "105", "18", "4"],
  ["Masoor Dal", "Pulses", "kg", "115", "10", "3"],
  ["Urad Dal", "Pulses", "kg", "150", "2", "5"], // low stock
  ["Rajma", "Pulses", "kg", "160", "6", "2"],
  // Dairy
  ["Toned Milk", "Dairy", "L", "56", "30", "8"],
  ["Paneer", "Dairy", "g", "0.42", "600", "500"], // ends up low after a bill
  ["Amul Butter 100g", "Dairy", "pack", "58", "20", "5"],
  ["Curd 400g", "Dairy", "pack", "35", "15", "4"],
  ["Desi Ghee", "Dairy", "L", "650", "1.5", "2"], // low stock
  // Vegetables
  ["Onion", "Vegetables", "kg", "40", "40", "10"],
  ["Potato", "Vegetables", "kg", "30", "50", "10"],
  ["Tomato", "Vegetables", "kg", "35", "20", "5"],
  ["Green Chilli", "Vegetables", "kg", "80", "2", "0.5"],
  ["Coriander Bunch", "Vegetables", "pcs", "10", "25", "5"],
  ["Ginger", "Vegetables", "kg", "120", "3", "1"],
  // Fruits
  ["Banana", "Fruits", "pcs", "6", "120", "24"],
  ["Apple (Shimla)", "Fruits", "kg", "180", "15", "3"],
  ["Orange (Nagpur)", "Fruits", "kg", "90", "12", "3"],
  ["Pomegranate", "Fruits", "kg", "160", "8", "2"],
  // Snacks
  ["Parle-G Biscuits", "Snacks", "pack", "10", "100", "20"],
  ["Haldiram's Aloo Bhujia", "Snacks", "pack", "55", "30", "8"],
  ["Maggi Noodles", "Snacks", "pack", "14", "8", "20"], // low stock
  ["Lay's Classic Salted", "Snacks", "pack", "20", "40", "10"],
  ["Britannia Good Day", "Snacks", "pack", "30", "35", "8"],
  // Beverages
  ["Tata Tea Gold 500g", "Beverages", "pack", "285", "12", "3"],
  ["Bru Instant Coffee", "Beverages", "pack", "150", "10", "3"],
  ["Coca-Cola 750ml", "Beverages", "pcs", "40", "24", "6"],
  ["Frooti", "Beverages", "pcs", "10", "60", "12"],
  // Household
  ["Surf Excel 1kg", "Household", "pack", "140", "15", "4"],
  ["Vim Bar", "Household", "pcs", "10", "40", "10"],
  ["Harpic 500ml", "Household", "pcs", "99", "2", "3"], // low stock
  ["Agarbatti", "Household", "pack", "45", "20", "5"],
  // Personal Care
  ["Lux Soap", "Personal Care", "pcs", "38", "30", "8"],
  ["Colgate Toothpaste", "Personal Care", "pcs", "95", "20", "5"],
  ["Parachute Coconut Oil", "Personal Care", "pcs", "105", "15", "4"],
  ["Dettol Handwash", "Personal Care", "pcs", "99", "10", "3"],
];

// [customer, payment mode, discount ₹, [product name, quantity in base units (g, ml, count)][]]
type SeedBill = [string, string, string, [string, number][]];

const BILLS: SeedBill[] = [
  ["", "Cash", "", [["Basmati Rice", 5000], ["Toor Dal", 1000], ["Parle-G Biscuits", 4]]],
  ["Priya Sharma", "UPI", "5", [["Toned Milk", 2000], ["Paneer", 250], ["Tomato", 1500], ["Onion", 2000]]],
  ["Ramesh Patil", "Card", "20", [["Surf Excel 1kg", 1], ["Lux Soap", 3], ["Colgate Toothpaste", 2], ["Tata Tea Gold 500g", 1]]],
];

async function main() {
  if (!process.argv.includes("--force")) {
    console.error(
      "Refusing to seed: this deletes ALL products and bills.\n" +
        "If that's what you want, run: npm run seed -- --force",
    );
    process.exitCode = 1;
    return;
  }

  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.product.deleteMany();

  const idsByName = new Map<string, number>();
  const catalog = [...PRODUCTS, ...buildCatalog(PRODUCTS.map(([name]) => name))];
  for (const [name, category, unit, price, stock, lowStockLevel] of catalog) {
    const data = productSchema.parse({ name, category, unit, price, stock, lowStockLevel });
    const product = await createProduct(data);
    idsByName.set(name, product.id);
  }
  console.log(`Created ${catalog.length} products`);

  for (const [customerName, paymentMode, discount, lines] of BILLS) {
    const items = lines.map(([name, quantity]) => {
      const productId = idsByName.get(name);
      if (!productId) throw new Error(`Seed bill references unknown product "${name}"`);
      return { productId, quantity };
    });
    const input = saveBillSchema.parse({ customerName, paymentMode, discount, items: JSON.stringify(items) });
    const { id, billNumber } = await createBill(input);
    const bill = await prisma.bill.findUniqueOrThrow({ where: { id } });
    console.log(`Created bill ${billNumber}: ${formatPaise(bill.total)}`);
  }

  const lowStock = await prisma.product.count({
    where: { stock: { lte: prisma.product.fields.lowStockLevel } },
  });
  console.log(`${lowStock} products are at or below their low-stock level`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
