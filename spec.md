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
  price (integer paise per display unit), stock and lowStockLevel (integer base units), createdAt
  - category: Grains | Pulses | Dairy | Vegetables | Fruits | Snacks | Beverages | Household | Personal Care
- Bill: id, billNumber (unique, e.g. B-0001), customerName (optional),
  subtotal, discount, total (all integer paise), paymentMode ("Cash" | "UPI" | "Card"), createdAt
- BillItem: id, billId, productId, productName, unit, unitPrice (integer paise),
  quantity (integer base units), lineTotal (integer paise)
  (name, unit and price are copied at billing time so old bills don't change if the product changes)
- Base units: kg → grams, L → ml, g → g, pcs/pack → count. Forms take display units
  (kg/L up to 3 decimals; g/pcs/pack whole numbers) and convert once at the boundary.

## Features
1. Products: add, edit, delete, list, search by name, filter by category
2. Stock: "Add stock" button per product (restocking). Stock is set when a product
   is added; after that it only changes through Add stock and bills (not the edit form)
3. Billing: pick products + quantities → live total → save bill
4. Bills: list of past bills; open one to see a printable bill
5. Dashboard: today's sales total, number of bills today, low-stock list
6. Low stock: stock <= lowStockLevel shows in red everywhere

## Rules
- Cannot bill more quantity than current stock
- Saving a bill reduces stock for every item, in ONE database transaction
  (all items succeed or none do)
- Price and billed/added quantities must be > 0; stock and lowStockLevel must be >= 0
  (0 is allowed when adding a product); pcs/pack quantities must be whole numbers
- Discount cannot exceed subtotal
- Cannot delete a product that appears on any bill (keeps history correct)
- A product's unit cannot change once it appears on any bill. Before that, with stock
  on hand, it may only change to a unit with the same base unit (kg ↔ g, pcs ↔ pack)
- Limits (keep every stored number inside a 32-bit Prisma Int):
  - price ≤ ₹1,00,000 per display unit
  - bill subtotal (and so discount and total) ≤ ₹1,00,00,000
  - stock, lowStockLevel and quantities ≤ 2,147,483,647 base units
  - at most 100 items per bill
- All money (price, unitPrice, lineTotal, subtotal, discount, total) is stored as
  integer paise (₹1 = 100 paise) in the database. Never store or compute money as
  floating-point rupees.
- lineTotal = unitPrice × quantity ÷ base units per display unit, rounded to the
  nearest whole paisa (the only place rounding happens)
- Money is converted to ₹ (2 decimals) only for display, via src/lib/format.ts;
  ₹ input from forms is converted to paise before validation/storage
- Stock and quantities are stored as integer base units, never floating-point

## Out of scope (v1)
- Login/users, GST/tax, suppliers & purchase orders, barcode scanning,
  returns/refunds, online orders, printing to a thermal printer

## v2 backlog
Known issues from the v1 code review, deferred on purpose:
- **Error/success messages come straight from the URL.** `?error=` and `?success=`
  text is shown as written in the address (`src/components/Feedback.tsx`,
  `src/app/products/page.tsx`). React escapes it, so it isn't XSS, but a crafted
  link can show any message inside the app's own red or green box. Fix: pass a
  message code and look the text up from a fixed list.
- **Per-gram prices can't show some real prices.** A `g` product's price is whole
  paise per gram, so ₹425/kg (42.5 paise/g) can't be entered. Fix: store prices for
  `g` products per kg (or per 100 g), or allow fractional-paise unit prices.

## Conventions
- Server Actions for all writes
- Pages in src/app, shared UI in src/components, logic in src/lib
- Business rules (stock check, totals, rounding) live in src/lib/billing.ts
- Errors shown via ?error= message in a red box
- Seed script: ~40 common Indian grocery products across all categories, 3 sample bills

## Definition of done
`npm install && npx prisma migrate dev && npm run seed -- --force && npm run dev`
runs with no errors, all 6 features work at localhost:3003, and:
- billing more than stock is blocked with a clear error
- after a bill, stock goes down by exactly the billed quantity
- a product reaching its low-stock level appears red on the dashboard