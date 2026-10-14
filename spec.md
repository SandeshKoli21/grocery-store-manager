# Project: Grocery Store Manager (v1)

## Goal
A web app for a small kirana/grocery shop owner to manage products and stock,
create customer bills, and see what is running low.

## Tech stack
- Next.js 14 (App Router) + TypeScript (strict)
- Tailwind CSS
- SQLite via Prisma
- zod for validation
- No auth in v1
- Dev server on port 3003

## Data models
- Product: id, name, category, unit ("kg" | "g" | "L" | "pcs" | "pack"),
  price (integer paise per unit), stock (decimal), lowStockLevel, createdAt
  - category: Grains | Pulses | Dairy | Vegetables | Fruits | Snacks | Beverages | Household | Personal Care
- Bill: id, billNumber (unique, e.g. B-0001), customerName (optional),
  subtotal, discount, total (all integer paise), paymentMode ("Cash" | "UPI" | "Card"), createdAt
- BillItem: id, billId, productId, productName, unitPrice (integer paise),
  quantity (decimal), lineTotal (integer paise)
  (name + price are copied at billing time so old bills don't change if prices change)

## Features
1. Products: add, edit, delete, list, search by name, filter by category
2. Stock: "Add stock" button per product (restocking)
3. Billing: pick products + quantities → live total → save bill
4. Bills: list of past bills; open one to see a printable bill
5. Dashboard: today's sales total, number of bills today, low-stock list
6. Low stock: stock <= lowStockLevel shows in red everywhere

## Rules
- Cannot bill more quantity than current stock
- Saving a bill reduces stock for every item, in ONE database transaction
  (all items succeed or none do)
- Prices, stock and quantities must be > 0; pcs/pack quantities must be whole numbers
- Discount cannot exceed subtotal
- Cannot delete a product that appears on any bill (keeps history correct)
- All money (price, unitPrice, lineTotal, subtotal, discount, total) is stored as
  integer paise (₹1 = 100 paise) in the database. Never store or compute money as
  floating-point rupees.
- lineTotal = unitPrice × quantity, rounded to the nearest whole paisa
- Money is converted to ₹ (2 decimals) only for display, via src/lib/format.ts;
  ₹ input from forms is converted to paise before validation/storage
- Stock and quantity may stay decimal

## Out of scope (v1)
- Login/users, GST/tax, suppliers & purchase orders, barcode scanning,
  returns/refunds, online orders, printing to a thermal printer

## Conventions
- Server Actions for all writes
- Pages in src/app, shared UI in src/components, logic in src/lib
- Business rules (stock check, totals, rounding) live in src/lib/billing.ts
- Errors shown via ?error= message in a red box
- Seed script: ~40 common Indian grocery products across all categories, 3 sample bills

## Definition of done
`npm install && npx prisma migrate dev && npm run seed && npm run dev`
runs with no errors, all 6 features work at localhost:3003, and:
- billing more than stock is blocked with a clear error
- after a bill, stock goes down by exactly the billed quantity
- a product reaching its low-stock level appears red on the dashboard